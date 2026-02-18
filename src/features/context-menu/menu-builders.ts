import { FoundryAdapter } from '../../foundry/FoundryAdapter';
import type { ContextMenuAction, ContextMenuSection } from './context-menu.types';

export interface ReorderActionLabels {
  moveUp?: string;
  moveDown?: string;
  moveTop?: string;
  moveBottom?: string;
  arrange?: string;
}

export interface ReorderMenuOptions {
  currentIndex: number;
  totalCount: number;
  onMoveUp: () => void | Promise<void>;
  onMoveDown: () => void | Promise<void>;
  onMoveTop: () => void | Promise<void>;
  onMoveBottom: () => void | Promise<void>;
  idPrefix?: string;
  labels?: ReorderActionLabels;
}

/**
 * Builds a standard "Arrange" submenu with Move Up/Down/Top/Bottom actions.
 * Returns an array of ContextMenuActions (up/down/top/bottom).
 */
export function buildReorderActions(options: ReorderMenuOptions): ContextMenuAction[] {
  const { currentIndex, totalCount, onMoveUp, onMoveDown, onMoveTop, onMoveBottom, idPrefix } = options;
  
  if (currentIndex === -1 || totalCount <= 1) {
    return [];
  }

  const prefix = idPrefix ? `${idPrefix}-` : '';
  const labels = options.labels || {};

  return [
    {
      id: `${prefix}move-up`,
      label: labels.moveUp || FoundryAdapter.localize('TURN_PREP.ContextMenu.MoveUp') || 'Move Up',
      icon: 'fa-solid fa-angle-up',
      onSelect: onMoveUp,
      disabled: currentIndex === 0
    },
    {
      id: `${prefix}move-down`,
      label: labels.moveDown || FoundryAdapter.localize('TURN_PREP.ContextMenu.MoveDown') || 'Move Down',
      icon: 'fa-solid fa-angle-down',
      onSelect: onMoveDown,
      disabled: currentIndex === totalCount - 1
    },
    {
      id: `${prefix}move-top`,
      label: labels.moveTop || FoundryAdapter.localize('TURN_PREP.ContextMenu.MoveTop') || 'Move to Top',
      icon: 'fa-solid fa-angles-up',
      onSelect: onMoveTop,
      disabled: currentIndex === 0
    },
    {
      id: `${prefix}move-bottom`,
      label: labels.moveBottom || FoundryAdapter.localize('TURN_PREP.ContextMenu.MoveBottom') || 'Move to Bottom',
      icon: 'fa-solid fa-angles-down',
      onSelect: onMoveBottom,
      disabled: currentIndex === totalCount - 1
    }
  ];
}

/**
 * Wraps reorder actions into a standard "Arrange" submenu section.
 */
export function buildArrangeSubmenuSection(
  reorderActions: ContextMenuAction[],
  sectionId: string = 'arrange-actions'
): ContextMenuSection[] {
  if (reorderActions.length === 0) {
    return [];
  }
  
  return [
    {
      id: sectionId,
      actions: reorderActions
    }
  ];
}

/**
 * Creates the parent "Arrange" action that opens the submenu.
 */
export function buildArrangeParentAction(
  arrangeSubmenu: ContextMenuSection[],
  label?: string
): ContextMenuAction | null {
  if (arrangeSubmenu.length === 0) {
    return null;
  }

  return {
    id: 'arrange',
    label: label || FoundryAdapter.localize('TURN_PREP.ContextMenu.Arrange') || 'Arrange',
    icon: 'fa-solid fa-arrow-up-wide-short',
    submenu: arrangeSubmenu,
    onSelect: () => {} // Submenu container
  };
}
