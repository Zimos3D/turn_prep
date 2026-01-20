# Context Menu Troubleshooting Guide

**Issue**: "Add to Turn Prep" menu item not appearing in Tidy5e context menus  
**Updated**: January 20, 2026  
**Build**: 81.21 kB

---

## Recent Changes

### What Was Fixed
1. **Enhanced logging** - More detailed console output for each step
2. **Added icon with proper spacing** - Used `fa-fw` class for consistent width
3. **Added condition function** - Ensures menu item only shows when activities exist
4. **Added Tidy5e hook listener** - Now monitors `tidy5e-sheet.actorItemUseContextMenu`
5. **Better error handling** - User-friendly notifications on errors
6. **Actor detection** - Checks both `item.actor` and `item.parent`

### Hook Strategy
The module now listens to **three hooks**:
1. **`dnd5e.getItemContextOptions`** - Primary hook (Tidy5e and D&D5e sheets)
2. **`tidy5e-sheet.actorItemUseContextMenu`** - Tidy5e-specific monitoring hook
3. **`getActorSheetContextMenuItems`** - Fallback for classic Foundry sheets

---

## Step-by-Step Testing

### 1. Verify Module is Loaded

Open Foundry console (F12) and run:
```javascript
game.TurnPrepAPI
```

**Expected**: Should return an object with `settings`, `rolls`, `debug` properties  
**If undefined**: Module failed to load - check Foundry console for errors

---

### 2. Check Hook Registration

Run this in console:
```javascript
game.TurnPrepAPI.debug.listRegisteredHooks()
```

**Expected**: Should see `dnd5e.getItemContextOptions` in the list  
**If missing**: Hook registration failed - check console logs during module init

---

### 3. Detect Hook Firing

Run this command, then right-click an item:
```javascript
game.TurnPrepAPI.debug.detectAllHooks()
```

**Expected**: When you right-click an item, you should see:
```
[Turn Prep Debug] ✓✓✓ HOOK FIRED: dnd5e.getItemContextOptions [Item, Array]
```

**If no hook fires**: Tidy5e might be using a different hook or overriding the context menu system entirely

---

### 4. Check Item Activities

Get an item from your character sheet:
```javascript
// Method 1: By name
const actor = game.actors.getName('YourCharacterName');
const item = actor.items.getName('YourItemName');

// Test activities
game.TurnPrepAPI.debug.testActivitiesForItem(item)
```

**Expected**: Should show activities with activation types like "action", "bonus", etc.  
**If 0 activities**: Item has no action economy - menu item won't appear (this is correct!)

---

### 5. Manual Right-Click Test

1. Open a character sheet (Tidy5e)
2. Open browser console (F12)
3. Right-click any **weapon**, **spell**, or **feature**
4. Watch the console output

**Expected console output**:
```
[TURN-PREP] dnd5e.getItemContextOptions fired for: Longsword | Type: weapon
[TURN-PREP] Processing item: Longsword (type: weapon) on actor: Frodo
[TURN-PREP] Found 1 activities for Longsword
[TURN-PREP] Creating menu item for Longsword with 1 activities
[TURN-PREP] Menu item added successfully. Total menu items: 7
```

**If no output**: Hook not firing - see Scenario A below  
**If "No activities"**: Item doesn't use action economy - expected behavior  
**If menu item added but not visible**: See Scenario B below

---

## Troubleshooting Scenarios

### Scenario A: Hook Not Firing at All

**Symptoms**: No console output when right-clicking items

**Possible Causes**:
1. Tidy5e is using a completely custom context menu system
2. D&D5e system version incompatibility
3. Module load order issue

**Next Steps**:
1. Check Tidy5e version:
   ```javascript
   game.modules.get('tidy5e-sheet').version
   ```
   Ensure it's 12.x or higher

2. Check D&D5e version:
   ```javascript
   game.system.version
   ```
   Ensure it's 5.1.x or 5.2.x

3. Check if Tidy5e API is available:
   ```javascript
   game.modules.get('tidy5e-sheet').api
   ```

4. Look for any console errors during module initialization

---

### Scenario B: Hook Fires, Menu Item Added, But Not Visible

**Symptoms**: Console shows "Menu item added successfully" but nothing appears in menu

**Possible Causes**:
1. Menu item structure doesn't match Tidy5e expectations
2. Group ID is incorrect
3. Condition function returning false

**Next Steps**:
1. Inspect the actual context menu in DevTools (F12 → Elements)
2. Look for the HTML structure - it should match [context_menu.html](src/foundry/context_menu.html)
3. Check if our menu item appears in the DOM but is hidden by CSS
4. Verify the `group: 'customize'` is correct for Tidy5e

**Alternative Fix**: Try changing the group ID:
```javascript
// In ContextMenuHandler.ts, change:
group: 'customize',
// To:
group: 'common',
```

---

### Scenario C: Activities Found But Menu Item Skipped

**Symptoms**: Console shows activities but says "skipping context menu item"

**This is expected behavior!** Items without activities don't need a context menu entry.

**To test with items that have activities**:
- Weapons (almost always have "action" activation)
- Spells (usually have "action" or "bonus" activation)
- Features with activation costs (e.g., "Second Wind", "Action Surge")

**Items that typically don't have activities**:
- Passive features (e.g., "Darkvision")
- Equipment without activation (e.g., "Armor")
- Background features without costs

---

### Scenario D: Permission/Access Issues

**Symptoms**: Context menu appears for GM but not for players

**Check permissions**:
```javascript
const actor = game.actors.getName('CharacterName');
console.log('Is owner:', actor.isOwner);
console.log('Ownership:', actor.ownership);
```

If `isOwner` is false, the player doesn't have permission to modify the character.

---

## Advanced Diagnostics

### Inspect Open Sheet DOM

```javascript
game.TurnPrepAPI.debug.inspectSheetItemDom()
```

This shows all items in open sheets and their DOM attributes.

### Check Integration Status

```javascript
game.TurnPrepAPI.debug.checkIntegration()
```

Shows Tidy5e integration status and available features.

### Enable Full Debug Logging

Before loading the world, set:
```javascript
// In browser console before loading:
window.TURN_PREP_DEBUG = true;
```

Then reload the world. You'll see extensive logging from the module.

---

## Known Limitations

1. **Passive Features**: Items without activities (passive abilities) won't show the menu item - this is by design
2. **Compendium Items**: Items in compendiums (not owned by actors) won't have the menu
3. **Unidentified Items**: Items that aren't identified might not show activities

---

## If Nothing Works

If you've tried all the above and the context menu still doesn't work, it's likely that **Tidy5e uses a completely custom context menu system** that doesn't fire the standard hooks.

### Alternative Approach: Use Tidy5e's Section Commands

According to [TIDY5E_CONTEXT_MENU_RESEARCH.md](TIDY5E_CONTEXT_MENU_RESEARCH.md#L43-L66), Tidy5e has a different API for adding commands to item sections:

```typescript
Hooks.once('tidy5e-sheet.ready', (api) => {
  api.config.actorItem.registerSectionCommands([
    {
      label: 'Add to Turn Prep',
      iconClass: 'fas fa-plus',
      tooltip: 'Add this item to your turn preparation',
      enabled: (params) => {
        // Check if item section has activatable items
        return true;
      },
      execute: (params) => {
        // Add item to turn prep
        console.log('Execute for section:', params.section);
      }
    }
  ]);
});
```

**Difference**: This adds a button to the **item section header/footer**, not individual item context menus.

---

## Reporting Issues

If you find a specific issue, please include:
1. Tidy5e version
2. D&D5e system version
3. Foundry version
4. Console output when right-clicking an item
5. Output from `game.TurnPrepAPI.debug.checkIntegration()`
6. Screenshots of the context menu (if it appears)

---

## References

- [TIDY5E_CONTEXT_MENU_RESEARCH.md](TIDY5E_CONTEXT_MENU_RESEARCH.md) - Full research on Tidy5e's context menu system
- [PHASE3_CONTEXT_MENU_DEBUG.md](PHASE3_CONTEXT_MENU_DEBUG.md) - Original debug guide
- [PHASE3_TESTING.md](PHASE3_TESTING.md) - Full Phase 3 testing guide
