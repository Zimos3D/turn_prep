/**
 * Turn Plans Panel Component
 * 
 * Svelte component for managing turn plans.
 * Allows creating, editing, and managing multiple turn plan options.
 * 
 * Props:
 * - actor: The character actor
 */

<script lang="ts">
  import { onMount } from 'svelte';
  import type { TurnPlan, SelectedFeature } from '../../types/turn-prep.types';
  import { FoundryAdapter } from '../../foundry/FoundryAdapter';
  import { TurnPrepApiInstance as api } from '../../api/TurnPrepApi';
  import { FeatureSelector } from '../../features/feature-selection/FeatureSelector';
  import TurnPlanFeatureTable, {
    type DisplayFeature,
    type DisplayActivity,
    type RollDisplay,
    type DamageDisplayEntry
  } from './TurnPlanFeatureTable.svelte';
  import { AUTO_SAVE_DEBOUNCE_MS, FLAG_SCOPE, FLAG_KEY_DATA } from '../../constants';
  import { createEmptyTurnPrepData } from '../../utils/data';

  // Props
  let { actor }: { actor: any } = $props();

  // State
  let plans: TurnPlan[] = $state([]);
  let loading = $state(true);
  let initialized = $state(false);

  let saveTimeout: number | null = null;
  const hookCleanups: Array<() => void> = [];

  // Initialize plans from actor flags
  onMount(() => {
    loadPlans(true);

    registerHook('updateActor', onActorUpdated);
    registerHook('updateItem', onItemChanged);
    registerHook('deleteItem', onItemChanged);

    return () => {
      cleanupHooks();
      cancelPendingSave(true);
    };
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

  function onActorUpdated(updatedActor: any, changes: any) {
    if (!actor || updatedActor?.id !== actor.id) return;
    if (hasTurnPrepFlagChange(changes)) {
      loadPlans();
    }
  }

  function hasTurnPrepFlagChange(changes: any): boolean {
    const flagChanges = changes?.flags;
    if (!flagChanges) return false;
    const scopeChanges = flagChanges[FLAG_SCOPE];
    if (!scopeChanges) return false;
    return Object.prototype.hasOwnProperty.call(scopeChanges, FLAG_KEY_DATA);
  }

  function onItemChanged(item: any) {
    if (!actor || !item?.actor || item.actor.id !== actor.id) return;
    touchPlans();
  }

  function touchPlans() {
    plans = plans.map((plan) => ({ ...plan }));
  }

  function loadPlans(showSpinner = false) {
    if (!actor) {
      plans = [];
      loading = false;
      initialized = true;
      return;
    }

    if (showSpinner) {
      loading = true;
    }

    try {
      const turnPrepData = api.getTurnPrepData(actor);
      plans = hydratePlans(turnPrepData?.turnPlans ?? []);
    } catch (error) {
      console.error('[TurnPlansPanel] Failed to load turn plans:', error);
      plans = [];
      ui.notifications?.error(FoundryAdapter.localize('TURN_PREP.TurnPlans.SaveError'));
    } finally {
      loading = false;
      initialized = true;
    }
  }

  function hydratePlans(rawPlans: TurnPlan[]): TurnPlan[] {
    return rawPlans.map((plan) => sanitizePlan(plan));
  }

  function sanitizePlan(rawPlan: any): TurnPlan {
    const actions = mergeFeatureArrays(rawPlan.actions, rawPlan.action);
    const bonusActions = mergeFeatureArrays(rawPlan.bonusActions, rawPlan.bonusAction);
    const reactions = mergeFeatureArrays(rawPlan.reactions);
    const additional = cloneFeatureArray(rawPlan.additionalFeatures ?? []);

    return {
      id: rawPlan.id ?? foundry.utils.randomID(),
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
      id: foundry.utils.randomID(),
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
    void savePlans();
  }

  function normalizeActionType(value?: string | null) {
    return (value || '').toLowerCase();
  }

  function getActionFeatures(plan: TurnPlan): DisplayFeature[] {
    const features: SelectedFeature[] = Array.isArray(plan.actions) ? plan.actions : [];
    const additional = (plan.additionalFeatures ?? []).filter(
      (feature) => normalizeActionType(feature.actionType) === 'action'
    );
    return [
      ...buildFeatureList(plan, features, 'action-primary'),
      ...buildFeatureList(plan, additional, 'action-extra')
    ];
  }

  function getBonusActionFeatures(plan: TurnPlan): DisplayFeature[] {
    const features: SelectedFeature[] = Array.isArray(plan.bonusActions) ? plan.bonusActions : [];
    const additional = (plan.additionalFeatures ?? []).filter(
      (feature) => normalizeActionType(feature.actionType) === 'bonus'
    );
    return [
      ...buildFeatureList(plan, features, 'bonus-primary'),
      ...buildFeatureList(plan, additional, 'bonus-extra')
    ];
  }

  function getAdditionalFeatures(plan: TurnPlan): DisplayFeature[] {
    const extras = (plan.additionalFeatures ?? []).filter((feature) => {
      const type = normalizeActionType(feature.actionType);
      return type !== 'action' && type !== 'bonus';
    });
    return buildFeatureList(plan, extras, 'additional');
  }

  function buildFeatureList(plan: TurnPlan, list: SelectedFeature[], keyPrefix: string): DisplayFeature[] {
    return list
      .map((feature, index) => buildDisplayFeature(plan, feature, `${keyPrefix}-${index}`))
      .filter((feature): feature is DisplayFeature => !!feature);
  }

  function buildDisplayFeature(plan: TurnPlan, feature: SelectedFeature, keySuffix: string): DisplayFeature | null {
    if (!feature?.itemId) return null;
    const rowKey = `${plan.id}-${keySuffix}-${feature.itemId}`;
    const item = actor?.items?.get?.(feature.itemId);

    if (!item) {
      return {
        ...feature,
        rowKey,
        icon: null,
        usesValue: null,
        usesMax: null,
        rollLabel: null,
        formula: null,
        range: null,
        target: null,
        summary: FoundryAdapter.localize('TURN_PREP.TurnPlans.Table.MissingItemDetails'),
        tags: [FoundryAdapter.localize('TURN_PREP.TurnPlans.Table.MissingItem')],
        isMissing: true,
        activities: [],
        descriptionHtml: null,
        descriptionRollData: null
      };
    }

    const system = (item as any).system ?? {};
    const rawActivities = FeatureSelector.getActivitiesForItem(item) ?? [];
    const activityDisplays = buildActivityList(item, rawActivities, rowKey);
    const { usesValue, usesMax } = resolveFeatureUses(system, rawActivities);
    const rollMeta = resolveRollMeta(item, rawActivities);
    const rollLabel = rollMeta?.label ?? null;
    const rollDisplay = rollMeta ?? null;
    const formula = resolveFormula(system, rawActivities, item);
    const range = resolveRange(system?.range, rawActivities);
    const target = resolveTarget(item, rawActivities);
    const damageEntries = resolveDamageEntries(item, rawActivities);
    const descriptionHtml = extractDescriptionHtml(system?.description);
    const descriptionRollData = item?.actor?.getRollData?.() ?? item?.getRollData?.() ?? null;

    return {
      ...feature,
      rowKey,
      itemName: item.name ?? feature.itemName,
      itemType: item.type ?? feature.itemType,
      icon: item.img ?? null,
      usesValue,
      usesMax,
      rollLabel,
      rollDisplay,
      formula,
      range,
      target,
      damageEntries,
      descriptionHtml,
      descriptionRollData,
      summary: formatSummary(system?.description),
      tags: buildTagList(feature, item, system),
      isMissing: false,
      activities: activityDisplays
    };
  }

  function buildActivityList(item: any, activities: any[], rowKey: string): DisplayActivity[] {
    if (!activities?.length) {
      return [];
    }

    return activities
      .map((activity: any, index: number) => formatDisplayActivity(item, activity, rowKey, index))
      .filter((activity): activity is DisplayActivity => !!activity);
  }

  function formatDisplayActivity(item: any, activity: any, rowKey: string, index: number): DisplayActivity | null {
    if (!activity) {
      return null;
    }

    const rawId = activity.id ?? activity._id ?? index;
    const activityId = String(rawId);
    const name = activity.name ?? item?.name ?? FoundryAdapter.localize('TURN_PREP.TurnPlans.Table.Feature');
    const { usesValue, usesMax } = resolveActivityUses(activity, item);

    return {
      activityId,
      rowKey: `${rowKey}-activity-${activityId}`,
      name,
      icon: activity.img ?? item?.img ?? null,
      usesValue,
      usesMax,
      timeLabel: formatActivityTime(activity),
      formula: formatFormula(activity, item),
      damageEntries: formatDamageEntries(activity)
    };
  }

  function resolveActivityUses(activity: any, item: any): { usesValue: number | string | null; usesMax: number | string | null } {
    const useType = getActivityUseSource(activity);
    if (useType === 'itemUses') {
      return {
        usesValue: formatUsesValue(item?.system),
        usesMax: formatUsesMax(item?.system)
      };
    }
    if (useType === 'activityUses') {
      return {
        usesValue: formatUsesValue(activity),
        usesMax: formatUsesMax(activity)
      };
    }
    return {
      usesValue: formatUsesValue(activity),
      usesMax: formatUsesMax(activity)
    };
  }

  function getActivityUseSource(activity: any): 'itemUses' | 'activityUses' | null {
    const targets = activity?.consumption?.targets;
    if (!Array.isArray(targets)) {
      return null;
    }
    const target = targets.find((entry: any) => entry?.type === 'itemUses' || entry?.type === 'activityUses');
    return target?.type ?? null;
  }

  function resolveFeatureUses(system: any, activities: any[]): { usesValue: number | string | null; usesMax: number | string | null } {
    let usesValue = formatUsesValue(system);
    let usesMax = formatUsesMax(system);

    if (!hasDisplayValue(usesValue) && !hasDisplayValue(usesMax)) {
      const activityWithUses = activities?.find((activity: any) => hasDisplayValue(formatUsesMax(activity)));
      if (activityWithUses) {
        usesValue = formatUsesValue(activityWithUses);
        usesMax = formatUsesMax(activityWithUses);
      }
    }

    return { usesValue, usesMax };
  }

  function resolveRollMeta(item: any, activities: any[]): RollDisplay | null {
    const direct = formatRollDisplay(item);
    if (direct) {
      return direct;
    }
    return selectFromActivities(activities, (activity) => formatActivityRollDisplay(activity));
  }

  function resolveFormula(source: any, activities: any[], item: any): string | null {
    const direct = formatFormula(source, item);
    if (hasDisplayValue(direct)) {
      return direct;
    }
    return selectFromActivities(activities, (activity) => formatFormula(activity, item));
  }

  function resolveRange(range: any, activities: any[]): string | null {
    const direct = formatRange(range);
    if (hasDisplayValue(direct)) {
      return direct;
    }
    return selectFromActivities(activities, (activity) => formatRange(activity?.range ?? activity?.system?.range));
  }

  function resolveTarget(item: any, activities: any[]): string | null {
    const labelTarget = formatLabelsTarget(item, activities);
    if (hasDisplayValue(labelTarget)) {
      return labelTarget;
    }

    const direct = formatTarget(item?.system?.target);
    if (hasDisplayValue(direct)) {
      return direct;
    }

    return selectFromActivities(activities, (activity) => formatTarget(activity?.target ?? activity?.system?.target));
  }

  function formatLabelsTarget(item: any, activities: any[]): string | null {
    const labels = item?.labels;
    if (!labels) {
      return null;
    }

    const activationTargets = collectActivationTargets(labels, activities);
    if (activationTargets.length > 1) {
      return activationTargets.join(' / ');
    }
    if (activationTargets.length === 1) {
      return labels?.target ?? activationTargets[0];
    }

    const singleTarget = labels?.target;
    return hasDisplayValue(singleTarget) ? singleTarget : null;
  }

  function collectActivationTargets(labels: any, activities: any[]): string[] {
    const activationLabels = labels?.activations;
    if (!activationLabels) {
      return [];
    }

    const targets: string[] = [];
    const seen = new Set<string>();
    const addTarget = (value: unknown) => {
      if (typeof value !== 'string') return;
      const trimmed = value.trim();
      if (!trimmed || seen.has(trimmed)) return;
      seen.add(trimmed);
      targets.push(trimmed);
    };

    if (Array.isArray(activationLabels)) {
      for (const entry of activationLabels) {
        addTarget(entry?.target);
      }
      return targets;
    }

    if (typeof activationLabels === 'object') {
      if (Array.isArray(activities) && activities.length) {
        for (const activity of activities) {
          const key = activity?.id ?? activity?._id;
          if (!key) continue;
          const activationEntry = activationLabels[key];
          addTarget(activationEntry?.target);
        }
      } else {
        for (const entry of Object.values(activationLabels)) {
          addTarget((entry as any)?.target);
        }
      }
    }

    return targets;
  }

  function resolveDamageEntries(item: any, activities: any[]): DamageDisplayEntry[] {
    const direct = formatDamageEntries(item);
    if (direct.length) {
      return direct;
    }
    const fromActivity = selectFromActivities(activities, (activity) => {
      const entries = formatDamageEntries(activity);
      return entries.length ? entries : null;
    });
    return fromActivity ?? [];
  }

  function selectFromActivities<T>(activities: any[], selector: (activity: any) => T | null | undefined): T | null {
    for (const activity of activities ?? []) {
      const value = selector(activity);
      if (value === undefined || value === null) {
        continue;
      }
      if (typeof value === 'string' && !hasDisplayValue(value)) {
        continue;
      }
      return value as T;
    }
    return null;
  }

  function formatDamageEntries(source: any): DamageDisplayEntry[] {
    const damages = source?.labels?.damages;
    if (!Array.isArray(damages) || !damages.length) {
      return [];
    }
    return damages
      .map((entry) => normalizeDamageEntry(entry))
      .filter((entry): entry is DamageDisplayEntry => !!entry);
  }

  function normalizeDamageEntry(entry: any): DamageDisplayEntry | null {
    const rawFormula = entry?.formula ?? entry?.value;
    if (!hasDisplayValue(rawFormula)) {
      return null;
    }
    const formula = String(rawFormula).trim();
    if (!formula.length) {
      return null;
    }

    const damageType = extractDamageType(entry);
    const typeLabel = damageType ? capitalizeDamageType(damageType) : null;
    return {
      formula,
      type: typeLabel,
      icon: getDamageIconPath(damageType),
      ariaLabel: typeLabel ? `${formula} ${typeLabel}` : formula
    };
  }

  function extractDamageType(entry: any): string | null {
    const type = entry?.damageType ?? entry?.type ?? entry?.types;
    if (typeof type === 'string') {
      const trimmed = type.trim();
      return trimmed ? trimmed.toLowerCase() : null;
    }
    if (Array.isArray(type)) {
      const found = type.find((value) => typeof value === 'string' && value.trim().length);
      return found ? found.trim().toLowerCase() : null;
    }
    return null;
  }

  const DAMAGE_ICON_BASE_PATH = 'systems/dnd5e/icons/svg/damage';

  function getDamageIconPath(type: string | null): string | null {
    if (!type) return null;
    return `${DAMAGE_ICON_BASE_PATH}/${type}.svg`;
  }

  function capitalizeDamageType(type: string): string {
    if (!type) return type;
    return type
      .split(/[-\s]/)
      .filter(Boolean)
      .map((segment) => capitalize(segment))
      .join(' ');
  }

  function formatActivityRollDisplay(activity: any): RollDisplay | null {
    const labels = activity?.labels;
    if (hasDisplayValue(labels?.toHit)) {
      return { value: labels.toHit };
    }
    if (labels?.attack) {
      return { label: labels.attack };
    }

    const save = activity?.save ?? labels?.save;
    if (save) {
      const ability = extractAbilityAbbreviation(save?.ability ?? labels?.save?.ability);
      const dcValue = extractDcValue(save?.dc ?? labels?.save?.dc, labels?.save);
      if (ability || dcValue) {
        return {
          ability,
          value: dcValue,
          label: typeof labels?.save === 'string' ? labels.save : null
        };
      }
    }

    const activationType = activity?.activation?.type;
    return activationType ? { label: capitalize(activationType) } : null;
  }

  function extractAbilityAbbreviation(value: any): string | null {
    if (!value) return null;
    if (typeof value === 'string') {
      return value.toUpperCase();
    }
    if (Array.isArray(value) && value.length) {
      return value.map((entry) => String(entry).toUpperCase()).join('/');
    }
    if (typeof value?.first === 'function') {
      const first = value.first();
      return typeof first === 'string' ? first.toUpperCase() : null;
    }
    return null;
  }

  function extractDcValue(dc: any, fallbackLabel?: any): number | string | null {
    if (typeof dc === 'number' || typeof dc === 'string') {
      return dc;
    }
    if (typeof dc?.value === 'number' || typeof dc?.value === 'string') {
      return dc.value;
    }
    if (typeof fallbackLabel === 'string') {
      const match = fallbackLabel.match(/(\d+)/);
      return match ? match[1] : null;
    }
    return null;
  }

  function hasDisplayValue(value: unknown): boolean {
    return !(value === undefined || value === null || value === '');
  }

  function formatActivityTime(activity: any): string | null {
    const activation = activity?.activation;
    if (!activation?.type) {
      return null;
    }

    const typeLabel = capitalize(activation.type);
    const cost =
      typeof activation.cost === 'number'
        ? activation.cost
        : typeof activation.value === 'number'
          ? activation.value
          : null;

    if (cost && cost > 1) {
      return `${cost} ${typeLabel}`;
    }

    return typeLabel;
  }

  function formatUsesValue(system: any): number | string | null {
    const uses = system?.uses;
    if (!uses) return null;
    return typeof uses.value === 'number' || typeof uses.value === 'string' ? uses.value : null;
  }

  function formatUsesMax(system: any): number | string | null {
    const uses = system?.uses;
    if (!uses) return null;
    return typeof uses.max === 'number' || typeof uses.max === 'string' ? uses.max : null;
  }

  function extractDamageFormula(part: any, item?: any): string | null {
    if (!part) return null;
    if (typeof part === 'string') {
      return resolveFormulaVariables(part, item);
    }
    if (part?.formula) {
      return resolveFormulaVariables(part.formula, item);
    }
    if (part?.custom?.formula) {
      return resolveFormulaVariables(part.custom.formula, item);
    }
    if (Array.isArray(part) && part.length) {
      return resolveFormulaVariables(part[0], item);
    }
    return null;
  }

  function resolveFormulaVariables(formula: string, item?: any): string {
    if (!formula || typeof formula !== 'string' || !formula.includes('@')) {
      return formula;
    }
    try {
      const rollData = item?.actor?.getRollData?.() ?? item?.getRollData?.();
      const RollClass = (globalThis as any)?.Roll;
      if (!rollData || typeof RollClass?.replaceFormulaData !== 'function') {
        return formula;
      }
      return RollClass.replaceFormulaData(formula, rollData);
    } catch (error) {
      console.warn('[TurnPlansPanel] Failed to resolve formula variables', error);
      return formula;
    }
  }

  function formatRollDisplay(item: any): RollDisplay | null {
    const labels = item?.labels;
    if (hasDisplayValue(labels?.toHit)) {
      return { value: labels.toHit };
    }
    if (labels?.attack) {
      return { label: labels.attack };
    }

    const save = item?.system?.save ?? labels?.save;
    if (save) {
      const ability = extractAbilityAbbreviation(save?.ability ?? labels?.save?.ability);
      const value = extractDcValue(save?.dc ?? labels?.save?.dc, labels?.save);
      if (ability || value) {
        return {
          ability,
          value,
          label: typeof labels?.save === 'string' ? labels.save : null
        };
      }
    }

    const activationType = item?.system?.activation?.type;
    return activationType ? { label: capitalize(activationType) } : null;
  }

  function formatFormula(system: any, item?: any): string | null {
    const parts = system?.damage?.parts ?? system?.damageParts;
    if (Array.isArray(parts) && parts.length) {
      const formulas = parts
        .map((part) => (Array.isArray(part) ? part[0] : part))
        .map((entry) => extractDamageFormula(entry, item))
        .filter((entry) => typeof entry === 'string' && entry.trim().length > 0);
      if (formulas.length) {
        return formulas.join(' + ');
      }
    }
    if (typeof system?.formula === 'string' && system.formula.trim().length) {
      return resolveFormulaVariables(system.formula.trim(), item);
    }
    return null;
  }

  function formatRange(range: any): string | null {
    if (!range) return null;
    if (typeof range === 'string') {
      return normalizeRangeOutput(range);
    }
    const shortValue = getNumericRangeValue(range.short ?? range.value);
    const longValue = getNumericRangeValue(range.long);
    let distanceLabel: string | null = null;

    if (shortValue !== null && longValue !== null) {
      distanceLabel = `${shortValue} / ${longValue}`;
    } else if (shortValue !== null) {
      distanceLabel = `${shortValue}`;
    } else if (typeof range.value === 'string' && range.value.trim().length) {
      distanceLabel = range.value.trim();
    }

    const units = formatRangeUnits(range.units);
    const output = [distanceLabel, units].filter(Boolean).join(' ').trim();
    return normalizeRangeOutput(output);
  }

  function getNumericRangeValue(value: any): number | null {
    return typeof value === 'number' ? value : null;
  }

  function formatRangeUnits(units: any): string {
    if (typeof units !== 'string') return '';
    const trimmed = units.trim();
    if (!trimmed || trimmed.toLowerCase() === 'self') {
      return '';
    }
    const normalized = trimmed.toLowerCase();
    const labelMap: Record<string, string> = {
      ft: 'ft.',
      mi: 'mi.',
      m: 'm',
      km: 'km'
    };
    return labelMap[normalized] ?? trimmed;
  }

  function normalizeRangeOutput(value?: string | null): string | null {
    if (!value) return null;
    const trimmed = value.trim();
    if (!trimmed || trimmed.toLowerCase() === 'self') {
      return null;
    }
    return trimmed;
  }

  function formatTarget(target: any): string | null {
    if (!target) return null;
    const template = target.template || target.shape;
    if (template) {
      const pieces: string[] = [];
      const size = template.size ?? template.value;
      if (size) {
        const units = template.units ? `${template.units}` : '';
        pieces.push(`${size}${units ? ` ${units}` : ''}`);
      }
      if (template.type) {
        pieces.push(capitalize(template.type));
      }
      if (template.width && template.type === 'line') {
        pieces.push(`${template.width} ft wide`);
      }
      return pieces.length ? pieces.join(' ').trim() : null;
    }
    const parts: string[] = [];
    if (target.value) {
      parts.push(String(target.value));
    }
    if (target.units) {
      parts.push(capitalize(target.units));
    }
    if (target.type) {
      parts.push(capitalize(target.type));
    }
    return parts.length ? parts.join(' ') : null;
  }

  function extractDescriptionHtml(description: any): string | null {
    const raw = typeof description === 'string' ? description : description?.value;
    if (typeof raw !== 'string') return null;
    const trimmed = raw.trim();
    return trimmed.length ? trimmed : null;
  }

  function formatSummary(description: any): string | null {
    const raw = typeof description === 'string' ? description : description?.value;
    if (typeof raw !== 'string') return null;
    const text = stripHtml(raw);
    if (!text) return null;
    return text.length > 320 ? `${text.slice(0, 317)}...` : text;
  }

  function stripHtml(value: string): string {
    return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function buildTagList(feature: SelectedFeature, item: any, system: any): string[] {
    const tags = new Set<string>();
    const actionType = normalizeActionType(feature.actionType);
    if (actionType) {
      tags.add(capitalize(actionType));
    }
    if (item?.type) {
      tags.add(capitalize(item.type));
    }
    const activation = system?.activation?.type;
    if (activation) {
      tags.add(capitalize(activation));
    }
    if (system?.school?.abbr) {
      tags.add(system.school.abbr.toUpperCase());
    }
    return Array.from(tags).filter(Boolean);
  }

  function capitalize(value: string): string {
    if (!value) return value;
    return value.charAt(0).toUpperCase() + value.slice(1);
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
      plan.additionalFeatures = plan.additionalFeatures.filter(
        (feature) => !(feature.itemId === featureId && normalizeActionType(feature.actionType) === 'action')
      );
    } else if (target === 'bonusAction') {
      plan.bonusActions = plan.bonusActions.filter((feature) => feature.itemId !== featureId);
      plan.additionalFeatures = plan.additionalFeatures.filter(
        (feature) => !(feature.itemId === featureId && normalizeActionType(feature.actionType) === 'bonus')
      );
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
    void savePlans();
  }

  // Save all plans to actor flags
  async function savePlans() {
    if (!actor) return;
    try {
      const turnPrepData = api.getTurnPrepData(actor) ?? createEmptyTurnPrepData();
      turnPrepData.turnPlans = plans.map((plan) => sanitizePlan(plan));
      await api.saveTurnPrepData(actor, turnPrepData);
    } catch (error) {
      console.error('[TurnPlansPanel] Failed to save plans:', error);
      ui.notifications?.error(FoundryAdapter.localize('TURN_PREP.TurnPlans.SaveError'));
    }
  }
</script>

{#if loading}
  <div class="turn-plans-loading">
    <p>{FoundryAdapter.localize('TURN_PREP.Common.Loading')}</p>
  </div>
{:else}
  <div class="turn-plans-panel">
    <!-- Header with New Plan button -->
    <div class="turn-plans-header">
      <h3>{FoundryAdapter.localize('TURN_PREP.TurnPlans.Title')}</h3>
      <button
        type="button"
        class="new-plan-button"
        onclick={createNewPlan}
      >
        <i class="fas fa-plus"></i>
        {FoundryAdapter.localize('TURN_PREP.TurnPlans.NewPlan')}
      </button>
    </div>

    <!-- Plans list -->
    {#if plans.length === 0}
      <div class="turn-plans-empty">
        <p>{FoundryAdapter.localize('TURN_PREP.TurnPlans.NoPlans')}</p>
      </div>
    {:else}
      <div class="turn-plans-list">
        {#each plans as plan (plan.id)}
          <div class="turn-plan-card">
            <div class="plan-header">
              <input
                type="text"
                class="plan-name"
                bind:value={plan.name}
                placeholder={FoundryAdapter.localize('TURN_PREP.TurnPlans.PlanName')}
                oninput={scheduleAutoSave}
              />
              <button
                type="button"
                class="delete-plan-button"
                onclick={() => deletePlan(plan.id)}
                title={FoundryAdapter.localize('TURN_PREP.TurnPlans.DeleteTooltip')}
              >
                <i class="fas fa-trash"></i>
              </button>
            </div>

            <div class="plan-content">
              <div class="plan-feature-sections">
                <TurnPlanFeatureTable
                  tableKey={`action-${plan.id}`}
                  title={FoundryAdapter.localize('TURN_PREP.TurnPlans.Actions')}
                  features={getActionFeatures(plan)}
                  onRemoveFeature={(featureId) => handleRemoveFeature(plan.id, 'action', featureId)}
                />

                <TurnPlanFeatureTable
                  tableKey={`bonus-${plan.id}`}
                  title={FoundryAdapter.localize('TURN_PREP.TurnPlans.BonusActions')}
                  features={getBonusActionFeatures(plan)}
                  onRemoveFeature={(featureId) => handleRemoveFeature(plan.id, 'bonusAction', featureId)}
                />

                <TurnPlanFeatureTable
                  tableKey={`additional-${plan.id}`}
                  title={FoundryAdapter.localize('TURN_PREP.TurnPlans.AdditionalFeatures')}
                  features={getAdditionalFeatures(plan)}
                  onRemoveFeature={(featureId) => handleRemoveFeature(plan.id, 'additional', featureId)}
                />
              </div>

              <div class="plan-field">
                <label for={"tp-trigger-" + plan.id}>{FoundryAdapter.localize('TURN_PREP.TurnPlans.Trigger')}</label>
                <input
                  id={"tp-trigger-" + plan.id}
                  type="text"
                  bind:value={plan.trigger}
                  placeholder={FoundryAdapter.localize('TURN_PREP.TurnPlans.TriggerPlaceholder')}
                  oninput={scheduleAutoSave}
                />
              </div>

              <div class="plan-field">
                <label for={"tp-movement-" + plan.id}>{FoundryAdapter.localize('TURN_PREP.TurnPlans.Movement')}</label>
                <input
                  id={"tp-movement-" + plan.id}
                  type="text"
                  bind:value={plan.movement}
                  oninput={scheduleAutoSave}
                />
              </div>

              <div class="plan-field">
                <label for={"tp-roleplay-" + plan.id}>{FoundryAdapter.localize('TURN_PREP.TurnPlans.RoleplayNotes')}</label>
                <textarea
                  id={"tp-roleplay-" + plan.id}
                  bind:value={plan.roleplay}
                  rows="3"
                  oninput={scheduleAutoSave}
                ></textarea>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
{/if}

<style lang="less">
  .turn-plans-panel {
    padding: 1rem;
  }

  .turn-plans-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;

    h3 {
      margin: 0;
      font-size: 1.2rem;
    }

    .new-plan-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: var(--t5e-primary-accent-color);
      color: var(--t5e-light-color);
      border: none;
      border-radius: 4px;
      cursor: pointer;

      &:hover {
        background: var(--t5e-primary-accent-hover-color);
      }
    }
  }

  .turn-plans-empty {
    text-align: center;
    padding: 2rem;
    color: var(--t5e-tertiary-color);
  }

  .turn-plans-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .turn-plan-card {
    background: var(--t5e-sheet-background);
    border: 1px solid var(--t5e-faint-color);
    border-radius: 4px;
    padding: 1rem;

    .plan-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;

      .plan-name {
        flex: 1;
        font-size: 1.1rem;
        font-weight: bold;
        padding: 0.5rem;
        border: 1px solid var(--t5e-faint-color);
        border-radius: 4px;
      }

      .delete-plan-button {
        padding: 0.5rem;
        background: transparent;
        border: none;
        color: var(--t5e-warning-accent-color);
        cursor: pointer;
        font-size: 1.1rem;

        &:hover {
          color: var(--t5e-warning-accent-hover-color);
        }
      }
    }

    .plan-content {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;

      .plan-feature-sections {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        margin-bottom: 0.5rem;
      }

      .plan-field {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;

        label {
          font-weight: 600;
          font-size: 0.9rem;
          color: var(--t5e-primary-color);
        }

        input, textarea {
          padding: 0.5rem;
          border: 1px solid var(--t5e-faint-color);
          border-radius: 4px;
          font-family: inherit;
          font-size: 0.9rem;

          &:focus {
            outline: none;
            border-color: var(--t5e-primary-accent-color);
          }
        }

        textarea {
          resize: vertical;
          min-height: 60px;
        }
      }
    }
  }

  .turn-plans-loading {
    text-align: center;
    padding: 2rem;
  }
</style>
