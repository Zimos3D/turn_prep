# Project Structure Summary

## Quick Overview

Your project now has a complete folder structure with placeholder files containing TODO comments.
**Total: 40+ files organized in logical layers**

## What's Ready

✅ Folder structure (all directories created)  
✅ Configuration files (package.json, tsconfig.json, vite.config.ts, svelte.config.js)  
✅ Module manifest (module.json)  
✅ Localization file (en.json with all UI strings)  
✅ Documentation (ARCHITECTURE.md, README.md, TODO.md)  
✅ Stylesheets (LESS file structure)  
✅ All source files with TODO comments  

## Files by Layer

### Foundation Layer (5 files)
- `src/constants.ts` - Module IDs and constants
- `src/types/turn-prep.types.ts` - All TypeScript interfaces
- `src/types/index.ts` - Type exports
- `src/utils/` - 4 utility files (logging, data, validation, formatting)
- `src/foundry/` - 2 Foundry integration files (adapter + types)

### Data Layer (2 files)
- `src/features/data/TurnPrepData.ts` - Data model definition
- `src/features/data/TurnPrepStorage.ts` - Persistence to actor flags

### Feature Layer (6 files)
- `src/features/context-menu/` - 2 files (handler + types)
- `src/features/feature-selection/` - 3 files (selector + filter + types)
- `src/features/roll-integration/` - 2 files (handler + types)

### UI Layer (6 components)
- `src/sheets/components/` - 6 Svelte components
  - DmQuestionsPanel.svelte
  - TurnPlansPanel.svelte
  - ReactionsPanel.svelte
  - FeatureSelectorWidget.svelte
  - RollButton.svelte
  - HistoryFavoritesList.svelte

### Sheet Integration (5 files)
- `src/sheets/tidy5e/` - 3 files (tab + sidebar tab + integration)
- `src/sheets/default/` - 3 files (tab + panel + integration)

### Core Layer (5 files)
- `src/settings/` - 2 files (settings.ts + types)
- `src/hooks/` - 3 files (init, ready, types)
- `src/api/TurnPrepApi.ts` - Public API

### Entry Point (1 file)
- `src/main.ts` - Module entry point

### Configuration (6 files)
- `module.json` - Foundry manifest
- `package.json` - Node dependencies
- `tsconfig.json` - TypeScript config
- `vite.config.ts` - Build config
- `svelte.config.js` - Svelte config
- `.gitignore` - Git configuration

### Localization (1 file)
- `public/lang/en.json` - English strings

### Styles (5 files)
- `styles/turn-prep.less` - Main stylesheet
- `styles/variables.less` - LESS variables
- `styles/components/` - 3 component stylesheets

### Documentation (4 files)
- `ARCHITECTURE.md` - Complete architecture guide
- `README.md` - Project readme
- `TODO.md` - Implementation tracking guide
- `Scope.md` - Requirements (existing)

## How to Use the TODO Comments

Each file has `// TODO:` comments describing what needs to be implemented.

### Find TODOs:
1. **In VS Code**: Press Ctrl+Shift+F (Find in Files)
2. **Search term**: `// TODO:`
3. **View results**: All TODOs appear in the search panel

### Example from a file:
```typescript
/**
 * Turn Prep Storage Layer
 * 
 * TODO: Implement storage class with methods:
 * - static async save(actor: Actor, data: TurnPrepData): Promise<void>
 * - static load(actor: Actor): TurnPrepData
 */
```

## Recommended Implementation Steps

**Start with:** `TODO.md` for ordered implementation plan

**General flow:**
1. Build foundation first (types, utils, adapters)
2. Implement data models and storage
3. Add feature logic
4. Build UI components
5. Integrate with sheets
6. Wire everything in init/ready hooks
7. Polish styling and test

## File Dependency Graph

```
main.ts (entry)
├── constants.ts
├── hooks/init.ts
│   ├── settings.ts
│   ├── TurnPrepApi.ts
│   └── FoundryAdapter.ts
└── hooks/ready.ts
    ├── sheets/tidy5e/tidy-sheet-integration.ts
    │   └── sheets/tidy5e/*.svelte
    ├── sheets/default/default-sheet-hooks.ts
    │   └── sheets/default/*.svelte
    └── features/context-menu/ContextMenuHandler.ts
        └── features/data/TurnPrepStorage.ts
            ├── features/data/TurnPrepData.ts
            └── types/turn-prep.types.ts
```

Implement in topological order (dependencies first).

## Next Steps

1. **Read TODO.md** for the recommended implementation order
2. **Start with Phase 1 (Foundation)** - types and utilities
3. **Work through phases** in order
4. **Use TODO comments** as implementation guides
5. **Test in Foundry** after Phase 5

## Questions?

- Check ARCHITECTURE.md for detailed explanations
- Each file's TODO comments describe what to implement
- Look at existing Foundry modules (especially Tidy 5E) for reference

Good luck! 🚀
