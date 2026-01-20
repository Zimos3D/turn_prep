# Phase 3 Clarification Questions - Features Layer

Phase 3 focuses on implementing the features layer: settings system, context menu integration, and roll tracking. These clarifications guide implementation decisions for this phase.

---

## Background: Phase 2 Discoveries

Before answering these questions, note the critical discovery from Phase 2:

**D&D 5e Uses Activities System:**
- Items store features in `item.system.activities` Collection
- Each activity has `activation.type` ('action', 'bonus', 'reaction', etc.)
- Items can have multiple activities with different activation types
- All item types (weapons, spells, feats, class features) use this system

This affects Phase 3 because context menu handlers need to examine activities to determine where to add a feature.

---

## 1. Settings System (settings.ts)

### History Limit Configuration
- Should the history limit be world-level or character-level?
- Current default is 10 entries - should this be configurable?
- If a player exceeds the limit, should oldest entries auto-delete or should we warn them?
- Your answer:

---

### DM Visibility Setting
- You mentioned wanting an "allow DM view player turn prep" setting
- Should this be a checkbox in World Settings (apply to all players)?
- Or should it be configurable per-actor (on the actor sheet)?
- What should DMs see when viewing a player's turn prep? (read-only, or editable for planning purposes?)
- Your answer:

---

### Module Enable/Disable
- Should Turn Prep be individually enable/disable per-actor?
- Or just a world-level setting to disable the entire tab?
- Your answer:

---

### Additional Settings to Consider
- Should players be able to disable auto-save and use manual save buttons instead?
- Should there be a setting to auto-load the most recent history entry when opening the sheet?
- Should there be a "compact mode" for smaller screens?
- Your answer:

---

## 2. Context Menu Integration (ContextMenuHandler.ts)

### Right-Click "Add to Turn Prep" Behavior

**Routing Logic:**
When user right-clicks an item/spell/feature and selects "Add to Turn Prep", we need to determine which field it goes to (Action, Bonus Action, Reaction, or Additional Features).

**Questions:**
- Should the system auto-detect the primary activation type and add it to that field?
  - Example: If item has only 'action' activity → auto-add to Action field
  - Example: If item has both 'action' and 'bonus' activities → show selection dialog
  - Example: If item has no activation type → add to Additional Features

- If an item has multiple activation type activities, should we:
  - [ ] Show a dialog asking which activation to use?
  - [ ] Add it to the field that matches the first activity?
  - [ ] Add it to all matching fields?
  - [ ] Let user choose during selection?

- Can the same item be added multiple times to the same field?
  - (E.g., can "Sword" be added twice to the Action field for two sword attacks?)

- Your answer:

---

### Context Menu Placement

**Where should "Add to Turn Prep" appear?**
- Inventory items? (weapons, equipment, loot)
- Spells/abilities tab?
- Features tab?
- Class features area?
- All of the above?

**Should it appear:**
- On the item itself (like "Use Item" button)?
- As a context menu option (right-click)?
- Both?

- Your answer:

---

### Context Menu Items Within Turn Prep

When a player right-clicks a feature/item **within the Turn Prep panel itself**, what options should appear?

**Suggested options:**
- [ ] Remove from plan
- [ ] Save entire plan as favorite (move to plan level, not item level?)
- [ ] View full item details
- [ ] Swap with another feature (select replacement)
- [ ] Copy feature to clipboard
- [ ] Move to different field (Action ↔ Bonus ↔ Reaction)

- Your answer:

---

## 3. Roll Integration (RollHandler.ts)

### What Should Be Tracked?

When a player rolls using a feature from Turn Prep, what information should we capture?

**Suggested data:**
- [ ] Which feature was rolled
- [ ] When it was rolled (timestamp)
- [ ] The result (success/fail, damage, etc.)
- [ ] Which character rolled it (in case of multi-character GM view)
- [ ] The number of times it was used (for limited-use features)

- Your answer:

---

### Where Should Tracking Happen?

**Option 1: Automatic Tracking**
- Hook into Foundry's roll system and track rolls automatically
- If a spell/ability/weapon from Turn Prep was rolled, mark it as used
- Requires logic to match rolled items to Turn Prep features

**Option 2: Manual Marking**
- Add a "Mark as Used" button next to each feature in Turn Prep
- User clicks it after rolling to log the usage
- Simpler but requires user action

**Option 3: Integration with Turn Prep Button**
- Add a "Roll & Mark Used" button to features
- Clicking it rolls the feature and marks it used in one action

**Which approach appeals to you, or should we combine them?**
- Your answer:

---

### What Happens When Features Are "Used"?

When a feature is marked as used/rolled, how should the UI respond?

**Suggested behaviors:**
- [ ] Visual fade/strikethrough effect
- [ ] Move to "Already Used" section (if applicable)
- [ ] Track in turn history for later reference
- [ ] Show "X uses remaining" if limited-use feature
- [ ] Add to a "Used Actions" summary at turn end
- [ ] Reset when turn ends or new turn starts

- Your answer:

---

### Limited-Use Features

For features with limited uses (spell slots, action surge, breath weapon, etc.):

**Should we:**
- Track remaining uses and warn when depleted?
- Auto-decrement uses when the feature is rolled/marked used?
- Allow manual adjustment of remaining uses?
- Sync with the character sheet's actual uses/slots?
- Show a "refresh" button when turn ends (for per-turn abilities)?

- Your answer:

---

## 4. Feature Display & Styling

### Tidy 5E Theme Integration

**For Phase 3 impact on future UI (Phase 4):**
- The context menu and feature tracking will eventually appear in UI components
- Should we pre-plan how to style these elements to match Tidy 5E?
- Should we use Tidy's CSS variables for colors and spacing?
- Any specific visual feedback we should prepare for?

- Your answer:

---

### Icons & Visual Indicators

**For marked-used features:**
- Should we use a checkmark icon, a different color, or both?
- Should there be an animation when a feature is marked used?
- How should we visually distinguish "used" vs "unused" vs "limited-use"?

- Your answer:

---

## 5. Error Handling & Edge Cases

### Missing Features in Turn Prep

What should happen if:
- A featured item was deleted from the actor's inventory after being added to the turn plan?
- A feature's activation type changed (spell became ritual-only)?
- A feature becomes unavailable (spell no longer prepared, item unequipped)?

**Should we:**
- [ ] Show a warning but allow the feature to stay?
- [ ] Auto-remove unavailable features?
- [ ] Let user decide what to do?
- [ ] Mark as "unavailable" but allow re-enabling?

- Your answer:

---

### Conflicting Data

If a player modifies turn prep in multiple tabs simultaneously (or offline):
- Should we implement conflict resolution beyond atomic auto-save?
- Or trust that auto-save prevents conflicts?

- Your answer:

---

## 6. Optional Future Integrations

**Not required for Phase 3, but worth thinking about:**

### Initiative & Turn Order Integration
- Should Turn Prep hook into Foundry's initiative tracker?
- When a character's turn starts, auto-load their Turn Prep plan?
- When they end their turn, auto-save current plan to history?

- Your answer:

---

### Encounter System Integration
- Should there be special handling for Turn Prep during encounters?
- Should features be auto-marked-unused when encounter starts?
- Should there be pre-turn vs post-turn plan snapshots?

- Your answer:

---

### Multi-Character Support
- Should GMs be able to prepare turn plans for NPCs?
- Should allied characters share/suggest features?

- Your answer:

---

## Summary: What We Need From You

Please answer the questions that are relevant to Phase 3. You can skip optional future integrations if you want to focus on the core phase.

**Critical for Phase 3:**
1. Settings system scope (world-level? character-level? both?)
2. Context menu auto-routing logic (how to detect where to add features)
3. Roll tracking approach (automatic vs manual?)
4. Visual feedback for used features

**Nice to Have:**
- Additional settings (manual save, compact mode, etc.)
- Visual styling preferences
- Edge case handling details

Once you answer these, we'll create a **PHASE3_IMPLEMENTATION_PLAN.md** with concrete implementation details, then begin building the Features layer!
