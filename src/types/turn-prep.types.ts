/**
 * Turn Prep Module - Type Definitions
 * 
 * Comprehensive TypeScript interfaces for the Turn Prep module.
 * Organized by feature domain for maintainability.
 */

// ============================================================================
// DM Questions
// ============================================================================

/**
 * Represents a DM question for the current session
 * Helps DMs remember important information to follow up on
 */
export interface DMQuestion {
  /** Unique identifier for this question */
  id: string;

  /** The question text */
  text: string;

  /** Tags for organizing questions (e.g., "safety", "lore", "encounter") */
  tags: string[];

  /** Timestamp when this question was created (milliseconds) */
  createdTime: number;
}

// ============================================================================
// Turn Plans
// ============================================================================

/**
 * A single turn plan with prepared features and context
 * Players create plans in advance for their turn in combat
 */
export interface TurnPlan {
  /** Unique identifier for this turn plan */
  id: string;

  /** Display name for this plan (e.g., "Aggressive Attack", "Support Ally") */
  name: string;

  /** Context trigger for when to use this plan */
  trigger: string;

  /** Action economy allocations */
  actions: SelectedFeature[];
  bonusActions: SelectedFeature[];
  reactions: SelectedFeature[];
  movement: string; // Free text movement description
  roleplay: string; // Free text roleplay description

  /** Additional features that modify or supplement the turn */
  additionalFeatures: SelectedFeature[];

  /** Category tags for organizing plans (e.g., "Attack", "Healing", "Control") */
  categories: string[];
}

/**
 * A feature/item selected for use in a turn plan
 * References the actual item but can be used immediately without re-querying
 */
export interface SelectedFeature {
  /** Foundry Item ID for this feature */
  itemId: string;

  /** Display name of the feature */
  itemName: string;

  /** Type of the feature (spell, feat, classFeature, etc.) */
  itemType: string;

  /** Activation cost type (action, bonus, reaction, etc.) */
  actionType: string;
}

// ============================================================================
// Reactions
// ============================================================================

/**
 * Represents a prepared reaction for the current combat
 * When a specific trigger occurs, the player can use the selected reaction feature
 */
export interface Reaction {
  /** Unique identifier for this reaction */
  id: string;

  /** Display name for the reaction plan */
  name: string;

  /** Context trigger text (e.g., "When a foe attacks me") */
  trigger: string;

  /** Reaction features that should be ready to use */
  reactionFeatures: SelectedFeature[];

  /** Additional features that modify or support the reaction */
  additionalFeatures: SelectedFeature[];

  /** Free-form notes for situational reminders */
  notes: string;

  /** Timestamp for sorting and auditing */
  createdTime: number;

  /** Favorite flag for quick access */
  isFavorite: boolean;
}

// ============================================================================
// History & Favorites
// ============================================================================

/**
 * A snapshot of a turn plan saved to history or favorites
 * Contains feature names (not live data) so they display even if item changes
 */
export interface TurnSnapshot {
  /** Unique identifier for this snapshot */
  id: string;

  /** Timestamp when snapshot was created (milliseconds) */
  createdTime: number;

  /** Plan name from when it was saved */
  planName: string;

  /** Snapshot of the actions used */
  actions: SnapshotFeature[];

  /** Snapshot of the bonus actions used */
  bonusActions: SnapshotFeature[];

  /** Snapshot of the reactions queued within the plan */
  reactions: SnapshotFeature[];

  /** Movement description from the plan */
  movement: string;

  /** Trigger context from the plan (truncated for display) */
  trigger: string;

  /** Additional features used */
  additionalFeatures: SnapshotFeature[];

  /** Categories from the original plan */
  categories: string[];
}

/**
 * Minimal feature representation in a snapshot
 * Stores name at time of snapshot so changes to items don't break history
 */
export interface SnapshotFeature {
  /** Foundry Item ID (for recovery if item still exists) */
  itemId: string;

  /** Feature name at time of snapshot */
  itemName: string;

  /** Item type at time of snapshot */
  itemType: string;

  /** Action type at time of snapshot */
  actionType: string;

  /** Tracks if the item still exists when snapshot is loaded */
  isMissing?: boolean;
}

// ============================================================================
// Complete Data Container
// ============================================================================

/**
 * Root data structure for all Turn Prep data
 * Stored in actor.flags['turn-prep']
 */
export interface TurnPrepData {
  /** Version for data migrations (if needed in future) */
  version: number;

  /** DM questions for this session */
  dmQuestions: DMQuestion[];

  /** Prepared turn plans */
  turnPlans: TurnPlan[];

  /** Currently selected/active turn plan index (-1 if none) */
  activePlanIndex: number;

  /** Prepared reactions */
  reactions: Reaction[];

  /** History of executed turns (limited by setting) */
  history: TurnSnapshot[];

  /** Favorite turn snapshots (reorderable) */
  favorites: TurnSnapshot[];
}

// ============================================================================
// Feature Selection
// ============================================================================

/**
 * A feature/item available for selection from the character sheet
 * Used for populating feature selectors
 */
export interface Feature {
  /** Foundry Item ID */
  id: string;

  /** Display name */
  name: string;

  /** Type of item (spell, feat, classFeature, lairAction, etc.) */
  type: string;

  /** Activation cost type */
  actionType: string;

  /** Icon image URL for display */
  icon?: string;

  /** Whether this item is prepared/active (for spells, etc.) */
  isPrepared?: boolean;

  /** Whether user has permission to view this item */
  canUse: boolean;
}

/**
 * Options for filtering features by activation type
 */
export interface FeatureFilterOptions {
  /** Only include features with this activation type */
  actionType?: string;

  /** Exclude specific item types */
  excludeTypes?: string[];

  /** Only include prepared/active items */
  onlyPrepared?: boolean;

  /** Whether to include class features, spells, items, etc. */
  itemCategories?: ('classFeature' | 'spell' | 'feat' | 'item')[];
}

// ============================================================================
// Module Settings
// ============================================================================

/**
 * All configurable module settings
 */
export interface ModuleSettings {
  /** Maximum number of history entries to keep */
  historyLimit: number;

  /** Whether DMs can view player turn prep data on their sheets */
  allowDmViewPlayerTurnPrep: boolean;

  /** Whether to show the Turn Prep tab on character sheets */
  enableTurnPrepTab: boolean;
}

// ============================================================================
// API & Hook Types
// ============================================================================

/**
 * Hook callback for when turn prep data changes
 */
export type TurnPrepDataChangeCallback = (
  actor: Actor,
  data: TurnPrepData,
  changed: Partial<TurnPrepData>
) => void;

/**
 * Hook callback for when a feature is selected
 */
export type FeatureSelectedCallback = (
  actor: Actor,
  feature: SelectedFeature,
  targetField: 'actions' | 'bonusActions' | 'additionalFeatures'
) => void;

/**
 * Options for API method calls
 */
export interface APICallOptions {
  /** Whether to skip validation */
  skipValidation?: boolean;

  /** Whether to broadcast changes to other users */
  broadcast?: boolean;

  /** Custom context data */
  context?: Record<string, unknown>;
}
