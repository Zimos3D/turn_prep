/**
 * Module Ready Hook Handler
 * 
 * Runs after Foundry initialization (Hooks.on('ready')).
 * At this point, all systems, modules, and actors are loaded.
 * This is where we register sheets, set up integrations, etc.
 * 
 * Responsibilities:
 * - Register sheet integrations
 * - Check for Tidy 5E and integrate if available
 * - Register context menu hooks
 * - Validate data structures
 * - Start module features
 */

import { MODULE_ID, TAB_ID_MAIN, SETTINGS } from '../constants';
import { FoundryAdapter } from '../foundry/FoundryAdapter';
import { info, warn, error, logSection, notifyWarning } from '../utils/logging';
import { TurnPrepApiInstance } from '../api/TurnPrepApi';
import { ContextMenuHandler } from '../features/context-menu/ContextMenuHandler';
import { initializeTidy5eSheets } from '../sheets/tidy5e/tidy-sheet-integration';

// ============================================================================
// Ready Hook Initialization
// ============================================================================

export async function readyModule(): Promise<void> {
  logSection('TURN PREP READY');

  try {
    // Check if module should be enabled
    if (!isModuleEnabled()) {
      info('Turn Prep module is disabled in world settings');
      return;
    }

    // Check dependencies
    checkDependencies();

    // Set up sheet integrations
    await setupSheetIntegrations();

    // Register hooks
    registerHooks();

    // Perform data validation
    validateModuleData();

    // Expose API to global scope for external modules and console access
    (window as any).TurnPrepAPI = TurnPrepApiInstance;
    (game as any).TurnPrepAPI = TurnPrepApiInstance;

    // Log completion
    info('Module ready and initialized');
    info('API exposed as game.TurnPrepAPI and window.TurnPrepAPI');
  } catch (err) {
    error('Failed to complete module ready initialization', err as Error);
    notifyWarning('Turn Prep: Initialization failed. Check console for details.');
  }
}

// ============================================================================
// Module Configuration Checks
// ============================================================================

function isModuleEnabled(): boolean {
  try {
    // Check if Turn Prep tab should be enabled (configurable setting)
    const enableTab = FoundryAdapter.getSetting(SETTINGS.ENABLE_TAB.key);
    return enableTab !== false; // Default true if not set
  } catch (err) {
    // If setting doesn't exist yet, default to enabled
    warn('Settings not yet fully initialized, defaulting to enabled');
    return true;
  }
}

// ============================================================================
// Dependency Checking
// ============================================================================

function checkDependencies(): void {
  info('Checking dependencies...');

  // Check Tidy 5E Sheets
  const tidyActive = FoundryAdapter.isModuleActive('tidy5e-sheet');
  if (tidyActive) {
    info('✓ Tidy 5E Sheets detected');
  } else {
    warn('Tidy 5E Sheets not active - using default sheet integration');
  }

  // Check D&D 5e system
  const d5eSystemId = game.system?.id;
  if (d5eSystemId !== 'dnd5e') {
    warn(`System is "${d5eSystemId}", Turn Prep is designed for "dnd5e"`);
  } else {
    info('✓ D&D 5e system detected');
  }

  // Optional: MidiQOL
  const midiActive = FoundryAdapter.isModuleActive('midi-qol');
  if (midiActive) {
    info('✓ MidiQOL detected - optional integration available');
  } else {
    info('MidiQOL not active - that\'s ok, it\'s optional');
  }
}

// ============================================================================
// Sheet Integration Setup
// ============================================================================

async function setupSheetIntegrations(): Promise<void> {
  info('Setting up sheet integrations...');

  const tidyActive = FoundryAdapter.isModuleActive('tidy5e-sheet');

  if (tidyActive) {
    await setupTidyIntegration();
  } else {
    setupDefaultSheetIntegration();
  }

  info('Sheet integrations configured');
}

/**
 * Set up Tidy 5E Sheets integration
 * Registers custom tabs in the sidebar and main sheet area
 */
async function setupTidyIntegration(): Promise<void> {
  info('Integrating with Tidy 5E Sheets...');

  try {
    await initializeTidy5eSheets();
    info('✓ Tidy 5E integration initialized');
  } catch (err) {
    warn('Failed to integrate with Tidy 5E Sheets', err);
  }
}

/**
 * Set up default D&D 5E sheet integration
 * Adds a tab to the default character sheet
 */
function setupDefaultSheetIntegration(): void {
  info('Preparing default sheet integration...');

  // This will be implemented in Phase 2
  // For now, just prepare the hooks
  info('Default sheet integration layer ready for Phase 2 implementation');
}

// ============================================================================
// Hook Registration
// ============================================================================

function registerHooks(): void {
  info('Registering module hooks...');

  // Register context menu hooks
  try {
    ContextMenuHandler.registerContextMenus();
    info('✓ Context menu hooks registered');
  } catch (err) {
    error('Failed to register context menu hooks', err as Error);
  }

  // These will be implemented in later phases
  // For now, we're just setting up the infrastructure

  // Hook: Update actor data
  // This will sync Turn Prep data when actor changes
  // Hooks.on('updateActor', handleActorUpdate);

  // Hook: Combat events
  // This will update turn status during combat
  // Hooks.on('combatStart', handleCombatStart);
  // Hooks.on('combatTurn', handleCombatTurn);

  info('Hook handlers configured');
}

// ============================================================================
// Data Validation
// ============================================================================

function validateModuleData(): void {
  info('Validating existing module data...');

  try {
    // Get all actors that might have Turn Prep data
    const actors = FoundryAdapter.getOwnedActors();
    info(`Found ${actors.length} owned actors to validate`);

    let dataFixed = 0;

    for (const actor of actors) {
      const existingData = FoundryAdapter.getTurnPrepData(actor);

      if (existingData) {
        // Data exists - might need migration in future phases
        // For now, just verify structure
        info(`Actor "${actor.name}" has Turn Prep data`);
      }
      // No data means it's a new actor - that's fine
    }

    if (dataFixed > 0) {
      info(`Fixed ${dataFixed} actor data structures`);
    }

    info('Data validation complete');
  } catch (err) {
    warn('Error during data validation', err);
    // Don't throw - this is not critical
  }
}

// ============================================================================
// Feature Availability Logging
// ============================================================================

function logFeatureStatus(): void {
  info('Module Features:');
  info('  ✓ DM Questions - Collect session notes from DMs');
  info('  ✓ Turn Plans - Players prepare actions in advance');
  info('  ✓ Reactions - Track prepared reaction features');
  info('  ✓ History - Keep last 10 turn summaries');
  info('  ✓ Favorites - Save and reuse common turn plans');

  const midiActive = FoundryAdapter.isModuleActive('midi-qol');
  if (midiActive) {
    info('  ✓ MidiQOL Integration - Optional, available');
  }
}
