<script lang="ts">
  import TurnPlanFeatureTable, { type DisplayFeature } from '../components/TurnPlanFeatureTable.svelte';
  import { FoundryAdapter } from '../../foundry/FoundryAdapter';
  import type { TurnPlan, SelectedFeature, TurnPlanTableKey } from '../../types';
  import { buildDisplayFeatureList } from '../components/featureDisplay.helpers';

  interface Props {
    actor: any;
    plan: TurnPlan;
    notesInitiallyOpen?: boolean;
    onChange?: (plan: TurnPlan) => void;
  }

  const { actor, plan, notesInitiallyOpen = true, onChange }: Props = $props();

  function normalizePlan(value: TurnPlan): TurnPlan {
    const base = value ?? ({} as TurnPlan);
    return {
      id: base.id,
      name: base.name ?? '',
      trigger: base.trigger ?? '',
      actions: Array.isArray(base.actions) ? base.actions : [],
      bonusActions: Array.isArray(base.bonusActions) ? base.bonusActions : [],
      reactions: Array.isArray(base.reactions) ? base.reactions : [],
      movement: base.movement ?? '',
      roleplay: base.roleplay ?? '',
      additionalFeatures: Array.isArray(base.additionalFeatures) ? base.additionalFeatures : [],
      categories: Array.isArray(base.categories) ? base.categories : [],
    } satisfies TurnPlan;
  }

  const emptyPlan = normalizePlan({ id: '' } as TurnPlan);
  let localPlan = $state<TurnPlan>(emptyPlan);
  let collapsed = $state(false);
  let notesOpen = $state(true);

  $effect(() => {
    localPlan = normalizePlan(plan);
    notesOpen = notesInitiallyOpen ?? true;
  });

  function updatePlan(next: TurnPlan) {
    localPlan = next;
    onChange?.(next);
  }

  function updateField(field: keyof TurnPlan, value: any) {
    updatePlan({ ...localPlan, [field]: value ?? '' });
  }

  function ensureList(list?: SelectedFeature[] | null): SelectedFeature[] {
    return Array.isArray(list) ? list : [];
  }

  function buildFeatures(list: SelectedFeature[], kind: 'action' | 'bonus' | 'reaction' | 'additional'): DisplayFeature[] {
    const key = kind === 'reaction' ? 'reaction-primary' : kind === 'additional' ? 'reaction-additional' : kind;
    return buildDisplayFeatureList(actor, localPlan.id, ensureList(list), key);
  }

  function getActionFeatures(plan: TurnPlan): DisplayFeature[] {
    return buildFeatures(ensureList(plan.actions), 'action');
  }

  function getBonusActionFeatures(plan: TurnPlan): DisplayFeature[] {
    return buildFeatures(ensureList(plan.bonusActions), 'bonus');
  }

  function getAdditionalFeatures(plan: TurnPlan): DisplayFeature[] {
    return buildFeatures(ensureList(plan.additionalFeatures), 'additional');
  }

  function removeFeature(table: TurnPlanTableKey, featureId: string) {
    const list = ensureList(localPlan[table]);
    updatePlan({ ...localPlan, [table]: list.filter((f) => f.itemId !== featureId) });
  }

  function moveFeature(table: TurnPlanTableKey, from: number, to: number) {
    const list = [...ensureList(localPlan[table])];
    if (from < 0 || from >= list.length) return;
    const [item] = list.splice(from, 1);
    const target = Math.max(0, Math.min(list.length, to));
    list.splice(target, 0, item);
    updatePlan({ ...localPlan, [table]: list });
  }

  function tableTitle(key: TurnPlanTableKey): string {
    if (key === 'actions') return FoundryAdapter.localize('TURN_PREP.TurnPlans.Actions');
    if (key === 'bonusActions') return FoundryAdapter.localize('TURN_PREP.TurnPlans.BonusActions');
    if (key === 'reactions') return FoundryAdapter.localize('TURN_PREP.TurnPlans.Reactions');
    return FoundryAdapter.localize('TURN_PREP.TurnPlans.AdditionalFeatures');
  }
</script>

<div class="turn-prep-panel-card turn-plan-card">
  <div class="plan-header">
    <button
      type="button"
      class="plan-collapse-button"
      aria-label={FoundryAdapter.localize('TURN_PREP.TurnPlans.TogglePlanBody')}
      onclick={() => collapsed = !collapsed}
    >
      <i class={`fas fa-chevron-${collapsed ? 'right' : 'down'}`}></i>
    </button>

    <input
      type="text"
      class="turn-prep-input plan-name"
      value={localPlan.name}
      placeholder={FoundryAdapter.localize('TURN_PREP.TurnPlans.PlanName')}
      oninput={(event) => updateField('name', (event.currentTarget as HTMLInputElement).value)}
    />
  </div>

  {#if !collapsed}
    <div class="plan-content">
      <div class="plan-feature-sections">
        <TurnPlanFeatureTable
          tableKey={`action-${localPlan.id}`}
          title={tableTitle('actions')}
          actor={actor}
          features={getActionFeatures(localPlan)}
          ownerId={localPlan.id}
          panelKind="turn"
          tableType="actions"
          onRemoveFeature={(featureId) => removeFeature('actions', featureId)}
          onReorderFeature={(from, to) => moveFeature('actions', from, to)}
        />

        <TurnPlanFeatureTable
          tableKey={`bonus-${localPlan.id}`}
          title={tableTitle('bonusActions')}
          actor={actor}
          features={getBonusActionFeatures(localPlan)}
          ownerId={localPlan.id}
          panelKind="turn"
          tableType="bonusActions"
          onRemoveFeature={(featureId) => removeFeature('bonusActions', featureId)}
          onReorderFeature={(from, to) => moveFeature('bonusActions', from, to)}
        />

        <TurnPlanFeatureTable
          tableKey={`additional-${localPlan.id}`}
          title={tableTitle('additionalFeatures')}
          actor={actor}
          features={getAdditionalFeatures(localPlan)}
          ownerId={localPlan.id}
          panelKind="turn"
          tableType="additionalFeatures"
          onRemoveFeature={(featureId) => removeFeature('additionalFeatures', featureId)}
          onReorderFeature={(from, to) => moveFeature('additionalFeatures', from, to)}
        />
      </div>

      <div class="turn-plan-notes">
        <div class={`turn-prep-collapsible ${notesOpen ? 'is-open' : ''}`}>
          <button
            type="button"
            class="turn-prep-collapsible__toggle"
            onclick={() => notesOpen = !notesOpen}
          >
            <i class={`fas fa-chevron-${notesOpen ? 'down' : 'right'}`}></i>
            {FoundryAdapter.localize('TURN_PREP.TurnPlans.AdditionalNotes')}
          </button>

          {#if notesOpen}
            <div class="turn-prep-collapsible__body">
              <div class="turn-plan-notes__table" role="table">
                <label class="turn-plan-notes__label" for={`tp-situation-${localPlan.id}`}>
                  {FoundryAdapter.localize('TURN_PREP.TurnPlans.Situation')}
                </label>
                <textarea
                  id={`tp-situation-${localPlan.id}`}
                  class="turn-prep-textarea turn-plan-notes__input turn-plan-notes__input--single"
                  value={localPlan.trigger}
                  placeholder={FoundryAdapter.localize('TURN_PREP.TurnPlans.TriggerPlaceholder')}
                  rows="1"
                  oninput={(event) => updateField('trigger', (event.currentTarget as HTMLTextAreaElement).value)}
                ></textarea>

                <label class="turn-plan-notes__label" for={`tp-movement-${localPlan.id}`}>
                  {FoundryAdapter.localize('TURN_PREP.TurnPlans.Movement')}
                </label>
                <textarea
                  id={`tp-movement-${localPlan.id}`}
                  class="turn-prep-textarea turn-plan-notes__input turn-plan-notes__input--single"
                  value={localPlan.movement}
                  rows="1"
                  oninput={(event) => updateField('movement', (event.currentTarget as HTMLTextAreaElement).value)}
                ></textarea>

                <label class="turn-plan-notes__label" for={`tp-notes-${localPlan.id}`}>
                  {FoundryAdapter.localize('TURN_PREP.TurnPlans.Notes')}
                </label>
                <textarea
                  id={`tp-notes-${localPlan.id}`}
                  class="turn-prep-textarea turn-plan-notes__input turn-plan-notes__input--double"
                  value={localPlan.roleplay}
                  placeholder={FoundryAdapter.localize('TURN_PREP.TurnPlans.NotesPlaceholder')}
                  rows="2"
                  oninput={(event) => updateField('roleplay', (event.currentTarget as HTMLTextAreaElement).value)}
                ></textarea>
              </div>
            </div>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>
