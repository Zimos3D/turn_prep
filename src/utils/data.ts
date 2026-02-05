/**
 * Data Utilities
 * 
 * Helper functions for data manipulation.
 * Includes cloning, merging, filtering, and safe property access.
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  DMQuestion,
  TurnPlan,
  Reaction,
  TurnSnapshot,
  ReactionFavoriteSnapshot,
  SelectedFeature,
  SnapshotFeature,
  TurnPrepData,
} from '../types';

// ============================================================================
// ID Generation
// ============================================================================

/**
 * Generate a unique ID
 * Uses UUID v4 for strong uniqueness guarantees
 * @returns A new unique ID string
 */
export function generateId(): string {
  return uuidv4();
}

/**
 * Generate a short unique ID (first 8 chars of UUID)
 * Useful for display purposes where length matters
 * @returns A short unique ID string
 */
export function generateShortId(): string {
  return generateId().substring(0, 8);
}

// ============================================================================
// Object Cloning & Merging
// ============================================================================

/**
 * Deep clone an object
 * Creates a completely independent copy
 * @param obj - The object to clone
 * @returns A deep clone of the object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as any;
  }

  if (obj instanceof Array) {
    return obj.map((item) => deepClone(item)) as any;
  }

  if (obj instanceof Object) {
    const clonedObj: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone((obj as any)[key]);
      }
    }
    return clonedObj;
  }

  return obj;
}

/**
 * Shallow merge objects
 * Second object properties override first
 * @param target - The target object
 * @param source - The source object to merge in
 * @returns A new merged object
 */
export function mergeObjects<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  return { ...target, ...source } as T;
}

/**
 * Deep merge objects
 * Recursively merges nested objects
 * @param target - The target object
 * @param source - The source object to merge in
 * @returns A new deeply merged object
 */
export function mergeObjectsDeep<T extends Record<string, any>>(
  target: T,
  source: Partial<T>
): T {
  const result = deepClone(target);

  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      const sourceValue = source[key];
      const targetValue = result[key];

      if (
        sourceValue !== null &&
        typeof sourceValue === 'object' &&
        !Array.isArray(sourceValue) &&
        targetValue !== null &&
        typeof targetValue === 'object' &&
        !Array.isArray(targetValue)
      ) {
        result[key] = mergeObjectsDeep(targetValue, sourceValue);
      } else {
        result[key] = sourceValue as any;
      }
    }
  }

  return result;
}

// ============================================================================
// Safe Property Access
// ============================================================================

/**
 * Safely get a nested property using dot notation
 * Returns undefined if path doesn't exist (no errors)
 * @param obj - The object to query
 * @param path - The property path (e.g., 'data.flags.turn-prep')
 * @param defaultValue - Optional default if not found
 * @returns The property value or undefined
 */
export function getProperty(
  obj: any,
  path: string,
  defaultValue: any = undefined
): any {
  try {
    const keys = path.split('.');
    let result = obj;

    for (const key of keys) {
      if (result === null || result === undefined) {
        return defaultValue;
      }
      result = result[key];
    }

    return result !== undefined ? result : defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * Safely set a nested property using dot notation
 * Creates intermediate objects as needed
 * @param obj - The object to modify
 * @param path - The property path (e.g., 'data.flags.turn-prep')
 * @param value - The value to set
 */
export function setProperty(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  const lastKey = keys.pop();

  if (!lastKey) return;

  let current = obj;
  for (const key of keys) {
    if (current[key] === undefined || current[key] === null) {
      current[key] = {};
    }
    current = current[key];
  }

  current[lastKey] = value;
}

// ============================================================================
// Array Operations
// ============================================================================

/**
 * Deduplicate an array based on a property or function
 * @param arr - The array to deduplicate
 * @param keyFn - Function to extract the key, or string property name
 * @returns A deduplicated array
 */
export function deduplicateArray<T>(
  arr: T[],
  keyFn: ((item: T) => any) | string
): T[] {
  const seen = new Set();
  return arr.filter((item) => {
    const key = typeof keyFn === 'string' ? (item as any)[keyFn] : keyFn(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

/**
 * Find an item in an array and return its index
 * @param arr - The array to search
 * @param predicate - Function to test each item
 * @returns The index, or -1 if not found
 */
export function findIndex<T>(arr: T[], predicate: (item: T) => boolean): number {
  for (let i = 0; i < arr.length; i++) {
    if (predicate(arr[i])) {
      return i;
    }
  }
  return -1;
}

/**
 * Replace an item in an array
 * @param arr - The array
 * @param index - The index to replace
 * @param item - The new item
 * @returns A new array with the replacement
 */
export function replaceArrayItem<T>(arr: T[], index: number, item: T): T[] {
  const newArr = [...arr];
  if (index >= 0 && index < newArr.length) {
    newArr[index] = item;
  }
  return newArr;
}

/**
 * Remove an item from an array by index
 * @param arr - The array
 * @param index - The index to remove
 * @returns A new array with the item removed
 */
export function removeArrayItem<T>(arr: T[], index: number): T[] {
  return arr.filter((_, i) => i !== index);
}

/**
 * Move an item in an array to a new position
 * @param arr - The array
 * @param fromIndex - Current index
 * @param toIndex - New index
 * @returns A new array with the item moved
 */
export function moveArrayItem<T>(arr: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex === toIndex) return arr;
  const newArr = [...arr];
  const [item] = newArr.splice(fromIndex, 1);
  newArr.splice(toIndex, 0, item);
  return newArr;
}

// ============================================================================
// Null/Undefined Checks
// ============================================================================

/**
 * Check if a value is null or undefined
 * @param value - The value to check
 * @returns True if null or undefined
 */
export function isNil(value: any): boolean {
  return value === null || value === undefined;
}

/**
 * Check if a value is empty (null, undefined, '', [], {})
 * @param value - The value to check
 * @returns True if empty
 */
export function isEmpty(value: any): boolean {
  if (isNil(value)) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Check if a value is defined and not empty
 * @param value - The value to check
 * @returns True if defined and not empty
 */
export function hasValue(value: any): boolean {
  return !isEmpty(value);
}

// ============================================================================
// Data Structure Creation
// ============================================================================

/**
 * Create a new DM Question
 * @param text - The question text
 * @param tags - Optional tags
 * @returns A new DMQuestion object
 */
export function createDMQuestion(text: string, tags: string[] = []): DMQuestion {
  return {
    id: generateId(),
    text,
    tags,
    createdTime: Date.now(),
  };
}

/**
 * Create a new Turn Plan
 * @param name - The plan name
 * @param trigger - The trigger description
 * @returns A new TurnPlan object
 */
export function createTurnPlan(name: string, trigger: string): TurnPlan {
  return {
    id: generateId(),
    name,
    trigger,
    actions: [],
    bonusActions: [],
    reactions: [],
    movement: '',
    roleplay: '',
    additionalFeatures: [],
    categories: [],
  };
}

/**
 * Create a new Reaction
 * @param trigger - The trigger description
 * @param feature - The reaction feature
 * @returns A new Reaction object
 */
export function createReaction(
  name: string = '',
  trigger: string = '',
  initialFeatures: SelectedFeature[] = []
): Reaction {
  return {
    id: generateId(),
    name: typeof name === 'string' ? name : '',
    trigger: typeof trigger === 'string' ? trigger : '',
    reactionFeatures: Array.isArray(initialFeatures)
      ? initialFeatures.map((feature) => ({
          itemId: feature.itemId,
          itemName: feature.itemName,
          itemType: feature.itemType,
          actionType: feature.actionType,
        }))
      : [],
    additionalFeatures: [],
    notes: '',
    createdTime: Date.now(),
    isFavorite: false,
  };
}

/**
 * Create a Turn Snapshot from a Turn Plan
 * Captures feature names at the time of snapshot
 * @param plan - The turn plan to snapshot
 * @returns A new TurnSnapshot object
 */
export function createTurnSnapshot(plan: TurnPlan): TurnSnapshot {
  return {
    id: generateId(),
    createdTime: Date.now(),
    planName: plan.name,
    actions: (plan.actions ?? []).map(snapshotFeature),
    bonusActions: (plan.bonusActions ?? []).map(snapshotFeature),
    reactions: (plan.reactions ?? []).map(snapshotFeature),
    movement: plan.movement,
    trigger: plan.trigger,
    additionalFeatures: (plan.additionalFeatures ?? []).map(snapshotFeature),
    categories: [...(plan.categories ?? [])],
    roleplay: plan.roleplay ?? '',
  };
}

/**
 * Create a Turn Snapshot from a Reaction
 * Treats reaction features as the reactions column; actions/bonus are empty.
 * @param reaction - The reaction plan to snapshot
 * @returns A new TurnSnapshot object representing the reaction
 */
export function createReactionSnapshot(reaction: Reaction): TurnSnapshot {
  return {
    id: generateId(),
    createdTime: Date.now(),
    planName: reaction.name,
    actions: [],
    bonusActions: [],
    reactions: (reaction.reactionFeatures ?? []).map(snapshotFeature),
    movement: '',
    trigger: reaction.trigger,
    additionalFeatures: (reaction.additionalFeatures ?? []).map(snapshotFeature),
    categories: [],
  };
}

/**
 * Create a Reaction Favorite Snapshot from a Reaction plan
 * Stores trigger, features, additional features, and notes
 * @param reaction - The reaction plan to snapshot
 * @returns A ReactionFavoriteSnapshot object
 */
export function createReactionFavoriteSnapshot(reaction: Reaction): ReactionFavoriteSnapshot {
  const trigger = reaction.trigger || reaction.name || '';
  return {
    id: generateId(),
    createdTime: Date.now(),
    trigger,
    reactionFeatures: (reaction.reactionFeatures ?? []).map(snapshotFeature),
    additionalFeatures: (reaction.additionalFeatures ?? []).map(snapshotFeature),
    notes: reaction.notes ?? '',
  };
}

function truncateWithEllipsis(value: string, maxLength = 18): string {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength).trimEnd()}…`;
}

/**
 * Convert a SelectedFeature to a SnapshotFeature
 * @param feature - The feature to snapshot
 * @returns A snapshot of the feature
 */
export function snapshotFeature(feature: SelectedFeature): SnapshotFeature {
  return {
    itemId: feature.itemId,
    itemName: truncateWithEllipsis(feature.itemName),
    itemType: feature.itemType,
    actionType: feature.actionType,
    isMissing: false,
  };
}

/**
 * Convert a TurnSnapshot back to a TurnPlan for editing/instantiation
 */
export function snapshotToPlan(snapshot: TurnSnapshot): TurnPlan {
  const mapFeature = (f: SnapshotFeature): SelectedFeature => ({
    itemId: f.itemId,
    itemName: f.itemName,
    itemType: f.itemType,
    actionType: f.actionType,
  });

  return {
    id: snapshot.id || generateId(),
    name: snapshot.planName || '',
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

/**
 * Convert a ReactionFavoriteSnapshot (or TurnSnapshot) back to a Reaction plan
 */
export function snapshotToReaction(snapshot: ReactionFavoriteSnapshot | TurnSnapshot): Reaction {
  const mapFeature = (f: SnapshotFeature): SelectedFeature => ({
    itemId: f.itemId,
    itemName: f.itemName,
    itemType: f.itemType,
    actionType: f.actionType,
  });

  // Handle both snapshot types if needed, but primarily ReactionFavoriteSnapshot
  const reactionFeatures = (snapshot as any).reactionFeatures ?? (snapshot as any).reactions ?? [];
  
  return {
    id: snapshot.id || generateId(),
    name: (snapshot as any).planName || (snapshot as any).trigger || '', 
    trigger: (snapshot as any).trigger || '',
    reactionFeatures: reactionFeatures.map(mapFeature),
    additionalFeatures: (snapshot.additionalFeatures ?? []).map(mapFeature),
    notes: (snapshot as any).notes || (snapshot as any).roleplay || '',
    isFavorite: true,
  };
}

/**
 * Create an empty TurnPrepData structure
 * @returns A new empty TurnPrepData object
 */
export function createEmptyTurnPrepData(): TurnPrepData {
  return {
    version: 1,
    dmQuestions: [],
    turnPlans: [],
    activePlanIndex: -1,
    reactions: [],
    history: [],
    favoritesTurn: [],
    favoritesReaction: [],
  };
}

// ============================================================================
// Array Limiting
// ============================================================================

/**
 * Limit an array to a maximum length
 * Removes oldest items from the start
 * @param arr - The array to limit
 * @param maxLength - Maximum length
 * @returns A limited array
 */
export function limitArray<T>(arr: T[], maxLength: number): T[] {
  if (arr.length <= maxLength) return arr;
  return arr.slice(arr.length - maxLength);
}

/**
 * Limit history snapshots to a maximum count
 * Used for enforcing history limit setting
 * @param history - The history array
 * @param limit - Maximum number of entries
 * @returns Limited history
 */
export function limitHistory(history: TurnSnapshot[], limit: number): TurnSnapshot[] {
  return limitArray(history, Math.max(5, Math.min(50, limit)));
}
