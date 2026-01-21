/**
 * Turn Prep Module - Main Entry Point
 * 
 * This is the first file Foundry loads (specified in module.json esmodules array).
 * Orchestrates all module initialization through Foundry's hook system.
 * 
 * Lifecycle:
 * 1. Module loads → Register hooks at TOP LEVEL (like Tidy5e integration)
 * 2. Foundry fires 'init' hook → initializeModule()
 * 3. Foundry fires 'ready' hook → readyModule()
 * 4. Module fully initialized and ready to use
 */

import { MODULE_ID } from './constants';
import { initializeModule } from './hooks/init';
import { readyModule } from './hooks/ready';
import { info, error } from './utils/logging';
import { registerTidy5eHooks } from './sheets/tidy5e/tidy-sheet-integration';
import '../styles/turn-prep.less';

// ============================================================================
// Top-Level Hook Registration (must happen at module load time)
// ============================================================================

// Register Tidy5e sheet integration hooks FIRST
// This must happen at module load time, before ready hook fires
registerTidy5eHooks();

// ============================================================================
// Module Hook Registration
// ============================================================================

// Register the initialization hook
// Runs early in Foundry's lifecycle, before UI is fully set up
Hooks.on('init', async () => {
  try {
    await initializeModule();
  } catch (err) {
    error('Module initialization failed', err as Error);
    console.error(`${MODULE_ID}: Initialization error`, err);
  }
});

// Register the ready hook
// Runs after all Foundry systems and modules are loaded
Hooks.on('ready', async () => {
  try {
    await readyModule();
  } catch (err) {
    error('Module ready setup failed', err as Error);
    console.error(`${MODULE_ID}: Ready error`, err);
  }
});

// ============================================================================
// Log Module Load
// ============================================================================

info(`${MODULE_ID} module loaded. Awaiting Foundry initialization...`);
