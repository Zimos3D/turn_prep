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

/**
 * Register Tidy5e sheet integration hooks
 * MUST be called at module initialization time, not from ready hook
 */
export function registerTidy5eHooks(): void {
  // Check if Tidy5e sheet is active
  const tidy5eModule = game.modules.get('tidy5e-sheet');
  if (!tidy5eModule?.active) {
    info('Tidy5e Sheet not active - Turn Prep tabs will not be registered');
    return;
  }

  // Register hook listener for Tidy5e readiness
  // This can fire multiple times, so we use 'on' not 'once'
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
    // Register main Turn Prep tab
    api.registerCharacterTab(
      new api.models.SvelteTab({
        title: 'TURN_PREP.Tabs.TurnPrep',
        tabId: TAB_ID_MAIN,
        html: '',
        enabled: (data: any) => true,
        onRender: (params: any) => {
          // Will mount TurnPrepMainTab component here
          // For now, just render a placeholder
          renderMainTab(params);
        }
      })
    );
    info(`✓ Registered main Turn Prep tab (ID: ${TAB_ID_MAIN})`);
  } catch (err) {
    error(`Failed to register main Turn Prep tab`, err as Error);
  }

  try {
    // Register sidebar Turns tab
    api.registerCharacterSidebarTab(
      new api.models.SvelteTab({
        title: 'TURN_PREP.Tabs.Turns',
        tabId: TAB_ID_SIDEBAR_TURNS,
        html: '',
        enabled: (data: any) => true,
        onRender: (params: any) => {
          // Will mount HistoryFavoritesPanel component here
          // For now, just render a placeholder
          renderSidebarTab(params);
        }
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

/**
 * Placeholder for main tab content
 * This will be replaced with actual Svelte component mounting
 */
function renderMainTab(params: any) {
  if (!params.tabContentsElement) return;
  params.tabContentsElement.innerHTML = `
    <div class="turn-prep-main-tab">
      <p style="padding: 1rem; text-align: center; color: var(--t5e-primary-color);">
        Turn Prep Tab Placeholder
      </p>
    </div>
  `;
}

/**
 * Placeholder for sidebar tab content
 * This will be replaced with actual Svelte component mounting
 */
function renderSidebarTab(params: any) {
  if (!params.tabContentsElement) return;
  params.tabContentsElement.innerHTML = `
    <div class="turn-prep-sidebar-tab">
      <p style="padding: 1rem; text-align: center; color: var(--t5e-primary-color);">
        Turns Sidebar Tab Placeholder
      </p>
    </div>
  `;
}
