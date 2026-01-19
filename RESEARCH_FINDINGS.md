# Research Findings for Turn Prep Module

Research compiled from public documentation and source code analysis. This document guides Phase 1 implementation decisions.

---

## 1. Tidy 5E Sheets v12.2.2+ (Current target: v12+)

### Tab Registration API

**Sidebar Tabs vs Main Tabs:**
- **Character Sidebar Tabs**: `api.registerCharacterSidebarTab(tab, options)`
  - Appear in the sidebar (left panel) of character sheets
  - Perfect for "Turns" tab location (hourglass icon)
  - Returns `SvelteTab`, `HtmlTab`, or `HandlebarsTab`

- **Character Tabs**: `api.registerCharacterTab(tab, options)`
  - Appear in the main tab bar at top of sheet
  - Used for main content areas

**Tab Model Options:**
- `SvelteTab` - For Svelte components (recommended for our use case)
- `HtmlTab` - For static HTML
- `HandlebarsTab` - For templated content

**Common Options:**
```javascript
{
  includeAsDefaultTab: boolean,    // Default: true
  layout: 'all' | string[],         // Optional sheet layouts
  overrideExisting: boolean         // For replacing core tabs
}
```

### Integration Hook

**Access pattern:**
```javascript
Hooks.once('tidy5e-sheet.ready', (api) => {
  // api is available here
  // Register tabs, content, and header controls
});
```

Also available via: `game.modules.get('tidy5e-sheet').api`

### Styling & Customization

**Color System:**
- Tidy 5E has a customization panel allowing DMs to set tint colors
- Look at `api.config` for customization APIs (not fully detailed in initial docs)
- Use CSS variables that Tidy provides for theming consistency
- Follow Tidy's LESS/SCSS patterns for styling

**Key Constants:**
- `api.constants.SHEET_PART_ATTRIBUTE` = `"data-tidy-sheet-part"`
- `api.constants.SHEET_PARTS.*` - Extensive list of named sheet parts for CSS selectors
- Example: `api.constants.SHEET_PARTS.NAME_CONTAINER` for targeting actor name area

**Available Sheet Tabs (Tab IDs):**
- Character: `actions`, `attributes`, `biography`, `effects`, `features`, `inventory`, `journal`, `spellbook`
- NPC: `attributes`, `biography`, `effects`, `journal`, `spellbook`
- Group: `description`, `inventory`, `members`
- Vehicle: `attributes`, `biography`, `cargo`, `effects`

### Content Registration

**Three ways to inject content:**
1. **HtmlContent** - Direct HTML injection with selectors
2. **HandlebarsContent** - Templated HTML with re-rendering support
3. Via hooks - `renderActorSheet` or standard sheet render hooks

**Important for dynamic content:**
- Use `data-tidy-render-scheme="handlebars"` attribute for content that needs re-rendering
- Tidy will remove and re-render these elements when the sheet updates

### Code Patterns to Follow

**Async/Await:**
- Tidy uses async/await throughout
- Use try/catch for error handling (preferred over `.catch()`)

**Module Access:**
- Always use hooks first: `Hooks.once('tidy5e-sheet.ready', api => { ... })`
- Fallback to direct access: `game.modules.get('tidy5e-sheet').api`

**Logging:**
- Tidy uses standard browser console methods: `console.log()`, `console.warn()`, `console.error()`
- Check Tidy source for prefix patterns (appears to be module name based)
- No special logging library detected; use native console

**Error Handling:**
- Create custom error classes for specific error types
- Include context about what operation was being attempted
- Provide recovery suggestions where possible
- Use console.error for logging exceptions

### Breaking Changes / Version Compatibility

**Current Version: 12.2.2**
- Target v12+ (user specified)
- Tidy uses Application V2 (Foundry's newer application framework)
- Previous classic sheets are deprecated but may be supported

**Key Compatibility Info:**
- Tidy follows D&D 5e system versions closely
- Breaking changes typically happen when D&D 5e major version updates
- Tidy manifesto states it will adjust minimum version on breaking changes

### Svelte Integration

**Available Svelte utilities through API:**
```javascript
api.svelte.framework = {
  getContext,    // Access Tidy's svelte context
  setContext,    // Set context for integration
  mount,        // Mount svelte components
  unmount,      // Unmount svelte components
  SvelteMap,
  SvelteSet
}
```

**Recommendation:** Use `getContext` and `setContext` to access Tidy's context within our Svelte components

---

## 2. Foundry Core V13 & D&D 5e System v5+

### Target Versions

- **Foundry Core:** V13 (required by D&D 5e v5.2+)
- **D&D 5e System:** v5.1.x or v5.2.x (v5.2.0+ requires Foundry V13+)
  - Current stable: v5.2.4 (released Dec 2025)
  - Previous stable: v5.1.10 (works with Foundry V12, but we're using V13)
  - **Do not support:** v5.0.x or earlier

### Sheet Visibility & Permissions

**Regarding DM visibility concern:**
- Foundry Core has document-level ownership permissions: `CONST.DOCUMENT_OWNERSHIP_LEVELS`
- However, custom UI elements in sheets don't automatically respect these
- **Solution**: We must implement our own visibility checks using:
  ```javascript
  if (!actor.isOwner) {
    // Hide Turn Prep UI from non-owners (DMs viewing player sheets)
  }
  ```
- Check `actor.ownership[game.user.id]` or use `actor.isOwner` boolean
- Consider module setting to toggle DM visibility as secondary option

### D&D 5e System Details

**Activation Cost Values** (from user's HTML sample):
- Standard: `action`, `bonus`, `reaction`
- Time: `minute`, `hour`, `day`
- Rest: `longRest`, `shortRest`
- Combat: `encounter`, `turnStart`, `turnEnd`
- Monster: `legendary`, `mythic`, `lair`
- Vehicle: `crew`
- Special: `special`, `""` (none)

**Item Types in 5e System:**
- Actions, Bonus Actions, Reactions are properties on items (via `system.activation.type`)
- No special handling needed for item type filtering initially
- Features/spells/items all live in `actor.items`

**Getting items by activation cost:**
```javascript
// Confirmed approach (stable across 5.1 and 5.2)
actor.items.filter(item => item.system?.activation?.type === 'reaction')

// Get all action economy items
const actions = actor.items.filter(item => item.system?.activation?.type === 'action');
const bonusActions = actor.items.filter(item => item.system?.activation?.type === 'bonus');
const reactions = actor.items.filter(item => item.system?.activation?.type === 'reaction');

// Items without activation cost (no activation.type)
const noActivation = actor.items.filter(item => !item.system?.activation?.type);
```

**Stable Item Properties:**
- `item.id` - Unique identifier (stable for snapshots)
- `item.name` - Display name (safe to snapshot)
- `item.type` - Item type: 'spell', 'feature', 'equipment', 'loot', 'weapon', 'tool', 'consumable', etc.
- `item.system.activation.type` - Activation cost (safe to rely on)
- `item.img` - Icon/image path (safe to snapshot if needed)

**Safe to use without data migration:**
- All basic item properties above
- No breaking changes expected for activation cost in v5.x
- Item data structure has stabilized in v5.1+

### Breaking Changes Between 5e Versions

**CRITICAL: D&D 5e v5.2.0 Requires Foundry V13+**

The D&D 5e v5.2.0 release **ONLY supports Foundry Virtual Tabletop v13 and greater**. Older versions of the system do not work with Foundry V12.

**For v5.1.x -> v5.2.x Migration:**
- Vehicle data structure changed significantly (Dimensions, Creature Capacity, Crew & Passengers)
- Not automatically migrated - old data preserved but invisible
- Activities system enhanced with new visibility constraints
- No impact on activation costs (still use `system.activation.type`)

**Item Activation Structure (Stable):**
- Still accessed via `item.system.activation.type`
- Values remain consistent: `action`, `bonus`, `reaction`, etc.
- No changes expected in v5.x series for activation costs
- Safe to rely on: `actor.items.filter(item => item.system?.activation?.type === 'reaction')`

**Key Breaking Changes in v5.2.0:**
1. **Calendar Integration** - New calendar API integration (not relevant for Turn Prep)
2. **Activity & Effect Visibility** - Activities can now be hidden by level/criteria (may affect future feature selection)
3. **ApplicationV2 Conversion** - Vehicle sheets converted (doesn't affect character/item sheets we care about)
4. **Vehicle Data Restructuring** - Major changes to vehicle system (doesn't affect character items/features)

**Compatibility Recommendation:**
- Target D&D 5e v5.1.x or v5.2.x (both with Foundry V13+)
- Do NOT attempt to support earlier v5.0.x versions
- Item activation data structure is stable across 5.x
- No data migration needed for features/items/spells we care about

---

## 3. Code Patterns & Standards (Best Practices)

### TypeScript Configuration

- **Use strict null checks:** YES
  - Tidy uses TypeScript with strict mode
  - Prevents null/undefined errors at compile time

- **ESM Module Format:**
  - Modern ES modules (ES2022 target as per package.json)
  - Use `import`/`export` syntax

### Error Handling Strategy

**Recommendation (combining user input + Tidy patterns):**

1. **Create custom error class:**
   ```typescript
   class TurnPrepError extends Error {
     constructor(public operation: string, public context?: Record<string, any>) {
       super(`[TurnPrep] ${operation}`);
       this.name = 'TurnPrepError';
     }
   }
   ```

2. **Use try/catch + console.error:**
   ```typescript
   try {
     // operation
   } catch (error) {
     console.error(`[turn-prep] Failed at: ${operation}`, error);
     // Optionally notify user or recover
   }
   ```

3. **Data corruption handling:**
   - Attempt silent fix if possible
   - Log what was fixed
   - Provide rollback via backup (copy before modifying)
   - If fix fails, notify user with recovery instructions

### Code Style Recommendations

- **Naming conventions:** CamelCase for classes, camelCase for functions/variables
- **Module pattern:** Use classes for stateful logic, functions for utilities
- **Comments:** JSDoc for exported functions, inline for complex logic
- **File organization:** One primary export per file (as per ARCHITECTURE.md)

---

## 4. Local Development & Testing Environment

### Foundry Setup for Testing

**Recommended approach:**
1. Create separate Foundry installation for dev (different data folder than production)
2. Symlink module build output to Foundry modules folder
3. Use file watcher (Vite handles this) to auto-update on changes
4. Test with real actor data from test world

**Testing with Real Actor Data:**
- Create test characters with various features
- Test Turn Prep with:
  - Multiple action economy items
  - Different activation times
  - Items with no activation cost
  - Missing/deleted items (for snapshot loading tests)

### Debugging Tools

- **Browser DevTools:** Standard debugging for Svelte components
- **Foundry Console:** Access via F12 in Foundry, use `console.log()` statements
- **Module Reloading:** May need to refresh world or disable/enable module between changes

---

## 5. MidiQOL Integration

### Optional Leveraging Strategy

**Current Status:** MidiQOL is optional (not required)

**Potential Integration Points:**
1. **Detecting if MidiQOL is active:**
   ```javascript
   const midiQolActive = game.modules.get('midi-qol')?.active ?? false;
   ```

2. **Possible features (for future consideration):**
   - Automatically populate Turn Plans from MidiQOL action economy
   - Integration with MidiQOL's roll processing
   - Custom reactions based on MidiQOL events

**Phase 1 approach:** Detection code only, no actual integration. Implementation deferred to future phases.

---

## 6. Data Structure Finalization (from user answers)

### DM Questions Type

```typescript
interface DMQuestion {
  id: string;           // UUID for reference
  text: string;         // Question content
  createdTime: number;  // Timestamp for sorting
  tags: string[];       // Category tags (e.g., "safety", "tactical", "roleplay")
}
```

### Turn Plan Type

```typescript
interface TurnPlan {
  id: string;
  name: string;                      // User-given name (required)
  trigger: string;                   // Condition/context (serves as notes)
  action: string[];                  // Item IDs for actions
  bonusAction: string[];             // Item IDs for bonus actions
  movement: string;                  // Text description
  additionalFeatures: string[];      // Item IDs for modifying/supporting features
  categoryTags: string[];            // Organization tags (e.g., "Attack", "Healing")
  createdTime: number;               // Hidden timestamp for sorting
}
```

### Reaction Type

```typescript
interface Reaction {
  id: string;
  trigger: string;                   // Text trigger condition
  reactionFeatures: string[];        // Item IDs with activation type = "reaction"
  additionalFeatures: string[];      // Supporting features
  categoryTags?: string[];            // Optional categorization
}
```

### Snapshot Type (for History/Favorites)

```typescript
interface TurnSnapshot {
  id: string;
  planId?: string;                   // Reference to original plan (if applicable)
  name: string;                      // Captured name at time of snapshot
  createdTime: number;               // When this snapshot was created
  features: SnapshotFeature[];       // Snapshot of features used
  trigger?: string;                  // Captured trigger text (truncated in UI)
}

interface SnapshotFeature {
  itemId: string;                    // ID at time of snapshot
  itemName: string;                  // Name at time of snapshot
  itemType: string;                  // Type at time of snapshot
  actionType: string;                // Activation cost type
}
```

**Handling Missing Items on Load:**
- Check if referenced item still exists on actor
- If missing: highlight field with different color, change placeholder to show "Missing Feature"
- Allow player to replace and save updated snapshot

**Truncation in UI:**
- String fields (trigger) truncated with ellipsis if exceeding display width
- CSS text-overflow handling in Svelte component

---

## 7. Module Settings & Configuration

### Required Settings

1. **History limit** - Default: 10 (configurable by players)

### Planned Settings (future, but design now)

1. **DM Visibility Toggle** - Allow DMs to see/hide Turn Prep from players' sheets
   - Implementation: Check actor ownership in UI render
   - Setting: "Allow DMs to view Turn Preparation" (default: true for GM, false for players)

---

## 8. Implementation Guidelines Summary

### DO:
- ✅ Use async/await for all async operations
- ✅ Register via `tidy5e-sheet.ready` hook
- ✅ Use `api.constants.SHEET_PARTS` for selectors
- ✅ Use SvelteTab for custom tab content
- ✅ Follow Tidy's CSS patterns and variables
- ✅ Implement ownership checks for visibility
- ✅ Use console for logging with [module-name] prefix
- ✅ Use strict TypeScript null checks

### DON'T:
- ❌ Assume older Foundry/D&D 5e versions compatibility
- ❌ Rebuild Tidy functionality - use its APIs
- ❌ Rely on jQuery (Tidy is modern)
- ❌ Make MidiQOL a required dependency
- ❌ Assume DMs can't see custom sheet content (implement checks)

---

## 9. Foundry Virtual Tabletop v13 - Core Framework (Stable Release 13.351, Nov 12, 2025)

### ApplicationV2 Framework (Complete UI Overhaul)

**Key Changes:**
- All core applications migrated to ApplicationV2 (Foundry's new UI framework)
- Replaces deprecated AppV1 sheets
- Breaking change: Default actor/item sheet registrations removed - systems must register their own sheets
- Direct impact: Turn Prep tabs will work with AppV2 sheets

**Module/Sheet Integration:**
```javascript
// AppV2 sheets require explicit configuration
// Tidy 5E already provides AppV2 compatibility
// No additional changes needed for Turn Prep tab registration
```

### Actor Flags System (Critical for Data Storage)

**Flag Storage Confirmed Stable:**
- Actor.flags is the reliable API for Turn Prep data persistence
- Works directly with AppV2 actor sheets
- No breaking changes in v13 for flag system
- Full TypeScript support for flags via `actor.flags['turn-prep']`

**Data Ownership & Visibility:**
- `actor.isOwner` boolean available for DM/player visibility checks
- Turn Prep data stored on actor scope - respects ownership permissions
- DMs (with owner: 'gamemaster') can access actor.flags for all actors
- Implementation: Check `actor.isOwner` before rendering DM-only features

### Module Hooks System (Lifecycle)

**Foundry Core Hooks Stable:**
- `init` - Before ui initialization (register module features)
- `ready` - After ui fully loaded (start main module)
- `updateActor` - When actor data changes (sync Turn Prep data)
- `createCombatant` - When combat starts (initialize turn state)
- `combatStart` - When round starts (query reactions, plan turns)

**Hook Implementation Pattern:**
```javascript
Hooks.once('init', () => {
  // Register settings, define constants
});

Hooks.once('ready', () => {
  // Access game.actors, initialize data structures
});

Hooks.on('combatStart', () => {
  // Initialize turn prep when combat begins
});
```

### DocumentV2 API (Actor/Item Structure)

**Actor/Item Data Access:**
- `actor.items` collection for querying features
- `item.system` for game system data (D&D 5e activation costs)
- `actor.system` for actor-specific attributes
- Fully typed with TypeScript definitions available

**Ownership Model:**
- `actor.ownership` object containing user IDs and permission levels
- `document.can(action)` method for permission checks
  - `actor.can('update')` - Can modify this actor
  - `actor.can('view')` - Can see this actor (all users can see public actors)
- `actor.isOwner` is shorthand for ownership check

**Module Data Pattern (Recommended):**
- Store Turn Prep data in `actor.flags.['turn-prep']` scope
- Flags auto-persist to database without manual save
- Update via: `actor.update({'flags.turn-prep.data': value})`
- Query via: `actor.flags['turn-prep']` (direct property access)

### CSS Layers & Theming (UI Improvements)

**V13 UI Theme Changes:**
- Foundry now uses CSS Layers for core UI elements (easier customization)
- Light/Dark mode auto-detection from OS settings
- World-level theme override available in game settings
- Custom modules can target Foundry's CSS layers without high specificity

**Turn Prep Integration:**
- Tidy 5E already handles color theming
- No need to manually implement theme switching
- Use Tidy's CSS variables for consistency
- Custom colors via Tidy's customization panel

### Performance & Browser Support

**Framework Updates:**
- Complete removal of jQuery dependency (Tidy already modern)
- Node.js 20+ requirement for server-side Foundry
- Full ES2022 support in client-side code
- Improved performance across the board

**Module Compatibility:**
- Modules must be explicitly compatible with AppV2
- Tidy 5E v12+ is fully AppV2 compatible
- Turn Prep tabs work without modifications across all AppV2 sheets

### Document Validation & Type Safety

**TypeScript Integration:**
- Full type definitions available for Foundry core classes
- `ActorV2`, `ItemV2`, `SceneV2` types available
- `actor.flags` properly typed with declaration merging
- Safe navigation with strict null checks enabled

### Breaking Changes from V12 to V13

**Critical for Module Development:**
1. Default sheet registrations removed - sheets must register explicitly
2. AppV1 sheets deprecated (only AppV2 available for new code)
3. jQuery removed from core (use native DOM APIs)
4. Some hooks renamed/reorganized

**No Breaking Changes for Turn Prep:**
- Actor flags API unchanged
- Combat system unchanged
- Item query methods unchanged
- Hook system backward compatible

### Module Registration Lifecycle

**Correct V13 Pattern:**
```javascript
// manifest.json
{
  "esmodules": ["modules/turn-prep.mjs"],
  "version": "1.0.0",
  "compatibility": {
    "minimum": 13,
    "verified": 13.351,
    "maximum": "14"
  }
}

// main entry point
Hooks.once('init', () => {
  // Register module settings with game.settings.register()
  // Create module constants and enums
});

Hooks.once('ready', () => {
  // Initialize after Foundry + systems loaded
  // Set up module features
});
```

### Testing & Debugging

**Module Development Tools:**
- Compatibility Preview tool in setup menu shows v13 compatibility status
- Console logging unchanged (`console.log()` works as expected)
- Browser DevTools full support for Foundry's TypeScript code
- Module reload works via `game.reload()` in browser console

---

## 10. Remaining Research Needed

These will be addressed as implementation progresses:

- [ ] Exact CSS variable names from Tidy for color theming
- [x] Specific D&D 5e v5 breaking changes documentation (v5.2.0 confirmed, v5.1.x compatible)
- [x] Foundry Core V13 framework architecture (ApplicationV2, flags, hooks)
- [ ] Local Foundry dev instance setup (detailed guide)
- [ ] Tidy's ConfigApi for customization panel integration
- [ ] MidiQOL detailed API (if needed for Phase 3+)
- [ ] Specific item type filtering (which types have activation costs)

---

## 11. File References

**Key Tidy 5E Source Files to Study:**
- `src/api/Tidy5eSheetsApi.ts` - Main API class
- `src/api/models/` - SvelteTab, HtmlTab, HandlebarsTab implementations
- `src/styles/` - CSS/LESS patterns and variables

**Repository:** https://github.com/kgar/foundry-vtt-tidy-5e-sheets

**Foundry Core Resources:**
- Documentation: https://foundryvtt.com/docs/
- V13 Release Notes: https://foundryvtt.com/releases/13.341
- GitHub: https://github.com/foundryvtt/foundryvtt

---

**Last Updated:** January 19, 2026
**Status:** Ready for Phase 1 implementation
**Research Complete:** Tidy 5E v12+, D&D 5e v5+, Foundry Core V13
---

## D&D 5e System Additional Notes

**Release Timeline (from public releases):**
- v5.2.4: Dec 19, 2025 (latest stable)
- v5.2.0: Nov 27, 2025 (breaking changes - requires Foundry V13)
- v5.1.10: Oct 15, 2025 (last v5.1 release)

**System API Stability:**
- Item structure stable since v5.1.x
- Activation costs use consistent string-based IDs
- No data migrations needed for Turn Prep features
- Safe to query items via `actor.items` collection