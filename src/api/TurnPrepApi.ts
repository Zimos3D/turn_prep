/**
 * Turn Prep Module API
 * 
 * Public API that other modules can use to extend Turn Prep.
 * Follows Foundry conventions for module APIs.
 * Exposed as window.TurnPrepAPI after initialization.
 */

import { MODULE_ID } from '../constants';
import { FoundryAdapter } from '../foundry/FoundryAdapter';
import { info, warn, debug } from '../utils/logging';
import { TurnPrepStorage } from '../features/data/TurnPrepStorage';
import { FeatureSelector } from '../features/feature-selection/FeatureSelector';
import { RollHandler } from '../features/roll-integration/RollHandler';
import { ContextMenuHandler } from '../features/context-menu/ContextMenuHandler';
import * as SettingsModule from '../settings/settings';
import type { TurnPrepData, DMQuestion, TurnPlan, Reaction } from '../types';

/**
 * Public API class for Turn Prep module
 * Other modules can access this to integrate with Turn Prep
 */
export class TurnPrepApi {
  // Settings namespace for accessing configuration
  settings = {
    getDefaultHistoryLimit: () => SettingsModule.getDefaultHistoryLimit(),
    getHistoryLimitForActor: (actor: Actor) => SettingsModule.getHistoryLimitForActor(actor),
    setHistoryLimitForActor: (actor: Actor, limit: number) => SettingsModule.setHistoryLimitForActor(actor, limit),
    clearHistoryLimitOverride: (actor: Actor) => SettingsModule.clearHistoryLimitOverride(actor),
    getEditHistoryCheckpointLimit: () => SettingsModule.getEditHistoryCheckpointLimit(),
    canPlayersEditHistory: () => SettingsModule.canPlayersEditHistory(),
    isTurnPrepTabEnabled: () => SettingsModule.isTurnPrepTabEnabled(),
    isEditHistoryEnabledForActor: (actor: Actor) => SettingsModule.isEditHistoryEnabledForActor(actor),
  };

  // Roll integration namespace for managing history and rolls
  rolls = {
    createHistorySnapshot: (actor: Actor, plan: TurnPlan) => RollHandler.createHistorySnapshot(actor, plan),
    discoverRollsForPlan: (actor: Actor, plan: TurnPlan) => RollHandler.discoverRollsForPlan(actor, plan),
    discoverSavingThrowsForActor: (actor: Actor) => RollHandler.discoverSavingThrowsForActor(actor),
    createEditCheckpoint: (actor: Actor, plan: TurnPlan, description: string) => RollHandler.createEditCheckpoint(actor, plan, description),
    restorePlanFromCheckpoint: (actor: Actor, planName: string, checkpointId: string) => RollHandler.restorePlanFromCheckpoint(actor, planName, checkpointId),
    removeMissingFeaturesFromPlan: (actor: Actor, plan: TurnPlan) => RollHandler.removeMissingFeaturesFromPlan(actor, plan),
    showEndOfTurnDialog: (actor: Actor) => RollHandler.showEndOfTurnDialog(actor),
  };

  // Debug namespace for troubleshooting context menu and other integration issues
  debug = {
    /**
     * Get an item by ID from any actor's owned items
     * Searches through all actors to find the item
     */
    getItemById: (itemId: string): Item | null => {
      console.log(`[Turn Prep Debug] Searching for item with ID: ${itemId}`);
      
      // First try to find by searching all actors' owned items
      const actors = game.actors?.contents || [];
      for (const actor of actors) {
        const item = actor.items.get(itemId);
        if (item) {
          console.log(`[Turn Prep Debug] Found item: "${item.name}" (ID: ${itemId}) on actor "${actor.name}"`);
          return item;
        }
      }

      // Also try to find in open sheet windows
      for (const window of Object.values(ui.windows)) {
        const w = window as any;
        if (w.object && w.object.items) {
          const item = w.object.items.get(itemId);
          if (item) {
            console.log(`[Turn Prep Debug] Found item: "${item.name}" (ID: ${itemId}) on actor "${w.object.name}"`);
            return item;
          }
        }
      }

      console.warn(`[Turn Prep Debug] Item not found with ID: ${itemId}`);
      console.warn(`[Turn Prep Debug] Tip: Use game.TurnPrepAPI.debug.listAllItems() to see available items`);
      return null;
    },

    /**
     * List all items from all actors (helpful for finding IDs)
     */
    listAllItems: (): void => {
      console.log('[Turn Prep Debug] Listing all items from all actors:');
      const actors = game.actors?.contents || [];
      for (const actor of actors) {
        console.log(`\n  Actor: "${actor.name}" (ID: ${actor.id})`);
        const items = actor.items.contents || [];
        for (const item of items) {
          console.log(`    - "${item.name}" (ID: ${item.id}, Type: ${item.type})`);
        }
      }
    },

    /**
     * Test if activities can be found for an item
     * Accepts either an Item object or an item ID string
     */
    testActivitiesForItem: (itemOrId: Item | string): any[] => {
      let item: Item | null = null;

      // If string, try to find the item by ID
      if (typeof itemOrId === 'string') {
        item = (window as any).TurnPrepAPI?.debug?.getItemById(itemOrId) || null;
        if (!item) {
          console.warn(`[Turn Prep Debug] Could not find item with ID: ${itemOrId}`);
          return [];
        }
      } else {
        item = itemOrId;
      }

      if (!item) {
        console.warn('[Turn Prep Debug] No item provided');
        return [];
      }
      const activities = FeatureSelector.getActivitiesForItem(item);
      console.log(`[Turn Prep Debug] Found ${activities.length} activities for item "${item.name}":`, activities);
      return activities;
    },

    /**
     * Test the context menu handler on a specific item
     * Accepts either Item/Actor objects or ID strings
     */
    testContextMenuForItem: (actorOrId: Actor | string, itemOrId: Item | string): void => {
      let actor: Actor | null = null;
      let item: Item | null = null;

      // Get actor
      if (typeof actorOrId === 'string') {
        actor = game.actors?.get(actorOrId) || null;
        if (!actor) {
          console.warn(`[Turn Prep Debug] Could not find actor with ID: ${actorOrId}`);
          return;
        }
      } else {
        actor = actorOrId;
      }

      // Get item
      if (typeof itemOrId === 'string') {
        item = actor?.items?.get(itemOrId) || null;
        if (!item) {
          console.warn(`[Turn Prep Debug] Could not find item with ID: ${itemOrId}`);
          return;
        }
      } else {
        item = itemOrId;
      }

      if (!actor || !item) {
        console.warn('[Turn Prep Debug] Actor and item required');
        return;
      }
      const activities = FeatureSelector.getActivitiesForItem(item);
      console.log(`[Turn Prep Debug] Testing context menu for "${item.name}" on actor "${actor.name}"`);
      console.log(`[Turn Prep Debug] Activities found:`, activities);
      if (activities.length > 0) {
        console.log('[Turn Prep Debug] Context menu item would be added');
      } else {
        console.log('[Turn Prep Debug] Context menu item would NOT be added (no activities)');
      }
    },

    /**
     * Inspect the DOM structure of items in currently open sheets
     */
    inspectSheetItemDom: (): void => {
      console.log('[Turn Prep Debug] Inspecting open sheet items:');
      for (const window of Object.values(ui.windows)) {
        const w = window as any;
        if (w.object && w.object.items) {
          console.log(`Sheet: ${w.constructor.name} for actor "${w.object.name}"`);
          const itemElements = w.element?.find('[data-item-id]');
          console.log(`Found ${itemElements?.length ?? 0} elements with [data-item-id] attribute`);
          itemElements?.each((i: number, el: HTMLElement) => {
            const itemId = el.getAttribute('data-item-id');
            const item = w.object.items.get(itemId);
            console.log(`  - ${item?.name} (${itemId})`);
          });
        }
      }
    },

    /**
     * Check module integration status
     */
    checkIntegration: (): void => {
      console.log('[Turn Prep Debug] Module Integration Status:');
      const api = (window as any).TurnPrepAPI || TurnPrepApiInstance;
      console.log(`Tidy 5E integrated: ${api.isTidyIntegrated()}`);
      console.log(`MidiQOL available: ${api.isMidiQOLAvailable()}`);
      console.log(`Module version: ${api.getModuleVersion()}`);
      console.log('Available features:', api.getAvailableFeatures());
    },

    /**
     * Comprehensive hook detection - logs ALL hooks that fire
     */
    detectAllHooks: (): void => {
      console.log('[Turn Prep Debug] Starting comprehensive hook detection');
      console.log('[Turn Prep Debug] Right-click an item and watch for hook names below...');
      
      // Create a proxy to intercept all hook registrations
      const originalHooksOn = Hooks.on.bind(Hooks);
      
      // List of potential context menu related hooks to monitor
      const contextMenuHooks = [
        'dnd5e.getItemContextOptions',
        'getItemContextOptions',
        'getContextOptions',
        'contextMenu',
        'dnd5e.contextMenu',
        'tidy5e.contextMenu',
        'tidy5e.itemContextMenu',
        'renderContextMenu',
        'preRenderContextMenu',
      ];
      
      // Register listeners for all potential hooks
      contextMenuHooks.forEach(hookName => {
        Hooks.on(hookName, (...args: any[]) => {
          console.log(`[Turn Prep Debug] ✓✓✓ HOOK FIRED: ${hookName}`, args);
        });
      });
      
      console.log('[Turn Prep Debug] Listening for hooks:', contextMenuHooks);
      console.log('[Turn Prep Debug] Now right-click an item in the sheet...');
    },

    /**
     * List all registered hooks
     */
    listRegisteredHooks: (): void => {
      console.log('[Turn Prep Debug] Registered hooks:');
      const hooksObj = (Hooks as any)._hooks;
      if (hooksObj) {
        const hookNames = Object.keys(hooksObj).sort();
        console.log(`[Turn Prep Debug] Total hooks: ${hookNames.length}`);
        hookNames.forEach(name => {
          const callbacks = hooksObj[name];
          if (Array.isArray(callbacks) && callbacks.length > 0) {
            console.log(`  - ${name}: ${callbacks.length} callback(s)`);
          }
        });
      } else {
        console.warn('[Turn Prep Debug] Could not access Hooks object');
      }
    },
  };

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

  // ========================================================================
  // DM Questions Management
  // ========================================================================

  /**
   * Get all DM questions for an actor
   * @param actor - The actor to get questions for
   * @returns Array of DM questions
   */
  async getDMQuestions(actor: Actor): Promise<DMQuestion[]> {
    return TurnPrepStorage.getInstance().getDMQuestions(actor);
  }

  /**
   * Save DM questions for an actor
   * @param actor - The actor to save questions for
   * @param questions - Array of questions to save
   */
  async saveDMQuestions(actor: Actor, questions: DMQuestion[]): Promise<void> {
    return TurnPrepStorage.getInstance().saveDMQuestions(actor, questions);
  }

  /**
   * Send a question to the DM as a whisper
   * @param actor - The actor sending the question
   * @param questionText - The question text
   */
  async sendQuestionToDm(actor: Actor, questionText: string): Promise<void> {
    const dmUsers = game.users?.filter(u => u.isGM) || [];
    if (dmUsers.length === 0) {
      throw new Error('No GM users found');
    }

    const message = `${actor.name} asks: ${questionText}`;
    const dmUserIds = dmUsers.map(u => u.id);

    await ChatMessage.create({
      content: message,
      whisper: dmUserIds,
      speaker: ChatMessage.getSpeaker({ actor })
    });
  }

  /**
   * Send a question to public chat
   * @param actor - The actor sending the question
   * @param questionText - The question text
   */
  async sendQuestionPublic(actor: Actor, questionText: string): Promise<void> {
    const message = `${actor.name} asks: ${questionText}`;

    await ChatMessage.create({
      content: message,
      speaker: ChatMessage.getSpeaker({ actor })
    });
  }

  // ========================================================================
  // Module Information
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
