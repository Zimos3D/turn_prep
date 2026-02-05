/**
 * Context Menu Handler
 * 
 * Integrates with Foundry's right-click context menu system.
 * Provides:
 * 1. "Add to Turn Prep" on items (with activity selection dialog if needed)
 * 2. Right-click context menu in Turn Prep panel (remove, details, swap, copy, duplicate, favorite)
 * 3. Drag & drop field movement with activity validation
 * 
 * Key Features:
 * - Smart activity selection dialog (shows only if multiple activation types)
 * - Font Awesome icons for action types (circle, play, exchange)
 * - Drag & drop validation checks source item for matching activities
 * - Full error handling and user feedback
 */

import { info, debug, warn } from '../../utils/logging';
import { FoundryAdapter } from '../../foundry/FoundryAdapter';
import { TurnPrepStorage } from '../data/TurnPrepStorage';
import { FeatureSelector } from '../feature-selection/FeatureSelector';
import { createTurnPlan, createReaction } from '../../utils/data';
import type { TurnPrepData, TurnPlan, Reaction, SelectedFeature } from '../../types';
import { editSessionStore } from '../edit-mode/EditSessionStore';
import { get } from 'svelte/store';

/**
 * Activity selection dialog option
 */
interface ActivityDialogOption {
  activity: any; // D&D 5e Activity object
  activationType: string;
  displayLabel: string;
  icon: string;
}

/**
 * Context menu item data
 */
interface ContextMenuItem {
  name: string;
  icon: string;
  condition?: (li: HTMLElement) => boolean;
  callback: (li: HTMLElement) => void | Promise<void>;
}

/**
 * Maps activation types to Font Awesome icon classes
 */
const ACTIVATION_ICONS: Record<string, string> = {
  'action': 'fa-circle',
  'bonus': 'fa-play',
  'reaction': 'fa-exchange-alt',
  'minute': 'fa-hourglass-start',
  'hour': 'fa-hourglass-half',
  'day': 'fa-hourglass-end',
  'minute:1': 'fa-hourglass-start',
  'hour:1': 'fa-hourglass-half',
  'day:1': 'fa-hourglass-end',
};

/**
 * Maps activation types to user-friendly labels
 */
const ACTIVATION_LABELS: Record<string, string> = {
  'action': 'Action',
  'bonus': 'Bonus Action',
  'reaction': 'Reaction',
  'minute': 'Minute',
  'hour': 'Hour',
  'day': 'Day',
  'minute:1': '1 Minute',
  'hour:1': '1 Hour',
  'day:1': '1 Day',
};

/**
 * ContextMenuHandler class
 * Manages all context menu integration for Turn Prep
 */
export class ContextMenuHandler {
  /**
   * Register all context menu hooks
   */
  static registerContextMenus(): void {
    try {
      // Register item context menu (Add to Turn Prep)
      ContextMenuHandler.registerItemContextMenu();
      
      // Register Turn Prep panel context menu
      ContextMenuHandler.registerTurnPrepContextMenu();
      
      // Register drag & drop handlers
      ContextMenuHandler.registerDragDropHandlers();
      
      info('Context menus registered');
    } catch (error) {
      warn('Failed to register context menus:', error);
    }
  }

  /**
   * Register "Add to Turn Prep" option on items in actor sheets
   * Works with both Tidy5e and default sheets
   */
  private static registerItemContextMenu(): void {
    debug('Registering item context menu hook');

    // Register the standard dnd5e hook
    // This is used by Tidy5e and the default D&D 5e system sheets
    const hookCallback = (item: any, menuItems: any[]) => {
      try {
        // Validate item
        if (!item) {
          debug('Context menu hook fired with no item');
          return;
        }

        // Ensure the item is owned by an actor
        const actor = item.actor || item.parent;
        if (!actor) {
          debug(`No actor found for item: ${item.name}`);
          return;
        }

        // Get activities
        let activities: any[] = [];
        try {
          activities = FeatureSelector.getActivitiesForItem(item);
        } catch (actErr) {
          warn(`Error getting activities for ${item.name}:`, actErr);
          return;
        }

        debug(`Adding context menu for ${item.name} (${activities.length} activities)`);

        // Create the menu item following Tidy5e's structure
        const menuItem = {
          name: 'Add to Turn Prep',
          icon: '<i class="fas fa-plus fa-fw"></i>',
          group: 'customize', // Use Tidy5e's customize group
          condition: () => true,
          callback: async (li?: HTMLElement) => {
            try {
              debug(`Adding ${item.name} to turn prep`);
              await ContextMenuHandler.handleAddToTurnPrep(actor, item, activities);
            } catch (cbErr) {
              warn(`Failed to add ${item.name} to turn prep:`, cbErr);
              ui.notifications?.error(`Failed to add ${item.name} to Turn Prep`);
            }
          },
        };

        // Add to array
        menuItems.push(menuItem);

      } catch (err) {
        console.error('[TURN-PREP] EXCEPTION in hook callback:', err);
        console.error(err);
      }
    };

    // Register the hook - this fires for every item context menu in D&D5e and Tidy5e
    Hooks.on('dnd5e.getItemContextOptions', hookCallback);
    debug('Registered dnd5e.getItemContextOptions hook');

    // Fallback hook: Standard Foundry sheets that don't use dnd5e.getItemContextOptions
    Hooks.on('getActorSheetContextMenuItems', (html: HTMLElement, menuItems: ContextMenuItem[]) => {
      debug('getActorSheetContextMenuItems hook fired (fallback for non-Tidy5e sheets)');
      ContextMenuHandler.addMenuItemsToList(html, menuItems);
    });
  }

  /**
   * Add menu items to a context menu list
   */
  private static addMenuItemsToList(html: HTMLElement, menuItems: ContextMenuItem[]): void {
    // Check if we have a valid item in the context menu
    const itemElement = html.closest('[data-item-id]');
    if (!itemElement) {
      debug('No item element found in context menu');
      return;
    }

    const itemId = itemElement.getAttribute('data-item-id');
    if (!itemId) {
      debug('No item ID found');
      return;
    }

    debug(`Found item element with ID: ${itemId}`);

    // Get the actor from the sheet
    // Try multiple methods to find the sheet
    let sheet: any = null;
    
    // Method 1: Look through open windows
    for (const w of Object.values(ui.windows)) {
      const window = w as any;
      if (window.element && window.object && window.object.items && window.object.items.get(itemId)) {
        sheet = window;
        break;
      }
    }

    // Method 2: If first method failed, try finding by closest sheet element
    if (!sheet) {
      const sheetElement = $(html).closest('.sheet');
      if (sheetElement.length > 0) {
        const sheetApp = sheetElement.data('app');
        if (sheetApp && sheetApp.object) {
          sheet = sheetApp;
        }
      }
    }

    if (!sheet?.object) {
      debug('Could not find sheet or actor');
      return;
    }

    const actor = sheet.object;
    const item = actor.items.get(itemId);
    if (!item) {
      debug(`Item ${itemId} not found on actor ${actor.name}`);
      return;
    }

    debug(`Found item: ${item.name} on actor: ${actor.name}`);

    // Get activities from the item
    const activities = FeatureSelector.getActivitiesForItem(item);
    debug(`Found ${activities.length} activities for ${item.name}`);

    // Add "Add to Turn Prep" menu option
    menuItems.push({
      name: 'Add to Turn Prep',
      icon: '<i class="fas fa-plus"></i>',
      callback: async (li: HTMLElement) => {
        await ContextMenuHandler.handleAddToTurnPrep(actor, item, activities);
      },
    });

    info(`Added "Add to Turn Prep" menu item for ${item.name}`);
  }

  /**
   * Handle adding an item to turn prep
   * Shows activity selection dialog if multiple activities exist
   */
  private static async handleAddToTurnPrep(
    actor: Actor,
    item: Item,
    activities: any[]
  ): Promise<void> {
    debug(`Handling add to turn prep for item: ${item.name}`);

    try {
      if (!activities || activities.length === 0) {
        await ContextMenuHandler.addFeatureToField(actor, item, null, 'other');
        return;
      }

      // If only one activity, add directly
      if (activities.length === 1) {
        const activity = activities[0];
        const activationType = activity.activation?.type || 'other';
        await ContextMenuHandler.addFeatureToField(actor, item, activity, activationType);
        return;
      }

      // Multiple activities - show selection dialog
      const selected = await ContextMenuHandler.showActivitySelectionDialog(item, activities);
      if (selected) {
        await ContextMenuHandler.addFeatureToField(
          actor,
          item,
          selected.activity,
          selected.activationType
        );
      }
    } catch (error) {
      warn(`Failed to add feature to turn prep: ${error}`);
      ui.notifications?.error(`Failed to add ${item.name} to turn prep`);
    }
  }

  /**
   * Show activity selection dialog when item has multiple activities
   */
  private static async showActivitySelectionDialog(
    item: Item,
    activities: any[]
  ): Promise<ActivityDialogOption | null> {
    return new Promise((resolve) => {
      // Get unique activation types
      const options: ActivityDialogOption[] = activities
        .filter((activity) => activity.activation?.type)
        .map((activity) => ({
          activity,
          activationType: activity.activation.type,
          displayLabel: activity.name || ACTIVATION_LABELS[activity.activation.type] || activity.activation.type,
          icon: ACTIVATION_ICONS[activity.activation.type] || 'fa-star',
        }));

      // If no valid activities, cancel
      if (options.length === 0) {
        resolve(null);
        return;
      }

      // If only one option after filtering, select it
      if (options.length === 1) {
        resolve(options[0]);
        return;
      }

      // Build dialog HTML
      let dialogHtml = `<form style="padding: 1rem;">`;
      dialogHtml += `<p style="margin-bottom: 1rem;">Select which activity to add:</p>`;
      dialogHtml += `<div style="display: flex; flex-direction: column; gap: 0.5rem;">`;

      options.forEach((option, index) => {
        dialogHtml += `
          <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
            <input type="radio" name="activity" value="${index}" ${index === 0 ? 'checked' : ''} />
            <i class="fas ${option.icon}" style="width: 1rem; text-align: center;"></i>
            <span>${option.displayLabel}</span>
          </label>
        `;
      });

      dialogHtml += `</div></form>`;

      // TODO: Migrate to ApplicationV2 in Phase 4 (Foundry V13+ deprecates Dialog/ApplicationV1)
      // This is a temporary solution using the legacy Dialog class
      // Will be replaced with proper Svelte dialog component in Phase 4 UI implementation
      const dialog = new Dialog(
        {
          title: `Add ${item.name} to Turn Prep`,
          content: dialogHtml,
          buttons: {
            select: {
              label: 'Add',
              icon: '<i class="fas fa-check"></i>',
              callback: (html: JQuery) => {
                const selectedIndex = parseInt(
                  html.find('input[name="activity"]:checked').val() as string
                );
                resolve(options[selectedIndex]);
              },
            },
            cancel: {
              label: 'Cancel',
              icon: '<i class="fas fa-times"></i>',
              callback: () => resolve(null),
            },
          },
          default: 'select',
        },
        { width: 400 }
      );

      dialog.render(true);
    });
  }

  /**
   * Add a feature to a turn plan field
   */
  private static async addFeatureToField(
    actor: Actor,
    item: Item,
    activity: any,
    activationType: string | undefined
  ): Promise<void> {
    const normalizedType = activationType && activationType !== 'other'
      ? FeatureSelector.getActivationType(activationType)
      : (activationType ?? 'other');
    debug(`Adding feature to field: ${item.name} (${normalizedType})`);

    try {
      const feature: SelectedFeature = {
        itemId: item.id as string,
        itemName: item.name ?? 'Unknown Feature',
        itemType: item.type ?? 'item',
        actionType: normalizedType,
      };

      // Check for active edit session
      const session = get(editSessionStore);
      if (session && session.actorId === actor.id) {
        editSessionStore.addFeature(feature, normalizedType as any);
        ui.notifications?.info(`Added ${item.name} to edited plan`);
        return;
      }

      const turnPrepData = await ContextMenuHandler.ensureTurnPrepData(actor);
      const targetPlan: TurnPlan = turnPrepData.turnPlans[0];

      switch (normalizedType) {
        case 'action':
          targetPlan.actions = targetPlan.actions ?? [];
          targetPlan.actions.push(feature);
          break;
        case 'bonus':
          targetPlan.bonusActions = targetPlan.bonusActions ?? [];
          targetPlan.bonusActions.push(feature);
          break;
        case 'reaction': {
          if (!Array.isArray(turnPrepData.reactions)) {
            turnPrepData.reactions = [];
          }

          let targetReaction: Reaction;

          if (!turnPrepData.reactions.length) {
            targetReaction = createReaction('', '', [feature]);
            turnPrepData.reactions.push(targetReaction);
          } else {
            targetReaction = turnPrepData.reactions[0];
            const existing = Array.isArray(targetReaction.reactionFeatures)
              ? [...targetReaction.reactionFeatures]
              : [];
            existing.push({
              itemId: feature.itemId,
              itemName: feature.itemName,
              itemType: feature.itemType,
              actionType: feature.actionType,
            });
            targetReaction.reactionFeatures = existing;
          }

          await TurnPrepStorage.save(actor, turnPrepData);
          ui.notifications?.info(`Added ${item.name} to reaction plan`);
          Hooks.callAll('turnprepAddedFeature', {
            actor,
            item,
            feature,
            isReaction: true,
            reactionPlan: targetReaction,
          });
          return;
        }
        default:
          targetPlan.additionalFeatures = targetPlan.additionalFeatures ?? [];
          targetPlan.additionalFeatures.push(feature);
      }

      await TurnPrepStorage.save(actor, turnPrepData);
      ui.notifications?.info(`Added ${item.name} to turn prep (${normalizedType})`);

      Hooks.callAll('turnprepAddedFeature', { actor, item, feature, plan: targetPlan });
    } catch (error) {
      warn(`Failed to add feature to turn prep: ${error}`);
      ui.notifications?.error(`Failed to add ${item.name} to turn prep`);
    }
  }

  /**
   * Ensure the actor has at least one turn plan and return the data structure
   */
  private static async ensureTurnPrepData(actor: Actor): Promise<TurnPrepData> {
    const turnPrepData = await TurnPrepStorage.load(actor);

    if (!Array.isArray(turnPrepData.turnPlans)) {
      turnPrepData.turnPlans = [];
    }

    if (turnPrepData.turnPlans.length === 0) {
      const planLabel = FoundryAdapter.localize('TURN_PREP.TurnPlans.PlanLabel') || 'Turn Plan';
      const defaultPlan = createTurnPlan(`${planLabel} 1`, '');
      turnPrepData.turnPlans.push(defaultPlan);
      turnPrepData.activePlanIndex = 0;
    }

    if (!Array.isArray(turnPrepData.reactions)) {
      turnPrepData.reactions = [];
    }

    turnPrepData.turnPlans = turnPrepData.turnPlans.map((plan) => ({
      ...plan,
      actions: Array.isArray(plan.actions) ? plan.actions : [],
      bonusActions: Array.isArray(plan.bonusActions) ? plan.bonusActions : [],
      reactions: Array.isArray(plan.reactions) ? plan.reactions : [],
      additionalFeatures: Array.isArray(plan.additionalFeatures) ? plan.additionalFeatures : [],
    }));

    return turnPrepData;
  }

  /**
   * Register context menu for Turn Prep panel items
   */
  private static registerTurnPrepContextMenu(): void {
    // This would be handled by the Svelte components
    // Placeholder for future sheet integration
    debug('Turn Prep context menu registration placeholder');
  }

  /**
   * Register drag & drop handlers for field movement
   */
  private static registerDragDropHandlers(): void {
    // This would be handled by the Svelte components with drag event handlers
    // Placeholder for future UI implementation
    debug('Drag & drop handlers registration placeholder');
  }

  /**
   * Get all activities for a specific activation type from an item
   */
  static getActivitiesForActivationType(item: Item, type: string): any[] {
    const activities = FeatureSelector.getActivitiesForItem(item);
    return activities.filter((activity) => activity.activation?.type === type);
  }

  /**
   * Get icon for an activation type
   */
  static getIconForActivationType(type: string): string {
    return ACTIVATION_ICONS[type] || 'fa-star';
  }

  /**
   * Get label for an activation type
   */
  static getLabelForActivationType(type: string): string {
    return ACTIVATION_LABELS[type] || type.charAt(0).toUpperCase() + type.slice(1);
  }
}
