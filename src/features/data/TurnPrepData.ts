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
    turnPlans: Array.isArray(data.turnPlans) ? data.turnPlans : [],
    activePlanIndex: typeof data.activePlanIndex === 'number' ? data.activePlanIndex : -1,
    reactions: Array.isArray(data.reactions) ? data.reactions : [],
    history: Array.isArray(data.history) ? data.history : [],
    favorites: Array.isArray(data.favorites) ? data.favorites : [],
  };
}
