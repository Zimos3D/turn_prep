<script lang="ts">
  import { FoundryAdapter } from '../../foundry/FoundryAdapter';
  import type { SelectedFeature } from '../../types/turn-prep.types';

  export type RollDisplay = {
    ability?: string | null;
    value?: number | string | null;
    label?: string | null;
  };

  export type DamageDisplayEntry = {
    formula: string;
    type?: string | null;
    icon?: string | null;
    ariaLabel?: string | null;
  };

  export type DisplayActivity = {
    activityId: string;
    rowKey: string;
    name: string;
    icon?: string | null;
    usesValue?: number | string | null;
    usesMax?: number | string | null;
    timeLabel?: string | null;
    formula?: string | null;
    damageEntries?: DamageDisplayEntry[];
  };

  export type DisplayFeature = SelectedFeature & {
    rowKey: string;
    icon?: string | null;
    usesValue?: number | string | null;
    usesMax?: number | string | null;
    rollLabel?: string | null;
    rollDisplay?: RollDisplay | null;
    formula?: string | null;
    range?: string | null;
    target?: string | null;
    summary?: string | null;
    descriptionHtml?: string | null;
    descriptionRollData?: Record<string, unknown> | null;
    tags?: string[];
    isMissing?: boolean;
    activities?: DisplayActivity[];
    damageEntries?: DamageDisplayEntry[];
  };

  interface Props {
    tableKey: string;
    title: string;
    actor?: any;
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

  const activityColumnWidths = {
    icon: columnWidths.icon,
    name: columnWidths.feature,
    uses: columnWidths.uses,
    time: columnWidths.roll,
    formula: columnWidths.formula,
    actions: columnWidths.actions
  } as const;

  const activityTemplateColumns = [
    activityColumnWidths.icon,
    activityColumnWidths.name,
    activityColumnWidths.uses,
    activityColumnWidths.time,
    activityColumnWidths.formula,
    activityColumnWidths.actions
  ].join(' ');
  const defaultIcon = 'icons/svg/book.svg';

  let {
    title,
    tableKey,
    actor = null,
    features = [],
    emptyMessage = FoundryAdapter.localize('TURN_PREP.TurnPlans.Table.Empty'),
    onRemoveFeature = () => void 0
  }: Props = $props();

  let expanded = $state(true);
  let rowStates = $state<Record<string, boolean>>({});
  let descriptionCache = $state<Record<string, string>>({});
  const pendingDescriptions = new Set<string>();

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

    // Drop description cache for removed rows
    const cacheKeys = Object.keys(descriptionCache);
    if (cacheKeys.some((key) => !validIds.has(key))) {
      const nextCache: Record<string, string> = {};
      for (const key of cacheKeys) {
        if (validIds.has(key)) {
          nextCache[key] = descriptionCache[key];
        }
      }
      descriptionCache = nextCache;
    }

    for (const feature of features) {
      if (!feature.descriptionHtml) continue;
      if (descriptionCache[feature.rowKey]) continue;
      if (pendingDescriptions.has(feature.rowKey)) continue;
      pendingDescriptions.add(feature.rowKey);
      void hydrateDescription(feature);
    }
  });

  async function hydrateDescription(feature: DisplayFeature) {
    try {
      const html = await FoundryAdapter.enrichHtml(feature.descriptionHtml ?? '', {
        rollData: feature.descriptionRollData ?? undefined
      });
      if (!html) return;
      // Ensure the feature is still present
      if (!features.find((entry) => entry.rowKey === feature.rowKey)) {
        return;
      }
      descriptionCache = {
        ...descriptionCache,
        [feature.rowKey]: html
      };
    } catch (error) {
      console.warn('[TurnPlanFeatureTable] Failed to enrich description', error);
    } finally {
      pendingDescriptions.delete(feature.rowKey);
    }
  }

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

  function hasLimitedUses(entry: { usesMax?: number | string | null }): boolean {
    return entry?.usesMax !== undefined && entry?.usesMax !== null && entry?.usesMax !== '';
  }

  function handlePendingActionsClick(event: MouseEvent) {
    event?.preventDefault();
    event?.stopPropagation();
    ui.notifications?.info(FoundryAdapter.localize('TURN_PREP.Messages.NotImplemented'));
  }

  function getFeatureItem(feature: DisplayFeature) {
    return FoundryAdapter.getItemFromActor(actor, feature?.itemId);
  }

  function notifyWarning(key: string, data?: Record<string, string | number>) {
    const message = data
      ? FoundryAdapter.localizeFormat(key, data)
      : FoundryAdapter.localize(key);
    ui.notifications?.warn(message);
  }

  async function handleFeatureRoll(feature: DisplayFeature, event: MouseEvent) {
    event?.preventDefault();
    event?.stopPropagation();

    if (!actor) {
      notifyWarning('TURN_PREP.TurnPlans.Messages.ActorUnavailable');
      return;
    }

    const item = getFeatureItem(feature);
    if (!item) {
      notifyWarning('TURN_PREP.TurnPlans.Messages.ItemUnavailable');
      return;
    }

    try {
      await FoundryAdapter.useItemDocument(item, { event });
    } catch (error) {
      console.error('[TurnPlanFeatureTable] Failed to roll feature', feature.itemName, error);
      notifyWarning('TURN_PREP.TurnPlans.Messages.RollFailed', { feature: feature.itemName });
    }
  }

  async function handleActivityRoll(
    feature: DisplayFeature,
    activity: DisplayActivity,
    event: MouseEvent
  ) {
    event?.preventDefault();
    event?.stopPropagation();

    if (!actor) {
      notifyWarning('TURN_PREP.TurnPlans.Messages.ActorUnavailable');
      return;
    }

    const item = getFeatureItem(feature);
    if (!item) {
      notifyWarning('TURN_PREP.TurnPlans.Messages.ItemUnavailable');
      return;
    }

    const activityDoc = FoundryAdapter.getActivityFromItem(item, activity.activityId);
    if (!activityDoc) {
      notifyWarning('TURN_PREP.TurnPlans.Messages.ActivityUnavailable');
      return;
    }

    try {
      await FoundryAdapter.useActivityDocument(activityDoc, { event });
    } catch (error) {
      console.error('[TurnPlanFeatureTable] Failed to roll activity', activity.name, error);
      notifyWarning('TURN_PREP.TurnPlans.Messages.RollFailed', { feature: activity.name });
    }
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
                <button
                  type="button"
                  class="tidy-table-row-use-button"
                  title={feature.itemName}
                  onclick={(event) => handleFeatureRoll(feature, event)}
                >
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
                  {#if feature.rollDisplay && (feature.rollDisplay.ability || feature.rollDisplay.value)}
                    <div class="stacked roll-display">
                      {#if feature.rollDisplay.ability}
                        <span class="ability uppercase color-text-gold-emphasis font-label-medium">
                          {feature.rollDisplay.ability}
                        </span>
                      {/if}
                      {#if feature.rollDisplay.value}
                        <span class="value font-label-medium">{feature.rollDisplay.value}</span>
                      {/if}
                    </div>
                  {:else}
                    <span>{formatValue(feature.rollLabel)}</span>
                  {/if}
                </div>
                <div
                  class="tidy-table-cell"
                  data-tidy-column-key="formula"
                  style="--tidy-table-column-width: {columnWidths.formula};"
                >
                  {#if feature.damageEntries && feature.damageEntries.length}
                    <div class="damage-list">
                      {#each feature.damageEntries as damageEntry, index (`${feature.rowKey}-damage-${index}`)}
                        <div
                          class="damage-formula-container"
                          title={damageEntry.ariaLabel ?? `${damageEntry.formula}${damageEntry.type ? ` ${damageEntry.type}` : ''}`}
                        >
                          <span class="damage-formula truncate">{damageEntry.formula}</span>
                          {#if damageEntry.icon}
                            <span class="damage-icon" aria-label={damageEntry.ariaLabel ?? damageEntry.type}>
                              <dnd5e-icon src={damageEntry.icon}></dnd5e-icon>
                            </span>
                          {:else if damageEntry.type}
                            <span class="damage-type-label">{damageEntry.type}</span>
                          {/if}
                        </div>
                      {/each}
                    </div>
                  {:else}
                    <span>{formatValue(feature.formula)}</span>
                  {/if}
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
                  <div class="feature-row-details">
                    {#if feature.activities && feature.activities.length}
                      <section
                        class="tidy-table inline-activities-table"
                        data-tidy-section-key={`activities-${feature.rowKey}`}
                        style="--grid-template-columns: {activityTemplateColumns}"
                      >
                        <header class="tidy-table-header-row theme-dark" data-tidy-sheet-part="table-header-row">
                          <div class="tidy-table-header-cell header-label-cell primary">
                            <h3>{FoundryAdapter.localize('TURN_PREP.TurnPlans.Table.Activities')}</h3>
                            <span class="table-header-count">{feature.activities.length}</span>
                          </div>
                          <div
                            class="tidy-table-header-cell"
                            style="--tidy-table-column-width: {activityColumnWidths.uses};"
                          >
                            {FoundryAdapter.localize('TURN_PREP.TurnPlans.Table.Uses')}
                          </div>
                          <div
                            class="tidy-table-header-cell"
                            style="--tidy-table-column-width: {activityColumnWidths.time};"
                          >
                            {FoundryAdapter.localize('TURN_PREP.TurnPlans.Table.Time')}
                          </div>
                          <div
                            class="tidy-table-header-cell"
                            style="--tidy-table-column-width: {activityColumnWidths.formula};"
                          >
                            {FoundryAdapter.localize('TURN_PREP.TurnPlans.Table.Formula')}
                          </div>
                          <div
                            class="tidy-table-header-cell"
                            style="--tidy-table-column-width: {activityColumnWidths.actions};"
                            aria-label={FoundryAdapter.localize('TURN_PREP.Common.Actions')}
                          >
                            &nbsp;
                          </div>
                        </header>

                        <div class="expandable expanded" role="presentation">
                          <div role="presentation" class="expandable-child-animation-wrapper">
                            <div class="item-table-body">
                              {#each feature.activities as activity (activity.rowKey)}
                                <div class="tidy-table-row-container" data-activity-id={activity.activityId}>
                                  <div
                                    class="tidy-table-row tidy-table-row-v2 activity"
                                    style="--grid-template-columns: {activityTemplateColumns};"
                                  >
                                    <button
                                      type="button"
                                      class="tidy-table-row-use-button"
                                      title={activity.name}
                                      onclick={(event) =>
                                        handleActivityRoll(feature, activity, event)}
                                    >
                                      <img
                                        class="item-image"
                                        alt={activity.name}
                                        src={activity.icon || feature.icon || defaultIcon}
                                      />
                                      <span class="roll-prompt"><i class="fa fa-dice-d20"></i></span>
                                    </button>
                                    <div class="tidy-table-cell item-label text-cell primary">
                                      <span class="item-name">
                                        <span class="cell-text">
                                          <span class="cell-name">{activity.name}</span>
                                        </span>
                                      </span>
                                    </div>
                                    <div
                                      class="tidy-table-cell inline-uses"
                                      data-tidy-column-key="uses"
                                      style="--tidy-table-column-width: {activityColumnWidths.uses};"
                                    >
                                      {#if hasLimitedUses(activity)}
                                        <input type="text" class="uninput uses-value" value={activity.usesValue ?? ''} readonly />
                                        <span class="divider">/</span>
                                        <span class="uses-max">{formatValue(activity.usesMax)}</span>
                                      {:else}
                                        <span class="color-text-disabled">—</span>
                                      {/if}
                                    </div>
                                    <div
                                      class="tidy-table-cell"
                                      data-tidy-column-key="time"
                                      style="--tidy-table-column-width: {activityColumnWidths.time};"
                                    >
                                      <span>{formatValue(activity.timeLabel)}</span>
                                    </div>
                                    <div
                                      class="tidy-table-cell"
                                      data-tidy-column-key="formula"
                                      style="--tidy-table-column-width: {activityColumnWidths.formula};"
                                    >
                                      {#if activity.damageEntries && activity.damageEntries.length}
                                        <div class="damage-list">
                                          {#each activity.damageEntries as damageEntry, index (`${activity.rowKey}-damage-${index}`)}
                                            <div
                                              class="damage-formula-container"
                                              title={damageEntry.ariaLabel ?? `${damageEntry.formula}${damageEntry.type ? ` ${damageEntry.type}` : ''}`}
                                            >
                                              <span class="damage-formula truncate">{damageEntry.formula}</span>
                                              {#if damageEntry.icon}
                                                <span class="damage-icon" aria-label={damageEntry.ariaLabel ?? damageEntry.type}>
                                                  <dnd5e-icon src={damageEntry.icon}></dnd5e-icon>
                                                </span>
                                              {:else if damageEntry.type}
                                                <span class="damage-type-label">{damageEntry.type}</span>
                                              {/if}
                                            </div>
                                          {/each}
                                        </div>
                                      {:else}
                                        <span>{formatValue(activity.formula)}</span>
                                      {/if}
                                    </div>
                                    <div
                                      class="tidy-table-cell tidy-table-actions"
                                      data-tidy-column-key="actions"
                                      style="--tidy-table-column-width: {activityColumnWidths.actions};"
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
                                </div>
                              {/each}
                            </div>
                          </div>
                        </div>
                      </section>
                    {/if}

                    <div class="editor-rendered-content">
                      {#if descriptionCache[feature.rowKey]}
                        <div class="feature-description rich-text" aria-label={feature.itemName}>
                          {@html descriptionCache[feature.rowKey]}
                        </div>
                      {:else}
                        <p>{feature.summary || noDetails}</p>
                      {/if}
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
            </div>
          {/each}
        {/if}
      </div>
    </div>
  </div>
</section>

<style lang="less">
  .turn-plan-feature-table {
    margin-bottom: 0.25rem;
    
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

    .feature-row-details {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .inline-activities-table {
      padding: 0.5rem 0.75rem 0.75rem;
      border-radius: 0.5rem;
      background: var(--t5e-panel-muted-bg, rgba(0, 0, 0, 0.05));

      .tidy-table-header-row {
        cursor: default;
      }

      .tidy-table-row.activity {
        gap: 0.25rem;
      }
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

    .roll-display {
      align-items: center;
      gap: 0.125rem;
    }

    .damage-list {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .damage-formula-container {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .damage-formula {
      max-width: 4rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .damage-icon dnd5e-icon {
      width: 1rem;
      height: 1rem;
      display: inline-flex;
    }

    .damage-type-label {
      font-size: 0.75rem;
      text-transform: capitalize;
      color: var(--t5e-text-muted, #7a7971);
    }

    .feature-description {
      font-size: 0.875rem;
      line-height: 1.35;
      color: inherit;
    }

    .feature-description :global(p) {
      margin: 0 0 0.5rem;
    }

    .tidy-table-summary-actions button {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
    }
  }
</style>
