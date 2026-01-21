# Research Findings for Turn Prep Module























































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































**Ready for Implementation**: ✅**Last Updated**: January 20, 2026  **Document Version**: 1.0  ---- Full end-to-end testing- Polish UX and interactions- Add roll tracking to history- Auto-populate turn plans based on combat state- Implement end-of-turn detection- Connect components to combat system**Phase 5**: Integration & Combat Hooks## Next Phase Preview---- ✅ Missing items handled gracefully- ✅ Components work across different actors- ✅ No console errors or warnings- ✅ All manual tests pass- ✅ Data persists correctly to actor flags- ✅ Styling matches Tidy5e theme- ✅ All localization implemented- ✅ Tabs registered with Tidy5e (main + sidebar)- ✅ All dialogs migrated to DialogV2- ✅ All 4 main components are built and functionalPhase 4 is complete when:## Success Criteria---**Total Estimated Time**: 17-25 hours across 7 sessions- Document any issues for Phase 5- Test data persistence- Verify all localization- Ensure consistent styling- Fix any bugs found in integration### Session 7: Polish & Testing (2-3 hours)- Final integration testing- Implement auto-show sidebar- Register tabs with Tidy5e- Migrate end of turn dialog to DialogV2- Migrate activity selector dialog to DialogV2### Session 6: Dialog Migrations & Integration (2-3 hours)- Manual testing- Add localization- Style with LESS- Handle missing items- Add restore, favorite toggle, delete- Create collapsible cards with summaries- Implement favorites and history sections- Create sidebar panel structure### Session 5: History & Favorites (3-4 hours)- Manual testing- Add localization- Style with LESS- Implement save, favorite, delete- Create reactions-specific structure- Reuse components from Turn Plans### Session 4: Reactions Panel (2-3 hours)- Manual testing- Add localization- Style with LESS- Add save & clear, favorite, duplicate, delete- Create Additional Details collapsible section- Implement feature search with autocomplete### Session 3: Turn Plans Panel - Part 2 (3-4 hours)- Add/remove features functionality- Import and integrate Tidy5e TidyTable components- Create feature sections (Actions, Bonus, Additional)- Implement plan name, trigger fields- Create main panel and card structure### Session 2: Turn Plans Panel - Part 1 (3-4 hours)- Manual testing- Add localization- Style with LESS- Add send to DM/public chat- Implement add/remove/clear functionality- Create component structure### Session 1: DM Questions Panel (2-3 hours)## Implementation Timeline---- [ ] Deletion requires confirmation- [ ] API errors show user notifications- [ ] Invalid data doesn't crash UI- [ ] Missing items show gracefully**Error Handling**:- [ ] Multiple actors don't interfere with each other- [ ] Data loads correctly on sheet render- [ ] Favorites save to actor flags (unlimited)- [ ] History saves to actor flags (limited to 10)- [ ] Reactions save to actor flags- [ ] Current plans save to actor flags- [ ] DM questions save to actor flags**Data Persistence**:- [ ] Dialog migrations work (activity selector, end of turn)- [ ] All text is localized- [ ] All components use Tidy5e theming- [ ] Sidebar switches to Turns tab automatically- [ ] Clicking Turn Prep tab auto-shows sidebar- [ ] Turns tab appears in sidebar- [ ] Turn Prep tab appears in main tab bar**Integration**:- [ ] Handle missing items gracefully- [ ] Delete from favorites- [ ] Delete from history- [ ] Toggle favorite from history- [ ] Restore snapshot to current plan- [ ] View rolls made (if any)- [ ] View full plan details- [ ] Expand/collapse history card- [ ] View history list (last 10)- [ ] View favorites list**History & Favorites**:- [ ] Reactions persist after closing sheet- [ ] Collapse/expand reaction card- [ ] Delete reaction- [ ] Toggle favorite- [ ] Remove feature- [ ] Search and add additional feature- [ ] Search and add reaction feature- [ ] Edit trigger field- [ ] Edit reaction name- [ ] Create new reaction**Reactions Panel**:- [ ] Plans persist after closing sheet- [ ] Collapse/expand plan card- [ ] Delete plan- [ ] Duplicate plan- [ ] Toggle favorite- [ ] Save & Clear plan (creates history entry)- [ ] Edit movement, mechanical notes, roleplay notes- [ ] Expand/collapse Additional Details- [ ] Remove feature from plan- [ ] Search and add additional feature- [ ] Search and add bonus action- [ ] Search and add action- [ ] Edit trigger field- [ ] Edit plan name- [ ] Create new plan**Turn Plans Panel**:- [ ] Questions load correctly on sheet open- [ ] Questions persist after closing sheet- [ ] Text area scrolls after 4-5 lines- [ ] Send question to public chat- [ ] Send question to DM (whisper)- [ ] Clear text in field- [ ] Remove question row (minimum 1 remains)- [ ] Add question row**DM Questions Panel**:### Manual Testing Checklist## Testing Strategy---4. Document keys for translators3. Test with different locales (if available)2. Use `FoundryAdapter.localize()` in all components1. Add all localization keys to `public/lang/en.json`**Implementation Steps**:```}  "TURN_PREP.EndOfTurn.DiscardAndClear": "Discard & Clear"  "TURN_PREP.EndOfTurn.SaveAndClear": "Save & Clear",  "TURN_PREP.EndOfTurn.Prompt": "Your turn has ended. Would you like to save this plan to history?",  "TURN_PREP.EndOfTurn.Title": "End Turn",    "TURN_PREP.ActivitySelector.Prompt": "This feature has multiple activities. Which would you like to use?",  "TURN_PREP.ActivitySelector.Cancel": "Cancel",  "TURN_PREP.ActivitySelector.Select": "Select",  "TURN_PREP.ActivitySelector.Title": "Select Activity",    "TURN_PREP.History.DeleteConfirm": "Delete this from history?",  "TURN_PREP.History.RollsMade": "Rolls Made",  "TURN_PREP.History.MissingFeature": "(Missing)",  "TURN_PREP.History.DeleteTooltip": "Delete from History",  "TURN_PREP.History.RestoreTooltip": "Restore to Current Plans",  "TURN_PREP.History.FavoriteTooltip": "Toggle Favorite",  "TURN_PREP.History.TurnNumber": "Turn {number}",  "TURN_PREP.History.None": "None",  "TURN_PREP.History.BonusAction": "Bonus",  "TURN_PREP.History.Action": "Action",  "TURN_PREP.History.NoHistory": "No turn history yet",  "TURN_PREP.History.NoFavorites": "No favorites saved yet",  "TURN_PREP.History.HistoryTitle": "History (Last {limit} Turns)",  "TURN_PREP.History.FavoritesTitle": "Favorites",  "TURN_PREP.History.Title": "Turns",    "TURN_PREP.Reactions.DeleteConfirm": "Delete this reaction plan?",  "TURN_PREP.Reactions.SearchPlaceholder": "Search reactions...",  "TURN_PREP.Reactions.DeleteTooltip": "Delete Reaction",  "TURN_PREP.Reactions.FavoriteTooltip": "Add to Favorites",  "TURN_PREP.Reactions.AdditionalFeatures": "Additional Features",  "TURN_PREP.Reactions.ReactionFeatures": "Reactions",  "TURN_PREP.Reactions.TriggerPlaceholder": "When would you use this reaction?",  "TURN_PREP.Reactions.Trigger": "Trigger",  "TURN_PREP.Reactions.ReactionName": "Reaction Name",  "TURN_PREP.Reactions.NewReaction": "New Reaction",  "TURN_PREP.Reactions.Title": "Reaction Plans",    "TURN_PREP.TurnPlans.DeleteConfirm": "Delete this turn plan?",  "TURN_PREP.TurnPlans.SearchPlaceholder": "Search features...",  "TURN_PREP.TurnPlans.DuplicateTooltip": "Duplicate Plan",  "TURN_PREP.TurnPlans.DeleteTooltip": "Delete Plan",  "TURN_PREP.TurnPlans.FavoriteTooltip": "Add to Favorites",  "TURN_PREP.TurnPlans.SaveClear": "Save & Clear",  "TURN_PREP.TurnPlans.AdditionalDetails": "Additional Details",  "TURN_PREP.TurnPlans.RoleplayNotes": "Roleplay Notes",  "TURN_PREP.TurnPlans.MechanicalNotes": "Mechanical Notes",  "TURN_PREP.TurnPlans.Movement": "Movement",  "TURN_PREP.TurnPlans.AdditionalFeatures": "Additional Features",  "TURN_PREP.TurnPlans.BonusActions": "Bonus Actions",  "TURN_PREP.TurnPlans.Actions": "Actions",  "TURN_PREP.TurnPlans.TriggerPlaceholder": "When would you use this plan?",  "TURN_PREP.TurnPlans.Trigger": "Trigger",  "TURN_PREP.TurnPlans.PlanName": "Plan Name",  "TURN_PREP.TurnPlans.NewPlan": "New Plan",  "TURN_PREP.TurnPlans.Title": "Current Turn Plans",    "TURN_PREP.DmQuestions.Placeholder": "What question do you have for the DM?",  "TURN_PREP.DmQuestions.PublicTooltip": "Send to Public Chat",  "TURN_PREP.DmQuestions.WhisperTooltip": "Send to DM (Whisper)",  "TURN_PREP.DmQuestions.ClearTooltip": "Clear Text",  "TURN_PREP.DmQuestions.RemoveTooltip": "Remove Question",  "TURN_PREP.DmQuestions.AddTooltip": "Add Question",  "TURN_PREP.DmQuestions.Title": "DM Questions",    "TURN_PREP.Tabs.Turns": "Turns",  "TURN_PREP.Tabs.TurnPrep": "Turn Prep",{```json**Complete Localization Keys** (consolidate all above):```    └── en.json (extend existing)└── lang/public/```**Main Localization File**:### File Structure## Localization Setup---5. Ensure consistent look with Tidy5e sheets4. Test theming with Tidy5e's customization panel3. Use component-scoped `<style lang="less">` in Svelte files2. Import in main `turn-prep.less`1. Create component LESS files in `styles/components/`**Implementation Steps**:- `--t5e-shadow-light`: Subtle shadow- `--t5e-spacing-sm/md/lg`: Consistent spacing- `--t5e-border-radius`: Consistent border radius- `--t5e-faint-color`: Subtle borders- `--t5e-separator-color`: Border/separator color- `--t5e-primary-color`: Primary text color- `--t5e-sheet-background`: Sheet background- `--t5e-background`: Main background color**Tidy5e CSS Variables to Use**:```</style>  }    }      }        font-family: inherit;        resize: vertical;        max-height: 8rem;        min-height: 4rem;      textarea {            align-items: start;      gap: 0.5rem;      grid-template-columns: auto auto 1fr auto auto auto;      display: grid;    .question-row {        gap: 0.5rem;    flex-direction: column;    display: flex;  .dm-questions-panel {<style lang="less"><!-- In DmQuestionsPanel.svelte -->```svelte**Component-Scoped Styles**:```}  }    box-shadow: var(--t5e-shadow-light);  &.expanded {    margin-bottom: var(--t5e-spacing-sm);  border-radius: var(--t5e-border-radius);  border: 1px solid var(--t5e-faint-color);  background: var(--t5e-sheet-background);.turn-prep-card {}  padding: var(--t5e-spacing-md);  border-radius: var(--t5e-border-radius);  border: 1px solid var(--t5e-separator-color);  color: var(--t5e-primary-color);  background: var(--t5e-background);.turn-prep-panel {// Use Tidy5e CSS variables for consistency@import './components/turn-prep-cards.less';@import './components/feature-search.less';@import './components/history-favorites.less';@import './components/reactions.less';@import './components/turn-plans.less';@import './components/dm-questions.less';// Component styles// @import '../../tidy5e-sheet/src/less/variables.less';// Import Tidy5e variables (if accessible)@import './variables.less';// styles/turn-prep.less```less**Main LESS File**:```│   └── turn-prep-cards.less│   ├── feature-search.less│   ├── history-favorites.less│   ├── reactions.less│   ├── turn-plans.less│   ├── dm-questions.less├── components/├── variables.less (already exists - extend)├── turn-prep.less (main entry)styles/```**New Files to Create**:### LESS File Structure## Styling System---5. Test data flow and reactivity4. Import and use context in child components3. Set up context in `TurnPrepMainTab.svelte`2. Define `TurnPrepContext` interface1. Create `turn-prep-state.svelte.ts` file**Implementation Steps**:```}  };    set dmQuestions(value) { _dmQuestions = value; }    get dmQuestions() { return _dmQuestions; },    set reactions(value) { _reactions = value; },    get reactions() { return _reactions; },    set currentPlans(value) { _currentPlans = value; },    get currentPlans() { return _currentPlans; },  return {export function getTurnPrepState() {let _dmQuestions = $state<DmQuestion[]>([]);let _reactions = $state<Reaction[]>([]);let _currentPlans = $state<TurnPlan[]>([]);// In src/state/turn-prep-state.svelte.ts```typescript**Reactive Module State**:```}  await api.saveQuestions(actor, questions);async function saveQuestions() {const { actor, api, localize } = getContext<TurnPrepContext>(TURN_PREP_CONTEXT_KEY);import { TURN_PREP_CONTEXT_KEY } from 'src/constants';import { getContext } from 'svelte';// In child components (e.g., DmQuestionsPanel.svelte)```typescript**Consuming Context**:```setContext(TURN_PREP_CONTEXT_KEY, turnPrepContext);};  localize: FoundryAdapter.localize  settings: getTurnPrepSettings(),  api: TurnPrepAPI,  storage: TurnPrepStorage.getInstance(),  actor,const turnPrepContext: TurnPrepContext = {let { actor, context: sheetContext } = $props();import { TURN_PREP_CONTEXT_KEY } from 'src/constants';import { setContext } from 'svelte';// In TurnPrepMainTab.svelte```typescript**Providing Context**:```}  localize: (key: string, data?: Record<string, any>) => string;  settings: TurnPrepSettings;  api: typeof TurnPrepAPI;  storage: TurnPrepStorage;  actor: Actor;export interface TurnPrepContext {// In src/types/turn-prep.types.ts```typescript**Turn Prep Context**:### Context-Based Data Flow## Data Management Setup---5. Test tab switching and sidebar behavior4. Add auto-show sidebar logic3. Create `TurnPrepMainTab.svelte` wrapper component2. Register both tabs with Tidy5e API1. Create `tidy-sheet-integration.ts` file**Implementation Steps**:```}  "TURN_PREP.Tabs.Turns": "Turns"  "TURN_PREP.Tabs.TurnPrep": "Turn Prep",{```json**Localization Keys**:- Sidebar Tab: `fa-clock-rotate-left` (history)- Main Tab: `fa-clipboard-list` (turn planning)**Tab Icons**:```});  }    data.sheet.activateSidebarTab('turn-prep-sidebar');    // Switch to Turns sidebar tab    data.sheet.toggleSidebar(true);    // Show sidebar  if (data.tabId === 'turn-prep') {api.hooks.on('tidy5e-sheet.tabActivated', (data) => {// When Turn Prep tab is activated, show sidebar and switch to Turns tab```typescript**Auto-Show Sidebar**:```});  );    })      }        });          }            context: getSheetContext()            actor: params.data.actor,          props: {          target: params.tabContentsElement,        return mount(HistoryFavoritesPanel, {        // Mount HistoryFavoritesPanel component      onRender: (params) => {      enabled: (data) => true,      html: '',      tabId: 'turn-prep-sidebar',      title: 'TURN_PREP.Tabs.Turns',    new api.models.SvelteTab({  api.registerCharacterSidebarTab(  // Register sidebar tab  );    })      }        });          }            context: getSheetContext()            actor: params.data.actor,          props: {          target: params.tabContentsElement,        return mount(TurnPrepMainTab, {        // Mount TurnPrepMainTab component      onRender: (params) => {      enabled: (data) => true,      html: '',      tabId: 'turn-prep',      title: 'TURN_PREP.Tabs.TurnPrep',    new api.models.SvelteTab({  api.registerCharacterTab(  // Register main tabHooks.once('tidy5e-sheet.ready', (api) => {// In src/sheets/tidy5e/tidy-sheet-integration.ts```typescript**Registration Code**:2. **Sidebar Tab**: "Turns" in sidebar for history/favorites1. **Main Tab**: "Turn Prep" in main tab bar**Register Two Tabs**:### Tab Registration## Tidy5e Sheet Integration---4. Test in combat scenario3. Add localization strings2. Replace with `DialogV2.confirm()`1. Find current Dialog usage in Phase 3 code**Implementation Steps**:```}  "TURN_PREP.EndOfTurn.DiscardAndClear": "Discard & Clear"  "TURN_PREP.EndOfTurn.SaveAndClear": "Save & Clear",  "TURN_PREP.EndOfTurn.Prompt": "Your turn has ended. Would you like to save this plan to history?",  "TURN_PREP.EndOfTurn.Title": "End Turn",{```json**Localization Keys**:```await TurnPrepAPI.clearCurrentPlan(actor);}  await TurnPrepAPI.savePlanToHistory(actor, currentPlan);if (shouldSave) {});  }    label: FoundryAdapter.localize('TURN_PREP.EndOfTurn.DiscardAndClear')    icon: '<i class="fas fa-times"></i>',  no: {  },    default: true    label: FoundryAdapter.localize('TURN_PREP.EndOfTurn.SaveAndClear'),    icon: '<i class="fas fa-save"></i>',  yes: {  content: `<p>${FoundryAdapter.localize('TURN_PREP.EndOfTurn.Prompt')}</p>`,  title: FoundryAdapter.localize('TURN_PREP.EndOfTurn.Title'),const shouldSave = await foundry.applications.api.DialogV2.confirm({```typescript**DialogV2.confirm() Implementation**:**Location**: Referenced in Phase 3 (needs exact location)**Current Implementation**: Phase 3 end-of-turn dialog using deprecated `Dialog`.### 2. End of Turn Dialog---6. Test with multi-activity items5. Style with LESS4. Add localization strings3. Update `ContextMenuHandler.ts` to use new dialog2. Create `ActivitySelectorDialog` wrapper class1. Create `ActivitySelector.svelte` component**Implementation Steps**:```}  "TURN_PREP.ActivitySelector.Prompt": "This feature has multiple activities. Which would you like to use?"  "TURN_PREP.ActivitySelector.Cancel": "Cancel",  "TURN_PREP.ActivitySelector.Select": "Select",  "TURN_PREP.ActivitySelector.Title": "Select Activity",{```json**Localization Keys**:```}  }    });      }        }          this.options.onSelect(activity);          this.close();        onSelect: (activity) => {        activities: this.options.activities,      props: {      target: node,    return mount(ActivitySelector, {  _createComponent(node) {  };    position: { width: 400 }    },      resizable: false      title: 'TURN_PREP.ActivitySelector.Title',    window: {    id: 'turn-prep-activity-selector',  static DEFAULT_OPTIONS = {) {  foundry.applications.api.ApplicationV2class ActivitySelectorDialog extends SvelteApplicationMixin(// Create ActivitySelectorDialog.svelte component```typescript**Svelte Component Approach** (preferred):```});  }    }      return selected?.dataset.activityId;      const selected = dialog.element.querySelector('.activity-option.selected');    callback: (event, button, dialog) => {    label: FoundryAdapter.localize('TURN_PREP.ActivitySelector.Select'),  ok: {  `,    </div>      `).join('')}        </button>          ${act.name}        <button class="activity-option" data-activity-id="${act.id}">      ${activities.map(act => `    <div class="activity-list">  content: `  title: FoundryAdapter.localize('TURN_PREP.ActivitySelector.Title'),const selectedActivity = await foundry.applications.api.DialogV2.prompt({// Quick fix approach```typescript**DialogV2.prompt() Implementation**:2. **Better UX**: Create `ActivitySelector.svelte` component1. **Quick Fix**: Replace `Dialog` with `DialogV2.prompt()`**Migration Strategy**:**Location**: `src/features/context-menu/ContextMenuHandler.ts` line 343**Current Issue**: Using deprecated `Dialog` class in Phase 3.### 1. Activity Selection Dialog## Dialog Migrations (Immediate)---10. Test restore, favorite, delete functionality9. Style with LESS8. Connect to API methods7. Handle missing items gracefully6. Implement state management5. Add localization strings4. Create `RollsDisplay.svelte` for showing rolls made3. Create `FavoriteCard.svelte` and `HistoryCard.svelte`2. Create `FavoritesSection.svelte` and `HistorySection.svelte`1. Create `HistoryFavoritesPanel.svelte` component**Implementation Steps**:```static async addRollToHistory(actor: Actor, snapshotId: string, roll: RollRecord): Promise<void>static async deleteSnapshot(actor: Actor, snapshotId: string): Promise<void>static async restoreSnapshot(actor: Actor, snapshotId: string): Promise<TurnPlan>static async toggleSnapshotFavorite(actor: Actor, snapshotId: string): Promise<void>static async getHistory(actor: Actor, limit: number = 10): Promise<TurnSnapshot[]>static async getFavorites(actor: Actor): Promise<TurnSnapshot[]>// In TurnPrepApi.ts```typescript**API Methods Needed**:```}  "TURN_PREP.History.DeleteConfirm": "Delete this from history?"  "TURN_PREP.History.RollsMade": "Rolls Made",  "TURN_PREP.History.MissingFeature": "(Missing)",  "TURN_PREP.History.DeleteTooltip": "Delete from History",  "TURN_PREP.History.RestoreTooltip": "Restore to Current Plans",  "TURN_PREP.History.FavoriteTooltip": "Toggle Favorite",  "TURN_PREP.History.TurnNumber": "Turn {number}",  "TURN_PREP.History.None": "None",  "TURN_PREP.History.BonusAction": "Bonus",  "TURN_PREP.History.Action": "Action",  "TURN_PREP.History.NoHistory": "No turn history yet",  "TURN_PREP.History.NoFavorites": "No favorites saved yet",  "TURN_PREP.History.HistoryTitle": "History (Last {limit} Turns)",  "TURN_PREP.History.FavoritesTitle": "Favorites",  "TURN_PREP.History.Title": "Turns",{```json**Localization Keys**:- Custom card components (not using TidyTable here)- `HorizontalLineSeparator` between sections- `ExpandableContainer` for collapsible cards**Tidy5e Components to Use**:```}  return item.name;  // Show current name  }    return `${feature.itemName} (Missing)`;  // Show saved name + warning  if (!item) {  const item = actor.items.get(feature.itemId);function getSnapshotFeatureDisplay(feature: SnapshotFeature, actor: Actor): string {// When displaying snapshot, check if item still exists```typescript**Missing Item Handling**:- Missing features highlighted in expanded view- History limited to last 10 turns (configurable in settings)- Favorites persist indefinitely- Delete button removes from history/favorites (with confirmation)- Copy button restores plan to current turn plans- Star button toggles favorite (adds to Favorites section)- Expanded shows: full plan details, rolls made (for history only)- Summary shows: plan name, first action name, first bonus action name- Cards collapsible (click to expand/collapse)- Display last 10 history entries below- Display favorites at top (always visible)**Features**:```}  timestamp: number;             // When roll was made  result: string;                // Roll result text (e.g., "18 (hit)", "8 fire damage")  itemName: string;              // Which feature was rolled  rollType: string;              // 'attack', 'damage', 'save', 'check', 'other'  id: string;                    // UUIDinterface RollRecord {}  section: 'action' | 'bonus' | 'additional' | 'reaction';  activationType: string;        // Activation cost type  itemType: string;              // Type at time of snapshot  itemName: string;              // Name at time of snapshot (for display if item deleted)  itemId: string;                // ID at time of snapshotinterface SnapshotFeature {}  isFavorite: boolean;           // Star toggle  rolls?: RollRecord[];          // Rolls made during this turn  roleplayNotes?: string;        // Notes  mechanicalNotes?: string;      // Notes  movement?: string;             // Movement text  features: SnapshotFeature[];   // Features used  trigger?: string;              // Trigger text (truncated in summary)  createdTime: number;           // When snapshot was created  turnNumber?: number;           // Combat turn number (if in combat)  name: string;                  // Plan name at time of snapshot  planId?: string;               // Reference to original plan (if applicable)  id: string;                    // UUIDinterface TurnSnapshot {```typescript**Data Model**:```            └── RollsDisplay (rolls made during turn)            ├── NotesDisplay            ├── MovementDisplay            ├── FeaturesList            ├── TriggerDisplay        └── CardExpanded (full details + rolls)        ├── CardSummary (first action, first bonus)        ├── CardHeader (turn number, plan name, buttons)    └── HistoryCard.svelte (repeatable)    ├── SectionHeader ("History (Last 10 Turns)")└── HistorySection.svelte│           └── NotesDisplay│           ├── MovementDisplay│           ├── FeaturesList│           ├── TriggerDisplay│       └── CardExpanded (full details)│       ├── CardSummary (first action, first bonus)│       ├── CardHeader (plan name, buttons)│   └── FavoriteCard.svelte (repeatable)│   ├── SectionHeader ("Favorites")├── FavoritesSection.svelteHistoryFavoritesPanel.svelte```**Component Structure**:```└─────────────────────────────────────────────────────────────┘│   Action: Cure Wounds, Bonus: None                          ││ ► Turn 4 - Healing                            [⭐][📋][🗑️]   │├─────────────────────────────────────────────────────────────┤│      Rolls: Attack Roll: 18 (hit), Damage: 8 fire           ││      Movement: Move 30ft closer                             ││      Actions: Firebolt                                       ││      Trigger: Enemy within 120ft                            ││   ▼ (expanded shows full details + rolls made)              ││   Action: Firebolt, Bonus: None                             ││ ► Turn 5 - Attack Plan                        [⭐][📋][🗑️]   │├─────────────────────────────────────────────────────────────┤│ History (Last 10 Turns)                                     │├─────────────────────────────────────────────────────────────┤│   Action: Healing Word, Bonus: Cure Wounds                  ││ ► Healing Plan                                 [⭐][📋][🗑️]  │├─────────────────────────────────────────────────────────────┤│   Action: Longsword, Bonus: Second Wind                     ││ ► Plan Name                                    [⭐][📋][🗑️]  │├─────────────────────────────────────────────────────────────┤│ Favorites                                                    │├─────────────────────────────────────────────────────────────┤│ Turns (Sidebar Tab)                                         │┌─────────────────────────────────────────────────────────────┐```**Visual Layout**:**Purpose**: Display saved turn plans and favorites in Tidy5e sidebar.### 4. History & Favorites Panel---8. Test add/remove/favorite functionality7. Style with LESS6. Connect to API methods5. Implement state management4. Add localization strings3. Reuse `FeatureSection.svelte` from Turn Plans2. Create `ReactionCard.svelte` sub-component1. Create `ReactionsPanel.svelte` component**Implementation Steps**:```static async toggleReactionFavorite(actor: Actor, reactionId: string): Promise<void>static async deleteReaction(actor: Actor, reactionId: string): Promise<void>static async saveReaction(actor: Actor, reaction: Reaction): Promise<void>// In TurnPrepApi.ts```typescript**API Methods Needed**:```}  "TURN_PREP.Reactions.DeleteConfirm": "Delete this reaction plan?"  "TURN_PREP.Reactions.SearchPlaceholder": "Search reactions...",  "TURN_PREP.Reactions.DeleteTooltip": "Delete Reaction",  "TURN_PREP.Reactions.FavoriteTooltip": "Add to Favorites",  "TURN_PREP.Reactions.AdditionalFeatures": "Additional Features",  "TURN_PREP.Reactions.ReactionFeatures": "Reactions",  "TURN_PREP.Reactions.TriggerPlaceholder": "When would you use this reaction?",  "TURN_PREP.Reactions.Trigger": "Trigger",  "TURN_PREP.Reactions.ReactionName": "Reaction Name",  "TURN_PREP.Reactions.NewReaction": "New Reaction",  "TURN_PREP.Reactions.Title": "Reaction Plans",{```json**Localization Keys**:- Same as Turn Plans Panel (TidyTable, TextInput, etc.)**Tidy5e Components to Use**:- Delete with confirmation- Favorite toggle- Collapsible cards- Feature search filters by activation type (reactions only for Reactions section)- Two feature sections: Reactions, Additional Features- Trigger field is for player's decision-making notes, not mechanical trigger- Reactions persist (not cleared at end of turn)- Similar to Turn Plans but simpler (no movement/notes)**Features**:```}  isFavorite: boolean;           // Star toggle  createdTime: number;           // Timestamp  additionalFeatures: string[];  // Item IDs (any type)  reactionFeatures: string[];    // Item IDs (activation.type === 'reaction')  trigger: string;               // When to use (player notes)  name: string;                  // User-editable name  id: string;                    // UUIDinterface Reaction {```typescript**Data Model**:```└── NewReactionButton│   │   └── FeatureSearch│   │   ├── TidyTable (Tidy5e component)│   │   ├── SectionHeader (with search)│   ├── FeatureSection.svelte (x2: Reactions, Additional)│   ├── TriggerInput│   │   └── DeleteButton│   │   ├── FavoriteButton│   │   ├── ReactionNameInput│   ├── ReactionHeader.svelte├── ReactionCard.svelte (repeatable)ReactionsPanel.svelte```**Component Structure**:```└─────────────────────────────────────────────────────────────┘│   ...                                                        ││ ▼ Shield Spell                             [★][🗑️]          │├─────────────────────────────────────────────────────────────┤│   └─────────────────────────────────────────────────────┘   ││   │ └─────────────────────────────────────────────────┘ │   ││   │ │ [Feature Item Row - Tidy5e TidyTable]          │ │   ││   │ ┌─────────────────────────────────────────────────┐ │   ││   │ Additional Features                      [🔍]        │   ││   ┌─────────────────────────────────────────────────────┐   ││   └─────────────────────────────────────────────────────┘   ││   │ └─────────────────────────────────────────────────┘ │   ││   │ │ [Reaction Feature Row - Tidy5e TidyTable]      │ │   ││   │ ┌─────────────────────────────────────────────────┐ │   ││   │ Reactions                                [🔍]        │   ││   ┌─────────────────────────────────────────────────────┐   ││   Trigger: [text field for when to use]                     ││ ▼ Reaction Name (editable)                 [★][🗑️]          │├─────────────────────────────────────────────────────────────┤│ Reaction Plans                              [+ New Reaction] │┌─────────────────────────────────────────────────────────────┐```**Visual Layout**:**Purpose**: Pre-plan reactions with triggers and supporting features.### 3. Reactions Panel---```}  return `Plan ${existingPlans.length + 1}`;  const existingPlans = getCurrentPlans(actor);  // Otherwise use number  }    return firstAction?.name || 'New Plan';    const firstAction = actor.items.get(plan.actions[0]);  if (plan.actions.length > 0) {  // If has action items, use first action namefunction generatePlanName(plan: TurnPlan, actor: Actor): string {// Pattern: "Plan {number}" or "{Primary Action}" or "{Condition} Plan"```typescript**Auto-Generated Plan Names**:12. Test all interactions (add, remove, search, save, duplicate)11. Style with LESS10. Connect to TurnPrepAPI methods9. Add state management with `$state` rune8. Implement drag-and-drop for features7. Add all localization strings6. Create `AdditionalDetails.svelte` collapsible section5. Integrate Tidy5e's `TidyTable` components4. Create `FeatureSearch.svelte` autocomplete component3. Create `FeatureSection.svelte` with search box2. Create `TurnPlanCard.svelte` sub-component1. Create `TurnPlansPanel.svelte` main component**Implementation Steps**:```static async getFilteredFeatures(actor: Actor, searchText: string, activationType?: string): Promise<Item[]>static async savePlanToHistory(actor: Actor, plan: TurnPlan): Promise<void>static async toggleFavorite(actor: Actor, planId: string): Promise<void>static async duplicateTurnPlan(actor: Actor, planId: string): Promise<TurnPlan>static async deleteTurnPlan(actor: Actor, planId: string): Promise<void>static async saveTurnPlan(actor: Actor, plan: TurnPlan): Promise<void>// In TurnPrepApi.ts```typescript**API Methods Needed**:```}  "TURN_PREP.TurnPlans.DeleteConfirm": "Delete this turn plan?"  "TURN_PREP.TurnPlans.SearchPlaceholder": "Search features...",  "TURN_PREP.TurnPlans.DuplicateTooltip": "Duplicate Plan",  "TURN_PREP.TurnPlans.DeleteTooltip": "Delete Plan",  "TURN_PREP.TurnPlans.FavoriteTooltip": "Add to Favorites",  "TURN_PREP.TurnPlans.SaveClear": "Save & Clear",  "TURN_PREP.TurnPlans.AdditionalDetails": "Additional Details",  "TURN_PREP.TurnPlans.RoleplayNotes": "Roleplay Notes",  "TURN_PREP.TurnPlans.MechanicalNotes": "Mechanical Notes",  "TURN_PREP.TurnPlans.Movement": "Movement",  "TURN_PREP.TurnPlans.AdditionalFeatures": "Additional Features",  "TURN_PREP.TurnPlans.BonusActions": "Bonus Actions",  "TURN_PREP.TurnPlans.Actions": "Actions",  "TURN_PREP.TurnPlans.TriggerPlaceholder": "When would you use this plan?",  "TURN_PREP.TurnPlans.Trigger": "Trigger",  "TURN_PREP.TurnPlans.PlanName": "Plan Name",  "TURN_PREP.TurnPlans.NewPlan": "New Plan",  "TURN_PREP.TurnPlans.Title": "Current Turn Plans",{```json**Localization Keys**:- `HorizontalLineSeparator` between sections- `ButtonMenu` for action buttons (favorite, delete, duplicate)- `ExpandableContainer` for Additional Details section- `TextInput` for plan name, trigger, movement- `TidyTable`, `TidyTableRow`, `TidyTableCell` for feature display**Tidy5e Components to Use**:```// 4. Click result to add to plan// 3. Show results in dropdown below search box//    - Additional: any activation type (or none)//    - Bonus Actions: activation.type === 'bonus'//    - Actions: activation.type === 'action'// 2. Activity activation type matches section// 1. Search text appears in item name (case-insensitive)// Filter actor items by:```typescript**Feature Search Implementation**:- Delete button removes plan (with confirmation)- Duplicate button creates copy of plan- Favorite button adds to favorites list- Save & Clear button saves to history and clears current plan- Additional Details collapsible sub-section- Drag-and-drop features between plans- Features show: icon, name, activation cost, formula, range, uses- Use Tidy5e's TidyTable components to display features- Feature search box in section header (type to filter actor's items by name + activation type)- Three feature sections: Actions, Bonus Actions, Additional Features- Trigger field for "when to use this plan" notes- Plan name auto-generated on creation, then editable- Each plan is a collapsible card (click title to expand/collapse)**Features**:```}  isFavorite: boolean;           // Star toggle  createdTime: number;           // Timestamp  roleplayNotes: string;         // Text area  mechanicalNotes: string;       // Text area  movement: string;              // Text description  additionalFeatures: string[];  // Item IDs  bonusActions: string[];        // Item IDs  actions: string[];             // Item IDs  trigger: string;               // Condition/notes  name: string;                  // User-editable name  id: string;                    // UUIDinterface TurnPlan {```typescript**Data Model**:```└── NewPlanButton│   └── SaveClearButton│   │   └── RoleplayNotesTextarea│   │   ├── MechanicalNotesTextarea│   │   ├── MovementInput│   ├── AdditionalDetails.svelte (collapsible)│   │   └── FeatureSearch (autocomplete/filter)│   │   │   └── FeatureRowActions (remove, roll)│   │   │   ├── TidyTableRow (for each feature)│   │   ├── TidyTable (imported from Tidy5e)│   │   ├── SectionHeader (with search box)│   ├── FeatureSection.svelte (x3: Actions, Bonus, Additional)│   ├── TriggerInput (text field)│   │   └── DuplicateButton (fa-copy)│   │   ├── DeleteButton (fa-trash)│   │   ├── FavoriteButton (fa-star)│   │   ├── PlanNameInput (editable title)│   ├── PlanHeader.svelte├── TurnPlanCard.svelte (repeatable)TurnPlansPanel.svelte```**Component Structure**:```└─────────────────────────────────────────────────────────────┘│   ...                                                        ││ ▼ Backup Plan Name                         [★][🗑️][📋]      │├─────────────────────────────────────────────────────────────┤│   [Save & Clear]                                            ││   └─────────────────────────────────────────────────────┘   ││   │ Roleplay Notes: [text area]                         │   ││   │ Mechanical Notes: [text area]                       │   ││   │ Movement: [text field]                              │   ││   ┌─────────────────────────────────────────────────────┐   ││   ▼ Additional Details                                      ││   └─────────────────────────────────────────────────────┘   ││   │ └─────────────────────────────────────────────────┘ │   ││   │ │ [Feature Item Row - Tidy5e TidyTable]          │ │   ││   │ ┌─────────────────────────────────────────────────┐ │   ││   │ Additional Features                      [🔍]        │   ││   ┌─────────────────────────────────────────────────────┐   ││   └─────────────────────────────────────────────────────┘   ││   │ └─────────────────────────────────────────────────┘ │   ││   │ │ [Feature Item Row - Tidy5e TidyTable]          │ │   ││   │ ┌─────────────────────────────────────────────────┐ │   ││   │ Bonus Actions                            [🔍]        │   ││   ┌─────────────────────────────────────────────────────┐   ││   └─────────────────────────────────────────────────────┘   ││   │ └─────────────────────────────────────────────────┘ │   ││   │ │ [Feature Item Row - Tidy5e TidyTable]          │ │   ││   │ │ [Feature Item Row - Tidy5e TidyTable]          │ │   ││   │ ┌─────────────────────────────────────────────────┐ │   ││   │ Actions                                  [🔍]        │   ││   ┌─────────────────────────────────────────────────────┐   ││   Trigger: [text field for condition/notes]                 ││ ▼ Plan Name (editable)                     [★][🗑️][📋]      │├─────────────────────────────────────────────────────────────┤│ Current Turn Plans                          [+ New Plan]     │┌─────────────────────────────────────────────────────────────┐```**Visual Layout**:**Purpose**: Plan multiple turn options with features, triggers, and notes.### 2. Turn Plans Panel (Main Interface)---7. Test add/remove/clear/send functionality6. Style with LESS using Tidy5e variables5. Add API methods for saving and sending questions4. Implement state management with `$state` rune3. Add localization strings to `public/lang/en.json`2. Create `QuestionRow.svelte` sub-component1. Create `DmQuestionsPanel.svelte` component**Implementation Steps**:```static async sendQuestionPublic(actor: Actor, questionText: string): Promise<void>static async sendQuestionToDm(actor: Actor, questionText: string): Promise<void>static async saveQuestions(actor: Actor, questions: DmQuestion[]): Promise<void>// In TurnPrepApi.ts```typescript**API Methods Needed**:```}  "TURN_PREP.DmQuestions.Placeholder": "What question do you have for the DM?"  "TURN_PREP.DmQuestions.PublicTooltip": "Send to Public Chat",  "TURN_PREP.DmQuestions.WhisperTooltip": "Send to DM (Whisper)",  "TURN_PREP.DmQuestions.ClearTooltip": "Clear Text",  "TURN_PREP.DmQuestions.RemoveTooltip": "Remove Question",  "TURN_PREP.DmQuestions.AddTooltip": "Add Question",  "TURN_PREP.DmQuestions.Title": "DM Questions",{```json**Localization Keys**:- Custom button components with FontAwesome icons- `TextInput` (but as multi-line textarea variant)**Tidy5e Components to Use**:- Questions persist per character (not per plan)- Public sends to chat for all to see- Whisper sends to DM as private message- Clear button empties text field only- Remove button deletes row (if > 1 row exists)- Add button creates new row below current- TextArea auto-expands to 4-5 lines, then scrolls- Minimum 1 question row (cannot remove last row)**Features**:```}  createdTime: number;  // Timestamp  text: string;         // Question content  id: string;           // UUIDinterface DmQuestion {```typescript**Data Model**:```└── State: questions[]│   └── PublicButton (fa-bullhorn)│   ├── WhisperButton (far-paper-plane)│   ├── ClearButton (fa-eraser)│   ├── TextArea (4-5 lines, scrollable)│   ├── RemoveButton (fa-minus)│   ├── AddButton (fa-plus)├── QuestionRow.svelte (repeatable)DmQuestionsPanel.svelte```**Component Structure**:```└─────────────────────────────────────────────────────────────┘│ [+][-] [Text input field.....................] [🗑️][✉️][📢] ││ [+][-] [Text input field.....................] [🗑️][✉️][📢] ││ [+][-] [Text input field.....................] [🗑️][✉️][📢] │├─────────────────────────────────────────────────────────────┤│ DM Questions                                                │┌─────────────────────────────────────────────────────────────┐```**Visual Layout**:**Purpose**: Quick text entry for questions to ask the DM during the player's turn.### 1. DM Questions Panel## Component Specifications---4. **History & Favorites** (medium - display and restore functionality)3. **Reactions Panel** (medium - similar to turn plans but simpler)2. **Turn Plans Panel** (most complex - main interface with feature cards)1. **DM Questions Panel** (simplest - text inputs and buttons)### Implementation Priority- **API Communication**: Direct calls to TurnPrepAPI- **Localization**: FoundryAdapter.localize() from start- **Dialogs**: DialogV2 (migrate deprecated Dialog)- **Components**: Import Tidy5e components, create custom cards- **Data Flow**: Hybrid (Context + reactive .svelte.ts + props/events)- **Styling**: LESS with Tidy5e CSS variables- **Framework**: Svelte 5 with runes (`$state`, `$derived`, `$effect`, `$bindable`)### Technical Stack (Confirmed)Phase 4 builds the Svelte 5 UI components that will be integrated into Tidy5e character sheets. This phase creates the visual interface for turn planning, DM questions, reactions, and history/favorites.## Overview---**Start Date**: January 20, 2026**Dependencies**: Phase 1 ✅, Phase 2 ✅, Phase 3 ✅  **Phase**: 4 - UI Components (Svelte 5)  **Status**: Ready for Implementation  Research compiled from public documentation and source code analysis. This document guides Phase 1 implementation decisions.

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

**The Activities System - CRITICAL DISCOVERY (Phase 2)**

The modern D&D 5e system uses an **Activities Collection** to store features and their activation costs. This is the authoritative source for querying a character's features.

**How to query features correctly:**
```javascript
// CORRECT: Iterate the activities collection on each item
for (const item of actor.items) {
  for (const activity of item.system.activities) {
    if (activity.activation?.type === 'action') {
      // Found an action cost feature
      const feature = {
        itemId: item.id,
        itemName: item.name,
        itemType: item.type,
        actionType: activity.activation.type
      };
    }
  }
}

// WRONG (old approach): ❌ DON'T use this
// const actions = actor.items.filter(item => item.system?.activation?.type === 'action');
// The activation property may exist at item level but activities are the canonical source
```

**Activity Properties:**
- `activity.activation.type` - Values: `'action'`, `'bonus'`, `'reaction'`, `'minute'`, `'hour'`, `'day'`, `'turnStart'`, `'turnEnd'`, `'legendary'`, `'mythic'`, `'lair'`, `'crew'`, `'special'`, `''` (none)
- `activity.activation.cost` - Numeric cost (usually 1)
- `activity.name` - Activity name (can differ from item name)
- `activity.uses` - Available uses/slots
- And various other properties (range, target, damage, etc.)

**Activity Types to Filter:**
- **Action features**: `activation.type === 'action'` (main action economy)
- **Bonus actions**: `activation.type === 'bonus'`
- **Reactions**: `activation.type === 'reaction'`
- **Free/Special**: Any other value or empty string

**Important Notes:**
- An item can have **multiple activities** with different activation types
- For example, a spell might have one activity for casting (bonus action) and another for some special effect
- Items without activities (or activities without activation.type) are still features but use no action economy
- All item types support activities: weapons, spells, feats, class features, homebrew items

**Activation Cost Values** (from research):
- Standard: `action`, `bonus`, `reaction`
- Time: `minute`, `hour`, `day`
- Rest: `longRest`, `shortRest`
- Combat: `encounter`, `turnStart`, `turnEnd`
- Monster: `legendary`, `mythic`, `lair`
- Vehicle: `crew`
- Special: `special`, `""` (none)

**Item Types in 5e System:**
- All item types support the activities system: 'spell', 'feature', 'equipment', 'loot', 'weapon', 'tool', 'consumable', 'feat', 'class', etc.
- No special handling needed for item type filtering - activities transcend type boundaries
- Features/spells/items all live in `actor.items`

**Safe Item Properties (for snapshots):**
- `item.id` - Unique identifier (stable for snapshots)
- `item.name` - Display name (safe to snapshot)
- `item.type` - Item type: 'spell', 'feature', 'equipment', 'loot', 'weapon', 'tool', 'consumable', etc.
- `activity.activation.type` - Activation cost (safe to rely on)
- `item.img` - Icon/image path (safe to snapshot if needed)

### Breaking Changes Between 5e Versions

**CRITICAL: D&D 5e v5.2.0 Requires Foundry V13+**

The D&D 5e v5.2.0 release **ONLY supports Foundry Virtual Tabletop v13 and greater**. Older versions of the system do not work with Foundry V12.

**For v5.1.x -> v5.2.x Migration:**
- Vehicle data structure changed significantly (Dimensions, Creature Capacity, Crew & Passengers)
- Not automatically migrated - old data preserved but invisible
- Activities system enhanced with new visibility constraints
- Activities are the canonical source for feature querying (verified in Phase 2)

**Activities System Evolution:**
- **v5.1.x and v5.2.x**: Both use the Activities collection as the primary feature storage
- **Phase 2 Discovery**: Must iterate `item.system.activities` Collection to access features, not query at item level
- **Stable since**: v5.1.x (no expected breaking changes in querying approach)
- Safe pattern: `for (const activity of item.system.activities)` then check `activity.activation.type`

**Key Breaking Changes in v5.2.0:**
1. **Calendar Integration** - New calendar API integration (not relevant for Turn Prep)
2. **Activity & Effect Visibility** - Activities can now be hidden by level/criteria (will affect Phase 3+ feature filtering)
3. **ApplicationV2 Conversion** - Vehicle sheets converted (doesn't affect character/item sheets we care about)
4. **Vehicle Data Restructuring** - Major changes to vehicle system (doesn't affect character items/features)

**Compatibility Recommendation:**
- Target D&D 5e v5.1.x or v5.2.x (both with Foundry V13+)
- Do NOT attempt to support earlier v5.0.x versions
- Activities collection querying is stable across 5.x
- All future phases should iterate activities, not query item.system.activation directly
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

**Last Updated:** January 20, 2026
**Status:** Ready for Phase 4 implementation
**Research Complete:** Tidy 5E v12+, D&D 5e v5+, Foundry Core V13, Tidy5e UI Components
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

---

## 12. Tidy5e UI Components & Svelte 5 Architecture (Phase 4 Research)

### Svelte 5 Runes System

**Tidy5e uses Svelte 5 runes extensively throughout its codebase.**

**Core Runes Used:**
- **`$state`** - Reactive state management
  ```svelte
  let context = $state<UserSettingsContext>();
  let sections = $state<SectionConfigItem[]>([]);
  ```

- **`$derived`** - Computed values (replaces reactive `$:` statements)
  ```svelte
  let context = $derived(getSheetContext<ItemSheetQuadroneContext>());
  let advancements = $derived(Object.entries(context.advancement));
  ```

- **`$effect`** - Side effects (replaces `$:` for imperative code)
  ```svelte
  $effect(() => {
    selectedTabId = context.currentTabId;
  });
  ```

- **`$bindable`** - Two-way binding for component props
  ```svelte
  let value = $bindable();
  let expanded = $bindable(false);
  ```

**Turn Prep Recommendation:** Use Svelte 5 runes throughout for maximum compatibility with Tidy5e patterns.

### Data Management Pattern (Hybrid Approach)

**Tidy5e uses a three-layer data management strategy:**

1. **Svelte Context** - For passing sheet-wide data down the component tree:
   ```typescript
   // Setting context at sheet level
   const context = new Map<any, any>([
     [CONSTANTS.SVELTE_CONTEXT.CONTEXT, this._context],
     [CONSTANTS.SVELTE_CONTEXT.MESSAGE_BUS, this.messageBus],
   ]);
   
   // Accessing in child components
   let context = $derived(getSheetContext<CharacterSheetQuadroneContext>());
   ```

2. **Reactive .svelte.ts files** - For shared service state:
   ```typescript
   // In settings.svelte.ts
   let _settings: CurrentSettings = $state()!;
   
   // Accessed from components
   import { settings } from 'src/settings/settings.svelte';
   ```

3. **Props and events** - For local component communication:
   ```svelte
   interface Props {
     item: Item5e;
     onToggle?: (event: Event) => void;
   }
   let { item, onToggle }: Props = $props();
   ```

**Turn Prep Pattern:**
- **Context**: For passing actor/sheet data and TurnPrepStorage
- **Reactive .svelte.ts files**: For global module state (settings, TurnPrepAPI)
- **Props/Events**: For component-specific interactions

### Component Library Structure

**Tidy5e has extensive reusable components** in `/src/components/`:

**Input Components:**
- `TextInput.svelte`, `NumberInput.svelte`
- `Checkbox.svelte`, `CheckboxQuadrone.svelte`
- `Select.svelte`, `SelectQuadrone.svelte`
- `TextInputQuadrone.svelte`, `NumberInputQuadrone.svelte`

**Button Components:**
- `ButtonMenu.svelte` - Dropdown menu button
- `ButtonMenuCommand.svelte`, `ButtonMenuItem.svelte`
- `ToggleButton.svelte` - Toggle switch button
- `ButtonWithOptionPanel.svelte` - Button with expandable options

**Layout Components:**
- `TidyTable.svelte`, `TidyTableRow.svelte`, `TidyTableCell.svelte`
- `ExpandableContainer.svelte`
- `HorizontalLineSeparator.svelte`

**Form Components:**
- `FormGroup.svelte`
- `TidyFormInput.svelte` - Smart form input that picks the right component
- `FoundryFormInput.svelte` - Wrapper for Foundry's native form inputs

**Specialized Components:**
- `Dnd5eIcon.svelte` - D&D 5e icon wrapper
- `PropertyTag.svelte` - Pills/tags for item properties
- `Pips.svelte` - Dot indicators (e.g., spell slots)

**Turn Prep Strategy:**
- Import and use Tidy5e components where possible
- Create custom components only when Tidy5e doesn't provide what we need
- Follow Tidy5e naming conventions (descriptive, not generic)
- Support both Classic and Quadrone variants if needed

### LESS Styling System

**Tidy5e uses LESS exclusively** for styling:

**File Structure:**
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

**Key Features Used:**
- **LESS Variables**: `@badge_level_dark`, `@denim065`
- **Nesting**: Extensive use of nested selectors
- **Mixins**: Present but not heavily used
- **CSS Variables**: Used alongside LESS for runtime theming

**In Svelte Components:**
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

**Turn Prep Approach:**
- Continue with LESS (matches Tidy5e)
- Use scoped `<style lang="less">` in components
- Use global LESS files for shared styles
- Leverage Tidy5e's CSS variables for theming

### Dialog System (DialogV2)

**Foundry V12+ uses `DialogV2`** (replaces deprecated `Dialog`):

**Tidy5e Uses DialogV2 for Confirmations:**
```typescript
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

**Dialog Types:**
1. **Simple Confirmations**: Use `DialogV2.confirm()` or `DialogV2.prompt()`
2. **Complex Forms**: Create custom `ApplicationV2` with Svelte component
3. **Sheet-like Dialogs**: Extend `DocumentSheetDialog`

**Turn Prep Migration Plan:**
1. Replace deprecated `Dialog` with `DialogV2.prompt()` for quick fix
2. Create `ActivitySelector.svelte` component for activity selection
3. Create `EndOfTurnDialog.svelte` for end-of-turn confirmation
4. Use same pattern for any future dialogs

### Actor Update Handling (ApplicationV2)

**Tidy5e uses Foundry's reactive rendering system:**

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

**What Updates to Worry About:**
- ✅ **Actor data changes** - Handled by ApplicationV2
- ✅ **Item changes** - Handled by ApplicationV2  
- ✅ **Effect changes** - Handled by ApplicationV2
- ⚠️ **Cross-actor changes** - Only if displaying data from multiple actors
- ⚠️ **Real-time collaboration** - Handled by Foundry's data layer

**Turn Prep Pattern:** Use ApplicationV2 auto-rendering - no manual hook listeners needed for most cases.

### Localization (i18n) Pattern

**Tidy5e uses FoundryAdapter.localize() throughout:**

```svelte
<script>
  import { FoundryAdapter } from 'src/foundry/foundry-adapter';
  const localize = FoundryAdapter.localize;
</script>

<label>{localize('DND5E.FeatureAdd')}</label>
<button title={localize('TIDY5E.RestHint')}>
  {localize('TIDY5E.ShortRest')}
</button>
```

**Localization Files:**
```json
// public/lang/en.json
{
  "TURN_PREP.DmQuestions.Title": "DM Questions",
  "TURN_PREP.DmQuestions.AddButton": "Add Question",
  "TURN_PREP.TurnPlan.SaveButton": "Save & Clear"
}
```

**Best Practices:**
- Use descriptive keys: `TURN_PREP.ComponentName.ElementName`
- Group by component/feature
- Add placeholders for dynamic content:
  ```javascript
  localize('TURN_PREP.History.EntryCount', { count: 5 })
  // "You have {count} saved turns" → "You have 5 saved turns"
  ```

**Turn Prep Approach:** Use `FoundryAdapter.localize()` for all user-visible text from the start.

### Undo/Redo Capabilities

**Foundry VTT does NOT have built-in undo/redo** for document changes:

**What Foundry Provides:**
- ❌ No native undo/redo system for actor/item data
- ✅ Transaction-based updates (all-or-nothing)
- ✅ Previous data available in hook callbacks
- ❌ No undo stack or history management

**Tidy5e's Approach:**
- Does NOT implement undo/redo
- Relies on Foundry's update system
- Uses confirmation dialogs for destructive actions

**Turn Prep Strategy:**
- Use edit checkpoints for History and Favorites
- No undo/redo for current turn plans
- "Restore from Checkpoint" button for saved plans
- Auto-save checkpoint before major changes

### API Communication Pattern

**Tidy5e components call Foundry APIs directly:**

```svelte
<script>
  import { TurnPrepAPI } from 'src/api/TurnPrepApi';
  
  async function savePlan() {
    await TurnPrepAPI.saveTurnPlan(actor, plan);
  }
</script>
```

**Best Practices:**
1. Import API at component level
2. Call methods directly in event handlers
3. Use try/catch for error handling
4. Show user feedback (toasts/notifications)

**Turn Prep Pattern:** Components call TurnPrepAPI methods directly - simple, clear, and matches Tidy5e patterns.

### Component Integration Points

**Tidy5e Sheet Tab Integration:**
- Character sidebar tabs via `api.registerCharacterSidebarTab()`
- Regular sheet tabs via `api.registerCharacterTab()`
- Both use SvelteTab model for Svelte components

**Turn Prep Integration Plan:**
1. **Main Tab**: Register "Turn Prep" tab in main tab bar for current turn planning
2. **Sidebar Tab**: Register "Turns" tab in sidebar for history/favorites
3. **Auto-show Sidebar**: When switching to Turn Prep tab, auto-show sidebar on Turns tab

**Component Reuse Strategy:**
- Import TidyTable components for feature display
- Use Tidy5e's input components for text fields
- Create custom card components for turn plans
- Leverage Tidy5e's expandable containers

### Summary for Phase 4 Implementation

**Confirmed Technical Stack:**
- ✅ Svelte 5 with runes (`$state`, `$derived`, `$effect`, `$bindable`)
- ✅ Hybrid data: Context + reactive .svelte.ts + props/events
- ✅ Import Tidy5e components, create custom when needed
- ✅ LESS for styling with Tidy5e's CSS variables
- ✅ DialogV2 for all dialogs (migrate deprecated Dialog)
- ✅ ApplicationV2 auto-rendering for actor updates
- ✅ Direct API calls from components
- ✅ Edit checkpoints for undo (no custom undo/redo)
- ✅ FoundryAdapter.localize() for i18n from start