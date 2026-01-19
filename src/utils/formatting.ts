/**
 * Formatting Utilities
 * 
 * Functions for formatting data for display.
 * Handles string formatting, truncation, date formatting, etc.
 */

import { UI_MAX_TRIGGER_LENGTH, UI_MAX_PLAN_NAME_LENGTH } from '../constants';
import type { SelectedFeature, SnapshotFeature } from '../types';

// ============================================================================
// String Formatting
// ============================================================================

/**
 * Truncate a string and add ellipsis if it exceeds max length
 * @param text - The text to truncate
 * @param maxLength - Maximum length (default: 60)
 * @param suffix - Suffix to add when truncated (default: '...')
 * @returns Truncated text with ellipsis if needed
 */
export function truncateString(
  text: string | null | undefined,
  maxLength: number = UI_MAX_TRIGGER_LENGTH,
  suffix: string = '...'
): string {
  if (!text) return '';

  const trimmed = text.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return trimmed.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Escape HTML special characters
 * Prevents XSS when displaying user content
 * @param text - The text to escape
 * @returns HTML-escaped text
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Capitalize the first letter of a string
 * @param text - The text to capitalize
 * @returns Capitalized text
 */
export function capitalizeFirst(text: string): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Convert camelCase or snake_case to Title Case
 * Examples:
 * - "bonusAction" -> "Bonus Action"
 * - "long_rest" -> "Long Rest"
 * @param text - The text to convert
 * @returns Title case text
 */
export function toTitleCase(text: string): string {
  return text
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .split(' ')
    .map((word) => capitalizeFirst(word))
    .join(' ');
}

/**
 * Join an array of strings with proper grammar
 * Examples:
 * - ["attack"] -> "attack"
 * - ["attack", "defend"] -> "attack and defend"
 * - ["attack", "defend", "heal"] -> "attack, defend, and heal"
 * @param items - Array of strings
 * @param separator - Separator word (default: 'and')
 * @returns Grammatically correct joined string
 */
export function joinWithGrammar(items: string[], separator: string = 'and'): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} ${separator} ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, ${separator} ${items[items.length - 1]}`;
}

// ============================================================================
// Feature Formatting
// ============================================================================

/**
 * Format a feature name for display
 * Shows name and type in a user-friendly format
 * @param feature - The feature to format
 * @returns Formatted feature name (e.g., "Fireball (Spell)")
 */
export function formatFeatureName(
  feature: SelectedFeature | SnapshotFeature | null | undefined
): string {
  if (!feature) return '(empty)';
  return `${feature.itemName}`;
}

/**
 * Format a feature with activation type
 * @param feature - The feature to format
 * @returns Formatted string (e.g., "Fireball [Action]")
 */
export function formatFeatureWithAction(
  feature: SelectedFeature | SnapshotFeature | null | undefined
): string {
  if (!feature) return '(empty)';
  const actionLabel = formatActionType(feature.actionType);
  return `${feature.itemName} [${actionLabel}]`;
}

/**
 * Format a feature for history/favorites display
 * Includes type and shows if missing
 * @param feature - The feature snapshot
 * @param isMissing - Whether the feature is missing from character
 * @returns Formatted string
 */
export function formatFeatureSnapshot(feature: SnapshotFeature, isMissing: boolean = false): string {
  const name = feature.itemName;
  const type = `(${formatItemType(feature.itemType)})`;

  if (isMissing) {
    return `${name} ${type} [Missing]`;
  }

  return `${name} ${type}`;
}

/**
 * Format an activation type for display
 * Converts codes to readable labels
 * @param actionType - The activation type code
 * @returns Readable label (e.g., "bonus" -> "Bonus Action")
 */
export function formatActionType(actionType: string): string {
  const labels: Record<string, string> = {
    action: 'Action',
    bonus: 'Bonus Action',
    reaction: 'Reaction',
    minute: 'Minute',
    hour: 'Hour',
    day: 'Day',
    longRest: 'Long Rest',
    shortRest: 'Short Rest',
    encounter: 'Encounter',
    turnStart: 'Start of Turn',
    turnEnd: 'End of Turn',
    legendary: 'Legendary Action',
    mythic: 'Mythic Action',
    lair: 'Lair Action',
    crew: 'Crew Action',
    special: 'Special',
    '': 'None',
  };

  return labels[actionType] || capitalizeFirst(actionType);
}

/**
 * Format an item type for display
 * @param itemType - The item type code
 * @returns Readable label (e.g., "spell" -> "Spell")
 */
export function formatItemType(itemType: string): string {
  const labels: Record<string, string> = {
    spell: 'Spell',
    class: 'Class Feature',
    subclass: 'Subclass Feature',
    feat: 'Feat',
    loot: 'Item',
    weapon: 'Weapon',
    equipment: 'Equipment',
    consumable: 'Consumable',
    background: 'Background',
    race: 'Race',
    monster: 'Monster Feature',
  };

  return labels[itemType] || capitalizeFirst(itemType);
}

// ============================================================================
// Number & List Formatting
// ============================================================================

/**
 * Format a list of items for display
 * @param items - Array of item names
 * @param maxItems - Maximum items to show (rest become "...and N more")
 * @returns Formatted list
 */
export function formatItemList(items: string[], maxItems: number = 3): string {
  if (items.length === 0) return '(none)';
  if (items.length <= maxItems) {
    return joinWithGrammar(items);
  }

  const shown = items.slice(0, maxItems);
  const remaining = items.length - maxItems;
  return `${joinWithGrammar(shown)}, and ${remaining} more`;
}

/**
 * Format a number as ordinal (1st, 2nd, 3rd, etc.)
 * @param num - The number to format
 * @returns Ordinal string
 */
export function formatOrdinal(num: number): string {
  const lastDigit = num % 10;
  const lastTwoDigits = num % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
    return `${num}th`;
  }

  switch (lastDigit) {
    case 1:
      return `${num}st`;
    case 2:
      return `${num}nd`;
    case 3:
      return `${num}rd`;
    default:
      return `${num}th`;
  }
}

// ============================================================================
// Date & Time Formatting
// ============================================================================

/**
 * Format a timestamp for display
 * Shows relative time (e.g., "2 hours ago") or absolute date
 * @param timestamp - Milliseconds since epoch
 * @param showTime - Whether to include time of day
 * @returns Formatted date string
 */
export function formatDate(timestamp: number, showTime: boolean = false): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  // Relative time for recent entries
  if (diffSecs < 60) {
    return 'just now';
  }
  if (diffMins < 60) {
    return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  }
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  }
  if (diffDays < 7) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }

  // Absolute date for older entries
  const monthDay = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  if (showTime) {
    const time = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${monthDay} at ${time}`;
  }

  return monthDay;
}

/**
 * Format a timestamp as a short time string
 * Example: "3:45 PM"
 * @param timestamp - Milliseconds since epoch
 * @returns Formatted time string
 */
export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ============================================================================
// Plan & Snapshot Formatting
// ============================================================================

/**
 * Format a plan name for display
 * Truncates to UI_MAX_PLAN_NAME_LENGTH
 * @param name - The plan name
 * @returns Formatted name
 */
export function formatPlanName(name: string): string {
  return truncateString(name, UI_MAX_PLAN_NAME_LENGTH);
}

/**
 * Format a trigger/context description for display
 * Truncates to UI_MAX_TRIGGER_LENGTH
 * @param trigger - The trigger text
 * @returns Formatted trigger
 */
export function formatTrigger(trigger: string): string {
  return truncateString(trigger, UI_MAX_TRIGGER_LENGTH);
}

/**
 * Create a summary of a turn plan for quick display
 * Used in history/favorites list
 * @param planName - The plan name
 * @param features - Array of feature names used
 * @returns Summary string
 */
export function createTurnSummary(planName: string, features: string[]): string {
  if (features.length === 0) {
    return `${formatPlanName(planName)} (no features)`;
  }

  return `${formatPlanName(planName)}: ${formatItemList(features, 2)}`;
}

// ============================================================================
// HTML & Display
// ============================================================================

/**
 * Create a styled badge for display
 * Used for status indicators, tags, etc.
 * @param text - The badge text
 * @param type - Badge type (info, success, warning, error)
 * @returns HTML badge element
 */
export function createBadge(
  text: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info'
): HTMLElement {
  const badge = document.createElement('span');
  badge.className = `turn-prep-badge turn-prep-badge-${type}`;
  badge.textContent = text;
  return badge;
}
