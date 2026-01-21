/**
 * Tidy 5E Sheet Integration
 * 
 * Registers Turn Prep tabs with the Tidy 5E sheet system.
 * Creates and manages the main Turn Prep tab and sidebar Turns tab.
 */

import { MODULE_ID, TAB_ID_MAIN, TAB_ID_SIDEBAR_TURNS } from '../../constants';
import { info } from '../../utils/logging';

/**
 * Initialize Tidy5e sheet integration
 * Called from the 'ready' hook after all modules are loaded
 */
export async function initializeTidy5eSheets() {
  // Check if Tidy5e sheet is active
  if (!game.modules.get('tidy5e-sheet')?.active) {
    info('Tidy5e Sheet not active - Turn Prep tabs will not be registered');
    return;
  }

  // Hook into Tidy5e readiness
  Hooks.once('tidy5e-sheet.ready', async (api: any) => {
    try {
      registerTidyTabs(api);
      setupTabHooks(api);
      info('Tidy5e tabs registered successfully');
    } catch (error) {
      console.error(`${MODULE_ID}: Failed to register Tidy5e tabs`, error);
    }
  });
}

/**
 * Register tabs with Tidy5e API
 */
function registerTidyTabs(api: any) {
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
