# Phase 3 API Namespace Exposure Fix

**Date**: January 19, 2026  
**Status**: ✅ RESOLVED  
**Build**: Clean (74.09 kB)

---

## Problem

When testing Phase 3 functionality in Foundry console, the following error occurred:

```javascript
TurnPrepAPI.settings.getDefaultHistoryLimit()
// Uncaught TypeError: Cannot read properties of undefined (reading 'getDefaultHistoryLimit')
```

The global `TurnPrepAPI` object was exposed, but it lacked the `settings` and `rolls` namespaces that contain Phase 3 methods.

---

## Root Cause

The `TurnPrepApi` class in `src/api/TurnPrepApi.ts` had many Phase 2 methods but:
- No `settings` property to expose settings functions
- No `rolls` property to expose roll handler functions
- Did not import the modules that provide these functions

---

## Solution Applied

### 1. Added Imports to TurnPrepApi.ts

```typescript
import { RollHandler } from '../features/roll-integration/RollHandler';
import * as SettingsModule from '../settings/settings';
```

### 2. Added Namespaces to TurnPrepApi Class

```typescript
export class TurnPrepApi {
  // Settings namespace for accessing configuration
  settings = {
    getDefaultHistoryLimit: () => SettingsModule.getDefaultHistoryLimit(),
    getHistoryLimitForActor: (actor: Actor) => SettingsModule.getHistoryLimitForActor(actor),
    setHistoryLimitForActor: (actor: Actor, limit: number) => 
      SettingsModule.setHistoryLimitForActor(actor, limit),
    clearHistoryLimitOverride: (actor: Actor) => 
      SettingsModule.clearHistoryLimitOverride(actor),
    getEditHistoryCheckpointLimit: () => 
      SettingsModule.getEditHistoryCheckpointLimit(),
    canPlayersEditHistory: () => SettingsModule.canPlayersEditHistory(),
    isTurnPrepTabEnabled: () => SettingsModule.isTurnPrepTabEnabled(),
    isEditHistoryEnabledForActor: (actor: Actor) => 
      SettingsModule.isEditHistoryEnabledForActor(actor),
  };

  // Roll integration namespace for managing history and rolls
  rolls = {
    createHistorySnapshot: (actor: Actor, plan: TurnPlan) => 
      RollHandler.createHistorySnapshot(actor, plan),
    discoverRollsForPlan: (actor: Actor, plan: TurnPlan) => 
      RollHandler.discoverRollsForPlan(actor, plan),
    discoverSavingThrowsForActor: (actor: Actor) => 
      RollHandler.discoverSavingThrowsForActor(actor),
    createEditCheckpoint: (actor: Actor, plan: TurnPlan, description: string) => 
      RollHandler.createEditCheckpoint(actor, plan, description),
    restorePlanFromCheckpoint: (actor: Actor, planName: string, checkpointId: string) => 
      RollHandler.restorePlanFromCheckpoint(actor, planName, checkpointId),
    removeMissingFeaturesFromPlan: (actor: Actor, plan: TurnPlan) => 
      RollHandler.removeMissingFeaturesFromPlan(actor, plan),
    showEndOfTurnDialog: (actor: Actor) => 
      RollHandler.showEndOfTurnDialog(actor),
  };
}
```

### 3. Fixed RollHandler Imports

Changed:
```typescript
import { TURN_PREP_CONSTANTS } from '../../constants';
// Usage: TURN_PREP_CONSTANTS.MODULE_NAME
```

To:
```typescript
import { FLAG_SCOPE } from '../../constants';
// Usage: FLAG_SCOPE (which equals 'turn-prep')
```

Replaced all 10 occurrences of `TURN_PREP_CONSTANTS.MODULE_NAME` with `FLAG_SCOPE`.

Made `showEndOfTurnDialog()` public (was private) so it can be called from the API.

---

## Files Modified

1. **src/api/TurnPrepApi.ts**
   - Added imports for RollHandler and SettingsModule
   - Added settings namespace with 8 methods
   - Added rolls namespace with 7 methods

2. **src/features/roll-integration/RollHandler.ts**
   - Changed import from `TURN_PREP_CONSTANTS` to `FLAG_SCOPE`
   - Replaced 10 usages of `TURN_PREP_CONSTANTS.MODULE_NAME` with `FLAG_SCOPE`
   - Changed `showEndOfTurnDialog()` from private to public

---

## Testing the Fix

In Foundry console (F12):

```javascript
// Get actor reference
const actor = game.actors.get('ActorName');

// Settings namespace now works
TurnPrepAPI.settings.getDefaultHistoryLimit()              // Returns number
TurnPrepAPI.settings.getHistoryLimitForActor(actor)        // Returns number
TurnPrepAPI.settings.canPlayersEditHistory()               // Returns boolean
TurnPrepAPI.settings.isTurnPrepTabEnabled()                // Returns boolean

// Rolls namespace now works
const plan = actor.getFlag('turn-prep', 'currentTurnPlan');
await TurnPrepAPI.rolls.createHistorySnapshot(actor, plan) // Creates snapshot
TurnPrepAPI.rolls.discoverRollsForPlan(actor, plan)        // Returns rolls array
TurnPrepAPI.rolls.showEndOfTurnDialog(actor)               // Shows dialog
```

---

## Build Status

```
✓ 35 modules transformed.
../dist/turn-prep.js  74.09 kB │ gzip: 15.80 kB
✓ built in 927ms
```

**Zero TypeScript Errors**  
**Zero Build Warnings**  

---

## Impact

✅ All Phase 3 settings methods now accessible from console  
✅ All Phase 3 roll handler methods now accessible from console  
✅ Settings testing can proceed as documented in PHASE3_TESTING.md  
✅ Roll integration testing can proceed as documented  
✅ API is now complete for Phase 3  

---

## Next Steps

1. Continue with PHASE3_TESTING.md test cases
2. Test context menu integration
3. Test roll discovery
4. Test edit checkpoints
5. Move to Phase 4 UI components when testing is complete
