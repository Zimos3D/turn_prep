# Phase 3 Implementation Plan - Features Layer

**Status**: Ready to implement  
**Based on**: PHASE3_CLARIFICATIONS.md  
**Files to create/modify**: 3 core + supporting files

---

## Overview

Phase 3 implements the Features Layer: settings system, context menu integration, and roll discovery/history management. This phase bridges the data layer (Phase 2) with the UI layer (Phase 4).

---

## Key Decisions (From Clarifications)

### Settings System ✅
- **History Limit**: Global world setting with per-actor override capability
  - World Setting: Default history limit (10)
  - Per-Actor: Can override default for specific character
  - Auto-delete oldest entries when limit exceeded
  - Stored in actor flags alongside turn prep data

- **DM Visibility**: Skipped for now (GMs can view, no restriction)

- **Module Enable/Disable**: 
  - Default sheet: Always enabled, no toggle
  - Tidy 5E sheet: Hooks into Tab Configuration menu (persistence handled by Tidy)
  - Note: Test Tidy persistence during Phase 5 (sheet integration)

- **Compact Mode**: Skipped for Phase 3

### Context Menu Integration ✅
- **"Add to Turn Prep" Routing**:
  - Single activation type → auto-add to matching field
  - Multiple activation types → dialog with activity names and "Select" buttons
  - No activation type → add to Additional Features
  - Can add same item multiple times (for multiattack)

- **Drag & Drop Support**:
  - When dragging item to different field, check parent item's activities
  - If multiple matching activities, show selection dialog
  - If single match, auto-add to target field

- **Species & Background**: Just regular features, check `source` field for identification

- **Right-Click Menu** (in Turn Prep panel):
  - Remove
  - View Full Item Details
  - Swap (with another feature)
  - Copy to Clipboard
  - Duplicate (copy in same field)
  - Save Plan as Favorite
  - **NO** "Move to Different Field" (use drag & drop instead)

- **Icons**: Font Awesome approximations for BG3 symbols
  - Action: `fa-circle`
  - Bonus Action: `fa-play`
  - Reaction: `fa-exchange-alt`
  - Additional Features: `fa-plus-circle`
  - Additional menu: Remove (`fa-trash-alt`), Details (`fa-info-circle`), Swap (`fa-exchange-alt`), Copy (`fa-copy`), Duplicate (`fa-clone`), Favorite (`fa-star`)

### Roll Integration ✅
- **Workflow**:
  1. Player clicks "Send to History" on a turn plan
  2. System searches chat history for rolls using feature/activity IDs
  3. Finds matching rolls and associated saving throws
  4. Creates history snapshot with rolls embedded
  5. When turn ends (via initiative), show dialog asking to save plan

- **Roll Discovery**: Search chat messages for feature/activity ID matches

- **Saving Throw Tracking**: Include spell saves and target success/fail from chat

- **History Details**: 
  - Expandable section in history item showing rolls and results
  - Rolls displayed as separate lines (multiattack support)

- **Edit History**:
  - Max 5 checkpoints (configurable, global setting)
  - Stored in actor flags
  - Players can edit (global setting for permission)
  - Expandable display of edit history

- **End of Turn Dialog**:
  - Triggered by initiative tracker (research Foundry combat events)
  - Radio button list if multiple plans exist
  - Dialog allows save or cancel (manual save still available)

- **Missing Feature Handling**:
  - Check when loading to current plan (like Tidy5E does)
  - Auto-remove unavailable features, show placeholder
  - History snapshots store feature NAMES only (disconnected from source)
  - Only check availability when loaded to current plan

---

## Files to Create/Modify

### Core Files

#### 1. **src/settings/settings.ts** (NEW)
**Responsible for**: Define all Phase 3 settings

**New Settings to Register**:
- `historyLimitDefault` (scope: world, default: 10, type: number)
- `editHistoryCheckpoints` (scope: world, default: 5, type: number)
- `allowPlayerEditHistory` (scope: world, default: true, type: boolean)
- `enableTurnPrepTab` (scope: world, default: true, type: boolean) [existing]
- Per-actor history limit override (stored in actor flags)

**Key Aspects**:
- Register all settings during init hook
- Create helper functions for retrieving settings with fallbacks
- Document each setting's purpose and constraints

#### 2. **src/features/context-menu/ContextMenuHandler.ts** (NEW)
**Responsible for**: Right-click context menu integration

**Exports**:
- `registerContextMenus()` - Registers all context menu handlers
- Activity selection dialog handler
- Right-click menu handler for Turn Prep features
- Drag & drop field movement handler

**Implementation Details**:

**Part A: "Add to Turn Prep" on Items (Inventory, Spells, Features)**
```
When user right-clicks an item:
1. Check if item has any activities with activation.type
2. If single activation type:
   - Determine target field (action/bonus/reaction/additional)
   - Call TurnPrepStorage to add feature
3. If multiple activation types:
   - Show modal dialog with activity names
   - Each activity has "Select" button
   - User chooses which activity to use
4. If no activation:
   - Add to Additional Features field
```

**Part B: Right-Click Menu in Turn Prep Panel**
```
When user right-clicks a feature in Turn Prep:
Show context menu with:
- Remove (fa-trash-alt)
- View Full Item Details (fa-info-circle)
- Swap (fa-exchange-alt)
- Copy to Clipboard (fa-copy)
- Duplicate (fa-clone)
- Save Plan as Favorite (fa-star)
```

**Part C: Drag & Drop Field Movement**
```
When user drags feature from one field to another:
1. Get parent item
2. Check if parent item has any activities for target field
3. If single match: add to target field
4. If multiple matches: show activity selection dialog
5. Update storage
```

**Key Methods**:
- `getActivitiesForActivationType(item, type)` - Filter activities by type
- `showActivitySelectionDialog(item, activationTypes)` - Modal for choosing activity
- `addFeatureToField(actor, plan, feature, field)` - Add feature to appropriate field
- `removeFeatureFromField(actor, plan, featureId, field)` - Remove feature
- `duplicateFeatureInField(actor, plan, featureId, field)` - Clone feature

#### 3. **src/features/roll-integration/RollHandler.ts** (NEW)
**Responsible for**: Roll discovery, chat searching, history snapshot creation

**Exports**:
- `discoverRollsForPlan(actor, plan, timeWindow?)` - Find rolls matching plan features
- `discoverSavingThrowsForSpell(actor, spell, timeWindow?)` - Find saves against spell
- `createHistorySnapshot(actor, plan, rolls?, saves?)` - Create history entry
- `findRollsInChat(actor, featureIds, timeWindow?)` - Search chat messages
- `registerInitiativeEndTurnHook()` - Hook for end-of-turn dialog

**Implementation Details**:

**Part A: Roll Discovery from Chat**
```
When "Send to History" clicked:
1. Get list of feature IDs and activity IDs from current plan
2. Search through game.messages (chat history)
3. Look for message.rolls that mention these IDs
4. Extract roll data, results, damage, etc.
5. Return array of {feature, roll, result}
```

**Part B: Saving Throw Discovery**
```
For spells with saving throws:
1. Get spell name and save DC from feature
2. Search chat for messages containing spell name + "save" keywords
3. Find creature rolls against the spell
4. Extract: creature name, roll result, pass/fail
5. Return array of {creature, roll, result}
```

**Part C: History Snapshot Structure**
```typescript
interface TurnHistorySnapshot extends TurnSnapshot {
  rolls: {
    featureId: string;
    featureName: string;
    rolls: Array<{
      type: 'attack' | 'damage' | 'save' | 'other';
      result: string;
      formula?: string;
      chatMessageId?: string;
    }>;
  }[];
  savingThrows?: Array<{
    spellName: string;
    spellId: string;
    saves: Array<{
      creatureName: string;
      roll: number;
      dc: number;
      success: boolean;
      chatMessageId?: string;
    }>;
  }>;
  editHistory?: {
    timestamp: number;
    changesSummary: string;
    checkpoint: TurnSnapshot;
  }[];
  lastEditedAt?: number;
}
```

**Part D: Initiative Hook for End-of-Turn Dialog**
```
1. Hook: combatant.nextTurn or similar
2. Get actor whose turn just ended
3. Check if actor has active turn plan
4. Show dialog: "Save current plan to history?"
5. If multiple plans: radio button list for selection
6. On confirm: call createHistorySnapshot() and clear plan
7. On cancel: user can save manually later
```

**Key Methods**:
- `searchChatForFeatureRolls(actor, featureIds, timeWindow)` - Chat search implementation
- `parseRollFromChatMessage(message, featureId)` - Extract roll data from message
- `searchChatForSavingThrows(actor, spell, timeWindow)` - Save throw search
- `validateRollMatchesFeature(roll, featureId)` - Confirm roll belongs to feature

#### 4. **src/features/data/TurnPrepData.ts** (MODIFY)
**Changes**:
- Add per-actor history limit override storage location
- Update type definitions to include roll and saving throw data in history snapshots
- Add validation for history size and checkpoint count
- Export new utility functions for edit checkpoint management

---

## Implementation Sequence

### Step 1: Settings System
1. Create `settings.ts` with all Phase 3 setting definitions
2. Add settings registration in `init.ts`
3. Create helper functions for retrieving settings
4. Update type definitions for settings

### Step 2: Activity Selection Dialog
1. Create modal dialog component (can be simple HTML for now, Svelte later in Phase 4)
2. Implement activity selection dialog handler
3. Test with multi-activity items

### Step 3: Context Menu - Add to Turn Prep
1. Register "Add to Turn Prep" context menu on items
2. Implement routing logic (single vs multiple activities)
3. Implement field addition logic
4. Test on inventory, spells, features

### Step 4: Context Menu - Right-Click in Turn Prep
1. Register right-click context menu handler
2. Implement Remove functionality
3. Implement View Details functionality
4. Implement other menu options (Copy, Duplicate, etc.)
5. Test all options

### Step 5: Drag & Drop Field Movement
1. Implement drag & drop handlers for fields
2. Validate target field
3. Check for multiple matching activities
4. Test dragging between fields

### Step 6: Roll Discovery & Chat Searching
1. Implement chat message search algorithm
2. Test with real rolls in Foundry
3. Handle various roll formats
4. Create comprehensive test scenarios

### Step 7: Saving Throw Discovery
1. Implement save throw search in chat
2. Parse save results (pass/fail)
3. Match to spells in current plan
4. Test with various spell save scenarios

### Step 8: History Snapshot Creation
1. Extend TurnSnapshot type with roll/save data
2. Implement snapshot creation with rolls
3. Implement expandable detail display
4. Update TurnPrepStorage to handle new snapshot format

### Step 9: Edit History & Checkpoints
1. Implement checkpoint storage in actor flags
2. Implement checkpoint limit enforcement
3. Implement restore functionality
4. Test edit history workflow

### Step 10: Initiative Hook & End-of-Turn Dialog
1. Research Foundry combat/initiative events
2. Register initiative advancement hook
3. Implement end-of-turn detection
4. Create dialog for plan saving
5. Test with active combat

### Step 11: Missing Feature Detection
1. Implement availability checking (mirrors Tidy5E behavior)
2. Check when loading to current plan
3. Auto-remove unavailable features
4. Show placeholders
5. Test with various unavailability scenarios

### Step 12: API Updates & Global Exports
1. Add Phase 3 methods to TurnPrepApi
2. Export new handlers to global scope for testing
3. Update init.ts with new imports

---

## Testing Checklist

### Settings System
- [ ] Settings appear in World Settings
- [ ] Per-actor override stores correctly in actor flags
- [ ] History limit enforcement works
- [ ] Edit history checkpoint limit works

### Context Menu - Add to Turn Prep
- [ ] Menu appears on inventory items
- [ ] Menu appears on spells
- [ ] Menu appears on features
- [ ] Single activation auto-adds to correct field
- [ ] Multiple activations show selection dialog
- [ ] No activation goes to Additional Features
- [ ] Duplicate items can be added

### Context Menu - Right-Click in Turn Prep
- [ ] All 6 menu options appear
- [ ] Remove functionality works
- [ ] View Details opens item sheet
- [ ] Copy to Clipboard works
- [ ] Duplicate creates copy in same field
- [ ] Save Plan as Favorite works
- [ ] All icons display correctly

### Drag & Drop Field Movement
- [ ] Can drag feature between fields
- [ ] Single matching activity auto-adds
- [ ] Multiple matching activities show dialog
- [ ] Drop targets are visually clear

### Roll Discovery
- [ ] Chat search finds attack rolls
- [ ] Chat search finds damage rolls
- [ ] Chat search finds save rolls
- [ ] Roll matching by feature/activity ID works
- [ ] Time window filtering works

### Saving Throw Discovery
- [ ] Spell saving throws are found in chat
- [ ] Creature saves are matched to spells
- [ ] Pass/fail results are captured
- [ ] DC and roll values are extracted

### History Snapshots
- [ ] Snapshots include discovered rolls
- [ ] Snapshots include saving throw data
- [ ] Expandable details display rolls
- [ ] Multiple rolls display as separate lines
- [ ] Multiattack scenarios display correctly

### Edit History
- [ ] Checkpoints created on edit
- [ ] Checkpoint limit enforced
- [ ] User can restore checkpoint
- [ ] Edit history displays in expandable section

### End-of-Turn Dialog
- [ ] Dialog appears when turn ends
- [ ] Dialog shows all active plans (radio buttons)
- [ ] Saving plan works
- [ ] Cancel works
- [ ] Manual save still available

### Missing Feature Detection
- [ ] Unavailable features are detected
- [ ] Placeholders display correctly
- [ ] History snapshots aren't affected
- [ ] Current plans are cleaned on load
- [ ] Notification appears (silent or warning?)

---

## Notes for Implementation

### Code Patterns from Phase 1 & 2
- Use existing logging utilities (not console.log)
- Follow TypeScript strict mode
- Use FoundryAdapter for all Foundry interactions
- Create utility functions in separate files
- Keep related logic together

### Foundry Research Needed
- Investigate combat/initiative events (Step 10)
- Confirm chat message roll data structure
- Check how Tidy5E detects missing items
- Verify activity selection dialog best practices

### Phase 3 Dependencies
- Phase 2 (TurnPrepData, TurnPrepStorage) ✅ Complete
- Phase 1 (Foundation utilities) ✅ Complete
- No Phase 4 dependencies (UI is Phase 4)

### Known Future Considerations
- Phase 4 will replace modal dialogs with Svelte components
- Phase 5 will integrate with Tidy5E sheet system
- Chat roll parsing may need refinement based on different roll types

---

## Success Criteria

**Phase 3 is complete when:**
- [ ] All 3 core files implemented and compiled
- [ ] All settings registered and retrievable
- [ ] Context menus working on items and in Turn Prep
- [ ] Drag & drop field movement functional
- [ ] Roll discovery finding rolls in chat
- [ ] Saving throws being recorded
- [ ] History snapshots created with roll data
- [ ] Edit history checkpoint system working
- [ ] End-of-turn dialog triggering correctly
- [ ] Missing feature detection working
- [ ] All console tests passing
- [ ] Module builds cleanly (0 errors)

---

## Implementation Workflow

```bash
# Build after each step
npm run build

# Test in Foundry console
# Open character sheet and test features

# When complete, commit and move to Phase 4
```

Ready to begin! 🚀
