/**
 * Turn Prep Module - Settings System
 * 
 * Provides access to module settings registered in init.ts
 * Settings include history management, edit history, and feature tracking configuration.
 */

import { SETTINGS } from '../constants';
import { FoundryAdapter } from '../foundry/FoundryAdapter';
import { debug, warn } from '../utils/logging';

/**
 * Setting keys used throughout the module
 * These are registered in src/hooks/init.ts
 */
export const SETTING_KEYS = {
  HISTORY_LIMIT: 'historyLimit',  // World setting: default history limit
  EDIT_HISTORY_CHECKPOINTS: 'editHistoryCheckpoints',  // World setting: checkpoint limit
  ALLOW_PLAYER_EDIT_HISTORY: 'allowPlayerEditHistory',  // World setting: player edit permission
} as const;

/**
 * Per-actor flag settings (stored in actor flags, not world settings)
 */
export const ACTOR_FLAG_KEYS = {
  HISTORY_LIMIT: 'historyLimit',  // Per-actor override of history limit
  EDIT_HISTORY_ENABLED: 'editHistoryEnabled',  // Per-actor edit history enabled
} as const;

/**
 * Get the default history limit from world settings
 */
export function getDefaultHistoryLimit(): number {
  try {
    // Try the existing setting from constants
    const limit = FoundryAdapter.getSetting(SETTING_KEYS.HISTORY_LIMIT);
    if (typeof limit === 'number' && limit > 0) {
      return limit;
    }
    // Fall back to constant default
    return SETTINGS.HISTORY_LIMIT.default;
  } catch (error) {
    warn('Error retrieving history limit setting', { error });
    return SETTINGS.HISTORY_LIMIT.default;
  }
}

/**
 * Get the edit history checkpoint limit from world settings
 */
export function getEditHistoryCheckpointLimit(): number {
  try {
    const limit = FoundryAdapter.getSetting(SETTING_KEYS.EDIT_HISTORY_CHECKPOINTS);
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
    const allowed = FoundryAdapter.getSetting(SETTING_KEYS.ALLOW_PLAYER_EDIT_HISTORY);
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
    // This setting might not be registered, so return true as default
    return true;
  } catch (error) {
    warn('Error retrieving Turn Prep tab enabled setting', { error });
    return true;
  }
}

/**
 * Get the effective history limit for a specific actor
 * First checks for per-actor override, falls back to world default
 */
export function getHistoryLimitForActor(actor: any): number {
  if (!actor || !actor.id) {
    debug('Actor not provided, using default history limit');
    return getDefaultHistoryLimit();
  }

  try {
    // Check for per-actor override in flags
    const actorLimit = FoundryAdapter.getFlag(actor, ACTOR_FLAG_KEYS.HISTORY_LIMIT);
    
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
export async function setHistoryLimitForActor(actor: any, limit: number): Promise<void> {
  if (!actor || !actor.id) {
    throw new Error('Actor with valid ID required to set history limit');
  }

  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error('History limit must be a positive integer');
  }

  try {
    await FoundryAdapter.setFlag(actor, ACTOR_FLAG_KEYS.HISTORY_LIMIT, limit);
    debug('Set history limit for actor', { actorId: actor.id, limit });
  } catch (error) {
    warn('Error setting history limit for actor', { actorId: actor.id, limit, error });
    throw error;
  }
}

/**
 * Clear per-actor history limit override (reverts to world default)
 */
export async function clearHistoryLimitOverride(actor: any): Promise<void> {
  if (!actor || !actor.id) {
    throw new Error('Actor with valid ID required to clear history limit override');
  }

  try {
    await FoundryAdapter.deleteFlag(actor, ACTOR_FLAG_KEYS.HISTORY_LIMIT);
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
export function isEditHistoryEnabledForActor(actor: any): boolean {
  if (!actor) {
    return canPlayersEditHistory();
  }

  try {
    // Per-actor override (if implemented in future)
    const actorSetting = FoundryAdapter.getFlag(actor, ACTOR_FLAG_KEYS.EDIT_HISTORY_ENABLED);
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
