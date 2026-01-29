/**
 * Tidy 5E Sheet Integration
 * 
 * Registers Turn Prep tabs with the Tidy 5E sheet system.
 * Creates and manages the main Turn Prep tab and sidebar Turns tab.
 * 
 * NOTE: The hook registration happens at module load time (see bottom of file),
 * NOT when this function is called. This ensures proper timing with Tidy5e.
 * 
 * Uses raw .svelte files with Tidy5e's api.svelte.framework.mount()
 * to let Tidy5e compile and mount components with their Svelte runtime.
 */

import { mount, unmount } from 'svelte';
import { MODULE_ID, TAB_ID_MAIN, TAB_ID_SIDEBAR_TURNS } from '../../constants';
import { info, error } from '../../utils/logging';
import TidyTurnPrepTab from './TidyTurnPrepTab.svelte';

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
    // We mount our own Svelte component into the container
    api.registerCharacterTab(
      new api.models.HtmlTab({
        title: 'Turn Prep',
        tabId: TAB_ID_MAIN,
        html: '<div data-turn-prep-root style="height: 100%"></div>',
        // Prevent Tidy from nuking our tab markup on every actor update so the Svelte
        // component stays mounted and keeps focus/scroll state intact.
        renderScheme: 'force',
        enabled: (data: any) => true,
        onRender: (params: any) => {
          const { element, data } = params;
          // Use the stable `element` (the tab element) as the key to avoid
          // remounting when Tidy re-renders the inner container element.
          const container = element.querySelector('[data-turn-prep-root]');
          
          if (!container || !data?.actor) {
            error('Turn Prep container or actor not found');
            return;
          }

          try {
            // Check if component is already mounted for this tab element
            // Use the outer `element` as a stable key because Tidy may recreate
            // the inner container on re-renders which would otherwise look like
            // a new mount target and cause repeated mounts (losing focus).
            const mapKey = element;
            // Lazily create the map on the api object to persist across
            // potential multiple registerTidyTabs calls.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (api as any).__turnPrepComponentMap = (api as any).__turnPrepComponentMap || new WeakMap<Element, any>();
            const componentMap = (api as any).__turnPrepComponentMap as WeakMap<Element, any>;

            const existingComponent = componentMap.get(mapKey);

            if (existingComponent) {
              if (container.childElementCount > 0) {
                return;
              }

              try {
                unmount(existingComponent);
              } catch (unmountErr) {
                error('Failed to unmount stale Turn Prep tab', unmountErr as Error);
              } finally {
                componentMap.delete(mapKey);
              }
            }

            const component = mount(TidyTurnPrepTab, {
              target: container,
              props: { actor: data.actor }
            });

            componentMap.set(mapKey, component);
            info('Turn Prep main tab mounted successfully');
          } catch (err) {
            error('Failed to mount Turn Prep main tab', err as Error);
          }
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
      new api.models.HtmlTab({
        title: 'Turns',
        tabId: TAB_ID_SIDEBAR_TURNS,
        iconClass: 'fa-solid fa-hourglass',
        html: '<div class="turn-prep-sidebar"><p>Sidebar content coming soon...</p></div>',
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
