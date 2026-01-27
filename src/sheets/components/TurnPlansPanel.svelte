<script lang="ts">
  import { onMount } from 'svelte';
  import type { TurnPlan, SelectedFeature } from '../../types/turn-prep.types';
  import { FoundryAdapter } from '../../foundry/FoundryAdapter';
  import { TurnPrepApiInstance as api } from '../../api/TurnPrepApi';
  import TurnPlanFeatureTable, { type DisplayFeature } from './TurnPlanFeatureTable.svelte';
  import { AUTO_SAVE_DEBOUNCE_MS, FLAG_SCOPE, FLAG_KEY_DATA } from '../../constants';
  import { createEmptyTurnPrepData } from '../../utils/data';
  import {
    buildDisplayFeatureList,
    cloneSelectedFeatureArray,
    mergeSelectedFeatureArrays,
    normalizeActionType
  } from './featureDisplay.helpers';

  // Props
  let { actor }: { actor: any } = $props();

  // State
  let plans: TurnPlan[] = $state([]);
  let loading = $state(true);
  let initialized = $state(false);
  let collapsed = $state(false);

  let saveTimeout: number | null = null;
  const hookCleanups: Array<() => void> = [];

  // Initialize plans from actor flags
  onMount(() => {
    loadPlans(true);

    registerHook('updateActor', onActorUpdated);
    registerHook('updateItem', onItemChanged);
    registerHook('deleteItem', onItemChanged);

    return () => {
      cleanupHooks();
      cancelPendingSave(true);
    };
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

  function onActorUpdated(updatedActor: any, changes: any) {
    if (!actor || updatedActor?.id !== actor.id) return;
    if (hasTurnPrepFlagChange(changes)) {
      loadPlans();
    }
  }

  function hasTurnPrepFlagChange(changes: any): boolean {
    const flagChanges = changes?.flags;
    if (!flagChanges) return false;
    const scopeChanges = flagChanges[FLAG_SCOPE];
    if (!scopeChanges) return false;
    return Object.prototype.hasOwnProperty.call(scopeChanges, FLAG_KEY_DATA);
  }

  function onItemChanged(item: any) {
    if (!actor || !item?.actor || item.actor.id !== actor.id) return;
    touchPlans();
  }

  function touchPlans() {
    plans = plans.map((plan) => ({ ...plan }));
  }

  function loadPlans(showSpinner = false) {
    if (!actor) {
      plans = [];
      loading = false;
      initialized = true;
      return;
    }

    if (showSpinner) {
      loading = true;
    }

    try {
      const turnPrepData = api.getTurnPrepData(actor);
      plans = hydratePlans(turnPrepData?.turnPlans ?? []);
    } catch (error) {
      console.error('[TurnPlansPanel] Failed to load turn plans:', error);
      plans = [];
      ui.notifications?.error(FoundryAdapter.localize('TURN_PREP.TurnPlans.SaveError'));
    } finally {
      loading = false;
      initialized = true;
    }
  }

  function hydratePlans(rawPlans: TurnPlan[]): TurnPlan[] {
    return rawPlans.map((plan) => sanitizePlan(plan));
  }

  function sanitizePlan(rawPlan: any): TurnPlan {
    const actions = mergeSelectedFeatureArrays(rawPlan.actions, rawPlan.action);
    const bonusActions = mergeSelectedFeatureArrays(rawPlan.bonusActions, rawPlan.bonusAction);
    const reactions = mergeSelectedFeatureArrays(rawPlan.reactions);
    const additional = cloneSelectedFeatureArray(rawPlan.additionalFeatures ?? []);

    return {
      id: rawPlan.id ?? foundry.utils.randomID(),
      name: rawPlan.name ?? FoundryAdapter.localize('TURN_PREP.TurnPlans.PlanLabel'),
      trigger: rawPlan.trigger ?? '',
      actions,
      bonusActions,
      reactions,
      movement: rawPlan.movement ?? '',
      roleplay: rawPlan.roleplay ?? '',
      additionalFeatures: additional,
      categories: Array.isArray(rawPlan.categories) ? [...rawPlan.categories] : [],
    };
  }

  function cloneFeature(feature?: SelectedFeature | null): SelectedFeature | null {
    if (!feature) return null;
    return {
      itemId: feature.itemId,
      itemName: feature.itemName,
      itemType: feature.itemType,
      actionType: feature.actionType,
    };
  }

  function cloneFeatureArray(features?: SelectedFeature[] | null): SelectedFeature[] {
    if (!Array.isArray(features)) return [];
    return features
      .map((feature) => cloneFeature(feature))
      .filter((feature): feature is SelectedFeature => !!feature);
  }

  function mergeFeatureArrays(arrayValue?: SelectedFeature[] | null, legacyValue?: SelectedFeature | null): SelectedFeature[] {
    const merged = cloneFeatureArray(arrayValue);
    const legacy = cloneFeature(legacyValue);
    if (legacy) {
      merged.push(legacy);
    }
    return merged;
  }

  function cancelPendingSave(flush = false) {
    const pending = !!saveTimeout;
    if (saveTimeout) {
      window.clearTimeout(saveTimeout);
      saveTimeout = null;
    }
    if (flush && pending) {
      void savePlans();
    }
  }

  function scheduleAutoSave() {
    if (!initialized) return;
    if (saveTimeout) {
      window.clearTimeout(saveTimeout);
    }
    saveTimeout = window.setTimeout(() => {
      saveTimeout = null;
      void savePlans();
    }, AUTO_SAVE_DEBOUNCE_MS);
  }

  // Create a new empty plan
  function createNewPlan() {
    const newPlan: TurnPlan = {
      id: foundry.utils.randomID(),
      name: `${FoundryAdapter.localize('TURN_PREP.TurnPlans.PlanLabel')} ${plans.length + 1}`,
      trigger: '',
      actions: [],
      bonusActions: [],
      reactions: [],
      movement: '',
      roleplay: '',
      additionalFeatures: [],
      categories: []
    };
    
    plans = [...plans, newPlan];
    void savePlans();
  }

  function getActionFeatures(plan: TurnPlan): DisplayFeature[] {
    const features: SelectedFeature[] = Array.isArray(plan.actions) ? plan.actions : [];
    const additional = (plan.additionalFeatures ?? []).filter(
      (feature) => normalizeActionType(feature.actionType) === 'action'
    );
    return [
      ...buildDisplayFeatureList(actor, plan.id, features, 'action-primary'),
      ...buildDisplayFeatureList(actor, plan.id, additional, 'action-extra')
    ];
  }

  function getBonusActionFeatures(plan: TurnPlan): DisplayFeature[] {
    const features: SelectedFeature[] = Array.isArray(plan.bonusActions) ? plan.bonusActions : [];
    const additional = (plan.additionalFeatures ?? []).filter(
      (feature) => normalizeActionType(feature.actionType) === 'bonus'
    );
    return [
      ...buildDisplayFeatureList(actor, plan.id, features, 'bonus-primary'),
      ...buildDisplayFeatureList(actor, plan.id, additional, 'bonus-extra')
    ];
  }

  function getAdditionalFeatures(plan: TurnPlan): DisplayFeature[] {
    const extras = (plan.additionalFeatures ?? []).filter((feature) => {
      const type = normalizeActionType(feature.actionType);
      return type !== 'action' && type !== 'bonus';
    });
    return buildDisplayFeatureList(actor, plan.id, extras, 'additional');
  }

  function handleRemoveFeature(planId: string, target: 'action' | 'bonusAction' | 'additional', featureId: string) {
    const index = plans.findIndex((plan) => plan.id === planId);
    if (index === -1) return;

    const updated = [...plans];
    const plan = {
      ...updated[index],
      actions: [...(updated[index].actions ?? [])],
      bonusActions: [...(updated[index].bonusActions ?? [])],
      reactions: [...(updated[index].reactions ?? [])],
      additionalFeatures: [...(updated[index].additionalFeatures ?? [])]
    };

    if (target === 'action') {
      plan.actions = plan.actions.filter((feature) => feature.itemId !== featureId);
      plan.additionalFeatures = plan.additionalFeatures.filter(
        (feature) => !(feature.itemId === featureId && normalizeActionType(feature.actionType) === 'action')
      );
    } else if (target === 'bonusAction') {
      plan.bonusActions = plan.bonusActions.filter((feature) => feature.itemId !== featureId);
      plan.additionalFeatures = plan.additionalFeatures.filter(
        (feature) => !(feature.itemId === featureId && normalizeActionType(feature.actionType) === 'bonus')
      );
    } else {
      plan.additionalFeatures = plan.additionalFeatures.filter((feature) => feature.itemId !== featureId);
    }

    updated[index] = plan;
    plans = updated;
    void savePlans();
  }

  // Delete a plan
  async function deletePlan(id: string) {
    const confirmed = await (window as any).foundry.applications.api.DialogV2.confirm({
      window: { title: FoundryAdapter.localize('TURN_PREP.TurnPlans.DeleteConfirm') },
      content: `<p>${FoundryAdapter.localize('TURN_PREP.TurnPlans.DeleteConfirmMessage')}</p>`,
    });

    if (!confirmed) return;

    plans = plans.filter(p => p.id !== id);
    void savePlans();
  }

  // Save all plans to actor flags
  async function savePlans() {
    if (!actor) return;
    try {
      const turnPrepData = api.getTurnPrepData(actor) ?? createEmptyTurnPrepData();
      turnPrepData.turnPlans = plans.map((plan) => sanitizePlan(plan));
      await api.saveTurnPrepData(actor, turnPrepData);
    } catch (error) {
      console.error('[TurnPlansPanel] Failed to save plans:', error);
      ui.notifications?.error(FoundryAdapter.localize('TURN_PREP.TurnPlans.SaveError'));
    }
  }
</script>

{#if loading}
  <div class="turn-plans-loading">
    <p>{FoundryAdapter.localize('TURN_PREP.Common.Loading')}</p>
  </div>
{:else}
  <div class="turn-plans-panel">
    <div class="turn-prep-panel-header">
      <button
        type="button"
        class="turn-prep-panel-toggle"
        title={collapsed ? 'Expand' : 'Collapse'}
        onclick={() => collapsed = !collapsed}
      >
        <i class="fas fa-chevron-{collapsed ? 'right' : 'down'}"></i>
      </button>
      <h3>{FoundryAdapter.localize('TURN_PREP.TurnPlans.Title')}</h3>
      <button
        type="button"
        class="turn-prep-panel-action-btn"
        onclick={createNewPlan}
      >
        <i class="fas fa-plus"></i>
        {FoundryAdapter.localize('TURN_PREP.TurnPlans.NewPlan')}
      </button>
    </div>

    {#if !collapsed}
      {#if plans.length === 0}
        <div class="turn-plans-empty">
          <p>{FoundryAdapter.localize('TURN_PREP.TurnPlans.NoPlans')}</p>
        </div>
      {:else}
        <div class="turn-plans-list">
          {#each plans as plan (plan.id)}
            <div class="turn-plan-card">
              <div class="plan-header">
                <input
                  type="text"
                  class="plan-name"
                  bind:value={plan.name}
                  placeholder={FoundryAdapter.localize('TURN_PREP.TurnPlans.PlanName')}
                  oninput={scheduleAutoSave}
                />
                <button
                  type="button"
                  class="delete-plan-button"
                  onclick={() => deletePlan(plan.id)}
                  title={FoundryAdapter.localize('TURN_PREP.TurnPlans.DeleteTooltip')}
                >
                  <i class="fas fa-trash"></i>
                </button>
              </div>

              <div class="plan-content">
                <div class="plan-feature-sections">
                  <TurnPlanFeatureTable
                    tableKey={`action-${plan.id}`}
                    title={FoundryAdapter.localize('TURN_PREP.TurnPlans.Actions')}
                    actor={actor}
                    features={getActionFeatures(plan)}
                    onRemoveFeature={(featureId) => handleRemoveFeature(plan.id, 'action', featureId)}
                  />

                  <TurnPlanFeatureTable
                    tableKey={`bonus-${plan.id}`}
                    title={FoundryAdapter.localize('TURN_PREP.TurnPlans.BonusActions')}
                    actor={actor}
                    features={getBonusActionFeatures(plan)}
                    onRemoveFeature={(featureId) => handleRemoveFeature(plan.id, 'bonusAction', featureId)}
                  />

                  <TurnPlanFeatureTable
                    tableKey={`additional-${plan.id}`}
                    title={FoundryAdapter.localize('TURN_PREP.TurnPlans.AdditionalFeatures')}
                    actor={actor}
                    features={getAdditionalFeatures(plan)}
                    onRemoveFeature={(featureId) => handleRemoveFeature(plan.id, 'additional', featureId)}
                  />
                </div>

                <div class="plan-field">
                  <label for={"tp-trigger-" + plan.id}>{FoundryAdapter.localize('TURN_PREP.TurnPlans.Trigger')}</label>
                  <input
                    id={"tp-trigger-" + plan.id}
                    type="text"
                    bind:value={plan.trigger}
                    placeholder={FoundryAdapter.localize('TURN_PREP.TurnPlans.TriggerPlaceholder')}
                    oninput={scheduleAutoSave}
                  />
                </div>

                <div class="plan-field">
                  <label for={"tp-movement-" + plan.id}>{FoundryAdapter.localize('TURN_PREP.TurnPlans.Movement')}</label>
                  <input
                    id={"tp-movement-" + plan.id}
                    type="text"
                    bind:value={plan.movement}
                    oninput={scheduleAutoSave}
                  />
                </div>

                <div class="plan-field">
                  <label for={"tp-roleplay-" + plan.id}>{FoundryAdapter.localize('TURN_PREP.TurnPlans.RoleplayNotes')}</label>
                  <textarea
                    id={"tp-roleplay-" + plan.id}
                    bind:value={plan.roleplay}
                    rows="3"
                    oninput={scheduleAutoSave}
                  ></textarea>
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
  :global(.turn-prep-panel-header) {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    margin-bottom: 1rem;
    background: var(--t5e-primary-accent-color, #4b4a44);
    color: var(--t5e-light-color, #f0f0e0);
    border-radius: 4px;

    h3 {
      margin: 0;
      font-size: 1.2rem;
      flex: 1;
    }
  }

  :global(.turn-prep-panel-toggle) {
    width: 1.75rem;
    height: 1.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.9);
    background: rgba(255, 255, 255, 0.12);
    color: var(--t5e-light-color, #f0f0e0);
    cursor: pointer;
    padding: 0;
    transition: background 0.2s ease, opacity 0.2s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    i {
      font-size: 0.9rem;
    }
  }

  :global(.turn-prep-panel-action-btn) {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.35rem 0.85rem;
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.9);
    background: transparent;
    color: var(--t5e-light-color, #f0f0e0);
    cursor: pointer;
    font-size: 0.9rem;
    transition: background 0.2s ease, color 0.2s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.15);
    }
  }

  .turn-plans-panel {
    padding: 1rem;
  }

  .turn-plans-empty {
    text-align: center;
    padding: 2rem;
    color: var(--t5e-tertiary-color);
  }

  .turn-plans-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .turn-plan-card {
    background: var(--t5e-sheet-background);
    border: 1px solid var(--t5e-faint-color);
    border-radius: 4px;
    padding: 1rem;

    .plan-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;

      .plan-name {
        flex: 1;
        font-size: 1.1rem;
        font-weight: bold;
        padding: 0.5rem;
        border: 1px solid var(--t5e-faint-color);
        border-radius: 4px;
      }

      .delete-plan-button {
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

    .plan-content {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;

      .plan-feature-sections {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        margin-bottom: 0.5rem;
      }

      .plan-field {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;

        label {
          font-weight: 600;
          font-size: 0.9rem;
          color: var(--t5e-primary-color);
        }

        input, textarea {
          padding: 0.5rem;
          border: 1px solid var(--t5e-faint-color);
          border-radius: 4px;
          font-family: inherit;
          font-size: 0.9rem;

          &:focus {
            outline: none;
            border-color: var(--t5e-primary-accent-color);
          }
        }

        textarea {
          resize: vertical;
          min-height: 60px;
        }
      }
    }
  }

  .turn-plans-loading {
    text-align: center;
    padding: 2rem;
  }
</style>
