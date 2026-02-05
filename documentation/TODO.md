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

### Phase 4: UI Components (Visual Layer) 🔄 IN PROGRESS

**Current Status**: Session 3+ - Main Turn Prep tab is functional; sidebar is built (pending favorites edit mode); Svelte HtmlTab mounting pattern confirmed.

**Major Discovery**: Found the "Item Piles" pattern for Svelte + Tidy5e integration!
- ✅ CAN use Svelte 5 with Tidy5e (bundle own runtime + manual mount)
- ❌ CANNOT use SvelteTab (dual runtime conflict)
- ❌ CANNOT externalize Svelte (compiler doesn't generate imports)
- ❌ CANNOT import Tidy5e's internal components (not exported)
- ✅ MUST use HtmlTab + container div + `mount()` in onRender
- ✅ MUST scope CSS with unique hash (cssHash config in vite)

**Work Completed** ✅ (Sessions 0-3+):
- [x] **CRITICAL**: Research Tidy5e Svelte integration options
- [x] Discovered Item Piles pattern - HtmlTab + manual mount
- [x] Updated vite.config.ts with cssHash for scoped styles
- [x] Created initial tab registration with HtmlTab
- [x] TurnPlansPanel, TurnPlanCard, FeatureSection, and FeatureSearch wired into the main Turn Prep tab
- [x] ReactionsPanel and DM Questions panel added to the main tab
- [x] Tidy5e tab registration (main + sidebar) confirmed with HtmlTab + mount()
- [x] History/Favorites sidebar panel implemented with load, delete, duplicate, and favorite toggle
- [x] Verified build success (144 modules, 184.59 kB output)
- [x] Documentation created (PHASE4_SKELETON_IMPLEMENTATION.md)

**Remaining Phase 4 Tasks**:
- [ ] Implement edit panels for turn/reaction favorites: editable fields, remove features, header Save (disk) + Cancel (X), context menu limited to Save/Cancel, unsaved-changes prompt, titles “Edit Turn Plan” / “Edit Reaction Plan”
- [ ] Localization and LESS polish pass across main tab and sidebar
- [ ] Manual QA sweep (feature search, drag/drop, duplicate/delete confirmations, DM question save/send)

**See Documentation**:
- `TIDY5E_INTEGRATION_SOLUTION.md` - Complete working pattern
- `PHASE4_IMPLEMENTATION_PLAN.md` - Updated with warnings about what doesn't work

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
