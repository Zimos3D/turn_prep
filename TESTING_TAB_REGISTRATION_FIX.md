# Tab Registration Fix - Diagnostic Testing

**Issue**: Character sheet tabs "Turn Prep" and "Turns" not appearing in Tidy5e sheet  
**Root Cause**: Hook listener was registered after Tidy5e fired the ready event (timing issue)  
**Fix Applied**: Moved hook registration to module load time (main.ts) instead of ready hook

---

## Before You Start

1. **Reload Foundry**: Hard refresh (Ctrl+Shift+R) to ensure new code is loaded
2. **Check Console**: F12 to open browser console - you should see Turn Prep logs
3. **Have a Character**: Open any character sheet in Tidy5e

---

## Step 1: Verify Hook Registration at Module Load

**Console Check**:
```javascript
// Run in browser console
Hooks.on('ready', () => {
  console.log('✓ Checking if Tidy5e hooks were registered...');
});
```

**Expected Console Output (during module load, before ready hook)**:
```
[turn-prep] Tidy5e Sheet not active - Turn Prep tabs will not be registered
// OR
[turn-prep] Tidy5e hook listener registered - waiting for tidy5e-sheet.ready
```

**If you see the first one**: Tidy5e is not active (check installed modules)  
**If you see the second one**: ✓ Hook listener is registered correctly

---

## Step 2: Check if Tidy5e.ready Hook Fires

**When to check**: Open a character sheet AFTER the module has loaded

**Expected Console Output**:
```
[turn-prep] ✓ Registered main Turn Prep tab (ID: turn-prep-main)
[turn-prep] ✓ Registered sidebar Turns tab (ID: turn-prep-sidebar-turns)
[turn-prep] Tidy5e tabs registered successfully
```

**If you see these messages**: ✓ Tabs were registered with Tidy5e!  
**If you DON'T see these messages**: The hook didn't fire or there was an error

---

## Step 3: Visual Verification - Look for New Tabs

1. **Open any character sheet** in Tidy5e
2. **Look at the main tab bar** (where "Actions", "Spellcasting", etc. are)
3. **You should see a new tab labeled "Turn Prep"** (or localized version)
4. **Click the "Turn Prep" tab** - you should see a placeholder
5. **Look at the sidebar** - there should be a "Turns" tab next to "Notes" etc.

**If tabs appear**: ✓ SUCCESS! Tab registration is working

---

## Step 4: If Tabs Don't Appear

### Troubleshooting Steps

**A. Check Tidy5e is Active**:
```javascript
game.modules.get('tidy5e-sheet')?.active
```
Expected: `true`  
If `false` or `undefined`: Tidy5e is not properly installed/enabled

**B. Check for Console Errors**:
Look for red error messages in console during module load and when opening sheet  
Share any error messages

**C. Verify API Registration**:
```javascript
game.modules.get('tidy5e-sheet')?.api
```
Expected: Should return an object with `registerCharacterTab`, `registerCharacterSidebarTab` methods

**D. Check for Tab ID Conflicts**:
```javascript
// These should return empty/undefined if our tabs aren't registered yet
game.modules.get('tidy5e-sheet')?.api?.models?.SvelteTab
```

---

## Step 5: Test DM Questions Panel (if tabs appear)

1. Click the "Turn Prep" tab
2. You should see a **placeholder message** saying "Turn Prep Tab Placeholder"
3. This will be replaced with the DM Questions panel in the next test cycle

---

## Success Criteria

**Tab Registration is working if**:
- ✓ "Turn Prep" tab appears in main sheet tab bar
- ✓ "Turns" tab appears in sidebar
- ✓ Console shows "Registered main Turn Prep tab" and "Registered sidebar Turns tab" messages
- ✓ No red error messages in console
- ✓ Clicking the tab shows placeholder (not errors)

**Next Steps if Successful**:
- Test DM Questions panel functionality
- Verify question add/remove/save operations
- Proceed with Session 2 (Turn Plans Panel)

---

## Technical Details

### What Changed

**Before (Broken)**:
```typescript
// In ready.ts (from ready hook)
await setupTidyIntegration();

// In tidy-sheet-integration.ts
export async function initializeTidy5eSheets() {
  Hooks.once('tidy5e-sheet.ready', async (api) => {
    // Register tabs here
  });
}
```

**Problem**: The hook listener was registered INSIDE the ready hook, but Tidy5e fires its ready hook BEFORE our ready hook runs.

**After (Fixed)**:
```typescript
// In main.ts (at module load time)
registerTidy5eHooks();

// In tidy-sheet-integration.ts
export function registerTidy5eHooks(): void {
  Hooks.on('tidy5e-sheet.ready', (api) => {
    // Register tabs here
  });
}
```

**Solution**: Hook listener is registered at module load time (in main.ts), so it catches the tidy5e-sheet.ready event whenever it fires.

---

## Console Commands to Verify

Run these in the browser console to verify registration:

```javascript
// 1. Check if Tidy5e module is active
game.modules.get('tidy5e-sheet')?.active

// 2. Check if our tabs are in the API
// (This will show if registration was successful)
game.TurnPrepAPI

// 3. Force re-check of module status
game.system?.id

// 4. Look for any error messages
console.log('Check console above for [turn-prep] messages')
```

---

## If All Else Fails

1. Check if module is enabled in world settings
2. Check browser console for JavaScript errors
3. Try disabling and re-enabling the Turn Prep module
4. Clear browser cache (Ctrl+Shift+Delete)
5. Hard refresh Foundry (Ctrl+Shift+R)

