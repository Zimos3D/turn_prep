# Phase 4 Implementation Plan - UI Components

**Status**: In Progress - Session 0 & 1  
**Phase**: 4 - UI Components  
**Dependencies**: Phase 1 ✅, Phase 2 ✅, Phase 3 ✅  
**Start Date**: January 21, 2026  
**Last Updated**: Session 0 & 1 - Tab integration complete, DM Questions panel added

---

## ⚠️ CRITICAL: Tidy5e Svelte Integration Findings

### DO NOT Use SvelteTab with Compiled Svelte Components

**Problem Discovered**: Attempting to use `api.models.SvelteTab` with our compiled Svelte components causes runtime conflicts.

**Root Cause**:
- Tidy5e bundles Svelte 5 runtime in their module
- Our module compiles Svelte components with its own Svelte 5 runtime
- Two separate Svelte runtimes conflict when Tidy5e tries to mount our components
- Errors encountered:
  - `TypeError: Cannot read properties of undefined (reading 'call')` - `first_child_getter` undefined
  - `HierarchyRequestError: Failed to execute 'appendChild' on 'Node'`

**Required Solution - Use HtmlTab Instead**:
```typescript
// ✅ CORRECT - Use HtmlTab with HTML strings
api.registerCharacterTab(
  new api.models.HtmlTab({
    title: 'Turn Prep',
    tabId: TAB_ID_MAIN,
    html: createMainTabHtml(),  // Returns HTML string
    enabled: (data: any) => true,
    onRender: (params: any) => {
      // Initialize handlers here
      initializeDmQuestionsPanel(params.data.actor, params.element);
    }
  })
);

// ❌ WRONG - SvelteTab causes dual runtime conflict
api.registerCharacterTab(
  new api.models.SvelteTab({
    component: MyCompiledSvelteComponent  // This will fail!
  })
);
```

**Implementation Approach**:
1. Use `HtmlTab` for tab registration
2. Generate HTML strings with inline styles
3. Attach event listeners via `onRender` callback
4. Use vanilla DOM manipulation or lightweight rendering
5. Store state in actor flags, update via handlers

**Future Svelte Option** (Not Yet Implemented):
- Could potentially use Tidy5e's `api.svelte.framework.mount()` to share their runtime
- Would require passing raw/uncompiled components
- Complex build configuration needed
- HtmlTab works well for current needs

**See Full Details**: `RESEARCH_FINDINGS.md` → "Tidy5e Svelte Integration" section

---

## Overview

Phase 4 builds the UI components integrated into Tidy5e character sheets. Due to Svelte runtime conflicts, we're using HtmlTab with vanilla JavaScript instead of Svelte components.

### Technical Stack (Updated)

- **Framework**: ~~Svelte 5~~ → **HtmlTab + Vanilla JS** (due to runtime conflicts)
- **Styling**: Inline styles + LESS for shared classes
- **Data Flow**: Actor flags + event handlers
- **Integration**: Tidy5e HtmlTab API with onRender callbacks
- **Dialogs**: DialogV2 (migrate deprecated Dialog)
- **Localization**: FoundryAdapter.localize() from start
- **API Communication**: Direct calls to TurnPrepAPI

### Implementation Priority

1. **Tidy5e Sheet Integration** ✅ (COMPLETE - Session 0 & 1)
   - Using HtmlTab instead of SvelteTab due to runtime conflicts
   - Main "Turn Prep" tab registered and rendering
   - Sidebar "Turns" tab registered and rendering
   
2. **DM Questions Panel** 🚧 (IN PROGRESS - Session 0 & 1)
   - Basic HTML structure created
   - 5 question fields with labels
   - Individual clear buttons
   - Clear All and Save buttons
   - Event handlers implemented in DmQuestionsHandler.ts
   - Auto-save with 500ms debounce
   - Data persistence via actor flags
   - **TODO**: Add whisper/public chat functionality
   
3. **Turn Plans Panel** (next - most complex main interface)
4. **Reactions Panel** (medium - similar to turn plans but simpler)
5. **History & Favorites** (medium - display and restore functionality)
6. **Dialog Migrations** (activity selector and end of turn dialogs)

---

## Current Implementation Status

### ✅ Completed (Session 0 & 1)

**Files Created**:
- `src/sheets/tidy5e/TidyHtmlTabs.ts` - HTML generation for tabs
- `src/sheets/tidy5e/DmQuestionsHandler.ts` - Event handlers and data persistence
- `src/sheets/tidy5e/tidy-sheet-integration.ts` - Tab registration with onRender callbacks

**Tab Integration**:
- Main tab: "Turn Prep" with DM Questions panel
- Sidebar tab: "Turns" (placeholder for history/favorites)
- Using HtmlTab API to avoid Svelte runtime conflicts
- onRender callback initializes event handlers

**DM Questions Panel**:
- 5 predefined questions: Main Action, Bonus Action, Movement, Reaction, Other
- Auto-save on input (500ms debounce)
- Save on blur (leaving field)
- Individual clear buttons per question
- Clear All button with confirmation dialog
- Manual Save button
- Data stored in actor flags: `turn-prep.turnPrepData.dmQuestions`

### 🚧 In Progress

**DM Questions Panel Enhancements**:
- Add whisper to DM functionality
- Add public chat message functionality
- Improve visual styling with Tidy5e theme integration

---

## Component Specifications

### 1. DM Questions Panel

**Purpose**: Quick text entry for questions to ask the DM during the player's turn.

**Current Implementation** (Session 0 & 1):
```
┌─────────────────────────────────────────────────────────────┐
│ 🎲 DM Questions                                             │
├─────────────────────────────────────────────────────────────┤
│ Main Action:     [input........................] [Clear ✕] │
│ Bonus Action:    [input........................] [Clear ✕] │
│ Movement:        [input........................] [Clear ✕] │
│ Reaction Plan:   [input........................] [Clear ✕] │
│ Other:           [input........................] [Clear ✕] │
│                                   [Clear All] [Save Answers] │
└─────────────────────────────────────────────────────────────┘
```

**Implementation Details**:
- HTML-based UI (not Svelte component)
- Event handlers in DmQuestionsHandler.ts
- Auto-save with debouncing
- Actor flag storage

**Original Specification** (for reference):
````

**Data Model**:
```typescript
interface DmQuestion {
  id: string;           // UUID
  text: string;         // Question content
  createdTime: number;  // Timestamp
}
```

**Features**:
- Minimum 1 question row (cannot remove last row)
- TextArea auto-expands to 4-5 lines, then scrolls
- Add button creates new row below current
- Remove button deletes row (if > 1 row exists)
- Clear button empties text field only
- Whisper sends to DM as private message
- Public sends to chat for all to see
- Questions persist per character (not per plan)

**Tidy5e Components to Use**:
- `TextInput` (but as multi-line textarea variant)
- Custom button components with FontAwesome icons

**Localization Keys**:
```json
{
  "TURN_PREP.DmQuestions.Title": "DM Questions",
  "TURN_PREP.DmQuestions.AddTooltip": "Add Question",
  "TURN_PREP.DmQuestions.RemoveTooltip": "Remove Question",
  "TURN_PREP.DmQuestions.ClearTooltip": "Clear Text",
  "TURN_PREP.DmQuestions.WhisperTooltip": "Send to DM (Whisper)",
  "TURN_PREP.DmQuestions.PublicTooltip": "Send to Public Chat",
  "TURN_PREP.DmQuestions.Placeholder": "What question do you have for the DM?"
}
```

**API Methods Needed**:
```typescript
// In TurnPrepApi.ts
static async saveQuestions(actor: Actor, questions: DmQuestion[]): Promise<void>
static async sendQuestionToDm(actor: Actor, questionText: string): Promise<void>
static async sendQuestionPublic(actor: Actor, questionText: string): Promise<void>
```

**Implementation Steps**:
1. Create `DmQuestionsPanel.svelte` component
2. Create `QuestionRow.svelte` sub-component
3. Add localization strings to `public/lang/en.json`
4. Implement state management with `$state` rune
5. Add API methods for saving and sending questions
6. Style with LESS using Tidy5e variables
7. Test add/remove/clear/send functionality

---

### 2. Turn Plans Panel (Main Interface)

**Purpose**: Plan multiple turn options with features, triggers, and notes.

**Visual Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│ Current Turn Plans                          [+ New Plan]     │
├─────────────────────────────────────────────────────────────┤
│ ▼ Plan Name (editable)                     [★][🗑️][📋]      │
│   Trigger: [text field for condition/notes]                 │
│   ┌─────────────────────────────────────────────────────┐   │
│   │ Actions                                  [🔍]        │   │
│   │ ┌─────────────────────────────────────────────────┐ │   │
│   │ │ [Feature Item Row - Tidy5e TidyTable]          │ │   │
│   │ │ [Feature Item Row - Tidy5e TidyTable]          │ │   │
│   │ └─────────────────────────────────────────────────┘ │   │
│   └─────────────────────────────────────────────────────┘   │
│   ┌─────────────────────────────────────────────────────┐   │
│   │ Bonus Actions                            [🔍]        │   │
│   │ ┌─────────────────────────────────────────────────┐ │   │
│   │ │ [Feature Item Row - Tidy5e TidyTable]          │ │   │
│   │ └─────────────────────────────────────────────────┘ │   │
│   └─────────────────────────────────────────────────────┘   │
│   ┌─────────────────────────────────────────────────────┐   │
│   │ Additional Features                      [🔍]        │   │
│   │ ┌─────────────────────────────────────────────────┐ │   │
│   │ │ [Feature Item Row - Tidy5e TidyTable]          │ │   │
│   │ └─────────────────────────────────────────────────┘ │   │
│   └─────────────────────────────────────────────────────┘   │
│   ▼ Additional Details                                      │
│   ┌─────────────────────────────────────────────────────┐   │
│   │ Movement: [text field]                              │   │
│   │ Mechanical Notes: [text area]                       │   │
│   │ Roleplay Notes: [text area]                         │   │
│   └─────────────────────────────────────────────────────┘   │
│   [Save & Clear]                                            │
├─────────────────────────────────────────────────────────────┤
│ ▼ Backup Plan Name                         [★][🗑️][📋]      │
│   ...                                                        │
└─────────────────────────────────────────────────────────────┘
```

**Component Structure**:
```
TurnPlansPanel.svelte
├── TurnPlanCard.svelte (repeatable)
│   ├── PlanHeader.svelte
│   │   ├── PlanNameInput (editable title)
│   │   ├── FavoriteButton (fa-star)
│   │   ├── DeleteButton (fa-trash)
│   │   └── DuplicateButton (fa-copy)
│   ├── TriggerInput (text field)
│   ├── FeatureSection.svelte (x3: Actions, Bonus, Additional)
│   │   ├── SectionHeader (with search box)
│   │   ├── TidyTable (imported from Tidy5e)
│   │   │   ├── TidyTableRow (for each feature)
│   │   │   └── FeatureRowActions (remove, roll)
│   │   └── FeatureSearch (autocomplete/filter)
│   ├── AdditionalDetails.svelte (collapsible)
│   │   ├── MovementInput
│   │   ├── MechanicalNotesTextarea
│   │   └── RoleplayNotesTextarea
│   └── SaveClearButton
└── NewPlanButton
```

**Data Model**:
```typescript
interface TurnPlan {
  id: string;                    // UUID
  name: string;                  // User-editable name
  trigger: string;               // Condition/notes
  actions: string[];             // Item IDs
  bonusActions: string[];        // Item IDs
  additionalFeatures: string[];  // Item IDs
  movement: string;              // Text description
  mechanicalNotes: string;       // Text area
  roleplayNotes: string;         // Text area
  createdTime: number;           // Timestamp
  isFavorite: boolean;           // Star toggle
}
```

**Features**:
- Each plan is a collapsible card with collapse arrow (points right when collapsed, down when expanded)
- Arrow shows on hover (following Tidy5e pattern)
- Clicking plan name allows editing (not collapse)
- Plan name auto-generated on creation, then editable.
- Trigger field for "when to use this plan" notes
- Three feature sections: Actions, Bonus Actions, Additional Features
- Feature search box embedded in TidyTable header row (between title and column headers)
- Search results appear as overlay dropdown below search box
- Results show item/feature/spell name only, click to add to table
- Use Tidy5e's TidyTable components to display features as-is (don't customize display)
- Drag-and-drop features between plans
- Additional Details collapsible sub-section
- Save button saves plan to history (without clearing)
- Save & Clear button saves to history and clears current plan
- Favorite button adds to favorites list
- Duplicate button creates copy of plan
- Delete button removes plan (with confirmation)

**Feature Search Implementation**:
```typescript
// Filter actor items by:
// 1. Search text appears in item name (case-insensitive)
// 2. Activity activation type matches section
//    - Actions: activation.type === 'action'
//    - Bonus Actions: activation.type === 'bonus'
//    - Additional: any activation type (or none)
// 3. Show results in dropdown below search box
// 4. Click result to add to plan
```

**Search Box Integration**:
The TidyTable header row should be extended to incorporate the search field. Build this as a reusable component that can filter based on different activation costs. The results should show as an overlay just below the search box, covering up the elements below. The results should just show the name of the item, feature, or spell. When clicked, they should be added to that feature table.

**Tidy5e Components to Use**:
- `TidyTable`, `TidyTableRow`, `TidyTableCell` for feature display
- `TextInput` for plan name, trigger, movement
- `ExpandableContainer` for Additional Details section
- `ButtonMenu` for action buttons (favorite, delete, duplicate)
- `HorizontalLineSeparator` between sections

**Localization Keys**:
```json
{
  "TURN_PREP.TurnPlans.Title": "Current Turn Plans",
  "TURN_PREP.TurnPlans.NewPlan": "New Plan",
  "TURN_PREP.TurnPlans.PlanName": "Plan Name",
  "TURN_PREP.TurnPlans.Trigger": "Trigger",
  "TURN_PREP.TurnPlans.TriggerPlaceholder": "When would you use this plan?",
  "TURN_PREP.TurnPlans.Actions": "Actions",
  "TURN_PREP.TurnPlans.BonusActions": "Bonus Actions",
  "TURN_PREP.TurnPlans.AdditionalFeatures": "Additional Features",
  "TURN_PREP.TurnPlans.Movement": "Movement",
  "TURN_PREP.TurnPlans.MechanicalNotes": "Mechanical Notes",
  "TURN_PREP.TurnPlans.RoleplayNotes": "Roleplay Notes",
  "TURN_PREP.TurnPlans.AdditionalDetails": "Additional Details",
  "TURN_PREP.TurnPlans.SaveClear": "Save & Clear",
  "TURN_PREP.TurnPlans.FavoriteTooltip": "Add to Favorites",
  "TURN_PREP.TurnPlans.DeleteTooltip": "Delete Plan",
  "TURN_PREP.TurnPlans.DuplicateTooltip": "Duplicate Plan",
  "TURN_PREP.TurnPlans.SearchPlaceholder": "Search features...",
  "TURN_PREP.TurnPlans.DeleteConfirm": "Delete this turn plan?"
}
```

**API Methods Needed**:
```typescript
// In TurnPrepApi.ts
static async saveTurnPlan(actor: Actor, plan: TurnPlan): Promise<void>
static async deleteTurnPlan(actor: Actor, planId: string): Promise<void>
static async duplicateTurnPlan(actor: Actor, planId: string): Promise<TurnPlan>
static async toggleFavorite(actor: Actor, planId: string): Promise<void>
static async savePlanToHistory(actor: Actor, plan: TurnPlan): Promise<void>
static async getFilteredFeatures(actor: Actor, searchText: string, activationType?: string): Promise<Item[]>
```

**Implementation Steps**:
1. Create `TurnPlansPanel.svelte` main component
2. Create `TurnPlanCard.svelte` sub-component
3. Create `FeatureSection.svelte` with search box
4. Create `FeatureSearch.svelte` autocomplete component
5. Integrate Tidy5e's `TidyTable` components
6. Create `AdditionalDetails.svelte` collapsible section
7. Add all localization strings
8. Implement drag-and-drop for features
9. Add state management with `$state` rune
10. Connect to TurnPrepAPI methods
11. Style with LESS
12. Test all interactions (add, remove, search, save, duplicate)

**Auto-Generated Plan Names**:
```typescript
// Pattern: "Plan {number}" or "{Primary Action}" or "{Condition} Plan"
function generatePlanName(plan: TurnPlan, actor: Actor): string {
  // If has action items, use first action name
  if (plan.actions.length > 0) {
    const firstAction = actor.items.get(plan.actions[0]);
    return firstAction?.name || 'New Plan';
  }
  // Otherwise use number
  const existingPlans = getCurrentPlans(actor);
  return `Plan ${existingPlans.length + 1}`;
}
```

---

### 3. Reactions Panel

**Purpose**: Pre-plan reactions with triggers and supporting features.

**Visual Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│ Reaction Plans                              [+ New Reaction] │
├─────────────────────────────────────────────────────────────┤
│ ▼ Reaction Name (editable)                 [★][🗑️]          │
│   Trigger: [text field for when to use]                     │
│   ┌─────────────────────────────────────────────────────┐   │
│   │ Reactions                                [🔍]        │   │
│   │ ┌─────────────────────────────────────────────────┐ │   │
│   │ │ [Reaction Feature Row - Tidy5e TidyTable]      │ │   │
│   │ └─────────────────────────────────────────────────┘ │   │
│   └─────────────────────────────────────────────────────┘   │
│   ┌─────────────────────────────────────────────────────┐   │
│   │ Additional Features                      [🔍]        │   │
│   │ ┌─────────────────────────────────────────────────┐ │   │
│   │ │ [Feature Item Row - Tidy5e TidyTable]          │ │   │
│   │ └─────────────────────────────────────────────────┘ │   │
│   └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│ ▼ Shield Spell                             [★][🗑️]          │
│   ...                                                        │
└─────────────────────────────────────────────────────────────┘
```

**Component Structure**:
```
ReactionsPanel.svelte
├── ReactionCard.svelte (repeatable)
│   ├── ReactionHeader.svelte
│   │   ├── ReactionNameInput
│   │   ├── FavoriteButton
│   │   └── DeleteButton
│   ├── TriggerInput
│   ├── FeatureSection.svelte (x2: Reactions, Additional)
│   │   ├── SectionHeader (with search)
│   │   ├── TidyTable (Tidy5e component)
│   │   └── FeatureSearch
└── NewReactionButton
```

**Data Model**:
```typescript
interface Reaction {
  id: string;                    // UUID
  name: string;                  // User-editable name
  trigger: string;               // When to use (player notes)
  reactionFeatures: string[];    // Item IDs (activation.type === 'reaction')
  additionalFeatures: string[];  // Item IDs (any type)
  createdTime: number;           // Timestamp
  isFavorite: boolean;           // Star toggle
}
```

**Features**:
- Similar to Turn Plans but simpler (no movement/notes)
- Reactions persist (not cleared at end of turn)
- Trigger field is for player's decision-making notes, not mechanical trigger
- Two feature sections: Reactions, Additional Features
- Feature search filters by activation type (reactions only for Reactions section)
- Collapsible cards
- Favorite toggle
- Delete with confirmation

**Tidy5e Components to Use**:
- Same as Turn Plans Panel (TidyTable, TextInput, etc.)

**Localization Keys**:
```json
{
  "TURN_PREP.Reactions.Title": "Reaction Plans",
  "TURN_PREP.Reactions.NewReaction": "New Reaction",
  "TURN_PREP.Reactions.ReactionName": "Reaction Name",
  "TURN_PREP.Reactions.Trigger": "Trigger",
  "TURN_PREP.Reactions.TriggerPlaceholder": "When would you use this reaction?",
  "TURN_PREP.Reactions.ReactionFeatures": "Reactions",
  "TURN_PREP.Reactions.AdditionalFeatures": "Additional Features",
  "TURN_PREP.Reactions.FavoriteTooltip": "Add to Favorites",
  "TURN_PREP.Reactions.DeleteTooltip": "Delete Reaction",
  "TURN_PREP.Reactions.SearchPlaceholder": "Search reactions...",
  "TURN_PREP.Reactions.DeleteConfirm": "Delete this reaction plan?"
}
```

**API Methods Needed**:
```typescript
// In TurnPrepApi.ts
static async saveReaction(actor: Actor, reaction: Reaction): Promise<void>
static async deleteReaction(actor: Actor, reactionId: string): Promise<void>
static async toggleReactionFavorite(actor: Actor, reactionId: string): Promise<void>
```

**Implementation Steps**:
1. Create `ReactionsPanel.svelte` component
2. Create `ReactionCard.svelte` sub-component
3. Reuse `FeatureSection.svelte` from Turn Plans
4. Add localization strings
5. Implement state management
6. Connect to API methods
7. Style with LESS
8. Test add/remove/favorite functionality

---

### 4. History & Favorites Panel

**Purpose**: Display saved turn plans and favorites in Tidy5e sidebar.

**Visual Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│ Turns (Sidebar Tab)                                         │
├─────────────────────────────────────────────────────────────┤
│ Favorites                                                    │
├─────────────────────────────────────────────────────────────┤
│ ► Plan Name                                    [⭐][📋][🗑️]  │
│   Action: Longsword, Bonus: Second Wind                     │
├─────────────────────────────────────────────────────────────┤
│ ► Healing Plan                                 [⭐][📋][🗑️]  │
│   Action: Healing Word, Bonus: Cure Wounds                  │
├─────────────────────────────────────────────────────────────┤
│ History (Last 10 Turns)                                     │
├─────────────────────────────────────────────────────────────┤
│ ► Turn 5 - Attack Plan                        [⭐][📋][🗑️]   │
│   Action: Firebolt, Bonus: None                             │
│   ▼ (expanded shows full details + rolls made)              │
│      Trigger: Enemy within 120ft                            │
│      Actions: Firebolt                                       │
│      Movement: Move 30ft closer                             │
│      Rolls: Attack Roll: 18 (hit), Damage: 8 fire           │
├─────────────────────────────────────────────────────────────┤
│ ► Turn 4 - Healing                            [⭐][📋][🗑️]   │
│   Action: Cure Wounds, Bonus: None                          │
└─────────────────────────────────────────────────────────────┘
```

**Component Structure**:
```
HistoryFavoritesPanel.svelte
├── FavoritesSection.svelte
│   ├── SectionHeader ("Favorites")
│   └── FavoriteCard.svelte (repeatable)
│       ├── CardHeader (plan name, buttons)
│       ├── CardSummary (first action, first bonus)
│       └── CardExpanded (full details)
│           ├── TriggerDisplay
│           ├── FeaturesList
│           ├── MovementDisplay
│           └── NotesDisplay
└── HistorySection.svelte
    ├── SectionHeader ("History (Last 10 Turns)")
    └── HistoryCard.svelte (repeatable)
        ├── CardHeader (turn number, plan name, buttons)
        ├── CardSummary (first action, first bonus)
        └── CardExpanded (full details + rolls)
            ├── TriggerDisplay
            ├── FeaturesList
            ├── MovementDisplay
            ├── NotesDisplay
            └── RollsDisplay (rolls made during turn)
```

**Data Model**:
```typescript
interface TurnSnapshot {
  id: string;                    // UUID
  planId?: string;               // Reference to original plan (if applicable)
  name: string;                  // Plan name at time of snapshot
  turnNumber?: number;           // Combat turn number (if in combat)
  createdTime: number;           // When snapshot was created
  trigger?: string;              // Trigger text (truncated in summary)
  features: SnapshotFeature[];   // Features used
  movement?: string;             // Movement text
  mechanicalNotes?: string;      // Notes
  roleplayNotes?: string;        // Notes
  rolls?: RollRecord[];          // Rolls made during this turn
  isFavorite: boolean;           // Star toggle
}

interface SnapshotFeature {
  itemId: string;                // ID at time of snapshot
  itemName: string;              // Name at time of snapshot (for display if item deleted)
  itemType: string;              // Type at time of snapshot
  activationType: string;        // Activation cost type
  section: 'action' | 'bonus' | 'additional' | 'reaction';
}

interface RollRecord {
  id: string;                    // UUID
  rollType: 'attack' | 'damage' | 'save' | 'check' | 'other';
  itemName: string;              // Which feature was rolled
  result: string;                // Roll result text (e.g., "18 (hit)", "8 fire damage")
  timestamp: number;             // When roll was made
  // For saving throw rolls (optional fields)
  saveDC?: number;               // DC for saving throw
  saveAbility?: string;          // Ability score (e.g., "dex", "wis")
  targetName?: string;           // Token/actor name that rolled
  saveRoll?: number;             // The d20 roll value
  saveSuccess?: boolean;         // Pass/fail result
}
```

**Features**:
- Display favorites at top (always visible)
- Display last N history entries below (N from module settings)
- Cards collapsible (click to expand/collapse)
- Summary shows: plan name, first action name, first bonus action name
- Expanded shows: full plan details, rolls made (for history only)
- Primary button: Load to Current Turn (fa-share icon)
- Context menu button: Three dots (fa-ellipsis-vertical) - use Tidy5e's component
- Context menu (right-click or ellipsis button):
  - Delete
  - Duplicate (Favorites only)
  - Edit
  - Load as Current Turn Plan (fa-share)
  - Refresh Rolls (History only, fa-repeat) - rechecks chat for new rolls
  - Add as Favorite (History only, fa-star)
- Refresh Rolls: Scans chat history for rolls, saves snapshot before changes if rolls found
- Roll display includes:
  - Attack rolls and damage rolls
  - Saving throws with: ability, DC, target names, rolls, pass/fail, spell damage
- For saving throw spells: record each creature's name, roll, and pass/fail (not damage applied)
- **Future Enhancement**: Global setting for whether NPC rolls get recorded (deferred to polish phase)
- Favorites persist indefinitely
- History limited by module setting (default 10)
- Snapshots store display names - no missing item checks when displaying

**Tidy5e Components to Use**:
- `ExpandableContainer` for collapsible cards
- `HorizontalLineSeparator` between sections
- Custom card components (not using TidyTable here)

**Localization Keys**:
```json
{
  "TURN_PREP.History.Title": "Turns",
  "TURN_PREP.History.FavoritesTitle": "Favorites",
  "TURN_PREP.History.HistoryTitle": "History (Last {limit} Turns)",
  "TURN_PREP.History.NoFavorites": "No favorites saved yet",
  "TURN_PREP.History.NoHistory": "No turn history yet",
  "TURN_PREP.History.Action": "Action",
  "TURN_PREP.History.BonusAction": "Bonus",
  "TURN_PREP.History.None": "None",
  "TURN_PREP.History.TurnNumber": "Turn {number}",
  "TURN_PREP.History.FavoriteTooltip": "Toggle Favorite",
  "TURN_PREP.History.RestoreTooltip": "Restore to Current Plans",
  "TURN_PREP.History.DeleteTooltip": "Delete from History",
  "TURN_PREP.History.MissingFeature": "(Missing)",
  "TURN_PREP.History.RollsMade": "Rolls Made",
  "TURN_PREP.History.DeleteConfirm": "Delete this from history?"
}
```

**API Methods Needed**:
```typescript
// In TurnPrepApi.ts
static async getFavorites(actor: Actor): Promise<TurnSnapshot[]>
static async getHistory(actor: Actor): Promise<TurnSnapshot[]>  // Uses setting for limit
static async toggleSnapshotFavorite(actor: Actor, snapshotId: string): Promise<void>
static async loadSnapshotToCurrent(actor: Actor, snapshotId: string): Promise<TurnPlan>
static async deleteSnapshot(actor: Actor, snapshotId: string): Promise<void>
static async duplicateSnapshot(actor: Actor, snapshotId: string): Promise<TurnSnapshot>
static async editSnapshot(actor: Actor, snapshotId: string, updates: Partial<TurnSnapshot>): Promise<void>
static async refreshSnapshotRolls(actor: Actor, snapshotId: string): Promise<RollRecord[]>
static async addRollToSnapshot(actor: Actor, snapshotId: string, roll: RollRecord): Promise<void>
```

**Implementation Steps**:
1. Create `HistoryFavoritesPanel.svelte` component
2. Create `FavoritesSection.svelte` and `HistorySection.svelte`
3. Create `FavoriteCard.svelte` and `HistoryCard.svelte`
4. Create `RollsDisplay.svelte` for showing rolls made
5. Add localization strings
6. Implement state management
7. Handle missing items gracefully
8. Connect to API methods
9. Style with LESS
10. Test restore, favorite, delete functionality

---

## Dialog Migrations (Immediate)

### 1. Activity Selection Dialog

**Current Issue**: Using deprecated `Dialog` class in Phase 3.

**Location**: `src/features/context-menu/ContextMenuHandler.ts` line 343

**Migration Strategy**:
1. **Quick Fix**: Replace `Dialog` with `DialogV2.prompt()`
2. **Better UX**: Create `ActivitySelector.svelte` component

**DialogV2.prompt() Implementation**:
```typescript
// Quick fix approach
const selectedActivity = await foundry.applications.api.DialogV2.prompt({
  title: FoundryAdapter.localize('TURN_PREP.ActivitySelector.Title'),
  content: `
    <div class="activity-list">
      ${activities.map(act => `
        <button class="activity-option" data-activity-id="${act.id}">
          ${act.name}
        </button>
      `).join('')}
    </div>
  `,
  ok: {
    label: FoundryAdapter.localize('TURN_PREP.ActivitySelector.Select'),
    callback: (event, button, dialog) => {
      const selected = dialog.element.querySelector('.activity-option.selected');
      return selected?.dataset.activityId;
    }
  }
});
```

**Svelte Component Approach** (required for both dialogs):
```typescript
// Create ActivitySelectorDialog.svelte component
class ActivitySelectorDialog extends SvelteApplicationMixin(
  foundry.applications.api.ApplicationV2
) {
  static DEFAULT_OPTIONS = {
    id: 'turn-prep-activity-selector',
    window: {
      title: 'TURN_PREP.ActivitySelector.Title',
      resizable: false
    },
    position: { width: 400 }
  };

  _createComponent(node) {
    return mount(ActivitySelector, {
      target: node,
      props: {
        activities: this.options.activities,
        onSelect: (activity) => {
          this.close();
          this.options.onSelect(activity);
        }
      }
    });
  }
}

// Same pattern for EndOfTurnDialog.svelte
class EndOfTurnDialog extends SvelteApplicationMixin(
  foundry.applications.api.ApplicationV2
) {
  // Similar structure with custom UI layout
}
```

**Localization Keys**:
```json
{
  "TURN_PREP.ActivitySelector.Title": "Select Activity",
  "TURN_PREP.ActivitySelector.Select": "Select",
  "TURN_PREP.ActivitySelector.Cancel": "Cancel",
  "TURN_PREP.ActivitySelector.Prompt": "This feature has multiple activities. Which would you like to use?"
}
```

**Implementation Steps**:
1. Create `ActivitySelector.svelte` component
2. Create `ActivitySelectorDialog` wrapper class
3. Update `ContextMenuHandler.ts` to use new dialog
4. Add localization strings
5. Style with LESS
6. Test with multi-activity items

---

### 2. End of Turn Dialog

**Current Implementation**: Phase 3 end-of-turn dialog using deprecated `Dialog`.

**Location**: Referenced in Phase 3 (needs exact location)

**DialogV2.confirm() Implementation**:
```typescript
const shouldSave = await foundry.applications.api.DialogV2.confirm({
  title: FoundryAdapter.localize('TURN_PREP.EndOfTurn.Title'),
  content: `<p>${FoundryAdapter.localize('TURN_PREP.EndOfTurn.Prompt')}</p>`,
  yes: {
    icon: '<i class="fas fa-save"></i>',
    label: FoundryAdapter.localize('TURN_PREP.EndOfTurn.SaveAndClear'),
    default: true
  },
  no: {
    icon: '<i class="fas fa-times"></i>',
    label: FoundryAdapter.localize('TURN_PREP.EndOfTurn.DiscardAndClear')
  }
});

if (shouldSave) {
  await TurnPrepAPI.savePlanToHistory(actor, currentPlan);
}
await TurnPrepAPI.clearCurrentPlan(actor);
```

**Localization Keys**:
```json
{
  "TURN_PREP.EndOfTurn.Title": "End Turn",
  "TURN_PREP.EndOfTurn.Prompt": "Your turn has ended. Would you like to save this plan to history?",
  "TURN_PREP.EndOfTurn.SaveAndClear": "Save & Clear",
  "TURN_PREP.EndOfTurn.DiscardAndClear": "Discard & Clear"
}
```

**Implementation Steps**:
1. Create `EndOfTurnDialog.svelte` component with custom layout
2. Create `EndOfTurnDialog` wrapper class (ApplicationV2 with Svelte)
3. Find current Dialog usage in Phase 3 code and replace
4. Add localization strings
5. Style with LESS
6. Test in combat scenario

---

## Tidy5e Sheet Integration

### Tab Registration

**Register Two Tabs**:
1. **Main Tab**: "Turn Prep" in main tab bar
2. **Sidebar Tab**: "Turns" in sidebar for history/favorites (fa-hourglass icon)

**Registration Code**:
```typescript
// In src/sheets/tidy5e/tidy-sheet-integration.ts

Hooks.once('tidy5e-sheet.ready', (api) => {
  // Register main tab
  api.registerCharacterTab(
    new api.models.SvelteTab({
      title: 'TURN_PREP.Tabs.TurnPrep',
      tabId: 'turn-prep',
      html: '',
      enabled: (data) => true,
      onRender: (params) => {
        // Mount TurnPrepMainTab component
        return mount(TurnPrepMainTab, {
          target: params.tabContentsElement,
          props: {
            actor: params.data.actor,
            context: getSheetContext()
          }
        });
      }
    })
  );

  // Register sidebar tab
  api.registerCharacterSidebarTab(
    new api.models.SvelteTab({
      title: 'TURN_PREP.Tabs.Turns',
      tabId: 'turn-prep-sidebar',
      html: '',
      enabled: (data) => true,
      onRender: (params) => {
        // Mount HistoryFavoritesPanel component
        return mount(HistoryFavoritesPanel, {
          target: params.tabContentsElement,
          props: {
            actor: params.data.actor,
            context: getSheetContext()
          }
        });
      }
    })
  );
});
```

**Auto-Show Sidebar**:
```typescript
// When Turn Prep tab is activated, show sidebar and switch to Turns tab
api.hooks.on('tidy5e-sheet.tabActivated', (data) => {
  if (data.tabId === 'turn-prep') {
    // Show sidebar
    data.sheet.toggleSidebar(true);
    // Switch to Turns sidebar tab
    data.sheet.activateSidebarTab('turn-prep-sidebar');
  }
});
```

**Tab Icons**:
- Main Tab: `fa-clipboard-list` (turn planning)
- Sidebar Tab: `fa-clock-rotate-left` (history)

**Localization Keys**:
```json
{
  "TURN_PREP.Tabs.TurnPrep": "Turn Prep",
  "TURN_PREP.Tabs.Turns": "Turns"
}
```

**Implementation Steps**:
1. Create `tidy-sheet-integration.ts` file
2. Register both tabs with Tidy5e API
3. Create `TurnPrepMainTab.svelte` wrapper component
4. Add auto-show sidebar logic
5. Test tab switching and sidebar behavior

---

## Data Management Setup

### Context-Based Data Flow

**Turn Prep Context**:
```typescript
// In src/types/turn-prep.types.ts
export interface TurnPrepContext {
  actor: Actor;
  storage: TurnPrepStorage;
  api: typeof TurnPrepAPI;
  settings: TurnPrepSettings;
  localize: (key: string, data?: Record<string, any>) => string;
}
```

**Providing Context**:
```typescript
// In TurnPrepMainTab.svelte
import { setContext } from 'svelte';
import { TURN_PREP_CONTEXT_KEY } from 'src/constants';

let { actor, context: sheetContext } = $props();

const turnPrepContext: TurnPrepContext = {
  actor,
  storage: TurnPrepStorage.getInstance(),
  api: TurnPrepAPI,
  settings: getTurnPrepSettings(),
  localize: FoundryAdapter.localize
};

setContext(TURN_PREP_CONTEXT_KEY, turnPrepContext);
```

**Consuming Context**:
```typescript
// In child components (e.g., DmQuestionsPanel.svelte)
import { getContext } from 'svelte';
import { TURN_PREP_CONTEXT_KEY } from 'src/constants';

const { actor, api, localize } = getContext<TurnPrepContext>(TURN_PREP_CONTEXT_KEY);

async function saveQuestions() {
  await api.saveQuestions(actor, questions);
}
```

**Reactive Module State**:
```typescript
// In src/state/turn-prep-state.svelte.ts
let _currentPlans = $state<TurnPlan[]>([]);
let _reactions = $state<Reaction[]>([]);
let _dmQuestions = $state<DmQuestion[]>([]);

export function getTurnPrepState() {
  return {
    get currentPlans() { return _currentPlans; },
    set currentPlans(value) { _currentPlans = value; },
    get reactions() { return _reactions; },
    set reactions(value) { _reactions = value; },
    get dmQuestions() { return _dmQuestions; },
    set dmQuestions(value) { _dmQuestions = value; }
  };
}
```

**Implementation Steps**:
1. Create `turn-prep-state.svelte.ts` file
2. Define `TurnPrepContext` interface
3. Set up context in `TurnPrepMainTab.svelte`
4. Import and use context in child components
5. Test data flow and reactivity

---

## Styling System

### LESS File Structure

**New Files to Create**:
```
styles/
├── turn-prep.less (main entry)
├── variables.less (already exists - extend)
├── components/
│   ├── dm-questions.less
│   ├── turn-plans.less
│   ├── reactions.less
│   ├── history-favorites.less
│   ├── feature-search.less
│   └── turn-prep-cards.less
```

**Main LESS File**:
```less
// styles/turn-prep.less
@import './variables.less';

// Import Tidy5e variables (if accessible)
// @import '../../tidy5e-sheet/src/less/variables.less';

// Component styles
@import './components/dm-questions.less';
@import './components/turn-plans.less';
@import './components/reactions.less';
@import './components/history-favorites.less';
@import './components/feature-search.less';
@import './components/turn-prep-cards.less';

// Use Tidy5e CSS variables for consistency
.turn-prep-panel {
  background: var(--t5e-background);
  color: var(--t5e-primary-color);
  border: 1px solid var(--t5e-separator-color);
  border-radius: var(--t5e-border-radius);
  padding: var(--t5e-spacing-md);
}

.turn-prep-card {
  background: var(--t5e-sheet-background);
  border: 1px solid var(--t5e-faint-color);
  border-radius: var(--t5e-border-radius);
  margin-bottom: var(--t5e-spacing-sm);
  
  &.expanded {
    box-shadow: var(--t5e-shadow-light);
  }
}
```

**Component-Scoped Styles**:
```svelte
<!-- In DmQuestionsPanel.svelte -->
<style lang="less">
  .dm-questions-panel {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    
    .question-row {
      display: grid;
      grid-template-columns: auto auto 1fr auto auto auto;
      gap: 0.5rem;
      align-items: start;
      
      textarea {
        min-height: 4rem;
        max-height: 8rem;
        resize: vertical;
        font-family: inherit;
      }
    }
  }
</style>
```

**Tidy5e CSS Variables to Use**:
- `--t5e-background`: Main background color
- `--t5e-sheet-background`: Sheet background
- `--t5e-primary-color`: Primary text color
- `--t5e-separator-color`: Border/separator color
- `--t5e-faint-color`: Subtle borders
- `--t5e-border-radius`: Consistent border radius
- `--t5e-spacing-sm/md/lg`: Consistent spacing
- `--t5e-shadow-light`: Subtle shadow

**Implementation Steps**:
1. Create component LESS files in `styles/components/`
2. Import in main `turn-prep.less`
3. Use component-scoped `<style lang="less">` in Svelte files
4. Test theming with Tidy5e's customization panel
5. Ensure consistent look with Tidy5e sheets

---

## Localization Setup

### File Structure

**Main Localization File**:
```
public/
└── lang/
    └── en.json (extend existing)
```

**Complete Localization Keys** (consolidate all above):
```json
{
  "TURN_PREP.Tabs.TurnPrep": "Turn Prep",
  "TURN_PREP.Tabs.Turns": "Turns",
  
  "TURN_PREP.DmQuestions.Title": "DM Questions",
  "TURN_PREP.DmQuestions.AddTooltip": "Add Question",
  "TURN_PREP.DmQuestions.RemoveTooltip": "Remove Question",
  "TURN_PREP.DmQuestions.ClearTooltip": "Clear Text",
  "TURN_PREP.DmQuestions.WhisperTooltip": "Send to DM (Whisper)",
  "TURN_PREP.DmQuestions.PublicTooltip": "Send to Public Chat",
  "TURN_PREP.DmQuestions.Placeholder": "What question do you have for the DM?",
  
  "TURN_PREP.TurnPlans.Title": "Current Turn Plans",
  "TURN_PREP.TurnPlans.NewPlan": "New Plan",
  "TURN_PREP.TurnPlans.PlanName": "Plan Name",
  "TURN_PREP.TurnPlans.Trigger": "Trigger",
  "TURN_PREP.TurnPlans.TriggerPlaceholder": "When would you use this plan?",
  "TURN_PREP.TurnPlans.Actions": "Actions",
  "TURN_PREP.TurnPlans.BonusActions": "Bonus Actions",
  "TURN_PREP.TurnPlans.AdditionalFeatures": "Additional Features",
  "TURN_PREP.TurnPlans.Movement": "Movement",
  "TURN_PREP.TurnPlans.MechanicalNotes": "Mechanical Notes",
  "TURN_PREP.TurnPlans.RoleplayNotes": "Roleplay Notes",
  "TURN_PREP.TurnPlans.AdditionalDetails": "Additional Details",
  "TURN_PREP.TurnPlans.SaveClear": "Save & Clear",
  "TURN_PREP.TurnPlans.FavoriteTooltip": "Add to Favorites",
  "TURN_PREP.TurnPlans.DeleteTooltip": "Delete Plan",
  "TURN_PREP.TurnPlans.DuplicateTooltip": "Duplicate Plan",
  "TURN_PREP.TurnPlans.Save": "Save",
  "TURN_PREP.TurnPlans.SearchPlaceholder": "Search features...",
  "TURN_PREP.TurnPlans.DeleteConfirm": "Delete this turn plan?",
  
  "TURN_PREP.Reactions.Title": "Reaction Plans",
  "TURN_PREP.Reactions.NewReaction": "New Reaction",
  "TURN_PREP.Reactions.ReactionName": "Reaction Name",
  "TURN_PREP.Reactions.Trigger": "Trigger",
  "TURN_PREP.Reactions.TriggerPlaceholder": "When would you use this reaction?",
  "TURN_PREP.Reactions.ReactionFeatures": "Reactions",
  "TURN_PREP.Reactions.AdditionalFeatures": "Additional Features",
  "TURN_PREP.Reactions.FavoriteTooltip": "Add to Favorites",
  "TURN_PREP.Reactions.DeleteTooltip": "Delete Reaction",
  "TURN_PREP.Reactions.SearchPlaceholder": "Search reactions...",
  "TURN_PREP.Reactions.DeleteConfirm": "Delete this reaction plan?",
  
  "TURN_PREP.History.Title": "Turns",
  "TURN_PREP.History.FavoritesTitle": "Favorites",
  "TURN_PREP.History.HistoryTitle": "History (Last {limit} Turns)",
  "TURN_PREP.History.NoFavorites": "No favorites saved yet",
  "TURN_PREP.History.NoHistory": "No turn history yet",
  "TURN_PREP.History.Action": "Action",
  "TURN_PREP.History.BonusAction": "Bonus",
  "TURN_PREP.History.None": "None",
  "TURN_PREP.History.TurnNumber": "Turn {number}",
  "TURN_PREP.History.LoadTooltip": "Load to Current Turn",
  "TURN_PREP.History.ContextMenu": "More Options",
  "TURN_PREP.History.ContextMenu.Delete": "Delete",
  "TURN_PREP.History.ContextMenu.Duplicate": "Duplicate",
  "TURN_PREP.History.ContextMenu.Edit": "Edit",
  "TURN_PREP.History.ContextMenu.LoadToCurrent": "Load as Current Turn Plan",
  "TURN_PREP.History.ContextMenu.RefreshRolls": "Refresh Rolls",
  "TURN_PREP.History.ContextMenu.AddFavorite": "Add as Favorite",
  "TURN_PREP.History.MissingFeature": "(Missing)",
  "TURN_PREP.History.RollsMade": "Rolls Made",
  "TURN_PREP.History.DeleteConfirm": "Delete this from history?",
  
  "TURN_PREP.ActivitySelector.Title": "Select Activity",
  "TURN_PREP.ActivitySelector.Select": "Select",
  "TURN_PREP.ActivitySelector.Cancel": "Cancel",
  "TURN_PREP.ActivitySelector.Prompt": "This feature has multiple activities. Which would you like to use?",
  
  "TURN_PREP.EndOfTurn.Title": "End Turn",
  "TURN_PREP.EndOfTurn.Prompt": "Your turn has ended. Would you like to save this plan to history?",
  "TURN_PREP.EndOfTurn.SaveAndClear": "Save & Clear",
  "TURN_PREP.EndOfTurn.DiscardAndClear": "Discard & Clear"
}
```

**Implementation Steps**:
1. Add all localization keys to `public/lang/en.json`
2. Use `FoundryAdapter.localize()` in all components
3. Test with different locales (if available)
4. Document keys for translators

---

## Testing Strategy

### Manual Testing Checklist

**DM Questions Panel**:
- [ ] Add question row
- [ ] Remove question row (minimum 1 remains)
- [ ] Clear text in field
- [ ] Send question to DM (whisper)
- [ ] Send question to public chat
- [ ] Text area scrolls after 4-5 lines
- [ ] Questions persist after closing sheet
- [ ] Questions load correctly on sheet open

**Turn Plans Panel**:
- [ ] Create new plan
- [ ] Edit plan name
- [ ] Edit trigger field
- [ ] Search and add action
- [ ] Search and add bonus action
- [ ] Search and add additional feature
- [ ] Remove feature from plan
- [ ] Expand/collapse Additional Details
- [ ] Edit movement, mechanical notes, roleplay notes
- [ ] Save & Clear plan (creates history entry)
- [ ] Toggle favorite
- [ ] Duplicate plan
- [ ] Delete plan
- [ ] Collapse/expand plan card
- [ ] Plans persist after closing sheet

**Reactions Panel**:
- [ ] Create new reaction
- [ ] Edit reaction name
- [ ] Edit trigger field
- [ ] Search and add reaction feature
- [ ] Search and add additional feature
- [ ] Remove feature
- [ ] Toggle favorite
- [ ] Delete reaction
- [ ] Collapse/expand reaction card
- [ ] Reactions persist after closing sheet

**History & Favorites**:
- [ ] View favorites list
- [ ] View history list (last 10)
- [ ] Expand/collapse history card
- [ ] View full plan details
- [ ] View rolls made (if any)
- [ ] Restore snapshot to current plan
- [ ] Toggle favorite from history
- [ ] Delete from history
- [ ] Delete from favorites
- [ ] Handle missing items gracefully

**Integration**:
- [ ] Turn Prep tab appears in main tab bar
- [ ] Turns tab appears in sidebar
- [ ] Clicking Turn Prep tab auto-shows sidebar
- [ ] Sidebar switches to Turns tab automatically
- [ ] All components use Tidy5e theming
- [ ] All text is localized
- [ ] Dialog migrations work (activity selector, end of turn)

**Data Persistence**:
- [ ] DM questions save to actor flags
- [ ] Current plans save to actor flags
- [ ] Reactions save to actor flags
- [ ] History saves to actor flags (limited to 10)
- [ ] Favorites save to actor flags (unlimited)
- [ ] Data loads correctly on sheet render
- [ ] Multiple actors don't interfere with each other

**Error Handling**:
- [ ] Missing items show gracefully
- [ ] Invalid data doesn't crash UI
- [ ] API errors show user notifications
- [ ] Deletion requires confirmation

---

## Implementation Timeline

### Session 0: Tidy5e Tab Registration (1-2 hours)
- Create `tidy-sheet-integration.ts` file
- Register main "Turn Prep" tab
- Register sidebar "Turns" tab
- Implement auto-show sidebar logic
- Create stub `TurnPrepMainTab.svelte` wrapper
- Create stub `HistoryFavoritesPanel.svelte` wrapper
- Test tab visibility and switching

### Session 1: DM Questions Panel (2-3 hours)
- Create component structure
- Implement add/remove/clear functionality
- Add send to DM/public chat
- Style with LESS
- Add localization
- Manual testing

### Session 2: Turn Plans Panel - Part 1 (3-4 hours)
- Create main panel and card structure
- Implement plan name, trigger fields
- Create feature sections (Actions, Bonus, Additional)
- Import and integrate Tidy5e TidyTable components
- Add/remove features functionality

### Session 3: Turn Plans Panel - Part 2 (3-4 hours)
- Implement feature search with autocomplete
- Create Additional Details collapsible section
- Add save & clear, favorite, duplicate, delete
- Style with LESS
- Add localization
- Manual testing

### Session 4: Reactions Panel (2-3 hours)
- Reuse components from Turn Plans
- Create reactions-specific structure
- Implement save, favorite, delete
- Style with LESS
- Add localization
- Manual testing

### Session 5: History & Favorites (3-4 hours)
- Create sidebar panel structure
- Implement favorites and history sections
- Create collapsible cards with summaries
- Add restore, favorite toggle, delete
- Handle missing items
- Style with LESS
- Add localization
- Manual testing

### Session 6: Dialog Migrations & Integration (2-3 hours)
- Migrate activity selector dialog to DialogV2
- Migrate end of turn dialog to DialogV2
- Register tabs with Tidy5e
- Implement auto-show sidebar
- Final integration testing

### Session 7: Polish & Testing (2-3 hours)
- Fix any bugs found in integration
- Ensure consistent styling
- Verify all localization
- Test data persistence
- Document any issues for Phase 5

**Total Estimated Time**: 18-27 hours across 8 sessions

---

## Success Criteria

Phase 4 is complete when:
- ✅ All 4 main components are built and functional
- ✅ All dialogs migrated to DialogV2
- ✅ Tabs registered with Tidy5e (main + sidebar)
- ✅ All localization implemented
- ✅ Styling matches Tidy5e theme
- ✅ Data persists correctly to actor flags
- ✅ All manual tests pass
- ✅ No console errors or warnings
- ✅ Components work across different actors
- ✅ Missing items handled gracefully

---

## Next Phase Preview

**Phase 5**: Integration & Combat Hooks
- Connect components to combat system
- Implement end-of-turn detection
- Auto-populate turn plans based on combat state
- Add roll tracking to history
- Polish UX and interactions
- Full end-to-end testing

---

## Changelog

This section documents user feedback notes and the corresponding changes made to the implementation plan.

### Note 1: Implementation Priority - Tab Registration First
**Location**: Implementation Priority section  
**Original Note**: "Let's move up in our sequence getting the sheet tabs registered to be the first thing we do in phase 4. Then we can start to develop the DM questions panel and continue from there. This way we'll be able to view our progress on the character sheet."

**Changes Made**:
- Created new "Session 0: Tidy5e Tab Registration" (1-2 hours) as the first implementation session
- Moved "Tidy5e Sheet Integration" to #1 in Implementation Priority list
- Updated Implementation Timeline to reflect new session numbering
- Adjusted total time estimate to 18-27 hours across 8 sessions (up from 7)
- Added stub component creation to Session 0 for both tab wrappers

### Note 2: Turn Plans - Collapse Arrow Pattern
**Location**: Turn Plans Panel - Features section  
**Original Note**: "Let's add a little arrow button for the collapse instead of clicking the name. It points right when collapsed and down when open. Clicking the name should allow you to edit it. I'm seeing that Tidy5e's feature rows are setup so that the collapse arrow shows up to the right of the name but only on hover. Can we pull in that functionality from tidy5e?"

**Changes Made**:
- Changed collapse mechanism from "click title" to arrow button
- Specified arrow direction: points right when collapsed, down when expanded
- Added hover-only visibility for arrow (following Tidy5e pattern)
- Made plan name clickable for editing (not for collapse)
- Updated Features list to reflect these UI changes

### Note 3: Turn Plans - Save Button Addition
**Location**: Turn Plans Panel - Features section  
**Original Note**: "Let's also add a Save button that sends the plan to history without clearing the fields. It is common enough that the player would want to do much the same on a subsequent turn that this would be a nice feature to offer"

**Changes Made**:
- Added "Save" button that saves plan to history without clearing
- Kept "Save & Clear" button for original functionality
- Added `TURN_PREP.TurnPlans.Save` localization key
- Updated Features list to show both button options
- Updated API documentation (no new method needed - uses existing `savePlanToHistory`)

### Note 4: Feature Search - Specific Vision Details
**Location**: Turn Plans Panel - Feature Search Implementation  
**Original Note**: "To get more specific on the vision here. We will have Tidy feature tables for each of the three relevant sections. they will have the added search field added into the middle of the header row. The results should show as an overlay just below the search box, covering up the elements below the search box. The results should just show the name of the item, feature, or spell. When they are clicked they should be added to that feature table"

**Changes Made**:
- Clarified search box placement: embedded in TidyTable header row (between title and column headers)
- Specified search results UI: overlay dropdown below search box
- Simplified result display: item/feature/spell name only (no other details)
- Clarified interaction: click result to add to table
- Updated Features list to reflect these specific UI details

### Note 5: Feature Search - TidyTable Header Extension
**Location**: Turn Plans Panel - Feature Search Implementation  
**Original Note**: "The Tidy Table I'm sure has a tidy-header or something like that. We'll want to extend that header row to incorporate that and build it as a reusable component that can be set to filter based on different activations costs."

**Changes Made**:
- Added "Search Box Integration" subsection explaining TidyTable header extension
- Specified building reusable component for search box
- Noted filtering capability based on activation costs
- Emphasized extending Tidy5e's existing header row component

### Note 6: Feature Display - Prioritize Tidy5e Components As-Is
**Location**: Turn Plans Panel - Features section  
**Original Note**: "It's more important to use the tidy5e components as they are than meet some criteria of what is being shown."

**Changes Made**:
- Updated Features list to say "Use Tidy5e's TidyTable components to display features as-is (don't customize display)"
- Removed specific field requirements (icon, name, activation cost, formula, range, uses)
- Emphasized using Tidy5e components without customization
- Added similar emphasis to Styling System section

### Note 7: History Rolls - Saving Throw Recording
**Location**: History & Favorites Panel - Features section  
**Original Note**: "For the rolls section we also need to be picking up and displaying saving throws made against the player's spells. So If they cast fireball, we should record the names, rolls, and pass/fail of every creature that rolled the saving throw. And then also the damage of that saving throw spell. We don't want to get into showing actual damage applied to those actors, as that could give away resistances and immunities to certain damage types that the DM might not want to reveal."

**Changes Made**:
- Extended RollRecord interface with optional saving throw fields:
  - `saveDC?: number` - DC for saving throw
  - `saveAbility?: string` - Ability score (e.g., "dex", "wis")
  - `targetName?: string` - Token/actor name that rolled
  - `saveRoll?: number` - The d20 roll value
  - `saveSuccess?: boolean` - Pass/fail result
- Updated Features list to specify recording target names, rolls, pass/fail
- Added note to record spell damage (not damage applied to avoid revealing resistances)
- Changed rollType to use union type instead of string for better type safety

### Note 8: History Rolls - NPC Visibility Setting
**Location**: History & Favorites Panel - Features section  
**Original Note**: "I could see DMs not wanting the players to know the rolls of their NPCs, so we should make a global setting about whether these rolls get recorded. That can wait until we're polishing this, but please add a note to the planning docs for that phase to revisit this setting."

**Changes Made**:
- Added "Future Enhancement" note to Features list about NPC roll visibility setting
- Marked as deferred to polish phase (not Phase 4 scope)
- Referenced for inclusion in future phase planning documentation

### Note 9: History - Refresh Rolls Functionality
**Location**: History & Favorites Panel - Features section  
**Original Note**: "I am also envisioning a situation in which the turn gets submitted before all rolls are made. We should add functionality to the history items to allow them to refresh their rolls. Recheck the chat history for rolls related to the turn's features and update. Before making changes, it should save a snapshot, but should only save the snapshot if there are changes to make."

**Changes Made**:
- Added "Refresh Rolls" to context menu (History only, fa-repeat icon)
- Added functionality description: rechecks chat for new rolls, saves snapshot before changes if rolls found
- Added `refreshSnapshotRolls` method to API Methods Needed
- Updated Features list to include Refresh Rolls functionality details

### Note 10: History Buttons - Context Menu Pattern
**Location**: History & Favorites Panel - Features section  
**Original Note**: "For the buttons on the history card, let's just have a load to current turn button (fa-share icon) and a three dots context menu button (fa-ellipsis-vertical). The context menu button is pretty standard across tidy5e components and we should pick it up from there. The context menu would be available via right click or the vertical ellipsis button. it would include: Delete, Duplicate (Favorites Only), Edit, Load as Current Turn Plan (fa-share icon), Refresh Rolls (History Only) (fa-repeat icon), Add as Favorite (History Only) (fa-star icon)"

**Changes Made**:
- Replaced star/copy/delete buttons with simpler button layout:
  - Primary button: Load to Current Turn (fa-share icon)
  - Context menu button: Three dots (fa-ellipsis-vertical)
- Added full context menu specification with 6 items:
  - Delete
  - Duplicate (Favorites only)
  - Edit
  - Load as Current Turn Plan (fa-share)
  - Refresh Rolls (History only, fa-repeat)
  - Add as Favorite (History only, fa-star)
- Noted using Tidy5e's ellipsis button component
- Updated localization keys to match new button structure
- Updated API Methods to include context menu actions (duplicate, edit, refresh)

### Note 11: Data Model - Enhanced RollRecord
**Location**: History & Favorites Panel - Data Model section  
**Original Note**: "We'll need to also be able to record rolls from features with saving throws - For those we'll need to record the Ability Score and Save DC of the saving throw as well as the Token Name or actor name, roll value, and pass fail of each of the creatures that roll against the saving throw. Perhaps RollRecordAttack and RollRecordSavingThrow or just one RollRecord item that can hold both with optional fields."

**Changes Made**:
- Chose single RollRecord interface with optional fields (not separate types)
- Added saving throw specific optional fields (as listed in Note 7)
- Changed rollType from generic string to typed union: `'attack' | 'damage' | 'save' | 'check' | 'other'`
- Added comprehensive inline comments explaining each field
- Documented that saving throw fields are optional

### Note 12: Missing Items - Store Display Data in Snapshot
**Location**: History & Favorites Panel - Missing Item Handling section  
**Original Note**: "Nope. We only check for missing features when a snapshot is loaded back into memory. We are storing the relevant display data when we create the snapshot so that we don't have to worry about missing features/items when displaying snapshots."

**Changes Made**:
- Changed missing item handling strategy from "check when displaying" to "check when loading"
- Updated Missing Item Handling code example to only check during `loadSnapshotToPlan`
- Updated Features list to specify "Snapshots store display names - no missing item checks when displaying"
- Clarified that SnapshotFeature stores itemName for display even if item deleted
- Removed "Missing features highlighted in expanded view" from Features list
- Function now shows warning notification for missing items and creates plan with only existing items

### Note 13: Dialog Migrations - Svelte Component Approach
**Location**: Dialog Migrations - Activity Selection Dialog section  
**Original Note**: "Let's plan on a Svelte Component for this instead of a V2 Dialog. It's more than a simple yes/no so we'll want to exercise some control over its layout and functionality. Let's do the same for the end of turn popup"

**Changes Made**:
- Removed DialogV2.prompt() "Quick Fix" implementation approach
- Made "Svelte Component Approach" the required approach (not just preferred)
- Updated section title to emphasize requirement: "Svelte Component Approach (required for both dialogs)"
- Changed End of Turn Dialog from DialogV2.confirm() to Svelte component with ApplicationV2
- Updated End of Turn implementation steps to include Svelte component creation
- Maintained same ApplicationV2 + SvelteApplicationMixin pattern for both dialogs

### Note 14: Styling - Emphasis on Tidy5e Visual Cohesion
**Location**: Styling System section  
**Original Note**: "I think this all makes sense for the styling. The priority needs to be using something from tidy5e when and where available for visual cohesion. It seems like you're doing that but I just want to emphasize it."

**Changes Made**:
- No structural changes needed (approach already aligned)
- Added explicit emphasis note at start of section prioritizing Tidy5e component usage
- Confirmed existing approach matches user's priority
- Reinforced in other sections (Turn Plans features list)

### Note 15: Localization - Update for All Changes
**Location**: Localization Setup section  
**Original Note**: "Make sure this gets updated to reflect any changes made above"

**Changes Made**:
- Added `TURN_PREP.TurnPlans.Save` key for new Save button
- Updated History localization keys from star/restore/delete tooltips to:
  - `TURN_PREP.History.LoadTooltip`
  - `TURN_PREP.History.ContextMenu` and 6 submenu keys
- Reviewed all sections and confirmed all new features have localization keys
- Updated consolidated localization JSON in Localization Setup section

---

**Document Version**: 1.1  
**Last Updated**: January 21, 2026 (Updated with user feedback)  
**Ready for Implementation**: ✅
