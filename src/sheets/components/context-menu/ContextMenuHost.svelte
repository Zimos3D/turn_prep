<script lang="ts">
  import { onMount } from 'svelte';
  import { tick } from 'svelte';
  import type { ContextMenuController } from '../../../features/context-menu/ContextMenuController';
  import type { ContextMenuAction, ContextMenuState } from '../../../features/context-menu/context-menu.types';

  
  interface SubmenuStackItem {
    actionId: string;
    sections: ContextMenuState['sections'];
    anchorRect: DOMRect;
    level: number;
  }

  const { controller } = $props<{ controller: ContextMenuController }>();

  let menuState = $state<ContextMenuState | null>(null);
  let menuElement = $state<HTMLElement | null>(null);
  let menuPosition = $state({ top: -9999, left: -9999 });
  
  // Stacking support
  let submenuStack = $state<SubmenuStackItem[]>([]);
  let submenuElements = $state<HTMLElement[]>([]); // element refs
  let submenuPositions = $state<{ top: number; left: number }[]>([]); // parallel array to stack

  let unsubscribe: (() => void) | null = null;
  // Track hover timers to prevent jittery menu switching
  let hoverTimers: Map<string, number> = new Map();

  async function updateState(next: ContextMenuState | null) {
    menuState = next;

    if (!next) {
      menuPosition = { top: -9999, left: -9999 };
      submenuStack = [];
      submenuPositions = [];
      return;
    }

    await tick();
    positionMenu(next);
    focusFirstButton();
  }

  function positionMenu(state: ContextMenuState) {
    if (!menuElement) return;

    const rect = menuElement.getBoundingClientRect();
    const padding = 8;
    let x = state.position.x;
    let y = state.position.y;

    if (x + rect.width + padding > window.innerWidth) {
      x = Math.max(padding, window.innerWidth - rect.width - padding);
    }

    if (y + rect.height + padding > window.innerHeight) {
      y = Math.max(padding, window.innerHeight - rect.height - padding);
    }

    menuPosition = { top: y, left: x };
  }


  function positionSubmenus() {
    // Process each submenu in the stack
    const newPositions: { top: number; left: number }[] = [];
    
    // We need to know previous menu's LEFT side to decide direction
    // Start with root menu
    // let previousMenuLeft = menuPosition.left; // unused
    // let previousMenuWidth = menuElement?.getBoundingClientRect().width ?? 0; // unused

    for (let i = 0; i < submenuStack.length; i++) {
        const submenu = submenuStack[i];
        const element = submenuElements[i]; // Bound via bind:this in loop
        
        if (!element) {
            newPositions.push({ top: -9999, left: -9999 });
            continue;
        }

        const anchorRect = submenu.anchorRect;
        const rect = element.getBoundingClientRect();
        const padding = 8;
        
        // Default: Open to the RIGHT of the anchor item
        let x = anchorRect.right + 2; // slight gap
        let y = anchorRect.top - 4; // slight vertical adjustment to align top of menu with item

        // Check if we have space on the right
        const spaceRight = window.innerWidth - x - padding;
        const widthNeeded = rect.width;
        
        let startLeft = false;
        
        if (spaceRight < widthNeeded) {
           startLeft = true;
        }

        // For deeper submenus (i>0), try to maintain direction of parent
        if (i > 0) {
            const parentLeft = newPositions[i-1].left;
            const parentIsLeftOfAnchor = parentLeft < (submenuStack[i-1].anchorRect.left);
             
            // If parent is to the left, we prefer left
            if (parentIsLeftOfAnchor) {
                 const tryLeft = anchorRect.left - widthNeeded - 2;
                 if (tryLeft > padding) {
                     startLeft = true;
                 }
            } 
        }

        if (startLeft) {
             x = anchorRect.left - widthNeeded - 2;
        }

        
        // Vertical constrain
        if (y + rect.height + padding > window.innerHeight) {
             y = Math.max(padding, window.innerHeight - rect.height - padding);
        }

        newPositions.push({ top: y, left: x });
    }
    
    submenuPositions = newPositions;
  }

  function focusFirstButton() {
    if (!menuElement) return;
    const button = menuElement.querySelector<HTMLButtonElement>('button:not(:disabled)');
    button?.focus({ preventScroll: true });
  }

  function handleGlobalPointer(event: Event) {
    if (!menuState) return;
    const target = event.target as Node | null;

    if (
      target &&
      (menuElement?.contains(target) || submenuElements.some(el => el?.contains(target)) || menuState.anchorElement?.contains?.(target))
    ) {
      return;
    }

    controller.close('dismiss');
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (!menuState) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      controller.close('escape');
      return;
    }

    // Simplified keyboard navigation for now
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
      return;
    }
    
    const focusedElement = document.activeElement;
    // const container = submenuElement?.contains(focusedElement) ? submenuElement : menuElement; // Old logic
    let container = menuElement;
    if (submenuElements.some(el => el?.contains(focusedElement))) {
        container = submenuElements.find(el => el?.contains(focusedElement)) ?? null;
    }
    
    const buttons = Array.from(container?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? []);
    if (!buttons.length) return;

    event.preventDefault();
    const direction = event.key === 'ArrowDown' ? 1 : -1;
    const active = document.activeElement;
    const index = buttons.findIndex((btn) => btn === active);
    const nextIndex = (index + direction + buttons.length) % buttons.length;
    buttons[nextIndex]?.focus({ preventScroll: true });
  }

  function handleWindowChange() {
    if (menuState) {
      positionMenu(menuState);
      positionSubmenus();
    }
  }

  function handleItemPointer(event: PointerEvent) {
    // Keep event from closing menu
    // event.stopPropagation();
  }

  function handleItemClick(event: MouseEvent, action: ContextMenuAction, level: number) {
    event.preventDefault();
    event.stopPropagation();
    
    if (action.submenu?.length) {
      void openSubmenu(action, event.currentTarget as HTMLElement, level);
      return;
    }
    controller.runAction(action);
  }

  function handleItemEnter(action: ContextMenuAction, target: HTMLElement | null, level: number) {
    const nextStack = submenuStack.slice(0, level);    
    if (submenuStack.length > level) {
         if (submenuStack[level]?.actionId === action.id) {
             return;
         }
         submenuStack = nextStack;
         submenuPositions = submenuPositions.slice(0, level);
    }

    if (action.submenu?.length) {
       void openSubmenu(action, target, level);
    } else {
       submenuStack = nextStack; 
       submenuPositions = submenuPositions.slice(0, level);
    }
  }

  async function openSubmenu(action: ContextMenuAction, target: HTMLElement | null, parentLevel: number) {
    if (!action.submenu?.length || !target) return;
    const newStack = submenuStack.slice(0, parentLevel);
    newStack.push({
      actionId: action.id,
      sections: action.submenu,
      anchorRect: target.getBoundingClientRect(),
      level: parentLevel + 1
    });
    submenuStack = newStack;
    await tick();
    positionSubmenus(); 
  }

  // no-op stubs for compatibility if needed
  async function openSubmenuFromAnchor(target: HTMLElement) {} 
  function focusFirstSubmenuButton() {} 



  onMount(() => {
    unsubscribe = controller.subscribe((state: ContextMenuState | null) => {
      void updateState(state);
    });

    document.addEventListener('pointerdown', handleGlobalPointer, true);
    document.addEventListener('contextmenu', handleGlobalPointer, true);
    document.addEventListener('wheel', handleGlobalPointer, true);
    document.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('resize', handleWindowChange);

    return () => {
      document.removeEventListener('pointerdown', handleGlobalPointer, true);
      document.removeEventListener('contextmenu', handleGlobalPointer, true);
      document.removeEventListener('wheel', handleGlobalPointer, true);
      document.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('resize', handleWindowChange);
      unsubscribe?.();
      unsubscribe = null;
    };
  });
</script>

{#if menuState}
  <div class="turn-prep-context-menu-root">
    <div
      class="turn-prep-context-menu"
      style={`top: ${menuPosition.top}px; left: ${menuPosition.left}px;`}
      bind:this={menuElement}
      role="menu"
      aria-label={typeof menuState.context?.ariaLabel === 'string'
        ? (menuState.context?.ariaLabel as string)
        : 'Context menu'}
    >
      <div class="turn-prep-context-menu__sections">
        {#each menuState.sections as section (section.id)}
          <section class="turn-prep-context-menu__section" aria-label={section.label}
          >
            {#if section.label}
              <p class="turn-prep-context-menu__section-label">{section.label}</p>
            {/if}
            <div class="turn-prep-context-menu__items">
              {#each section.actions as action (action.id)}
                <button
                  type="button"
                  class={`turn-prep-context-menu__item ${action.variant === 'destructive' ? 'is-destructive' : ''} ${action.disabled ? 'is-disabled' : ''}`}
                  role="menuitem"
                  aria-haspopup={action.submenu?.length ? 'true' : undefined}
                  data-action-id={action.id}
                  data-submenu={action.submenu?.length ? 'true' : undefined}
                  disabled={action.disabled}
                  onpointerdown={handleItemPointer}
                  onpointerenter={(event) => handleItemEnter(action, event.currentTarget as HTMLElement, 0)}
                  onfocus={(event) => handleItemEnter(action, event.currentTarget as HTMLElement, 0)}
                  onclick={(event) => handleItemClick(event, action, 0)}
                >
                  <span class="turn-prep-context-menu__item-icon" aria-hidden="true">
                    <i class={action.icon}></i>
                  </span>
                  <span class="turn-prep-context-menu__item-text">
                    <span class="label">{action.label}</span>
                    {#if action.description}
                      <span class="description">{action.description}</span>
                    {/if}
                  </span>
                  {#if action.submenu?.length}
                    <span class="turn-prep-context-menu__item-caret" aria-hidden="true">&#8250;</span>
                  {/if}
                </button>
              {/each}
            </div>
          </section>
        {/each}
      </div>
    </div>

    {#each submenuStack as submenu, index (submenu.actionId)}
      <div
        class="turn-prep-context-menu turn-prep-context-menu--submenu"
        style={`top: ${submenuPositions[index]?.top ?? -9999}px; left: ${submenuPositions[index]?.left ?? -9999}px;`}
        bind:this={submenuElements[index]}
        role="menu"
        aria-label="Submenu"
      >
        <div class="turn-prep-context-menu__sections">
          {#each submenu.sections as section (section.id)}
            <section class="turn-prep-context-menu__section" aria-label={section.label}
            >
              {#if section.label}
                <p class="turn-prep-context-menu__section-label">{section.label}</p>
              {/if}
              <div class="turn-prep-context-menu__items">
                {#each section.actions as action (action.id)}
                  <button
                    type="button"
                    class={`turn-prep-context-menu__item ${action.variant === 'destructive' ? 'is-destructive' : ''} ${action.disabled ? 'is-disabled' : ''}`}
                    role="menuitem"
                    disabled={action.disabled}
                    onpointerdown={handleItemPointer}
                    onpointerenter={(event) => handleItemEnter(action, event.currentTarget as HTMLElement, index + 1)}
                    onfocus={(event) => handleItemEnter(action, event.currentTarget as HTMLElement, index + 1)}
                    onclick={(event) => handleItemClick(event, action, index + 1)}
                  >
                    <span class="turn-prep-context-menu__item-icon" aria-hidden="true">
                      <i class={action.icon}></i>
                    </span>
                    <span class="turn-prep-context-menu__item-text">
                      <span class="label">{action.label}</span>
                      {#if action.description}
                        <span class="description">{action.description}</span>
                      {/if}
                    </span>
                    {#if action.submenu?.length}
                      <span class="turn-prep-context-menu__item-caret" aria-hidden="true">&#8250;</span>
                    {/if}
                  </button>
                {/each}
              </div>
            </section>
          {/each}
        </div>
      </div>
    {/each}
  </div>
{/if}
