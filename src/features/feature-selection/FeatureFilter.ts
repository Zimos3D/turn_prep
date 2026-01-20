/**
 * Feature Filter
 * 
 * Provides filtering, grouping, and sorting utilities for features.
 * Works in conjunction with FeatureSelector to organize features
 * for UI display and user selection.
 */

import { debug } from '../../utils/logging';
import type { SelectedFeature } from '../../types';

/**
 * Feature Filter - Utilities for organizing features
 */
export class FeatureFilter {
  /**
   * Filter features by activation type (action, bonus action, reaction)
   * 
   * @param features - Array of features to filter
   * @param activationType - The activation type to match
   * @returns Filtered array of features
   */
  static filterByActionType(features: SelectedFeature[], activationType: string): SelectedFeature[] {
    debug(
      `FeatureFilter.filterByActionType(): Filtering ${features.length} features by ${activationType}`
    );

    return features.filter((feature) => feature.actionType === activationType);
  }

  /**
   * Filter features by item type (spell, weapon, feat, etc.)
   * 
   * @param features - Array of features to filter
   * @param itemType - The item type to match
   * @returns Filtered array of features
   */
  static filterByItemType(features: SelectedFeature[], itemType: string): SelectedFeature[] {
    debug(`FeatureFilter.filterByItemType(): Filtering ${features.length} features by ${itemType}`);

    return features.filter((feature) => feature.itemType === itemType);
  }

  /**
   * Filter features by search text
   * Performs fuzzy matching on item name
   * 
   * @param features - Array of features to filter
   * @param searchText - Text to search for
   * @returns Filtered array of matching features
   */
  static filterBySearch(features: SelectedFeature[], searchText: string): SelectedFeature[] {
    if (!searchText || searchText.trim().length === 0) {
      return features;
    }

    const search = searchText.toLowerCase().trim();
    debug(`FeatureFilter.filterBySearch(): Searching ${features.length} features for "${search}"`);

    return features.filter((feature) => {
      return feature.itemName.toLowerCase().includes(search);
    });
  }

  /**
   * Group features by activation type
   * Returns object with keys: 'action', 'bonus', 'reaction', etc.
   * 
   * @param features - Array of features to group
   * @returns Object with features grouped by activation type
   */
  static groupByActionType(
    features: SelectedFeature[]
  ): Record<string, SelectedFeature[]> {
    debug(`FeatureFilter.groupByActionType(): Grouping ${features.length} features by action type`);

    const grouped: Record<string, SelectedFeature[]> = {};

    for (const feature of features) {
      if (!grouped[feature.actionType]) {
        grouped[feature.actionType] = [];
      }
      grouped[feature.actionType].push(feature);
    }

    return grouped;
  }

  /**
   * Group features by item type
   * Returns object with keys: 'spell', 'weapon', 'feat', etc.
   * 
   * @param features - Array of features to group
   * @returns Object with features grouped by item type
   */
  static groupByItemType(
    features: SelectedFeature[]
  ): Record<string, SelectedFeature[]> {
    debug(`FeatureFilter.groupByItemType(): Grouping ${features.length} features by item type`);

    const grouped: Record<string, SelectedFeature[]> = {};

    for (const feature of features) {
      if (!grouped[feature.itemType]) {
        grouped[feature.itemType] = [];
      }
      grouped[feature.itemType].push(feature);
    }

    return grouped;
  }

  /**
   * Sort features alphabetically by name
   * Modifies the original array
   * 
   * @param features - Array of features to sort
   * @returns Sorted array
   */
  static sortByName(features: SelectedFeature[]): SelectedFeature[] {
    debug(`FeatureFilter.sortByName(): Sorting ${features.length} features`);

    return [...features].sort((a, b) => {
      return a.itemName.localeCompare(b.itemName);
    });
  }

  /**
   * Deduplicate features by item ID
   * Keeps first occurrence of each unique ID
   * 
   * @param features - Array of features to deduplicate
   * @returns Deduplicated array
   */
  static deduplicate(features: SelectedFeature[]): SelectedFeature[] {
    debug(`FeatureFilter.deduplicate(): Deduplicating ${features.length} features`);

    const seen = new Set<string>();
    const unique: SelectedFeature[] = [];

    for (const feature of features) {
      if (!seen.has(feature.itemId)) {
        seen.add(feature.itemId);
        unique.push(feature);
      }
    }

    return unique;
  }

  /**
   * Limit array to specified number of items
   * Useful for pagination or limiting results
   * 
   * @param features - Array of features to limit
   * @param limit - Maximum number of items to return
   * @returns Limited array
   */
  static limit(features: SelectedFeature[], limit: number): SelectedFeature[] {
    if (limit <= 0) {
      return [];
    }
    return features.slice(0, limit);
  }

  /**
   * Build organized feature list for UI display
   * Groups by activation type, sorts alphabetically within groups
   * 
   * @param features - Array of features to organize
   * @returns Object with organized features ready for display
   */
  static organizeForDisplay(
    features: SelectedFeature[]
  ): Record<string, SelectedFeature[]> {
    debug(`FeatureFilter.organizeForDisplay(): Organizing ${features.length} features for display`);

    const grouped = this.groupByActionType(features);

    // Sort each group alphabetically
    for (const actionType in grouped) {
      grouped[actionType] = this.sortByName(grouped[actionType]);
    }

    return grouped;
  }

  /**
   * Search features with multiple filters applied
   * Filters by search text, activation type, and item type
   * 
   * @param features - Array of features to search
   * @param searchText - Text to search for (optional)
   * @param activationType - Activation type filter (optional)
   * @param itemType - Item type filter (optional)
   * @returns Filtered and sorted array
   */
  static search(
    features: SelectedFeature[],
    searchText?: string,
    activationType?: string,
    itemType?: string
  ): SelectedFeature[] {
    let results = features;

    // Apply search filter
    if (searchText) {
      results = this.filterBySearch(results, searchText);
    }

    // Apply activation type filter
    if (activationType) {
      results = this.filterByActionType(results, activationType);
    }

    // Apply item type filter
    if (itemType) {
      results = this.filterByItemType(results, itemType);
    }

    // Sort by name and return
    return this.sortByName(results);
  }
}
