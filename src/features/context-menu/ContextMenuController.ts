/**
 * Interactive Context Menu Controller
 *
 * Lightweight event emitter that coordinates context menu visibility
 * between non-UI logic and Svelte components. Multiple controllers can
 * exist simultaneously (e.g., turn plans, reaction plans, DM questions)
 * without interfering with one another.
 */

import { warn } from '../../utils/logging';
import type {
  ContextMenuAction,
  ContextMenuCloseReason,
  ContextMenuRequest,
  ContextMenuState,
  ContextMenuSubscriber,
} from './context-menu.types';

let controllerCounter = 0;

export class ContextMenuController {
  private state: ContextMenuState | null = null;
  private readonly subscribers = new Set<ContextMenuSubscriber>();
  readonly id: string;

  constructor(id?: string) {
    controllerCounter += 1;
    this.id = id ?? `context-menu-${controllerCounter}`;
  }

  subscribe(listener: ContextMenuSubscriber): () => void {
    this.subscribers.add(listener);
    listener(this.state);
    return () => {
      this.subscribers.delete(listener);
    };
  }

  open(request: ContextMenuRequest): void {
    const requestId = request.requestId ?? `${this.id}-${Date.now()}`;
    const previous = this.state;

    // Notify previous request that it was superseded so callers can clean up.
    if (previous) {
      try {
        previous.onClose?.('dismiss');
      } catch (err) {
        warn('[ContextMenuController] Previous onClose callback failed', err as Error);
      }
    }

    this.state = {
      ...request,
      requestId,
      isOpen: true,
      openedAt: Date.now(),
    };

    this.emit();
  }

  close(reason: ContextMenuCloseReason = 'manual'): void {
    if (!this.state) {
      return;
    }

    const current = this.state;
    this.state = null;
    this.emit();

    try {
      current.onClose?.(reason);
    } catch (err) {
      warn('[ContextMenuController] onClose callback failed', err as Error);
    }
  }

  runAction(action: ContextMenuAction, reason: ContextMenuCloseReason = 'select'): void {
    if (action.disabled) {
      return;
    }

    const shouldClose = this.state?.closeOnSelect !== false;
    if (shouldClose) {
      this.close(reason);
    }

    try {
      const result = action.onSelect();
      if (result instanceof Promise) {
        void result.catch((err) => {
          warn('[ContextMenuController] Action handler failed', err as Error);
        });
      }
    } catch (err) {
      warn('[ContextMenuController] Action handler threw', err as Error);
    }
  }

  getState(): ContextMenuState | null {
    return this.state;
  }

  private emit(): void {
    for (const listener of this.subscribers) {
      try {
        listener(this.state);
      } catch (err) {
        warn('[ContextMenuController] Subscriber failed', err as Error);
      }
    }
  }
}
