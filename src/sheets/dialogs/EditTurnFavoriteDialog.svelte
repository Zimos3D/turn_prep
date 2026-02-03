<script lang="ts">
  import type { TurnSnapshot, TurnPlan, SelectedFeature } from '../../types';
  import TurnPlanEditorCard from './TurnPlanEditorCard.svelte';
  import { generateId, snapshotFeature } from '../../utils/data';

  interface Props {
    actor: any;
    snapshot: TurnSnapshot;
    title: string;
    onSave?: (updated: TurnSnapshot) => void;
    onCancel?: () => void;
    onDirtyChange?: (dirty: boolean) => void;
    onChange?: (working: TurnSnapshot) => void;
  }

  const { actor, snapshot, title, onSave, onCancel, onDirtyChange, onChange }: Props = $props();

  function mapSnapshotFeature(feature: any): SelectedFeature {
    return {
      itemId: feature?.itemId ?? '',
      itemName: feature?.itemName ?? '',
      itemType: feature?.itemType ?? '',
      actionType: feature?.actionType ?? '',
    } satisfies SelectedFeature;
  }

  function snapshotToPlan(value: TurnSnapshot): TurnPlan {
    const base = value ?? ({} as TurnSnapshot);
    const id = base.id ?? generateId();
    return {
      id,
      name: base.planName ?? '',
      trigger: base.trigger ?? '',
      actions: (base.actions ?? []).map(mapSnapshotFeature),
      bonusActions: (base.bonusActions ?? []).map(mapSnapshotFeature),
      reactions: (base.reactions ?? []).map(mapSnapshotFeature),
      movement: base.movement ?? '',
      roleplay: base.roleplay ?? '',
      additionalFeatures: (base.additionalFeatures ?? []).map(mapSnapshotFeature),
      categories: base.categories ?? [],
    } satisfies TurnPlan;
  }

  function planToSnapshot(plan: TurnPlan, metaId: string, metaCreated: number): TurnSnapshot {
    return {
      id: metaId,
      createdTime: metaCreated,
      planName: plan.name ?? '',
      trigger: plan.trigger ?? '',
      actions: (plan.actions ?? []).map(snapshotFeature),
      bonusActions: (plan.bonusActions ?? []).map(snapshotFeature),
      reactions: (plan.reactions ?? []).map(snapshotFeature),
      movement: plan.movement ?? '',
      roleplay: plan.roleplay ?? '',
      additionalFeatures: (plan.additionalFeatures ?? []).map(snapshotFeature),
      categories: plan.categories ?? [],
    } satisfies TurnSnapshot;
  }

  let metaId = generateId();
  let metaCreated = Date.now();
  let workingPlan = $state<TurnPlan>(snapshotToPlan({} as TurnSnapshot));
  let dirty = $state(false);

  $effect(() => {
    metaId = snapshot?.id ?? metaId;
    metaCreated = snapshot?.createdTime ?? metaCreated;
    const nextPlan = snapshotToPlan(snapshot);
    workingPlan = nextPlan;
    dirty = false;
    onDirtyChange?.(false);
    onChange?.(planToSnapshot(nextPlan, metaId, metaCreated));
  });

  function markDirty(next: TurnPlan) {
    workingPlan = next;
    dirty = true;
    onDirtyChange?.(dirty);
    onChange?.(planToSnapshot(next, metaId, metaCreated));
  }

  function handleSave() {
    dirty = false;
    onDirtyChange?.(dirty);
    onSave?.(planToSnapshot(workingPlan, metaId, metaCreated));
  }

  function handleCancel() {
    onCancel?.();
  }

  function handlePlanChange(next: TurnPlan) {
    metaId = next.id ?? metaId;
    markDirty(next);
  }
</script>

<div class="edit-dialog">
  <header class="dialog-header">
    <div class="title">{title}</div>
    <div class="actions">
      <button class="icon" aria-label="Save" onclick={handleSave}>
        <i class="fa-solid fa-floppy-disk"></i>
      </button>
      <button class="icon" aria-label="Cancel" onclick={handleCancel}>
        <i class="fa-solid fa-xmark"></i>
      </button>
      <div class="divider"></div>
      <div class="menu">
        <button class="icon" aria-label="More" title="More">
          <i class="fa-solid fa-ellipsis-vertical"></i>
        </button>
        <div class="menu-content">
          <button onclick={handleSave}><i class="fa-solid fa-floppy-disk"></i> Save</button>
          <button onclick={handleCancel}><i class="fa-solid fa-xmark"></i> Cancel</button>
        </div>
      </div>
    </div>
  </header>

  <section class="form-grid">
    <TurnPlanEditorCard actor={actor} plan={workingPlan} onChange={handlePlanChange} notesInitiallyOpen={true} />
  </section>
</div>

<style>
  .edit-dialog {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 0.75rem;
  }

  .dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .title {
    font-weight: 700;
    font-size: 1.05rem;
  }

  .actions {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
  }

  .icon {
    border: none;
    background: transparent;
    cursor: pointer;
    padding: 0.25rem;
    color: inherit;
  }

  .icon:hover {
    opacity: 0.8;
  }

  .divider {
    width: 1px;
    height: 1.25rem;
    background: var(--t5e-faint-color, currentColor);
    margin: 0 0.25rem;
  }

  .menu {
    position: relative;
  }

  .menu-content {
    display: none;
    position: absolute;
    right: 0;
    top: 1.6rem;
    background: var(--t5e-context-menu-bg, #111);
    border: 1px solid var(--t5e-faint-color, currentColor);
    border-radius: 6px;
    padding: 0.25rem;
    min-width: 140px;
    z-index: 9999;
  }

  .menu:hover .menu-content {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .menu-content button {
    border: none;
    background: transparent;
    text-align: left;
    padding: 0.35rem 0.45rem;
    color: inherit;
    border-radius: 4px;
  }

  .menu-content button:hover {
    background: var(--t5e-faint-color, rgba(255,255,255,0.08));
  }

  .form-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
</style>
