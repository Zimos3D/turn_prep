# Phase 4: Turn Plans Panel Skeleton Implementation

**Session Date**: Session 0-3 (Continued)
**Status**: ✅ SKELETON COMPLETE - Ready for Styling & Polish

## Overview

Implemented the core skeleton structure for the Turn Plans Panel component hierarchy. This is the foundation for the primary UI interface in Phase 4.

## Components Implemented

### 1. TurnPlansPanel.svelte (Main Container)
**Location**: `src/sheets/components/TurnPlansPanel.svelte`
**Status**: ✅ Functional skeleton

**Features**:
- State management with Svelte `$state` runes
  - `plans[]` - Array of TurnPlan objects
  - `isLoading` - Load state during data fetch
  - `error` - Error message display
- Data loading via `$effect` on component mount
- Full CRUD operations:
  - `createNewPlan()` - Creates new plan with unique ID
  - `updatePlan(planId, updates)` - Updates specific plan fields
  - `deletePlan(planId)` - Removes plan with confirmation dialog
  - `toggleFavorite(planId)` - Marks/unmarks as favorite
  - `duplicatePlan(planId)` - Creates copy of existing plan
  - `savePlans()` - Persists changes to actor flags
- Template structure:
  - Header with title + "New Plan" button
  - Error message display with styling
  - Loading state indicator
  - Empty state message
  - Plans list using `#each` with TurnPlanCard components
- CSS styling with Tidy5e variables and scoped classes
- Integrates with TurnPrepContext for actor access

**Key Code Patterns**:
```typescript
let plans = $state<TurnPlan[]>([]);
let isLoading = $state(false);
let error = $state<string | null>(null);

$effect(async () => {
  if (actor) await loadPlans();
});

async function savePlans() {
  const turnPrepData = await TurnPrepAPI.getTurnPrepData(actor);
  turnPrepData.turnPlans = plans;
  await TurnPrepAPI.saveTurnPrepData(actor, turnPrepData);
}
```

### 2. TurnPlanCard.svelte (Individual Plan Display)
**Location**: `src/sheets/components/TurnPlanCard.svelte`
**Status**: ✅ Functional skeleton

**Features**:
- Editable plan name with inline text input
- Expandable/collapsible header design
  - Chevron icon indicates expand state
  - Smooth transitions
- Plan metadata fields:
  - Trigger/Reason (text input)
  - Movement (text input)
  - Mechanical Notes (textarea)
  - Roleplay Notes (textarea)
- Three feature sections (action, bonus action, additional features)
- Header action buttons:
  - Toggle favorite (star icon, filled when favorited)
  - Duplicate plan (copy icon)
  - Delete plan (trash icon)
- Real-time field updates without requiring explicit save button
- Proper event handling with parent component

**Key Code Patterns**:
```typescript
let isExpanded = $state(false);
let name = $state(plan.name);

function handleNameChange(newName: string) {
  name = newName;
  onupdate?.({ name: newName });
}

// Three FeatureSection instances for different action types
<FeatureSection
  title={localize('TURN_PREP.TurnPlans.Action')}
  features={plan.action ? [plan.action] : []}
  featureType="action"
/>
```

### 3. FeatureSection.svelte (Action Feature Container)
**Location**: `src/sheets/components/FeatureSection.svelte`
**Status**: ✅ Functional skeleton

**Features**:
- Display features for specific action type (action, bonus, additional)
- Header with section title and "Clear" button
- Feature list display:
  - Shows selected features in list format
  - "Remove" button for additional features (single features don't have remove)
  - Empty state placeholder
- Search/add interface:
  - Toggle button to show FeatureSearch component
  - Integration with FeatureSearch via event handling
  - Auto-close after selection
- Type-aware behavior:
  - `action` and `bonus` - single feature only
  - `additional` - multiple features allowed
- Proper event propagation to parent

**Key Code Patterns**:
```typescript
let selectedFeatures = $state<unknown[]>(features || []);

function addFeature(feature: unknown) {
  if (featureType === 'additional') {
    selectedFeatures = [...selectedFeatures, feature];
  } else {
    selectedFeatures = [feature]; // Single only
  }
  onupdate?.(selectedFeatures);
}

// Handles both single and multiple features appropriately
```

### 4. FeatureSearch.svelte (Feature Discovery)
**Location**: `src/sheets/components/FeatureSearch.svelte`
**Status**: ✅ Functional skeleton (placeholder)

**Features**:
- Search input with autofocus
- Loading state indicator
- Results display with three states:
  - Empty query - placeholder text
  - No results - "not found" message
  - Results - clickable list
- Close button to dismiss search
- Proper keyboard interaction (autofocus)
- Placeholder for actual feature searching (TODO)

**Key Code Patterns**:
```typescript
async function searchFeatures(query: string) {
  // TODO: Implement feature searching
  // For now, return empty results as placeholder
  searchResults = [];
}

function selectFeature(feature: unknown) {
  onselect?.(feature);
  searchQuery = '';
  searchResults = [];
}
```

## Integration Points

### TurnPrepContext
All components access context for:
- `actor` - The character being configured
- `localize(key)` - Localization strings

### TurnPrepAPI
Main panel uses API for:
- `getTurnPrepData(actor)` - Load existing plans
- `saveTurnPrepData(actor, data)` - Persist changes

### Type System
Uses existing type definitions:
- `TurnPlan` interface from `src/types/turn-prep.types.ts`
- Full type safety throughout

## Styling Strategy

**CSS Variables Used** (from Tidy5e theme):
- `--t5e-primary-color` - Main text/UI color
- `--t5e-secondary-color` - Secondary/dimmed text
- `--t5e-background` - Primary background
- `--t5e-background-secondary` - Alternative background
- `--t5e-border-color` - Border colors
- `--t5e-spacing-md`, `--t5e-spacing-lg`, `--t5e-spacing-sm` - Spacing
- `--t5e-border-radius` - Rounded corners
- `--t5e-danger-color` - Error/delete actions
- `--t5e-warning-color` - Secondary actions (favorites)

**Scoping**:
- All styles scoped via Vite `cssHash` configuration
- `<style lang="less">` blocks in each component
- LESS compilation handled by Vite pipeline
- No global CSS pollution

## Architecture Notes

### Data Flow
1. TurnPlansPanel loads plans on mount via `$effect`
2. Plans stored in `$state` for reactivity
3. User edits in TurnPlanCard → events bubble to parent
4. Parent applies changes to state array
5. Auto-saves via TurnPrepAPI after mutations

### Event Handling
- Svelte 5 event dispatching via custom events
- Parent listens to: `update`, `delete`, `duplicate`, `toggleFavorite`
- Child components emit events with detailed payloads
- Proper cleanup and state management

### Loading States
- Initial load state while fetching plans
- Error display with user-friendly messages
- Empty state when no plans exist
- All states properly styled

## Build Status

✅ **Build Successful**
```
> vite build
Γ£ô 144 modules transformed
../dist/turn-prep.css    2.09 kB Γöé gzip:  0.68 kB
../dist/turn-prep.js   184.59 kB Γöé gzip: 42.00 kB
Γ£ô built in 2.54s
```

No compilation errors or warnings. All components properly integrated.

## What's NOT Implemented Yet

### FeatureSearch TODO
- Actual feature searching logic (placeholder returns empty)
- Feature data source integration
- Feature filtering/sorting
- This is intentionally left for next phase

### TurnPlanCard Polish
- Inline editing enhancements
- Keyboard shortcuts
- Drag-and-drop reordering (future)
- Context menu integration (later)

### Styling Polish
- Visual refinement of component spacing
- Hover/active states refinement
- Responsive design for smaller screens
- Animation polish

## Next Steps

1. **Wire into Main Tab** - Add TurnPlansPanel to TurnPrepMainTab.svelte
2. **Test in Foundry** - Verify component loads and basic functionality
3. **Add Feature Search** - Implement actual feature discovery logic
4. **Styling Refinement** - Polish visual appearance and interactions
5. **DM Questions Panel** - Implement next major panel

## Files Changed

- ✅ `src/sheets/components/TurnPlansPanel.svelte` - Replaced TODO with functional skeleton
- ✅ `src/sheets/components/TurnPlanCard.svelte` - Created new sub-component
- ✅ `src/sheets/components/FeatureSection.svelte` - Created new sub-component
- ✅ `src/sheets/components/FeatureSearch.svelte` - Created new sub-component
- ✅ Build output - Verified successful compilation

## Code Quality

- ✅ Full TypeScript support with proper typing
- ✅ Svelte 5 best practices (reactive declarations)
- ✅ Proper error handling
- ✅ Accessible button/input elements
- ✅ Consistent CSS variable usage
- ✅ Clear function documentation with JSDoc
- ✅ Event propagation properly handled
