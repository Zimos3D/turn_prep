/**
 * Module Initialization Hook Handler
 * 
 * Runs during Foundry initialization (Hooks.on('init')).
 * This is early in the Foundry lifecycle, before UI is fully ready.
 * 
 * Responsibilities:
 * - Register all module settings
 * - Set up error handling classes
 * - Initialize logging system
 * - Validate environment
 */

import { MODULE_ID, SETTINGS, LOG_PREFIX, CUSTOM_HOOKS } from '../constants';
import { FoundryAdapter } from '../foundry/FoundryAdapter';
import { info, warn, error, logSection, setDebugMode } from '../utils/logging';
import { TurnPrepApi } from '../api/TurnPrepApi';
import { TurnPrepStorage } from '../features/data/TurnPrepStorage';
import { FeatureSelector } from '../features/feature-selection/FeatureSelector';
import { FeatureFilter } from '../features/feature-selection/FeatureFilter';
import { createDMQuestion, createTurnPlan, createEmptyTurnPrepData, createTurnSnapshot, snapshotFeature, generateId } from '../utils/data';
import { validateAndCorrectTurnPrepData } from '../features/data/TurnPrepData';

// ============================================================================
// Initialization
// ============================================================================

export async function initializeModule(): Promise<void> {
  logSection('TURN PREP INITIALIZATION');

  try {
    // Validate environment
    validateEnvironment();

    // Set up debug mode (can be enabled via window.TURN_PREP_DEBUG)
    if ((globalThis as any).TURN_PREP_DEBUG) {
      setDebugMode(true);
      info('Debug mode enabled');
    }

    // Register all module settings
    registerModuleSettings();

    // Initialize error handling
    setupErrorHandling();

    // Create and expose public API
    setupPublicAPI();

    info('Module initialization complete');
  } catch (err) {
    error('Failed to initialize module', err as Error);
    throw err;
  }
}

// ============================================================================
// Environment Validation
// ============================================================================

function validateEnvironment(): void {
  info('Checking environment...');

  // Check Foundry version
  const { foundryOk, systemOk, message } = FoundryAdapter.checkVersionCompatibility();

  info(message);

  if (!foundryOk || !systemOk) {
    const warnings = [];
    if (!foundryOk) {
      warnings.push('Foundry version V13+ is required');
    }
    if (!systemOk) {
      warnings.push('D&D 5e system v5.0+ is required');
    }

    const fullMessage = `${LOG_PREFIX} Warning: ${warnings.join(', ')}`;
    warn(fullMessage);
  }
}

// ============================================================================
// Settings Registration
// ============================================================================

function registerModuleSettings(): void {
  info('Registering module settings...');

  // History limit setting
  FoundryAdapter.registerSetting(SETTINGS.HISTORY_LIMIT.key, {
    name: 'TurnPrep.Settings.HistoryLimit',
    hint: 'TurnPrep.Settings.HistoryLimitHint',
    scope: SETTINGS.HISTORY_LIMIT.scope,
    config: true,
    type: Number,
    default: SETTINGS.HISTORY_LIMIT.default,
    range: SETTINGS.HISTORY_LIMIT.range,
    onChange: (value) => {
      info(`History limit changed to: ${value}`);
    },
  });

  // DM visibility setting
  FoundryAdapter.registerSetting(SETTINGS.ALLOW_DM_VIEW.key, {
    name: 'TurnPrep.Settings.AllowDmView',
    hint: 'TurnPrep.Settings.AllowDmViewHint',
    scope: SETTINGS.ALLOW_DM_VIEW.scope,
    config: true,
    type: Boolean,
    default: SETTINGS.ALLOW_DM_VIEW.default,
    onChange: (value) => {
      info(`DM view setting changed to: ${value}`);
    },
  });

  // Enable Turn Prep tab setting
  FoundryAdapter.registerSetting(SETTINGS.ENABLE_TAB.key, {
    name: 'TurnPrep.Settings.EnableTab',
    hint: 'TurnPrep.Settings.EnableTabHint',
    scope: SETTINGS.ENABLE_TAB.scope,
    config: true,
    type: Boolean,
    default: SETTINGS.ENABLE_TAB.default,
    onChange: (value) => {
      info(`Turn Prep tab setting changed to: ${value}`);
      // Could trigger UI refresh here
    },
  });

  // Phase 3 Settings: Edit History Checkpoints
  FoundryAdapter.registerSetting('editHistoryCheckpoints', {
    name: 'TurnPrep.Settings.EditHistoryCheckpoints',
    hint: 'TurnPrep.Settings.EditHistoryCheckpointsHint',
    scope: 'world',
    config: true,
    type: Number,
    default: 5,
    range: {
      min: 1,
      max: 20,
      step: 1,
    },
    onChange: (value) => {
      info(`Edit history checkpoint limit changed to: ${value}`);
    },
  });

  // Phase 3 Settings: Allow Player Edit History
  FoundryAdapter.registerSetting('allowPlayerEditHistory', {
    name: 'TurnPrep.Settings.AllowPlayerEditHistory',
    hint: 'TurnPrep.Settings.AllowPlayerEditHistoryHint',
    scope: 'world',
    config: true,
    type: Boolean,
    default: true,
    onChange: (value) => {
      info(`Player edit history setting changed to: ${value}`);
    },
  });

  info('Settings registered');

}

// ============================================================================
// Error Handling Setup
// ============================================================================

/**
 * Custom error class for Turn Prep module errors
 */
export class TurnPrepError extends Error {
  constructor(
    message: string,
    public readonly operation: string = 'unknown',
    public readonly context?: any
  ) {
    super(`${operation}: ${message}`);
    this.name = 'TurnPrepError';
  }
}

/**
 * Custom error class for data validation errors
 */
export class DataValidationError extends TurnPrepError {
  constructor(message: string, context?: any) {
    super(message, 'DataValidation', context);
    this.name = 'DataValidationError';
  }
}

/**
 * Custom error class for Foundry API errors
 */
export class FoundryError extends TurnPrepError {
  constructor(message: string, operation: string = 'FoundryAPI', context?: any) {
    super(message, operation, context);
    this.name = 'FoundryError';
  }
}

function setupErrorHandling(): void {
  info('Setting up error handling...');

  // Make error classes globally available for debugging
  (globalThis as any).TurnPrepError = TurnPrepError;
  (globalThis as any).DataValidationError = DataValidationError;
  (globalThis as any).FoundryError = FoundryError;

  // Set up global error handler for unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.name?.includes('TurnPrep')) {
      error('Unhandled Turn Prep error', event.reason);
      event.preventDefault();
    }
  });

  info('Error handling initialized');
}

// ============================================================================
// Public API Setup
// ============================================================================

function setupPublicAPI(): void {
  info('Setting up public API...');

  // Create the public API instance
  const api = new TurnPrepApi();

  // Expose on module object
  const module = FoundryAdapter.getModule(MODULE_ID);
  if (module) {
    (module as any).api = api;
  }

  // Also expose on globalThis for console access
  (globalThis as any).TurnPrepAPI = api;

  // Expose Phase 2 utilities directly for testing in console
  // This allows: TurnPrepStorage.load(actor), FeatureSelector.getAllSelectableFeatures(actor), etc.
  (globalThis as any).TurnPrepStorage = TurnPrepStorage;
  (globalThis as any).FeatureSelector = FeatureSelector;
  (globalThis as any).FeatureFilter = FeatureFilter;
  
  // Also expose commonly used data utilities
  (globalThis as any).createDMQuestion = createDMQuestion;
  (globalThis as any).createTurnPlan = createTurnPlan;
  (globalThis as any).createEmptyTurnPrepData = createEmptyTurnPrepData;
  (globalThis as any).createTurnSnapshot = createTurnSnapshot;
  (globalThis as any).snapshotFeature = snapshotFeature;
  (globalThis as any).validateAndCorrectTurnPrepData = validateAndCorrectTurnPrepData;
  (globalThis as any).generateId = generateId;

  info('Public API initialized and available as window.TurnPrepAPI');
  info('Phase 2 utilities available: TurnPrepStorage, FeatureSelector, FeatureFilter');
}

// ============================================================================
// Logging & Info
// ============================================================================

/**
 * Log module version and info
 */
function logModuleInfo(): void {
  const module = FoundryAdapter.getModule(MODULE_ID);
  if (module) {
    info(`Module version: ${(module as any).version || 'unknown'}`);
  }

  // Log environment info
  const { foundryOk, systemOk } = FoundryAdapter.checkVersionCompatibility();
  if (foundryOk && systemOk) {
    info(`Environment: Foundry ${game.version}, ${game.system?.id} ${game.system?.version}`);
  }
}
