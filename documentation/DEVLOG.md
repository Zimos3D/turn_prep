# Daily Development Log & Checklist

## Phase 3 - COMPLETE ✅

### What We Built
- **Settings system** (settings.ts) - 2 world configuration options for edit history
- **Context menu integration** (ContextMenuHandler.ts) - 370+ lines with activity selection dialog
- **Roll discovery system** (RollHandler.ts) - 500+ lines with chat analysis, history snapshots, edit checkpoints
- **End-of-turn dialog** - Initiative hook system for plan selection
- **Edit history checkpoints** - Configurable restoration points (1-20, default 5)
- **Feature validation** - Auto-clean missing items from turn plans

### Completed Phase 3 Features
✅ **Settings Integration (init.ts + en.json)**
- editHistoryCheckpoints (world-level, range 1-20, default 5)
- allowPlayerEditHistory (world-level boolean, default true)
- Language strings for settings UI

✅ **Context Menu Handler (370+ lines)**
- "Add to Turn Prep" option on items in actor sheets
- Activity selection dialog with Font Awesome icons (fa-circle, fa-play, fa-exchange-alt)
- Smart routing: single activity auto-adds, multiple shows selection dialog
- Feature addition to turn plan fields by activation type
- User notifications and error handling

✅ **Roll Handler (500+ lines)**
- Chat message parsing for roll discovery
- Saving throw discovery and parsing
- History snapshot creation with embedded rolls and saves
- Edit checkpoint system (configurable, default 5 per plan)
- Plan restoration from previous checkpoints
- Missing feature detection and auto-cleanup
- Initiative hook registration for end-of-turn dialog

✅ **End-of-Turn Dialog System**
- Combat round change detection
- Combat turn change detection
- Plan selection dialog with radio buttons
- Automatic loading of selected plan to actor flags

### Phase 3 Design Decisions Implemented
- **Activity Selection Dialog**: Shows when item has multiple activation types, Font Awesome icons
- **Context Menu Routes**: Single activity → auto-add, multiple → selection dialog
- **Turn Plan Storage**: In actor flags with current plan and history
- **Edit History**: Checkpoints stored per-plan, configurable limit
- **Roll Discovery**: Chat-based with feature ID matching
- **Missing Features**: Auto-removed on plan load

### Testing Checklist (Phase 3)
- [x] Settings registered and accessible in Foundry
- [x] ContextMenuHandler self-registers on module ready
- [x] RollHandler self-registers on module ready
- [x] Initiative hooks properly registered
- [x] Module builds cleanly: 54.46 kB, 0 errors
- [ ] Manual testing in Foundry (Phase 4 testing with UI components)
- [ ] Activity selection dialog functional testing (with UI)
- [ ] Roll discovery accuracy testing (with UI)
- [ ] Edit checkpoint restore testing (with UI)

---

## Phase 2 - COMPLETE ✅

### What We Built
- **4 core data layer files** (TurnPrepData.ts, TurnPrepStorage.ts, FeatureSelector.ts, FeatureFilter.ts)
- **777 lines of TypeScript** implementing data persistence, feature querying, and filtering
- **Data validation & auto-correction** system for corrupted actor flags
- **Feature querying from D&D 5e Activities** (major discovery: items store features in activities collection)
- **Feature filtering & organization** utilities (grouping by activation type, sorting, searching, deduplication)
- **Public API expansion** with Phase 2 methods exposed globally for testing
- **Comprehensive testing suite** - all functionality validated in Foundry console

### Issues We Resolved
1. **Classes Not Exposed Globally** - Added Phase 2 classes and utilities to global scope in init.ts
2. **Zero Features Found** - Discovered D&D 5e uses `item.system.activities` Collection, not direct activation fields
3. **Activities System Misunderstanding** - Items can have multiple activities, each with its own `activation.type`
4. **Missing Utility Exports** - Added generateId, createTurnSnapshot, validateAndCorrectTurnPrepData to global exports
5. **Additional Features Field Too Restrictive** - Added getAllAvailableFeatures() for features without activation costs

### Critical Discovery: D&D 5e Activities System
**How it actually works:**
- Items store features in `item.system.activities` (a Foundry Collection)
- Each activity has: `activation.type`, `uses`, `cost`, and other properties
- Must iterate activities: `for (const activity of item.system.activities)`
- Extract activation type from each activity: `activity.activation.type`
- Items can have multiple activities with different activation types on the same item
- This applies to weapons, spells, feats, class features, and homebrew items

### Testing Checklist (All Passed ✅)
- [x] Feature query finds 14 features on test character
- [x] Features grouped correctly: 9 actions, 3 bonus actions, 1 reaction
- [x] Search functionality finds specific features (e.g., "sword")
- [x] Deduplication removes duplicate itemIds (14→11 after dedup)
- [x] Turn plan creation and persistence working
- [x] Snapshot creation and favorites persistence working
- [x] DM questions persistence working
- [x] Reactions creation and persistence working
- [x] Feature metadata retrieval accurate
- [x] Data validation with auto-correction working
- [x] All API methods accessible from console
- [x] Module builds cleanly: 53.12 kB, 0 errors

---

## Phase 1 - COMPLETE ✅

### What We Built
- **11 core files** implementing the foundation layer
- **41 TypeScript interfaces** for type-safe data structures
- **12 utility functions** for logging with Tidy 5E patterns
- **20+ validators** with auto-correction capabilities
- **25+ data utilities** (ID generation, cloning, merging, array operations)
- **20+ formatting functions** for UI display
- **40+ Foundry API methods** in FoundryAdapter
- **20+ public API methods** for external module integration
- **Settings system** with 3 configurable world settings
- **Custom error classes** for better debugging

### Issues We Resolved
1. **ES Module Compatibility** - symlink-module-build-dir.js needed ES imports, not CommonJS
2. **Module Discovery** - Moved module.json to public/ folder so Vite includes it in dist/
3. **Settings Registration** - Removed isReady() check (settings must register during init hook, before game is fully ready)
4. **Ready Hook Error** - Added try/catch for missing setting access and used SETTINGS constant

### Testing Checklist (All Passed ✅)
- [x] Module appears in Foundry module list
- [x] window.TurnPrepAPI is accessible
- [x] game.settings.get('turn-prep', 'enableTurnPrepTab') returns true
- [x] game.settings.get('turn-prep', 'allowDmViewPlayerTurnPrep') returns true
- [x] game.settings.get('turn-prep', 'historyLimit') returns 10
- [x] TurnPrepAPI.getModuleVersion() returns "1.0.0"
- [x] No errors in browser console on initialization

---

## Development Best Practices (Phase 1 Lessons)

### Before Starting Work

- [ ] Read the TODO comment in the file you're about to implement
- [ ] Check ARCHITECTURE.md if you need to understand the big picture
- [ ] Look at TODO.md for implementation order recommendations

## While Implementing

- [ ] Keep TypeScript strict mode happy (all types defined)
- [ ] Use existing utility functions (don't duplicate logic)
- [ ] Follow the patterns established in similar files
- [ ] Update localization (en.json) as you add new UI strings
- [ ] Add comments for complex logic

## Key Principles

✓ **Types First**: Define types before using them  
✓ **Utilities**: Create general-purpose helpers  
✓ **Separation of Concerns**: Data layer ≠ UI layer  
✓ **Localization**: All UI strings in en.json  
✓ **Error Handling**: Use logging utilities, not console.log  
✓ **Documentation**: Each TODO file explains what it does  

## Development Commands

```bash
# Install dependencies (first time only)
npm install

# Start development with hot reload
npm run dev

# Build for production
npm run build

# Link to Foundry (after npm run build)
npm run link-create
```

## Debugging TODOs

### Find specific TODOs:
```
Ctrl+Shift+F → "// TODO:" → Filter by file
```

### Common TODO Categories:
- **Types**: Define interfaces in turn-prep.types.ts
- **Methods**: Implement class methods in feature files
- **Components**: Build Svelte UI in sheets/components/
- **Integration**: Connect to Foundry/Tidy in sheets/*/

## File Checklist

Each file is complete when:
- [ ] All `// TODO:` comments are addressed
- [ ] Code compiles without TypeScript errors
- [ ] Uses proper logging (not console.log)
- [ ] Exported for use by other modules
- [ ] Has JSDoc comments for public APIs

## Testing in Foundry

1. Run `npm run dev` in terminal
2. Start Foundry (separate window/terminal)
3. Foundry will hot-reload your changes
4. Check browser console (F12) for errors

## Common Patterns to Follow

### Logging
```typescript
import { debug, warn, error } from 'src/utils/logging';
debug('Something happened', { data });
warn('Be careful!');
error('Something broke!');
```

### Storage
```typescript
import { TurnPrepStorage } from 'src/features/data/TurnPrepStorage';
const data = TurnPrepStorage.load(actor);
await TurnPrepStorage.save(actor, data);
```

### Localization
```typescript
import { FoundryAdapter } from 'src/foundry/FoundryAdapter';
const text = FoundryAdapter.localize('TurnPrep.TabName');
```

## Notes

- All files have TODO comments - use them!
- Each TODO describes the implementation requirement
- Files are organized by dependency (implement bottom-up or top-down)
- Check ARCHITECTURE.md for file-to-file relationships
