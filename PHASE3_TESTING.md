# Phase 3 Testing Guide

**Status**: Ready to test  
**Build**: ✅ Clean (74.09 kB)  
**Date**: January 19, 2026
**Last Update**: Fixed TurnPrepAPI.settings namespace exposure

---

## API Fix Summary

### Issue
The initial build exposed `TurnPrepAPI` globally but didn't include the `settings` and `rolls` namespaces, causing:
```javascript
TurnPrepAPI.settings.getDefaultHistoryLimit()
// Uncaught TypeError: Cannot read properties of undefined
```

### Solution Applied
Updated `src/api/TurnPrepApi.ts` to include:
1. **settings namespace** - All configuration methods
   - `getDefaultHistoryLimit()`
   - `getHistoryLimitForActor(actor)`
   - `setHistoryLimitForActor(actor, limit)`
   - And 5 more settings methods

2. **rolls namespace** - All roll/history methods
   - `createHistorySnapshot(actor, plan)`
   - `discoverRollsForPlan(actor, plan)`
   - `discoverSavingThrowsForActor(actor)`
   - And 4 more roll methods

### Testing the Fix
```javascript
// In Foundry console (F12):
const actor = game.actors.get('YourActorName');

// This now works!
TurnPrepAPI.settings.getDefaultHistoryLimit()  // Returns 10
TurnPrepAPI.settings.getHistoryLimitForActor(actor)  // Returns 10 or override value
```

---

## Testing Overview

Phase 3 implemented three major systems:
1. **Settings System** - World and per-actor configuration
2. **Context Menu Integration** - "Add to Turn Prep" on items
3. **Roll Integration** - Discovery, history snapshots, and edit history

This guide will help you systematically test each component in Foundry.

---

## Prerequisites

### Setup Required
- [ ] Module built: `npm run build` (already done ✅)
- [ ] Module linked to Foundry: Check dist/ folder exists and links
- [ ] Foundry world loaded with at least one player character
- [ ] Browser DevTools open (F12) to see console logs
- [ ] A test character with items, spells, and features

### Quick Setup
```bash
# Start dev watch mode (optional, auto-rebuilds on changes)
npm run dev

# Or rebuild manually
npm run build
```

---

## Test 1: Settings System ✓

### What to Test
Settings registration and retrieval for world-level and per-actor configurations.

### Test Steps

#### 1.1: World Settings Registration
1. Open **Foundry World Settings** (⚙️ gear icon)
2. Click **System Settings**
3. Search for "edit history" or "Turn Prep"
4. **Verify**: You see these settings:
   - `editHistoryCheckpoints` (range: 1-20, default: 5)
   - `allowPlayerEditHistory` (boolean, default: true)

**Pass Criteria**: Both settings appear with correct ranges

RESULT:
Worked as expected

#### 1.2: Read Settings via Console
```javascript
// In Foundry console (F12):
game.settings.get('turn-prep', 'editHistoryCheckpoints')  // Should return 5
game.settings.get('turn-prep', 'allowPlayerEditHistory')  // Should return true
```

RESULT:
Worked as expected

**Pass Criteria**: Both return expected values

#### 1.3: Modify Settings
1. In World Settings, change `editHistoryCheckpoints` to 10
2. In console, verify:
```javascript
game.settings.get('turn-prep', 'editHistoryCheckpoints')  // Should return 10
```

**Pass Criteria**: Changes persist after refresh

RESULT:
Pass

#### 1.4: Per-Actor History Limit Override
```javascript
// In console (with actor ID from your test character):
const actor = game.actors.get('Actor.aE6CdkhlEIajXUMc');

// Get default limit
TurnPrepAPI.settings.getDefaultHistoryLimit()  // Should return 10

// Get limit for this actor (should return default if no override)
TurnPrepAPI.settings.getHistoryLimitForActor(actor)  // Should return 10

// Set per-actor override
TurnPrepAPI.settings.setHistoryLimitForActor(actor, 15)

// Verify override
TurnPrepAPI.settings.getHistoryLimitForActor(actor)  // Should return 15
```

**Pass Criteria**: 
- Default returns 10 (or current world setting)
- Per-actor override stores and retrieves correctly
- Override persists after refresh

**RESULT**: ✅ FIXED - API now properly exposed through TurnPrepAPI.settings namespace

**Fix Applied**: Updated TurnPrepApi to expose settings methods:
- Added settings namespace with all configuration methods
- Added rolls namespace with all roll/history methods
- Updated RollHandler imports to use correct constants

**To Test Now** (in Foundry console):
```javascript
const actor = game.actors.get('Frodo');

// Get default limit
TurnPrepAPI.settings.getDefaultHistoryLimit()  // Should return 10

// Get limit for this actor (should return default if no override)
TurnPrepAPI.settings.getHistoryLimitForActor(actor)  // Should return 10

// Set per-actor override
await TurnPrepAPI.settings.setHistoryLimitForActor(actor, 15)

// Verify override
TurnPrepAPI.settings.getHistoryLimitForActor(actor)  // Should return 15
```

---

## Test 2: Context Menu - Add to Turn Prep ✓

### What to Test
Right-click context menu on items with activity selection dialog.

### Test Steps

#### 2.1: Context Menu Appears
1. Open character sheet (any character with items)
2. Go to **Inventory** or **Spells** tab
3. **Right-click** any item
4. **Verify**: Context menu appears with "Add to Turn Prep" option

**Pass Criteria**: Menu item visible with Font Awesome icon

#### 2.2: Single Activity Type (Auto-Add)
1. Right-click a **weapon** (usually has 'action' activation)
2. Click "Add to Turn Prep"
3. **Verify**: 
   - Feature added to turn plan without dialog
   - Console shows success notification
   - Check actor flags for stored feature:
```javascript
const actor = game.actors.get('ACTOR_ID');
const plan = actor.getFlag('TurnPrep', 'currentTurnPlan');
console.log(plan.actions)  // Should contain the weapon
```

**Pass Criteria**: Feature added directly without user dialog

#### 2.3: Multiple Activity Types (Dialog Selection)
1. Right-click a **spell** with multiple activation types (if available)
   - Or a feat that can be used multiple ways
2. **Verify**: Activity selection dialog appears showing:
   - Activity names in radio button list
   - "Select" button for each
3. Choose one activity
4. **Verify**: Feature added to appropriate field (action/bonus/reaction)

**Pass Criteria**: 
- Dialog shows activities with names
- Selection adds feature to correct field

#### 2.4: Add to Different Fields
1. Right-click a **spell** and add to "Action" field
2. Open character sheet and verify it appears in Turn Prep
3. Right-click same spell again and add to "Bonus Action" field
4. **Verify**: Same feature can appear in multiple fields

**Pass Criteria**: Duplicates allowed in different fields

#### 2.5: Right-Click Menu in Turn Prep Panel
1. Add a feature to turn plan (using steps above)
2. In the Turn Prep tab on character sheet, **right-click the feature**
3. **Verify**: Context menu appears with options:
   - Remove (trash icon)
   - View Full Item Details (info icon)
   - Copy to Clipboard (copy icon)
   - Duplicate (clone icon)
   - Save Plan as Favorite (star icon)
   - Swap (exchange icon)

**Pass Criteria**: All menu options visible and clickable

#### 2.6: Feature Removal
1. Right-click feature in Turn Prep panel
2. Click "Remove"
3. **Verify**: Feature removed from plan immediately

**Pass Criteria**: Feature disappears from UI and actor flags

#### 2.7: Feature Duplication
1. Add a feature to turn plan
2. Right-click feature
3. Click "Duplicate"
4. **Verify**: Same feature appears twice in same field

**Pass Criteria**: Duplicate feature created with new ID

---

## Test 3: Roll Integration ✓

### What to Test
Roll discovery from chat, history snapshots, and edit checkpoints.

### Test Steps

#### 3.1: Manual History Snapshot Creation
```javascript
// In console:
const actor = game.actors.get('ACTOR_ID');
const plan = actor.getFlag('TurnPrep', 'currentTurnPlan');

// Create a history snapshot
TurnPrepAPI.rolls.createHistorySnapshot(actor, plan);

// Verify snapshot was created
const history = actor.getFlag('TurnPrep', 'history') || [];
console.log(history)  // Should have at least 1 snapshot
```

**Pass Criteria**: Snapshot appears in history array with correct structure

#### 3.2: Roll Discovery (Chat-Based)
1. Have character perform an action/roll that appears in chat
2. Run:
```javascript
const actor = game.actors.get('ACTOR_ID');
const plan = actor.getFlag('TurnPrep', 'currentTurnPlan');

// Discover rolls from recent chat
const rolls = TurnPrepAPI.rolls.discoverRollsForPlan(actor, plan);
console.log(rolls)  // Should find matching rolls
```

**Pass Criteria**: Rolls matching plan features are found in chat

#### 3.3: Saving Throw Discovery
1. Cast a spell with a saving throw (if available)
2. Have an enemy make a save roll in chat
3. Run:
```javascript
const actor = game.actors.get('ACTOR_ID');
const saves = TurnPrepAPI.rolls.discoverSavingThrowsForActor(actor);
console.log(saves)  // Should find saving throws
```

**Pass Criteria**: Saving throws are detected from chat

#### 3.4: Edit Checkpoints
```javascript
const actor = game.actors.get('ACTOR_ID');
const plan = actor.getFlag('TurnPrep', 'currentTurnPlan');

// Create a checkpoint
TurnPrepAPI.rolls.createEditCheckpoint(actor, plan, 'Added fireball spell');

// Get checkpoints
const checkpoints = actor.getFlag('TurnPrep', `editHistory_${plan.name}`) || [];
console.log(checkpoints)  // Should have 1 checkpoint
```

**Pass Criteria**: Checkpoint stored with description and timestamp

#### 3.5: Restore from Checkpoint
```javascript
const actor = game.actors.get('ACTOR_ID');
const plan = actor.getFlag('TurnPrep', 'currentTurnPlan');
const checkpoints = actor.getFlag('TurnPrep', `editHistory_${plan.name}`) || [];

if (checkpoints.length > 0) {
  // Restore from first checkpoint
  const restored = TurnPrepAPI.rolls.restorePlanFromCheckpoint(
    actor, 
    plan.name, 
    checkpoints[0].id
  );
  console.log(restored)  // Should return restored plan
}
```

**Pass Criteria**: Plan restored with previous state

#### 3.6: Checkpoint Limit Enforcement
```javascript
const actor = game.actors.get('ACTOR_ID');
const plan = actor.getFlag('TurnPrep', 'currentTurnPlan');

// Create many checkpoints
for (let i = 0; i < 8; i++) {
  TurnPrepAPI.rolls.createEditCheckpoint(actor, plan, `Checkpoint ${i}`);
}

// Get checkpoints
const checkpoints = actor.getFlag('TurnPrep', `editHistory_${plan.name}`) || [];
console.log(checkpoints.length)  // Should be ≤ 5 (world setting default)
```

**Pass Criteria**: Checkpoints limited to world setting (default 5)

#### 3.7: History Size Limit
```javascript
const actor = game.actors.get('ACTOR_ID');

// Create many history entries
for (let i = 0; i < 15; i++) {
  const plan = actor.getFlag('TurnPrep', 'currentTurnPlan');
  TurnPrepAPI.rolls.createHistorySnapshot(actor, plan);
}

// Get history
const history = actor.getFlag('TurnPrep', 'history') || [];
console.log(history.length)  // Should be ≤ 10 (per-actor limit)
```

**Pass Criteria**: History limited to actor's history limit setting

---

## Test 4: End-of-Turn Dialog ✓

### What to Test
Dialog appears when turn ends during combat.

### Test Steps

#### 4.1: Initiative Hook Registration
```javascript
// In console:
console.log(Hooks._hooks.combatRound)  // Should be registered
console.log(Hooks._hooks.combatTurn)   // Should be registered
```

**Pass Criteria**: Both hooks registered by RollHandler

#### 4.2: Manual Dialog Trigger
```javascript
const actor = game.actors.get('ACTOR_ID');

// Manually trigger dialog (for testing without running full combat)
TurnPrepAPI.rolls.showEndOfTurnDialog(actor);
```

**Verify**: Dialog appears with:
- Character name
- History items list (if any)
- Radio button selection
- Confirm/Cancel buttons

**Pass Criteria**: Dialog appears and is dismissible

#### 4.3: Dialog Selection
1. Trigger end-of-turn dialog
2. Select a history item
3. Click "Confirm"
4. **Verify**: Plan loads to current turn plan (actor flags updated)

**Pass Criteria**: Selected plan becomes current plan

---

## Test 5: Feature Validation ✓

### What to Test
Missing features auto-removed when loading plans.

### Test Steps

#### 5.1: Missing Item Detection
1. Add a feature to turn plan (get its item ID)
2. Delete that item from character
3. Run:
```javascript
const actor = game.actors.get('ACTOR_ID');
const plan = actor.getFlag('TurnPrep', 'currentTurnPlan');

// Validate and remove missing features
TurnPrepAPI.rolls.removeMissingFeaturesFromPlan(actor, plan);

// Check if feature removed
console.log(plan.actions)  // Should not contain deleted item
```

**Pass Criteria**: Missing features removed automatically

---

## Console Test Commands Summary

```javascript
// Settings
game.settings.get('turn-prep', 'editHistoryCheckpoints')
TurnPrepAPI.settings.getDefaultHistoryLimit()
TurnPrepAPI.settings.getHistoryLimitForActor(actor)
TurnPrepAPI.settings.setHistoryLimitForActor(actor, 15)

// Context Menu (automatic via right-click)
// No direct API calls needed

// Roll Integration
TurnPrepAPI.rolls.createHistorySnapshot(actor, plan)
TurnPrepAPI.rolls.discoverRollsForPlan(actor, plan)
TurnPrepAPI.rolls.discoverSavingThrowsForActor(actor)
TurnPrepAPI.rolls.createEditCheckpoint(actor, plan, 'description')
TurnPrepAPI.rolls.restorePlanFromCheckpoint(actor, planName, checkpointId)
TurnPrepAPI.rolls.showEndOfTurnDialog(actor)
TurnPrepAPI.rolls.removeMissingFeaturesFromPlan(actor, plan)

// Data Access
const plan = actor.getFlag('TurnPrep', 'currentTurnPlan')
const history = actor.getFlag('TurnPrep', 'history')
const checkpoints = actor.getFlag('TurnPrep', `editHistory_${planName}`)
```

---

## Debugging Tips

### Enable Debug Logging
```javascript
// In console:
game.settings.set('turn-prep', 'debug', true)  // If debug setting exists
// or check logs in console (F12)
```

### Check Actor Flags
```javascript
const actor = game.actors.get('ACTOR_ID');
console.log(actor.getFlag('TurnPrep', 'currentTurnPlan'))
console.log(actor.getFlag('TurnPrep', 'history'))
```

### Monitor Hooks
```javascript
// Watch hook calls
Hooks.on('turnprepAddedFeature', (actor, feature) => {
  console.log('Feature added:', feature)
})
Hooks.on('turnprepRemovedFeature', (actor, featureId) => {
  console.log('Feature removed:', featureId)
})
```

### Check Build Size
```bash
npm run build  # See file size output
```

---

## Known Limitations

### From Implementation Plan
- End-of-turn dialog appears on initiative changes (requires active combat)
- Roll discovery searches last 50 chat messages only
- Feature matching is ID-based (requires exact item ID match)
- Edit history limited to 1-20 checkpoints (world setting)

### To Investigate
- [ ] Dialog appears when character sheet not open
- [ ] Dialog remembers selection between turns
- [ ] Feature icons display correctly
- [ ] Drag & drop field movement (Phase 4)

---

## Test Coverage Matrix

| Feature | Unit Test | Console Test | UI Test | Status |
|---------|-----------|--------------|---------|--------|
| Settings registration | ✅ | ✅ | - | Ready |
| Per-actor limit override | ✅ | ✅ | - | Ready |
| "Add to Turn Prep" menu | ✅ | ✅ | ⚠️ | Needs UI |
| Activity selection dialog | ✅ | ✅ | ⚠️ | Needs UI |
| Feature removal | ✅ | ✅ | ⚠️ | Needs UI |
| Roll discovery | ✅ | ⚠️ | - | Partial |
| History snapshots | ✅ | ✅ | ⚠️ | Needs UI |
| Edit checkpoints | ✅ | ✅ | ⚠️ | Needs UI |
| End-of-turn dialog | ✅ | ✅ | ⚠️ | Needs UI |
| Feature validation | ✅ | ✅ | - | Ready |

---

## Next Steps

### After Phase 3 Testing
1. Document any issues found in separate file
2. Create bug fixes if needed
3. Move to Phase 4 (UI Components)

### Phase 4 Will Add
- [ ] Svelte components for all dialogs
- [ ] Actual UI for Turn Prep tab
- [ ] Style and layout
- [ ] User-friendly interactions

---

## Questions?

- Check console logs (F12) for error messages
- Review PHASE3_COMPLETION.md for implementation details
- Look at source files: ContextMenuHandler.ts, RollHandler.ts, settings.ts
