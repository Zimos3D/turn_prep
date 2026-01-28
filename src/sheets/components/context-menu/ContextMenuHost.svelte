<script lang="ts">
  import { onMount } from 'svelte';
  import { tick } from 'svelte';
  import type { ContextMenuController } from '../../../features/context-menu/ContextMenuController';
  import type { ContextMenuAction, ContextMenuState } from '../../../features/context-menu/context-menu.types';

  const { controller } = $props<{ controller: ContextMenuController }>();

  let menuState = $state<ContextMenuState | null>(null);
  let menuElement = $state<HTMLElement | null>(null);
  let menuPosition = $state({ top: -9999, left: -9999 });
  let unsubscribe: (() => void) | null = null;

  async function updateState(next: ContextMenuState | null) {
    menuState = next;

    if (!next) {
      menuPosition = { top: -9999, left: -9999 };
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

  function focusFirstButton() {
    if (!menuElement) return;
    const button = menuElement.querySelector<HTMLButtonElement>('button:not(:disabled)');
    button?.focus({ preventScroll: true });
  }

  function handleGlobalPointer(event: Event) {
    if (!menuState) return;
    const target = event.target as Node | null;

    if (target && (menuElement?.contains(target) || menuState.anchorElement?.contains?.(target))) {
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

    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
      return;
    }

    const buttons = Array.from(
      menuElement?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? []
    );
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
    }
  }

  function handleItemPointer(event: PointerEvent) {
    event.stopPropagation();
  }

  function handleItemClick(event: MouseEvent, action: ContextMenuAction) {
    event.preventDefault();
    event.stopPropagation();
    controller.runAction(action);
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
              </button>
            {/each}
          </div>
        </section>
      {/each}
    </div>
  </div>
{/if}
