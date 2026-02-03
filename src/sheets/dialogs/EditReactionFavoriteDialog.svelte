<script lang="ts">
  import type { ReactionFavoriteSnapshot, Reaction, SelectedFeature } from '../../types';
  import ReactionPlanEditorCard from './ReactionPlanEditorCard.svelte';
  import { generateId, snapshotFeature } from '../../utils/data';

  interface Props {
    actor: any;
    snapshot: ReactionFavoriteSnapshot;
    title: string;
    onSave?: (updated: ReactionFavoriteSnapshot) => void;
    onCancel?: () => void;
    onDirtyChange?: (dirty: boolean) => void;
    onChange?: (working: ReactionFavoriteSnapshot) => void;
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

  function snapshotToReaction(value: ReactionFavoriteSnapshot): Reaction {
    const base = value ?? ({} as ReactionFavoriteSnapshot);
    const id = base.id ?? generateId();
    return {
      id,
      name: base.trigger ?? '',
      trigger: base.trigger ?? '',
      reactionFeatures: (base.reactionFeatures ?? []).map(mapSnapshotFeature),
      additionalFeatures: (base.additionalFeatures ?? []).map(mapSnapshotFeature),
      notes: base.notes ?? '',
      createdTime: base.createdTime ?? Date.now(),
      isFavorite: true,
    } satisfies Reaction;
  }

  function reactionToSnapshot(reaction: Reaction, metaId: string, metaCreated: number): ReactionFavoriteSnapshot {
    return {
      id: metaId,
      createdTime: metaCreated,
      trigger: reaction.trigger ?? reaction.name ?? '',
      reactionFeatures: (reaction.reactionFeatures ?? []).map(snapshotFeature),
      additionalFeatures: (reaction.additionalFeatures ?? []).map(snapshotFeature),
      notes: reaction.notes ?? '',
    } satisfies ReactionFavoriteSnapshot;
  }

  let metaId = generateId();
  let metaCreated = Date.now();
  let workingReaction = $state<Reaction>(snapshotToReaction({} as ReactionFavoriteSnapshot));
  let dirty = $state(false);

  $effect(() => {
    metaId = snapshot?.id ?? metaId;
    metaCreated = snapshot?.createdTime ?? metaCreated;
    const nextReaction = snapshotToReaction(snapshot);
    workingReaction = nextReaction;
    dirty = false;
    onDirtyChange?.(false);
    onChange?.(reactionToSnapshot(nextReaction, metaId, metaCreated));
  });

  function markDirty(next: Reaction) {
    workingReaction = next;
    dirty = true;
    onDirtyChange?.(dirty);
    onChange?.(reactionToSnapshot(next, metaId, metaCreated));
  }

  function handleSave() {
    dirty = false;
    onDirtyChange?.(dirty);
    onSave?.(reactionToSnapshot(workingReaction, metaId, metaCreated));
  }

  function handleCancel() {
    onCancel?.();
  }

  function handleReactionChange(next: Reaction) {
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

  <section class="form-grid single">
    <ReactionPlanEditorCard actor={actor} reaction={workingReaction} onChange={handleReactionChange} notesInitiallyOpen={true} />
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

  .form-grid.single {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
</style>
