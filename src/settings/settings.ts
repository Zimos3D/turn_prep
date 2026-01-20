/**
 * Turn Prep Module - Settings System
 * 
 * Defines and registers all module settings for world configuration and per-character customization.
 * Settings include history management, edit history, and feature tracking configuration.
 */

import { TURN_PREP_CONSTANTS } from '../constants';
import { FoundryAdapter } from '../foundry/FoundryAdapter';
import { debug, warn } from '../utils/logging';

/**
 * World-level settings (configurable by GMs)
 */
export const WORLD_SETTINGS = {
  HISTORY_LIMIT_DEFAULT: 'historyLimitDefault',
  EDIT_HISTORY_CHECKPOINTS: 'editHistoryCheckpoints',
  ALLOW_PLAYER_EDIT_HISTORY: 'allowPlayerEditHistory',
  ENABLE_TURN_PREP_TAB: 'enableTurnPrepTab',
} as const;

/**
 * Per-actor settings (stored in actor flags, overridable per character)
 */
export const ACTOR_SETTINGS = {
  HISTORY_LIMIT: 'historyLimit',
  EDIT_HISTORY_ENABLED: 'editHistoryEnabled',
} as const;

/**
 * Register all module settings with Foundry
 * Called during init hook
 */
export function registerSettings(): void {
  debug('Registering Turn Prep settings');

  // World Settings
  FoundryAdapter.registerWorldSetting({
    name: WORLD_SETTINGS.HISTORY_LIMIT_DEFAULT,
    scope: 'world',
    config: true,
    type: Number,
    default: 10,
    range: {
      min: 1,
      max: 100,
      step: 1,
    },
    hint: 'Default number of turn history entries to keep per character (can be overridden per actor)',
  });

  FoundryAdapter.registerWorldSetting({
    name: WORLD_SETTINGS.EDIT_HISTORY_CHECKPOINTS,
    scope: 'world',
    config: true,
    type: Number,
    default: 5,
    range: {
      min: 1,
      max: 20,
      step: 1,
    },
    hint: 'Maximum number of edit history checkpoints to store per history snapshot',
  });

  FoundryAdapter.registerWorldSetting({
    name: WORLD_SETTINGS.ALLOW_PLAYER_EDIT_HISTORY,
    scope: 'world',
    config: true,
    type: Boolean,
    default: true,
    hint: 'Allow players to edit history snapshots after they are created',
  });

  FoundryAdapter.registerWorldSetting({
    name: WORLD_SETTINGS.ENABLE_TURN_PREP_TAB,
    scope: 'world',
    config: true,
    type: Boolean,
    default: true,
    hint: 'Enable the Turn Prep tab on character sheets (applies to all sheets)',
  });

  debug('Settings registered successfully');
}

/**
 * Get the default history limit from world settings
 */
export function getDefaultHistoryLimit(): number {
  try {
    const limit = FoundryAdapter.getWorldSetting(WORLD_SETTINGS.HISTORY_LIMIT_DEFAULT);
    if (typeof limit === 'number' && limit > 0) {
      return limit;
    }
    warn('Invalid history limit setting, falling back to default', { limit });
    return 10;
  } catch (error) {
    warn('Error retrieving history limit setting', { error });
    return 10;
  }
}

/**
 * Get the edit history checkpoint limit from world settings
 */
export function getEditHistoryCheckpointLimit(): number {
  try {
    const limit = FoundryAdapter.getWorldSetting(WORLD_SETTINGS.EDIT_HISTORY_CHECKPOINTS);
    if (typeof limit === 'number' && limit > 0) {
      return limit;
    }
    warn('Invalid edit history checkpoint setting, falling back to default', { limit });
    return 5;
  } catch (error) {
    warn('Error retrieving edit history checkpoint setting', { error });
    return 5;
  }
}

/**
 * Check if players are allowed to edit history snapshots
 */
export function canPlayersEditHistory(): boolean {
  try {
    const allowed = FoundryAdapter.getWorldSetting(WORLD_SETTINGS.ALLOW_PLAYER_EDIT_HISTORY);
    return typeof allowed === 'boolean' ? allowed : true;
  } catch (error) {
    warn('Error retrieving player edit history setting', { error });
    return true;
  }
}

/**
 * Check if Turn Prep tab is enabled globally
 */
export function isTurnPrepTabEnabled(): boolean {
  try {
    const enabled = FoundryAdapter.getWorldSetting(WORLD_SETTINGS.ENABLE_TURN_PREP_TAB);
    return typeof enabled === 'boolean' ? enabled : true;
  } catch (error) {
    warn('Error retrieving Turn Prep tab enabled setting', { error });
    return true;
  }
}

/**
 * Get the effective history limit for a specific actor
 * First checks for per-actor override, falls back to world default
 */
export function getHistoryLimitForActor(actor: Actor): number {
  if (!actor) {
    debug('Actor not provided, using default history limit');
    return getDefaultHistoryLimit();
  }

  try {
    // Check for per-actor override in flags
    const actorLimit = FoundryAdapter.getFlag(actor, ACTOR_SETTINGS.HISTORY_LIMIT);
    
    if (typeof actorLimit === 'number' && actorLimit > 0) {
      debug('Using per-actor history limit', { actorId: actor.id, limit: actorLimit });
      return actorLimit;
    }

    // Fall back to world default
    const defaultLimit = getDefaultHistoryLimit();
    debug('Using default history limit for actor', { actorId: actor.id, limit: defaultLimit });
    return defaultLimit;
  } catch (error) {
    warn('Error retrieving history limit for actor', { actorId: actor?.id, error });
    return getDefaultHistoryLimit();
  }
}

/**
 * Set a per-actor history limit override
 */
export async function setHistoryLimitForActor(actor: Actor, limit: number): Promise<void> {
  if (!actor) {
    throw new Error('Actor required to set history limit');
  }

  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error('History limit must be a positive integer');
  }

  try {
    await FoundryAdapter.setFlag(actor, ACTOR_SETTINGS.HISTORY_LIMIT, limit);
    debug('Set history limit for actor', { actorId: actor.id, limit });
  } catch (error) {
    warn('Error setting history limit for actor', { actorId: actor.id, limit, error });
    throw error;
  }
}

/**
 * Clear per-actor history limit override (reverts to world default)
 */
export async function clearHistoryLimitOverride(actor: Actor): Promise<void> {
  if (!actor) {
    throw new Error('Actor required to clear history limit override');
  }

  try {
    await FoundryAdapter.deleteFlag(actor, ACTOR_SETTINGS.HISTORY_LIMIT);
    debug('Cleared history limit override for actor', { actorId: actor.id });
  } catch (error) {
    warn('Error clearing history limit override', { actorId: actor.id, error });
    throw error;
  }
}

/**
 * Check if edit history is enabled for a specific actor
 * (Future use: could make this per-actor, currently uses global setting)
 */
export function isEditHistoryEnabledForActor(actor: Actor): boolean {
  if (!actor) {
    return canPlayersEditHistory();
  }

  try {
    // Per-actor override (if implemented in future)
    const actorSetting = FoundryAdapter.getFlag(actor, ACTOR_SETTINGS.EDIT_HISTORY_ENABLED);
    if (typeof actorSetting === 'boolean') {
      return actorSetting;
    }

    // Fall back to world setting
    return canPlayersEditHistory();
  } catch (error) {
    warn('Error retrieving edit history setting for actor', { actorId: actor?.id, error });
    return canPlayersEditHistory();
  }
}
