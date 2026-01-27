<script lang="ts">
  import { onMount } from 'svelte';
  import type { Reaction, SelectedFeature } from '../../types/turn-prep.types';
  import { FoundryAdapter } from '../../foundry/FoundryAdapter';
  import { TurnPrepApiInstance as api } from '../../api/TurnPrepApi';
  import TurnPlanFeatureTable, { type DisplayFeature } from './TurnPlanFeatureTable.svelte';
  import { AUTO_SAVE_DEBOUNCE_MS, FLAG_SCOPE, FLAG_KEY_DATA } from '../../constants';
  import { createEmptyTurnPrepData } from '../../utils/data';
  import {
    buildDisplayFeatureList,
    cloneSelectedFeatureArray,
    mergeSelectedFeatureArrays
  } from './featureDisplay.helpers';

  let { actor }: { actor: any } = $props();

  let reactions: Reaction[] = $state([]);
  let loading = $state(true);
  let initialized = $state(false);
  let collapsed = $state(false);
  let notesCollapsed = $state<Record<string, boolean>>({});

  let saveTimeout: number | null = null;
  const hookCleanups: Array<() => void> = [];

  onMount(() => {
    loadReactions(true);

    registerHook('updateActor', onActorUpdated);
    registerHook('updateItem', onItemChanged);
    registerHook('deleteItem', onItemChanged);

    return () => {
      cleanupHooks();
      cancelPendingSave(true);
    };
  });

  $effect(() => {
    const nextState: Record<string, boolean> = {};
    let changed = false;

    for (const reaction of reactions) {
      const existing = notesCollapsed[reaction.id];
      const value = existing ?? true;
      nextState[reaction.id] = value;
      if (existing === undefined) {
        changed = true;
      }
    }

    if (Object.keys(notesCollapsed).length !== Object.keys(nextState).length) {
      changed = true;
    }

    if (changed) {
      notesCollapsed = nextState;
    }
  });

  function registerHook(hookName: string, handler: (...args: any[]) => void) {
    if (typeof Hooks === 'undefined') return;
    Hooks.on(hookName, handler);
    hookCleanups.push(() => Hooks.off(hookName, handler));
  }

  function cleanupHooks() {
    while (hookCleanups.length) {
      const dispose = hookCleanups.pop();
      dispose?.();
    }
  }

  function hasTurnPrepFlagChange(changes: any): boolean {
    const flagChanges = changes?.flags;
    if (!flagChanges) return false;
    const scopeChanges = flagChanges[FLAG_SCOPE];
    if (!scopeChanges) return false;
    return Object.prototype.hasOwnProperty.call(scopeChanges, FLAG_KEY_DATA);
  }

  function onActorUpdated(updatedActor: any, changes: any) {
    if (!actor || updatedActor?.id !== actor.id) return;
    if (hasTurnPrepFlagChange(changes)) {
      loadReactions();
    }
  }

  function onItemChanged(item: any) {
    if (!actor || !item?.actor || item.actor.id !== actor.id) return;
    touchReactions();
  }

  function touchReactions() {
    reactions = reactions.map((reaction) => ({ ...reaction }));
  }

  function loadReactions(showSpinner = false) {
    if (!actor) {
      reactions = [];
      loading = false;
      initialized = true;
      return;
    }

    if (showSpinner) {
      loading = true;
    }

    try {
      const turnPrepData = api.getTurnPrepData(actor);
      reactions = hydrateReactions(turnPrepData?.reactions ?? []);
    } catch (error) {
      console.error('[ReactionPlansPanel] Failed to load reactions:', error);
      reactions = [];
      ui.notifications?.error(FoundryAdapter.localize('TURN_PREP.Reactions.SaveError'));
    } finally {
      loading = false;
      initialized = true;
    }
  }

  function hydrateReactions(rawReactions: Reaction[]): Reaction[] {
    return rawReactions.map((reaction) => sanitizeReaction(reaction));
  }

  function sanitizeReaction(rawReaction: any): Reaction {
    const reactionsLabel = FoundryAdapter.localize('TURN_PREP.Reactions.ReactionLabel') || 'Reaction';
    const reactionFeatures = mergeSelectedFeatureArrays(rawReaction?.reactionFeatures, rawReaction?.feature);
    const additionalFeatures = cloneSelectedFeatureArray(rawReaction?.additionalFeatures ?? []);

    return {
      id: rawReaction?.id ?? foundry.utils.randomID(),
      name: typeof rawReaction?.name === 'string'
        ? rawReaction.name
        : reactionsLabel,
      trigger: typeof rawReaction?.trigger === 'string' ? rawReaction.trigger : '',
      reactionFeatures,
      additionalFeatures,
      notes: typeof rawReaction?.notes === 'string' ? rawReaction.notes : '',
      createdTime: typeof rawReaction?.createdTime === 'number' ? rawReaction.createdTime : Date.now(),
      isFavorite: !!rawReaction?.isFavorite,
    };
  }

  function isNotesCollapsed(reactionId: string): boolean {
    return notesCollapsed[reactionId] ?? true;
  }

  function toggleNotes(reactionId: string) {
    notesCollapsed = {
      ...notesCollapsed,
      [reactionId]: !isNotesCollapsed(reactionId)
    };
  }

  function cancelPendingSave(flush = false) {
    const pending = !!saveTimeout;
    if (saveTimeout) {
      window.clearTimeout(saveTimeout);
      saveTimeout = null;
    }
    if (flush && pending) {
      void saveReactions();
    }
  }

  function scheduleAutoSave() {
    if (!initialized) return;
    if (saveTimeout) {
      window.clearTimeout(saveTimeout);
    }
    saveTimeout = window.setTimeout(() => {
      saveTimeout = null;
      void saveReactions();
    }, AUTO_SAVE_DEBOUNCE_MS);
  }

  function createNewReaction() {
    const newReaction: Reaction = {
      id: foundry.utils.randomID(),
      name: '',
      trigger: '',
      reactionFeatures: [],
      additionalFeatures: [],
      notes: '',
      createdTime: Date.now(),
      isFavorite: false
    };

    reactions = [...reactions, newReaction];
    notesCollapsed = { ...notesCollapsed, [newReaction.id]: true };
    void saveReactions();
  }

  function getReactionFeatures(reaction: Reaction): DisplayFeature[] {
    const features: SelectedFeature[] = Array.isArray(reaction.reactionFeatures)
      ? reaction.reactionFeatures
      : [];
    return buildDisplayFeatureList(actor, reaction.id, features, 'reaction-primary');
  }

  function getAdditionalFeatures(reaction: Reaction): DisplayFeature[] {
    const extras: SelectedFeature[] = Array.isArray(reaction.additionalFeatures)
      ? reaction.additionalFeatures
      : [];
    return buildDisplayFeatureList(actor, reaction.id, extras, 'reaction-additional');
  }

  function handleRemoveFeature(
    reactionId: string,
    target: 'reaction' | 'additional',
    featureId: string
  ) {
    const index = reactions.findIndex((reaction) => reaction.id === reactionId);
    if (index === -1) return;

    const updated = [...reactions];
    const reaction = {
      ...updated[index],
      reactionFeatures: [...(updated[index].reactionFeatures ?? [])],
      additionalFeatures: [...(updated[index].additionalFeatures ?? [])]
    };

    if (target === 'reaction') {
      reaction.reactionFeatures = reaction.reactionFeatures.filter((feature) => feature.itemId !== featureId);
    } else {
      reaction.additionalFeatures = reaction.additionalFeatures.filter((feature) => feature.itemId !== featureId);
    }

    updated[index] = reaction;
    reactions = updated;
    void saveReactions();
  }

  async function deleteReaction(id: string) {
    const confirmed = await (window as any).foundry.applications.api.DialogV2.confirm({
      window: { title: FoundryAdapter.localize('TURN_PREP.Reactions.DeleteConfirm') },
      content: `<p>${FoundryAdapter.localize('TURN_PREP.Reactions.DeleteConfirmMessage')}</p>`
    });

    if (!confirmed) return;

    reactions = reactions.filter((reaction) => reaction.id !== id);
    const { [id]: _removed, ...remaining } = notesCollapsed;
    notesCollapsed = remaining;
    void saveReactions();
  }

  async function saveReactions() {
    if (!actor) return;
    try {
      const turnPrepData = api.getTurnPrepData(actor) ?? createEmptyTurnPrepData();
      turnPrepData.reactions = reactions.map((reaction) => sanitizeReaction(reaction));
      await api.saveTurnPrepData(actor, turnPrepData);
    } catch (error) {
      console.error('[ReactionPlansPanel] Failed to save reactions:', error);
      ui.notifications?.error(FoundryAdapter.localize('TURN_PREP.Reactions.SaveError'));
    }
  }
</script>

{#if loading}
  <div class="reaction-plans-loading">
    <p>{FoundryAdapter.localize('TURN_PREP.Common.Loading')}</p>
  </div>
{:else}
  <div class="reaction-plans-panel">
    <div class="turn-prep-panel-header">
      <button
        type="button"
        class="turn-prep-panel-toggle"
        title={collapsed ? 'Expand' : 'Collapse'}
        onclick={() => collapsed = !collapsed}
      >
        <i class="fas fa-chevron-{collapsed ? 'right' : 'down'}"></i>
      </button>
      <h3>{FoundryAdapter.localize('TURN_PREP.Reactions.Title')}</h3>
      <button
        type="button"
        class="turn-prep-panel-action-btn"
        onclick={createNewReaction}
      >
        <i class="fas fa-plus"></i>
        {FoundryAdapter.localize('TURN_PREP.Reactions.NewReaction')}
      </button>
    </div>

    {#if !collapsed}
      {#if reactions.length === 0}
        <div class="reaction-plans-empty">
          <p>{FoundryAdapter.localize('TURN_PREP.Reactions.NoReactions')}</p>
        </div>
      {:else}
        <div class="reaction-plans-list">
          {#each reactions as reaction (reaction.id)}
            <div class="reaction-card">
              <div class="reaction-header">
                <div class="reaction-name-row">
                  <label
                    class="reaction-trigger-label"
                    for={"reaction-name-" + reaction.id}
                  >
                    {FoundryAdapter.localize('TURN_PREP.Reactions.Trigger')}
                  </label>
                  <input
                    id={"reaction-name-" + reaction.id}
                    type="text"
                    class="reaction-name"
                    bind:value={reaction.name}
                    placeholder={FoundryAdapter.localize('TURN_PREP.Reactions.TriggerPlaceholder')}
                    oninput={scheduleAutoSave}
                  />
                </div>
                <button
                  type="button"
                  class="delete-reaction-button"
                  onclick={() => deleteReaction(reaction.id)}
                  title={FoundryAdapter.localize('TURN_PREP.Reactions.DeleteTooltip')}
                >
                  <i class="fas fa-trash"></i>
                </button>
              </div>

              <div class="reaction-content">

                <TurnPlanFeatureTable
                  tableKey={`reaction-${reaction.id}`}
                  title={FoundryAdapter.localize('TURN_PREP.Reactions.ReactionFeatures')}
                  actor={actor}
                  features={getReactionFeatures(reaction)}
                  onRemoveFeature={(featureId) => handleRemoveFeature(reaction.id, 'reaction', featureId)}
                />

                <TurnPlanFeatureTable
                  tableKey={`reaction-additional-${reaction.id}`}
                  title={FoundryAdapter.localize('TURN_PREP.Reactions.AdditionalFeatures')}
                  actor={actor}
                  features={getAdditionalFeatures(reaction)}
                  onRemoveFeature={(featureId) => handleRemoveFeature(reaction.id, 'additional', featureId)}
                />

                <div class="reaction-notes">
                  <button
                    type="button"
                    class="notes-toggle"
                    onclick={() => toggleNotes(reaction.id)}
                  >
                    <i class="fas fa-chevron-{isNotesCollapsed(reaction.id) ? 'right' : 'down'}"></i>
                    <span>{FoundryAdapter.localize('TURN_PREP.Reactions.Notes')}</span>
                  </button>
                  {#if !isNotesCollapsed(reaction.id)}
                    <textarea
                      class="notes-input"
                      bind:value={reaction.notes}
                      placeholder={FoundryAdapter.localize('TURN_PREP.Reactions.NotesPlaceholder')}
                      rows="3"
                      oninput={scheduleAutoSave}
                    ></textarea>
                  {/if}
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    {/if}
  </div>
{/if}

<style lang="less">
  .reaction-plans-panel {
    padding: 1rem;
  }

  .reaction-plans-panel :global(.turn-prep-panel-action-btn) {
    margin-left: auto;
  }

  .reaction-plans-empty {
    text-align: center;
    padding: 2rem;
    color: var(--t5e-tertiary-color);
  }

  .reaction-plans-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .reaction-card {
    background: var(--t5e-sheet-background);
    border: 1px solid var(--t5e-faint-color);
    border-radius: 4px;
    padding: 1rem;

    .reaction-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;

      .reaction-name-row {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .reaction-trigger-label {
        white-space: nowrap;
        font-weight: 600;
        font-size: 0.9rem;
        color: var(--t5e-primary-color);
      }

      .reaction-name {
        flex: 1;
        font-size: 0.95rem;
        font-weight: 500;
        padding: 0.45rem 0.6rem;
        border: 1px solid var(--t5e-faint-color);
        border-radius: 4px;

        &:focus {
          outline: none;
          border-color: var(--t5e-primary-accent-color);
        }
      }

      .delete-reaction-button {
        padding: 0.5rem;
        background: transparent;
        border: none;
        color: var(--t5e-warning-accent-color);
        cursor: pointer;
        font-size: 1.1rem;

        &:hover {
          color: var(--t5e-warning-accent-hover-color);
        }
      }
    }

    .reaction-content {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;

      .reaction-notes {
        border: 1px solid var(--t5e-faint-color);
        border-radius: 4px;
        padding: 0.5rem 0.75rem;
        background: var(--t5e-panel-muted-bg, rgba(0, 0, 0, 0.03));

        .notes-toggle {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.25rem 0;
          background: none;
          border: none;
          font: inherit;
          color: inherit;
          cursor: pointer;
          text-align: left;

          i {
            font-size: 0.9rem;
          }
        }

        .notes-input {
          margin-top: 0.5rem;
          width: 100%;
          padding: 0.5rem;
          border: 1px solid var(--t5e-faint-color);
          border-radius: 4px;
          font-family: inherit;
          font-size: 0.9rem;
          resize: vertical;

          &:focus {
            outline: none;
            border-color: var(--t5e-primary-accent-color);
          }
        }
      }
    }
  }

  .reaction-plans-loading {
    text-align: center;
    padding: 2rem;
  }
</style>
