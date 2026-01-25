/**
 * Turn Plans Panel Component
 * 
 * Svelte component for managing turn plans.
 * Allows creating, editing, and managing multiple turn plan options.
 * 
 * Props:
 * - actor: The character actor
 */

<script lang="ts">
  import { onMount } from 'svelte';
  import type { TurnPlan } from '../../types/turn-prep.types';
  import { FoundryAdapter } from '../../foundry/FoundryAdapter';
  import { TurnPrepApiInstance as api } from '../../api/TurnPrepApi';

  // Props
  let { actor }: { actor: any } = $props();

  // State
  let plans: TurnPlan[] = $state([]);
  let loading = $state(true);

  // Initialize plans from actor flags
  onMount(async () => {
    try {
      const turnPrepData = api.getTurnPrepData(actor);
      plans = turnPrepData?.turnPlans || [];
      loading = false;
    } catch (error) {
      console.error('[TurnPlansPanel] Failed to load turn plans:', error);
      plans = [];
      loading = false;
    }
  });

  // Create a new empty plan
  function createNewPlan() {
    const newPlan: TurnPlan = {
      id: foundry.utils.randomID(),
      name: `${FoundryAdapter.localize('TURN_PREP.TurnPlans.PlanLabel')} ${plans.length + 1}`,
      trigger: '',
      action: null,
      bonusAction: null,
      movement: '',
      roleplay: '',
      additionalFeatures: [],
      categories: []
    };
    
    plans = [...plans, newPlan];
    savePlans();
  }

  // Delete a plan
  async function deletePlan(id: string) {
    const confirmed = await (window as any).foundry.applications.api.DialogV2.confirm({
      window: { title: FoundryAdapter.localize('TURN_PREP.TurnPlans.DeleteConfirm') },
      content: `<p>${FoundryAdapter.localize('TURN_PREP.TurnPlans.DeleteConfirmMessage')}</p>`,
    });

    if (!confirmed) return;

    plans = plans.filter(p => p.id !== id);
    savePlans();
  }

  // Save all plans to actor flags
  async function savePlans() {
    try {
      const turnPrepData = api.getTurnPrepData(actor) || {
        dmQuestions: [],
        turnPlans: [],
        reactions: []
      };
      turnPrepData.turnPlans = plans;
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
    <!-- Header with New Plan button -->
    <div class="turn-plans-header">
      <h3>{FoundryAdapter.localize('TURN_PREP.TurnPlans.Title')}</h3>
      <button
        type="button"
        class="new-plan-button"
        onclick={createNewPlan}
      >
        <i class="fas fa-plus"></i>
        {FoundryAdapter.localize('TURN_PREP.TurnPlans.NewPlan')}
      </button>
    </div>

    <!-- Plans list -->
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
              <div class="plan-field">
                <label for={"tp-trigger-" + plan.id}>{FoundryAdapter.localize('TURN_PREP.TurnPlans.Trigger')}</label>
                <input
                  id={"tp-trigger-" + plan.id}
                  type="text"
                  bind:value={plan.trigger}
                  placeholder={FoundryAdapter.localize('TURN_PREP.TurnPlans.TriggerPlaceholder')}
                />
              </div>

              <div class="plan-field">
                <label for={"tp-movement-" + plan.id}>{FoundryAdapter.localize('TURN_PREP.TurnPlans.Movement')}</label>
                <input
                  id={"tp-movement-" + plan.id}
                  type="text"
                  bind:value={plan.movement}
                />
              </div>

              <div class="plan-field">
                <label for={"tp-roleplay-" + plan.id}>{FoundryAdapter.localize('TURN_PREP.TurnPlans.RoleplayNotes')}</label>
                <textarea
                  id={"tp-roleplay-" + plan.id}
                  bind:value={plan.roleplay}
                  rows="3"
                ></textarea>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
{/if}

<style lang="less">
  .turn-plans-panel {
    padding: 1rem;
  }

  .turn-plans-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;

    h3 {
      margin: 0;
      font-size: 1.2rem;
    }

    .new-plan-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: var(--t5e-primary-accent-color, #4a90e2);
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;

      &:hover {
        background: var(--t5e-primary-accent-hover-color, #357abd);
      }
    }
  }

  .turn-plans-empty {
    text-align: center;
    padding: 2rem;
    color: var(--t5e-tertiary-color, #666);
  }

  .turn-plans-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .turn-plan-card {
    background: var(--t5e-sheet-background, #fff);
    border: 1px solid var(--t5e-faint-color, #ddd);
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
        border: 1px solid var(--t5e-faint-color, #ddd);
        border-radius: 4px;
      }

      .delete-plan-button {
        padding: 0.5rem;
        background: transparent;
        border: none;
        color: var(--t5e-warning-accent-color, #dc3545);
        cursor: pointer;
        font-size: 1.1rem;

        &:hover {
          color: var(--t5e-warning-accent-hover-color, #c82333);
        }
      }
    }

    .plan-content {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;

      .plan-field {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;

        label {
          font-weight: 600;
          font-size: 0.9rem;
          color: var(--t5e-primary-color, #000);
        }

        input, textarea {
          padding: 0.5rem;
          border: 1px solid var(--t5e-faint-color, #ddd);
          border-radius: 4px;
          font-family: inherit;
          font-size: 0.9rem;

          &:focus {
            outline: none;
            border-color: var(--t5e-primary-accent-color, #4a90e2);
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
