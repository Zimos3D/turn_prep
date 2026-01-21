# Phase 3: Context Menu Debug Guide

This guide helps debug why the "Add to Turn Prep" context menu item might not be appearing.

## Improvements Made

The `ContextMenuHandler.ts` has been updated with:

1. **Dual Hook Registration**: Now listens to both standard Foundry hook and Tidy5e hook
   - `getActorSheetContextMenuItems` - Standard Foundry hook
   - `tidy5e.getSheetContextMenuItems` - Tidy5e specific hook

2. **Enhanced Logging**: Added debug logging at key points to trace execution:
   - When hooks fire
   - When item elements are found/not found
   - When items and activities are retrieved
   - When menu items are added

3. **Better Sheet Lookup**: Improved method to find the sheet in hook context
   - Method 1: Iterate through ui.windows looking for matching item
   - Method 2: Try to find sheet via jQuery closest() and data-app

4. **API Exposure**: The API is now exposed to global scope:
   - Accessible as `game.TurnPrepAPI` in console
   - Accessible as `window.TurnPrepAPI` in browser console

## Testing the Fix

### Step 1: Verify API is Exposed
In the browser console, run:
```javascript
game.TurnPrepAPI
```
You should see the API object. If you get `undefined`, the module might not be fully loaded yet.

### Step 2: Run Integration Check
```javascript
game.TurnPrepAPI.debug.checkIntegration()
```
**Expected output**:
```
[Turn Prep Debug] Module Integration Status:
Tidy 5E integrated: true
MidiQOL available: false
Module version: 1.0.0
Available features: ['dmQuestions', 'turnPlans', 'reactions', 'history', 'favorites', 'contextMenu']
```

### Step 3: Inspect Sheet DOM
```javascript
game.TurnPrepAPI.debug.inspectSheetItemDom()
```
**Expected output**: Lists all open sheets and items with `[data-item-id]` attributes.
**If 0 items found**: Tidy5e might use different selectors.

### Step 4: Test Activities Detection
```javascript
// Get an actor from the current sheet
const sheet = Object.values(ui.windows)[0];
const actor = sheet.object;
const item = actor.items.values().next().value; // First item

// Test activities
game.TurnPrepAPI.debug.testActivitiesForItem(item)
```
**Expected output**: Number of activities found for the item.
**If 0**: No menu item will appear for that item type.

### Step 5: Test Context Menu Logic
```javascript
// Get actor and item
const sheet = Object.values(ui.windows)[0];
const actor = sheet.object;
const item = actor.items.values().next().value; // First item

// Simulate context menu
game.TurnPrepAPI.debug.testContextMenuForItem(actor, item)
```
**Expected output**: "Context menu item would be added" or explanation of why it wouldn't be.

### Step 6: Right-Click an Item and Check Console
1. Open browser console (F12)
2. Right-click an item in the character sheet
3. Look for debug messages like:
   ```
   [Turn Prep Debug] getActorSheetContextMenuItems hook fired
   [Turn Prep Debug] Found item element with ID: [itemId]
   [Turn Prep Debug] Found item: [itemName] on actor: [actorName]
   [Turn Prep Debug] Found X activities for [itemName]
   [Turn Prep Info] Added "Add to Turn Prep" menu item for [itemName]
   ```

## Troubleshooting by Console Output

### Scenario 1: No debug output when right-clicking
- **Problem**: Hooks not firing
- **Solution**: The Tidy5e sheets may use a completely different context menu system
- **Next Step**: Check if Tidy5e has its own context menu API

### Scenario 2: Hook fired but "No item element found"
- **Problem**: Element selector `[data-item-id]` not matching Tidy5e DOM structure
- **Solution**: Need to inspect Tidy5e's actual HTML structure for items
- **Next Step**: Right-click an item and inspect with DevTools (F12 → Elements), look for data attributes

### Scenario 3: Hook fired, item found, but "No activities found"
- **Problem**: `FeatureSelector.getActivitiesForItem()` returning empty array
- **Solution**: Check if item type/structure compatible with activity detection
- **Next Step**: Test with different item types (weapons vs spells)

### Scenario 4: All debug logs successful but no menu item visible
- **Problem**: Menu item added to array but not rendering
- **Solution**: Might need different menu item structure for Tidy5e
- **Next Step**: Check Tidy5e documentation for menu item format
