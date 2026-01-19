/**
 * Foundry Type Definitions
 * 
 * Type definitions for Foundry VTT API.
 * Extends Foundry types with our custom properties and fixes typing issues.
 */

import type { TurnPrepData } from '../types';

// ============================================================================
// Actor Extensions
// ============================================================================

/**
 * Extended Actor type with Turn Prep flag support
 * Adds type-safe flag access
 */
export interface Actor5e extends Actor {
  /** D&D 5e system data */
  system?: {
    attributes?: any;
    details?: any;
    traits?: any;
    [key: string]: any;
  };

  /** Extended flags interface */
  flags?: {
    'turn-prep'?: {
      turnPrepData?: TurnPrepData;
    };
    [key: string]: any;
  };

  /**
   * Get an item by ID
   */
  items?: Collection<Item>;
}

// ============================================================================
// Item Extensions
// ============================================================================

/**
 * Extended Item type with D&D 5e properties
 */
export interface Item5e extends Item {
  /** D&D 5e system data */
  system?: {
    activation?: {
      type?: string;
      cost?: number;
      condition?: string;
    };
    preparation?: {
      prepared?: boolean;
      mode?: string;
    };
    actionType?: string;
    range?: {
      value?: number;
      units?: string;
    };
    description?: {
      value?: string;
      chat?: string;
    };
    [key: string]: any;
  };

  /** Parent actor reference */
  actor?: Actor5e | null;
}

// ============================================================================
// Hook Types
// ============================================================================

/**
 * Hook callback for when actors are created/updated
 */
export type ActorUpdateHookCallback = (
  actor: Actor,
  changes: Record<string, any>,
  options: any
) => void;

/**
 * Hook callback for when items are created/updated
 */
export type ItemUpdateHookCallback = (
  item: Item,
  changes: Record<string, any>,
  options: any
) => void;

/**
 * Hook callback for when combat starts
 */
export type CombatStartHookCallback = (combat: Combat, round?: number, turn?: number) => void;

/**
 * Hook callback for when a combatant's turn starts
 */
export type CombatTurnHookCallback = (combat: Combat, round?: number, turn?: number) => void;

/**
 * Hook callback for render events
 */
export type RenderApplicationHookCallback = (
  app: Application,
  html: JQuery,
  data: any
) => void;

// ============================================================================
// Game Object Types
// ============================================================================

/**
 * Game object with D&D 5e system
 */
export interface GameD5e {
  actors?: Collection<Actor5e>;
  items?: Collection<Item5e>;
  user?: User;
  users?: Collection<User>;
  modules?: Collection<Module>;
  version?: string;
  system?: {
    id: string;
    version: string;
  };
  i18n?: {
    localize: (key: string) => string;
    format: (key: string, data?: Record<string, any>) => string;
    translations?: Record<string, any>;
  };
  settings?: {
    register: (module: string, key: string, options: any) => void;
    get: (module: string, key: string) => any;
    set: (module: string, key: string, value: any) => Promise<void>;
  };
  ready?: boolean;
  data?: {
    version?: string;
  };
}

// ============================================================================
// Dialog Options
// ============================================================================

/**
 * Options for creating a dialog
 */
export interface DialogOptions {
  title: string;
  content?: string | HTMLElement;
  buttons?: Record<
    string,
    {
      label?: string;
      icon?: string;
      callback?: () => void;
    }
  >;
  default?: string;
  classes?: string[];
  width?: number;
  height?: number;
  jQuery?: boolean;
  scrollY?: string[];
}

// ============================================================================
// User Types
// ============================================================================

/**
 * User object type
 */
export interface UserType {
  _id: string;
  name: string;
  isGM?: boolean;
  role?: number;
  avatar?: string;
  color?: string;
}

// ============================================================================
// Collection Type
// ============================================================================

/**
 * Foundry Collection type (Map-like)
 */
export interface Collection<T> {
  size: number;
  has(key: string): boolean;
  get(key: string): T | undefined;
  set(key: string, value: T): void;
  delete(key: string): boolean;
  clear(): void;
  values(): IterableIterator<T>;
  keys(): IterableIterator<string>;
  entries(): IterableIterator<[string, T]>;
  forEach(callback: (value: T, key: string) => void): void;
  [Symbol.iterator](): IterableIterator<T>;
}

// ============================================================================
// Module Type
// ============================================================================

/**
 * Module metadata
 */
export interface ModuleMetadata {
  id: string;
  title: string;
  description: string;
  version: string;
  author: string;
  url: string;
  manifest: string;
  download: string;
  license: string;
  readme: string;
  bug: string;
  changelog: string;
}

/**
 * Module object
 */
export interface Module {
  _id: string;
  id: string;
  title: string;
  description: string;
  version: string;
  active: boolean;
  api?: Record<string, any>;
  [key: string]: any;
}

// ============================================================================
// Chat Message Types
// ============================================================================

/**
 * Chat message object
 */
export interface ChatMessageData {
  _id?: string;
  type?: string;
  user?: string;
  content?: string;
  speaker?: {
    scene?: string;
    actor?: string;
    token?: string;
    character?: string;
  };
  whisper?: string[];
  flavor?: string;
  rolls?: any[];
  timestamp?: number;
}

// ============================================================================
// Combat Types
// ============================================================================

/**
 * Combat object
 */
export interface Combat {
  _id: string;
  round: number;
  turn: number;
  combatants: Collection<Combatant>;
  started: boolean;
  active: boolean;
}

/**
 * Combatant in combat
 */
export interface Combatant {
  _id: string;
  combatId: string;
  name: string;
  actor?: Actor5e;
  token?: Token;
  initiative?: number;
  hidden?: boolean;
  defeated?: boolean;
}

/**
 * Token object
 */
export interface Token {
  _id: string;
  name: string;
  actor?: Actor5e;
  x: number;
  y: number;
  hidden?: boolean;
}

// ============================================================================
// Application Types
// ============================================================================

/**
 * Base Application options
 */
export interface ApplicationOptions {
  classes?: string[];
  width?: number;
  height?: number;
  left?: number;
  top?: number;
  scale?: number;
  minimized?: boolean;
  title?: string;
  popOut?: boolean;
  resizable?: boolean;
  dragDrop?: any[];
  tabs?: any[];
  scrollY?: string[];
}

// ============================================================================
// Global Type Extensions
// ============================================================================

/**
 * Extend global window object with Foundry types
 */
declare global {
  const game: GameD5e;
  const ui: {
    notifications?: {
      info: (message: string, options?: any) => void;
      warn: (message: string, options?: any) => void;
      error: (message: string, options?: any) => void;
    };
    chat?: any;
    sidebar?: any;
    hotbar?: any;
  };
  const Hooks: {
    on: (hookName: string, callback: Function) => number;
    once: (hookName: string, callback: Function) => number;
    off: (hookName: string, hookId: number) => void;
    callAll: (hookName: string, ...args: any[]) => number;
  };
  const Dialog: new (options: any) => {
    render(force?: boolean): Dialog;
  };
  interface Dialog {
    render(force?: boolean): this;
  }
}

export {};
