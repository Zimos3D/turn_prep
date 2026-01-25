/**
 * Validation Utilities
 * 
 * Functions to validate data structures before saving or using them.
 * Ensures data integrity throughout the module.
 * Follows a strict validation philosophy: fail fast, report clearly.
 */

import type {
  DMQuestion,
  TurnPlan,
  Reaction,
  TurnSnapshot,
  SelectedFeature,
  SnapshotFeature,
  TurnPrepData,
  ModuleSettings,
} from '../types';
import { warn, error, logOperationError } from './logging';

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if a value is a non-empty string
 * @param value - The value to check
 * @returns True if value is a non-empty string
 */
export function isNonEmptyString(value: any): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Check if a value is a valid number
 * @param value - The value to check
 * @returns True if value is a number
 */
export function isValidNumber(value: any): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Check if a value is a valid timestamp (milliseconds)
 * @param value - The value to check
 * @returns True if value is a valid timestamp
 */
export function isValidTimestamp(value: any): value is number {
  return isValidNumber(value) && value > 0;
}

/**
 * Check if a value is a valid array of strings (tags)
 * @param value - The value to check
 * @returns True if value is a valid tag array
 */
export function isValidTagArray(value: any): value is string[] {
  return (
    Array.isArray(value) &&
    value.every((tag) => typeof tag === 'string' && tag.trim().length > 0)
  );
}

/**
 * Check if a value is a valid ID (non-empty string)
 * @param value - The value to check
 * @returns True if value is a valid ID
 */
export function isValidId(value: any): value is string {
  return isNonEmptyString(value) && value.length > 0;
}

// ============================================================================
// DM Questions Validation
// ============================================================================

/**
 * Validate a single DM Question
 * @param question - The question to validate
 * @param throwOnError - Whether to throw or return false
 * @returns True if valid
 * @throws ValidationError if throwOnError is true and validation fails
 */
export function validateDMQuestion(
  question: any,
  throwOnError: boolean = false
): question is DMQuestion {
  try {
    // Check required fields
    if (!isValidId(question?.id)) {
      throw new Error('Question must have a valid id');
    }

    if (!isNonEmptyString(question?.text)) {
      throw new Error('Question must have non-empty text');
    }

    if (!isValidTagArray(question?.tags)) {
      throw new Error('Question tags must be an array of non-empty strings');
    }

    if (!isValidTimestamp(question?.createdTime)) {
      throw new Error('Question must have a valid createdTime timestamp');
    }

    return true;
  } catch (err) {
    if (throwOnError) throw err;
    warn(`Invalid DM Question: ${(err as Error).message}`);
    return false;
  }
}

/**
 * Validate an array of DM Questions
 * @param questions - The questions to validate
 * @returns Array of valid questions, invalid ones filtered out with warnings
 */
export function validateDMQuestions(questions: any[]): DMQuestion[] {
  if (!Array.isArray(questions)) {
    warn('DM Questions must be an array');
    return [];
  }

  return questions.filter((q, index) => {
    if (!validateDMQuestion(q)) {
      warn(`Filtering out invalid DM Question at index ${index}`);
      return false;
    }
    return true;
  });
}

// ============================================================================
// Selected Feature Validation
// ============================================================================

/**
 * Validate a selected feature reference
 * @param feature - The feature to validate
 * @param allowNull - Whether to allow null/undefined
 * @returns True if valid
 */
export function validateSelectedFeature(
  feature: any,
  allowNull: boolean = true
): feature is SelectedFeature | null {
  if (feature === null || feature === undefined) {
    return allowNull;
  }

  return (
    isValidId(feature?.itemId) &&
    isNonEmptyString(feature?.itemName) &&
    isNonEmptyString(feature?.itemType) &&
    isNonEmptyString(feature?.actionType)
  );
}

/**
 * Validate an array of selected features
 * @param features - The features to validate
 * @returns Array of valid features, invalid ones filtered out with warnings
 */
export function validateSelectedFeatures(features: any[]): SelectedFeature[] {
  if (!Array.isArray(features)) {
    warn('Features must be an array');
    return [];
  }

  return features.filter((f, index) => {
    if (!validateSelectedFeature(f, false)) {
      warn(`Filtering out invalid feature at index ${index}`);
      return false;
    }
    return true;
  });
}

// ============================================================================
// Turn Plans Validation
// ============================================================================

/**
 * Validate a single Turn Plan
 * @param plan - The plan to validate
 * @param throwOnError - Whether to throw or return false
 * @returns True if valid
 */
export function validateTurnPlan(plan: any, throwOnError: boolean = false): plan is TurnPlan {
  try {
    // Check required fields
    if (!isValidId(plan?.id)) {
      throw new Error('Turn plan must have a valid id');
    }

    if (!isNonEmptyString(plan?.name)) {
      throw new Error('Turn plan must have a non-empty name');
    }

    if (!isNonEmptyString(plan?.trigger)) {
      throw new Error('Turn plan must have a trigger description');
    }

    // Validate feature collections
    if (!Array.isArray(plan?.actions)) {
      throw new Error('Turn plan actions must be an array');
    }

    plan.actions.forEach((feature: any, index: number) => {
      if (!validateSelectedFeature(feature, false)) {
        throw new Error(`Turn plan actions contains invalid feature at index ${index}`);
      }
    });

    if (!Array.isArray(plan?.bonusActions)) {
      throw new Error('Turn plan bonusActions must be an array');
    }

    plan.bonusActions.forEach((feature: any, index: number) => {
      if (!validateSelectedFeature(feature, false)) {
        throw new Error(`Turn plan bonusActions contains invalid feature at index ${index}`);
      }
    });

    if (!Array.isArray(plan?.reactions)) {
      throw new Error('Turn plan reactions must be an array');
    }

    plan.reactions.forEach((feature: any, index: number) => {
      if (!validateSelectedFeature(feature, false)) {
        throw new Error(`Turn plan reactions contains invalid feature at index ${index}`);
      }
    });

    if (!isNonEmptyString(plan?.movement)) {
      throw new Error('Turn plan must have a movement description');
    }

    if (!isNonEmptyString(plan?.roleplay)) {
      throw new Error('Turn plan must have a roleplay description');
    }

    if (!Array.isArray(plan?.additionalFeatures)) {
      throw new Error('Turn plan additionalFeatures must be an array');
    }

    plan.additionalFeatures.forEach((feature: any, index: number) => {
      if (!validateSelectedFeature(feature, false)) {
        throw new Error(`Turn plan additionalFeatures contains invalid feature at index ${index}`);
      }
    });

    if (!isValidTagArray(plan?.categories)) {
      throw new Error('Turn plan categories must be an array of non-empty strings');
    }

    return true;
  } catch (err) {
    if (throwOnError) throw err;
    warn(`Invalid Turn Plan: ${(err as Error).message}`);
    return false;
  }
}

/**
 * Validate an array of Turn Plans
 * @param plans - The plans to validate
 * @returns Array of valid plans, invalid ones filtered out with warnings
 */
export function validateTurnPlans(plans: any[]): TurnPlan[] {
  if (!Array.isArray(plans)) {
    warn('Turn plans must be an array');
    return [];
  }

  return plans.filter((p, index) => {
    if (!validateTurnPlan(p)) {
      warn(`Filtering out invalid Turn Plan at index ${index}`);
      return false;
    }
    return true;
  });
}

// ============================================================================
// Reactions Validation
// ============================================================================

/**
 * Validate a single Reaction
 * @param reaction - The reaction to validate
 * @param throwOnError - Whether to throw or return false
 * @returns True if valid
 */
export function validateReaction(
  reaction: any,
  throwOnError: boolean = false
): reaction is Reaction {
  try {
    if (!isValidId(reaction?.id)) {
      throw new Error('Reaction must have a valid id');
    }

    if (!isNonEmptyString(reaction?.trigger)) {
      throw new Error('Reaction must have a trigger description');
    }

    if (!validateSelectedFeature(reaction?.feature, false)) {
      throw new Error('Reaction must have a valid feature');
    }

    if (!Array.isArray(reaction?.additionalFeatures)) {
      throw new Error('Reaction additionalFeatures must be an array');
    }

    return true;
  } catch (err) {
    if (throwOnError) throw err;
    warn(`Invalid Reaction: ${(err as Error).message}`);
    return false;
  }
}

/**
 * Validate an array of Reactions
 * @param reactions - The reactions to validate
 * @returns Array of valid reactions, invalid ones filtered out with warnings
 */
export function validateReactions(reactions: any[]): Reaction[] {
  if (!Array.isArray(reactions)) {
    warn('Reactions must be an array');
    return [];
  }

  return reactions.filter((r, index) => {
    if (!validateReaction(r)) {
      warn(`Filtering out invalid Reaction at index ${index}`);
      return false;
    }
    return true;
  });
}

// ============================================================================
// Turn Snapshot Validation
// ============================================================================

/**
 * Validate a snapshot feature (immutable copy of a feature at a point in time)
 * @param feature - The snapshot feature to validate
 * @returns True if valid
 */
export function validateSnapshotFeature(feature: any): feature is SnapshotFeature {
  return (
    isValidId(feature?.itemId) &&
    isNonEmptyString(feature?.itemName) &&
    isNonEmptyString(feature?.itemType) &&
    isNonEmptyString(feature?.actionType)
  );
}

/**
 * Validate a Turn Snapshot
 * @param snapshot - The snapshot to validate
 * @returns True if valid
 */
export function validateTurnSnapshot(snapshot: any): snapshot is TurnSnapshot {
  try {
    if (!isValidId(snapshot?.id)) {
      throw new Error('Snapshot must have a valid id');
    }

    if (!isValidTimestamp(snapshot?.createdTime)) {
      throw new Error('Snapshot must have a valid createdTime');
    }

    if (!isNonEmptyString(snapshot?.planName)) {
      throw new Error('Snapshot must have a planName');
    }

    if (!Array.isArray(snapshot?.actions)) {
      throw new Error('Snapshot actions must be an array');
    }

    snapshot.actions.forEach((feature: any, index: number) => {
      if (!validateSnapshotFeature(feature)) {
        throw new Error(`Snapshot actions contains invalid feature at index ${index}`);
      }
    });

    if (!Array.isArray(snapshot?.bonusActions)) {
      throw new Error('Snapshot bonusActions must be an array');
    }

    snapshot.bonusActions.forEach((feature: any, index: number) => {
      if (!validateSnapshotFeature(feature)) {
        throw new Error(`Snapshot bonusActions contains invalid feature at index ${index}`);
      }
    });

    if (!Array.isArray(snapshot?.reactions)) {
      throw new Error('Snapshot reactions must be an array');
    }

    snapshot.reactions.forEach((feature: any, index: number) => {
      if (!validateSnapshotFeature(feature)) {
        throw new Error(`Snapshot reactions contains invalid feature at index ${index}`);
      }
    });

    if (!isNonEmptyString(snapshot?.movement)) {
      throw new Error('Snapshot movement must be non-empty string');
    }

    if (!isNonEmptyString(snapshot?.trigger)) {
      throw new Error('Snapshot trigger must be non-empty string');
    }

    if (!Array.isArray(snapshot?.additionalFeatures)) {
      throw new Error('Snapshot additionalFeatures must be an array');
    }

    snapshot.additionalFeatures.forEach((feature: any, index: number) => {
      if (!validateSnapshotFeature(feature)) {
        throw new Error(`Snapshot additionalFeatures contains invalid feature at index ${index}`);
      }
    });

    if (!isValidTagArray(snapshot?.categories)) {
      throw new Error('Snapshot categories must be valid tag array');
    }

    return true;
  } catch (err) {
    warn(`Invalid Turn Snapshot: ${(err as Error).message}`);
    return false;
  }
}

/**
 * Validate an array of Turn Snapshots
 * @param snapshots - The snapshots to validate
 * @returns Array of valid snapshots, invalid ones filtered out
 */
export function validateTurnSnapshots(snapshots: any[]): TurnSnapshot[] {
  if (!Array.isArray(snapshots)) {
    warn('Snapshots must be an array');
    return [];
  }

  return snapshots.filter((s, index) => {
    if (!validateTurnSnapshot(s)) {
      warn(`Filtering out invalid Turn Snapshot at index ${index}`);
      return false;
    }
    return true;
  });
}

// ============================================================================
// Complete Data Validation
// ============================================================================

/**
 * Validate complete Turn Prep data structure
 * Auto-corrects obvious errors (wrong types converted to defaults)
 * @param data - The data to validate
 * @returns True if data is valid (after corrections)
 */
export function validateTurnPrepData(data: any): data is TurnPrepData {
  try {
    // Check structure
    if (typeof data !== 'object' || data === null) {
      throw new Error('Turn Prep data must be an object');
    }

    // Version check
    if (!isValidNumber(data?.version) || data.version < 1) {
      throw new Error('Turn Prep data must have a valid version number');
    }

    // Validate all collections (auto-corrects invalid entries)
    data.dmQuestions = validateDMQuestions(data?.dmQuestions || []);
    data.turnPlans = validateTurnPlans(data?.turnPlans || []);
    data.reactions = validateReactions(data?.reactions || []);
    data.history = validateTurnSnapshots(data?.history || []);
    data.favorites = validateTurnSnapshots(data?.favorites || []);

    // Validate active plan index
    if (!isValidNumber(data?.activePlanIndex)) {
      data.activePlanIndex = -1;
    } else if (data.activePlanIndex >= data.turnPlans.length || data.activePlanIndex < -1) {
      data.activePlanIndex = -1;
    }

    return true;
  } catch (err) {
    error(`Invalid Turn Prep data structure: ${(err as Error).message}`);
    return false;
  }
}

// ============================================================================
// Settings Validation
// ============================================================================

/**
 * Validate module settings
 * @param settings - The settings to validate
 * @returns True if settings are valid
 */
export function validateModuleSettings(settings: any): settings is ModuleSettings {
  return (
    isValidNumber(settings?.historyLimit) &&
    settings.historyLimit >= 5 &&
    settings.historyLimit <= 50 &&
    typeof settings?.allowDmViewPlayerTurnPrep === 'boolean' &&
    typeof settings?.enableTurnPrepTab === 'boolean'
  );
}

// ============================================================================
// Actor & Item Validation
// ============================================================================

/**
 * Check if an actor ID is valid
 * @param actorId - The actor ID to check
 * @returns True if actor exists
 */
export function isValidActorId(actorId: string): boolean {
  if (!isValidId(actorId)) return false;
  return typeof game !== 'undefined' && game.actors?.has(actorId) === true;
}

/**
 * Check if an item exists on an actor
 * @param actorId - The actor ID
 * @param itemId - The item ID
 * @returns True if item exists on actor
 */
export function itemExistsOnActor(actorId: string, itemId: string): boolean {
  if (!isValidActorId(actorId) || !isValidId(itemId)) return false;
  const actor = game.actors?.get(actorId);
  return actor?.items?.has(itemId) === true;
}
