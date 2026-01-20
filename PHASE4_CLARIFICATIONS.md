# Phase 4 Clarifications - UI Components

**Status**: Awaiting answers  
**Phase**: 4 - UI Components (Svelte)  
**Dependencies**: Phase 1 ✅, Phase 2 ✅, Phase 3 ✅

---

## Context

Phase 4 builds the Svelte 5 UI components that will be integrated into character sheets in Phase 5. We have:

- ✅ **Phase 1**: Foundation (types, utilities, Foundry adapter, hooks, API)
- ✅ **Phase 2**: Data layer (storage, feature selection, filtering)
- ✅ **Phase 3**: Features layer (settings, context menu, roll integration)

Now we need to create the **visual components** that players will interact with.

---

## Component Overview

From the original scope, we identified these components:

1. **DmQuestionsPanel.svelte** - Text inputs for DM questions
2. **TurnPlansPanel.svelte** - Main turn planning interface with feature lists
3. **ReactionsPanel.svelte** - Reaction management
4. **FeatureSelectorWidget.svelte** - Autocomplete/dropdown for adding features
5. **RollButton.svelte** - Button to send plan to chat or history
6. **HistoryFavoritesList.svelte** - Display past turns and favorites

---

## Questions for Phase 4

### 1. Component Architecture & Svelte 5

**Q1.1**: Should we use Svelte 5's new **runes** system (`$state`, `$derived`, `$effect`) or stick with traditional reactive declarations (`$:`)?
- **Option A**: Use Svelte 5 runes (modern, recommended for new projects)
- **Option B**: Use traditional Svelte reactivity (more documentation available)
- **Option C**: Mix both as appropriate per component

**Q1.2**: Should components manage their own data, or should we use a **store pattern**?
- **Option A**: Each component receives data via props and emits events to parent
- **Option B**: Create Svelte stores (writable, derived) for shared state
- **Option C**: Hybrid - stores for global state, props for component-specific data

**Q1.3**: Should we create a **shared component library** for common UI elements (buttons, inputs, cards)?
- **Option A**: Yes, create reusable primitives (Button.svelte, Input.svelte, Card.svelte)
- **Option B**: No, keep components self-contained with inline elements
- **Option C**: Use external UI library (e.g., Flowbite-Svelte, SvelteUI)

---

### 2. DM Questions Panel

**Q2.1**: What **questions** should appear in the DM Questions panel?
- Based on Scope.md: "What's my character doing?", "How does my character feel?", "What does my character want to accomplish?"
- Do these still match your vision?
- Any additional questions?
- Should questions be **configurable** (module settings)?

**Q2.2**: Should answers be **saved per-character** or **per-turn-plan**?
- **Option A**: Global per-character (same answers across all plans)
- **Option B**: Per-turn-plan (different answers for each plan)
- **Option C**: User choice (toggle between modes)

**Q2.3**: Should there be a **character limit** or **word count** for answers?
- **Option A**: No limit
- **Option B**: Soft limit with visual indicator (e.g., "150/200 characters")
- **Option C**: Hard limit that prevents further input

---

### 3. Turn Plans Panel (Main Interface)

**Q3.1**: How should features be **organized visually**?
- **Option A**: Separate lists with headers (Actions, Bonus Actions, Reactions, Additional)
- **Option B**: Unified list with icons/badges to indicate type
- **Option C**: Tabbed interface (switch between action types)
- **Option D**: Card-based layout with drag-and-drop between sections

**Q3.2**: What **information** should display for each feature in the list?
- Minimum: Feature name
- Additional options:
  - [ ] Item icon/image
  - [ ] Activation type icon (action, bonus, reaction)
  - [ ] Range (if applicable)
  - [ ] Damage dice
  - [ ] Brief description
  - [ ] Concentration indicator
  - [ ] Resource cost (spell slot, uses, etc.)

**Q3.3**: Should features have **inline editing** or require opening dialogs?
- **Option A**: Inline - edit movement/notes/trigger directly in the panel
- **Option B**: Dialog - click "Edit" to open popup
- **Option C**: Mixed - inline for simple fields, dialog for complex

**Q3.4**: How should **multiattack/duplicates** be indicated?
- **Option A**: Show count badge (e.g., "Unarmed Strike (x3)")
- **Option B**: Show as separate entries
- **Option C**: Collapsed by default with expand toggle

**Q3.5**: Should the panel have a **compact mode** for smaller screens?
- **Option A**: Yes, hide descriptions/details, show only names
- **Option B**: No, always full detail
- **Option C**: Responsive - automatically adapts to available space

---

### 4. Reactions Panel

**Q4.1**: How should reactions be displayed?
- **Option A**: Simple list with feature names
- **Option B**: Cards showing trigger conditions
- **Option C**: Table with columns (Reaction, Trigger, Details)

**Q4.2**: Should triggers be **editable** per-reaction?
- Based on PHASE3_CLARIFICATIONS: Reactions are stored in `turnPrepData.reactions[]` (persistent)
- **Option A**: Yes, allow custom trigger text per reaction
- **Option B**: No, just show the reaction name
- **Option C**: Use item's activation description as trigger

**Q4.3**: Since reactions are **persistent** (not per-plan), should there be visual indication?
- **Option A**: Different background color or badge
- **Option B**: Section header: "Always Available Reactions"
- **Option C**: Toggle to show/hide in current plan view

---

### 5. Feature Selector Widget

**Q5.1**: What **style** of input should the feature selector use?
- **Option A**: Dropdown/select menu (standard HTML)
- **Option B**: Autocomplete text input (type to filter)
- **Option C**: Modal dialog with searchable list
- **Option D**: Inline expandable picker (click to expand options)

**Q5.2**: Should the selector **filter by activation type** automatically?
- **Option A**: Yes, when adding to "Actions" only show action-type features
- **Option B**: No, show all features regardless of target field
- **Option C**: Filter by default, with toggle to show all

**Q5.3**: How should features **without activities** be handled?
- From PHASE3: Items without activation type go to "Additional Features"
- **Option A**: Automatically route to Additional Features section
- **Option B**: Let user choose where to place it
- **Option C**: Show warning and ask for confirmation

---

### 6. Roll Button & History

**Q6.1**: What actions should the **Roll Button** trigger?
- Based on Phase 3: We have `createHistorySnapshot()` and `showEndOfTurnDialog()`
- **Option A**: Button labeled "End Turn" → saves plan to history and clears current
- **Option B**: Two buttons: "Save to History" and "End Turn"
- **Option C**: Dropdown menu: "Send to Chat", "Save to History", "End Turn"

**Q6.2**: Should there be **confirmation** before ending turn?
- We already have a dialog in Phase 3
- **Option A**: Always show confirmation
- **Option B**: Skip confirmation if checkbox "Don't ask again" is checked
- **Option C**: No confirmation, just do it

**Q6.3**: How should the **history/favorites list** be displayed?
- **Option A**: Accordion - click to expand each entry
- **Option B**: Cards - all expanded by default
- **Option C**: List view with hover preview
- **Option D**: Sidebar panel with scroll

**Q6.4**: What details should show for **history entries**?
- Minimum: Plan name, timestamp
- Additional options:
  - [ ] Feature count (e.g., "5 actions, 2 bonus")
  - [ ] Rolls made (attack/damage results)
  - [ ] Saving throws
  - [ ] Edit history checkpoints
  - [ ] Notes/trigger text

**Q6.5**: Should users be able to **edit** history entries?
- **Option A**: No, history is read-only
- **Option B**: Yes, can edit name/notes
- **Option C**: Can restore to current plan and then edit

---

### 7. Styling & Themes

**Q7.1**: Should components match **Foundry's default theme** or have custom styling?
- **Option A**: Match Foundry (use --color-* CSS variables)
- **Option B**: Custom theme with own color palette
- **Option C**: Tidy 5e theme integration when available

**Q7.2**: Should components be **mobile-responsive**?
- Foundry VTT is primarily desktop, but tablets are becoming more common
- **Option A**: Yes, responsive design for tablets (768px+)
- **Option B**: Desktop only (1024px+)
- **Option C**: Adaptive - different layouts for small/medium/large

**Q7.3**: Should we use **LESS**, **SCSS**, or **CSS**?
- Currently: LESS files in `styles/` folder
- **Option A**: Continue with LESS
- **Option B**: Switch to SCSS (more features)
- **Option C**: Use vanilla CSS with CSS Variables
- **Option D**: Svelte's scoped `<style>` tags only

---

### 8. Data Flow & Integration

**Q8.1**: How should components **communicate** with the data layer?
- We have TurnPrepStorage and TurnPrepAPI from Phases 1-3
- **Option A**: Components call TurnPrepAPI methods directly
- **Option B**: Components dispatch events, parent handles data calls
- **Option C**: Create a Svelte context/store that wraps the API

**Q8.2**: Should components **cache data** or always fetch from actor flags?
- **Option A**: Cache in component state, refresh on events
- **Option B**: Always fetch fresh data
- **Option C**: Use Svelte stores that auto-sync with actor flags

**Q8.3**: How should we handle **actor updates** from external sources?
- If another module or macro changes actor data
- **Option A**: Listen to Foundry hooks (`updateActor`) and refresh
- **Option B**: Polling (check for changes every N seconds)
- **Option C**: Optimistic updates (assume our changes are correct)

---

### 9. Error Handling & UX

**Q9.1**: How should components handle **errors**?
- **Option A**: Toast notifications (Foundry's ui.notifications)
- **Option B**: Inline error messages within component
- **Option C**: Both (toast for critical, inline for field errors)

**Q9.2**: Should there be **loading states** for async operations?
- **Option A**: Yes, show spinners when loading data
- **Option B**: No, operations should be fast enough
- **Option C**: Only for slow operations (>500ms)

**Q9.3**: Should there be **undo/redo** functionality?
- We have edit checkpoints in Phase 3
- **Option A**: Use edit checkpoints as undo system
- **Option B**: Add separate undo/redo for current session
- **Option C**: No undo, rely on checkpoints only

---

### 10. Accessibility

**Q10.1**: Should components follow **WCAG accessibility guidelines**?
- **Option A**: Yes, full ARIA labels, keyboard navigation
- **Option B**: Basic accessibility (semantic HTML)
- **Option C**: Not a priority for V1

**Q10.2**: Should there be **keyboard shortcuts**?
- **Option A**: Yes (e.g., Ctrl+S to save, Ctrl+Z to undo)
- **Option B**: Only basic Tab navigation
- **Option C**: No custom shortcuts

---

### 11. Testing Strategy

**Q11.1**: How should we test Svelte components?
- **Option A**: Manual testing in Foundry (console + visual inspection)
- **Option B**: Unit tests (Vitest + Svelte Testing Library)
- **Option C**: Both manual and automated tests

**Q11.2**: Should we create a **component playground**?
- **Option A**: Yes, standalone HTML page to preview components
- **Option B**: No, test directly in Foundry
- **Option C**: Use Storybook or similar tool

---

### 12. Migration & Deprecation

**Q12.1**: Should we **immediately** migrate the activity selection dialog from Phase 3?
- Currently using deprecated `Dialog` class (will be removed in Foundry V16)
- Located in: `src/features/context-menu/ContextMenuHandler.ts` line 343
- **Option A**: Migrate now as part of Phase 4
- **Option B**: Keep using Dialog, migrate in Phase 6 (polish)
- **Option C**: Create new Svelte dialog component and use it everywhere

---

## Implementation Priority

**Q13**: Which components should we build **first**?
- Suggested order based on complexity:
  1. **DmQuestionsPanel** (simplest - just text inputs)
  2. **ReactionsPanel** (simple list)
  3. **RollButton** (single button with action)
  4. **FeatureSelectorWidget** (medium complexity)
  5. **HistoryFavoritesList** (medium-high complexity)
  6. **TurnPlansPanel** (most complex - main interface)

Do you agree with this order, or prefer a different approach?

---

## Additional Questions

**Q14**: Any **other requirements** or features you'd like in the UI components that aren't covered above?

**Q15**: Are there any **existing Foundry modules** whose UI you particularly like that we should reference?

**Q16**: Should we plan for **localization** (i18n) from the start, or add it later?
- **Option A**: Build with localization from start (use `game.i18n.localize()`)
- **Option B**: Hardcode English, add i18n in Phase 7
- **Option C**: Use localization for major text, hardcode for small labels

---

## Next Steps

Once you answer these questions:
1. I'll create **PHASE4_IMPLEMENTATION_PLAN.md** with detailed specifications
2. We'll start building components in priority order
3. Each component will be tested individually before integration

**Expected Timeline**: 2-3 implementation sessions per component (6 components total)

