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

- **Foundry Core:** V13 (updated from initial V12)
- **D&D 5e System:** v5+ (user specified - no backwards compat needed)

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
// Likely approach
actor.items.filter(item => item.system?.activation?.type === 'reaction')
```

### Breaking Changes Between 5e Versions

**Need to research:** Specific breaking changes in v5+ D&D 5e system
- Assumption: Item structure is stable in `system.activation.type`
- Data migration may be needed if major changes occur
- Use `Hooks.on('ready')` to validate/migrate data on load

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

## 9. Remaining Research Needed

These will be addressed as implementation progresses:

- [ ] Exact CSS variable names from Tidy for color theming
- [ ] Specific D&D 5e v5 breaking changes documentation
- [ ] Local Foundry dev instance setup (detailed guide)
- [ ] Tidy's ConfigApi for customization panel integration
- [ ] MidiQOL detailed API (if needed for Phase 3+)

---

## 10. File References

**Key Tidy 5E Source Files to Study:**
- `src/api/Tidy5eSheetsApi.ts` - Main API class
- `src/api/models/` - SvelteTab, HtmlTab, HandlebarsTab implementations
- `src/styles/` - CSS/LESS patterns and variables

**Repository:** https://github.com/kgar/foundry-vtt-tidy-5e-sheets

---

**Last Updated:** January 19, 2026
**Status:** Ready for Phase 1 implementation
