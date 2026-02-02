/**
 * Turn Prep Storage Layer
 * 
 * Handles persistence of turn prep data to actor flags.
 * All data is stored in actor.flags['turn-prep'].turnPrepData
 * 
 * Provides:
 * - Atomic save/load operations
 * - Data validation and auto-correction
 * - Error handling with graceful fallbacks
 * - Logging of all operations
 */

import type { TurnPrepData, DMQuestion } from '../../types';
import { FLAG_SCOPE, FLAG_KEY_DATA } from '../../constants';
import { FoundryAdapter } from '../../foundry/FoundryAdapter';
import { debug, info, warn, error as logError } from '../../utils/logging';
import { createEmptyTurnPrepData } from '../../utils/data';
import { validateAndCorrectTurnPrepData } from './TurnPrepData';

/**
 * Turn Prep Storage Manager
 * Handles all persistence operations to actor flags
 */
export class TurnPrepStorage {
  /**
   * Load Turn Prep data for an actor
   * Returns empty data if none exists or if data is corrupted
   * 
   * @param actor - The actor to load data for
   * @returns The loaded TurnPrepData, or empty data if none exists
   */
  static async load(actor: any): Promise<TurnPrepData> {
    try {
      if (!actor) {
        warn('TurnPrepStorage.load(): Actor is undefined');
        return createEmptyTurnPrepData();
      }

      debug(`TurnPrepStorage.load(): Loading data for actor ${actor.id}`);

      // Retrieve raw flag data
      const rawData = FoundryAdapter.getFlag(actor, FLAG_KEY_DATA);

      // If no data exists, return empty structure
      if (!rawData) {
        debug(`TurnPrepStorage.load(): No existing data for actor ${actor.id}, returning empty`);
        return createEmptyTurnPrepData();
      }

      // Validate and correct the data
      const validatedData = validateAndCorrectTurnPrepData(rawData);

      if (rawData !== validatedData) {
        debug(`TurnPrepStorage.load(): Data was corrected for actor ${actor.id}`);
      }

      info(`TurnPrepStorage.load(): Successfully loaded data for actor ${actor.id}`);
      return validatedData;
    } catch (err) {
      logError(
        `TurnPrepStorage.load(): Failed to load data for actor ${actor?.id}`,
        err as Error
      );
      // Return empty data on error to avoid breaking the module
      return createEmptyTurnPrepData();
    }
  }

  /**
   * Save Turn Prep data for an actor
   * Validates data before saving, performs atomic save operation
   * 
   * @param actor - The actor to save data for
   * @param data - The TurnPrepData to save
   * @throws Error if actor is invalid or save fails
   */
  static async save(actor: any, data: TurnPrepData): Promise<void> {
    try {
      if (!actor) {
        throw new Error('Cannot save Turn Prep data: actor is undefined');
      }

      if (!this.isFlagValid(data)) {
        throw new Error('Cannot save Turn Prep data: data validation failed');
      }

      debug(`TurnPrepStorage.save(): Saving data for actor ${actor.id}`);

      // Perform atomic save to actor flag
      await FoundryAdapter.setFlag(actor, FLAG_KEY_DATA, data, { render: false });

      info(`TurnPrepStorage.save(): Successfully saved data for actor ${actor.id}`);
    } catch (err) {
      logError(`TurnPrepStorage.save(): Failed to save data for actor ${actor?.id}`, err as Error);
      throw err;
    }
  }

  /**
   * Clear all Turn Prep data for an actor
   * Removes the flag completely
   * 
   * @param actor - The actor to clear data for
   */
  static async clear(actor: any): Promise<void> {
    try {
      if (!actor) {
        warn('TurnPrepStorage.clear(): Actor is undefined');
        return;
      }

      debug(`TurnPrepStorage.clear(): Clearing data for actor ${actor.id}`);

      await FoundryAdapter.deleteFlag(actor, FLAG_KEY_DATA);

      info(`TurnPrepStorage.clear(): Successfully cleared data for actor ${actor.id}`);
    } catch (err) {
      logError(
        `TurnPrepStorage.clear(): Failed to clear data for actor ${actor?.id}`,
        err as Error
      );
      throw err;
    }
  }

  /**
   * Validate a TurnPrepData object
   * Checks that all required fields exist and are the correct type
   * 
   * @param data - The data to validate
   * @returns True if data is valid, false otherwise
   */
  static isFlagValid(data: any): boolean {
    if (!data || typeof data !== 'object') {
      return false;
    }

    // Check required fields
    if (typeof data.version !== 'number') {
      return false;
    }

    if (!Array.isArray(data.dmQuestions)) {
      return false;
    }

    if (!Array.isArray(data.turnPlans)) {
      return false;
    }

    if (typeof data.activePlanIndex !== 'number') {
      return false;
    }

    if (!Array.isArray(data.reactions)) {
      return false;
    }

    if (!Array.isArray(data.history)) {
      return false;
    }

    const hasTurnFav = Array.isArray((data as any).favoritesTurn ?? (data as any).favorites);
    const hasReactionFav = Array.isArray((data as any).favoritesReaction ?? []);
    if (!hasTurnFav || !hasReactionFav) {
      return false;
    }

    return true;
  }

  /**
   * Get all DM questions for an actor
   * Retrieves from the stored data structure
   * 
   * @param actor - The actor to get questions for
   * @returns Array of DM questions
   */
  async getDMQuestions(actor: any): Promise<DMQuestion[]> {
    try {
      const data = await TurnPrepStorage.load(actor);
      return data.dmQuestions || [];
    } catch (err) {
      warn('Failed to get DM questions', err);
      return [];
    }
  }

  /**
   * Save DM questions for an actor
   * Persists the questions to actor flags
   * 
   * @param actor - The actor to save questions for
   * @param questions - Array of questions to save
   */
  async saveDMQuestions(actor: any, questions: DMQuestion[]): Promise<void> {
    try {
      const data = await TurnPrepStorage.load(actor);
      data.dmQuestions = questions;
      await TurnPrepStorage.save(actor, data);
      debug(`Saved ${questions.length} DM questions for actor ${actor.id}`);
    } catch (err) {
      logError('Failed to save DM questions', err as Error);
      throw err;
    }
  }

  /**
   * Get singleton instance for method chaining
   * @returns TurnPrepStorage instance
   */
  static getInstance(): TurnPrepStorage {
    return new TurnPrepStorage();
  }

  /**
   * Get the flag scope and key constants
   * Useful for debugging or direct flag access
   * 
   * @returns Object with scope and key
   */
  static getFlagInfo(): { scope: string; key: string } {
    return {
      scope: FLAG_SCOPE,
      key: FLAG_KEY_DATA,
    };
  }
}
