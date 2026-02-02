<script lang="ts">
  import { onMount } from 'svelte';
  import type {
    AnyFeatureTableKey,
    Reaction,
    ReactionPlanTableKey,
    SelectedFeature,
    TurnPlan,
    TurnPlanTableKey,
    TurnPrepFeatureDragPayload
  } from '../../types/turn-prep.types';
  import { FoundryAdapter } from '../../foundry/FoundryAdapter';
  import { TurnPrepApiInstance as api } from '../../api/TurnPrepApi';
  import TurnPlanFeatureTable, { type DisplayFeature } from './TurnPlanFeatureTable.svelte';
  import { AUTO_SAVE_DEBOUNCE_MS, FLAG_SCOPE, FLAG_KEY_DATA } from '../../constants';
  import { createEmptyTurnPrepData, createReactionFavoriteSnapshot } from '../../utils/data';
  import {
    buildDisplayFeatureList,
    cloneSelectedFeatureArray,
    cloneSelectedFeature,
    hasDuplicateFeature,
    mergeSelectedFeatureArrays,
    moveArrayItem,
    normalizeActionType,
    resolveReactionPlanTableForActivations
  } from './featureDisplay.helpers';
  import { FeatureSelector } from '../../features/feature-selection/FeatureSelector';
  import ContextMenuHost from './context-menu/ContextMenuHost.svelte';
  import { ContextMenuController } from '../../features/context-menu/ContextMenuController';
  import type { ContextMenuAction, ContextMenuSection } from '../../features/context-menu/context-menu.types';
  import { TurnPrepStorage } from '../../features/data/TurnPrepStorage';
  import * as SettingsModule from '../../settings/settings';

  let { actor }: { actor: any } = $props();

  let reactions: Reaction[] = $state([]);
  let loading = $state(true);
  let initialized = $state(false);
  let collapsed = $state(false);
  let notesCollapsed = $state<Record<string, boolean>>({});
  let reactionCollapseState = $state<Record<string, boolean>>({});
  const reactionContextMenuController = new ContextMenuController('reaction-plans-panel');
  let activeContextReactionId = $state<string | null>(null);

  let saveTimeout: number | null = null;
  const hookCleanups: Array<() => void> = [];

  onMount(() => {
    loadReactions(true);

    registerHook('updateActor', onActorUpdated);
    registerHook('updateItem', onItemChanged);
    registerHook('deleteItem', onItemChanged);

    const unsubscribe = reactionContextMenuController.subscribe((state) => {
      const contextReactionId = state?.context?.reactionId;
      activeContextReactionId = typeof contextReactionId === 'string' ? contextReactionId : null;
    });

    return () => {
      cleanupHooks();
      cancelPendingSave(true);
      unsubscribe();
    };
  });

  $effect(() => {
    const nextState: Record<string, boolean> = {};
    let changed = false;

    for (const reaction of reactions) {
      const existing = notesCollapsed[reaction.id];
      const value = existing ?? true;
      nextState[reaction.id] = value;
      if (existing === undefined) {
        changed = true;
      }
    }

    if (Object.keys(notesCollapsed).length !== Object.keys(nextState).length) {
      changed = true;
    }

    if (changed) {
      notesCollapsed = nextState;
    }
  });

  $effect(() => {
    const nextState: Record<string, boolean> = {};
    let changed = false;

    for (const reaction of reactions) {
      const existing = reactionCollapseState[reaction.id];
      const value = existing ?? false;
      nextState[reaction.id] = value;
      if (existing === undefined) {
        changed = true;
      }
    }

    if (Object.keys(reactionCollapseState).length !== Object.keys(nextState).length) {
      changed = true;
    }

    if (changed) {
      reactionCollapseState = nextState;
    }
  });

  function registerHook(hookName: string, handler: (...args: any[]) => void) {
    if (typeof Hooks === 'undefined') return;
    Hooks.on(hookName, handler);
    hookCleanups.push(() => Hooks.off(hookName, handler));
  }

  function cleanupHooks() {
    while (hookCleanups.length) {
      const dispose = hookCleanups.pop();
      dispose?.();
    }
  }

  function hasTurnPrepFlagChange(changes: any): boolean {
    const flagChanges = changes?.flags;
    if (!flagChanges) return false;
    const scopeChanges = flagChanges[FLAG_SCOPE];
    if (!scopeChanges) return false;
    return Object.prototype.hasOwnProperty.call(scopeChanges, FLAG_KEY_DATA);
  }

  function onActorUpdated(updatedActor: any, changes: any) {
    if (!actor || updatedActor?.id !== actor.id) return;
    if (hasTurnPrepFlagChange(changes)) {
      loadReactions();
    }
  }

  function onItemChanged(item: any) {
    if (!actor || !item?.actor || item.actor.id !== actor.id) return;
    touchReactions();
  }

  function touchReactions() {
    reactions = reactions.map((reaction) => ({ ...reaction }));
  }

  function loadReactions(showSpinner = false) {
    if (!actor) {
      reactions = [];
      loading = false;
      initialized = true;
      return;
    }

    if (showSpinner) {
      loading = true;
    }

    try {
      const turnPrepData = api.getTurnPrepData(actor);
      reactions = hydrateReactions(turnPrepData?.reactions ?? []);
    } catch (error) {
      console.error('[ReactionPlansPanel] Failed to load reactions:', error);
      reactions = [];
      ui.notifications?.error(FoundryAdapter.localize('TURN_PREP.Reactions.SaveError'));
    } finally {
      loading = false;
      initialized = true;
    }
  }

  function hydrateReactions(rawReactions: Reaction[]): Reaction[] {
    return rawReactions.map((reaction) => sanitizeReaction(reaction));
  }

  function sanitizeReaction(rawReaction: any): Reaction {
    const reactionsLabel = FoundryAdapter.localize('TURN_PREP.Reactions.ReactionLabel') || 'Reaction';
    const reactionFeatures = mergeSelectedFeatureArrays(rawReaction?.reactionFeatures, rawReaction?.feature);
    const additionalFeatures = cloneSelectedFeatureArray(rawReaction?.additionalFeatures ?? []);

    return {
      id: rawReaction?.id ?? foundry.utils.randomID(),
      name: typeof rawReaction?.name === 'string'
        ? rawReaction.name
        : reactionsLabel,
      trigger: typeof rawReaction?.trigger === 'string' ? rawReaction.trigger : '',
      reactionFeatures,
      additionalFeatures,
      notes: typeof rawReaction?.notes === 'string' ? rawReaction.notes : '',
      createdTime: typeof rawReaction?.createdTime === 'number' ? rawReaction.createdTime : Date.now(),
      isFavorite: !!rawReaction?.isFavorite,
    };
  }

  type FeatureDropEvent = {
    panelKind: 'reaction';
    table: AnyFeatureTableKey;
    ownerId?: string;
    targetIndex: number | null;
    copy: boolean;
    feature?: SelectedFeature;
    nativeItemUuid?: string;
    source?: TurnPrepFeatureDragPayload | null;
  };

  function cloneFeature(feature?: SelectedFeature | null): SelectedFeature | null {
    return cloneSelectedFeature(feature);
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
      console.error('[ReactionPlansPanel] Failed to resolve UUID drop', uuid, error);
      ui.notifications?.warn(FoundryAdapter.localize('TURN_PREP.TurnPlans.Messages.ItemUnavailable'));
      return { feature: null, activations: [] };
    }
  }

  function coerceReactionTable(table: AnyFeatureTableKey): ReactionPlanTableKey {
    if (table === 'reactionFeatures' || table === 'reactions') return 'reactionFeatures';
    return 'additionalFeatures';
  }

  function pickReactionTableForDrop(requested: AnyFeatureTableKey, activations: string[]): ReactionPlanTableKey {
    const desired = coerceReactionTable(requested);
    if (desired === 'additionalFeatures') return desired;
    if (activations.some((act) => act && resolveReactionPlanTableForActivations([act]) === 'reactionFeatures')) {
      return 'reactionFeatures';
    }
    return 'additionalFeatures';
  }

  function getReactionTable(reaction: Reaction, table: ReactionPlanTableKey): SelectedFeature[] {
    if (table === 'reactionFeatures') return reaction.reactionFeatures ?? [];
    return reaction.additionalFeatures ?? [];
  }

  function setReactionTable(reaction: Reaction, table: ReactionPlanTableKey, value: SelectedFeature[]): Reaction {
    return table === 'reactionFeatures'
      ? { ...reaction, reactionFeatures: value }
      : { ...reaction, additionalFeatures: value };
  }

  function coerceTurnTable(table: AnyFeatureTableKey): TurnPlanTableKey {
    if (table === 'actions' || table === 'bonusActions' || table === 'reactions') return table;
    return 'additionalFeatures';
  }

  function getTurnPlanTable(plan: TurnPlan, table: TurnPlanTableKey): SelectedFeature[] {
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

  function setTurnPlanTable(plan: TurnPlan, table: TurnPlanTableKey, value: SelectedFeature[]): TurnPlan {
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

  function findTurnPlanTable(plan: TurnPlan, featureId: string): TurnPlanTableKey | null {
    if ((plan.actions ?? []).some((f) => f.itemId === featureId)) return 'actions';
    if ((plan.bonusActions ?? []).some((f) => f.itemId === featureId)) return 'bonusActions';
    if ((plan.reactions ?? []).some((f) => f.itemId === featureId)) return 'reactions';
    if ((plan.additionalFeatures ?? []).some((f) => f.itemId === featureId)) return 'additionalFeatures';
    return null;
  }

  function findReaction(reactionId?: string | null): { index: number; reaction: Reaction | null } {
    const index = reactionId ? reactions.findIndex((r) => r.id === reactionId) : -1;
    return { index, reaction: index >= 0 ? reactions[index] : null };
  }

  function isNotesCollapsed(reactionId: string): boolean {
    return notesCollapsed[reactionId] ?? true;
  }

  function toggleNotes(reactionId: string) {
    notesCollapsed = {
      ...notesCollapsed,
      [reactionId]: !isNotesCollapsed(reactionId)
    };
  }

  function isReactionCollapsed(reactionId: string): boolean {
    return !!reactionCollapseState[reactionId];
  }

  function toggleReactionCollapsed(reactionId: string) {
    reactionCollapseState = {
      ...reactionCollapseState,
      [reactionId]: !isReactionCollapsed(reactionId)
    };
  }

  function cancelPendingSave(flush = false) {
    const pending = !!saveTimeout;
    if (saveTimeout) {
      window.clearTimeout(saveTimeout);
      saveTimeout = null;
    }
    if (flush && pending) {
      void saveReactions();
    }
  }

  function scheduleAutoSave() {
    if (!initialized) return;
    if (saveTimeout) {
      window.clearTimeout(saveTimeout);
    }
    saveTimeout = window.setTimeout(() => {
      saveTimeout = null;
      void saveReactions();
    }, AUTO_SAVE_DEBOUNCE_MS);
  }

  function reorderReactions(fromIndex: number, toIndex: number) {
    if (!reactions.length) return;
    const next = moveArrayItem(reactions, fromIndex, toIndex);
    reactions = next;
    scheduleAutoSave();
  }

  function createNewReaction() {
    const newReaction: Reaction = {
      id: foundry.utils.randomID(),
      name: '',
      trigger: '',
      reactionFeatures: [],
      additionalFeatures: [],
      notes: '',
      createdTime: Date.now(),
      isFavorite: false
    };

    reactions = [...reactions, newReaction];
    notesCollapsed = { ...notesCollapsed, [newReaction.id]: true };
    void saveReactions();
  }

  function duplicateReaction(reactionId: string) {
    const sourceIndex = reactions.findIndex((reaction) => reaction.id === reactionId);
    if (sourceIndex === -1) return;

    const source = reactions[sourceIndex];
    const copySuffix = FoundryAdapter.localize('TURN_PREP.Common.CopySuffix') ?? '(Copy)';
    const clone: Reaction = {
      ...source,
      id: foundry.utils.randomID(),
      name: `${source.name || FoundryAdapter.localize('TURN_PREP.Reactions.ReactionLabel')} ${copySuffix}`.trim(),
      reactionFeatures: cloneSelectedFeatureArray(source.reactionFeatures),
      additionalFeatures: cloneSelectedFeatureArray(source.additionalFeatures),
      createdTime: Date.now(),
    };

    reactions = [
      ...reactions.slice(0, sourceIndex + 1),
      clone,
      ...reactions.slice(sourceIndex + 1)
    ];
    notesCollapsed = { ...notesCollapsed, [clone.id]: notesCollapsed[source.id] ?? true };
    void saveReactions();
  }

  async function handleFavoriteReaction(reactionId: string) {
    const reaction = reactions.find((r) => r.id === reactionId);
    if (!reaction) {
      ui.notifications?.warn(FoundryAdapter.localize('TURN_PREP.Reactions.Messages.ReactionMissing') ?? 'Reaction not found');
      return;
    }

    try {
      const snapshot = createReactionFavoriteSnapshot(reaction);
      const data = await TurnPrepStorage.load(actor);
      data.reactions = reactions.map((r) => sanitizeReaction(r));
      data.favoritesReaction = [...(data.favoritesReaction ?? []), snapshot];
      await TurnPrepStorage.save(actor, data);
    } catch (error) {
      console.error('[ReactionPlansPanel] Failed to favorite reaction', error);
      ui.notifications?.error(FoundryAdapter.localize('TURN_PREP.Reactions.SaveError'));
    }
  }

  function getReactionFeatures(reaction: Reaction): DisplayFeature[] {
    const features: SelectedFeature[] = Array.isArray(reaction.reactionFeatures)
      ? reaction.reactionFeatures
      : [];
    return buildDisplayFeatureList(actor, reaction.id, features, 'reaction-primary');
  }

  function getAdditionalFeatures(reaction: Reaction): DisplayFeature[] {
    const extras: SelectedFeature[] = Array.isArray(reaction.additionalFeatures)
      ? reaction.additionalFeatures
      : [];
    return buildDisplayFeatureList(actor, reaction.id, extras, 'reaction-additional');
  }

  function handleRemoveFeature(
    reactionId: string,
    target: 'reaction' | 'additional',
    featureId: string
  ) {
    const index = reactions.findIndex((reaction) => reaction.id === reactionId);
    if (index === -1) return;

    const updated = [...reactions];
    const reaction = {
      ...updated[index],
      reactionFeatures: [...(updated[index].reactionFeatures ?? [])],
      additionalFeatures: [...(updated[index].additionalFeatures ?? [])]
    };

    if (target === 'reaction') {
      reaction.reactionFeatures = reaction.reactionFeatures.filter((feature) => feature.itemId !== featureId);
    } else {
      reaction.additionalFeatures = reaction.additionalFeatures.filter((feature) => feature.itemId !== featureId);
    }

    updated[index] = reaction;
    reactions = updated;
    void saveReactions();
  }

  async function deleteReaction(id: string) {
    const confirmed = await (window as any).foundry.applications.api.DialogV2.confirm({
      window: { title: FoundryAdapter.localize('TURN_PREP.Reactions.DeleteConfirm') },
      content: `<p>${FoundryAdapter.localize('TURN_PREP.Reactions.DeleteConfirmMessage')}</p>`
    });

    if (!confirmed) return;

    reactions = reactions.filter((reaction) => reaction.id !== id);
    const { [id]: _removed, ...remaining } = notesCollapsed;
    notesCollapsed = remaining;
    void saveReactions();
  }

  async function saveReactions() {
    if (!actor) return;
    try {
      const turnPrepData = api.getTurnPrepData(actor) ?? createEmptyTurnPrepData();
      turnPrepData.reactions = reactions.map((reaction) => sanitizeReaction(reaction));
      await api.saveTurnPrepData(actor, turnPrepData);
    } catch (error) {
      console.error('[ReactionPlansPanel] Failed to save reactions:', error);
      ui.notifications?.error(FoundryAdapter.localize('TURN_PREP.Reactions.SaveError'));
    }
  }

  async function saveTurnPrepState(nextReactions: Reaction[], nextTurnPlans?: TurnPlan[]) {
    if (!actor) return;
    try {
      const turnPrepData = api.getTurnPrepData(actor) ?? createEmptyTurnPrepData();
      turnPrepData.reactions = nextReactions.map((reaction) => sanitizeReaction(reaction));
      if (nextTurnPlans) {
        turnPrepData.turnPlans = nextTurnPlans;
      }
      reactions = hydrateReactions(turnPrepData.reactions ?? []);
      await api.saveTurnPrepData(actor, turnPrepData, { render: false });
    } catch (error) {
      console.error('[ReactionPlansPanel] Failed to save reactions:', error);
      ui.notifications?.error(FoundryAdapter.localize('TURN_PREP.Reactions.SaveError'));
    }
  }

  function handleFeatureReorder(
    reactionId: string,
    table: ReactionPlanTableKey,
    fromIndex: number,
    toIndex: number
  ) {
    const { reaction, index } = findReaction(reactionId);
    if (!reaction || index === -1) return;
    const current = getReactionTable(reaction, table);
    if (!current.length) return;
    const next = moveArrayItem(current, fromIndex, toIndex);
    const nextReactions = [...reactions];
    nextReactions[index] = setReactionTable(reaction, table, next);
    reactions = nextReactions;
    scheduleAutoSave();
  }

  function removeFeatureFromReactionSource(
    reactionsList: Reaction[],
    sourceReactionId: string,
    featureId: string,
    tableGuess: AnyFeatureTableKey | null
  ): Reaction[] {
    const sourceIndex = reactionsList.findIndex((r) => r.id === sourceReactionId);
    if (sourceIndex === -1) return reactionsList;
    const sourceReaction = reactionsList[sourceIndex];
    const sourceTable = coerceReactionTable(tableGuess ?? 'additionalFeatures');
    const filtered = getReactionTable(sourceReaction, sourceTable).filter((f) => f.itemId !== featureId);
    const next = [...reactionsList];
    next[sourceIndex] = setReactionTable(sourceReaction, sourceTable, filtered);
    return next;
  }

  function removeFeatureFromTurnPlanSource(
    turnPlans: TurnPlan[],
    sourcePlanId: string,
    featureId: string,
    tableGuess: AnyFeatureTableKey | null
  ): TurnPlan[] {
    const sourceIndex = turnPlans.findIndex((p) => p.id === sourcePlanId);
    if (sourceIndex === -1) return turnPlans;
    const sourcePlan = turnPlans[sourceIndex];
    const sourceTable = coerceTurnTable(
      tableGuess ?? findTurnPlanTable(sourcePlan, featureId) ?? 'additionalFeatures'
    );
    const filtered = getTurnPlanTable(sourcePlan, sourceTable).filter((f) => f.itemId !== featureId);
    const next = [...turnPlans];
    next[sourceIndex] = setTurnPlanTable(sourcePlan, sourceTable, filtered);
    return next;
  }

  async function handleFeatureDrop(event: FeatureDropEvent) {
    if (event.panelKind !== 'reaction') return;
    const targetReactionId = event.ownerId;
    if (!targetReactionId) return;

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

    const targetTable = pickReactionTableForDrop(event.table, activations);

    const turnPrepData = api.getTurnPrepData(actor) ?? createEmptyTurnPrepData();
    let nextReactions = Array.isArray(turnPrepData.reactions) ? [...turnPrepData.reactions] : [];
    let nextTurnPlans = Array.isArray(turnPrepData.turnPlans) ? [...turnPrepData.turnPlans] : [];

    const reactionIndex = nextReactions.findIndex((r) => r.id === targetReactionId);
    if (reactionIndex === -1) {
      ui.notifications?.warn(
        FoundryAdapter.localize('TURN_PREP.Reactions.Messages.ReactionMissing') || 'Reaction not found.'
      );
      return;
    }

    if (!event.copy && event.source?.feature?.itemId) {
      if (event.source.sourceReactionId) {
        nextReactions = removeFeatureFromReactionSource(
          nextReactions,
          event.source.sourceReactionId,
          event.source.feature.itemId,
          event.source.sourceTable ?? null
        );
      } else if (event.source.sourcePlanId) {
        nextTurnPlans = removeFeatureFromTurnPlanSource(
          nextTurnPlans,
          event.source.sourcePlanId,
          event.source.feature.itemId,
          event.source.sourceTable ?? null
        );
      }
    }

    const targetReaction = nextReactions[reactionIndex];
    const targetList = getReactionTable(targetReaction, targetTable);
    if (hasDuplicateFeature(targetList, feature)) {
      ui.notifications?.warn(FoundryAdapter.localize('TURN_PREP.TurnPlans.Messages.DuplicateFeature'));
      return;
    }

    const insertAt = Math.max(0, Math.min(targetList.length, event.targetIndex ?? targetList.length));
    const updatedList = [...targetList];
    updatedList.splice(insertAt, 0, cloneFeature(feature) as SelectedFeature);
    nextReactions[reactionIndex] = setReactionTable(targetReaction, targetTable, updatedList);

    await saveTurnPrepState(nextReactions, nextTurnPlans);
  }

  async function handleMoveCopyWithinReactions(
    fromReactionId: string,
    toReactionId: string,
    table: ReactionPlanTableKey,
    feature: SelectedFeature,
    copy: boolean
  ) {
    const turnPrepData = api.getTurnPrepData(actor) ?? createEmptyTurnPrepData();
    let nextReactions = Array.isArray(turnPrepData.reactions) ? [...turnPrepData.reactions] : [];

    const targetIndex = nextReactions.findIndex((r) => r.id === toReactionId);
    if (targetIndex === -1) {
      ui.notifications?.warn(
        FoundryAdapter.localize('TURN_PREP.Reactions.Messages.ReactionMissing') || 'Reaction not found.'
      );
      return;
    }

    const targetReaction = nextReactions[targetIndex];
    const targetList = getReactionTable(targetReaction, table);
    if (hasDuplicateFeature(targetList, feature)) {
      ui.notifications?.warn(FoundryAdapter.localize('TURN_PREP.TurnPlans.Messages.DuplicateFeature'));
      return;
    }

    if (!copy && fromReactionId) {
      nextReactions = removeFeatureFromReactionSource(nextReactions, fromReactionId, feature.itemId, table);
    }

    const updated = [...getReactionTable(nextReactions[targetIndex], table), cloneFeature(feature) as SelectedFeature];
    nextReactions[targetIndex] = setReactionTable(nextReactions[targetIndex], table, updated);

    await saveTurnPrepState(nextReactions);
  }

  async function handleMoveCopyToTurnPlan(
    fromReactionId: string,
    planId: string,
    table: TurnPlanTableKey,
    feature: SelectedFeature,
    copy: boolean
  ) {
    const turnPrepData = api.getTurnPrepData(actor) ?? createEmptyTurnPrepData();
    let nextReactions = Array.isArray(turnPrepData.reactions) ? [...turnPrepData.reactions] : [];
    const nextTurnPlans = Array.isArray(turnPrepData.turnPlans) ? [...turnPrepData.turnPlans] : [];

    const planIndex = nextTurnPlans.findIndex((p) => p.id === planId);
    if (planIndex === -1) {
      ui.notifications?.warn(FoundryAdapter.localize('TURN_PREP.TurnPlans.Messages.PlanMissing') || 'Plan not found.');
      return;
    }

    const targetPlan = nextTurnPlans[planIndex];
    const targetList = getTurnPlanTable(targetPlan, table);
    if (hasDuplicateFeature(targetList, feature)) {
      ui.notifications?.warn(FoundryAdapter.localize('TURN_PREP.TurnPlans.Messages.DuplicateFeature'));
      return;
    }

    if (!copy && fromReactionId) {
      nextReactions = removeFeatureFromReactionSource(nextReactions, fromReactionId, feature.itemId, 'reactionFeatures');
    }

    const updatedPlanList = [...targetList, cloneFeature(feature) as SelectedFeature];
    nextTurnPlans[planIndex] = setTurnPlanTable(targetPlan, table, updatedPlanList);

    await saveTurnPrepState(nextReactions, nextTurnPlans);
  }

  function buildReactionMoveCopyMenu(
    currentReactionId: string,
    feature: SelectedFeature,
    copy: boolean
  ): ContextMenuSection[] {
    const sections: ContextMenuSection[] = [];
    const activations = getActivationsForFeature(feature);
    const activationSet = new Set(activations.map((a) => normalizeActionType(a)));
    const allowReaction = activationSet.has('reaction');
    const allowAction = activationSet.has('action');
    const allowBonus = activationSet.has('bonus');

    const reactionActions: ContextMenuAction[] = [];
    for (const reaction of reactions) {
      if (reaction.id === currentReactionId) continue;
      if (allowReaction) {
        reactionActions.push({
          id: `${reaction.id}-reaction-${copy ? 'copy' : 'move'}`,
          label: `${reaction.name || FoundryAdapter.localize('TURN_PREP.Reactions.ReactionLabel')} - ${FoundryAdapter.localize('TURN_PREP.Reactions.ReactionFeatures')}`,
          icon: 'fa-solid fa-bolt',
          onSelect: () => handleMoveCopyWithinReactions(currentReactionId, reaction.id, 'reactionFeatures', feature, copy)
        });
      }
      reactionActions.push({
        id: `${reaction.id}-additional-${copy ? 'copy' : 'move'}`,
        label: `${reaction.name || FoundryAdapter.localize('TURN_PREP.Reactions.ReactionLabel')} - ${FoundryAdapter.localize('TURN_PREP.Reactions.AdditionalFeatures')}`,
        icon: 'fa-regular fa-circle-dot',
        onSelect: () => handleMoveCopyWithinReactions(currentReactionId, reaction.id, 'additionalFeatures', feature, copy)
      });
    }

    if (reactionActions.length) {
      sections.push({
        id: `reaction-destinations-${copy ? 'copy' : 'move'}`,
        label: FoundryAdapter.localize('TURN_PREP.Reactions.Title') || 'Reactions',
        actions: reactionActions
      });
    }

    try {
      const turnPrepData = api.getTurnPrepData(actor);
      const plans = turnPrepData?.turnPlans ?? [];
      const turnActions: ContextMenuAction[] = [];
      for (const plan of plans) {
        if (allowAction) {
          turnActions.push({
            id: `${plan.id}-action-${copy ? 'copy' : 'move'}`,
            label: `${plan.name} - ${FoundryAdapter.localize('TURN_PREP.TurnPlans.Actions')}`,
            icon: 'fa-solid fa-person-running',
            onSelect: () => handleMoveCopyToTurnPlan(currentReactionId, plan.id, 'actions', feature, copy)
          });
        }
        if (allowBonus) {
          turnActions.push({
            id: `${plan.id}-bonus-${copy ? 'copy' : 'move'}`,
            label: `${plan.name} - ${FoundryAdapter.localize('TURN_PREP.TurnPlans.BonusActions')}`,
            icon: 'fa-solid fa-plus',
            onSelect: () => handleMoveCopyToTurnPlan(currentReactionId, plan.id, 'bonusActions', feature, copy)
          });
        }
        turnActions.push({
          id: `${plan.id}-additional-${copy ? 'copy' : 'move'}`,
          label: `${plan.name} - ${FoundryAdapter.localize('TURN_PREP.TurnPlans.AdditionalFeatures')}`,
          icon: 'fa-regular fa-circle-dot',
          onSelect: () => handleMoveCopyToTurnPlan(currentReactionId, plan.id, 'additionalFeatures', feature, copy)
        });
      }

      if (turnActions.length) {
        sections.push({
          id: `turn-destinations-${copy ? 'copy' : 'move'}`,
          label: FoundryAdapter.localize('TURN_PREP.TurnPlans.Title') || 'Turns',
          actions: turnActions
        });
      }
    } catch (error) {
      console.warn('[ReactionPlansPanel] Failed to build turn destination menu', error);
    }

    return sections;
  }

  function getReactionContextMenuActions(reaction: Reaction): ContextMenuAction[] {
    const index = reactions.findIndex((r) => r.id === reaction.id);
    const total = reactions.length;

    const arrangeActions: ContextMenuAction[] = index === -1
      ? []
      : [
          {
            id: 'move-up',
            label: FoundryAdapter.localize('TURN_PREP.ContextMenu.MoveUp') || 'Move Up',
            icon: 'fa-solid fa-angle-up',
            onSelect: () => reorderReactions(index, Math.max(0, index - 1))
          },
          {
            id: 'move-down',
            label: FoundryAdapter.localize('TURN_PREP.ContextMenu.MoveDown') || 'Move Down',
            icon: 'fa-solid fa-angle-down',
            onSelect: () => reorderReactions(index, Math.min(total - 1, index + 1))
          },
          {
            id: 'move-top',
            label: FoundryAdapter.localize('TURN_PREP.ContextMenu.MoveTop') || 'Move to Top',
            icon: 'fa-solid fa-angles-up',
            onSelect: () => reorderReactions(index, 0)
          },
          {
            id: 'move-bottom',
            label: FoundryAdapter.localize('TURN_PREP.ContextMenu.MoveBottom') || 'Move to Bottom',
            icon: 'fa-solid fa-angles-down',
            onSelect: () => reorderReactions(index, total - 1)
          }
        ];

    const arrangeSubmenu: ContextMenuSection[] = arrangeActions.length
      ? [
          {
            id: `${reaction.id}-reorder`,
            actions: arrangeActions
          }
        ]
      : [];

    return [
      {
        id: 'duplicate',
        label: FoundryAdapter.localize('TURN_PREP.Reactions.ContextMenu.Duplicate'),
        icon: 'fa-regular fa-copy',
        onSelect: () => duplicateReaction(reaction.id)
      },
      {
        id: 'delete',
        label: FoundryAdapter.localize('TURN_PREP.Reactions.ContextMenu.Delete'),
        icon: 'fa-regular fa-trash-can',
        variant: 'destructive',
        onSelect: () => void deleteReaction(reaction.id)
      },
      {
        id: 'favorite',
        label: FoundryAdapter.localize('TURN_PREP.Reactions.ContextMenu.AddToFavorites'),
        icon: 'fa-regular fa-star',
        onSelect: () => void handleFavoriteReaction(reaction.id)
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

  function buildReactionContextMenuSections(reaction: Reaction): ContextMenuSection[] {
    return [
      {
        id: `reaction-menu-${reaction.id}`,
        actions: getReactionContextMenuActions(reaction)
      }
    ];
  }

  function openReactionContextMenu(
    reaction: Reaction,
    position: { x: number; y: number },
    anchor?: HTMLElement | null
  ) {
    reactionContextMenuController.open({
      sections: buildReactionContextMenuSections(reaction),
      position,
      anchorElement: anchor ?? null,
      context: {
        reactionId: reaction.id,
        ariaLabel: `${reaction.name || FoundryAdapter.localize('TURN_PREP.Reactions.ReactionLabel')} ${FoundryAdapter.localize('TURN_PREP.Reactions.ContextMenuLabel')}`
      }
    });
  }

  function handleReactionContextMenu(reaction: Reaction, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    openReactionContextMenu(reaction, { x: event.clientX, y: event.clientY }, event.currentTarget as HTMLElement);
  }

  function handleReactionMenuButton(reaction: Reaction, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    const button = event.currentTarget as HTMLElement | null;

    if (button) {
      const rect = button.getBoundingClientRect();
      openReactionContextMenu(reaction, { x: rect.right, y: rect.bottom + 4 }, button);
      return;
    }

    openReactionContextMenu(reaction, { x: event.clientX, y: event.clientY });
  }

</script>

{#if loading}
  <div class="turn-prep-panel-loading reaction-plans-loading">
    <p>{FoundryAdapter.localize('TURN_PREP.Common.Loading')}</p>
  </div>
{:else}
  <div class="turn-prep-panel reaction-plans-panel">
    <div class="turn-prep-panel-header">
      <button
        type="button"
        class="turn-prep-panel-toggle"
        title={collapsed ? 'Expand' : 'Collapse'}
        onclick={() => collapsed = !collapsed}
      >
        <i class="fas fa-chevron-{collapsed ? 'right' : 'down'}"></i>
      </button>
      <h3>{FoundryAdapter.localize('TURN_PREP.Reactions.Title')}</h3>
      <button
        type="button"
        class="turn-prep-panel-action-btn"
        onclick={createNewReaction}
      >
        <i class="fas fa-plus"></i>
        {FoundryAdapter.localize('TURN_PREP.Reactions.NewReaction')}
      </button>
    </div>

    {#if !collapsed}
      {#if reactions.length === 0}
        <div class="turn-prep-panel-empty reaction-plans-empty">
          <p>{FoundryAdapter.localize('TURN_PREP.Reactions.NoReactions')}</p>
        </div>
      {:else}
        <div class="turn-prep-panel-list reaction-plans-list">
          {#each reactions as reaction (reaction.id)}
            <div
              class={`turn-prep-panel-card reaction-card ${isReactionCollapsed(reaction.id) ? 'is-collapsed' : ''} ${activeContextReactionId === reaction.id ? 'is-context-open' : ''}`}
              role="group"
              oncontextmenu={(event) => handleReactionContextMenu(reaction, event)}
            >
              <div class="reaction-header">
                <div class="turn-prep-inline-label-row reaction-name-row">
                  <button
                    type="button"
                    class="reaction-collapse-button"
                    aria-label={FoundryAdapter.localize('TURN_PREP.Reactions.ToggleBody')}
                    onclick={() => toggleReactionCollapsed(reaction.id)}
                  >
                    <i class={`fas fa-chevron-${isReactionCollapsed(reaction.id) ? 'right' : 'down'}`}></i>
                  </button>
                  <label
                    for={"reaction-name-" + reaction.id}
                  >
                    {FoundryAdapter.localize('TURN_PREP.Reactions.Trigger')}
                  </label>
                  <input
                    id={"reaction-name-" + reaction.id}
                    type="text"
                    class="turn-prep-input reaction-name"
                    bind:value={reaction.name}
                    placeholder={FoundryAdapter.localize('TURN_PREP.Reactions.TriggerPlaceholder')}
                    oninput={scheduleAutoSave}
                  />
                </div>
                <button
                  type="button"
                  class="reaction-menu-button"
                  aria-label={FoundryAdapter.localize('TURN_PREP.ContextMenu.OpenLabel')}
                  title={FoundryAdapter.localize('TURN_PREP.ContextMenu.OpenLabel')}
                  onclick={(event) => handleReactionMenuButton(reaction, event)}
                >
                  <i class="fas fa-ellipsis-vertical"></i>
                </button>
              </div>

              {#if !isReactionCollapsed(reaction.id)}
                <div class="reaction-content">

                <TurnPlanFeatureTable
                  tableKey={`reaction-${reaction.id}`}
                  ownerId={reaction.id}
                  panelKind="reaction"
                  tableType="reactionFeatures"
                  title={FoundryAdapter.localize('TURN_PREP.Reactions.ReactionFeatures')}
                  actor={actor}
                  features={getReactionFeatures(reaction)}
                  onFeatureDrop={handleFeatureDrop}
                  onReorderFeature={(from, to) => handleFeatureReorder(reaction.id, 'reactionFeatures', from, to)}
                  buildMoveToMenu={(feature) => buildReactionMoveCopyMenu(reaction.id, feature, false)}
                  buildCopyToMenu={(feature) => buildReactionMoveCopyMenu(reaction.id, feature, true)}
                  onRemoveFeature={(featureId) => handleRemoveFeature(reaction.id, 'reaction', featureId)}
                />

                <TurnPlanFeatureTable
                  tableKey={`reaction-additional-${reaction.id}`}
                  ownerId={reaction.id}
                  panelKind="reaction"
                  tableType="additionalFeatures"
                  title={FoundryAdapter.localize('TURN_PREP.Reactions.AdditionalFeatures')}
                  actor={actor}
                  features={getAdditionalFeatures(reaction)}
                  onFeatureDrop={handleFeatureDrop}
                  onReorderFeature={(from, to) => handleFeatureReorder(reaction.id, 'additionalFeatures', from, to)}
                  buildMoveToMenu={(feature) => buildReactionMoveCopyMenu(reaction.id, feature, false)}
                  buildCopyToMenu={(feature) => buildReactionMoveCopyMenu(reaction.id, feature, true)}
                  onRemoveFeature={(featureId) => handleRemoveFeature(reaction.id, 'additional', featureId)}
                />

                <div class={`turn-prep-collapsible reaction-notes ${isNotesCollapsed(reaction.id) ? '' : 'is-open'}`}>
                  <button
                    type="button"
                    class="turn-prep-collapsible__toggle notes-toggle"
                    onclick={() => toggleNotes(reaction.id)}
                  >
                    <i class="fas fa-chevron-{isNotesCollapsed(reaction.id) ? 'right' : 'down'}"></i>
                    <span>{FoundryAdapter.localize('TURN_PREP.Reactions.Notes')}</span>
                  </button>
                  {#if !isNotesCollapsed(reaction.id)}
                    <div class="turn-prep-collapsible__body">
                      <textarea
                        class="turn-prep-textarea notes-input"
                        bind:value={reaction.notes}
                        placeholder={FoundryAdapter.localize('TURN_PREP.Reactions.NotesPlaceholder')}
                        rows="3"
                        oninput={scheduleAutoSave}
                      ></textarea>
                    </div>
                  {/if}
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

<ContextMenuHost controller={reactionContextMenuController} />

<style lang="less">
  .reaction-card {
    &.is-context-open {
      box-shadow: 0 0 0 2px var(--t5e-primary-accent-color, #ff6400);
    }

    .reaction-header {
      display: flex;
      align-items: center;
      gap: 0rem;
      margin-bottom: 0rem;

      .reaction-name-row {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 0.25rem;
      }

      .reaction-name {
        flex: 1;
        font-size: 0.95rem;
        font-weight: 500;
      }

      .reaction-collapse-button {
        background: transparent;
        border: none;
        color: inherit;
        padding: 0.25rem;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;

        &:hover {
          color: var(--t5e-primary-accent-color, #ff6400);
        }
      }

      .reaction-menu-button {
        padding: 0.35rem;
        background: transparent;
        border: none;
        color: inherit;
        cursor: pointer;
        font-size: 1.05rem;
        display: flex;
        align-items: center;
        justify-content: center;

        &:hover {
          color: var(--t5e-primary-accent-color, #ff6400);
        }
      }
    }

    .reaction-content {
      display: flex;
      flex-direction: column;
      gap: 0rem;
    }
  }
</style>
