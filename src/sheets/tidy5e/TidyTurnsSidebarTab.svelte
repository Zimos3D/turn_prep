<script lang="ts">
  import { onMount } from 'svelte';
  import type { Actor5e } from '../../foundry/foundry.types';
  import type {
    SnapshotFeature,
    TurnPlan,
    TurnSnapshot,
    ReactionFavoriteSnapshot,
    TurnPrepData,
    SelectedFeature,
    Reaction
  } from '../../types';
  import { FoundryAdapter } from '../../foundry/FoundryAdapter';
  import { TurnPrepStorage } from '../../features/data/TurnPrepStorage';
  import { editSessionStore, type EditSession } from '../../features/edit-mode/EditSessionStore';
  import { TAB_ID_MAIN, FLAG_SCOPE, FLAG_KEY_DATA, AUTO_SAVE_DEBOUNCE_MS } from '../../constants';
  import { generateId, limitHistory, moveArrayItem } from '../../utils/data';
  import * as SettingsModule from '../../settings/settings';
  import ContextMenuHost from '../components/context-menu/ContextMenuHost.svelte';
  import { ContextMenuController } from '../../features/context-menu/ContextMenuController';
  import type { ContextMenuAction, ContextMenuSection } from '../../features/context-menu/context-menu.types';
  import { buildReorderActions, buildArrangeSubmenuSection, buildArrangeParentAction } from '../../features/context-menu/menu-builders';

  interface Props {
    actor: Actor5e;
  }

  type SidebarCardVariant = 'turn' | 'reaction' | 'recent';

  interface SidebarCard {
    id: string;
    title: string;
    actionsHtml?: string;
    bonusHtml?: string;
    reactionsHtml?: string;
    additionalHtml: string;
    source: TurnSnapshot | ReactionFavoriteSnapshot;
    section: 'favorites-turn' | 'favorites-reaction' | 'recent';
    variant: SidebarCardVariant;
  }

  let { actor }: Props = $props();

  let favoriteTurns: SidebarCard[] = $state([]);
  let favoriteReactions: SidebarCard[] = $state([]);
  let recentTurns: SidebarCard[] = $state([]);
  let loading = $state(false);
  let expandedCards = $state<Set<string>>(new Set());
  const contextMenuController = new ContextMenuController('turn-prep-sidebar');
  let openMenuId = $state<string | null>(null);
  let saveTimeout: number | null = null;
  const hookCleanups: Array<() => void> = [];

  const collapseKeys = ['favoritesTurn', 'favoritesReaction', 'recent'] as const;
  type CollapseKey = typeof collapseKeys[number];
  let collapsed = $state<Record<CollapseKey, boolean>>({
    favoritesTurn: false,
    favoritesReaction: false,
    recent: false,
  });

  const sectionIcons: Record<CollapseKey, string> = {
    favoritesTurn: 'fa-solid fa-hourglass',
    favoritesReaction: 'fa-solid fa-retweet',
    recent: 'fa-solid fa-history',
  };

  const sectionTitles: Record<CollapseKey, string> = {
    favoritesTurn: 'TURN_PREP.Sidebar.FavoritesTurn',
    favoritesReaction: 'TURN_PREP.Sidebar.FavoritesReaction',
    recent: 'TURN_PREP.Sidebar.Recent',
  };

  onMount(() => {
    restoreCollapseState();
    registerHook('updateActor', onActorUpdated);
    void refreshData();

    const unsubscribeContextMenu = contextMenuController.subscribe((state) => {
      openMenuId = state?.isOpen ? state.context?.cardId as string ?? null : null;
    });

    return () => {
      cleanupHooks();
      unsubscribeContextMenu();
    };
  });

  function registerHook(hookName: string, handler: (...args: any[]) => void) {
    if (typeof Hooks === 'undefined') return;
    const hookId = Hooks.on(hookName, handler);
    hookCleanups.push(() => Hooks.off(hookName, hookId));
  }

  function cleanupHooks() {
    while (hookCleanups.length) {
      const dispose = hookCleanups.pop();
      dispose?.();
    }
  }

  function hasTurnPrepFlagChange(changes: any): boolean {
    return !!changes?.flags?.[FLAG_SCOPE]?.[FLAG_KEY_DATA];
  }

  function onActorUpdated(updatedActor: any, changes: any) {
    if (!actor || updatedActor?.id !== actor.id) return;
    if (hasTurnPrepFlagChange(changes)) {
      void refreshData();
    }
  }

  function collapseStorageKey(section: CollapseKey): string {
    return `turn-prep-sidebar-${actor?.id ?? 'unknown'}-${section}`;
  }

  function restoreCollapseState() {
    if (typeof sessionStorage === 'undefined') return;
    for (const key of collapseKeys) {
      const raw = sessionStorage.getItem(collapseStorageKey(key));
      if (raw === 'collapsed') {
        collapsed = { ...collapsed, [key]: true };
      }
    }
  }

  function persistCollapseState(section: CollapseKey, value: boolean) {
    if (typeof sessionStorage === 'undefined') return;
    sessionStorage.setItem(collapseStorageKey(section), value ? 'collapsed' : 'expanded');
  }

  function toggleSection(section: CollapseKey) {
    collapsed = { ...collapsed, [section]: !collapsed[section] };
    persistCollapseState(section, collapsed[section]);
  }

  function snapshotToPlan(snapshot: TurnSnapshot): TurnPlan {
    const mapFeature = (f: SnapshotFeature) => ({
      itemId: f.itemId,
      itemName: f.itemName,
      itemType: f.itemType,
      actionType: f.actionType,
    });

    return {
      id: generateId(),
      name: snapshot.planName || FoundryAdapter.localize('TURN_PREP.Sidebar.UntitledPlan'),
      trigger: snapshot.trigger || '',
      actions: (snapshot.actions ?? []).map(mapFeature),
      bonusActions: (snapshot.bonusActions ?? []).map(mapFeature),
      reactions: (snapshot.reactions ?? []).map(mapFeature),
      movement: snapshot.movement ?? '',
      roleplay: snapshot.roleplay ?? '',
      additionalFeatures: (snapshot.additionalFeatures ?? []).map(mapFeature),
      categories: snapshot.categories ?? [],
    };
  }

  async function enrichFeatures(features: SnapshotFeature[]): Promise<string> {
    if (!features || features.length === 0) {
      return FoundryAdapter.localize('TURN_PREP.Sidebar.None');
    }

    const actorId = actor?.id ?? 'unknown';
    const raw = features
      .map((f) => `@UUID[Actor.${actorId}.Item.${f.itemId}]{${f.itemName || FoundryAdapter.localize('TURN_PREP.Sidebar.MissingFeature')}}`)
      .join(', ');

    const enriched = await FoundryAdapter.enrichHtml(raw, { async: true });
    return enriched ?? raw;
  }

  async function toCard(snapshot: TurnSnapshot, section: SidebarCard['section']): Promise<SidebarCard> {
    const [actionsHtml, bonusHtml, additionalHtml] = await Promise.all([
      enrichFeatures(snapshot.actions ?? []),
      enrichFeatures(snapshot.bonusActions ?? []),
      enrichFeatures(snapshot.additionalFeatures ?? []),
    ]);

    const title = section === 'favorites-reaction'
      ? (snapshot.planName || snapshot.trigger || FoundryAdapter.localize('TURN_PREP.Sidebar.UntitledPlan'))
      : (snapshot.planName || FoundryAdapter.localize('TURN_PREP.Sidebar.UntitledPlan'));

    return {
      id: snapshot.id,
      title,
      actionsHtml,
      bonusHtml,
      additionalHtml,
      source: snapshot,
      section,
      variant: section === 'recent' ? 'recent' : 'turn',
    };
  }

  function snapshotToReactionPlan(snapshot: ReactionFavoriteSnapshot): Reaction {
    const toSelected = (f: SnapshotFeature): SelectedFeature => ({
      itemId: f.itemId,
      itemName: f.itemName,
      itemType: f.itemType,
      actionType: f.actionType,
    });

    return {
      id: generateId(),
      name: snapshot.trigger || FoundryAdapter.localize('TURN_PREP.Sidebar.UntitledPlan'),
      trigger: snapshot.trigger || '',
      reactionFeatures: (snapshot.reactionFeatures ?? []).map(toSelected),
      additionalFeatures: (snapshot.additionalFeatures ?? []).map(toSelected),
      notes: snapshot.notes ?? '',
      createdTime: Date.now(),
      isFavorite: true,
    };
  }

  async function toReactionCard(snapshot: ReactionFavoriteSnapshot): Promise<SidebarCard> {
    const [reactionsHtml, additionalHtml] = await Promise.all([
      enrichFeatures(snapshot.reactionFeatures ?? []),
      enrichFeatures(snapshot.additionalFeatures ?? []),
    ]);

    const title = snapshot.trigger || FoundryAdapter.localize('TURN_PREP.Sidebar.UntitledPlan');

    return {
      id: snapshot.id,
      title,
      reactionsHtml,
      additionalHtml,
      source: snapshot,
      section: 'favorites-reaction',
      variant: 'reaction',
    };
  }

  async function refreshData() {
    if (!actor) return;
    loading = true;
    try {
      const data = await TurnPrepStorage.load(actor);
      const limit = SettingsModule.getHistoryLimitForActor(actor);
      const recentSnapshots = limitHistory(data.history ?? [], limit).slice().reverse(); // newest-first

      const favTurns: SidebarCard[] = [];
      const favReactions: SidebarCard[] = [];

      const legacyFavorites: TurnSnapshot[] = ((data as any)?.favorites ?? []) as TurnSnapshot[];
      for (const snap of data.favoritesTurn ?? legacyFavorites) {
        favTurns.push(await toCard(snap, 'favorites-turn'));
      }

      for (const snap of data.favoritesReaction ?? []) {
        favReactions.push(await toReactionCard(snap));
      }

      const recentCards: SidebarCard[] = [];
      for (const snap of recentSnapshots) {
        recentCards.push(await toCard(snap, 'recent'));
      }

      favoriteTurns = favTurns;
      favoriteReactions = favReactions;
      recentTurns = recentCards;
    } catch (err) {
      logError('Failed to load sidebar data', err as Error);
    } finally {
      loading = false;
    }
  }

  async function updateData(mutator: (data: TurnPrepData) => void, save: boolean = true) {
    if (!actor) return;
    const data = await TurnPrepStorage.load(actor);
    mutator(data);
    if (save) {
      await TurnPrepStorage.save(actor, data);
    }
  }

  function scheduleAutoSave() {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    saveTimeout = window.setTimeout(async () => {
      saveTimeout = null;
      if (!actor) return;
      const data = await TurnPrepStorage.load(actor);
      
      // We must only update the favorite arrays during minimal autosave
      // to avoid race conditions with other updates
      data.favoritesTurn = favoriteTurns.map(c => c.source as TurnSnapshot);
      data.favoritesReaction = favoriteReactions.map(c => c.source as ReactionFavoriteSnapshot);
      
      await TurnPrepStorage.save(actor, data);
      await refreshData();
    }, AUTO_SAVE_DEBOUNCE_MS);
  }

  async function handleLoad(card: SidebarCard) {
    await updateData((data) => {
      if (card.variant === 'reaction') {
        const snapshot = card.source as ReactionFavoriteSnapshot;
        const reactionPlan = snapshotToReactionPlan(snapshot);
        data.reactions = [...(data.reactions ?? []), reactionPlan];
        return;
      }

      const snapshot = card.source as TurnSnapshot;
      const plan = snapshotToPlan(snapshot);
      data.turnPlans = [...(data.turnPlans ?? []), plan];
    });
  }

  async function handleDelete(section: SidebarCard['section'], snapshotId: string) {
    const confirmLabel = FoundryAdapter.localize('TURN_PREP.Sidebar.DeleteConfirm');
    const DialogCls = (globalThis as any).Dialog;
    const ok = typeof DialogCls !== 'undefined'
      ? await DialogCls.confirm({ title: confirmLabel, content: `<p>${confirmLabel}</p>` })
      : window.confirm(confirmLabel);
    if (!ok) return;

    await updateData((data) => {
      if (section === 'recent') {
        data.history = (data.history ?? []).filter((s: TurnSnapshot) => s.id !== snapshotId);
      } else if (section === 'favorites-reaction') {
        data.favoritesReaction = (data.favoritesReaction ?? []).filter((s: ReactionFavoriteSnapshot) => s.id !== snapshotId);
      } else {
        data.favoritesTurn = (data.favoritesTurn ?? data.favorites ?? []).filter((s: TurnSnapshot) => s.id !== snapshotId);
      }
    });
  }

  async function handleDuplicate(card: SidebarCard) {
    await updateData((data) => {
      if (card.variant === 'reaction') {
        const snapshot = card.source as ReactionFavoriteSnapshot;
        const copy: ReactionFavoriteSnapshot = {
          ...snapshot,
          id: generateId(),
          createdTime: Date.now(),
          trigger: snapshot.trigger,
        };
        data.favoritesReaction = [...(data.favoritesReaction ?? []), copy];
        return;
      }

      const snapshot = card.source as TurnSnapshot;
      const copy: TurnSnapshot = {
        ...snapshot,
        id: generateId(),
        createdTime: Date.now(),
        planName: `${snapshot.planName || FoundryAdapter.localize('TURN_PREP.Sidebar.UntitledPlan')} ${FoundryAdapter.localize('TURN_PREP.Common.CopySuffix')}`,
      };
      data.favoritesTurn = [...(data.favoritesTurn ?? data.favorites ?? []), copy];
    });
  }

  async function handleEdit(card: SidebarCard) {
    if (!actor) return;
    
    // Create edit session
    const session: EditSession = {
      actorId: actor.id,
      kind: card.section === 'favorites-reaction' ? 'reaction' : 'turn',
      originalId: card.source.id,
      snapshot: card.source as any
    };

    // Start session
    editSessionStore.startSession(session);

    // Switch to main Turn Prep tab
    const sheet = (actor as any).sheet;
    if (sheet && typeof sheet.activateTab === 'function') {
      sheet.activateTab(TAB_ID_MAIN);
    }
  }

  async function handleReorder(
    section: SidebarCard['section'],
    currentIndex: number,
    targetIndex: number
  ) {
    if (section === 'recent') return; // History is not reorderable
    
    // Optimistic update
    if (section === 'favorites-turn') {
      const source = favoriteTurns[currentIndex];
      const newTurns = moveArrayItem([...favoriteTurns], currentIndex, targetIndex);
      favoriteTurns = newTurns;
    } else {
      const source = favoriteReactions[currentIndex];
      const newReactions = moveArrayItem([...favoriteReactions], currentIndex, targetIndex);
      favoriteReactions = newReactions;
    }

    scheduleAutoSave();
  }

  function getContextMenuActions(card: SidebarCard): ContextMenuAction[] {
    const sectionCards = getCardsForSection(card.section === 'favorites-turn' ? 'favoritesTurn' : (card.section === 'favorites-reaction' ? 'favoritesReaction' : 'recent'));
    const index = sectionCards.findIndex(c => c.id === card.id);
    const total = sectionCards.length;

    // Build arrange submenu only for reorderable sections
    let arrangeAction: ContextMenuAction | null = null;
    if (card.section !== 'recent') {
      const reorderActions = buildReorderActions({
        currentIndex: index,
        totalCount: total,
        onMoveUp: () => handleReorder(card.section, index, Math.max(0, index - 1)),
        onMoveDown: () => handleReorder(card.section, index, Math.min(total - 1, index + 1)),
        onMoveTop: () => handleReorder(card.section, index, 0),
        onMoveBottom: () => handleReorder(card.section, index, total - 1),
        idPrefix: `sidebar-${card.section}`
      });
      
      const arrangeSection = buildArrangeSubmenuSection(reorderActions);
      arrangeAction = buildArrangeParentAction(arrangeSection);
    }

    const actions: ContextMenuAction[] = [
      {
        id: 'load',
        label: label('TURN_PREP.Sidebar.Load'),
        icon: 'fa-solid fa-share',
        onSelect: () => handleLoad(card)
      }
    ];

    if (card.section !== 'recent') {
      actions.push(
        {
            id: 'duplicate',
            label: label('TURN_PREP.Sidebar.Duplicate'),
            icon: 'fa-solid fa-copy',
            onSelect: () => handleDuplicate(card)
        },
        {
            id: 'edit',
            label: label('TURN_PREP.Sidebar.Edit'),
            icon: 'fa-solid fa-pen',
            onSelect: () => handleEdit(card)
        }
      );
    }

    if (arrangeAction) {
      actions.push(arrangeAction);
    }

    if (card.section === 'recent') {
      actions.push({
        id: 'favorite',
        label: label('TURN_PREP.Sidebar.Favorite'),
        icon: 'fa-solid fa-star',
        onSelect: () => handleFavoriteFromRecent(card)
      });
    }

    actions.push({
      id: 'delete',
      label: label('TURN_PREP.Sidebar.Delete'),
      icon: 'fa-solid fa-trash',
      variant: 'destructive',
      onSelect: () => handleDelete(card.section, card.id)
    });

    return actions;
  }

  function openContextMenu(card: SidebarCard, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    
    // If triggered by button click, align to button. Otherwise cursor position.
    const trigger = event.currentTarget as HTMLElement;
    const isButton = trigger.tagName === 'BUTTON';
    const position = isButton
      ? { x: trigger.getBoundingClientRect().right, y: trigger.getBoundingClientRect().bottom + 4 }
      : { x: event.clientX, y: event.clientY };

    contextMenuController.open({
        sections: [{
            id: 'sidebar-card-actions',
            actions: getContextMenuActions(card)
        }],
        position,
        anchorElement: trigger,
        context: {
            cardId: card.id
        }
    });
  }

  function toggleCardExpanded(cardId: string) {
    const next = new Set(expandedCards);
    if (next.has(cardId)) {
        next.delete(cardId);
    } else {
        next.add(cardId);
    }
    expandedCards = next;
  }

  function isCardExpanded(card: SidebarCard): boolean {
    return expandedCards.has(card.id);
  }

  function getCardsForSection(section: CollapseKey): SidebarCard[] {
    if (section === 'favoritesTurn') return favoriteTurns;
    if (section === 'favoritesReaction') return favoriteReactions;
    return recentTurns;
  }

  function sectionClass(section: SidebarCard['section']): string {
    if (section === 'favorites-turn') return 'card favorite-turn';
    if (section === 'favorites-reaction') return 'card favorite-reaction';
    return 'card recent-turn';
  }

  function label(key: string): string {
    return FoundryAdapter.localize(key);
  }

  const actionLabel = 'TURN_PREP.Sidebar.Action';
  const bonusLabel = 'TURN_PREP.Sidebar.BonusActions';
  const additionalLabel = 'TURN_PREP.Sidebar.AdditionalFeatures';
  const actionAbbrev = 'A:';
  const bonusAbbrev = 'BA:';
  const additionalAbbrev = 'AF:';
  const reactionAbbrev = 'R:';
</script>

<div class="turn-prep-sidebar">
  {#if loading}
    <div class="sidebar-loading">{FoundryAdapter.localize('TURN_PREP.Loading')}</div>
  {/if}

  {#each collapseKeys as section}
    <section class={`sidebar-section ${collapsed[section] ? 'is-collapsed' : ''}`}>
      <header
        class="section-header"
        role="button"
        tabindex="0"
        onclick={() => toggleSection(section)}
        onkeydown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggleSection(section);
          }
        }}
      >
        <div class="section-left">
          <i class={`${sectionIcons[section]} section-icon`}></i>
          <span class="section-title">{label(sectionTitles[section])}</span>
        </div>
        <button
          class="collapse-button"
          aria-label={label('TURN_PREP.Sidebar.ToggleSection')}
        >
          <i class={`fas fa-chevron-${collapsed[section] ? 'right' : 'down'}`}></i>
        </button>
      </header>

      {#if !collapsed[section]}
        <div class="section-body">
          {#if getCardsForSection(section).length === 0}
            <div class="empty-space"></div>
          {:else}
            {#each getCardsForSection(section) as card (card.id)}
              <div
                class={sectionClass(card.section)}
                role="group"
                oncontextmenu={(event) => openContextMenu(card, event)}
              >
                <div class="card-header">
                  <div class="card-header-left">
                    <button 
                      class="card-collapse-toggle" 
                      onclick={() => toggleCardExpanded(card.id)}
                      title={isCardExpanded(card) ? label('TURN_PREP.Common.Collapse') : label('TURN_PREP.Common.Expand')}
                    >
                      <i class={`fas fa-chevron-${isCardExpanded(card) ? 'down' : 'right'}`}></i>
                    </button>
                    <div 
                        class="card-title" 
                        onclick={() => toggleCardExpanded(card.id)}
                        role="button"
                        tabindex="0"
                        onkeydown={(e) => e.key === 'Enter' && toggleCardExpanded(card.id)}
                    >
                        {card.title}
                    </div>
                  </div>
                  <div class="card-menu">
                    <button
                      class="icon-button"
                      aria-label={label('TURN_PREP.ContextMenu.OpenLabel')}
                      onclick={(event) => openContextMenu(card, event)}
                    >
                      <i class="fa-solid fa-ellipsis-vertical"></i>
                    </button>
                  </div>
                </div>
                
                {#if isCardExpanded(card)}
                    <div class="card-rows">
                    {#if card.variant === 'reaction'}
                        <div class="row">
                        <span class="row-label" title={label('TURN_PREP.Reactions.ReactionFeatures')}>{reactionAbbrev}</span>
                        <span class="row-content">{@html card.reactionsHtml ?? card.actionsHtml}</span>
                        </div>
                        <div class="row">
                        <span class="row-label" title={label(additionalLabel)}>{additionalAbbrev}</span>
                        <span class="row-content">{@html card.additionalHtml}</span>
                        </div>
                    {:else}
                        <div class="row">
                        <span class="row-label" title={label(actionLabel)}>{actionAbbrev}</span>
                        <span class="row-content">{@html card.actionsHtml}</span>
                        </div>
                        <div class="row">
                        <span class="row-label" title={label(bonusLabel)}>{bonusAbbrev}</span>
                        <span class="row-content">{@html card.bonusHtml}</span>
                        </div>
                        <div class="row">
                        <span class="row-label" title={label(additionalLabel)}>{additionalAbbrev}</span>
                        <span class="row-content">{@html card.additionalHtml}</span>
                        </div>
                    {/if}
                    </div>
                {/if}
              </div>
            {/each}
          {/if}
        </div>
      {/if}
    </section>
  {/each}
  
  <ContextMenuHost controller={contextMenuController} />
</div>

<style>
  /* ... existing styles ... */
  .card-header-left {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    flex: 1;
    min-width: 0;
  }

  .card-collapse-toggle {
    background: transparent;
    border: none;
    padding: 0;
    color: var(--t5e-tertiary-color, inherit);
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1rem;
    cursor: pointer;
    font-size: 0.8rem;
  }
  
  .card-collapse-toggle:hover {
    color: var(--t5e-primary-color, inherit);
  }

  .card-title {
    cursor: pointer;
  }

  .turn-prep-sidebar {
    padding: 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    height: 100%;
    overflow-y: auto;
    color: var(
      --t5e-color-text-oninverse-default,
      var(--t5e-primary-color, inherit)
    );
  }

  .sidebar-loading {
    font-size: 0.9rem;
    color: var(--t5e-tertiary-color, inherit);
  }

  .sidebar-section {
    border: none;
    border-radius: 0;
    background: transparent;
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.35rem;
    padding: 0.4rem 0.55rem;
    cursor: pointer;
    position: relative;
    color: var(--t5e-color-palette-white, inherit);
    background: var(--t5e-theme-color-darkest, var(--t5e-accent-surface, var(--t5e-accent-light, rgba(255,255,255,0.04))));
    border-radius: var(--t5e-border-radius, 6px);
  }

  .section-left {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    min-width: 0;
  }

  .collapse-button {
    border: none;
    background: transparent;
    color: var(--t5e-primary-color, inherit);
    padding: 0.15rem;
    visibility: hidden;
  }

  .section-header:hover .collapse-button {
    visibility: visible;
  }

  .section-icon {
    color: var(--t5e-primary-color, inherit);
    opacity: 0.9;
  }

  .section-title {
    font-weight: 600;
    font-size: 0.95rem;
  }

  .section-body {
    padding: 0.45rem 0.1rem 0.45rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .empty-space {
    min-height: 0.25rem;
  }

  .card {
    border: 1px solid var(--t5e-faint-color, currentColor);
    border-radius: var(--t5e-border-radius, 6px);
    padding: 0.4rem 0.45rem;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    background: var(--t5e-surface-color, transparent); /* fixed typo */
    position: relative; /* allow overlaid menu to stack above title/content */
    color: var(--t5e-color-text-default, var(--t5e-primary-color, inherit));
  }

  .favorite-turn {
    background: var(--t5e-accent-surface, var(--t5e-accent-light, transparent));
  }

  .favorite-reaction {
    background: var(--t5e-surface-subtle, var(--t5e-sheet-background, transparent));
  }

  .recent-turn {
    background: var(--t5e-surface-muted, var(--t5e-muted-bg, transparent));
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    color: inherit;
  }

  .card-title {
    font-weight: 700;
    text-decoration: underline;
    font-size: 0.95rem;
  }

  .card-menu {
    position: relative;
  }

  .icon-button {
    border: none;
    background: transparent;
    color: inherit;
    padding: 0.2rem 0.25rem;
    border-radius: 4px;
  }

  .icon-button:hover {
    background: var(--t5e-faint-color, rgba(255,255,255,0.08));
  }

  .card-rows {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .row {
    display: grid;
    grid-template-columns: minmax(1.35rem, 6%) 1fr;
    gap: 0.2rem;
    align-items: start;
    font-size: 0.9rem;
  }

  .row-label {
    font-weight: 700;
    min-width: 1.35rem;
    text-align: right;
    color: inherit;
  }

  .row-content {
    line-height: 1.35;
    word-break: break-word;
  }

  .sidebar-section.is-collapsed .section-body {
    display: none;
  }

  .sidebar-section.is-collapsed .collapse-button {
    visibility: visible;
  }
</style>
