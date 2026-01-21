/**
 * Tidy 5E Sheet Integration
 * 
 * Registers Turn Prep tabs with the Tidy 5E sheet system.
 * Creates and manages the main Turn Prep tab and sidebar Turns tab.
 * 
 * NOTE: The hook registration happens at module load time (see bottom of file),
 * NOT when this function is called. This ensures proper timing with Tidy5e.
 */

import { MODULE_ID, TAB_ID_MAIN, TAB_ID_SIDEBAR_TURNS } from '../../constants';
import { info, error } from '../../utils/logging';
import { createMainTabHtml, createSidebarTabHtml } from './TidyHtmlTabs';

/**
 * Register Tidy5e sheet integration hooks
 * MUST be called at module initialization time, not from ready hook
 * 
 * NOTE: We don't check if Tidy5e is active here because `game` doesn't exist yet.
 * The hook will only fire if Tidy5e is actually loaded and active.
 */
export function registerTidy5eHooks(): void {
  // Register hook listener for Tidy5e readiness
  // The hook will only fire if Tidy5e is loaded and active
  // We use 'on' instead of 'once' to handle potential multiple fires
  Hooks.on('tidy5e-sheet.ready', (api: any) => {
    try {
      registerTidyTabs(api);
      setupTabHooks(api);
      info('Tidy5e tabs registered successfully');
    } catch (err) {
      error(`Failed to register Tidy5e tabs`, err as Error);
    }
  });
  
  info('Tidy5e hook listener registered - waiting for tidy5e-sheet.ready');
}

/**
 * Legacy function for backwards compatibility with ready.ts
 * Calls the actual hook registration
 */
export async function initializeTidy5eSheets(): Promise<void> {
  registerTidy5eHooks();
}

/**
 * Register tabs with Tidy5e API
 */
function registerTidyTabs(api: any) {
  try {
    // Register main Turn Prep tab using HtmlTab
    api.registerCharacterTab(
      new api.models.HtmlTab({
        title: 'Turn Prep',
        tabId: TAB_ID_MAIN,
        html: createMainTabHtml(),
        enabled: (data: any) => true
      })
    );
    info(`✓ Registered main Turn Prep tab (ID: ${TAB_ID_MAIN})`);
  } catch (err) {
    error(`Failed to register main Turn Prep tab`, err as Error);
  }

  try {
    // Register sidebar Turns tab using HtmlTab
    api.registerCharacterSidebarTab(
      new api.models.HtmlTab({
        title: 'Turns',
        tabId: TAB_ID_SIDEBAR_TURNS,
        iconClass: 'fa-solid fa-hourglass',
        html: createSidebarTabHtml(),
        enabled: (data: any) => true
      })
    );
    info(`✓ Registered sidebar Turns tab (ID: ${TAB_ID_SIDEBAR_TURNS})`);
  } catch (err) {
    error(`Failed to register sidebar Turns tab`, err as Error);
  }
}

/**
 * Set up hooks for tab interactions
 */
function setupTabHooks(api: any) {
  // When Turn Prep tab is activated, show sidebar and switch to Turns tab
  api.hooks?.on?.('tidy5e-sheet.tabActivated', (data: any) => {
    if (data.tabId === TAB_ID_MAIN) {
      // Show sidebar
      if (data.sheet?.toggleSidebar) {
        data.sheet.toggleSidebar(true);
      }
      // Switch to Turns sidebar tab
      if (data.sheet?.activateSidebarTab) {
        data.sheet.activateSidebarTab(TAB_ID_SIDEBAR_TURNS);
      }
    }
  });
}
