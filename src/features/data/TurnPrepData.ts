/**
 * Turn Prep Data Model
 * 
 * Core data model for Turn Prep module.
 * Provides type definitions and utilities for managing turn preparation data.
 * All data is stored in actor.flags['turn-prep'] and accessed through this module.
 */

export type {
  TurnPrepData,
  TurnPlan,
  TurnSnapshot,
  Reaction,
  SelectedFeature,
  SnapshotFeature,
  DMQuestion,
} from '../../types';

export {
  generateId,
  createDMQuestion,
  createTurnPlan,
  createReaction,
  createTurnSnapshot,
  snapshotFeature,
  createEmptyTurnPrepData,
} from '../../utils/data';

import type { TurnPrepData, TurnPlan, SelectedFeature, Reaction } from '../../types';
import { createTurnPlan } from '../../utils/data';

/**
 * Validation methods for Turn Prep data
 */

/**
 * Check if a turn plan is valid for saving
 * In this system, any plan can be saved (no required fields)
 * @param plan - The turn plan to validate
 * @returns True if plan has valid structure
 */
export function isValidTurnPlan(plan: TurnPlan): boolean {
  return !!(plan && plan.id && typeof plan.name === 'string');
}

/**
 * Check if a turn prep data structure is valid
 * @param data - The data to validate
 * @returns True if data has valid structure
 */
export function isValidTurnPrepData(data: TurnPrepData): boolean {
  return !!(
    data &&
    typeof data.version === 'number' &&
    Array.isArray(data.dmQuestions) &&
    Array.isArray(data.turnPlans) &&
    typeof data.activePlanIndex === 'number' &&
    Array.isArray(data.reactions) &&
    Array.isArray(data.history) &&
    Array.isArray(data.favorites)
  );
}

/**
 * Validate and auto-correct a turn prep data structure
 * Fills in missing arrays or defaults if they're undefined
 * @param data - The data to validate
 * @returns Corrected data if invalid, original if valid
 */
export function validateAndCorrectTurnPrepData(data: any): TurnPrepData {
  if (!data) {
    return {
      version: 1,
      dmQuestions: [],
      turnPlans: [],
      activePlanIndex: -1,
      reactions: [],
      history: [],
      favorites: [],
    };
  }

  return {
    version: data.version ?? 1,
    dmQuestions: Array.isArray(data.dmQuestions) ? data.dmQuestions : [],
    turnPlans: Array.isArray(data.turnPlans)
      ? data.turnPlans.map((plan: any) => normalizeTurnPlan(plan))
      : [],
    activePlanIndex: typeof data.activePlanIndex === 'number' ? data.activePlanIndex : -1,
    reactions: Array.isArray(data.reactions) ? data.reactions : [],
    history: Array.isArray(data.history) ? data.history : [],
    favorites: Array.isArray(data.favorites) ? data.favorites : [],
  };
}

function normalizeTurnPlan(plan: any): TurnPlan {
  if (!plan || typeof plan !== 'object') {
    return createTurnPlan('Turn Plan', '');
  }

  const normalized = createTurnPlan(
    typeof plan.name === 'string' ? plan.name : 'Turn Plan',
    typeof plan.trigger === 'string' ? plan.trigger : ''
  );

  normalized.id = typeof plan.id === 'string' ? plan.id : normalized.id;
  normalized.movement = typeof plan.movement === 'string' ? plan.movement : '';
  normalized.roleplay = typeof plan.roleplay === 'string' ? plan.roleplay : '';
  normalized.categories = Array.isArray(plan.categories)
    ? plan.categories.filter((cat: unknown) => typeof cat === 'string' && cat.trim().length > 0)
    : [];

  normalized.actions = normalizeFeatureArray(plan.actions ?? plan.action);
  normalized.bonusActions = normalizeFeatureArray(plan.bonusActions ?? plan.bonusAction);
  normalized.reactions = normalizeFeatureArray(plan.reactions);
  normalized.additionalFeatures = normalizeFeatureArray(plan.additionalFeatures);

  return normalized;
}

function normalizeFeatureArray(value: any): SelectedFeature[] {
  if (!value) {
    return [];
  }

  const list = Array.isArray(value) ? value : [value];
  return list
    .map((entry) => normalizeSelectedFeature(entry))
    .filter((entry): entry is SelectedFeature => !!entry);
}

function normalizeSelectedFeature(feature: any): SelectedFeature | null {
  if (!feature || typeof feature !== 'object') {
    return null;
  }

  const itemId = typeof feature.itemId === 'string' ? feature.itemId : null;
  const itemName = typeof feature.itemName === 'string' ? feature.itemName : null;
  const itemType = typeof feature.itemType === 'string' ? feature.itemType : null;
  const actionType = typeof feature.actionType === 'string' ? feature.actionType : 'other';

  if (!itemId || !itemName || !itemType) {
    return null;
  }

  return {
    itemId,
    itemName,
    itemType,
    actionType,
  };
}
