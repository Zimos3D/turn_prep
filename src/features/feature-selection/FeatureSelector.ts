/**
 * Feature Selector
 * 
 * Queries and retrieves the character's items, spells, and features
 * by examining their activities. Each activity has an activation cost
 * that determines if it can be used as an action, bonus action, reaction, etc.
 * 
 * Provides methods to get features by type, activation cost, etc.
 * Validates feature availability (equipped, prepared, has uses, etc.)
 */

import { debug, info, warn } from '../../utils/logging';
import type { SelectedFeature } from '../../types';

// D&D 5e item types that can have activation costs
export const QUERYABLE_ITEM_TYPES = [
  'weapon',
  'spell',
  'feat',
  'classFeature',
  'item', // Generic items
];

// Activation cost types from D&D 5e activities
export const ACTIVATION_TYPES = {
  ACTION: 'action',
  BONUS_ACTION: 'bonus',
  REACTION: 'reaction',
  LEGENDARY: 'legendary',
  SPECIAL: 'special',
};

/**
 * Feature Selector - Main class for querying features
 * Works with D&D 5e activities which define activation costs
 */
export class FeatureSelector {
  /**
   * Get all selectable features for an actor
   * Includes spells, weapons, feats, class features, and items
   * Filters based on activity availability and item status
   * 
   * @param actor - The actor to query
   * @returns Array of selectable features
   */
  static getAllSelectableFeatures(actor: any): SelectedFeature[] {
    try {
      if (!actor) {
        warn('FeatureSelector.getAllSelectableFeatures(): Actor is undefined');
        return [];
      }

      debug(`FeatureSelector.getAllSelectableFeatures(): Querying features for ${actor.name}`);

      const features: SelectedFeature[] = [];

      // Query all items on the actor
      if (actor.items) {
        const items = Array.from(actor.items);
        
        for (const item of items) {
          if (!this.isQueryableItem(item)) {
            continue;
          }

          // Check each activity on the item
          if (item.system?.activities) {
            const activities = Array.from(item.system.activities);
            
            for (const activity of activities) {
              if (this.canUseActivity(actor, item, activity)) {
                const feature = this.formatFeatureForDisplay(item, activity);
                if (feature) {
                  features.push(feature);
                }
              }
            }
          }
        }
      }

      debug(
        `FeatureSelector.getAllSelectableFeatures(): Found ${features.length} features for ${actor.name}`
      );
      return features;
    } catch (err) {
      warn(`FeatureSelector.getAllSelectableFeatures(): Error querying features`, err as Error);
      return [];
    }
  }

  /**
   * Get all available features for an actor (for additional features field)
   * Includes ALL spells, weapons, feats, class features, and items
   * Does NOT filter by activation cost - includes everything
   * 
   * @param actor - The actor to query
   * @returns Array of all available features
   */
  static getAllAvailableFeatures(actor: any): SelectedFeature[] {
    try {
      if (!actor) {
        warn('FeatureSelector.getAllAvailableFeatures(): Actor is undefined');
        return [];
      }

      debug(`FeatureSelector.getAllAvailableFeatures(): Querying all features for ${actor.name}`);

      const features: SelectedFeature[] = [];

      // Query all items on the actor
      if (actor.items) {
        const items = Array.from(actor.items);
        
        for (const item of items) {
          if (!this.isQueryableItem(item)) {
            continue;
          }

          // For this method, include items even if they don't have activities
          // But prefer to show activities if they exist
          if (item.system?.activities) {
            const activities = Array.from(item.system.activities);
            
            for (const activity of activities) {
              const feature = this.formatFeatureForDisplay(item, activity);
              if (feature) {
                features.push(feature);
              }
            }
          } else {
            // No activities on this item, still include it with a default action type
            const feature: SelectedFeature = {
              itemId: item.id,
              itemName: item.name,
              itemType: item.type,
              actionType: 'other', // Mark as "other" since no activation defined
            };
            features.push(feature);
          }
        }
      }

      debug(
        `FeatureSelector.getAllAvailableFeatures(): Found ${features.length} features for ${actor.name}`
      );
      return features;
    } catch (err) {
      warn(`FeatureSelector.getAllAvailableFeatures(): Error querying features`, err as Error);
      return [];
    }
  }

  /**
   * Get features by activation type (action, bonus action, reaction)
   * 
   * @param actor - The actor to query
   * @param activationType - The activation type to filter by
   * @returns Array of features with the specified activation type
   */
  static getFeaturesByActivationType(actor: any, activationType: string): SelectedFeature[] {
    try {
      const allFeatures = this.getAllSelectableFeatures(actor);

      const filtered = allFeatures.filter((feature) => {
        return feature.actionType === activationType;
      });

      debug(
        `FeatureSelector.getFeaturesByActivationType(): Found ${filtered.length} ${activationType} features for ${actor.name}`
      );
      return filtered;
    } catch (err) {
      warn(
        `FeatureSelector.getFeaturesByActivationType(): Error filtering by activation type`,
        err as Error
      );
      return [];
    }
  }

  /**
   * Get features by item type (spell, weapon, feat, etc.)
   * 
   * @param actor - The actor to query
   * @param itemType - The item type to filter by
   * @returns Array of features of the specified type
   */
  static getFeaturesByItemType(actor: any, itemType: string): SelectedFeature[] {
    try {
      const allFeatures = this.getAllSelectableFeatures(actor);

      const filtered = allFeatures.filter((feature) => {
        return feature.itemType === itemType;
      });

      debug(
        `FeatureSelector.getFeaturesByItemType(): Found ${filtered.length} ${itemType} features for ${actor.name}`
      );
      return filtered;
    } catch (err) {
      warn(
        `FeatureSelector.getFeaturesByItemType(): Error filtering by item type`,
        err as Error
      );
      return [];
    }
  }

  /**
   * Get features that can be used as actions
   * 
   * @param actor - The actor to query
   * @returns Array of action features
   */
  static getActionFeatures(actor: any): SelectedFeature[] {
    return this.getFeaturesByActivationType(actor, ACTIVATION_TYPES.ACTION);
  }

  /**
   * Get features that can be used as bonus actions
   * 
   * @param actor - The actor to query
   * @returns Array of bonus action features
   */
  static getBonusActionFeatures(actor: any): SelectedFeature[] {
    return this.getFeaturesByActivationType(actor, ACTIVATION_TYPES.BONUS_ACTION);
  }

  /**
   * Get features that can be used as reactions
   * 
   * @param actor - The actor to query
   * @returns Array of reaction features
   */
  static getReactionFeatures(actor: any): SelectedFeature[] {
    return this.getFeaturesByActivationType(actor, ACTIVATION_TYPES.REACTION);
  }

  /**
   * Check if an item type is queryable
   * 
   * @param item - The item to check
   * @returns True if item type should be queried
   */
  static isQueryableItem(item: any): boolean {
    if (!item) {
      return false;
    }

    // Check if item type is queryable
    if (!QUERYABLE_ITEM_TYPES.includes(item.type)) {
      return false;
    }

    // Filter out unequipped weapons
    if (item.type === 'weapon' && item.system?.equipped === false) {
      return false;
    }

    // Filter out unprepared spells
    if (item.type === 'spell') {
      const prepared = item.system?.prepared;
      if (prepared === false) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if an activity can be used
   * Validates that activity exists and is usable
   * 
   * @param actor - The actor who would use the activity
   * @param item - The parent item
   * @param activity - The activity to check
   * @returns True if the activity can be used
   */
  static canUseActivity(actor: any, item: any, activity: any): boolean {
    if (!activity) {
      return false;
    }

    // Check if activity has an activation type defined
    if (!activity.activation?.type) {
      return false;
    }

    // Check if activity has uses and they're depleted
    const uses = activity.uses;
    if (uses && typeof uses.max === 'number' && typeof uses.value === 'number') {
      // Only filter out if max > 0 and current is 0
      if (uses.max > 0 && uses.value <= 0) {
        return false;
      }
    }

    return true;
  }

  /**
   * Format an item + activity for display as a SelectedFeature
   * Extracts relevant info and handles missing data gracefully
   * 
   * @param item - The parent item
   * @param activity - The activity to format
   * @returns SelectedFeature or null if invalid
   */
  static formatFeatureForDisplay(item: any, activity: any): SelectedFeature | null {
    try {
      if (!item || !item.id || !item.name) {
        return null;
      }

      if (!activity || !activity.activation?.type) {
        return null;
      }

      const actionType = activity.activation.type.toLowerCase();

      return {
        itemId: item.id,
        itemName: item.name,
        itemType: item.type,
        actionType: actionType,
      };
    } catch (err) {
      warn(`FeatureSelector.formatFeatureForDisplay(): Error formatting feature`, err as Error);
      return null;
    }
  }

  /**
   * Get metadata for a feature
   * Useful for displaying tooltips or additional info
   * 
   * @param item - The item to get metadata for
   * @param activity - The activity (optional)
   * @returns Object with feature metadata
   */
  static getFeatureMetadata(item: any, activity?: any): Record<string, any> {
    if (!item) {
      return {};
    }

    const activation = activity?.activation || item.system?.activation || {};
    const uses = activity?.uses || item.system?.uses || {};
    const range = activity?.range || item.system?.range || {};

    return {
      name: item.name,
      type: item.type,
      activation: {
        type: activation.type,
        value: activation.value,
      },
      uses: {
        current: uses.value,
        max: uses.max,
      },
      range: {
        value: range.value,
        units: range.units,
      },
      equipped: item.system?.equipped,
      prepared: item.system?.prepared,
    };
  }

  /**
   * Get all activities from an item
   * Used by context menu to determine if activity selection dialog is needed
   * 
   * @param item - The item to get activities from
   * @returns Array of activities for the item
   */
  static getActivitiesForItem(item: any): any[] {
    if (!item || !item.system?.activities) {
      return [];
    }

    try {
      return Array.from(item.system.activities);
    } catch (err) {
      warn(`FeatureSelector.getActivitiesForItem(): Error getting activities`, err as Error);
      return [];
    }
  }

  /**
   * Normalize activation type to standard values
   * Handles D&D 5e system variations
   * 
   * @param activationType - The raw activation type from activity data
   * @returns Normalized activation type
   */
  static getActivationType(activationType: string | undefined): string {
    if (!activationType) {
      return ACTIVATION_TYPES.ACTION; // Default to action
    }

    const normalized = activationType.toLowerCase().trim();

    // Handle various naming conventions
    if (normalized.includes('bonus')) {
      return ACTIVATION_TYPES.BONUS_ACTION;
    }
    if (normalized.includes('reaction')) {
      return ACTIVATION_TYPES.REACTION;
    }
    if (normalized.includes('legendary')) {
      return ACTIVATION_TYPES.LEGENDARY;
    }
    if (normalized === 'special') {
      return ACTIVATION_TYPES.SPECIAL;
    }
    if (normalized === 'other') {
      return 'other';
    }

    // Default to action for 'action' or unknown types
    return ACTIVATION_TYPES.ACTION;
  }
}
