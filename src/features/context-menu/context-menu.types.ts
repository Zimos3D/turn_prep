/**
 * Shared Context Menu Type Definitions
 *
 * These types are used by the interactive context menu system that powers
 * in-panel menus (turn plans, reaction plans, DM questions, etc.).
 * They are intentionally framework-agnostic so Svelte components and
 * non-UI utilities share the same contracts.
 */

export type ContextMenuVariant = 'default' | 'destructive';

export interface ContextMenuAction {
	id: string;
	label: string;
	icon: string;
	onSelect: () => void | Promise<void>;
	disabled?: boolean;
	description?: string;
	variant?: ContextMenuVariant;
	/** Optional nested submenu sections */
	submenu?: ContextMenuSection[];
}

export interface ContextMenuSection {
	id: string;
	label?: string;
	actions: ContextMenuAction[];
}

export interface ContextMenuPosition {
	x: number;
	y: number;
}

export interface ContextMenuContext {
	[key: string]: unknown;
	rowKey?: string;
	featureId?: string;
}

export type ContextMenuCloseReason = 'select' | 'dismiss' | 'escape' | 'manual';

export interface ContextMenuRequest {
	requestId?: string;
	sections: ContextMenuSection[];
	position: ContextMenuPosition;
	anchorElement?: HTMLElement | null;
	context?: ContextMenuContext;
	closeOnSelect?: boolean;
	onClose?: (reason: ContextMenuCloseReason) => void;
}

export interface ContextMenuState extends ContextMenuRequest {
	requestId: string;
	isOpen: true;
	openedAt: number;
}

export type ContextMenuSubscriber = (state: ContextMenuState | null) => void;
