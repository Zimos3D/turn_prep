# Phase 3 Quick Test Reference

**Ready to test in Foundry!**  
**Build**: ✅ 94.36 kB  
**Status**: Context menu integration WORKING! ✅  
**Latest Update**: January 20, 2026 - Context menu successfully integrated with Tidy5e

---

## Latest Updates

### Context Menu Integration - WORKING! ✅

**What was fixed:**
1. ✅ Hook registration moved to `ready.ts` - `ContextMenuHandler.registerContextMenus()` now explicitly called
2. ✅ `generateId` imported from `utils/data.ts` instead of non-existent `FoundryAdapter.generateId()`
3. ✅ Activity names shown in selection dialog (e.g., "Attack", "Grapple", "Shove") instead of just "Action"
4. ✅ Reactions now stored in `turnPrepData.reactions[]` instead of `currentTurnPlan.reactions[]`
5. ✅ Edit checkpoints removed for current turn plan (only used for history snapshots)

**Verified working:**
- "Add to Turn Prep" appears in context menus for items with activities
- Items are successfully added to actor flags
- Activity selection dialog shows correct names
- No errors when adding features
- Data persists correctly

---

## Quick Setup

1. Ensure module is built: `npm run build` ✅
2. Load Foundry world with a D&D 5e character
3. Open browser console: **F12**
4. Paste commands below and test

---

## One-Liner Setup

```javascript
// Method 1: Get by full actor ID (most reliable)
// Copy the actor ID from the character sheet (click the copy icon)
// It will look like: Actor.aE6CdkhlEIajXUMc
const actor = game.actors.get('Actor.aE6CdkhlEIajXUMc');  // Replace with your actor ID
console.log(actor?.name)  // Should show character name

// Method 2: Get by name
const actor = game.actors.getName('Frodo');  // Replace with your character name
console.log(actor?.name)

// Method 3: Get first controlled actor (if you have one selected)
const actor = game.user.character;
console.log(actor?.name)

// Verify you have an actor:
if (!actor) {
  console.error('Actor not found! Use one of the methods above.');
} else {
  console.log('Actor found:', actor.name);
}
```

**To find your actor ID:**
1. Open a character sheet
2. Click the icon next to the character name (copy icon)
3. Paste in console - you'll see: `Actor uuid "Actor.aE6CdkhlEIajXUMc" copied to clipboard.`
4. Use that ID: `game.actors.get('Actor.aE6CdkhlEIajXUMc')`

---

## Test 1: Settings (2 min)

```javascript
// Should return 10 (default)
game.settings.get('turn-prep', 'editHistoryCheckpoints')

// Should return default setting
TurnPrepAPI.settings.getDefaultHistoryLimit()

// Should return 10 or override
TurnPrepAPI.settings.getHistoryLimitForActor(actor)

// Set override to 15
await TurnPrepAPI.settings.setHistoryLimitForActor(actor, 15)

// Should return 15 now
TurnPrepAPI.settings.getHistoryLimitForActor(actor)

// Clear override
await TurnPrepAPI.settings.clearHistoryLimitOverride(actor)

// Should return to default
TurnPrepAPI.settings.getHistoryLimitForActor(actor)
```

**Expected Results**:
- ✅ Settings appear in World Settings
- ✅ Per-actor override works without errors
- ✅ Settings persist after refresh
- ✅ All methods return expected values

---

## Test 2: Context Menu (5 min) ✅ VERIFIED WORKING

```javascript
// Manually try:
// 1. Right-click an item in character sheet (weapon, spell, or feature)
// 2. Look for "Add to Turn Prep" option in the "Customize" group
// 3. Click it
// 4. If item has multiple activities, choose from dialog
// 5. Check console for success message

// Verify the data was saved:
const actor = game.actors.getName('Frodo');
const currentPlan = actor.getFlag('turn-prep', 'currentTurnPlan');
console.log('Actions:', currentPlan.actions);
console.log('Bonus Actions:', currentPlan.bonusActions);

// Check reactions (stored separately):
const turnPrepData = actor.getFlag('turn-prep', 'turnPrepData');
console.log('Reactions:', turnPrepData.reactions);
```

**Expected Results**: ✅ ALL VERIFIED
- ✅ Menu item appears on items with activities
- ✅ Features add to turn plan (actions/bonus actions)
- ✅ Reactions stored in separate reactions array
- ✅ Features appear in actor flags with correct structure
- ✅ Activity selection dialog shows activity names (not just "Action")
- ✅ No console errors during addition

---

## Test 3: Roll Integration (5 min)

```javascript
const plan = actor.getFlag('turn-prep', 'currentTurnPlan');

// Create snapshot
const snapshot = await TurnPrepAPI.rolls.createHistorySnapshot(actor, plan)
console.log(snapshot)  // Should have structure with rolls, saves, timestamp

// Discover rolls (assumes you've made some rolls in chat)
const rolls = await TurnPrepAPI.rolls.discoverRollsForPlan(actor, plan)
console.log(rolls)  // Should find recent rolls

// Create checkpoint
await TurnPrepAPI.rolls.createEditCheckpoint(actor, plan, 'Added fireball')

// Get checkpoints
const checkpoints = actor.getFlag('turn-prep', `editHistory_${plan.name}`)
console.log(checkpoints)  // Should have 1+ checkpoints

// Restore from checkpoint (if you have any)
if (checkpoints?.length > 0) {
  const restored = await TurnPrepAPI.rolls.restorePlanFromCheckpoint(
    actor, 
    plan.name, 
    checkpoints[0].id
  )
  console.log(restored)  // Should return restored plan
}

// Show end-of-turn dialog
await TurnPrepAPI.rolls.showEndOfTurnDialog(actor)
// Dialog should appear if history exists
```

**Expected Results**:
- ✅ Snapshots created with correct structure
- ✅ Checkpoints stored and limited by setting
- ✅ Plans can be restored from checkpoints
- ✅ End-of-turn dialog appears

---

## Test 4: Feature Validation (2 min)

```javascript
const plan = actor.getFlag('turn-prep', 'currentTurnPlan');

// Check if features exist
const cleaned = await TurnPrepAPI.rolls.removeMissingFeaturesFromPlan(actor, plan)
console.log(cleaned)  // Should have same or fewer features

// Delete an item and test again
const itemToDelete = actor.items.values().next().value;  // Get first item
await itemToDelete.delete();

// Run again - should remove missing features
const recleaned = await TurnPrepAPI.rolls.removeMissingFeaturesFromPlan(actor, plan)
console.log(recleaned)  // Should have fewer features
```

**Expected Results**:
- ✅ Missing features removed
- ✅ Count decreases when items deleted
- ✅ No errors in console

---

## Debugging Checklist

- [ ] Module is built (check dist/ folder)
- [ ] Module is enabled in Foundry
- [ ] Character has items/spells/features
- [ ] Console open (F12) to see logs
- [ ] Check build output for errors

---

## Console Shortcuts

```javascript
// Quick reference - replace with YOUR actor ID
const ID = 'Actor.aE6CdkhlEIajXUMc';  // <- Change this to your actor ID!
a = game.actors.get(ID)
p = a?.getFlag('turn-prep', 'currentTurnPlan')
h = a?.getFlag('turn-prep', 'history')
c = a?.getFlag('turn-prep', `editHistory_${p?.name}`)

// Check data
if (a) console.log(a.name, 'Plan:', p, 'History:', h, 'Checkpoints:', c)
```

---

## Context Menu Integration Findings

### Key Learnings (January 20, 2026)

1. **Hook Registration**: The `dnd5e.getItemContextOptions` hook works perfectly with Tidy5e, but MUST be registered explicitly from `ready.ts`. Self-registration at the bottom of a file doesn't work reliably.

2. **Menu Item Structure**:
   ```javascript
   {
     name: 'Add to Turn Prep',
     icon: '<i class="fas fa-plus fa-fw"></i>',
     group: 'customize', // Tidy5e group ID
     condition: () => activities.length > 0,
     callback: async (li) => { /* handler */ }
   }
   ```

3. **Activity Names**: Use `activity.name` for dialog labels, not `activation.type` labels. This shows "Attack", "Grapple", "Shove" instead of "Action", "Action", "Action".

4. **Reactions Storage**: Reactions are NOT part of the current turn plan. They're stored in the root `turnPrepData.reactions[]` array because they're persistent across turns.

5. **Edit Checkpoints**: Only create checkpoints for history snapshots, not for current turn plan modifications. The current plan is a working space.

### Files Modified
- `src/hooks/ready.ts` - Added explicit `ContextMenuHandler.registerContextMenus()` call
- `src/features/context-menu/ContextMenuHandler.ts` - Fixed imports, activity labels, reactions storage
- `src/features/roll-integration/RollHandler.ts` - Removed checkpoint creation for current plan

---

## Known Issues

No known issues! Context menu integration is fully functional.

---

## What's Next

Once testing is done:
1. Document any issues found
2. Move to Phase 4 (UI Components in Svelte)
3. Build sheets integration

---

## Files Reference

- **PHASE3_TESTING.md** - Detailed test cases
- **PHASE3_API_FIX.md** - API namespace exposure fixes
- **PHASE3_SETTINGS_FIX.md** - Settings system method fixes
- **PHASE3_COMPLETION.md** - What was implemented
- **src/api/TurnPrepApi.ts** - Public API
- **src/settings/settings.ts** - Settings system
- **src/features/roll-integration/RollHandler.ts** - Roll integration
