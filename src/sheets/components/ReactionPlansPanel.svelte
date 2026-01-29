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
  import ContextMenuHost from './context-menu/ContextMenuHost.svelte';
  import { ContextMenuController } from '../../features/context-menu/ContextMenuController';
  import type { ContextMenuAction, ContextMenuSection } from '../../features/context-menu/context-menu.types';

  let { actor }: { actor: any } = $props();

  let reactions: Reaction[] = $state([]);
  let loading = $state(true);
  let initialized = $state(false);
  let collapsed = $state(false);
  let notesCollapsed = $state<Record<string, boolean>>({});
  let reactionCollapseState = $state<Record<string, boolean>>({});
  const reactionContextMenuController = new ContextMenuController('reaction-plans-panel');
  let activeContextReactionId = $state<string | null>(null);

  let saveTimeout: number | null = null;
  const hookCleanups: Array<() => void> = [];

  onMount(() => {
    loadReactions(true);

    registerHook('updateActor', onActorUpdated);
    registerHook('updateItem', onItemChanged);
    registerHook('deleteItem', onItemChanged);

    const unsubscribe = reactionContextMenuController.subscribe((state) => {
      const contextReactionId = state?.context?.reactionId;
      activeContextReactionId = typeof contextReactionId === 'string' ? contextReactionId : null;
    });

    return () => {
      cleanupHooks();
      cancelPendingSave(true);
      unsubscribe();
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

  $effect(() => {
    const nextState: Record<string, boolean> = {};
    let changed = false;

    for (const reaction of reactions) {
      const existing = reactionCollapseState[reaction.id];
      const value = existing ?? false;
      nextState[reaction.id] = value;
      if (existing === undefined) {
        changed = true;
      }
    }

    if (Object.keys(reactionCollapseState).length !== Object.keys(nextState).length) {
      changed = true;
    }

    if (changed) {
      reactionCollapseState = nextState;
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

  function isReactionCollapsed(reactionId: string): boolean {
    return !!reactionCollapseState[reactionId];
  }

  function toggleReactionCollapsed(reactionId: string) {
    reactionCollapseState = {
      ...reactionCollapseState,
      [reactionId]: !isReactionCollapsed(reactionId)
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

  function duplicateReaction(reactionId: string) {
    const sourceIndex = reactions.findIndex((reaction) => reaction.id === reactionId);
    if (sourceIndex === -1) return;

    const source = reactions[sourceIndex];
    const copySuffix = FoundryAdapter.localize('TURN_PREP.Common.CopySuffix') ?? '(Copy)';
    const clone: Reaction = {
      ...source,
      id: foundry.utils.randomID(),
      name: `${source.name || FoundryAdapter.localize('TURN_PREP.Reactions.ReactionLabel')} ${copySuffix}`.trim(),
      reactionFeatures: cloneSelectedFeatureArray(source.reactionFeatures),
      additionalFeatures: cloneSelectedFeatureArray(source.additionalFeatures),
      createdTime: Date.now(),
    };

    reactions = [
      ...reactions.slice(0, sourceIndex + 1),
      clone,
      ...reactions.slice(sourceIndex + 1)
    ];
    notesCollapsed = { ...notesCollapsed, [clone.id]: notesCollapsed[source.id] ?? true };
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

  function getReactionContextMenuActions(reaction: Reaction): ContextMenuAction[] {
    return [
      {
        id: 'duplicate',
        label: FoundryAdapter.localize('TURN_PREP.Reactions.ContextMenu.Duplicate'),
        icon: 'fa-regular fa-copy',
        onSelect: () => duplicateReaction(reaction.id)
      },
      {
        id: 'delete',
        label: FoundryAdapter.localize('TURN_PREP.Reactions.ContextMenu.Delete'),
        icon: 'fa-regular fa-trash-can',
        variant: 'destructive',
        onSelect: () => void deleteReaction(reaction.id)
      }
    ];
  }

  function buildReactionContextMenuSections(reaction: Reaction): ContextMenuSection[] {
    return [
      {
        id: `reaction-menu-${reaction.id}`,
        actions: getReactionContextMenuActions(reaction)
      }
    ];
  }

  function openReactionContextMenu(
    reaction: Reaction,
    position: { x: number; y: number },
    anchor?: HTMLElement | null
  ) {
    reactionContextMenuController.open({
      sections: buildReactionContextMenuSections(reaction),
      position,
      anchorElement: anchor ?? null,
      context: {
        reactionId: reaction.id,
        ariaLabel: `${reaction.name || FoundryAdapter.localize('TURN_PREP.Reactions.ReactionLabel')} ${FoundryAdapter.localize('TURN_PREP.Reactions.ContextMenuLabel')}`
      }
    });
  }

  function handleReactionContextMenu(reaction: Reaction, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    openReactionContextMenu(reaction, { x: event.clientX, y: event.clientY }, event.currentTarget as HTMLElement);
  }

  function handleReactionMenuButton(reaction: Reaction, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    const button = event.currentTarget as HTMLElement | null;

    if (button) {
      const rect = button.getBoundingClientRect();
      openReactionContextMenu(reaction, { x: rect.right, y: rect.bottom + 4 }, button);
      return;
    }

    openReactionContextMenu(reaction, { x: event.clientX, y: event.clientY });
  }
</script>

{#if loading}
  <div class="turn-prep-panel-loading reaction-plans-loading">
    <p>{FoundryAdapter.localize('TURN_PREP.Common.Loading')}</p>
  </div>
{:else}
  <div class="turn-prep-panel reaction-plans-panel">
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
        <div class="turn-prep-panel-empty reaction-plans-empty">
          <p>{FoundryAdapter.localize('TURN_PREP.Reactions.NoReactions')}</p>
        </div>
      {:else}
        <div class="turn-prep-panel-list reaction-plans-list">
          {#each reactions as reaction (reaction.id)}
            <div
              class={`turn-prep-panel-card reaction-card ${isReactionCollapsed(reaction.id) ? 'is-collapsed' : ''} ${activeContextReactionId === reaction.id ? 'is-context-open' : ''}`}
              role="group"
              oncontextmenu={(event) => handleReactionContextMenu(reaction, event)}
            >
              <div class="reaction-header">
                <div class="turn-prep-inline-label-row reaction-name-row">
                  <button
                    type="button"
                    class="reaction-collapse-button"
                    aria-label={FoundryAdapter.localize('TURN_PREP.Reactions.ToggleBody')}
                    onclick={() => toggleReactionCollapsed(reaction.id)}
                  >
                    <i class={`fas fa-chevron-${isReactionCollapsed(reaction.id) ? 'right' : 'down'}`}></i>
                  </button>
                  <label
                    for={"reaction-name-" + reaction.id}
                  >
                    {FoundryAdapter.localize('TURN_PREP.Reactions.Trigger')}
                  </label>
                  <input
                    id={"reaction-name-" + reaction.id}
                    type="text"
                    class="turn-prep-input reaction-name"
                    bind:value={reaction.name}
                    placeholder={FoundryAdapter.localize('TURN_PREP.Reactions.TriggerPlaceholder')}
                    oninput={scheduleAutoSave}
                  />
                </div>
                <button
                  type="button"
                  class="reaction-menu-button"
                  aria-label={FoundryAdapter.localize('TURN_PREP.ContextMenu.OpenLabel')}
                  title={FoundryAdapter.localize('TURN_PREP.ContextMenu.OpenLabel')}
                  onclick={(event) => handleReactionMenuButton(reaction, event)}
                >
                  <i class="fas fa-ellipsis-vertical"></i>
                </button>
              </div>

              {#if !isReactionCollapsed(reaction.id)}
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

                <div class={`turn-prep-collapsible reaction-notes ${isNotesCollapsed(reaction.id) ? '' : 'is-open'}`}>
                  <button
                    type="button"
                    class="turn-prep-collapsible__toggle notes-toggle"
                    onclick={() => toggleNotes(reaction.id)}
                  >
                    <i class="fas fa-chevron-{isNotesCollapsed(reaction.id) ? 'right' : 'down'}"></i>
                    <span>{FoundryAdapter.localize('TURN_PREP.Reactions.Notes')}</span>
                  </button>
                  {#if !isNotesCollapsed(reaction.id)}
                    <div class="turn-prep-collapsible__body">
                      <textarea
                        class="turn-prep-textarea notes-input"
                        bind:value={reaction.notes}
                        placeholder={FoundryAdapter.localize('TURN_PREP.Reactions.NotesPlaceholder')}
                        rows="3"
                        oninput={scheduleAutoSave}
                      ></textarea>
                    </div>
                  {/if}
                </div>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    {/if}
  </div>
{/if}

<ContextMenuHost controller={reactionContextMenuController} />

<style lang="less">
  .reaction-card {
    &.is-context-open {
      box-shadow: 0 0 0 2px var(--t5e-primary-accent-color, #ff6400);
    }

    .reaction-header {
      display: flex;
      align-items: center;
      gap: 0rem;
      margin-bottom: 0rem;

      .reaction-name-row {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 0.25rem;
      }

      .reaction-name {
        flex: 1;
        font-size: 0.95rem;
        font-weight: 500;
      }

      .reaction-collapse-button {
        background: transparent;
        border: none;
        color: inherit;
        padding: 0.25rem;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;

        &:hover {
          color: var(--t5e-primary-accent-color, #ff6400);
        }
      }

      .reaction-menu-button {
        padding: 0.35rem;
        background: transparent;
        border: none;
        color: inherit;
        cursor: pointer;
        font-size: 1.05rem;
        display: flex;
        align-items: center;
        justify-content: center;

        &:hover {
          color: var(--t5e-primary-accent-color, #ff6400);
        }
      }
    }

    .reaction-content {
      display: flex;
      flex-direction: column;
      gap: 0rem;
    }
  }
</style>
