<script lang="ts">
  import { onMount, tick } from 'svelte';
  import type {
    TurnPlan,
    SelectedFeature,
    TurnPlanTableKey,
    AnyFeatureTableKey,
    Reaction,
    ReactionPlanTableKey
  } from '../../types/turn-prep.types';
  import { FoundryAdapter } from '../../foundry/FoundryAdapter';
  import { TurnPrepApiInstance as api } from '../../api/TurnPrepApi';
  import TurnPlanFeatureTable, { type DisplayFeature } from './TurnPlanFeatureTable.svelte';
  import { AUTO_SAVE_DEBOUNCE_MS, FLAG_SCOPE, FLAG_KEY_DATA } from '../../constants';
  import { createEmptyTurnPrepData, createTurnSnapshot, limitHistory } from '../../utils/data';
  import {
    buildDisplayFeatureList,
    cloneSelectedFeatureArray,
    hasDuplicateFeature,
    mergeSelectedFeatureArrays,
    moveArrayItem,
    normalizeActionType,
    resolveTurnPlanTableForActivations,
    isActivationCompatibleWithTable
  } from './featureDisplay.helpers';
  import { FeatureSelector } from '../../features/feature-selection/FeatureSelector';
  import ContextMenuHost from './context-menu/ContextMenuHost.svelte';
  import { ContextMenuController } from '../../features/context-menu/ContextMenuController';
  import type { ContextMenuAction, ContextMenuSection } from '../../features/context-menu/context-menu.types';
  import { TurnPrepStorage } from '../../features/data/TurnPrepStorage';
  import * as SettingsModule from '../../settings/settings';

  type TurnPlansPanelUiState = {
    notesState: Record<string, boolean>;
    collapseState: Record<string, boolean>;
    scrollTop: number;
  };

  const PANEL_UI_CACHE_KEY = '__turnPrepPlanUiState';
  const panelUiStateCache: Map<string, TurnPlansPanelUiState> =
    (globalThis as any)[PANEL_UI_CACHE_KEY] ?? ((globalThis as any)[PANEL_UI_CACHE_KEY] = new Map());

  let { actor }: { actor: any } = $props();

  // State
  let plans: TurnPlan[] = $state([]);
  let loading = $state(true);
  let initialized = $state(false);
  let collapsed = $state(false);
  let notesSectionState: Record<string, boolean> = $state({});
  let planCardCollapseState: Record<string, boolean> = $state({});
  const planContextMenuController = new ContextMenuController('turn-plans-panel');
  let activeContextPlanId = $state<string | null>(null);
  let lastSavedTurnPlansSignature: string | null = null;
  let panelRootElement: HTMLElement | null = $state(null);
  let panelScrollContainer: HTMLElement | null = null;
  let pendingScrollTop: number | null = null;
  let currentScrollTop = 0;
  let detachScrollListener: (() => void) | null = null;

  let saveTimeout: number | null = null;
  const hookCleanups: Array<() => void> = [];

  function randomId(): string {
    const foundryRandom = (globalThis as any).foundry?.utils?.randomID;
    if (typeof foundryRandom === 'function') return foundryRandom();
    if (typeof crypto?.randomUUID === 'function') return crypto.randomUUID();
    return Math.random().toString(36).slice(2);
  }

  // Initialize plans from actor flags
  onMount(() => {
    restoreUiStateFromCache();
    loadPlans(true);
    void applyPendingScrollPosition();

    registerHook('updateActor', onActorUpdated);
    registerHook('updateItem', onItemChanged);
    registerHook('deleteItem', onItemChanged);

    const unsubscribe = planContextMenuController.subscribe((state) => {
      const contextPlanId = state?.context?.planId;
      activeContextPlanId = typeof contextPlanId === 'string' ? contextPlanId : null;
    });

    return () => {
      persistUiStateToCache();
      cleanupHooks();
      cancelPendingSave(true);
      unsubscribe();
      detachScrollListener?.();
      detachScrollListener = null;
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

  function onActorUpdated(updatedActor: any, changes: any) {
    if (!actor || updatedActor?.id !== actor.id) return;
    if (shouldIgnoreActorUpdate(changes)) {
      return;
    }

    if (hasTurnPrepFlagChange(changes)) {
      loadPlans();
    }
  }

  function getTurnPrepFlagChangePayload(changes: any): any {
    return changes?.flags?.[FLAG_SCOPE]?.[FLAG_KEY_DATA];
  }

  function hasTurnPrepFlagChange(changes: any): boolean {
    return !!getTurnPrepFlagChangePayload(changes);
  }

  function shouldIgnoreActorUpdate(changes: any): boolean {
    if (!lastSavedTurnPlansSignature) return false;
    const payload = getTurnPrepFlagChangePayload(changes);
    if (!payload) return false;
    const changeSignature = JSON.stringify(payload.turnPlans ?? []);
    return changeSignature === lastSavedTurnPlansSignature;
  }

  function onItemChanged(item: any) {
    if (!actor || !item?.actor || item.actor.id !== actor.id) return;
    touchPlans();
  }

  function touchPlans() {
    plans = plans.map((plan) => ({ ...plan }));
  }

  function getUiCacheKey(): string | null {
    return actor?.id ?? null;
  }

  function restoreUiStateFromCache() {
    const key = getUiCacheKey();
    if (!key) return;
    const cached = panelUiStateCache.get(key);
    if (!cached) return;

    notesSectionState = { ...cached.notesState };
    planCardCollapseState = { ...cached.collapseState };
    pendingScrollTop = typeof cached.scrollTop === 'number' ? cached.scrollTop : null;
    if (typeof cached.scrollTop === 'number') {
      currentScrollTop = cached.scrollTop;
    }
  }

  function persistUiStateToCache() {
    const key = getUiCacheKey();
    if (!key) return;
    panelUiStateCache.set(key, {
      notesState: { ...notesSectionState },
      collapseState: { ...planCardCollapseState },
      scrollTop: panelScrollContainer?.scrollTop ?? currentScrollTop ?? 0
    });
  }

  function handlePanelScroll() {
    if (!panelScrollContainer) return;
    currentScrollTop = panelScrollContainer.scrollTop;
  }

  function resolveScrollContainer(): HTMLElement | null {
    if (!panelRootElement) return null;
    const tabParent = panelRootElement.closest('.tab');
    if (tabParent instanceof HTMLElement) {
      return tabParent;
    }
    const sheetBody = panelRootElement.closest('.sheet-body');
    if (sheetBody instanceof HTMLElement) {
      return sheetBody;
    }
    return panelRootElement;
  }

  function updateScrollContainerBinding() {
    detachScrollListener?.();
    panelScrollContainer = resolveScrollContainer();
    if (!panelScrollContainer) {
      detachScrollListener = null;
      return;
    }

    const handler = () => handlePanelScroll();
    panelScrollContainer.addEventListener('scroll', handler, { passive: true });
    detachScrollListener = () => {
      panelScrollContainer?.removeEventListener('scroll', handler);
    };
    currentScrollTop = panelScrollContainer.scrollTop;
  }

  async function applyPendingScrollPosition() {
    if (pendingScrollTop === null) return;
    const target = pendingScrollTop;
    pendingScrollTop = null;
    await tick();
    if (panelScrollContainer) {
      panelScrollContainer.scrollTop = target;
      currentScrollTop = target;
    }
  }

  $effect(() => {
    if (!panelRootElement) {
      detachScrollListener?.();
      detachScrollListener = null;
      panelScrollContainer = null;
      return;
    }

    updateScrollContainerBinding();

    return () => {
      detachScrollListener?.();
      detachScrollListener = null;
      panelScrollContainer = null;
    };
  });

  function duplicatePlan(planId: string) {
    const sourceIndex = plans.findIndex((plan) => plan.id === planId);
    if (sourceIndex === -1) return;

    const source = plans[sourceIndex];
    const clone: TurnPlan = {
      ...source,
      id: randomId(),
      name: `${source.name} ${FoundryAdapter.localize('TURN_PREP.Common.CopySuffix') ?? '(Copy)'}`,
      actions: cloneSelectedFeatureArray(source.actions),
      bonusActions: cloneSelectedFeatureArray(source.bonusActions),
      reactions: cloneSelectedFeatureArray(source.reactions),
      additionalFeatures: cloneSelectedFeatureArray(source.additionalFeatures),
      categories: Array.isArray(source.categories) ? [...source.categories] : []
    };

    plans = [
      ...plans.slice(0, sourceIndex + 1),
      clone,
      ...plans.slice(sourceIndex + 1)
    ];

    syncNotesSectionState(plans);
    syncPlanCardCollapseState(plans);
    void savePlans();
  }

  function loadPlans(showSpinner = false) {
    if (!actor) {
      plans = [];
      loading = false;
      initialized = true;
      notesSectionState = {};
      planCardCollapseState = {};
      lastSavedTurnPlansSignature = null;
      return;
    }

    if (showSpinner) {
      loading = true;
    }

    try {
      const turnPrepData = api.getTurnPrepData(actor);
      plans = hydratePlans(turnPrepData?.turnPlans ?? []);
      lastSavedTurnPlansSignature = JSON.stringify(turnPrepData?.turnPlans ?? []);
    } catch (error) {
      console.error('[TurnPlansPanel] Failed to load turn plans:', error);
      plans = [];
      lastSavedTurnPlansSignature = null;
      ui.notifications?.error(FoundryAdapter.localize('TURN_PREP.TurnPlans.SaveError'));
    } finally {
      syncNotesSectionState(plans);
      syncPlanCardCollapseState(plans);
      void applyPendingScrollPosition();
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
      id: rawPlan.id ?? randomId(),
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

  function findPlan(planId?: string | null): { index: number; plan: TurnPlan | null } {
    const index = planId ? plans.findIndex((p) => p.id === planId) : -1;
    return { index, plan: index >= 0 ? plans[index] : null };
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

  type FeatureDropEvent = {
    panelKind: 'turn';
    table: AnyFeatureTableKey;
    ownerId?: string;
    targetIndex: number | null;
    copy: boolean;
    feature?: SelectedFeature;
    nativeItemUuid?: string;
    source?: {
      actorId: string;
      sourcePlanId?: string;
      sourceReactionId?: string;
      sourceTable?: AnyFeatureTableKey;
      feature?: SelectedFeature;
    } | null;
  };

  function coerceTurnTable(table: AnyFeatureTableKey): TurnPlanTableKey {
    if (table === 'actions' || table === 'bonusActions' || table === 'additionalFeatures') {
      return table;
    }
    return 'additionalFeatures';
  }

  function getPlanTable(plan: TurnPlan, table: TurnPlanTableKey): SelectedFeature[] {
    switch (table) {
      case 'actions':
        return plan.actions ?? [];
      case 'bonusActions':
        return plan.bonusActions ?? [];
      case 'reactions':
        return plan.reactions ?? [];
      case 'additionalFeatures':
      default:
        return plan.additionalFeatures ?? [];
    }
  }

  function findFeatureTable(plan: TurnPlan, featureId: string): TurnPlanTableKey | null {
    if ((plan.actions ?? []).some((f) => f.itemId === featureId)) return 'actions';
    if ((plan.bonusActions ?? []).some((f) => f.itemId === featureId)) return 'bonusActions';
    if ((plan.reactions ?? []).some((f) => f.itemId === featureId)) return 'reactions';
    if ((plan.additionalFeatures ?? []).some((f) => f.itemId === featureId)) return 'additionalFeatures';
    return null;
  }

  function setPlanTable(plan: TurnPlan, table: TurnPlanTableKey, value: SelectedFeature[]): TurnPlan {
    switch (table) {
      case 'actions':
        return { ...plan, actions: value };
      case 'bonusActions':
        return { ...plan, bonusActions: value };
      case 'reactions':
        return { ...plan, reactions: value };
      case 'additionalFeatures':
      default:
        return { ...plan, additionalFeatures: value };
    }
  }

  function getActivationsFromFeature(feature?: SelectedFeature | null): string[] {
    if (!feature?.actionType) return [];
    return [normalizeActionType(feature.actionType)];
  }

  function getActivationsFromItem(item: any): string[] {
    if (!item) return [];
    const activations: string[] = [];
    const itemActivation = normalizeActionType(item?.system?.activation?.type);
    if (itemActivation) activations.push(itemActivation);
    const activities = FeatureSelector.getActivitiesForItem(item) ?? [];
    for (const act of activities) {
      const type = normalizeActionType(act?.activation?.type ?? act?.system?.activation?.type);
      if (type) activations.push(type);
    }
    return activations;
  }

  function getActivationsForFeature(feature?: SelectedFeature | null): string[] {
    if (feature?.itemId) {
      const item = actor?.items?.get?.(feature.itemId);
      const fromItem = getActivationsFromItem(item);
      if (fromItem.length) return fromItem;
    }
    return getActivationsFromFeature(feature);
  }

  async function buildFeatureFromUuid(uuid: string): Promise<{ feature: SelectedFeature | null; activations: string[] }> {
    try {
      const doc = (await (globalThis as any).fromUuid?.(uuid)) as any;
      if (!doc) {
        ui.notifications?.warn(FoundryAdapter.localize('TURN_PREP.TurnPlans.Messages.ItemUnavailable'));
        return { feature: null, activations: [] };
      }
      if (doc?.actor?.id && actor?.id && doc.actor.id !== actor.id) {
        ui.notifications?.warn(FoundryAdapter.localize('TURN_PREP.TurnPlans.Messages.ActorMismatch'));
        return { feature: null, activations: [] };
      }
      const actionType = normalizeActionType(doc?.system?.activation?.type);
      const feature: SelectedFeature = {
        itemId: doc.id,
        itemName: doc.name ?? doc.id,
        itemType: doc.type ?? 'item',
        actionType
      };
      const activations = getActivationsFromItem(doc);
      return { feature, activations: activations.length ? activations : getActivationsFromFeature(feature) };
    } catch (error) {
      console.error('[TurnPlansPanel] Failed to resolve UUID drop', uuid, error);
      ui.notifications?.warn(FoundryAdapter.localize('TURN_PREP.TurnPlans.Messages.ItemUnavailable'));
      return { feature: null, activations: [] };
    }
  }

  function pickTurnTableForDrop(requested: AnyFeatureTableKey, activations: string[]): TurnPlanTableKey {
    const desired = coerceTurnTable(requested);
    if (desired === 'additionalFeatures') return desired;

    // Honor explicit table drops when compatible
    const isDesiredCompatible = activations.some((act) => isActivationCompatibleWithTable(act, desired));
    if (isDesiredCompatible) {
      return desired;
    }

    const routed = coerceTurnTable(resolveTurnPlanTableForActivations(activations));
    return routed === 'reactions' ? 'additionalFeatures' : routed;
  }

  function removeFeatureFromSource(source: FeatureDropEvent['source']): void {
    if (!source?.feature?.itemId) return;
    const { plan, index } = findPlan(source.sourcePlanId ?? null);
    if (!plan || index === -1) return;
    const table = coerceTurnTable(source.sourceTable ?? 'additionalFeatures');
    const current = getPlanTable(plan, table);
    const next = current.filter((f) => f.itemId !== source.feature?.itemId);
    const nextPlans = [...plans];
    nextPlans[index] = setPlanTable(plan, table, next);
    plans = nextPlans;
  }

  function upsertFeatureToPlan(
    planId: string,
    table: TurnPlanTableKey,
    feature: SelectedFeature,
    targetIndex: number | null
  ) {
    const { plan, index } = findPlan(planId);
    if (!plan || index === -1) return;
    const current = getPlanTable(plan, table);
    if (hasDuplicateFeature(current, feature)) {
      ui.notifications?.warn(FoundryAdapter.localize('TURN_PREP.TurnPlans.Messages.DuplicateFeature'));
      return;
    }
    const insertAt = Math.max(0, Math.min(current.length, targetIndex ?? current.length));
    const next = [...current];
    next.splice(insertAt, 0, feature);
    const nextPlans = [...plans];
    nextPlans[index] = setPlanTable(plan, table, next);
    plans = nextPlans;
    scheduleAutoSave();
  }

  function reorderPlanTable(planId: string, table: TurnPlanTableKey, fromIndex: number, toIndex: number) {
    const { plan, index } = findPlan(planId);
    if (!plan || index === -1) return;
    const current = getPlanTable(plan, table);
    if (!current.length) return;
    const next = moveArrayItem(current, fromIndex, toIndex);
    const nextPlans = [...plans];
    nextPlans[index] = setPlanTable(plan, table, next);
    plans = nextPlans;
    scheduleAutoSave();
  }

  async function handleFeatureDrop(event: FeatureDropEvent) {
    if (event.panelKind !== 'turn') return;
    const targetPlanId = event.ownerId;
    if (!targetPlanId) return;

    let feature: SelectedFeature | null = event.feature ?? null;
    let activations: string[] = feature ? getActivationsForFeature(feature) : [];

    if (!feature && event.nativeItemUuid) {
      const resolved = await buildFeatureFromUuid(event.nativeItemUuid);
      feature = resolved.feature;
      activations = resolved.activations;
    }

    if (!feature) return;
    if (!activations.length) {
      activations = getActivationsForFeature(feature);
    }

    const targetTable = pickTurnTableForDrop(event.table, activations);

    if (!event.copy && event.source?.sourcePlanId) {
      removeFeatureFromSource(event.source);
    }

    upsertFeatureToPlan(targetPlanId, targetTable, cloneFeature(feature) as SelectedFeature, event.targetIndex);
  }

  function handleFeatureReorder(planId: string, table: TurnPlanTableKey, fromIndex: number, toIndex: number) {
    reorderPlanTable(planId, table, fromIndex, toIndex);
  }

  function buildTurnMoveCopyMenu(
    currentPlanId: string,
    feature: SelectedFeature,
    copy: boolean
  ): ContextMenuSection[] {
    const turnActions: ContextMenuAction[] = [];
    const reactionActions: ContextMenuAction[] = [];
    const activations = getActivationsForFeature(feature);
    const activationSet = new Set(activations.map((a) => normalizeActionType(a)));
    const allowAction = activationSet.has('action');
    const allowBonus = activationSet.has('bonus');
    const allowReaction = activationSet.has('reaction');

    for (const plan of plans) {
      const planActions: ContextMenuAction[] = [];
      if (allowAction) {
        planActions.push({
          id: `${plan.id}-action-${copy ? 'copy' : 'move'}`,
          label: `${plan.name} - ${FoundryAdapter.localize('TURN_PREP.TurnPlans.Actions')}`,
          icon: 'fa-solid fa-person-running',
          onSelect: () => handleMoveCopyFeature(currentPlanId, plan.id, 'actions', feature, copy)
        });
      }
      if (allowBonus) {
        planActions.push({
          id: `${plan.id}-bonus-${copy ? 'copy' : 'move'}`,
          label: `${plan.name} - ${FoundryAdapter.localize('TURN_PREP.TurnPlans.BonusActions')}`,
          icon: 'fa-solid fa-plus',
          onSelect: () => handleMoveCopyFeature(currentPlanId, plan.id, 'bonusActions', feature, copy)
        });
      }
      planActions.push({
        id: `${plan.id}-additional-${copy ? 'copy' : 'move'}`,
        label: `${plan.name} - ${FoundryAdapter.localize('TURN_PREP.TurnPlans.AdditionalFeatures')}`,
        icon: 'fa-regular fa-circle-dot',
        onSelect: () => handleMoveCopyFeature(currentPlanId, plan.id, 'additionalFeatures', feature, copy)
      });

      if (planActions.length) {
        turnActions.push(...planActions);
      }
    }

    // Reaction destinations (for parity and cross-panel moves).
    try {
      const turnPrepData = api.getTurnPrepData(actor);
      const reactions = turnPrepData?.reactions ?? [];
      for (const reaction of reactions) {
        const reactionMenuActions: ContextMenuAction[] = [];
        if (allowReaction) {
          reactionMenuActions.push({
            id: `${reaction.id}-reaction-${copy ? 'copy' : 'move'}`,
            label: `${reaction.name || FoundryAdapter.localize('TURN_PREP.Reactions.ReactionLabel')} - ${FoundryAdapter.localize('TURN_PREP.Reactions.ReactionFeatures')}`,
            icon: 'fa-solid fa-bolt',
            onSelect: () => handleMoveCopyFeatureToReaction(currentPlanId, reaction.id, 'reactionFeatures', feature, copy)
          });
        }
        reactionMenuActions.push({
          id: `${reaction.id}-additional-${copy ? 'copy' : 'move'}`,
          label: `${reaction.name || FoundryAdapter.localize('TURN_PREP.Reactions.ReactionLabel')} - ${FoundryAdapter.localize('TURN_PREP.Reactions.AdditionalFeatures')}`,
          icon: 'fa-regular fa-circle-dot',
          onSelect: () => handleMoveCopyFeatureToReaction(currentPlanId, reaction.id, 'additionalFeatures', feature, copy)
        });
        if (reactionMenuActions.length) {
          reactionActions.push(...reactionMenuActions);
        }
      }
    } catch (error) {
      console.warn('[TurnPlansPanel] Failed to build reaction move/copy menu', error);
    }

    const sections: ContextMenuSection[] = [];
    if (turnActions.length) {
      sections.push({
        id: `turns-${copy ? 'copy' : 'move'}`,
        label: FoundryAdapter.localize('TURN_PREP.TurnPlans.Title') ?? 'Turns',
        actions: turnActions
      });
    }
    if (reactionActions.length) {
      sections.push({
        id: `reactions-${copy ? 'copy' : 'move'}`,
        label: FoundryAdapter.localize('TURN_PREP.Reactions.Title') ?? 'Reactions',
        actions: reactionActions
      });
    }
    return sections;
  }

  function handleMoveCopyFeature(
    fromPlanId: string,
    toPlanId: string,
    table: TurnPlanTableKey,
    feature: SelectedFeature,
    copy: boolean
  ) {
    const { plan: targetPlan } = findPlan(toPlanId);
    if (!targetPlan) return;

    if (hasDuplicateFeature(getPlanTable(targetPlan, table), feature)) {
      ui.notifications?.warn(FoundryAdapter.localize('TURN_PREP.TurnPlans.Messages.DuplicateFeature'));
      return;
    }

    if (!copy) {
      const { plan: sourcePlan, index: sourceIndex } = findPlan(fromPlanId);
      if (sourcePlan && sourceIndex >= 0) {
        const sourceTable = findFeatureTable(sourcePlan, feature.itemId) ?? table;
        const cleaned = getPlanTable(sourcePlan, sourceTable).filter((f) => f.itemId !== feature.itemId);
        const nextPlans = [...plans];
        nextPlans[sourceIndex] = setPlanTable(sourcePlan, sourceTable, cleaned);
        plans = nextPlans;
      }
    }

    const { plan: updatedTarget, index: targetIndex } = findPlan(toPlanId);
    if (!updatedTarget || targetIndex < 0) return;
    const next = [...getPlanTable(updatedTarget, table), cloneFeature(feature) as SelectedFeature];
    const nextPlans = [...plans];
    nextPlans[targetIndex] = setPlanTable(updatedTarget, table, next);
    plans = nextPlans;
    scheduleAutoSave();
  }

  async function handleMoveCopyFeatureToReaction(
    fromPlanId: string,
    reactionId: string,
    table: ReactionPlanTableKey,
    feature: SelectedFeature,
    copy: boolean
  ) {
    const turnPrepData = api.getTurnPrepData(actor) ?? createEmptyTurnPrepData();
    const reactions = Array.isArray(turnPrepData.reactions) ? [...turnPrepData.reactions] : [];
    const reactionIndex = reactions.findIndex((r) => r.id === reactionId);
    if (reactionIndex === -1) {
      ui.notifications?.warn(FoundryAdapter.localize('TURN_PREP.Reactions.Messages.ReactionMissing') ?? 'Reaction not found');
      return;
    }

    const targetReaction = reactions[reactionIndex] as Reaction;
    const currentTargets = table === 'reactionFeatures'
      ? Array.isArray(targetReaction.reactionFeatures) ? targetReaction.reactionFeatures : []
      : Array.isArray(targetReaction.additionalFeatures) ? targetReaction.additionalFeatures : [];

    if (hasDuplicateFeature(currentTargets, feature)) {
      ui.notifications?.warn(FoundryAdapter.localize('TURN_PREP.TurnPlans.Messages.DuplicateFeature'));
      return;
    }

    let nextPlans = plans;
    if (!copy) {
      const { plan: sourcePlan, index: sourceIndex } = findPlan(fromPlanId);
      if (sourcePlan && sourceIndex >= 0) {
        const sourceTable = findFeatureTable(sourcePlan, feature.itemId) ?? 'additionalFeatures';
        const cleaned = getPlanTable(sourcePlan, sourceTable).filter((f) => f.itemId !== feature.itemId);
        nextPlans = [...plans];
        nextPlans[sourceIndex] = setPlanTable(sourcePlan, sourceTable, cleaned);
        plans = nextPlans;
      }
    }

    const updatedTargets = [...currentTargets, cloneFeature(feature) as SelectedFeature];
    const updatedReaction: Reaction = table === 'reactionFeatures'
      ? { ...targetReaction, reactionFeatures: updatedTargets }
      : { ...targetReaction, additionalFeatures: updatedTargets };
    reactions[reactionIndex] = updatedReaction;

    const nextData = {
      ...turnPrepData,
      turnPlans: (nextPlans ?? plans).map((plan) => sanitizePlan(plan)),
      reactions
    };

    try {
      await api.saveTurnPrepData(actor, nextData, { render: false });
      lastSavedTurnPlansSignature = JSON.stringify(nextData.turnPlans ?? []);
    } catch (error) {
      console.error('[TurnPlansPanel] Failed to move/copy feature to reaction', error);
      ui.notifications?.error(FoundryAdapter.localize('TURN_PREP.Reactions.SaveError'));
    }
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
      id: randomId(),
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
    syncNotesSectionState(plans);
    syncPlanCardCollapseState(plans);
    void savePlans();
  }

  function getActionFeatures(plan: TurnPlan): DisplayFeature[] {
    const features: SelectedFeature[] = Array.isArray(plan.actions) ? plan.actions : [];
    return buildDisplayFeatureList(actor, plan.id, features, 'action-primary');
  }

  function getBonusActionFeatures(plan: TurnPlan): DisplayFeature[] {
    const features: SelectedFeature[] = Array.isArray(plan.bonusActions) ? plan.bonusActions : [];
    return buildDisplayFeatureList(actor, plan.id, features, 'bonus-primary');
  }

  function getAdditionalFeatures(plan: TurnPlan): DisplayFeature[] {
    const extras = plan.additionalFeatures ?? [];
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
    } else if (target === 'bonusAction') {
      plan.bonusActions = plan.bonusActions.filter((feature) => feature.itemId !== featureId);
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
    syncNotesSectionState(plans);
    syncPlanCardCollapseState(plans);
    void savePlans();
  }

  // Save all plans to actor flags
  async function savePlans() {
    if (!actor) return;
    try {
      const turnPrepData = api.getTurnPrepData(actor) ?? createEmptyTurnPrepData();
      turnPrepData.turnPlans = plans.map((plan) => sanitizePlan(plan));
      lastSavedTurnPlansSignature = JSON.stringify(turnPrepData.turnPlans ?? []);
      await api.saveTurnPrepData(actor, turnPrepData, { render: false });
    } catch (error) {
      console.error('[TurnPlansPanel] Failed to save plans:', error);
      ui.notifications?.error(FoundryAdapter.localize('TURN_PREP.TurnPlans.SaveError'));
    }
  }

  function syncNotesSectionState(nextPlans: TurnPlan[]) {
    const nextState: Record<string, boolean> = { ...notesSectionState };
    let changed = false;
    const planIds = new Set(nextPlans.map((plan) => plan.id));

    nextPlans.forEach((plan) => {
      if (nextState[plan.id] === undefined) {
        nextState[plan.id] = false;
        changed = true;
      }
    });

    Object.keys(nextState).forEach((planId) => {
      if (!planIds.has(planId)) {
        delete nextState[planId];
        changed = true;
      }
    });

    if (changed) {
      notesSectionState = nextState;
    }
  }

  function ensureNotesSectionState(planId: string) {
    if (notesSectionState[planId] !== undefined) return;
    notesSectionState = { ...notesSectionState, [planId]: false };
  }

  function isNotesSectionOpen(planId: string): boolean {
    if (notesSectionState[planId] === undefined) {
      ensureNotesSectionState(planId);
    }
    return !!notesSectionState[planId];
  }

  function toggleNotesSection(planId: string) {
    const nextValue = !isNotesSectionOpen(planId);
    notesSectionState = { ...notesSectionState, [planId]: nextValue };
  }

  function syncPlanCardCollapseState(nextPlans: TurnPlan[]) {
    const nextState: Record<string, boolean> = { ...planCardCollapseState };
    let changed = false;
    const planIds = new Set(nextPlans.map((plan) => plan.id));

    nextPlans.forEach((plan) => {
      if (nextState[plan.id] === undefined) {
        nextState[plan.id] = false;
        changed = true;
      }
    });

    Object.keys(nextState).forEach((planId) => {
      if (!planIds.has(planId)) {
        delete nextState[planId];
        changed = true;
      }
    });

    if (changed) {
      planCardCollapseState = nextState;
    }
  }

  function isPlanCollapsed(planId: string): boolean {
    return !!planCardCollapseState[planId];
  }

  function togglePlanCollapsed(planId: string) {
    planCardCollapseState = {
      ...planCardCollapseState,
      [planId]: !isPlanCollapsed(planId)
    };
  }

  async function handleSubmitPlan(planId: string) {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) {
      ui.notifications?.warn(FoundryAdapter.localize('TURN_PREP.TurnPlans.Messages.PlanMissing'));
      return;
    }

    try {
      const snapshot = createTurnSnapshot(plan);
      const data = await TurnPrepStorage.load(actor);
      data.turnPlans = plans.map((p) => sanitizePlan(p));
      const limit = SettingsModule.getHistoryLimitForActor(actor);
      data.history = limitHistory([...(data.history ?? []), snapshot], limit);
      await TurnPrepStorage.save(actor, data);
    } catch (error) {
      console.error('[TurnPlansPanel] Failed to submit plan', error);
      ui.notifications?.error(FoundryAdapter.localize('TURN_PREP.TurnPlans.SaveError'));
    }
  }

  async function handleFavoritePlan(planId: string) {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) {
      ui.notifications?.warn(FoundryAdapter.localize('TURN_PREP.TurnPlans.Messages.PlanMissing'));
      return;
    }

    try {
      const snapshot = createTurnSnapshot(plan);
      const data = await TurnPrepStorage.load(actor);
      data.turnPlans = plans.map((p) => sanitizePlan(p));
      data.favoritesTurn = [...(data.favoritesTurn ?? data.favorites ?? []), snapshot];
      await TurnPrepStorage.save(actor, data);
    } catch (error) {
      console.error('[TurnPlansPanel] Failed to favorite plan', error);
      ui.notifications?.error(FoundryAdapter.localize('TURN_PREP.TurnPlans.SaveError'));
    }
  }

  function reorderPlans(fromIndex: number, toIndex: number) {
    const boundedFrom = Math.max(0, Math.min(plans.length - 1, fromIndex));
    const boundedTo = Math.max(0, Math.min(plans.length - 1, toIndex));
    if (boundedFrom === boundedTo) return;
    plans = moveArrayItem(plans, boundedFrom, boundedTo);
    scheduleAutoSave();
  }

  function buildPlanReorderActions(planId: string): ContextMenuAction[] {
    const index = plans.findIndex((p) => p.id === planId);
    if (index === -1) return [];
    const total = plans.length;
    return [
      {
        id: 'move-up',
        label: FoundryAdapter.localize('TURN_PREP.ContextMenu.MoveUp') || 'Move Up',
        icon: 'fa-solid fa-angle-up',
        onSelect: () => reorderPlans(index, Math.max(0, index - 1))
      },
      {
        id: 'move-down',
        label: FoundryAdapter.localize('TURN_PREP.ContextMenu.MoveDown') || 'Move Down',
        icon: 'fa-solid fa-angle-down',
        onSelect: () => reorderPlans(index, Math.min(total - 1, index + 1))
      },
      {
        id: 'move-top',
        label: FoundryAdapter.localize('TURN_PREP.ContextMenu.MoveTop') || 'Move to Top',
        icon: 'fa-solid fa-angles-up',
        onSelect: () => reorderPlans(index, 0)
      },
      {
        id: 'move-bottom',
        label: FoundryAdapter.localize('TURN_PREP.ContextMenu.MoveBottom') || 'Move to Bottom',
        icon: 'fa-solid fa-angles-down',
        onSelect: () => reorderPlans(index, total - 1)
      }
    ];
  }

  function buildPlanArrangeSubmenu(planId: string): ContextMenuSection[] {
    const actions = buildPlanReorderActions(planId);
    return actions.length
      ? [
          {
            id: `${planId}-reorder`,
            actions
          }
        ]
      : [];
  }

  function getPlanContextMenuActions(plan: TurnPlan): ContextMenuAction[] {
    const arrangeSubmenu = buildPlanArrangeSubmenu(plan.id);
    return [
      {
        id: 'duplicate',
        label: FoundryAdapter.localize('TURN_PREP.TurnPlans.ContextMenu.Duplicate'),
        icon: 'fa-regular fa-copy',
        onSelect: () => duplicatePlan(plan.id)
      },
      {
        id: 'delete',
        label: FoundryAdapter.localize('TURN_PREP.TurnPlans.ContextMenu.Delete'),
        icon: 'fa-regular fa-trash-can',
        variant: 'destructive',
        onSelect: () => void deletePlan(plan.id)
      },
      {
        id: 'submit',
        label: FoundryAdapter.localize('TURN_PREP.TurnPlans.ContextMenu.Submit'),
        icon: 'fa-regular fa-paper-plane',
        onSelect: () => handleSubmitPlan(plan.id)
      },
      {
        id: 'favorite',
        label: FoundryAdapter.localize('TURN_PREP.TurnPlans.ContextMenu.AddToFavorites'),
        icon: 'fa-regular fa-star',
        onSelect: () => handleFavoritePlan(plan.id)
      },
      ...(arrangeSubmenu.length
        ? [
            {
              id: 'arrange',
              label: FoundryAdapter.localize('TURN_PREP.ContextMenu.Arrange') || 'Arrange',
              icon: 'fa-solid fa-arrow-up-wide-short',
              submenu: arrangeSubmenu,
              onSelect: () => {}
            }
          ]
        : [])
    ];
  }


  function buildPlanContextMenuSections(plan: TurnPlan): ContextMenuSection[] {
    return [
      {
        id: `plan-menu-${plan.id}`,
        actions: getPlanContextMenuActions(plan)
      }
    ];
  }

  function openPlanContextMenu(plan: TurnPlan, position: { x: number; y: number }, anchor?: HTMLElement | null) {
    planContextMenuController.open({
      sections: buildPlanContextMenuSections(plan),
      position,
      anchorElement: anchor ?? null,
      context: {
        planId: plan.id,
        ariaLabel: `${plan.name} ${FoundryAdapter.localize('TURN_PREP.TurnPlans.ContextMenuLabel')}`
      }
    });
  }

  function handlePlanContextMenu(plan: TurnPlan, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    openPlanContextMenu(plan, { x: event.clientX, y: event.clientY }, event.currentTarget as HTMLElement);
  }

  function handlePlanMenuButton(plan: TurnPlan, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    const button = event.currentTarget as HTMLElement | null;

    if (button) {
      const rect = button.getBoundingClientRect();
      openPlanContextMenu(plan, { x: rect.right, y: rect.bottom + 4 }, button);
      return;
    }

    openPlanContextMenu(plan, { x: event.clientX, y: event.clientY });
  }
</script>

{#if loading}
  <div class="turn-prep-panel-loading turn-plans-loading">
    <p>{FoundryAdapter.localize('TURN_PREP.Common.Loading')}</p>
  </div>
{:else}
  <div
    class="turn-prep-panel turn-plans-panel"
    bind:this={panelRootElement}
  >
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
        <div class="turn-prep-panel-empty turn-plans-empty">
          <p>{FoundryAdapter.localize('TURN_PREP.TurnPlans.NoPlans')}</p>
        </div>
      {:else}
        <div class="turn-prep-panel-list turn-plans-list is-tight">
          {#each plans as plan (plan.id)}
            <div
              class={`turn-prep-panel-card turn-plan-card ${isPlanCollapsed(plan.id) ? 'is-collapsed' : ''} ${activeContextPlanId === plan.id ? 'is-context-open' : ''}`}
              role="group"
              oncontextmenu={(event) => handlePlanContextMenu(plan, event)}
            >
              <div class="plan-header">
                <button
                  type="button"
                  class="plan-collapse-button"
                  aria-label={FoundryAdapter.localize('TURN_PREP.TurnPlans.TogglePlanBody')}
                  onclick={() => togglePlanCollapsed(plan.id)}
                >
                  <i class={`fas fa-chevron-${isPlanCollapsed(plan.id) ? 'right' : 'down'}`}></i>
                </button>

                <input
                  type="text"
                  class="turn-prep-input plan-name"
                  bind:value={plan.name}
                  placeholder={FoundryAdapter.localize('TURN_PREP.TurnPlans.PlanName')}
                  onchange={scheduleAutoSave}
                />

                <button
                  type="button"
                  class="plan-menu-button"
                  aria-label={FoundryAdapter.localize('TURN_PREP.ContextMenu.OpenLabel')}
                  onclick={(event) => handlePlanMenuButton(plan, event)}
                >
                  <i class="fas fa-ellipsis-vertical"></i>
                </button>
              </div>

              {#if !isPlanCollapsed(plan.id)}
                <div class="plan-content">
                  <div class="plan-feature-sections">
                  <TurnPlanFeatureTable
                    tableKey={`action-${plan.id}`}
                    title={FoundryAdapter.localize('TURN_PREP.TurnPlans.Actions')}
                    actor={actor}
                    features={getActionFeatures(plan)}
                    ownerId={plan.id}
                    panelKind="turn"
                    tableType="actions"
                    onFeatureDrop={(payload) => void handleFeatureDrop(payload as any)}
                    onReorderFeature={(from, to) => handleFeatureReorder(plan.id, 'actions', from, to)}
                    buildMoveToMenu={(feature) => buildTurnMoveCopyMenu(plan.id, feature, false)}
                    buildCopyToMenu={(feature) => buildTurnMoveCopyMenu(plan.id, feature, true)}
                    onRemoveFeature={(featureId) => handleRemoveFeature(plan.id, 'action', featureId)}
                  />

                  <TurnPlanFeatureTable
                    tableKey={`bonus-${plan.id}`}
                    title={FoundryAdapter.localize('TURN_PREP.TurnPlans.BonusActions')}
                    actor={actor}
                    features={getBonusActionFeatures(plan)}
                    ownerId={plan.id}
                    panelKind="turn"
                    tableType="bonusActions"
                    onFeatureDrop={(payload) => void handleFeatureDrop(payload as any)}
                    onReorderFeature={(from, to) => handleFeatureReorder(plan.id, 'bonusActions', from, to)}
                    buildMoveToMenu={(feature) => buildTurnMoveCopyMenu(plan.id, feature, false)}
                    buildCopyToMenu={(feature) => buildTurnMoveCopyMenu(plan.id, feature, true)}
                    onRemoveFeature={(featureId) => handleRemoveFeature(plan.id, 'bonusAction', featureId)}
                  />

                  <TurnPlanFeatureTable
                    tableKey={`additional-${plan.id}`}
                    title={FoundryAdapter.localize('TURN_PREP.TurnPlans.AdditionalFeatures')}
                    actor={actor}
                    features={getAdditionalFeatures(plan)}
                    ownerId={plan.id}
                    panelKind="turn"
                    tableType="additionalFeatures"
                    onFeatureDrop={(payload) => void handleFeatureDrop(payload as any)}
                    onReorderFeature={(from, to) => handleFeatureReorder(plan.id, 'additionalFeatures', from, to)}
                    buildMoveToMenu={(feature) => buildTurnMoveCopyMenu(plan.id, feature, false)}
                    buildCopyToMenu={(feature) => buildTurnMoveCopyMenu(plan.id, feature, true)}
                    onRemoveFeature={(featureId) => handleRemoveFeature(plan.id, 'additional', featureId)}
                  />
                  </div>

                  <div class="turn-plan-notes">
                    <div class="turn-prep-collapsible">
                      <button
                        type="button"
                        class="turn-prep-collapsible__toggle"
                        onclick={() => toggleNotesSection(plan.id)}
                      >
                        <i class={`fas fa-chevron-${isNotesSectionOpen(plan.id) ? 'down' : 'right'}`}></i>
                        {FoundryAdapter.localize('TURN_PREP.TurnPlans.AdditionalNotes')}
                      </button>

                      {#if isNotesSectionOpen(plan.id)}
                        <div class="turn-prep-collapsible__body">
                          <div class="turn-plan-notes__table" role="table">
                            <label class="turn-plan-notes__label" for={"tp-situation-" + plan.id}>
                              {FoundryAdapter.localize('TURN_PREP.TurnPlans.Situation')}
                            </label>
                            <textarea
                              id={"tp-situation-" + plan.id}
                              class="turn-prep-textarea turn-plan-notes__input turn-plan-notes__input--single"
                              bind:value={plan.trigger}
                              placeholder={FoundryAdapter.localize('TURN_PREP.TurnPlans.TriggerPlaceholder')}
                              rows="1"
                              onchange={scheduleAutoSave}
                            ></textarea>

                            <label class="turn-plan-notes__label" for={"tp-movement-" + plan.id}>
                              {FoundryAdapter.localize('TURN_PREP.TurnPlans.Movement')}
                            </label>
                            <textarea
                              id={"tp-movement-" + plan.id}
                              class="turn-prep-textarea turn-plan-notes__input turn-plan-notes__input--single"
                              bind:value={plan.movement}
                              rows="1"
                              onchange={scheduleAutoSave}
                            ></textarea>

                            <label class="turn-plan-notes__label" for={"tp-notes-" + plan.id}>
                              {FoundryAdapter.localize('TURN_PREP.TurnPlans.Notes')}
                            </label>
                            <textarea
                              id={"tp-notes-" + plan.id}
                              class="turn-prep-textarea turn-plan-notes__input turn-plan-notes__input--double"
                              bind:value={plan.roleplay}
                              placeholder={FoundryAdapter.localize('TURN_PREP.TurnPlans.NotesPlaceholder')}
                              rows="2"
                              onchange={scheduleAutoSave}
                            ></textarea>
                          </div>
                        </div>
                      {/if}
                    </div>
                  </div>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    {/if}
  </div>
{/if}

<ContextMenuHost controller={planContextMenuController} />

<style lang="less">
  .turn-plan-card {
    border: 1px solid var(--t5e-border-color, rgba(255, 255, 255, 0.08));

    &.is-context-open {
      box-shadow: 0 0 0 2px var(--t5e-primary-accent-color, #ff6400);
    }

    .plan-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.75rem;

      .plan-collapse-button,
      .plan-menu-button {
        background: transparent;
        border: none;
        color: inherit;
        padding: 0.25rem;
        font-size: 1rem;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;

        &:hover {
          color: var(--t5e-primary-accent-color, #ff6400);
        }
      }

      .plan-collapse-button {
        margin-right: 0.25rem;
      }

      .plan-menu-button {
        margin-left: 0.25rem;
      }

      .plan-name {
        flex: 1;
        font-size: 1.1rem;
        font-weight: bold;
      }
    }

    .plan-content {
      display: flex;
      flex-direction: column;
      gap: 0rem;

      .plan-feature-sections {
        display: flex;
        flex-direction: column;
        gap: 0rem;
        margin-bottom: 0rem;
      }
    }
  }

  
</style>
