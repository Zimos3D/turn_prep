<script lang="ts">
  import TurnPlanFeatureTable, { type DisplayFeature } from '../components/TurnPlanFeatureTable.svelte';
  import { FoundryAdapter } from '../../foundry/FoundryAdapter';
  import type { Reaction, SelectedFeature, ReactionPlanTableKey } from '../../types';
  import { buildDisplayFeatureList } from '../components/featureDisplay.helpers';

  interface Props {
    actor: any;
    reaction: Reaction;
    notesInitiallyOpen?: boolean;
    onChange?: (reaction: Reaction) => void;
  }

  const { actor, reaction, notesInitiallyOpen = true, onChange }: Props = $props();

  function normalizeReaction(value: Reaction): Reaction {
    const base = value ?? ({} as Reaction);
    return {
      id: base.id,
      name: base.name ?? base.trigger ?? '',
      trigger: base.trigger ?? base.name ?? '',
      reactionFeatures: Array.isArray(base.reactionFeatures) ? base.reactionFeatures : [],
      additionalFeatures: Array.isArray(base.additionalFeatures) ? base.additionalFeatures : [],
      notes: base.notes ?? '',
      createdTime: base.createdTime ?? Date.now(),
      isFavorite: base.isFavorite ?? false,
    } satisfies Reaction;
  }

  const emptyReaction = normalizeReaction({} as Reaction);
  let localReaction = $state<Reaction>(emptyReaction);
  let collapsed = $state(false);
  let notesOpen = $state(true);

  $effect(() => {
    localReaction = normalizeReaction(reaction);
    notesOpen = notesInitiallyOpen ?? true;
  });

  function updateReaction(next: Reaction) {
    localReaction = next;
    onChange?.(next);
  }

  function updateField(field: keyof Reaction, value: any) {
    updateReaction({ ...localReaction, [field]: value ?? '' });
  }

  function ensureList(list?: SelectedFeature[] | null): SelectedFeature[] {
    return Array.isArray(list) ? list : [];
  }

  function buildFeatures(list: SelectedFeature[], kind: 'reaction' | 'additional'): DisplayFeature[] {
    const key = kind === 'reaction' ? 'reaction-primary' : 'reaction-additional';
    return buildDisplayFeatureList(actor, localReaction.id, ensureList(list), key);
  }

  function getReactionFeatures(plan: Reaction): DisplayFeature[] {
    return buildFeatures(ensureList(plan.reactionFeatures), 'reaction');
  }

  function getAdditionalFeatures(plan: Reaction): DisplayFeature[] {
    return buildFeatures(ensureList(plan.additionalFeatures), 'additional');
  }

  function removeFeature(table: ReactionPlanTableKey, featureId: string) {
    const list = ensureList(localReaction[table]);
    updateReaction({ ...localReaction, [table]: list.filter((f) => f.itemId !== featureId) });
  }

  function moveFeature(table: ReactionPlanTableKey, from: number, to: number) {
    const list = [...ensureList(localReaction[table])];
    if (from < 0 || from >= list.length) return;
    const [item] = list.splice(from, 1);
    const target = Math.max(0, Math.min(list.length, to));
    list.splice(target, 0, item);
    updateReaction({ ...localReaction, [table]: list });
  }
</script>

<div class="turn-prep-panel-card reaction-card">
  <div class="reaction-header">
    <div class="turn-prep-inline-label-row reaction-name-row">
      <button
        type="button"
        class="reaction-collapse-button"
        aria-label={FoundryAdapter.localize('TURN_PREP.Reactions.ToggleBody')}
        onclick={() => collapsed = !collapsed}
      >
        <i class={`fas fa-chevron-${collapsed ? 'right' : 'down'}`}></i>
      </button>
      <label for={`reaction-name-${localReaction.id}`}>
        {FoundryAdapter.localize('TURN_PREP.Reactions.Trigger')}
      </label>
      <input
        id={`reaction-name-${localReaction.id}`}
        type="text"
        class="turn-prep-input reaction-name"
        value={localReaction.name}
        placeholder={FoundryAdapter.localize('TURN_PREP.Reactions.TriggerPlaceholder')}
        oninput={(event) => {
          const value = (event.currentTarget as HTMLInputElement).value;
          updateReaction({ ...localReaction, name: value, trigger: value });
        }}
      />
    </div>
  </div>

  {#if !collapsed}
    <div class="reaction-content">
      <TurnPlanFeatureTable
        tableKey={`reaction-${localReaction.id}`}
        ownerId={localReaction.id}
        panelKind="reaction"
        tableType="reactionFeatures"
        title={FoundryAdapter.localize('TURN_PREP.Reactions.ReactionFeatures')}
        actor={actor}
        features={getReactionFeatures(localReaction)}
        onRemoveFeature={(featureId) => removeFeature('reactionFeatures', featureId)}
        onReorderFeature={(from, to) => moveFeature('reactionFeatures', from, to)}
      />

      <TurnPlanFeatureTable
        tableKey={`reaction-additional-${localReaction.id}`}
        ownerId={localReaction.id}
        panelKind="reaction"
        tableType="additionalFeatures"
        title={FoundryAdapter.localize('TURN_PREP.Reactions.AdditionalFeatures')}
        actor={actor}
        features={getAdditionalFeatures(localReaction)}
        onRemoveFeature={(featureId) => removeFeature('additionalFeatures', featureId)}
        onReorderFeature={(from, to) => moveFeature('additionalFeatures', from, to)}
      />

      <div class={`turn-prep-collapsible reaction-notes ${notesOpen ? 'is-open' : ''}`}>
        <button
          type="button"
          class="turn-prep-collapsible__toggle notes-toggle"
          onclick={() => notesOpen = !notesOpen}
        >
          <i class={`fas fa-chevron-${notesOpen ? 'down' : 'right'}`}></i>
          <span>{FoundryAdapter.localize('TURN_PREP.Reactions.Notes')}</span>
        </button>
        {#if notesOpen}
          <div class="turn-prep-collapsible__body">
            <textarea
              class="turn-prep-textarea notes-input"
              value={localReaction.notes}
              placeholder={FoundryAdapter.localize('TURN_PREP.Reactions.NotesPlaceholder')}
              rows="3"
              oninput={(event) => updateField('notes', (event.currentTarget as HTMLTextAreaElement).value)}
            ></textarea>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>
