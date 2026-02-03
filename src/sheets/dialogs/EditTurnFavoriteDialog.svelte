<script lang="ts">
  import type { TurnSnapshot } from '../../types';

  interface Props {
    snapshot: TurnSnapshot;
    title: string;
    onSave?: (updated: TurnSnapshot) => void;
    onCancel?: () => void;
    onDirtyChange?: (dirty: boolean) => void;
    onChange?: (working: TurnSnapshot) => void;
  }

  const { snapshot, title, onSave, onCancel, onDirtyChange, onChange }: Props = $props();

  function clone<T>(value: T): T {
    return value ? JSON.parse(JSON.stringify(value)) as T : value;
  }

  function normalizeSnapshot(value: TurnSnapshot): TurnSnapshot {
    const base = clone(value) || ({} as TurnSnapshot);
    return {
      id: base.id,
      createdTime: base.createdTime ?? Date.now(),
      planName: base.planName ?? '',
      actions: base.actions ?? [],
      bonusActions: base.bonusActions ?? [],
      reactions: base.reactions ?? [],
      movement: base.movement ?? '',
      trigger: base.trigger ?? '',
      additionalFeatures: base.additionalFeatures ?? [],
      categories: base.categories ?? [],
      roleplay: base.roleplay ?? '',
    } as TurnSnapshot;
  }

  const emptySnapshot = normalizeSnapshot({} as TurnSnapshot);
  let working = $state<TurnSnapshot>(emptySnapshot);
  let dirty = $state(false);

  $effect(() => {
    // Reset when incoming snapshot changes
    working = normalizeSnapshot(snapshot);
    dirty = false;
    onDirtyChange?.(dirty);
    onChange?.(working);
  });

  function markDirty(next: TurnSnapshot) {
    working = next;
    dirty = true;
    onDirtyChange?.(dirty);
    onChange?.(working);
  }

  function updateField(field: keyof TurnSnapshot, value: any) {
    markDirty({ ...working, [field]: value });
  }

  function removeFeature(key: 'actions' | 'bonusActions' | 'reactions' | 'additionalFeatures', index: number) {
    const updated = { ...working, [key]: (working[key] ?? []).filter((_, i) => i !== index) };
    markDirty(updated);
  }

  function handleSave() {
    dirty = false;
    onDirtyChange?.(dirty);
    onSave?.(working);
  }

  function handleCancel() {
    onCancel?.();
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
    <label>
      <span>Name</span>
      <input value={working.planName} oninput={(e) => updateField('planName', (e.currentTarget as HTMLInputElement).value)} />
    </label>
    <label>
      <span>Trigger</span>
      <input value={working.trigger} oninput={(e) => updateField('trigger', (e.currentTarget as HTMLInputElement).value)} />
    </label>
    <label>
      <span>Movement</span>
      <input value={working.movement} oninput={(e) => updateField('movement', (e.currentTarget as HTMLInputElement).value)} />
    </label>
    <label>
      <span>Roleplay / Notes</span>
      <textarea rows="3" value={working.roleplay} oninput={(e) => updateField('roleplay', (e.currentTarget as HTMLTextAreaElement).value)}></textarea>
    </label>
  </section>

  <section class="feature-section">
    <h3>Actions</h3>
    {#if working.actions.length === 0}
      <div class="empty">None</div>
    {:else}
      {#each working.actions as feature, index}
        <div class="feature-row">
          <span>{feature.itemName}</span>
          <button class="icon" aria-label="Remove" onclick={() => removeFeature('actions', index)}>
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      {/each}
    {/if}
  </section>

  <section class="feature-section">
    <h3>Bonus Actions</h3>
    {#if working.bonusActions.length === 0}
      <div class="empty">None</div>
    {:else}
      {#each working.bonusActions as feature, index}
        <div class="feature-row">
          <span>{feature.itemName}</span>
          <button class="icon" aria-label="Remove" onclick={() => removeFeature('bonusActions', index)}>
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      {/each}
    {/if}
  </section>

  <section class="feature-section">
    <h3>Reactions</h3>
    {#if working.reactions.length === 0}
      <div class="empty">None</div>
    {:else}
      {#each working.reactions as feature, index}
        <div class="feature-row">
          <span>{feature.itemName}</span>
          <button class="icon" aria-label="Remove" onclick={() => removeFeature('reactions', index)}>
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      {/each}
    {/if}
  </section>

  <section class="feature-section">
    <h3>Additional Features</h3>
    {#if working.additionalFeatures.length === 0}
      <div class="empty">None</div>
    {:else}
      {#each working.additionalFeatures as feature, index}
        <div class="feature-row">
          <span>{feature.itemName}</span>
          <button class="icon" aria-label="Remove" onclick={() => removeFeature('additionalFeatures', index)}>
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      {/each}
    {/if}
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
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }

  .form-grid label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .form-grid input,
  .form-grid textarea {
    width: 100%;
  }

  .feature-section {
    border: 1px solid var(--t5e-faint-color, currentColor);
    border-radius: 6px;
    padding: 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .feature-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.35rem;
    padding: 0.25rem 0;
  }

  .empty {
    color: var(--t5e-tertiary-color, inherit);
    font-style: italic;
  }
</style>
