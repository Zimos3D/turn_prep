/**
 * Foundry Adapter
 * 
 * Compatibility layer for Foundry VTT API.
 * Centralizes all Foundry API calls to make the code more maintainable
 * and easier to update if Foundry's API changes.
 * 
 * Usage:
 * - Use FoundryAdapter for all Foundry API interactions
 * - Keeps the rest of the code independent of Foundry internals
 * - Easy to add compatibility shims if Foundry changes
 */

import { MODULE_ID, FLAG_SCOPE, FLAG_KEY_DATA, MIN_FOUNDRY_VERSION, MIN_DND5E_VERSION } from '../constants';
import { info, warn, error as logError, notifyWarning, notifyError } from '../utils/logging';
import type { TurnPrepData } from '../types';

// ============================================================================
// Foundry Adapter - Main Class
// ============================================================================

export class FoundryAdapter {
  /**
   * Check if Foundry is ready
   * @returns True if Foundry game is loaded and ready
   */
  static isReady(): boolean {
    return typeof game !== 'undefined' && game.ready === true;
  }

  /**
   * Check if user is a GM/Dungeon Master
   * @returns True if current user is a GM
   */
  static isGM(): boolean {
    return this.isReady() && game.user?.isGM === true;
  }

  /**
   * Get the current user
   * @returns The current user object
   */
  static getCurrentUser(): User | null {
    if (!this.isReady()) return null;
    return game.user ?? null;
  }

  /**
   * Check version compatibility
   * @returns Object with compatibility status
   */
  static checkVersionCompatibility(): {
    foundryOk: boolean;
    systemOk: boolean;
    message: string;
  } {
    const foundryVersion = game.version || game.data?.version || '0.0.0';
    const systemId = game.system?.id;
    const systemVersion = game.system?.version || '0.0.0';

    const foundryOk = this.compareVersions(foundryVersion, MIN_FOUNDRY_VERSION) >= 0;
    const systemOk = systemId === 'dnd5e' && this.compareVersions(systemVersion, MIN_DND5E_VERSION) >= 0;

    let message = 'Compatibility check:';
    if (foundryOk) {
      message += ` ✓ Foundry ${foundryVersion}`;
    } else {
      message += ` ✗ Foundry ${foundryVersion} (requires ${MIN_FOUNDRY_VERSION}+)`;
    }

    if (systemOk) {
      message += `, ✓ D&D 5e ${systemVersion}`;
    } else if (systemId === 'dnd5e') {
      message += `, ✗ D&D 5e ${systemVersion} (requires ${MIN_DND5E_VERSION}+)`;
    } else {
      message += `, ✗ System is '${systemId}' (requires 'dnd5e')`;
    }

    return { foundryOk, systemOk, message };
  }

  /**
   * Compare two version strings
   * @param version1 - First version (e.g., "13.0.0")
   * @param version2 - Second version
   * @returns -1 if v1 < v2, 0 if equal, 1 if v1 > v2
   */
  static compareVersions(version1: string, version2: string): number {
    const v1 = version1.split('.').map(Number);
    const v2 = version2.split('.').map(Number);

    for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
      const num1 = v1[i] || 0;
      const num2 = v2[i] || 0;
      if (num1 < num2) return -1;
      if (num1 > num2) return 1;
    }
    return 0;
  }

  // ========================================================================
  // Localization
  // ========================================================================

  /**
   * Localize a string using Foundry's i18n system
   * @param key - The localization key (e.g., "TurnPrep.TabName")
   * @param data - Optional data for substitution {key: value}
   * @returns The localized string
   */
  static localize(key: string, data?: Record<string, string | number>): string {
    if (!this.isReady()) return key;
    return game.i18n.localize(key);
  }

  /**
   * Localize with data substitution
   * @param key - The localization key
   * @param data - Data to substitute in the string
   * @returns The localized string with data substituted
   */
  static localizeFormat(key: string, data?: Record<string, string | number>): string {
    if (!this.isReady()) return key;
    return game.i18n.format(key, data);
  }

  /**
   * Get all localizations for a prefix
   * Useful for getting multiple related strings at once
   * @param prefix - Prefix to search (e.g., "TurnPrep")
   * @returns Object with all localized strings for that prefix
   */
  static localizeAll(prefix: string): Record<string, string> {
    if (!this.isReady()) return {};
    return game.i18n.translations[prefix] || {};
  }

  // ========================================================================
  // Text / HTML Helpers
  // ========================================================================

  /**
   * Enrich HTML content using Foundry's TextEditor so shortcodes render like tidy5e.
   * Falls back to the original string if enrichment fails.
   */
  static async enrichHtml(content?: string | null, options: Record<string, any> = {}): Promise<string | null> {
    if (typeof content !== 'string' || !content.trim()) {
      return content ?? null;
    }

    try {
      const TextEditorClass = (globalThis as any)?.TextEditor;
      if (typeof TextEditorClass?.enrichHTML !== 'function') {
        return content;
      }

      const enrichOptions = {
        async: true,
        secrets: this.isGM(),
        rollData: options.rollData ?? {},
        ...options
      };
      return await TextEditorClass.enrichHTML(content, enrichOptions);
    } catch (err) {
      warn('[FoundryAdapter] Failed to enrich HTML content', err as Error);
      return content;
    }
  }

  // ========================================================================
  // Actor Operations
  // ========================================================================

  /**
   * Get an actor by ID
   * @param actorId - The actor ID
   * @returns The actor object, or null if not found
   */
  static getActor(actorId: string): Actor | null {
    if (!this.isReady()) return null;
    return game.actors?.get(actorId) ?? null;
  }

  /**
   * Get all actors
   * @returns Array of all actors in the world
   */
  static getAllActors(): Actor[] {
    if (!this.isReady()) return [];
    return Array.from(game.actors?.values() ?? []);
  }

  /**
   * Get all owned actors (player characters)
   * @returns Array of owned actors
   */
  static getOwnedActors(): Actor[] {
    if (!this.isReady()) return [];
    return this.getAllActors().filter((a) => a.isOwner === true);
  }

  /**
   * Update an actor with new data
   * @param actorId - The actor ID
   * @param updates - Object with properties to update
   * @returns Promise that resolves when update is complete
   */
  static async updateActor(actorId: string, updates: Record<string, any>): Promise<void> {
    const actor = this.getActor(actorId);
    if (!actor) {
      throw new Error(`Actor not found: ${actorId}`);
    }

    try {
      await actor.update(updates);
    } catch (err) {
      logError(`Failed to update actor ${actorId}`, err as Error);
      throw err;
    }
  }

  // ========================================================================
  // Actor Flags
  // ========================================================================

  /**
   * Get flag value from an actor
   * @param actor - The actor object
   * @param key - The flag key
   * @returns The flag value, or null if not set
   */
  static getFlag(actor: Actor, key: string): any {
    if (!actor) return null;
    return actor.getFlag(FLAG_SCOPE, key) ?? null;
  }

  /**
   * Get Turn Prep data from an actor
   * @param actor - The actor object
   * @returns The Turn Prep data, or null if not found
   */
  static getTurnPrepData(actor: Actor): TurnPrepData | null {
    if (!actor) return null;
    return this.getFlag(actor, FLAG_KEY_DATA) ?? null;
  }

  /**
   * Set a flag value on an actor
   * @param actor - The actor object
   * @param key - The flag key
   * @param value - The value to set
   * @returns Promise that resolves when flag is set
   */
  static async setFlag(actor: Actor, key: string, value: any): Promise<void> {
    if (!actor) {
      throw new Error('Cannot set flag on null actor');
    }

    try {
      await actor.setFlag(FLAG_SCOPE, key, value);
    } catch (err) {
      logError(`Failed to set flag ${key} on actor`, err as Error);
      throw err;
    }
  }

  /**
   * Set Turn Prep data on an actor
   * @param actor - The actor object
   * @param data - The Turn Prep data
   * @returns Promise that resolves when data is saved
   */
  static async setTurnPrepData(actor: Actor, data: TurnPrepData): Promise<void> {
    return this.setFlag(actor, FLAG_KEY_DATA, data);
  }

  /**
   * Delete a flag from an actor
   * @param actor - The actor object
   * @param key - The flag key
   * @returns Promise that resolves when flag is deleted
   */
  static async deleteFlag(actor: Actor, key: string): Promise<void> {
    if (!actor) {
      throw new Error('Cannot delete flag on null actor');
    }

    try {
      await actor.unsetFlag(FLAG_SCOPE, key);
    } catch (err) {
      logError(`Failed to delete flag ${key} from actor`, err as Error);
      throw err;
    }
  }

  // ========================================================================
  // Item Operations
  // ========================================================================

  /**
   * Get an item from an actor
   * @param actorId - The actor ID
   * @param itemId - The item ID
   * @returns The item object, or null if not found
   */
  static getItem(actorId: string, itemId: string): Item | null {
    const actor = this.getActor(actorId);
    if (!actor) return null;
    return actor.items?.get(itemId) ?? null;
  }

  /**
   * Get all items of specific types from an actor
   * @param actorId - The actor ID
   * @param types - Array of item types to include (e.g., ['spell', 'feat'])
   * @returns Array of matching items
   */
  static getItemsByType(actorId: string, types: string[]): Item[] {
    const actor = this.getActor(actorId);
    if (!actor) return [];

    return Array.from(actor.items?.values() ?? []).filter((item) =>
      types.includes((item as any).type)
    );
  }

  /**
   * Get all items with a specific activation type
   * @param actorId - The actor ID
   * @param activationType - The activation type (e.g., 'action', 'bonus', 'reaction')
   * @returns Array of matching items
   */
  static getItemsByActivationType(actorId: string, activationType: string): Item[] {
    const actor = this.getActor(actorId);
    if (!actor) return [];

    return Array.from(actor.items?.values() ?? []).filter((item) => {
      const activation = this.getItemActivationType(item);
      return activation === activationType;
    });
  }

  /**
   * Get all reaction features from an actor
   * @param actorId - The actor ID
   * @returns Array of items with reaction activation
   */
  static getReactionFeatures(actorId: string): Item[] {
    return this.getItemsByActivationType(actorId, 'reaction');
  }

  /**
   * Get the activation type of an item
   * @param item - The item object
   * @returns The activation type string, or empty string if none
   */
  static getItemActivationType(item: Item): string {
    const system = (item as any).system;
    if (!system) return '';

    // D&D 5e item activation
    const activation = system.activation;
    if (!activation) return '';

    return activation.type || '';
  }

  /**
   * Get the name of an item
   * @param item - The item object
   * @returns The item name
   */
  static getItemName(item: Item): string {
    return (item as any).name || 'Unknown Item';
  }

  /**
   * Get the type of an item
   * @param item - The item object
   * @returns The item type
   */
  static getItemType(item: Item): string {
    return (item as any).type || 'unknown';
  }

  /**
   * Check if an item is prepared (for spells)
   * @param item - The item object
   * @returns True if prepared, false otherwise
   */
  static isItemPrepared(item: Item): boolean {
    const system = (item as any).system;
    if (!system) return true;

    // D&D 5e preparation flag
    return system.preparation?.prepared !== false;
  }

  /**
   * Check if user can use an item
   * @param item - The item object
   * @returns True if user has permission to use it
   */
  static canUseItem(item: Item): boolean {
    const actor = item.actor;
    if (!actor) return true;

    // For now, just check if actor is owned
    return actor.isOwner === true;
  }

  // ========================================================================
  // Permission Checking
  // ========================================================================

  /**
   * Check if user can view an actor
   * @param actor - The actor to check
   * @returns True if user can view
   */
  static canViewActor(actor: Actor): boolean {
    return (actor as any).can?.(game.user, 'view') ?? true;
  }

  /**
   * Check if user can update an actor
   * @param actor - The actor to check
   * @returns True if user can update
   */
  static canUpdateActor(actor: Actor): boolean {
    return (actor as any).can?.(game.user, 'update') ?? actor.isOwner === true;
  }

  /**
   * Check if user owns an actor
   * @param actor - The actor to check
   * @returns True if user owns the actor
   */
  static isActorOwner(actor: Actor): boolean {
    return actor.isOwner === true;
  }

  // ========================================================================
  // Dialog & UI
  // ========================================================================

  /**
   * Show a confirmation dialog
   * @param title - Dialog title
   * @param message - Dialog message
   * @returns Promise that resolves to true if confirmed, false if cancelled
   */
  static async confirm(title: string, message: string): Promise<boolean> {
    return new Promise((resolve) => {
      new Dialog({
        title,
        content: message,
        buttons: {
          confirm: {
            icon: '<i class="fas fa-check"></i>',
            label: 'Confirm',
            callback: () => resolve(true),
          },
          cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: 'Cancel',
            callback: () => resolve(false),
          },
        },
        default: 'cancel',
      }).render(true);
    });
  }

  /**
   * Show a notification toast in Foundry UI
   * @param message - The message to display
   * @param type - Type of notification (info, warning, error)
   * @param duration - Duration in milliseconds (0 = persistent)
   */
  static notify(message: string, type: 'info' | 'warning' | 'error' = 'info', duration: number = 5000): void {
    if (!this.isReady() || !ui.notifications) return;

    if (type === 'warning') {
      ui.notifications.warn(message, { permanent: duration === 0 });
    } else if (type === 'error') {
      ui.notifications.error(message, { permanent: duration === 0 });
    } else {
      ui.notifications.info(message, { permanent: duration === 0 });
    }
  }

  // ========================================================================
  // Hooks
  // ========================================================================

  /**
   * Register a hook callback
   * @param hookName - The hook name
   * @param callback - The callback function
   * @returns The hook ID
   */
  static onHook(hookName: string, callback: Function): number {
    return Hooks.on(hookName, callback);
  }

  /**
   * Register a one-time hook callback
   * @param hookName - The hook name
   * @param callback - The callback function
   * @returns The hook ID
   */
  static onceHook(hookName: string, callback: Function): number {
    return Hooks.once(hookName, callback);
  }

  /**
   * Call a hook
   * @param hookName - The hook name
   * @param args - Arguments to pass to hook handlers
   * @returns Number of handlers called
   */
  static callHook(hookName: string, ...args: any[]): number {
    return Hooks.callAll(hookName, ...args);
  }

  /**
   * Unregister a hook
   * @param hookName - The hook name
   * @param hookId - The hook ID returned from onHook
   */
  static offHook(hookName: string, hookId: number): void {
    Hooks.off(hookName, hookId);
  }

  // ========================================================================
  // Settings
  // ========================================================================

  /**
   * Register a module setting
   * @param key - The setting key
   * @param options - Setting options
   */
  static registerSetting(key: string, options: any): void {
    // Settings must be registered during init hook, before game is fully ready
    // So we don't check isReady() here
    game.settings.register(MODULE_ID, key, options);
  }

  /**
   * Get a setting value
   * @param key - The setting key
   * @returns The setting value
   */
  static getSetting(key: string): any {
    if (!this.isReady()) return null;
    return game.settings.get(MODULE_ID, key);
  }

  /**
   * Set a setting value
   * @param key - The setting key
   * @param value - The new value
   * @returns Promise that resolves when setting is saved
   */
  static async setSetting(key: string, value: any): Promise<void> {
    if (!this.isReady()) {
      throw new Error('Cannot set setting before Foundry is ready');
    }

    try {
      await game.settings.set(MODULE_ID, key, value);
    } catch (err) {
      logError(`Failed to set setting ${key}`, err as Error);
      throw err;
    }
  }

  // ========================================================================
  // Module Management
  // ========================================================================

  /**
   * Check if a module is active
   * @param moduleId - The module ID
   * @returns True if module is active
   */
  static isModuleActive(moduleId: string): boolean {
    if (!this.isReady()) return false;
    return game.modules?.has(moduleId) === true;
  }

  /**
   * Get a module
   * @param moduleId - The module ID
   * @returns The module object, or null if not found
   */
  static getModule(moduleId: string): Module | null {
    if (!this.isReady()) return null;
    return game.modules?.get(moduleId) ?? null;
  }

  /**
   * Get the API of another module
   * @param moduleId - The module ID
   * @param apiPath - Path to the API (e.g., 'api' for module.api)
   * @returns The API object, or null if not found
   */
  static getModuleApi(moduleId: string, apiPath: string = 'api'): any {
    const module = this.getModule(moduleId);
    if (!module) return null;

    const parts = apiPath.split('.');
    let result = module;
    for (const part of parts) {
      result = (result as any)[part];
      if (!result) return null;
    }

    return result;
  }

  // ========================================================================
  // Utilities
  // ========================================================================

  /**
   * Log a message with the module ID prefix
   * @param message - The message to log
   * @param args - Additional arguments
   */
  static log(message: string, ...args: any[]): void {
    info(message, ...args);
  }

  /**
   * Open a link in a new tab
   * @param url - The URL to open
   */
  static openUrl(url: string): void {
    window.open(url, '_blank');
  }
}
