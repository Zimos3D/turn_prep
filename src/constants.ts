/**
 * Turn Prep Module - Constants
 * 
 * Centralized location for all module IDs, constants, and configuration values.
 * Using constants prevents typos and makes refactoring easier.
 */

// ============================================================================
// Module Identification
// ============================================================================

export const MODULE_ID = 'turn-prep';
export const MODULE_TITLE = 'Turn Prep - D&D 5e Turn Preparation Module';

// ============================================================================
// Flags & Storage
// ============================================================================

/** Root flag scope for all Turn Prep data */
export const FLAG_SCOPE = 'turn-prep';

/** Key for storing Turn Prep data in actor.flags */
export const FLAG_KEY_DATA = 'turnPrepData';

/** Full path for accessing turn prep data: actor.flags['turn-prep'].turnPrepData */
export const FLAG_PATH_DATA = `${FLAG_SCOPE}.${FLAG_KEY_DATA}`;

// ============================================================================
// Tab IDs (for sheet integration)
// ============================================================================

/** ID for the main Turn Prep tab on character sheets */
export const TAB_ID_MAIN = 'turn-prep-main';

/** ID for the Turns sidebar tab (Tidy 5E only) */
export const TAB_ID_SIDEBAR_TURNS = 'turn-prep-sidebar-turns';

// ============================================================================
// Setting IDs & Defaults
// ============================================================================

/**
 * All module setting keys and their defaults
 * Register these in hooks/init.ts
 */
export const SETTINGS = {
  // History limit setting
  HISTORY_LIMIT: {
    key: 'historyLimit',
    default: 10,
    scope: 'world' as const,
    type: Number,
    range: { min: 5, max: 50, step: 1 },
  },

  // DM visibility setting
  ALLOW_DM_VIEW: {
    key: 'allowDmViewPlayerTurnPrep',
    default: true,
    scope: 'world' as const,
    type: Boolean,
  },

  // Enable Turn Prep tab
  ENABLE_TAB: {
    key: 'enableTurnPrepTab',
    default: true,
    scope: 'world' as const,
    type: Boolean,
  },
} as const;

// ============================================================================
// Activation Types (D&D 5e action economy)
// ============================================================================

/**
 * D&D 5e activation cost types
 * Source: D&D 5e system documentation
 */
export const ACTIVATION_TYPES = {
  // Action economy
  ACTION: 'action',
  BONUS_ACTION: 'bonus',
  REACTION: 'reaction',

  // Time-based
  MINUTE: 'minute',
  HOUR: 'hour',
  DAY: 'day',

  // Rest-based
  LONG_REST: 'longRest',
  SHORT_REST: 'shortRest',

  // Combat events
  ENCOUNTER: 'encounter',
  TURN_START: 'turnStart',
  TURN_END: 'turnEnd',

  // Monster-specific
  LEGENDARY_ACTION: 'legendary',
  MYTHIC_ACTION: 'mythic',
  LAIR_ACTION: 'lair',

  // Vehicle
  CREW_ACTION: 'crew',

  // Special/None
  SPECIAL: 'special',
  NONE: '',
} as const;

/**
 * Activation types for immediate use (during turn)
 * These are selectable in the action/bonus action fields
 */
export const IMMEDIATE_ACTIVATION_TYPES = [
  ACTIVATION_TYPES.ACTION,
  ACTIVATION_TYPES.BONUS_ACTION,
  ACTIVATION_TYPES.REACTION,
] as const;

/**
 * Activation types for reactions
 * Reactions can trigger on specific conditions
 */
export const REACTION_ACTIVATION_TYPES = [
  ACTIVATION_TYPES.REACTION,
  ACTIVATION_TYPES.TURN_START,
  ACTIVATION_TYPES.TURN_END,
  ACTIVATION_TYPES.LEGENDARY_ACTION,
  ACTIVATION_TYPES.MYTHIC_ACTION,
  ACTIVATION_TYPES.LAIR_ACTION,
] as const;

// ============================================================================
// Item Types (D&D 5e)
// ============================================================================

/**
 * D&D 5e item types that can be selected as features
 */
export const ITEM_TYPES = {
  SPELL: 'spell',
  CLASS_FEATURE: 'class',
  SUBCLASS_FEATURE: 'subclass',
  FEAT: 'feat',
  ITEM: 'loot',
  WEAPON: 'weapon',
  EQUIPMENT: 'equipment',
  CONSUMABLE: 'consumable',
  BACKGROUND: 'background',
  RACE: 'race',
  MONSTER_FEATURE: 'monster',
} as const;

/**
 * Item types that are typically selectable as turn preparation features
 */
export const SELECTABLE_ITEM_TYPES = [
  ITEM_TYPES.SPELL,
  ITEM_TYPES.CLASS_FEATURE,
  ITEM_TYPES.SUBCLASS_FEATURE,
  ITEM_TYPES.FEAT,
  ITEM_TYPES.WEAPON,
  ITEM_TYPES.CONSUMABLE,
  ITEM_TYPES.MONSTER_FEATURE,
] as const;

// ============================================================================
// Localization Key Prefixes
// ============================================================================

/**
 * Localization key structure for the module
 * Usage: `TurnPrep.TabName`, `TurnPrep.Settings.HistoryLimit`
 */
export const I18N = {
  PREFIX: 'TurnPrep',

  // UI Elements
  TAB_NAME: 'TurnPrep.TabName',
  SIDEBAR_TAB_NAME: 'TurnPrep.SidebarTabName',

  // Panel Labels
  DM_QUESTIONS_LABEL: 'TurnPrep.DmQuestions.Label',
  TURN_PLANS_LABEL: 'TurnPrep.TurnPlans.Label',
  REACTIONS_LABEL: 'TurnPrep.Reactions.Label',
  HISTORY_LABEL: 'TurnPrep.History.Label',
  FAVORITES_LABEL: 'TurnPrep.Favorites.Label',

  // Button Labels
  ADD_BUTTON: 'TurnPrep.Button.Add',
  REMOVE_BUTTON: 'TurnPrep.Button.Remove',
  SAVE_BUTTON: 'TurnPrep.Button.Save',
  CANCEL_BUTTON: 'TurnPrep.Button.Cancel',
  LOAD_BUTTON: 'TurnPrep.Button.Load',
  DELETE_BUTTON: 'TurnPrep.Button.Delete',

  // Settings
  SETTINGS_HISTORY_LIMIT: 'TurnPrep.Settings.HistoryLimit',
  SETTINGS_HISTORY_LIMIT_HINT: 'TurnPrep.Settings.HistoryLimitHint',
  SETTINGS_ALLOW_DM_VIEW: 'TurnPrep.Settings.AllowDmView',
  SETTINGS_ALLOW_DM_VIEW_HINT: 'TurnPrep.Settings.AllowDmViewHint',

  // Errors & Messages
  ERROR_SAVE_FAILED: 'TurnPrep.Error.SaveFailed',
  ERROR_LOAD_FAILED: 'TurnPrep.Error.LoadFailed',
  SUCCESS_SAVED: 'TurnPrep.Success.Saved',
} as const;

// ============================================================================
// Logging
// ============================================================================

/** Log prefix following Tidy 5E pattern */
export const LOG_PREFIX = `[${MODULE_ID}]`;

/**
 * Log level configuration
 * In production: 'warn', 'error'
 * In development: 'debug', 'info', 'warn', 'error'
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

// ============================================================================
// UI Constants
// ============================================================================

/** Maximum length for displayed trigger/context text before truncation */
export const UI_MAX_TRIGGER_LENGTH = 60;

/** Maximum length for turn plan names */
export const UI_MAX_PLAN_NAME_LENGTH = 50;

/** Debounce delay for auto-save operations (ms) */
export const AUTO_SAVE_DEBOUNCE_MS = 500;

// ============================================================================
// Data Validation
// ============================================================================

/** Minimum version required: Foundry V13+ */
export const MIN_FOUNDRY_VERSION = '13.0.0';

/** Minimum version required: D&D 5e v5+ */
export const MIN_DND5E_VERSION = '5.0.0';

// ============================================================================
// Hooks
// ============================================================================

/**
 * Custom hooks fired by the Turn Prep module
 * Other modules can listen to these via Hooks.on()
 */
export const CUSTOM_HOOKS = {
  /** Fired when turn prep data changes */
  DATA_CHANGED: 'turnPrep.dataChanged',

  /** Fired when a feature is selected */
  FEATURE_SELECTED: 'turnPrep.featureSelected',

  /** Fired when turn prep data is loaded from storage */
  DATA_LOADED: 'turnPrep.dataLoaded',

  /** Fired when a turn is executed/moved to history */
  TURN_EXECUTED: 'turnPrep.turnExecuted',
} as const;

// ============================================================================
// Default Data
// ============================================================================

/** Initial version for new Turn Prep data */
export const DEFAULT_DATA_VERSION = 1;
