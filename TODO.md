# TODO List - Implementation Tracking

This file tracks the implementation status of all major components.
Each TODO in code files corresponds to items in this list.

---

## Phase 1 Completion Summary ✅

**Status**: COMPLETE & TESTED IN FOUNDRY

**What was implemented:**
- 11 core files with 2000+ lines of TypeScript code
- 41 type definitions covering all Turn Prep data structures
- 70+ utility functions (data manipulation, logging, validation, formatting)
- 40+ Foundry API adapter methods for compatibility
- Full module initialization system with custom hooks
- Settings registration (3 configurable world settings)
- Public API (window.TurnPrepAPI) with 20+ methods
- Custom error handling classes (TurnPrepError, DataValidationError, FoundryError)

**Issues resolved during Phase 1:**
- Fixed ES module compatibility in symlink script
- Moved module.json to public folder for Vite build output
- Removed isReady() check from settings registration (settings must register during init hook)
- Added defensive error handling in ready hook for missing settings edge case
- Resolved all TypeScript compilation errors
- Module successfully linking and loading in Foundry with zero errors

**Testing completed:**
- ✅ Module appears in Foundry's module list
- ✅ window.TurnPrepAPI accessible in browser console
- ✅ All 3 settings registered and accessible
- ✅ No console errors on initialization
- ✅ Ready for Phase 2 development

---

## Recommended Implementation Order

### Phase 1: Foundation (Core Infrastructure) ✅ COMPLETE
- [x] Type definitions (turn-prep.types.ts) - 41 interfaces
- [x] Utility modules (logging.ts, data.ts, validation.ts, formatting.ts) - 70+ utilities
- [x] Foundry adapter (FoundryAdapter.ts) - 40+ methods
- [x] Hooks & initialization (init.ts, ready.ts, main.ts)
- [x] Public API (TurnPrepApi.ts) - 20+ methods
- [x] Type definitions for Foundry (foundry.types.ts)
- [x] Constants & settings (constants.ts)
- [x] Module manifest & linking working

## Phase 2: Data Layer (Storage & Models) ✅ COMPLETE
- [x] Data models (TurnPrepData.ts) - 92 lines
- [x] Data persistence (TurnPrepStorage.ts) - 165 lines
- [x] Feature selection (FeatureSelector.ts) - 310 lines via Activities discovery
- [x] Feature filtering (FeatureFilter.ts) - 210 lines
- [x] API integration with Phase 2 methods
- [x] Global exports for console access
- [x] Comprehensive testing - all features working

### Phase 3: Features Layer (Core Logic) ✅ COMPLETE
- [x] Settings system (settings.ts) - 2 world settings integrated
- [x] Context menu integration (ContextMenuHandler.ts) - \"Add to Turn Prep\" with Tidy5e
- [x] Roll integration (RollHandler.ts) - Roll discovery, snapshots, checkpoints
- [x] End-of-turn dialog - Saves current plan to history and clears
- [x] Edit history checkpoints - Configurable limit (default 10)
- [x] Missing feature detection - Auto-removes unavailable features
- [x] Comprehensive testing - PHASE3_QUICK_TEST.md with all tests verified

**Phase 3 Key Findings:**
- Hook registration must be explicit from ready.ts (not self-registered)
- Activity names from `activity.name`, not activation type labels  
- Reactions stored in `turnPrepData.reactions[]`, not in turn plans
- Roll matching via `msg.flags.dnd5e.activity.id` and `msg.flags.dnd5e.item.id`
- Chat messages use `msg.speaker.actor` for actor ID (not `msg.actor.id`)
- Foundry V13+ uses `msg.rolls[]` array (not `msg.roll` singular)

### Phase 4: UI Components (Visual Layer) 🔄 NEXT
- [ ] **PRIORITY**: Migrate activity selection dialog from Dialog (V1) to ApplicationV2 or Svelte component
  - Current: Using deprecated `Dialog` class in ContextMenuHandler.ts (line 343)
  - Deprecated since Foundry V13, will be removed in V16
  - Replace with either ApplicationV2 or proper Svelte dialog component
- [ ] Simple components first: RollButton, HistoryFavoritesList
- [ ] Input components: FeatureSelectorWidget
- [ ] Panel components: DmQuestionsPanel, ReactionsPanel
- [ ] Complex component: TurnPlansPanel

### Phase 5: Sheet Integration (Connection Layer)
- [ ] Tidy 5E integration (tidy-sheet-integration.ts)
- [ ] Tab components (TidyTurnPrepTab, TidyTurnsSidebarTab)
- [ ] Default sheet integration (default-sheet-hooks.ts)
- [ ] Default sheet components (DefaultTurnPrepTab, HistoryFavoritesPanel)

### Phase 6: Initialization (Glue)
- [ ] Hook handlers (init.ts, ready.ts)
- [ ] Main entry point (main.ts)
- [ ] Public API (TurnPrepApi.ts)

### Phase 7: Styling & Localization
- [ ] Stylesheet implementation
- [ ] Refinements based on visual feedback

### Phase 8: Polish & Testing
- [ ] Integration testing in Foundry
- [ ] Bug fixes and refinements
- [ ] Documentation

## Using the TODO System

### In VS Code
1. Install "TODO Highlight" extension or use built-in "TODO" search
2. Search for "TODO:" to jump between items
3. Each file has TODOs describing what needs to be implemented

### Tracking Progress
- Files are organized by layer (Foundation → Features → UI → Integration → Core)
- Complete files in recommended order for minimal dependencies
- Mark TODOs as completed (remove or rename to DONE)

## Quick Status Check

Run this search in VS Code to see all incomplete TODOs:
- Regex: `// TODO:` (matches all TODO comments)
- Shows count of remaining work items

## Dependencies Between Layers

```
Foundation
    ↓
Data Layer
    ↓
Features
    ↓
UI Components
    ↓
Sheet Integration
    ↓
Initialization
```

Start with Foundation and work downward - files in upper layers don't depend on lower layers.
