<script lang="ts">
  import { onMount } from 'svelte';
  import { tick } from 'svelte';
  import type { ContextMenuController } from '../../../features/context-menu/ContextMenuController';
  import type { ContextMenuAction, ContextMenuState } from '../../../features/context-menu/context-menu.types';

  const { controller } = $props<{ controller: ContextMenuController }>();

  let menuState = $state<ContextMenuState | null>(null);
  let menuElement = $state<HTMLElement | null>(null);
  let menuPosition = $state({ top: -9999, left: -9999 });
  let submenuState = $state<{ actionId: string; sections: ContextMenuState['sections']; anchorRect: DOMRect | null } | null>(null);
  let submenuElement = $state<HTMLElement | null>(null);
  let submenuPosition = $state({ top: -9999, left: -9999 });
  let submenuAnchor: HTMLElement | null = null;
  let unsubscribe: (() => void) | null = null;

  async function updateState(next: ContextMenuState | null) {
    menuState = next;

    if (!next) {
      menuPosition = { top: -9999, left: -9999 };
      submenuState = null;
      submenuPosition = { top: -9999, left: -9999 };
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

  function positionSubmenu() {
    if (!submenuState || !submenuElement) return;
    const anchorRect = submenuState.anchorRect;
    const rect = submenuElement.getBoundingClientRect();
    const padding = 8;

    let x = (anchorRect?.right ?? menuPosition.left) + 6;
    let y = anchorRect?.top ?? menuPosition.top;

    if (x + rect.width + padding > window.innerWidth) {
      x = Math.max(padding, (anchorRect?.left ?? menuPosition.left) - rect.width - 6);
    }

    if (y + rect.height + padding > window.innerHeight) {
      y = Math.max(padding, window.innerHeight - rect.height - padding);
    }

    submenuPosition = { top: y, left: x };
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
      (menuElement?.contains(target) || submenuElement?.contains(target) || menuState.anchorElement?.contains?.(target))
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

    if (event.key === 'ArrowLeft') {
      if (submenuState && submenuAnchor && submenuElement?.contains(document.activeElement)) {
        event.preventDefault();
        submenuAnchor.focus({ preventScroll: true });
        submenuState = null;
        submenuPosition = { top: -9999, left: -9999 };
      }
      return;
    }

    if (event.key === 'ArrowRight') {
      const active = document.activeElement;
      if (active instanceof HTMLElement && active.dataset?.submenu === 'true') {
        event.preventDefault();
        void openSubmenuFromAnchor(active);
        focusFirstSubmenuButton();
      }
      return;
    }

    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
      return;
    }

    const focusedElement = document.activeElement;
    const container = submenuElement?.contains(focusedElement) ? submenuElement : menuElement;
    const buttons = Array.from(container?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? []);
    if (!buttons.length) {
      return;
    }

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
      positionSubmenu();
    }
  }

  function handleItemPointer(event: PointerEvent) {
    event.stopPropagation();
  }

  function handleItemClick(event: MouseEvent, action: ContextMenuAction) {
    event.preventDefault();
    event.stopPropagation();
    if (action.submenu?.length) {
      return; // submenu actions open via hover/focus; parent not selectable
    }
    controller.runAction(action);
  }

  function handleItemEnter(action: ContextMenuAction, target: HTMLElement | null) {
    if (action.submenu?.length) {
      void openSubmenu(action, target);
    } else {
      submenuState = null;
      submenuPosition = { top: -9999, left: -9999 };
    }
  }

  async function openSubmenu(action: ContextMenuAction, target: HTMLElement | null) {
    if (!action.submenu?.length || !target) {
      submenuState = null;
      submenuPosition = { top: -9999, left: -9999 };
      submenuAnchor = null;
      return;
    }

    submenuAnchor = target;
    submenuState = {
      actionId: action.id,
      sections: action.submenu,
      anchorRect: target.getBoundingClientRect()
    };
    await tick();
    positionSubmenu();
  }

  async function openSubmenuFromAnchor(target: HTMLElement) {
    const actionId = target.dataset?.actionId;
    if (!actionId) return;
    const action = menuState?.sections.flatMap((s) => s.actions).find((a) => a.id === actionId);
    if (!action) return;
    await openSubmenu(action, target);
  }

  function focusFirstSubmenuButton() {
    if (!submenuElement) return;
    const button = submenuElement.querySelector<HTMLButtonElement>('button:not(:disabled)');
    button?.focus({ preventScroll: true });
  }

  onMount(() => {
    unsubscribe = controller.subscribe((state) => {
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
                  onpointerenter={(event) => handleItemEnter(action, event.currentTarget as HTMLElement)}
                  onfocus={(event) => handleItemEnter(action, event.currentTarget as HTMLElement)}
                  onclick={(event) => handleItemClick(event, action)}
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

    {#if submenuState}
      <div
        class="turn-prep-context-menu turn-prep-context-menu--submenu"
        style={`top: ${submenuPosition.top}px; left: ${submenuPosition.left}px;`}
        bind:this={submenuElement}
        role="menu"
        aria-label="Submenu"
      >
        <div class="turn-prep-context-menu__sections">
          {#each submenuState.sections as section (section.id)}
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
                    onclick={(event) => handleItemClick(event, action)}
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
    {/if}
  </div>
{/if}
