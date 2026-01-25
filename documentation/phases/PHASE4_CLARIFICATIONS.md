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

A note that in phase 3 we also found that Foundry's native Dialog has been deprecated. So far that affects:

- the dialog that pops  up when adding a feature to turn prep that has more than one activity associated with it.
- the end of turn popup to see if the user wants to save and clear their turn plan.

We'll need to figure out how to handle those dialogs, whether that's a custom scelte component or some replacement for Dialog that foundry recommends. I don't know if the Tidy 5e sheet has a call for popup dialogs, but it would be worth scanning its codebase to see how it handles them and mimicking its behavior, and/or extending its functionality

---

## Questions for Phase 4

### 1. Component Architecture & Svelte 5

**Q1.1**: Should we use Svelte 5's new **runes** system (`$state`, `$derived`, `$effect`) or stick with traditional reactive declarations (`$:`)?
- **Option A**: Use Svelte 5 runes (modern, recommended for new projects)
- **Option B**: Use traditional Svelte reactivity (more documentation available)
- **Option C**: Mix both as appropriate per component

**USER PREFERENCE**: Use whatever Tidy5e Uses to maximize compatibility.

---

### 🔍 RESEARCH FINDINGS - Tidy5e Svelte Approach

**Tidy5e uses Svelte 5 Runes extensively** throughout its codebase. Examples found:

- **`$state`** for reactive state:
  ```svelte
  let context = $state<UserSettingsContext>();
  let sections = $state<SectionConfigItem[]>([]);
  ```

- **`$derived`** for computed values:
  ```svelte
  let context = $derived(getSheetContext<ItemSheetQuadroneContext>());
  let advancements = $derived(Object.entries(context.advancement));
  ```

- **`$effect`** for side effects:
  ```svelte
  $effect(() => {
    selectedTabId = context.currentTabId;
  });
  ```

- **`$bindable`** for two-way binding:
  ```svelte
  let value = $bindable();
  let expanded = $bindable(false);
  ```

**RECOMMENDATION**: ✅ **Use Svelte 5 Runes (Option A)** - This is what Tidy5e uses throughout.


yep. do it.

---

**Q1.2**: Should components manage their own data, or should we use a **store pattern**?
- **Option A**: Each component receives data via props and emits events to parent
- **Option B**: Create Svelte stores (writable, derived) for shared state
- **Option C**: Hybrid - stores for global state, props for component-specific data

**USER REQUEST**: Need guidance on pros/cons and ramifications

---

### 🔍 RESEARCH FINDINGS - Tidy5e Data Management Pattern

**Tidy5e uses a Hybrid approach (Option C)**:

1. **Svelte Context** for passing sheet-wide data down the component tree:
   ```typescript
   // Setting context at sheet level
   const context = new Map<any, any>([
     [CONSTANTS.SVELTE_CONTEXT.CONTEXT, this._context],
     [CONSTANTS.SVELTE_CONTEXT.MESSAGE_BUS, this.messageBus],
   ]);
   
   // Accessing in child components
   let context = $derived(getSheetContext<CharacterSheetQuadroneContext>());
   ```

2. **Svelte `.svelte.ts` reactive files** for shared service state:
   ```typescript
   // In settings.svelte.ts
   let _settings: CurrentSettings = $state()!;
   
   // Accessed from components
   import { settings } from 'src/settings/settings.svelte';
   ```

3. **Props and events** for local component communication:
   ```svelte
   interface Props {
     item: Item5e;
     onToggle?: (event: Event) => void;
   }
   let { item, onToggle }: Props = $props();
   ```

**RECOMMENDATION**: ✅ **Use Hybrid Pattern (Option C)**:
- **Context**: For passing actor/sheet data and services (like we have TurnPrepStorage)
- **Reactive .svelte.ts files**: For global module state (settings, API)
- **Props/Events**: For component-specific interactions
- Access data through `getSheetContext()` helper in components

Sounds good.

---

**Q1.3**: Should we create a **shared component library** for common UI elements (buttons, inputs, cards)?
- **Option A**: Yes, create reusable primitives (Button.svelte, Input.svelte, Card.svelte)
- **Option B**: No, keep components self-contained with inline elements
- **Option C**: Use external UI library (e.g., Flowbite-Svelte, SvelteUI)

**USER PREFERENCE**: Adhere to Tidy5e standards if at all possible

---

### 🔍 RESEARCH FINDINGS - Tidy5e Component Library

**Tidy5e has extensive reusable component library (Option A)** organized in `/src/components/`:

**Input Components**:
- `TextInput.svelte`, `NumberInput.svelte`
- `Checkbox.svelte`, `CheckboxQuadrone.svelte`
- `Select.svelte`, `SelectQuadrone.svelte`
- `TextInputQuadrone.svelte`, `NumberInputQuadrone.svelte`

**Button Components**:
- `ButtonMenu.svelte` - Dropdown menu button
- `ButtonMenuCommand.svelte`, `ButtonMenuItem.svelte`
- `ToggleButton.svelte` - Toggle switch button
- `ButtonWithOptionPanel.svelte` - Button with expandable options

**Layout Components**:
- `TidyTable.svelte`, `TidyTableRow.svelte`, `TidyTableCell.svelte`
- `ExpandableContainer.svelte`
- `HorizontalLineSeparator.svelte`

**Form Components**:
- `FormGroup.svelte`
- `TidyFormInput.svelte` - Smart form input that picks the right component
- `FoundryFormInput.svelte` - Wrapper for Foundry's native form inputs

**Specialized Components**:
- `Dnd5eIcon.svelte` - D&D 5e icon wrapper
- `PropertyTag.svelte` - Pills/tags for item properties
- `Pips.svelte` - Dot indicators (e.g., spell slots)

**RECOMMENDATION**: ✅ **Create reusable component library (Option A)**, following Tidy5e's patterns:
- Use Tidy5e components where possible via direct import
- Create our own components only when Tidy5e doesn't have what we need
- Follow Tidy5e naming conventions (descriptive, not generic)
- Support both Classic and Quadrone variants if needed

Perfect. Let's do it.

---

---

### 2. DM Questions Panel

**Q2.1**: What **questions** should appear in the DM Questions panel?
- Based on Scope.md: "What's my character doing?", "How does my character feel?", "What does my character want to accomplish?"
- Do these still match your vision?
- Any additional questions?
- Should questions be **configurable** (module settings)?

The idea here is that often at the start of a player's turn they will ned toget clarification about something from the dm in order to decide what they want to do on their turn. This is  simply a place to record those questions so they ready when your turn comes up. 

We just need a text entry field for the question, buttons to add more question fields and to remove fields as long as there is more than one (). ANd buttons to Whisper send to the dm and a button to send to public chat. The + and - buttons should be to the left of the field. The send button should be to the right.

On the right let's also have a button to clear the text field but not delete it 

Please recommend font awesome icons for the buttons. + and - are pretty straightforward.

---

### 🔍 ICON RECOMMENDATIONS - DM Questions Panel

Based on Tidy5e's usage patterns:

- **Add Question**: `fa-plus` or `fa-plus-circle` ✅
- **Remove Question**: `fa-minus` or `fa-times` ✅  
- **Send to DM (Whisper)**: `fa-user-secret` or `fa-comment-dots` (whisper icon)
- **Send Public**: `fa-comments` or `fa-bullhorn` (public chat)
- **Clear Text**: `fa-eraser` or `fa-xmark` (clear/reset)

**Recommended Layout**:
```
[+] [Text Input Field...........................] [Clear] [Whisper] [Public]
```

fa-plus for add question
fa-minus for remove question
far-paper-airplane sned to dm
fa-bullhorn send public
fa-eraser clear text

---

**Q2.2**: Should answers be **saved per-character** or **per-turn-plan**?
- **Option A**: Global per-character (same answers across all plans)
- **Option B**: Per-turn-plan (different answers for each plan)
- **Option C**: User choice (toggle between modes)

Per character. It is a separate panel within the turn prep sheet tab, above the main current turn plan interface. 

**Q2.3**: Should there be a **character limit** or **word count** for answers?
- **Option A**: No limit
- **Option B**: Soft limit with visual indicator (e.g., "150/200 characters")
- **Option C**: Hard limit that prevents further input

No limit, it would be nice if the field was tall enough to show maybe 4-5 lines of text and then be scrollable if there is more text than that. 

Later perhaps we could add a popout panel for editing and viewing longer text. Maybe with rich formatting capabilities
---

### 3. Turn Plans Panel (Main Interface)

**Q3.1**: How should features be **organized visually**?
- **Option A**: Separate lists with headers (Actions, Bonus Actions, Reactions, Additional)
- **Option B**: Unified list with icons/badges to indicate type
- **Option C**: Tabbed interface (switch between action types)
- **Option D**: Card-based layout with drag-and-drop between sections

Each Turn plan would be a card in a vertical stack of cards that are the full width of the tab. 

Each card details a full plan with the following fields from top to bottom:

- At the top in larger text is the Turn Plan name, using a generated name that can then be edited 
- an empty text field to note the trigger or deciding factor in whether to use this particular plan. I'm not sure if trigger is the right label for this field can you brainstorm suggestions for me?
- Actions
- Bonus Actions
- Additional Features
- Movement
- Mechanical Notes
- Roleplay Notes 


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

We Will want to exactly use the way tidy5e sets up its sheet tab for the three fields that accept features from other parts of the sheet.

Here is the html of its layout as a startingg point for figuring out how to import this functionality into our tab:

```html
<section class="tidy-table " data-tidy-sheet-part="item-table" data-tidy-section-key="action"><header class="tidy-table-header-row theme-dark toggleable" data-tidy-sheet-part="table-header-row"><!----><div class="tidy-table-header-cell header-label-cell primary" data-tidy-sheet-part="table-header-cell"><div class="button expand-button"><i class="fa-solid fa-chevron-right" data-tidy-sheet-part="table-expansion-toggle" style=""></i></div><!----> <h3>Action</h3> <span class="table-header-count">11</span><!----></div><!----> <div class="tidy-table-header-cell hidden" data-tidy-sheet-part="table-header-cell" data-tidy-column-key="charges" style="--tidy-table-column-width: 5rem;"><!----> <!----><!----><!----><!----><!---->Uses<!----></div><div class="tidy-table-header-cell hidden" data-tidy-sheet-part="table-header-cell" data-tidy-column-key="roll" style="--tidy-table-column-width: 3.125rem;"><!----> <!----><!----><!----><!----><!---->Roll<!----></div><div class="tidy-table-header-cell" data-tidy-sheet-part="table-header-cell" data-tidy-column-key="formula" style="--tidy-table-column-width: 5rem;"><!----> <!----><!----><!----><!----><!---->Formula<!----></div><div class="tidy-table-header-cell hidden" data-tidy-sheet-part="table-header-cell" data-tidy-column-key="range" style="--tidy-table-column-width: 5rem;"><!----> <!----><!----><!----><!----><!---->Range<!----></div><div class="tidy-table-header-cell hidden" data-tidy-sheet-part="table-header-cell" data-tidy-column-key="target" style="--tidy-table-column-width: 5rem;"><!----> <!----><!----><!----><!----><!---->Target<!----></div><div class="tidy-table-header-cell header-cell-actions" data-tidy-sheet-part="table-header-cell" data-tidy-column-key="actions" style="--tidy-table-column-width: 1.6875rem;"><!----> <!----><!----><!----><!----><!----><!----><!----></div><!----><!----></header><!----> <div class="expandable overflow-y-hidden" role="presentation"><!----></div><!----></section>
```


**Q3.3**: Should features have **inline editing** or require opening dialogs?
- **Option A**: Inline - edit movement/notes/trigger directly in the panel
- **Option B**: Dialog - click "Edit" to open popup
- **Option C**: Mixed - inline for simple fields, dialog for complex

Mixed, just as you described

**Q3.4**: How should **multiattack/duplicates** be indicated?
- **Option A**: Show count badge (e.g., "Unarmed Strike (x3)")
- **Option B**: Show as separate entries
- **Option C**: Collapsed by default with expand toggle

We're just going to be pretty loose with this and not worry about that. The actions field should just accept as many actions as the player wants. and they should be able to drag them from one plan to another. THis is a reference to the feature for them to roll. THey should know of they have multiattack. If they want a reminder they could always add their multiattack feature to the Additional Features field

In other documents I've specified wanting to limit each plan to only one action and one bonus action per plan, but I don't think I want to impose that restriction after all

**Q3.5**: Should the panel have a **compact mode** for smaller screens?
- **Option A**: Yes, hide descriptions/details, show only names
- **Option B**: No, always full detail
- **Option C**: Responsive - automatically adapts to available space

I'm thoughtful about having a collapsiible "Additional Details" sub panel as part of the current turn plan card and moving movement, roleplay notes, and mechanical notes in there where they can be hidden

It could be nice to make every turn plan collapsible as well so that only the plan name is visible.

---

### 4. Reactions Panel

**Q4.1**: How should reactions be displayed?
- **Option A**: Simple list with feature names
- **Option B**: Cards showing trigger conditions
- **Option C**: Table with columns (Reaction, Trigger, Details)

We should use cards again just as with the current plans panel. 

- A trigger field for player notes about when they would want to use this
- A Reactions field that links to the feature or spell or item that has a reaction activity associated. Displayed using tidy 5e's methods just like above.
- An additional Features field just like in the current turn plan

**Q4.2**: Should triggers be **editable** per-reaction?
- Based on PHASE3_CLARIFICATIONS: Reactions are stored in `turnPrepData.reactions[]` (persistent)
- **Option A**: Yes, allow custom trigger text per reaction
- **Option B**: No, just show the reaction name
- **Option C**: Use item's activation description as trigger

THis is less about the mechanical trigger of the feature than the player's notes about when and under what circumstances they would want to use this reaction

**Q4.3**: Since reactions are **persistent** (not per-plan), should there be visual indication?
- **Option A**: Different background color or badge
- **Option B**: Section header: "Always Available Reactions"
- **Option C**: Toggle to show/hide in current plan view

A header: "Reaction Plans
---

### 5. Feature Selector Widget

**Q5.1**: What **style** of input should the feature selector use?
- **Option A**: Dropdown/select menu (standard HTML)
- **Option B**: Autocomplete text input (type to filter)
- **Option C**: Modal dialog with searchable list
- **Option D**: Inline expandable picker (click to expand options)

What I'd ideally like to have for this is a textbox that I could start typing into. As I started to type a list of possibilities should show up below the text field. It should include all possibilites in which the typed text appears in the feature/item/spell name and it should limit byu activation cost for the associated section of the sheet.

I'm realizing that the section header on tidy5e's sheet has a lot of space between the section title and the "formula" column heading. Maybe we could modify that element to put the search text box in between those text items inside the section heading row.



**Q5.2**: Should the selector **filter by activation type** automatically?
- **Option A**: Yes, when adding to "Actions" only show action-type features
- **Option B**: No, show all features regardless of target field
- **Option C**: Filter by default, with toggle to show all

Yes, except for the "additional Features" field. It'll take anything.

**Q5.3**: How should features **without activities** be handled?
- From PHASE3: Items without activation type go to "Additional Features"
- **Option A**: Automatically route to Additional Features section
- **Option B**: Let user choose where to place it
- **Option C**: Show warning and ask for confirmation

Option A
---

### 6. Roll Button & History

**Q6.1**: What actions should the **Roll Button** trigger?
- Based on Phase 3: We have `createHistorySnapshot()` and `showEndOfTurnDialog()`
- **Option A**: Button labeled "End Turn" → saves plan to history and clears current
- **Option B**: Two buttons: "Save to History" and "End Turn"
- **Option C**: Dropdown menu: "Send to Chat", "Save to History", "End Turn"

We don't need a roll button just a button to save to history and clear the fields.

**Q6.2**: Should there be **confirmation** before ending turn?
- We already have a dialog in Phase 3
- **Option A**: Always show confirmation
- **Option B**: Skip confirmation if checkbox "Don't ask again" is checked
- **Option C**: No confirmation, just do it

We have this working already but will still need to tie into the initiative system. When the player's turn ends, if they have an active plan, they should get a popup dialog asking if they want to save and clear their turn.

> TODO (Phase 4 Save & Clear): When we revisit this dialog, prompt the player to confirm which action(s) and bonus action(s) from the multi-entry plan were actually used before we capture the history snapshot.

**Q6.3**: How should the **history/favorites list** be displayed?
- **Option A**: Accordion - click to expand each entry
- **Option B**: Cards - all expanded by default
- **Option C**: List view with hover preview
- **Option D**: Sidebar panel with scroll

This will go into Tidy5e's sidebar. I'd like a vertical stack of cards for the favorites and history. THe favorites will have a section heading and then a vertical stack 

THe history section will also have a section heading and will be below the favorites. 

Both should have cards with the plan name, and the action and bonus action (text only , not the whole item listing)

They should be expandable to show the rest of the parts of the plan and the associated rolls made as part of the turn

**Q6.4**: What details should show for **history entries**?
- Minimum: Plan name, timestamp
- Additional options:
  - [ ] Feature count (e.g., "5 actions, 2 bonus")
  - [ ] Rolls made (attack/damage results)
  - [ ] Saving throws
  - [ ] Edit history checkpoints
  - [ ] Notes/trigger text

  Plan name, first action name, first bonus action name (one of each max)

**Q6.5**: Should users be able to **edit** history entries?
- **Option A**: No, history is read-only
- **Option B**: Yes, can edit name/notes
- **Option C**: Can restore to current plan and then edit

Can edit, with a module setting to restrict player's ability to do this. Dm always can.

---

### 7. Styling & Themes

**Q7.1**: Should components match **Foundry's default theme** or have custom styling?
- **Option A**: Match Foundry (use --color-* CSS variables)
- **Option B**: Custom theme with own color palette
- **Option C**: Tidy 5e theme integration when available

We're targeting Tidy5e first and foremost. Match its style or import and use its style and elements where possible

**Q7.2**: Should components be **mobile-responsive**?
- Foundry VTT is primarily desktop, but tablets are becoming more common
- **Option A**: Yes, responsive design for tablets (768px+)
- **Option B**: Desktop only (1024px+)
- **Option C**: Adaptive - different layouts for small/medium/large

Desktop only for now

**Q7.3**: Should we use **LESS**, **SCSS**, or **CSS**?
- Currently: LESS files in `styles/` folder
- **Option A**: Continue with LESS
- **Option B**: Switch to SCSS (more features)
- **Option C**: Use vanilla CSS with CSS Variables
- **Option D**: Svelte's scoped `<style>` tags only

**USER REQUEST**: Check what Tidy5e uses and match it

---

### 🔍 RESEARCH FINDINGS - Tidy5e Styling Approach

**Tidy5e uses LESS** exclusively for styling:

**File Structure**:
```
src/less/
├── tidy5e.less (main entry point)
├── variables.less
├── variables-quadrone.less
├── util.less
├── classic/
│   ├── classic.less
│   └── partials/
├── quadrone/
│   ├── apps.less
│   ├── components/
│   │   ├── buttons.less
│   │   ├── inputs.less
│   │   ├── pills.less
│   │   └── ...
│   └── ...
└── shared/
```

**Key Features Used**:
- **LESS Variables**: `@badge_level_dark`, `@denim065`
- **Nesting**: Extensive use of nested selectors
- **Mixins**: Not heavily used, but present
- **CSS Variables**: Used alongside LESS for runtime theming

**In Svelte Components**:
```svelte
<style lang="less">
  .my-component {
    background: var(--t5e-background);
    
    .nested-element {
      color: var(--t5e-primary-color);
    }
  }
</style>
```

**RECOMMENDATION**: ✅ **Continue with LESS (Option A)**
- Matches Tidy5e's approach
- Already set up in your project
- Use scoped `<style lang="less">` in components
- Use global LESS files for shared styles
- Leverage Tidy5e's CSS variables for theming


Sounds good. LESS is more. Option A
---


---

### 8. Data Flow & Integration

**Q8.1**: How should components **communicate** with the data layer?
- We have TurnPrepStorage and TurnPrepAPI from Phases 1-3
- **Option A**: Components call TurnPrepAPI methods directly
- **Option B**: Components dispatch events, parent handles data calls
- **Option C**: Create a Svelte context/store that wraps the API

**USER QUESTION**: Calling the API methods seems like a fine choice. Is there any reason not to do that?

---

### 🔍 ANALYSIS - API Communication Pattern

**Direct API calls (Option A) are FINE** with these considerations:

**Pros of Direct API Calls**:
- ✅ Simple and straightforward
- ✅ Clear data flow
- ✅ How Tidy5e components work with Foundry APIs
- ✅ Easy to test and debug

**Tidy5e Pattern**:
```svelte
<script>
  import { TurnPrepAPI } from 'src/api/TurnPrepApi';
  
  async function savePlan() {
    await TurnPrepAPI.saveTurnPlan(actor, plan);
  }
</script>
```

**Best Practices**:
1. Import API at component level
2. Call methods directly in event handlers
3. Use try/catch for error handling
4. Show user feedback (toasts/notifications)

**RECOMMENDATION**: ✅ **Use Direct API Calls (Option A)**
- Simple, clear, and matches Tidy5e patterns
- No need for extra abstraction layers
- Keep API methods async and return promises


Great. Perfect.

---

**Q8.2**: Should components **cache data** or always fetch from actor flags?
- **Option A**: Cache in component state, refresh on events
- **Option B**: Always fetch fresh data
- **Option C**: Use Svelte stores that auto-sync with actor flags

The features/items/spells in the current plans and reaction plans should autoupdate by virtue of using the tidy5e components.

The data stored in hsitory shouldstore and  keep track of the id of the associated feature or item, but should store the feature names at time of creation and display those stored names

**Q8.3**: How should we handle **actor updates** from external sources?
- If another module or macro changes actor data
- **Option A**: Listen to Foundry hooks (`updateActor`) and refresh
- **Option B**: Polling (check for changes every N seconds)
- **Option C**: Optimistic updates (assume our changes are correct)

**USER REQUEST**: Check Tidy5e's "Sheet" tab to see how it handles this. Are there other updates I should be worried about?

---

### 🔍 RESEARCH FINDINGS - Tidy5e Actor Update Handling

**Tidy5e uses Foundry's reactive rendering system**:

1. **ApplicationV2 Auto-Rendering**: Foundry V2 sheets automatically re-render when the actor updates
   ```typescript
   // Sheet classes extend DocumentSheetV2 which handles this
   async _prepareContext(options = {}) {
     // This is called automatically when actor updates
     return context;
   }
   ```

2. **Svelte Reactivity with `$derived`**: Components react to context changes
   ```svelte
   let context = $derived(getSheetContext<CharacterSheetContext>());
   let items = $derived(context.items); // Auto-updates when context changes
   ```

3. **No Manual Hook Listeners Needed**: The sheet framework handles it

**What Updates to Worry About**:
- ✅ **Actor data changes** - Handled by ApplicationV2
- ✅ **Item changes** - Handled by ApplicationV2  
- ✅ **Effect changes** - Handled by ApplicationV2
- ⚠️ **Cross-actor changes** - Only if you display data from multiple actors
- ⚠️ **Real-time collaboration** - Handled by Foundry's data layer

**RECOMMENDATION**: ✅ **Use ApplicationV2 Auto-Rendering (Option A - but automatic)**
- No manual hook listeners needed for most cases
- Foundry handles `updateActor`, `updateItem`, etc. hooks
- Components react via `$derived` when context updates
- Only add manual hooks if you need cross-document updates


Sound great. Option A  Automatic
---

---

### 9. Error Handling & UX

**Q9.1**: How should components handle **errors**?
- **Option A**: Toast notifications (Foundry's ui.notifications)
- **Option B**: Inline error messages within component
- **Option C**: Both (toast for critical, inline for field errors)

Option C

**Q9.2**: Should there be **loading states** for async operations?
- **Option A**: Yes, show spinners when loading data
- **Option B**: No, operations should be fast enough
- **Option C**: Only for slow operations (>500ms)

Option B. We'll revisit if it's a problem

**Q9.3**: Should there be **undo/redo** functionality?
- We have edit checkpoints in Phase 3
- **Option A**: Use edit checkpoints as undo system
- **Option B**: Add separate undo/redo for current session
- **Option C**: No undo, rely on checkpoints only

**USER REQUEST**: Look into Foundry's undo/redo capabilities. We don't need to build our own.

---

### 🔍 RESEARCH FINDINGS - Foundry Undo/Redo Capabilities

**Foundry VTT does NOT have built-in undo/redo** for document changes:

**What Foundry Provides**:
- ❌ No native undo/redo system for actor/item data
- ✅ Transaction-based updates (all-or-nothing)
- ✅ Previous data available in hook callbacks
- ❌ No undo stack or history management

**Tidy5e's Approach**:
- Does NOT implement undo/redo
- Relies on Foundry's update system
- Uses confirmation dialogs for destructive actions

**Your Options**:
1. **No Undo/Redo (Simplest)** - Standard for Foundry modules
2. **Edit Checkpoints** - Your Phase 3 implementation provides snapshots
3. **Custom Undo Stack** - Would need to build from scratch

**RECOMMENDATION**: ✅ **Use Edit Checkpoints (Option A)**
- Matches Foundry ecosystem patterns
- Your existing checkpoint system provides versioning
- Users can manually revert to checkpoints
- Don't build custom undo/redo - it's complex and non-standard

**Suggested UX**:
- "Restore from Checkpoint" button
- Show list of saved checkpoints with timestamps
- One-click restore to previous state
- Auto-save checkpoint before major changes

---

Yes let's have he ability to restore from checkpoints but only for History Items and Favorites, not current plans. We don't need undo redo there

---

### 10. Accessibility

**Q10.1**: Should components follow **WCAG accessibility guidelines**?
- **Option A**: Yes, full ARIA labels, keyboard navigation
- **Option B**: Basic accessibility (semantic HTML)
- **Option C**: Not a priority for V1

Option 2

**Q10.2**: Should there be **keyboard shortcuts**?
- **Option A**: Yes (e.g., Ctrl+S to save, Ctrl+Z to undo)
- **Option B**: Only basic Tab navigation
- **Option C**: No custom shortcuts

OPTION C
---

### 11. Testing Strategy

**Q11.1**: How should we test Svelte components?
- **Option A**: Manual testing in Foundry (console + visual inspection)
- **Option B**: Unit tests (Vitest + Svelte Testing Library)
- **Option C**: Both manual and automated tests

Option A for now. Put Unit Tests on the roadmap for after v1.0

**Q11.2**: Should we create a **component playground**?
- **Option A**: Yes, standalone HTML page to preview components
- **Option B**: No, test directly in Foundry
- **Option C**: Use Storybook or similar tool

Option B

---

### 12. Migration & Deprecation

**Q12.1**: Should we **immediately** migrate the activity selection dialog from Phase 3?
- Currently using deprecated `Dialog` class (will be removed in Foundry V16)
- Located in: `src/features/context-menu/ContextMenuHandler.ts` line 343
- **Option A**: Migrate now as part of Phase 4
- **Option B**: Keep using Dialog, migrate in Phase 6 (polish)
- **Option C**: Create new Svelte dialog component and use it everywhere

**USER PREFERENCE**: Option A. Let's look to see if Tidy5e has a component we can use before we develop our own

---

### 🔍 RESEARCH FINDINGS - Tidy5e Dialog Components

**Foundry V12+ uses `DialogV2`** (replaces deprecated `Dialog`):

**Tidy5e Uses DialogV2 for Confirmations**:
```typescript
// From BulkMigrationsApplication.ts
const proceed = await foundry.applications.api.DialogV2.confirm({
  title: FoundryAdapter.localize('TIDY5E.Settings.Migrations.migrateConfirmTitle'),
  content: `<p>${message}</p>`,
  yes: {
    icon: '<i class="fas fa-right-left"></i>',
    label: FoundryAdapter.localize('TIDY5E.Settings.Migrations.migrateConfirmButtonYes'),
    default: true,
  },
  no: { default: false }
});
```

**Tidy5e's Custom Dialog Pattern** (for complex dialogs):
```typescript
// DocumentSheetDialog.svelte.ts - Base class for dialogs
export function DocumentSheetDialog<TContext>() {
  return class extends SvelteApplicationMixin<>(
    foundry.applications.api.DocumentSheetV2
  ) {
    // Full Svelte component as dialog content
  };
}
```

**Dialog Types in Tidy5e**:
1. **Simple Confirmations**: Use `DialogV2.confirm()` or `DialogV2.prompt()`
2. **Complex Forms**: Create custom `ApplicationV2` with Svelte component
3. **Sheet-like Dialogs**: Extend `DocumentSheetDialog`

**Your Activity Selection Dialog** needs:
- List of activities to choose from
- Click to select
- Form submission

**RECOMMENDATION**: ✅ **Migrate Now (Option A)** using:

**For Simple Selection**:
```typescript
// Use DialogV2.prompt() or DialogV2.wait()
const result = await foundry.applications.api.DialogV2.prompt({
  title: "Select Activity",
  content: `<div class="activity-list">...</div>`,
  ok: { callback: (event, button, dialog) => selectedActivity }
});
```

**For Rich Selection UI** (recommended):
```typescript
// Create custom ApplicationV2 with Svelte component
class ActivitySelectionDialog extends SvelteApplicationMixin(
  foundry.applications.api.ApplicationV2
) {
  _createComponent(node) {
    return mount(ActivitySelector, { target: node, props: {...} });
  }
}
```

**Migration Plan**:
1. Replace `Dialog` with `DialogV2.prompt()` for quick fix
2. Later create `ActivitySelector.svelte` component for better UX
3. Use same pattern for end-of-turn dialog

This plan makes sense to me. Let's go with it

---
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
Let's start with the Questions panel and then dive right intot eh turn plans panel

after that we'll do the reactions panel then the favorites and history

The roll button isn't really a thing anymore. We'll have a save & clear button on each turn plan card


---

## Additional Questions

**Q14**: Any **other requirements** or features you'd like in the UI components that aren't covered above?

I can't think of any right now

**Q15**: Are there any **existing Foundry modules** whose UI you particularly like that we should reference?

I've mentioned this a lot, but we should be importing from and using tidy5e components wherever possible. Ideally via its api

**Q16**: Should we plan for **localization** (i18n) from the start, or add it later?
- **Option A**: Build with localization from start (use `game.i18n.localize()`)
- **Option B**: Hardcode English, add i18n in Phase 7
- **Option C**: Use localization for major text, hardcode for small labels

**USER REQUEST**: Please tell me more about how much extra work it is to deal with the i18n localization.

---

### 🔍 ANALYSIS - Localization Implementation Effort

**Localization is MINIMAL extra work** if done from the start:

**How Foundry i18n Works**:
1. **Define strings** in `public/lang/en.json`:
   ```json
   {
     "TURN_PREP.DmQuestions.Title": "DM Questions",
     "TURN_PREP.DmQuestions.AddButton": "Add Question",
     "TURN_PREP.TurnPlan.SaveButton": "Save & Clear"
   }
   ```

2. **Use in Svelte** with FoundryAdapter:
   ```svelte
   import { FoundryAdapter } from 'src/foundry/foundry-adapter';
   const localize = FoundryAdapter.localize;
   
   <button>{localize('TURN_PREP.TurnPlan.SaveButton')}</button>
   ```

3. **Community can translate** by creating `de.json`, `es.json`, etc.

**Tidy5e's Pattern** (found throughout codebase):
```svelte
<script>
  const localize = FoundryAdapter.localize;
</script>

<label>{localize('DND5E.FeatureAdd')}</label>
<button title={localize('TIDY5E.RestHint')}>
  {localize('TIDY5E.ShortRest')}
</button>
```

**Effort Comparison**:

| Approach | Initial Work | Later Migration | Community Value |
|----------|--------------|-----------------|-----------------|
| **Option A** (Start Now) | +10% setup time | ✅ None | ✅ High |
| **Option B** (Hardcode) | ✅ Fastest | 😰 Tedious find/replace | ❌ None |
| **Option C** (Partial) | +5% setup | 😐 Still need to convert | 😐 Medium |

**RECOMMENDATION**: ✅ **Build with i18n from Start (Option A)**

**Why**:
- ✅ Only ~10% more initial work
- ✅ Avoids painful later migration
- ✅ Enables community translations
- ✅ Professional module standard
- ✅ Already set up in your project

**Best Practices**:
- Use descriptive keys: `TURN_PREP.ComponentName.ElementName`
- Group by component/feature
- Add placeholders for dynamic content:
  ```javascript
  localize('TURN_PREP.History.EntryCount', { count: 5 })
  // "You have {count} saved turns" → "You have 5 saved turns"
  ```
- Keep `en.json` updated as you add UI

**Setup Checklist**:
- ✅ `public/lang/en.json` file exists
- ✅ Module.json declares language support
- ✅ Components import `FoundryAdapter.localize`
- ✅ Use consistent key naming convention

---

Let's go ahead and build with il8n for localization from the get go. 

---

## 📋 RESEARCH SUMMARY & KEY DECISIONS

### ✅ Confirmed Technical Decisions

Based on Tidy5e research, we will use:

1. **Svelte 5 Runes** (`$state`, `$derived`, `$effect`, `$bindable`)
2. **Hybrid Data Pattern**: Context for sheet data, reactive .svelte.ts for global state, props for local
3. **Reusable Component Library**: Import Tidy5e components where possible, create custom when needed
4. **LESS for Styling**: Continue with LESS, use Tidy5e's CSS variables
5. **Direct API Calls**: Components call TurnPrepAPI methods directly
6. **ApplicationV2 Auto-Rendering**: Let Foundry handle actor update reactivity
7. **Edit Checkpoints for "Undo"**: No custom undo/redo system
8. **DialogV2 for Dialogs**: Migrate deprecated Dialog immediately
9. **i18n from Start**: Use `FoundryAdapter.localize()` for all text

Scan through above for my answers to these outstanding questions, but I think your recommendations are perfect.

### 🔄 Clarifying Questions for User

Before creating the implementation plan, please clarify:

1. **Q1.2 Follow-up**: For the turn prep data, should we:
   - Access via Svelte context (passed down from sheet)?
   - Create a reactive `turn-prep-state.svelte.ts` file?
   - Or mix: context for actor/sheet, reactive file for module settings?

   A mix as described in your recommendation above

2. **Component Integration**: Since we're targeting Tidy5e's sidebar:
   - Should we create a custom sidebar tab integration?
   - Or add as a regular sheet tab alongside Inventory, Spells, etc.?
   - Do you want both? (Tab for current turn, sidebar for history/favorites)

   Both, just as you said. I have seen that some sheet tabs auto hide or show the sidebar. If possible I'd like to auto-show the sidebar when switching to the turn prep tab and changing to the turns tab within the sidebar.

3. **Feature Display**: You mentioned using Tidy5e's item table display. Should we:
   - Import and use their existing `TidyTable` components?
   - Create custom table components that look similar?
   - Use a card-based layout instead of tables?

   Import and use it within our custom cards

4. **Styling Scope**:
   - Should we create a dedicated `turn-prep.less` file?
   - Or use only component-scoped styles?
   - Import and extend Tidy5e's variables/mixins?

   Import and extend Tidy5e.

5. **Mobile/Tablet** (you said desktop only):
   - Confirm: No responsive considerations needed?
   - Can we assume minimum screen width (e.g., 1024px)?

### 📦 Components To Import from Tidy5e

These components are available and recommended for use:

- **Input**: `TextInput`, `NumberInput`, `Checkbox`, `Select`
- **Buttons**: `ButtonMenu`, `ButtonMenuCommand`, `ToggleButton`
- **Layout**: `TidyTable`, `TidyTableRow`, `TidyTableCell`
- **Forms**: `FormGroup`, `TidyFormInput`
- **UI**: `PropertyTag`, `HorizontalLineSeparator`, `Dnd5eIcon`

Let's use them!

### 🎯 Next Steps After Clarification

1. Create detailed component specifications
2. Set up base component structure
3. Implement DM Questions Panel (simplest)
4. Implement Turn Plans Panel (most complex)
5. Implement Reactions Panel
6. Implement History/Favorites
7. Integration testing

---

## Next Steps

Once you answer these questions:
1. I'll create **PHASE4_IMPLEMENTATION_PLAN.md** with detailed specifications
2. We'll start building components in priority order
3. Each component will be tested individually before integration

**Expected Timeline**: 2-3 implementation sessions per component (6 components total)

