# Phase 4 Implementation Plan - UI Components

**Status**: Ready for Implementation  
**Phase**: 4 - UI Components (Svelte 5)  
**Dependencies**: Phase 1 ✅, Phase 2 ✅, Phase 3 ✅  
**Start Date**: January 21, 2026

---

## Overview

Phase 4 builds the Svelte 5 UI components that will be integrated into Tidy5e character sheets. This phase creates the visual interface for turn planning, DM questions, reactions, and history/favorites.

### Technical Stack (Confirmed)

- **Framework**: Svelte 5 with runes (`$state`, `$derived`, `$effect`, `$bindable`)
- **Styling**: LESS with Tidy5e CSS variables
- **Data Flow**: Hybrid (Context + reactive .svelte.ts + props/events)
- **Components**: Import Tidy5e components, create custom cards
- **Dialogs**: DialogV2 (migrate deprecated Dialog)
- **Localization**: FoundryAdapter.localize() from start
- **API Communication**: Direct calls to TurnPrepAPI

### Implementation Priority

1. **DM Questions Panel** (simplest - text inputs and buttons)
2. **Turn Plans Panel** (most complex - main interface with feature cards)
3. **Reactions Panel** (medium - similar to turn plans but simpler)
4. **History & Favorites** (medium - display and restore functionality)

---

## Component Specifications

### 1. DM Questions Panel

**Purpose**: Quick text entry for questions to ask the DM during the player's turn.

**Visual Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│ DM Questions                                                │
├─────────────────────────────────────────────────────────────┤
│ [+][-] [Text input field.....................] [🗑️][✉️][📢] │
│ [+][-] [Text input field.....................] [🗑️][✉️][📢] │
│ [+][-] [Text input field.....................] [🗑️][✉️][📢] │
└─────────────────────────────────────────────────────────────┘
```

**Component Structure**:
```
DmQuestionsPanel.svelte
├── QuestionRow.svelte (repeatable)
│   ├── AddButton (fa-plus)
│   ├── RemoveButton (fa-minus)
│   ├── TextArea (4-5 lines, scrollable)
│   ├── ClearButton (fa-eraser)
│   ├── WhisperButton (far-paper-plane)
│   └── PublicButton (fa-bullhorn)
└── State: questions[]
```

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
- Each plan is a collapsible card (click title to expand/collapse)
- Plan name auto-generated on creation, then editable
- Trigger field for "when to use this plan" notes
- Three feature sections: Actions, Bonus Actions, Additional Features
- Feature search box in section header (type to filter actor's items by name + activation type)
- Use Tidy5e's TidyTable components to display features
- Features show: icon, name, activation cost, formula, range, uses
- Drag-and-drop features between plans
- Additional Details collapsible sub-section
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
  rollType: string;              // 'attack', 'damage', 'save', 'check', 'other'
  itemName: string;              // Which feature was rolled
  result: string;                // Roll result text (e.g., "18 (hit)", "8 fire damage")
  timestamp: number;             // When roll was made
}
```

**Features**:
- Display favorites at top (always visible)
- Display last 10 history entries below
- Cards collapsible (click to expand/collapse)
- Summary shows: plan name, first action name, first bonus action name
- Expanded shows: full plan details, rolls made (for history only)
- Star button toggles favorite (adds to Favorites section)
- Copy button restores plan to current turn plans
- Delete button removes from history/favorites (with confirmation)
- Favorites persist indefinitely
- History limited to last 10 turns (configurable in settings)
- Missing features highlighted in expanded view

**Missing Item Handling**:
```typescript
// When displaying snapshot, check if item still exists
function getSnapshotFeatureDisplay(feature: SnapshotFeature, actor: Actor): string {
  const item = actor.items.get(feature.itemId);
  if (!item) {
    return `${feature.itemName} (Missing)`;  // Show saved name + warning
  }
  return item.name;  // Show current name
}
```

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
static async getHistory(actor: Actor, limit: number = 10): Promise<TurnSnapshot[]>
static async toggleSnapshotFavorite(actor: Actor, snapshotId: string): Promise<void>
static async restoreSnapshot(actor: Actor, snapshotId: string): Promise<TurnPlan>
static async deleteSnapshot(actor: Actor, snapshotId: string): Promise<void>
static async addRollToHistory(actor: Actor, snapshotId: string, roll: RollRecord): Promise<void>
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

**Svelte Component Approach** (preferred):
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
1. Find current Dialog usage in Phase 3 code
2. Replace with `DialogV2.confirm()`
3. Add localization strings
4. Test in combat scenario

---

## Tidy5e Sheet Integration

### Tab Registration

**Register Two Tabs**:
1. **Main Tab**: "Turn Prep" in main tab bar
2. **Sidebar Tab**: "Turns" in sidebar for history/favorites

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
  "TURN_PREP.History.FavoriteTooltip": "Toggle Favorite",
  "TURN_PREP.History.RestoreTooltip": "Restore to Current Plans",
  "TURN_PREP.History.DeleteTooltip": "Delete from History",
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

**Total Estimated Time**: 17-25 hours across 7 sessions

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

**Document Version**: 1.0  
**Last Updated**: January 21, 2026  
**Ready for Implementation**: ✅
