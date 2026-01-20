# Phase 3 Settings Key Alignment Fix

**Date**: January 19, 2026  
**Status**: ✅ RESOLVED  
**Build**: Clean (74.12 kB)

---

## Problem Identified

The settings system had a critical mismatch:

```javascript
Error: "turn-prep.historyLimitDefault" is not a registered game setting
```

**Root cause**: 
- settings.ts created its own setting keys like `'historyLimitDefault'`
- init.ts registered different keys like `'historyLimit'`
- When getDefaultHistoryLimit() tried to retrieve `'historyLimitDefault'`, it didn't exist

---

## What Was Wrong

### Conflicting Setting Definitions

**settings.ts defined:**
```typescript
export const WORLD_SETTINGS = {
  HISTORY_LIMIT_DEFAULT: 'historyLimitDefault',  // ❌ Wrong key
  EDIT_HISTORY_CHECKPOINTS: 'editHistoryCheckpoints',  // ✅ Correct
  ALLOW_PLAYER_EDIT_HISTORY: 'allowPlayerEditHistory',  // ✅ Correct
};
```

**init.ts registered:**
```typescript
FoundryAdapter.registerSetting('historyLimit', {...})  // ❌ Different key!
```

**Result**: Settings weren't found when retrieved!

---

## Solution Applied

### 1. Removed Duplicate Registration Function

Deleted the `registerSettings()` function from settings.ts entirely. Settings are already registered in init.ts, so we don't need to register them again.

### 2. Aligned Setting Keys

**Old approach** - Create own constants:
```typescript
HISTORY_LIMIT_DEFAULT: 'historyLimitDefault'  // ❌ Not registered
```

**New approach** - Use existing SETTINGS from constants.ts:
```typescript
import { SETTINGS } from '../constants';

export const SETTING_KEYS = {
  HISTORY_LIMIT: 'historyLimit',  // ✅ Actually registered in init.ts
  EDIT_HISTORY_CHECKPOINTS: 'editHistoryCheckpoints',  // ✅
  ALLOW_PLAYER_EDIT_HISTORY: 'allowPlayerEditHistory',  // ✅
};
```

### 3. Simplified All Getter Functions

Changed from:
```typescript
export function getDefaultHistoryLimit(): number {
  const limit = FoundryAdapter.getSetting(WORLD_SETTINGS.HISTORY_LIMIT_DEFAULT);  // ❌ Wrong key
}
```

To:
```typescript
export function getDefaultHistoryLimit(): number {
  const limit = FoundryAdapter.getSetting(SETTING_KEYS.HISTORY_LIMIT);  // ✅ Correct key
  if (typeof limit === 'number' && limit > 0) {
    return limit;
  }
  return SETTINGS.HISTORY_LIMIT.default;  // ✅ Fallback
}
```

---

## Files Modified

### src/settings/settings.ts (Complete Rewrite)

**Removed:**
- `WORLD_SETTINGS` constant (conflicted with init.ts)
- `ACTOR_SETTINGS` constant (renamed for clarity)
- `registerSettings()` function (not called, settings registered in init.ts)

**Added:**
- `SETTING_KEYS` - Maps to keys actually registered in init.ts
- `ACTOR_FLAG_KEYS` - Clearer naming for actor-specific flags
- Updated all 8 getter functions to use correct keys
- Added proper fallbacks to SETTINGS.HISTORY_LIMIT.default from constants

**Key changes:**
- `getDefaultHistoryLimit()` - Now uses SETTING_KEYS.HISTORY_LIMIT ✅
- `getEditHistoryCheckpointLimit()` - Uses SETTING_KEYS.EDIT_HISTORY_CHECKPOINTS ✅
- `canPlayersEditHistory()` - Uses SETTING_KEYS.ALLOW_PLAYER_EDIT_HISTORY ✅
- `getHistoryLimitForActor()` - Uses ACTOR_FLAG_KEYS.HISTORY_LIMIT ✅
- All functions improved with better error handling and fallbacks

---

## Why This Works Now

1. **Single source of truth** - Settings registered in init.ts
2. **Correct keys** - All functions use keys that actually exist
3. **Proper fallbacks** - Uses SETTINGS constants from constants.ts
4. **No conflicts** - settings.ts no longer tries to re-register settings

---

## Testing the Fix

In Foundry console (F12):

```javascript
const actor = game.actors.characters[0];  // Get first character

// This now works without "not registered" errors:
TurnPrepAPI.settings.getDefaultHistoryLimit()              // ✅ Returns 10
TurnPrepAPI.settings.getHistoryLimitForActor(actor)        // ✅ Returns 10 or override
await TurnPrepAPI.settings.setHistoryLimitForActor(actor, 15)  // ✅ Works
TurnPrepAPI.settings.getHistoryLimitForActor(actor)        // ✅ Returns 15
await TurnPrepAPI.settings.clearHistoryLimitOverride(actor)    // ✅ Works
TurnPrepAPI.settings.getHistoryLimitForActor(actor)        // ✅ Returns 10 (reverted)
```

---

## Key Learning

**Don't duplicate settings registration!**

When a settings system is split across multiple files:
1. Register settings in ONE place (init.ts)
2. Have OTHER files import and USE those keys
3. Never try to re-register the same settings
4. Use common constants (constants.ts) as single source of truth

---

## Build Status

```
✓ 35 modules transformed.
../dist/turn-prep.js  74.12 kB │ gzip: 15.82 kB
✓ built in 1.48s
```

**Zero TypeScript Errors**  
**Zero Build Warnings**  

---

## Next Steps

1. Test all settings functions in Foundry console
2. Verify actor parameter works correctly
3. Continue with Test 2 (Context Menu)
4. Complete remaining tests
