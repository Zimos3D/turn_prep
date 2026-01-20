# Tidy5e Context Menu System Research

## Overview

Tidy5e implements a **custom context menu system** that diverges from Foundry's standard approach. The HTML structure uses a custom `<nav>` element with `<menu>` and context groups organized by `data-group-id` attributes.

---

## 1. HTML Structure

Tidy5e's context menu follows this structure:

```html
<nav id="context-menu" class="floating tidy5e-sheet quadrone context expand-down themed theme-dark">
  <menu class="context-items">
    <!-- Context groups with data-group-id -->
    <li class="context-group" data-group-id="common">
      <ol>
        <li class="context-item"><i class="fas fa-eye fa-fw"></i><span>View</span></li>
        <li class="context-item"><i class="fa-solid fa-pen-to-square fa-fw"></i><span>Edit</span></li>
        <!-- ... more items ... -->
      </ol>
    </li>
    <li class="context-group" data-group-id="customize"><!-- ... --></li>
    <li class="context-group" data-group-id="be-careful"><!-- ... --></li>
  </menu>
</nav>
```

### Context Group IDs
The standard groups used by Tidy5e are:
- **`common`** - Standard, safe operations (View, Edit, Display Card)
- **`customize`** - Customization operations (sections, pins, filters)
- **`sections`** - Section management options
- **`pins`** - Attribute pin operations
- **`be-careful`** - Destructive operations (Delete)

---

## 2. How Modules Register Context Menu Items/Groups

### API Method: `registerSectionCommands()`

**Location:** `src/api/config/actor-item/ActorItemApi.ts`

Modules use the **Tidy5e API** to register commands that appear in context menus:

```typescript
Hooks.once('tidy5e-sheet.ready', (api) => {
  api.config.actorItem.registerSectionCommands([
    {
      enabled: (params) => {
        // Return boolean to show/hide command
        return params.actor.type === 'character';
      },
      iconClass: 'fa-solid fa-plus',
      tooltip: 'Add to Turn Prep',
      label: 'Add to Turn Prep',
      execute: async (params) => {
        // params.actor - the actor document
        // params.section - the item section
        // params.event - the trigger event
        console.log('Command executed!');
      },
    },
  ]);
});
```

### Data Structure: `ActorItemSectionCommand`

**Location:** `src/api/api.types.ts` (lines 263-312)

```typescript
export interface ActorItemSectionCommand {
  /**
   * Optional label to use when displaying the command
   * Localization keys also work (e.g., 'DND5E.Delete')
   */
  label?: string;

  /**
   * Optional string of CSS classes representing a FontAwesome icon
   * Examples: 'fa-solid fa-plus', 'fas fa-trash fa-fw'
   */
  iconClass?: string;

  /**
   * Optional tooltip text for the target command
   */
  tooltip?: string;

  /**
   * Callback to conditionally include a command
   * If not included, defaults to `true`
   */
  enabled?: (params: ActorItemSectionFooterCommandEnabledParams) => boolean;

  /**
   * Callback executed when user clicks the command
   */
  execute?: (params: ActorItemSectionCommandExecuteParams) => void;
}
```

### Enable/Execute Parameters

```typescript
export interface ActorItemSectionFooterCommandEnabledParams {
  // The actor for whom the command will show
  actor: Actor5e;
  
  // The item section for which the command will show
  section: any;
  
  // The sheet is in Edit Mode/unlocked
  // Always true for Classic sheets, variable for Quadrone
  unlocked: boolean;
}

export interface ActorItemSectionCommandExecuteParams {
  // The actor for whom the command was executed
  actor: Actor5e;
  
  // The item section for which the command was executed
  section: any;
  
  // The user-initiated event (MouseEvent, PointerEvent, etc.)
  event: Event;
}
```

---

## 3. Tidy5e Hooks for Context Menu Building

### Item Context Menu Hook

**Hook Name:** `dnd5e.getItemContextOptions`

```typescript
Hooks.on('dnd5e.getItemContextOptions', (item, menuItems) => {
  // Add, modify, or remove menu items
  menuItems.push({
    name: 'Custom Action',
    icon: '<i class="fas fa-star"></i>',
    callback: () => {
      console.log('Item context menu action executed');
    },
    group: 'customize', // Use Tidy5e group ID
  });
});
```

**Called in:** `src/context-menu/tidy5e-item-context-menu.ts` (line 37)

### Tidy5e Specific Item Hook

**Hook Name:** `tidy5e-sheet.actorItemUseContextMenu`

```typescript
Hooks.on('tidy5e-sheet.actorItemUseContextMenu', (item, options) => {
  console.log('Item context menu about to show', item, options);
});
```

**Called in:** `src/foundry/TidyHooks.ts` (lines 137-155)

### Group Member Context Menu Hook

**Hook Name:** `tidy5e-sheet.getGroupMemberContextOptions`

```typescript
Hooks.on('tidy5e-sheet.getGroupMemberContextOptions', (group, member, contextOptions) => {
  // Modify group member context menu items
});
```

---

## 4. Adding Items to Item Context Menus

### Standard Foundry Hook (Works with Tidy5e)

The classic Foundry hook still works with Tidy5e items:

```typescript
Hooks.on('dnd5e.getItemContextOptions', (item, menuItems) => {
  // Only add for items with specific type
  if (item.type === 'weapon') {
    menuItems.push({
      name: 'Versatile Damage',
      icon: '<i class="fa-solid fa-hands-praying"></i>',
      group: 'customize',
      callback: () => {
        console.log('Handle versatile weapon damage');
      },
    });
  }
});
```

### Using Tidy5e's ActorItemApi

For commands on **item sections** (not individual items):

```typescript
Hooks.once('tidy5e-sheet.ready', (api) => {
  api.config.actorItem.registerSectionCommands([
    {
      label: 'Sort Items',
      iconClass: 'fa-solid fa-arrow-down-a-z',
      tooltip: 'Sort items alphabetically',
      enabled: (params) => {
        // Only show if section has items
        return params.section?.items?.length > 0;
      },
      execute: (params) => {
        const { actor, section, event } = params;
        const sortedItems = section.items.sort((a, b) => 
          a.name.localeCompare(b.name)
        );
        console.log('Items sorted:', sortedItems);
      },
    },
  ]);
});
```

---

## 5. Context Menu Entry Structure (Quadrone Sheet)

**Location:** `src/context-menu/tidy5e-item-context-menu-quadrone.ts`

For Quadrone sheets, context menu items use this structure:

```typescript
interface ContextMenuEntry {
  // Display name of the menu item
  name: string;

  // HTML for icon (can include FontAwesome classes)
  icon: string;

  // Callback when clicked
  callback: () => void | Promise<void>;

  // Optional: show/hide condition
  condition?: () => boolean;

  // **CRITICAL**: Tidy5e's group ID for categorization
  // Valid values: 'common', 'customize', 'sections', 'pins', 'be-careful'
  group?: string;
}
```

### Real Example from Tidy5e Source

```typescript
// From tidy5e-item-context-menu-quadrone.ts
options.push({
  name: 'TIDY5E.ContextMenuActionView',
  icon: '<i class="fas fa-eye fa-fw"></i>',
  group: 'common',
  callback: () =>
    item.sheet.render(true, { mode: CONSTANTS.SHEET_MODE_PLAY }),
});

options.push({
  name: 'TIDY5E.ContextMenuActionEdit',
  icon: '<i class="fa-solid fa-pen-to-square fa-fw"></i>',
  condition: () => item.isOwner && !FoundryAdapter.isLockedInCompendium(item),
  group: 'common',
  callback: () =>
    item.sheet.render(true, { mode: CONSTANTS.SHEET_MODE_EDIT }),
});

// Destructive operation in 'be-careful' group
options.push({
  name: 'TIDY5E.ContextMenuActionDelete',
  icon: "<i class='fas fa-trash fa-fw' style='color: var(--t5e-warning-accent-color);'></i>",
  group: 'be-careful',
  callback: () => {
    return itemParent
      ? FoundryAdapter.onActorItemDelete(itemParent, item)
      : item.delete();
  },
});
```

---

## 6. How the ActorItemApi is Used Internally

**Location:** `src/api/config/actor-item/ActorItemApi.ts` and `src/runtime/ActorItemRuntime.ts`

The ActorItemApi doesn't directly manage context menus. Instead, it manages **section commands** (buttons that appear in item section footers or headers).

```typescript
export class ActorItemApi {
  /**
   * Registers actor item section commands which Tidy 5e can render 
   * at select locations on the sheet.
   */
  registerSectionCommands(commands: ActorItemSectionCommand[]) {
    ActorItemRuntime.registerActorItemSectionCommands(commands);
  }
}
```

### Runtime Processing

```typescript
export class ActorItemRuntime {
  private static _actorItemSectionCommands: RegisteredSectionCommand[] = [];

  static registerActorItemSectionCommands(commands: ActorItemSectionCommand[]) {
    const sectionCommands: RegisteredSectionCommand[] = commands.map(
      (command) => ({
        ...command,
        enabled: command.enabled
          ? (params: RegisteredSectionCommandEnabledParams) =>
              command.enabled?.({ ...params, actor: params.document }) ?? true
          : undefined,
        execute: (params: RegisteredSectionCommandExecuteParams) =>
          command.execute?.({
            ...params,
            actor: params.document,
          }),
      })
    );

    ActorItemRuntime._actorItemSectionCommands.push(...sectionCommands);
  }

  static getActorItemSectionCommands({
    section,
    document,
    unlocked,
  }: RegisteredSectionCommandEnabledParams): SectionCommand[] {
    return [...ActorItemRuntime._actorItemSectionCommands].filter((c) => {
      try {
        return (
          section && (c.enabled?.({ section, document, unlocked }) ?? true)
        );
      } catch (e) {
        error(
          'Failed to check if actor item section command is enabled',
          false,
          { error: e, document, section }
        );
        return false;
      }
    });
  }
}
```

---

## 7. API Access Pattern

To access the Tidy5e API:

```typescript
Hooks.once('tidy5e-sheet.ready', (api) => {
  // api.config.actorItem - Configure item-related features
  // api.config.itemSummary - Configure item summary panel
  // api.config.actorPortrait - Configure portrait menu
  
  // Example: Register section commands
  api.config.actorItem.registerSectionCommands([
    // ... your commands here
  ]);
});
```

**Key Constants:**
- `module.id = 'tidy5e-sheet'`
- Access via: `game.modules.get('tidy5e-sheet').api`

---

## 8. Turn Prep Implementation in Workspace

Your current implementation correctly uses:

```typescript
// From src/features/context-menu/ContextMenuHandler.ts
Hooks.once('tidy5e-sheet.ready', (api: any) => {
  api.config.actorItem.registerSectionCommands([
    {
      enabled: (params: any) => {
        const item = params.item || params.row?.document;
        if (!item) return false;
        const activities = FeatureSelector.getActivitiesForItem(item);
        return activities.length > 0;
      },
      iconClass: 'fa-solid fa-plus',
      tooltip: 'Add to Turn Prep',
      execute: async (params: any) => {
        const item = params.item || params.row?.document;
        const actor = params.actor;
        // ... handle the command
      },
    },
  ]);
});
```

---

## 9. Summary: Key Points for Turn Prep

### For Item Context Menus:
Use standard `dnd5e.getItemContextOptions` hook with `group` property:
- Works for both Classic and Quadrone layouts
- Always use valid group IDs: `common`, `customize`, `sections`, `pins`, `be-careful`

### For Section Commands (Item List Headers/Footers):
Use `api.config.actorItem.registerSectionCommands()`:
- Called once on `tidy5e-sheet.ready` hook
- Applies to item section headers/footers
- Full access to actor and section data

### Important:
- The `group` property in context menu items **organizes visually** in the UI
- Section commands are **different** from context menu items
- Always check `item.isOwner` for permission-sensitive actions
- Use localization keys for text (e.g., `'DND5E.Delete'` instead of raw strings)

---

## References

- **API Types:** `src/api/api.types.ts` (lines 263-312)
- **ActorItemApi:** `src/api/config/actor-item/ActorItemApi.ts`
- **ActorItemRuntime:** `src/runtime/ActorItemRuntime.ts`
- **Context Menu Implementation:** `src/context-menu/tidy5e-item-context-menu-quadrone.ts`
- **Hooks:** `src/foundry/TidyHooks.ts`
