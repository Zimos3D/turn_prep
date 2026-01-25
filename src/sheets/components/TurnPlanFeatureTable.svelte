<script lang="ts">
  import { FoundryAdapter } from '../../foundry/FoundryAdapter';
  import type { SelectedFeature } from '../../types/turn-prep.types';

  export type DisplayFeature = SelectedFeature & {
    rowKey: string;
    icon?: string | null;
    usesValue?: number | string | null;
    usesMax?: number | string | null;
    rollLabel?: string | null;
    formula?: string | null;
    range?: string | null;
    target?: string | null;
    summary?: string | null;
    tags?: string[];
    isMissing?: boolean;
  };

  interface Props {
    tableKey: string;
    title: string;
    features?: DisplayFeature[];
    emptyMessage?: string;
    onRemoveFeature?: (featureId: string) => void;
  }

  const columnWidths = {
    icon: '2.25rem',
    feature: 'minmax(0, 1fr)',
    uses: '5rem',
    roll: '3.125rem',
    formula: '5rem',
    range: '5rem',
    target: '5rem',
    actions: '1.6875rem'
  } as const;

  const templateColumns = [
    columnWidths.icon,
    columnWidths.feature,
    columnWidths.uses,
    columnWidths.roll,
    columnWidths.formula,
    columnWidths.range,
    columnWidths.target,
    columnWidths.actions
  ].join(' ');
  const defaultIcon = 'icons/svg/book.svg';

  let {
    title,
    tableKey,
    features = [],
    emptyMessage = FoundryAdapter.localize('TURN_PREP.TurnPlans.Table.Empty'),
    onRemoveFeature = () => void 0
  }: Props = $props();

  let expanded = $state(true);
  let rowStates = $state<Record<string, boolean>>({});

  $effect(() => {
    // Drop row expansion state when features change
    const validIds = new Set(features.map((feature) => feature.rowKey));
    let changed = false;
    const nextStates = { ...rowStates };

    for (const id of Object.keys(nextStates)) {
      if (!validIds.has(id)) {
        delete nextStates[id];
        changed = true;
      }
    }

    if (changed) {
      rowStates = nextStates;
    }
  });

  function toggleTable() {
    expanded = !expanded;
  }

  function handleHeaderKey(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleTable();
    }
  }

  function toggleRow(rowKey: string) {
    rowStates = {
      ...rowStates,
      [rowKey]: !rowStates[rowKey]
    };
  }

  function formatValue(value?: string | number | null) {
    if (value === undefined || value === null || value === '') {
      return '—';
    }
    return value;
  }

  function getTags(feature: DisplayFeature) {
    const tags = feature.tags ?? [];
    if (!tags.length) {
      return [feature.itemType, feature.actionType].filter(Boolean);
    }
    return tags;
  }

  const noDetails = FoundryAdapter.localize('TURN_PREP.TurnPlans.Table.NoDetails');

  function hasLimitedUses(feature: DisplayFeature): boolean {
    return feature.usesMax !== undefined && feature.usesMax !== null && feature.usesMax !== '';
  }

  function handlePendingActionsClick(event: MouseEvent) {
    event?.preventDefault();
    event?.stopPropagation();
    ui.notifications?.info(FoundryAdapter.localize('TURN_PREP.Messages.NotImplemented'));
  }
</script>

<section
  class="tidy-table turn-plan-feature-table"
  data-tidy-section-key={tableKey}
  style="--grid-template-columns: {templateColumns}"
>
  <header
    class="tidy-table-header-row toggleable"
    data-tidy-sheet-part="table-header-row"
    role="button"
    tabindex="0"
    onclick={toggleTable}
    onkeydown={handleHeaderKey}
  >
    <div
      class="tidy-table-header-cell icon-column"
      aria-hidden="true"
      style="--tidy-table-column-width: {columnWidths.icon};"
    ></div>
    <div class="tidy-table-header-cell header-label-cell primary">
      <div class="button expand-button {expanded ? 'expanded' : ''}">
        <i class="fa-solid fa-chevron-right"></i>
      </div>
      <h3>{title}</h3>
      <span class="table-header-count">{features.length}</span>
    </div>
    <div
      class="tidy-table-header-cell"
      data-tidy-column-key="uses"
      style="--tidy-table-column-width: {columnWidths.uses};"
    >
      {FoundryAdapter.localize('TURN_PREP.TurnPlans.Table.Uses')}
    </div>
    <div
      class="tidy-table-header-cell"
      data-tidy-column-key="roll"
      style="--tidy-table-column-width: {columnWidths.roll};"
    >
      {FoundryAdapter.localize('TURN_PREP.TurnPlans.Table.Roll')}
    </div>
    <div
      class="tidy-table-header-cell"
      data-tidy-column-key="formula"
      style="--tidy-table-column-width: {columnWidths.formula};"
    >
      {FoundryAdapter.localize('TURN_PREP.TurnPlans.Table.Formula')}
    </div>
    <div
      class="tidy-table-header-cell"
      data-tidy-column-key="range"
      style="--tidy-table-column-width: {columnWidths.range};"
    >
      {FoundryAdapter.localize('TURN_PREP.TurnPlans.Table.Range')}
    </div>
    <div
      class="tidy-table-header-cell"
      data-tidy-column-key="target"
      style="--tidy-table-column-width: {columnWidths.target};"
    >
      {FoundryAdapter.localize('TURN_PREP.TurnPlans.Table.Target')}
    </div>
    <div
      class="tidy-table-header-cell header-cell-actions"
      data-tidy-column-key="actions"
      style="--tidy-table-column-width: {columnWidths.actions};"
      aria-label={FoundryAdapter.localize('TURN_PREP.Common.Actions')}
    >
      &nbsp;
    </div>
  </header>

  <div class={`expandable ${expanded ? 'expanded' : ''}`} role="presentation">
    <div role="presentation" class="expandable-child-animation-wrapper">
      <div class="item-table-body">
        {#if !features.length}
          <div class="tidy-table-row-container empty">
            <div class="tidy-table-row" style="--grid-template-columns: {templateColumns};">
              <div class="tidy-table-cell primary" style="grid-column: span 8; justify-content: center;">
                {emptyMessage}
              </div>
            </div>
          </div>
        {:else}
          {#each features as feature (feature.rowKey)}
            <div class="tidy-table-row-container" data-item-id={feature.itemId}>
              <div
                class={`tidy-table-row tidy-table-row-v2 ${rowStates[feature.rowKey] ? 'expanded' : ''} ${feature.isMissing ? 'missing' : ''}`}
                style="--grid-template-columns: {templateColumns};"
              >
                <button type="button" class="tidy-table-row-use-button" title={feature.itemName}>
                  <img class="item-image" alt={feature.itemName} src={feature.icon || defaultIcon} />
                  <span class="roll-prompt"><i class="fa fa-dice-d20"></i></span>
                </button>
                <div class="tidy-table-cell item-label text-cell primary" data-tidy-column-key="feature">
                  <button type="button" class="item-name" onclick={() => toggleRow(feature.rowKey)}>
                    <span class="cell-text">
                      <span class="cell-name">{feature.itemName}</span>
                    </span>
                    <span class="row-detail-expand-indicator">
                      <i class={`fa-solid fa-angle-right expand-indicator ${rowStates[feature.rowKey] ? 'expanded' : ''}`}></i>
                    </span>
                  </button>
                </div>
                <div
                  class="tidy-table-cell inline-uses"
                  data-tidy-column-key="uses"
                  style="--tidy-table-column-width: {columnWidths.uses};"
                >
                  {#if hasLimitedUses(feature)}
                    <input type="text" class="uninput uses-value" value={feature.usesValue ?? ''} readonly />
                    <span class="divider">/</span>
                    <span class="uses-max">{formatValue(feature.usesMax)}</span>
                  {:else}
                    <span class="color-text-disabled">—</span>
                  {/if}
                </div>
                <div
                  class="tidy-table-cell"
                  data-tidy-column-key="roll"
                  style="--tidy-table-column-width: {columnWidths.roll};"
                >
                  <span>{formatValue(feature.rollLabel)}</span>
                </div>
                <div
                  class="tidy-table-cell"
                  data-tidy-column-key="formula"
                  style="--tidy-table-column-width: {columnWidths.formula};"
                >
                  <span>{formatValue(feature.formula)}</span>
                </div>
                <div
                  class="tidy-table-cell"
                  data-tidy-column-key="range"
                  style="--tidy-table-column-width: {columnWidths.range};"
                >
                  <span>{formatValue(feature.range)}</span>
                </div>
                <div
                  class="tidy-table-cell"
                  data-tidy-column-key="target"
                  style="--tidy-table-column-width: {columnWidths.target};"
                >
                  <span>{formatValue(feature.target)}</span>
                </div>
                <div
                  class="tidy-table-cell tidy-table-actions"
                  data-tidy-column-key="actions"
                  style="--tidy-table-column-width: {columnWidths.actions};"
                >
                  <button
                    type="button"
                    class="tidy-table-button"
                    title={FoundryAdapter.localize('TURN_PREP.Messages.NotImplemented')}
                    aria-label={FoundryAdapter.localize('TURN_PREP.Common.Actions')}
                    onclick={handlePendingActionsClick}
                  >
                    <i class="fa-solid fa-ellipsis-vertical"></i>
                  </button>
                </div>
              </div>

              <div class={`expandable ${rowStates[feature.rowKey] ? 'expanded' : ''}`} role="presentation">
                <div role="presentation" class="expandable-child-animation-wrapper">
                  <div class="editor-rendered-content">
                    <p>{feature.summary || noDetails}</p>
                    <div class="item-property-tags">
                      {#each getTags(feature) as tag (tag)}
                        <span class="tag"><span class="value">{tag}</span></span>
                      {/each}
                    </div>
                    <div class="tidy-table-summary-actions">
                      <button type="button" title={FoundryAdapter.localize('TURN_PREP.Common.ComingSoon')}>
                        <i class="fa-solid fa-message-arrow-up-right"></i>
                        {FoundryAdapter.localize('TURN_PREP.TurnPlans.Table.DisplayInChat')}
                      </button>
                      <button type="button" title={FoundryAdapter.localize('TURN_PREP.Common.ComingSoon')}>
                        <i class="fas fa-dice-d20"></i>
                        {FoundryAdapter.localize('TURN_PREP.TurnPlans.Table.RollAction')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          {/each}
        {/if}
      </div>
    </div>
  </div>
</section>

<style lang="less">
  .turn-plan-feature-table {
    margin-bottom: 0.75rem;

    .tidy-table-header-row h3 {
      margin: 0;
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .tidy-table-header-row {
      outline: none;
    }

    .tidy-table-header-row:focus-visible {
      box-shadow: 0 0 0 2px var(--t5e-primary-accent-color, #4b4a44);
    }

    .tidy-table-row-use-button,
    .tidy-table-cell .item-name,
    .tidy-table-button {
      background: none;
      border: none;
      padding: 0;
      font: inherit;
      color: inherit;
      cursor: pointer;
    }

    .tidy-table-row-use-button {
      display: flex;
    }

    .tidy-table-row-container.empty {
      background: transparent;
      margin-left: 0;
    }

    .tidy-table-cell.item-label {
      justify-content: flex-start;

      .item-name {
        justify-content: flex-start;
      }
    }

    .inline-uses {
      input.uninput {
        width: 2rem;
        text-align: right;
        border: none;
        background: transparent;
        color: inherit;
        pointer-events: none;
      }
    }

    .tidy-table-summary-actions button {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
    }
  }
</style>
