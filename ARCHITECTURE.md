# Turn Prep Module - Architecture Overview

**Phase 1 Status**: ✅ COMPLETE - Foundation layer fully implemented and tested in Foundry
**Current Phase**: 🔄 Phase 2 - Data Layer (in development)

This document provides a comprehensive overview of the module's architecture, file structure, and how components interact to build the complete system.

## Project Goals Recap

Build a Foundry VTT module that integrates with **Tidy 5E Sheets** (with fallback to default D&D 5E sheets) to help players prepare their turn in advance, including:
- DM Questions panel
- Turn Plans with feature selection
- Reactions panel
- History & Favorites tracking

---

## Technology Stack

- **Language**: TypeScript (compiled to JavaScript ES2022)
- **Frontend Framework**: Svelte 5 (reactive components)
- **Build Tool**: Vite (fast development builds)
- **Styling**: LESS/CSS
- **Module API**: Foundry VTT module system with hooks
- **Sheet Integration**: Tidy 5E Sheets API + Default D&D 5E sheet fallback

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Foundry VTT Game                         │
├─────────────────────────────────────────────────────────────┤
│  Character Sheet (Tidy 5E or Default D&D 5E)               │
│  ├── Main Tab: "Turn Prep"                                 │
│  │   ├── DM Questions Panel                                │
│  │   ├── Turn Plans Panel                                  │
│  │   └── Reactions Panel                                   │
│  └── Sidebar Tab: "Turns" (Tidy 5E only)                   │
│      ├── Favorite Turns (reorderable)                      │
│      └── Turn History (10 limit, configurable)             │
├─────────────────────────────────────────────────────────────┤
│  Context Menu Integration                                   │
│  (Right-click on items/spells/features)                    │
│  └── "Prepare for Next Turn" option                        │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│         Turn Prep Module (turn-prep module)                │
├─────────────────────────────────────────────────────────────┤
│  Core Features:                                             │
│  ├── Data Management (Actor flags storage)                 │
│  ├── Sheet Tab Registration (main tab)                     │
│  ├── Sidebar Tab Registration (Tidy 5E only)              │
│  ├── Context Menu Hooks                                    │
│  ├── Feature Selection (from character's items)            │
│  ├── Roll Integration (native Foundry rolls)               │
│  └── Settings (history limit, etc.)                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Folder Structure

```
turn-prep/
├── 📋 module.json                          [Module manifest]
├── 📋 package.json                         [Node.js dependencies]
├── 📋 tsconfig.json                        [TypeScript config]
├── 📋 svelte.config.js                     [Svelte config]
├── 📋 vite.config.ts                       [Vite build config]
├── 📋 ARCHITECTURE.md                      [This file]
├── 📋 Scope.md                             [Requirements document]
│
├── 📁 src/                                 [Source code root]
│   │
│   ├── 📁 main.ts                          [Module entry point]
│   │
│   ├── 📁 constants.ts                     [Module constants & IDs]
│   │
│   ├── 📁 api/                             [Custom module API]
│   │   └── TurnPrepApi.ts                  [Public API for other modules]
│   │
│   ├── 📁 features/                        [Feature implementations]
│   │   ├── 📁 data/
│   │   │   ├── TurnPrepData.ts             [Data model for turn prep]
│   │   │   └── TurnPrepStorage.ts          [Persists data to actor flags]
│   │   │
│   │   ├── 📁 context-menu/
│   │   │   ├── ContextMenuHandler.ts       [Right-click menu integration]
│   │   │   └── context-menu.types.ts       [Context menu types]
│   │   │
│   │   ├── 📁 feature-selection/
│   │   │   ├── FeatureSelector.ts          [Queries character's items/features]
│   │   │   ├── FeatureFilter.ts            [Filters by action type, etc.]
│   │   │   └── feature-selection.types.ts
│   │   │
│   │   └── 📁 roll-integration/
│   │       ├── RollHandler.ts              [Hooks into Foundry roll system]
│   │       └── roll-integration.types.ts
│   │
│   ├── 📁 sheets/                          [Sheet tab components]
│   │   ├── 📁 tidy5e/
│   │   │   ├── TidyTurnPrepTab.svelte      [Main turn prep tab (Tidy)]
│   │   │   ├── TidyTurnsSidebarTab.svelte  [Sidebar tab (Tidy only)]
│   │   │   └── tidy-sheet-integration.ts   [Registers with Tidy API]
│   │   │
│   │   ├── 📁 default/
│   │   │   ├── DefaultTurnPrepTab.svelte   [Main turn prep tab (default)]
│   │   │   ├── HistoryFavoritesPanel.svelte[Side panel (default only)]
│   │   │   └── default-sheet-hooks.ts      [Hooks into default sheet]
│   │   │
│   │   └── 📁 components/
│   │       ├── DmQuestionsPanel.svelte     [DM questions UI]
│   │       ├── TurnPlansPanel.svelte       [Turn plans UI]
│   │       ├── ReactionsPanel.svelte       [Reactions UI]
│   │       ├── FeatureSelectorWidget.svelte[Reusable feature picker]
│   │       ├── RollButton.svelte           [Reusable roll button]
│   │       └── HistoryFavoritesList.svelte [Turn history/favorites UI]
│   │
│   ├── 📁 settings/                        [Module settings]
│   │   ├── settings.ts                     [Setting definitions]
│   │   └── settings.types.ts               [Setting types]
│   │
│   ├── 📁 hooks/                           [Foundry hook handlers]
│   │   ├── init.ts                         [Hooks.on('init')]
│   │   ├── ready.ts                        [Hooks.on('ready')]
│   │   └── hooks.types.ts
│   │
│   ├── 📁 foundry/                         [Foundry API adapters]
│   │   ├── FoundryAdapter.ts               [Foundry compatibility layer]
│   │   └── foundry.types.ts                [Foundry type definitions]
│   │
│   ├── 📁 utils/                           [Utility functions]
│   │   ├── data.ts                         [Data manipulation helpers]
│   │   ├── logging.ts                      [Console logging utilities]
│   │   ├── validation.ts                   [Data validation]
│   │   └── formatting.ts                   [String/number formatting]
│   │
│   └── 📁 types/                           [Type definitions]
│       ├── turn-prep.types.ts              [Main type definitions]
│       └── index.ts                        [Type exports]
│
├── 📁 public/                              [Static assets]
│   ├── 📁 assets/
│   │   ├── icons/                          [Custom icons]
│   │   └── images/                         [Module images]
│   │
│   └── 📁 lang/                            [Localization files]
│       ├── en.json                         [English strings]
│       └── [other-lang].json               [Other languages]
│
├── 📁 styles/                              [Stylesheet files]
│   ├── turn-prep.less                      [Main styles]
│   ├── components/
│   │   ├── panels.less
│   │   ├── buttons.less
│   │   └── inputs.less
│   └── variables.less                      [LESS variables & theme]
│
├── 📁 dist/                                [Built output (generated)]
│   ├── module.json
│   ├── turn-prep.js
│   ├── turn-prep.css
│   ├── lang/
│   ├── assets/
│   └── ...
│
└── 📁 node_modules/                        [Dependencies (ignored in git)]
```

---

## Key Files Explained

### 1. **module.json** (Module Manifest)
The manifest file that tells Foundry about your module.
```json
{
  "id": "turn-prep",
  "title": "Turn Prep - D&D 5e Turn Preparation Module",
  "description": "Helps players prepare their turn in advance...",
  "version": "1.0.0",
  "compatibility": {
    "minimum": "12",
    "verified": "12"
  },
  "relationships": {
    "systems": [
      { "id": "dnd5e", "type": "system" }
    ],
    "optional": [
      { "id": "tidy5e-sheet", "type": "module" }
    ]
  },
  "esmodules": ["src/main.ts"],
  "styles": ["styles/turn-prep.less"],
  "languages": [
    { "lang": "en", "name": "English", "path": "public/lang/en.json" }
  ]
}
```

### 2. **src/main.ts** (Entry Point)
First file executed when module loads. Sets up everything.
```typescript
// Pseudo code structure
import { initializeModule } from './hooks/init';
import { readyModule } from './hooks/ready';

Hooks.on('init', initializeModule);
Hooks.on('ready', readyModule);
```

### 3. **src/constants.ts** (Module Constants)
Centralized IDs and constants used throughout.
```typescript
export const TURN_PREP_CONSTANTS = {
  MODULE_ID: 'turn-prep',
  TAB_ID_MAIN: 'turn-prep-main',
  TAB_ID_SIDEBAR_TURNS: 'turn-prep-sidebar-turns',
  FLAG_KEY_TURN_PREP_DATA: 'turnPrepData',
  // ... more constants
};
```

### 4. **src/features/data/TurnPrepData.ts** (Data Model)
Defines the structure of all turn prep data.
```typescript
export interface TurnPrepData {
  dmQuestions: Question[];
  turnPlans: TurnPlan[];
  reactions: Reaction[];
  history: TurnSnapshot[];
  favorites: TurnSnapshot[];
}

export interface TurnPlan {
  id: string;
  action: { itemId: string; itemName: string };
  bonusAction: { ... };
  movement: string;
  trigger: string;
  roleplay: string;
  additionalFeatures: Feature[];
}
```

### 5. **src/features/data/TurnPrepStorage.ts** (Persistence)
Handles saving/loading data to actor flags.
```typescript
export class TurnPrepStorage {
  static save(actor: Actor, data: TurnPrepData): Promise<void>
  static load(actor: Actor): TurnPrepData
  static clear(actor: Actor): Promise<void>
}
```

### 6. **src/sheets/tidy5e/TidyTurnPrepTab.svelte** (Main Tab)
The main Tidy 5E Turn Prep tab component.
- Uses Tidy 5E's `registerCharacterTab()` API
- Renders the three panels: DM Questions, Turn Plans, Reactions
- Handles interactions and updates data

### 7. **src/sheets/tidy5e/TidyTurnsSidebarTab.svelte** (Sidebar Tab)
The Tidy 5E sidebar "Turns" tab for History & Favorites.
- Uses Tidy 5E's `registerCharacterSidebarTab()` API
- Reorderable favorites list
- Limited history entries
- Load buttons to restore previous turns

### 8. **src/sheets/default/DefaultTurnPrepTab.svelte** (Default Sheet)
Similar to Tidy tab but for default D&D 5E sheet.
- Includes collapsible panel for History & Favorites (Tidy has this in sidebar)

### 9. **src/features/context-menu/ContextMenuHandler.ts** (Context Menu)
Integrates with Foundry's right-click context menu.
- Listens for context menu creation on actor items
- Adds "Prepare for Next Turn" option
- Calls appropriate handlers based on item type

### 10. **src/features/feature-selection/FeatureSelector.ts** (Feature Query)
Queries the character's items and activities to find features by action cost.

**Critical Implementation Detail (Phase 2 Discovery):**
The D&D 5e system stores feature activation costs in an **Activities Collection** on each item, not at the item level. Must iterate `item.system.activities` and check each activity's `activation.type`.

```typescript
// CORRECT approach: iterate activities collection
for (const item of actor.items) {
  for (const activity of item.system.activities) {
    if (activity.activation?.type === 'action') {
      // Found action cost feature
      features.push({ itemId: item.id, itemName: item.name, actionType: 'action' });
    }
  }
}

// Get all action features
getFeaturesByActivationType(actor, 'action')

// Get all bonus action features
getFeaturesByActivationType(actor, 'bonus')

// Get all reaction features
getFeaturesByActivationType(actor, 'reaction')

// Get ALL features regardless of action cost
getAllAvailableFeatures(actor)
```

### 11. **src/hooks/init.ts** & **src/hooks/ready.ts** (Hook Handlers)
- **init**: Runs early, sets up API, settings definitions
- **ready**: Runs after game loads, registers sheets, hooks, context menus

---

## Data Flow Diagram

### When user opens character sheet:
```
1. Sheet renders
2. Main "Turn Prep" tab loads
3. TurnPrepStorage.load(actor) retrieves data from actor.flags
4. Components render with current data
5. Data displayed to user
```

### When user adds feature from context menu:
```
1. User right-clicks a spell/feature on another tab
2. ContextMenuHandler detects the click
3. Determines feature type (Action/Bonus Action/Other)
4. Calls TurnPrepStorage to add feature to appropriate field
5. Storage saves to actor.flags
6. Sheet component updates (Svelte reactivity)
7. UI refreshes with new feature
```

### When user saves a turn as favorite:
```
1. User clicks "Save as Favorite" button
2. TurnPlansPanel creates TurnSnapshot
3. Adds to favorites array in TurnPrepData
4. TurnPrepStorage.save() persists to actor
5. TidyTurnsSidebarTab updates favorite list
```

---

## Integration Points

### With Tidy 5E Sheets
- **Hook**: `Hooks.on('tidy5e-sheet.ready', (api) => { ... })`
- **API Usage**: 
  - `api.registerCharacterTab()` - Register main tab
  - `api.registerCharacterSidebarTab()` - Register sidebar tab

### With Default D&D 5E Sheet
- **Hook**: `Hooks.on('ready', () => { ... })`
- **Method**: Inject custom sheet via `Actors.registerSheet()` or hook into existing sheet

### With Context Menus
- **Hook**: `Hooks.on('getActorSheetContextMenuItems', (items, html, actor) => { ... })`
- **Logic**: Add menu items to the context menu

### With Actor Data
- **Storage Location**: `actor.flags['turn-prep'].turnPrepData`
- **No DB modifications**: Only uses flags, which are part of actor document

---

## Settings

Settings stored in game.settings. Users can configure:

1. **History Limit** (scope: world, default: 10)
   - Maximum number of entries to keep in turn history
   - Setting ID: `turn-prep.historyLimit`

---

## Component Hierarchy

```
TidyTurnPrepTab.svelte (or DefaultTurnPrepTab.svelte)
├── DmQuestionsPanel.svelte
│   └── QuestionInput.svelte (repeating)
├── TurnPlansPanel.svelte
│   └── TurnPlanCard.svelte (repeating)
│       ├── FeatureSelectorWidget.svelte (for Action)
│       ├── FeatureSelectorWidget.svelte (for Bonus Action)
│       └── FeatureSelectorWidget.svelte (for Additional Features)
│           └── RollButton.svelte
└── ReactionsPanel.svelte
    └── ReactionCard.svelte (repeating)

TidyTurnsSidebarTab.svelte
├── FavoriteTurnsList.svelte
│   └── TurnSnapshotItem.svelte (repeating, draggable)
└── HistoryTurnsList.svelte
    └── TurnSnapshotItem.svelte (repeating)
```

---

## Build and Development Workflow

### Development (with hot reload):
```bash
npm install              # Install dependencies
npm run prepare-dev      # Prepare dev environment
npm run link-create      # Symlink to Foundry modules folder
npm run dev              # Start dev server with HMR
```

### Production Build:
```bash
npm run build            # Build production bundle
# Output goes to: dist/
```

### File Output:
- TypeScript compiled to `dist/turn-prep.js`
- LESS compiled to `dist/turn-prep.css`
- Static assets copied to `dist/`
- module.json copied to `dist/`

---

## Type Safety

All code uses TypeScript for type safety:

- **`src/types/turn-prep.types.ts`**: Main type definitions
- **`src/foundry/foundry.types.ts`**: Foundry API types
- **`src/features/*/**.types.ts`**: Feature-specific types

This provides IDE autocompletion and compile-time error checking.

---

## Localization

Strings are stored in language files (`public/lang/en.json`):
```json
{
  "TurnPrep.TabName": "Turn Prep",
  "TurnPrep.DmQuestions.Label": "DM Questions",
  "TurnPrep.TurnPlans.Label": "Turn Plans",
  "TurnPrep.Reactions.Label": "Reactions",
  ...
}
```

Usage in code:
```typescript
import { FoundryAdapter } from 'src/foundry/FoundryAdapter';
const label = FoundryAdapter.localize('TurnPrep.TabName');
```

---

## Best Practices Applied

✅ **Modular Code**: Each feature in its own folder  
✅ **Separation of Concerns**: Data, UI, logic separate  
✅ **Type Safety**: Full TypeScript coverage  
✅ **Localization**: All UI strings localized  
✅ **Settings**: Configurable options for users  
✅ **API Compatibility**: Works with Tidy 5E API + hooks  
✅ **Data Persistence**: Uses actor.flags (no database modification)  
✅ **Error Handling**: Logging and graceful degradation  
✅ **Reactive UI**: Svelte reactivity for updates  

---

## Next Steps

1. Create folder structure
2. Implement core files (main.ts, constants.ts)
3. Build data models (TurnPrepData)
4. Create UI components (panels, selectors)
5. Implement sheet integration (Tidy + default)
6. Add context menu integration
7. Test in Foundry

---

## Notes for Learning

This architecture follows industry-standard patterns:
- **MVC-like separation**: Models (data), Views (Svelte components), Controllers (handlers)
- **Reactive programming**: Svelte's reactivity + Foundry's hook system
- **API design**: Public API for other modules to extend
- **Modular organization**: Easy to find and modify features
- **Testing friendly**: Each feature can be tested independently

The code is organized so you can understand each part without needing to know the whole system at once. Start with data models → UI → integration logic.
