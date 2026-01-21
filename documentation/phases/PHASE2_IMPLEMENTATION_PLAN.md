# Phase 2 Implementation Plan - Data Layer

**Status**: In Progress - Tab Integration Complete ✅  
**Based on**: User clarifications in PHASE2_CLARIFICATIONS.md  
**Files to create**: 2 core + 2 feature selection files  
**Last Updated**: Session 0 & 1 - Tab rendering fixed

---

## ⚠️ CRITICAL FINDING: Tidy5e Svelte Integration

### DO NOT Use SvelteTab with Our Compiled Components

**Problem**: Dual Svelte runtime conflict causes tab rendering failures.

**Root Cause**:
- Tidy5e bundles Svelte 5 runtime in their module
- Our module compiles Svelte components with its own Svelte 5 runtime
- Two runtimes conflict when Tidy5e tries to mount our components
- Errors: `first_child_getter undefined`, `appendChild HierarchyRequestError`

**Solution - Use HtmlTab Instead**:
```typescript
// ✅ CORRECT - Use HtmlTab with HTML strings
api.registerCharacterTab(
  new api.models.HtmlTab({
    title: 'Turn Prep',
    tabId: TAB_ID_MAIN,
    html: createMainTabHtml(),  // Returns HTML string
    enabled: (data: any) => true
  })
);

// ❌ WRONG - SvelteTab causes runtime conflicts
api.registerCharacterTab(
  new api.models.SvelteTab({
    component: MyCompiledSvelteComponent  // Will fail!
  })
);
```

**Future Option**: Use Tidy5e's `api.svelte.framework.mount()` to share their runtime.

**See**: `RESEARCH_FINDINGS.md` → "Tidy5e Svelte Integration" section for full details.

---

## Key Decisions (From Your Clarifications)

### Data Storage Strategy ✅
- **Storage Method**: Actor flags (actor.getFlag/setFlag)
- **Organization**: Use judgment + Tidy 5E standards
- **Persistence**: Auto-save after every change
- **No unsaved indicator needed**
- **Conflict resolution**: Atomic auto-save handles this
- **Backup/Recovery**: Skip for now (can revisit if needed)
- **Deleted favorites**: Permanent delete with "Are you sure?" dialog

### Feature Selection & Querying ✅
- **Feature types**: Show items by D&D 5e type (weapon, spell, feat, class feature)
- **Homebrew support**: Yes, show all items regardless of type
- **Display filter**: Group by activation cost (Action, Bonus Action, Reaction)
- **Feature display**: Show names, icons, activation costs
- **Filtering options**: By type, activation cost, equipped status, prepared status
- **Allow multiple features** per action/bonus action/reaction field

### Turn Plan Management ✅
- **Current turn plan**: Start blank, load via "Load Favorite" button
- **Plan naming**: Optional, auto-suggested based on features
- **Max length**: Reasonable default
- **Validation**: All features stored live, only store snapshots for history/favorites
- **Clear button**: Yes, to reset current plan

### History & Favorites ✅
- **When to snapshot**: On explicit "Save to Favorites" action
- **Snapshot data**: Feature IDs + names only (stored snapshot), live for current plan
- **Auto-grouping**: Yes, by category tags
- **Rename favorites**: Yes, allow renaming
- **Track metadata**: Optional (usage count, last used - can skip for Phase 2)
- **Deletion**: Permanent, but with confirmation dialog

### Sheet Integration ✅
- **Tab placement**: Main character sheet tab (like Attributes, Inventory)
- **Tidy 5E**: Hook into custom tab system, inherit theme colors
- **Default sheet**: New sheet tab (fallback for non-Tidy users)
- **Styling**: Inherit from Tidy 5E patterns and CSS variables

### Context Menu ✅
- **Appear on**: Inventory items, spells/abilities, class features (all item types)
- **Actions**: "Add to Turn Prep" → adds to current turn plan
- **Right-click in Turn Prep**: Remove feature, Save as favorite
- **Three-dot menu**: On each feature in plan (⋮ button)
  - Options: Remove, Save as favorite, Open item details
- **On snapshots**: Three-dot menu for Delete (with confirmation)

### Missing Feature Handling ✅
- **Display**: Different color + warning icon + disabled state
- **Placeholder**: "Missing: [Feature Name]"
- **Workflow**: Allow manual replacement, save modified plan as new favorite
- **No auto-suggest** (keep it simple)

### UI/UX Details ✅
- **Drag & drop**: Not for Phase 2 (can add later)
- **Text truncation**: Trigger/context truncated with tooltip on hover
- **Visual hierarchy**: Color + icons + grouping
- **Notifications**: On save, on error, on delete success
- **Icons**: Use Foundry/Tidy 5E standard icons

---

## Files to Create in Phase 2

### Core Files

#### 1. **src/features/data/TurnPrepData.ts**
**Responsible for**: Data model definition  
**Exports**: 
- `TurnPrepData` interface (actor's complete Turn Prep state)
- `TurnPlan` interface (current turn plan)
- `TurnSnapshot` interface (history/favorites snapshot)
- `SnapshotFeature` interface (stored feature in snapshot)
- Creator functions (createEmptyTurnPrepData, createTurnPlan, etc.)

**Key aspects**:
- Immutable data structures (for safety)
- Validation methods (isValid(), canSave())
- Deep clone on modifications
- Feature storage in snapshots (ID + name + type + action cost)
- Live feature references in current plan

#### 2. **src/features/data/TurnPrepStorage.ts**
**Responsible for**: Persistence to actor flags  
**Exports**:
- `static async save(actor: Actor, data: TurnPrepData): Promise<void>`
- `static async load(actor: Actor): Promise<TurnPrepData>`
- `static async clear(actor: Actor): Promise<void>`
- `static getSaveKey(): string` (FLAG_KEY constant)

**Key aspects**:
- Auto-save on every change
- Error handling with rollback
- Atomic operations (no partial saves)
- Data migration for future versions
- Logging all operations

### Feature Selection Files

#### 3. **src/features/feature-selection/FeatureSelector.ts**
**Responsible for**: Querying character's items and features  
**Exports**:
- `getAllSelectableFeatures(actor): Feature[]`
- `getFeaturesByType(actor, type): Feature[]`
- `getFeaturesByActivationType(actor, type): Feature[]`
- `getReactionFeatures(actor): Feature[]`
- `canUseFeature(actor, item): boolean`

**Key aspects**:
- D&D 5e item type awareness
- Support for homebrew items
- Equipped/prepared status checking
- Spell slot checking
- Feature availability validation

#### 4. **src/features/feature-selection/FeatureFilter.ts**
**Responsible for**: Filtering and organizing features  
**Exports**:
- `filterByActionType(features, type): Feature[]`
- `filterByItemType(features, type): Feature[]`
- `groupByActionType(features): Record<string, Feature[]>`
- `groupByCategory(features): Record<string, Feature[]>`
- `sortByName(features): Feature[]`

**Key aspects**:
- Multiple filter criteria
- Grouping logic
- Sorting logic
- Search/fuzzy matching

---

## Implementation Roadmap

### Step 1: Data Models
1. Create `TurnPrepData.ts` with interfaces
2. Define all data shapes (plan, snapshot, feature)
3. Create creator functions
4. Add validation methods

### Step 2: Data Persistence
1. Create `TurnPrepStorage.ts`
2. Implement save/load operations
3. Add error handling and logging
4. Test with real actor data

### Step 3: Feature Selection
1. Create `FeatureSelector.ts`
2. Query actor items by type
3. Check activation costs
4. Validate feature availability

### Step 4: Feature Filtering
1. Create `FeatureFilter.ts`
2. Filter by action type
3. Group by activation cost
4. Sort results

### Step 5: Integration Testing
1. Test data round-trip (save → load)
2. Test feature queries with various actor data
3. Test filtering and grouping
4. Verify no errors in console

---

## Data Structure (Finalized)

```typescript
// Current Turn Plan (stored in memory, lives on component)
interface TurnPlan {
  id: string;
  name?: string;
  trigger?: string; // Context/notes
  action: Feature[];
  bonusAction: Feature[];
  reaction: Feature[];
  additionalFeatures: Feature[];
  category?: string;
}

// Snapshot (stored to history/favorites)
interface TurnSnapshot {
  id: string;
  name?: string;
  trigger?: string;
  category?: string;
  createdAt: number;
  features: SnapshotFeature[];
}

// Feature in snapshot (what we store)
interface SnapshotFeature {
  itemId: string;
  name: string;
  type: string; // D&D 5e item type
  actionType: string; // action, bonus, reaction
}

// Feature in current plan (live reference)
type Feature = Item5e; // Direct reference to actor's item

// Complete actor Turn Prep data
interface TurnPrepData {
  dmQuestions: DMQuestion[];
  currentTurnPlan: TurnPlan;
  history: TurnSnapshot[];
  favorites: TurnSnapshot[];
}
```

---

## Testing Checklist (Phase 2 Completion)

### Data Model Tests
- [ ] Create empty Turn Prep data
- [ ] Validate fresh data structure
- [ ] Clone data without mutation
- [ ] Merge conflicting changes

### Storage Tests
- [ ] Save data to actor flag
- [ ] Load data from actor flag
- [ ] Data round-trip (save → load → save)
- [ ] Clear all data
- [ ] Handle missing actor gracefully

### Feature Selection Tests
- [ ] Query all items on actor
- [ ] Filter by D&D 5e type (weapon, spell, feat, etc.)
- [ ] Filter by activation cost (action, bonus, reaction)
- [ ] Handle actors with no items
- [ ] Handle items without activation costs
- [ ] Homebrew items display correctly

### Feature Filtering Tests
- [ ] Group by activation type
- [ ] Group by category
- [ ] Sort alphabetically
- [ ] Search/fuzzy match
- [ ] Empty result sets handled

### Integration Tests
- [ ] Load current plan from favorites
- [ ] Save current plan to favorites
- [ ] Add feature to current plan
- [ ] Remove feature from current plan
- [ ] Add/remove snapshots from history
- [ ] Delete favorite (with confirmation)

---

## Notes

- All code in Phase 2 should follow Phase 1 patterns
- Use existing utilities (don't duplicate)
- Log all major operations
- Add JSDoc comments
- Test with real Foundry actor data
- No UI components yet (Phase 3)
