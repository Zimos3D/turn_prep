/**
 * Turn Prep Module API
 * 
 * Public API that other modules can use to extend Turn Prep.
 * Follows Foundry conventions for module APIs.
 * Exposed as window.TurnPrepAPI after initialization.
 */

import { MODULE_ID } from '../constants';
import { FoundryAdapter } from '../foundry/FoundryAdapter';
import { info, warn } from '../utils/logging';
import { TurnPrepStorage } from '../features/data/TurnPrepStorage';
import { FeatureSelector } from '../features/feature-selection/FeatureSelector';
import type { TurnPrepData, DMQuestion, TurnPlan, Reaction } from '../types';

/**
 * Public API class for Turn Prep module
 * Other modules can access this to integrate with Turn Prep
 */
export class TurnPrepApi {
  constructor() {
    info('Turn Prep API initialized');
  }

  // ========================================================================
  // Actor Data Methods
  // ========================================================================

  /**
   * Get Turn Prep data for an actor
   * @param actor - The actor object
   * @returns The Turn Prep data, or null if not found
   */
  getTurnPrepData(actor: Actor): TurnPrepData | null {
    return FoundryAdapter.getTurnPrepData(actor);
  }

  /**
   * Save Turn Prep data to an actor
   * @param actor - The actor object
   * @param data - The data to save
   * @returns Promise that resolves when data is saved
   */
  async saveTurnPrepData(actor: Actor, data: TurnPrepData): Promise<void> {
    return FoundryAdapter.setTurnPrepData(actor, data);
  }

  /**
   * Clear all Turn Prep data from an actor
   * @param actor - The actor object
   * @returns Promise that resolves when data is cleared
   */
  async clearTurnPrepData(actor: Actor): Promise<void> {
    return FoundryAdapter.deleteFlag(actor, 'turnPrepData');
  }

  // ========================================================================
  // Info Methods
  // ========================================================================

  /**
   * Get the module ID
   * @returns The module ID string
   */
  getModuleId(): string {
    return MODULE_ID;
  }

  /**
   * Get module version
   * @returns The module version string
   */
  getModuleVersion(): string {
    const module = FoundryAdapter.getModule(MODULE_ID);
    return (module as any)?.version ?? '0.0.0';
  }

  /**
   * Check if a specific feature is available
   * @param featureName - The feature name to check
   * @returns True if feature is available
   */
  isFeatureAvailable(featureName: string): boolean {
    const features = [
      'dmQuestions',
      'turnPlans',
      'reactions',
      'history',
      'favorites',
      'contextMenu',
    ];
    return features.includes(featureName);
  }

  /**
   * Get list of all available features
   * @returns Array of feature names
   */
  getAvailableFeatures(): string[] {
    return [
      'dmQuestions',
      'turnPlans',
      'reactions',
      'history',
      'favorites',
      'contextMenu',
    ];
  }

  /**
   * Check if Tidy 5E is integrated
   * @returns True if Tidy 5E integration is active
   */
  isTidyIntegrated(): boolean {
    return FoundryAdapter.isModuleActive('tidy5e-sheet');
  }

  /**
   * Check if MidiQOL is available
   * @returns True if MidiQOL is active
   */
  isMidiQOLAvailable(): boolean {
    return FoundryAdapter.isModuleActive('midi-qol');
  }

  // ========================================================================
  // Phase 2: Data Layer Methods
  // ========================================================================

  /**
   * Load Turn Prep data from actor flags
   * Returns empty data if none exists
   * @param actor - The actor to load data for
   * @returns Promise resolving to TurnPrepData
   */
  async loadTurnPrepData(actor: any): Promise<TurnPrepData> {
    return TurnPrepStorage.load(actor);
  }

  /**
   * Save Turn Prep data to actor flags
   * @param actor - The actor to save data for
   * @param data - The TurnPrepData to save
   * @returns Promise that resolves when saved
   */
  async saveTurnPrepDataToFlags(actor: any, data: TurnPrepData): Promise<void> {
    return TurnPrepStorage.save(actor, data);
  }

  /**
   * Get all selectable features for an actor
   * @param actor - The actor to query
   * @returns Array of selectable features
   */
  getAllActorFeatures(actor: any): any[] {
    return FeatureSelector.getAllSelectableFeatures(actor);
  }

  /**
   * Get features by activation type (action, bonus, reaction)
   * @param actor - The actor to query
   * @param activationType - The activation type
   * @returns Array of matching features
   */
  getFeaturesByActivationType(actor: any, activationType: string): any[] {
    return FeatureSelector.getFeaturesByActivationType(actor, activationType);
  }

  /**
   * Get features by item type (spell, weapon, feat, etc.)
   * @param actor - The actor to query
   * @param itemType - The item type
   * @returns Array of matching features
   */
  getFeaturesByItemType(actor: any, itemType: string): any[] {
    return FeatureSelector.getFeaturesByItemType(actor, itemType);
  }

  // ========================================================================
  // Hook Registration (for external modules)
  // ========================================================================

  /**
   * Register a callback for when Turn Prep data changes
   * @param callback - Function to call when data changes
   * @returns Hook ID for later unregistration
   */
  onTurnPrepDataChanged(
    callback: (actor: Actor, data: TurnPrepData) => void
  ): number {
    return FoundryAdapter.onHook('turnPrep.dataChanged', callback);
  }

  /**
   * Register a callback for when a feature is selected
   * @param callback - Function to call when feature is selected
   * @returns Hook ID for later unregistration
   */
  onFeatureSelected(
    callback: (actor: Actor, itemId: string, actionType: string) => void
  ): number {
    return FoundryAdapter.onHook('turnPrep.featureSelected', callback);
  }

  /**
   * Unregister a hook
   * @param hookName - The hook name
   * @param hookId - The hook ID to unregister
   */
  offHook(hookName: string, hookId: number): void {
    FoundryAdapter.offHook(hookName, hookId);
  }

  // ========================================================================
  // Utility Methods
  // ========================================================================

  /**
   * Log a message from external modules
   * @param message - The message to log
   * @param data - Optional data to log
   */
  log(message: string, data?: any): void {
    info(`[External Module] ${message}`, data);
  }

  /**
   * Log a warning from external modules
   * @param message - The warning message
   * @param data - Optional data to log
   */
  warn(message: string, data?: any): void {
    warn(`[External Module] ${message}`, data);
  }

  // ========================================================================
  // Version Check
  // ========================================================================

  /**
   * Check if the API version matches requirements
   * @param majorVersion - Required major version
   * @returns True if compatible
   */
  isApiVersionCompatible(majorVersion: number): boolean {
    const currentVersion = this.getModuleVersion();
    const currentMajor = parseInt(currentVersion.split('.')[0]);
    return currentMajor >= majorVersion;
  }
}

export const TurnPrepApiInstance = new TurnPrepApi();
