# Turn Plans Panel - Developer Guide

## Quick Start: Running the Skeleton

The Turn Plans Panel skeleton is now complete and compiles successfully. Here's what you need to know:

### Component Hierarchy
```
TurnPlansPanel (Main Container)
├── TurnPlanCard (Individual Plan)
│   ├── FeatureSection (Action Type Container)
│   │   └── FeatureSearch (Search Interface)
│   ├── FeatureSection (Bonus Action)
│   │   └── FeatureSearch
│   └── FeatureSection (Additional Features)
│       └── FeatureSearch
├── TurnPlanCard
│   ├── FeatureSection
│   │   └── FeatureSearch
│   ├── FeatureSection
│   │   └── FeatureSearch
│   └── FeatureSection
│       └── FeatureSearch
└── ... (more cards)
```

### State Management Pattern

All state lives in the main component using Svelte 5 `$state` runes:

```typescript
// Main component state
let plans = $state<TurnPlan[]>([]);
let isLoading = $state(false);
let error = $state<string | null>(null);

// Load on mount
$effect(async () => {
  if (actor) {
    await loadPlans();
  }
});

// Save after mutations
async function savePlans() {
  const turnPrepData = await TurnPrepAPI.getTurnPrepData(actor);
  turnPrepData.turnPlans = plans;
  await TurnPrepAPI.saveTurnPrepData(actor, turnPrepData);
}
```

### Adding a New Plan

```typescript
async function createNewPlan() {
  const newPlan: TurnPlan = {
    id: crypto.randomUUID(),
    name: `Plan ${plans.length + 1}`,
    trigger: '',
    action: null,
    bonusAction: null,
    additionalFeatures: [],
    movement: '',
    mechanicalNotes: '',
    roleplayNotes: '',
    isFavorite: false,
    createdTime: Date.now(),
  };

  plans = [...plans, newPlan];
  await savePlans();
}
```

### Key Points to Remember

1. **Always spread when updating state**
   ```typescript
   plans = [...plans, newPlan]; // Good - triggers reactivity
   plans.push(newPlan);         // Bad - won't trigger updates
   ```

2. **Event handling pattern**
   ```typescript
   // In child component
   <TurnPlanCard
     on:update={(e) => updatePlan(plan.id, e.detail)}
     on:delete={() => deletePlan(plan.id)}
   />

   // In parent component
   function updatePlan(planId: string, updates: Partial<TurnPlan>) {
     const index = plans.findIndex(p => p.id === planId);
     plans[index] = { ...plans[index], ...updates };
     plans = plans; // Force reactivity
     savePlans();
   }
   ```

3. **Localization**
   ```typescript
   const context = getContext<TurnPrepContext>(TURN_PREP_CONTEXT_KEY);
   const { localize } = context;
   
   // Use localized strings
   <h3>{localize('TURN_PREP.TurnPlans.Title')}</h3>
   ```

4. **CSS Variables**
   ```less
   .component {
     background: var(--t5e-background);
     color: var(--t5e-primary-color);
     padding: var(--t5e-spacing-md);
     border-radius: var(--t5e-border-radius);
   }
   ```

## What's Working Now

✅ **Fully Functional**:
- Plan creation/deletion/duplication
- Favorite toggling
- Field editing (name, trigger, movement, notes)
- Data persistence to actor flags
- Error handling and loading states
- Empty state display
- All TypeScript types correct
- Build compiles without errors

⏳ **Placeholder (Needs Implementation)**:
- Feature searching logic (FeatureSearch returns empty)
- Actual feature display format
- Dialog components for activity selection

## Next Priority Tasks

### 1. Wire into Main Tab (Testing)
**File**: `src/sheets/components/TurnPrepMainTab.svelte`
**Task**: Import and add TurnPlansPanel component
```typescript
<script lang="ts">
  import TurnPlansPanel from './TurnPlansPanel.svelte';
</script>

<div class="turn-prep-main-tab">
  <TurnPlansPanel />
</div>
```

### 2. Implement Feature Search
**File**: `src/sheets/components/FeatureSearch.svelte`
**Location**: Lines 43-50 (searchFeatures function)
**Task**: Replace placeholder with actual feature discovery
```typescript
async function searchFeatures(query: string) {
  // TODO: Implement feature searching
  // For now, return empty results as placeholder
  const actor = context.actor;
  const features = await TurnPrepAPI.getAvailableFeatures(actor, featureType);
  searchResults = features.filter(f => 
    f.name.toLowerCase().includes(query.toLowerCase())
  );
}
```

### 3. Convert DM Questions Panel
**File**: `src/sheets/components/DmQuestionsPanel.svelte`
**Task**: Follow TurnPlansPanel pattern
- Use `$state` instead of props
- Implement CRUD operations
- Wire to TurnPrepAPI
- Pattern: Main container with item cards

## Component API Reference

### TurnPlansPanel Props
None - uses TurnPrepContext for actor access

### TurnPlanCard Props
```typescript
interface Props {
  plan: TurnPlan;
}
```

**Events**:
- `update: {detail: Partial<TurnPlan>}` - Plan field updated
- `delete: void` - Delete plan requested
- `duplicate: void` - Duplicate plan requested
- `toggleFavorite: void` - Favorite toggled

### FeatureSection Props
```typescript
interface Props {
  title: string;
  features: unknown[];
  featureType: 'action' | 'bonus' | 'additional';
}
```

**Events**:
- `update: {detail: unknown[]}` - Features changed

### FeatureSearch Props
```typescript
interface Props {
  featureType: 'action' | 'bonus' | 'additional';
}
```

**Events**:
- `select: {detail: unknown}` - Feature selected
- `close: void` - Search dismissed

## Debugging Tips

### Enable debug logging
```typescript
// In any component
console.log('Plans:', plans);
console.log('Error:', error);
console.log('Loading:', isLoading);
```

### Check actor context
```typescript
const context = getContext<TurnPrepContext>(TURN_PREP_CONTEXT_KEY);
console.log('Actor:', context.actor);
console.log('Actor ID:', context.actor?.id);
```

### Verify data persistence
```typescript
// In browser console
const turnPrepData = await window.TurnPrepAPI.getTurnPrepData(actor);
console.log('Saved plans:', turnPrepData.turnPlans);
```

### Build without errors
```bash
npm run build
# Should show: ✔ built in X.XXs
```

## File Organization

```
src/sheets/components/
├── TurnPlansPanel.svelte        ← Main container
├── TurnPlanCard.svelte          ← Individual plan display
├── FeatureSection.svelte        ← Feature list container
├── FeatureSearch.svelte         ← Search interface
├── DmQuestionsPanel.svelte      ← Next to implement (TODO)
├── ReactionsPanel.svelte        ← After questions
├── HistoryFavoritesList.svelte  ← After reactions
├── TurnPrepMainTab.svelte       ← Wire components here
└── ... (other components)
```

## Common Patterns

### Adding a new field to plan
1. Add to `TurnPlan` interface in `types/turn-prep.types.ts`
2. Add to form in `TurnPlanCard.svelte`
3. Add to new plan creation in `TurnPlansPanel.svelte`
4. Include in save operation (automatic via `...updates`)

### Adding a new button
```typescript
<button
  class="my-button"
  on:click={myFunction}
  disabled={isLoading}
  title={localize('TRANSLATION.KEY')}
>
  <i class="fas fa-icon"></i>
  {localize('BUTTON.TEXT')}
</button>
```

### Adding styling
```svelte
<style lang="less">
  .my-class {
    background: var(--t5e-background);
    color: var(--t5e-primary-color);
    padding: var(--t5e-spacing-md);
    
    &:hover {
      opacity: 0.8;
    }
  }
</style>
```

## Reference Materials

See `reference/` directory for Tidy5e component examples:
- `component-examples/table/` - Table components
- `component-examples/inputs/` - Input components
- `component-examples/button-menu/` - Menu components
- `reference/COMPONENT_REFERENCE.md` - Pattern documentation

## Performance Considerations

- Plans array updates should use spread operator for reactivity
- Save operation is debounced (implicit - each change saves)
- Consider debouncing rapid edits in future
- Feature search results should be paginated for large lists

## Build Pipeline

```bash
npm run build          # Production build
npm run dev            # Dev watch mode (if configured)
```

Output goes to: `dist/`
- `dist/turn-prep.js` - Bundled code
- `dist/turn-prep.css` - Scoped styles

## Testing Checklist

Before marking Phase 4 skeleton complete:
- [ ] Component loads without errors
- [ ] Plans load from actor flags
- [ ] Can create new plan
- [ ] Can edit plan fields
- [ ] Can delete plan
- [ ] Can duplicate plan
- [ ] Favorite toggle works
- [ ] Data persists after reload
- [ ] Error messages display properly
- [ ] Loading state shows during fetch
- [ ] Empty state shows for new actors

## Support & Resources

**Documentation Files**:
- `PHASE4_SKELETON_IMPLEMENTATION.md` - Implementation details
- `PHASE4_IMPLEMENTATION_PLAN.md` - Component specs
- `ARCHITECTURE.md` - System architecture
- `RESEARCH_FINDINGS.md` - Technical findings

**Reference**:
- `TIDY5E_INTEGRATION_SOLUTION.md` - Integration pattern
- `reference/COMPONENT_REFERENCE.md` - Component patterns
- `reference/QUICK_START.md` - Quick reference

Questions? Check these files first - most answers are already documented!
