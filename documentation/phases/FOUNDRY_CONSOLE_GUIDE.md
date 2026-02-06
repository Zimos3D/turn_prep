# Foundry VTT Console Cheat Sheet

**For Turn Prep Testing**

---

## Getting Actors

### The Right Way ✅

```javascript
// By full actor ID (MOST RELIABLE)
const actor = game.actors.get('Actor.aE6CdkhlEIajXUMc');

// By character name
const actor = game.actors.getName('Frodo');

// Currently controlled actor
const actor = game.user.character;

// All actors (iteration)
game.actors.forEach(actor => console.log(actor.name));
```

### The Wrong Way ❌

```javascript
// These don't work:
game.actors.characters[0]          // ❌ characters is not an array
game.actors.get('Frodo')           // ❌ .get() needs ID, not name
game.actors.characters['Frodo']    // ❌ characters is not an object
```

---

## Finding Your Actor ID

### Option 1: Copy from Character Sheet
1. Open character sheet
2. Click copy icon next to character name
3. Paste in console
4. You'll see: `Actor uuid "Actor.aE6CdkhlEIajXUMc" copied to clipboard.`
5. Use the ID from the message

### Option 2: List All Actors
```javascript
// See all actors and their IDs:
game.actors.forEach(a => console.log(`${a.name}: ${a.id}`));

// Output will look like:
// Frodo: aE6CdkhlEIajXUMc
// Bilbo: 7xK2mNvQpL9wZxYq
// etc.
```

### Option 3: Get Currently Controlled
```javascript
// If you have an actor selected/controlled:
const actor = game.user.character;
console.log(actor.id);  // Shows the ID
```

---

## Accessing Actor Data

```javascript
const actor = game.actors.get('Actor.aE6CdkhlEIajXUMc');

// Basic info
actor.name            // Character name
actor.id              // Actor ID
actor.type            // 'character' or 'npc'
actor.items           // All items (weapons, spells, features, etc.)

// Check if actor exists:
if (actor) {
  console.log('Actor found:', actor.name);
} else {
  console.error('Actor not found');
}

// Safe access with optional chaining:
actor?.name           // No error if actor is null
actor?.items?.length  // Check item count safely
```

---

## Turn Prep Specific Data

```javascript
const actor = game.actors.get('Actor.aE6CdkhlEIajXUMc');

// Get current turn plan
const plan = actor?.getFlag('turn-prep', 'currentTurnPlan');

// Get history
const history = actor?.getFlag('turn-prep', 'history');

// Get edit checkpoints for a plan
const planName = plan?.name || 'MyPlan';
const checkpoints = actor?.getFlag('turn-prep', `editHistory_${planName}`);

// Check if data exists
if (plan) {
  console.log('Current plan:', plan.name);
  console.log('Actions:', plan.actions?.length || 0);
  console.log('Bonus actions:', plan.bonusActions?.length || 0);
} else {
  console.log('No turn plan found');
}
```

---

## Turn Prep API Commands

```javascript
const actor = game.actors.get('Actor.aE6CdkhlEIajXUMc');

// Settings
TurnPrepAPI.settings.getDefaultHistoryLimit()           // Get default: 10
TurnPrepAPI.settings.getHistoryLimitForActor(actor)     // Get per-actor or default
TurnPrepAPI.settings.getEditHistoryCheckpointLimit()    // Get checkpoint limit: 5
TurnPrepAPI.settings.canPlayersEditHistory()            // Can players edit: true

// Rolls & History
const plan = actor?.getFlag('turn-prep', 'currentTurnPlan');
if (plan) {
  TurnPrepAPI.rolls.createHistorySnapshot(actor, plan)      // Create snapshot
  TurnPrepAPI.rolls.discoverRollsForPlan(actor, plan)       // Find rolls in chat
  TurnPrepAPI.rolls.showEndOfTurnDialog(actor)              // Show dialog
}

// Settings Modification
await TurnPrepAPI.settings.setHistoryLimitForActor(actor, 15)     // Set limit to 15
await TurnPrepAPI.settings.clearHistoryLimitOverride(actor)       // Reset to default
```

---

## Common Patterns

### Safe Pattern (Recommended)
```javascript
const actor = game.actors.get('Actor.aE6CdkhlEIajXUMc');

if (!actor) {
  console.error('Actor not found');
  throw new Error('Invalid actor');
}

// Now you know actor exists
const name = actor.name;  // Safe to use
const plan = actor.getFlag('turn-prep', 'currentTurnPlan');
```

### Quick Check Pattern
```javascript
const actor = game.actors.get('Actor.aE6CdkhlEIajXUMc');
if (actor?.getFlag('turn-prep', 'currentTurnPlan')) {
  console.log('Actor has a turn plan!');
}
```

### Loop Pattern
```javascript
// Test with all actors
game.actors.forEach(actor => {
  const plan = actor.getFlag('turn-prep', 'currentTurnPlan');
  const limit = TurnPrepAPI.settings.getHistoryLimitForActor(actor);
  console.log(`${actor.name}: Plan=${plan?.name || 'none'}, Limit=${limit}`);
});
```

---

## Debugging Tips

```javascript
// See what's in the game object:
console.log(game);  // Explore the entire game object

// Check if Turn Prep API is loaded:
console.log(TurnPrepAPI);  // Should show the API object

// See all actors in the world:
console.log(game.actors);  // Collection of all actors

// Check actor flags:
const actor = game.actors.get('Actor.aE6CdkhlEIajXUMc');
console.log(actor.flags);  // See all flags

// See turn prep specifically:
console.log(actor.flags['turn-prep']);  // All turn prep data
```

---

## Quick Copy-Paste Template

```javascript
// 1. Get actor (change ID to yours)
const actor = game.actors.get('Actor.aE6CdkhlEIajXUMc');
if (!actor) { console.error('Actor not found'); throw new Error('No actor'); }

// 2. Get plan
const plan = actor.getFlag('turn-prep', 'currentTurnPlan');
console.log('Current plan:', plan?.name);

// 3. Test settings
console.log('Default limit:', TurnPrepAPI.settings.getDefaultHistoryLimit());
console.log('Actor limit:', TurnPrepAPI.settings.getHistoryLimitForActor(actor));

// 4. Test setting override
await TurnPrepAPI.settings.setHistoryLimitForActor(actor, 15);
console.log('New limit:', TurnPrepAPI.settings.getHistoryLimitForActor(actor));
```

Just copy and paste, replace the actor ID, and run!
