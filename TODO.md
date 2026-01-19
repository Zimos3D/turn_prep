# TODO List - Implementation Tracking

This file tracks the implementation status of all major components.
Each TODO in code files corresponds to items in this list.

## Recommended Implementation Order

### Phase 1: Foundation (Core Infrastructure)
- [ ] Type definitions (turn-prep.types.ts)
- [ ] Utility modules (logging.ts, data.ts, validation.ts, formatting.ts)
- [ ] Foundry adapter (FoundryAdapter.ts)

### Phase 2: Data Layer (Storage & Models)
- [ ] Data models (TurnPrepData.ts)
- [ ] Data persistence (TurnPrepStorage.ts)
- [ ] Settings system (settings.ts)

### Phase 3: Features (Core Logic)
- [ ] Feature selection (FeatureSelector.ts, FeatureFilter.ts)
- [ ] Roll integration (RollHandler.ts)
- [ ] Context menu integration (ContextMenuHandler.ts)

### Phase 4: UI Components (Visual Layer)
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
