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

Character level for sure.

Yes. When a new history snap shot is added, if the chracter has more than the limit, the oldest ones are deleted, until the max number remain.

---

<span style="color:red">**FOLLOW-UP: History Limit Per-Character**</span>

So each character has their own independent history limit setting? Or do they all share a default limit (configurable in settings), which can be overridden per-character if needed? This affects where we store the setting data.

Answer:

A default global setting overrideable per actor

---

### DM Visibility Setting
- You mentioned wanting an "allow DM view player turn prep" setting
- Should this be a checkbox in World Settings (apply to all players)?
- Or should it be configurable per-actor (on the actor sheet)?
- What should DMs see when viewing a player's turn prep? (read-only, or editable for planning purposes?)
- Your answer:

Given the permissions system of foundry it may not be possible to restrict anything from DM visibility. But I would like if the DM opened a PCs character sheet for that tab to just not be displayed. 

If that's not possible, we can just scrap this feature. No big deal

Having this be per actor is ideal.

---

<span style="color:red">**FOLLOW-UP: Per-Actor DM Visibility Toggle**</span>

So each actor can have a "Hide Turn Prep from DMs" flag? Where should this be stored/toggled - in the actor flags, or as a setting on the actor document itself? Also, if a PC sets this, does it prevent DMs from seeing their turn prep entirely, or just hide the tab from the sheet display but still allow data access?

Answer:

Let's skip this for now.The GM can just see the sheets and that's fine

---

### Module Enable/Disable
- Should Turn Prep be individually enable/disable per-actor?
- Or just a world-level setting to disable the entire tab?
- Your answer:

So it should be available to everyone and on by default. For the Default sheet it can just be on without option. The Tidy 5E sheet has a "Tab Configuration" option. I'd Like for the Turn Prep tab to hook into that. Players can use that menu to toggle its visibility if they don't want to see it.

---

<span style="color:red">**FOLLOW-UP: Tidy 5E Tab Configuration Hook**</span>

When a player toggles Turn Prep off via Tidy's Tab Configuration menu, should we persist that setting somewhere (so it stays off when they reopen the sheet), or does Tidy handle that persistence automatically? Also, what's the API call to register the Turn Prep tab so it appears in that configuration menu?

Answer:

I believe Tidy handles the persistence. Let's deal with that when we come to it, but make a note of testing this functionality when we are at the appropriate point in development for that

---

### Additional Settings to Consider
- Should players be able to disable auto-save and use manual save buttons instead?
- Should there be a setting to auto-load the most recent history entry when opening the sheet?
- Should there be a "compact mode" for smaller screens?
- Your answer:

no to manual saves.
THe history should autoload to its pace int he sidebar, but I don't want to load the most recent into a current turn plan if that's what you mean.

Compact mode is a good idea. Does Tidy5E do that? If so follow their style.

---

<span style="color:red">**FOLLOW-UP: Compact Mode Scope**</span>

When you say "compact mode," which UI elements should be affected? Just the Turn Prep tab itself, or the entire character sheet? Also, how should it trigger - via screen size detection, a user-selectable toggle, or both?

Answer:

I think let's not worry about this for now. Just skip entirely.

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

Your examples are spot on. If it has multiple activation types, the user should get a dialog allowing them to choose. That dialog should reference the activity names in giving the user the choice.

Adding multiple items to an action or bonus action is fine including duplicates for multiacttack.

---

<span style="color:red">**FOLLOW-UP: Activity Selection Dialog**</span>

When showing the dialog for multiple activation types, should each activity be a separate button/option, or a dropdown? Also, if an item has a bonus action AND an action, but the user adds it to the "Action" field, can they later move it to "Bonus Action" via the right-click menu, or do they need to re-add it and choose differently?

Answer:

We should deisplay the names of the activities  and a button marked "select" next to each.

In the turn prep plan we show the parent item/feature/spell anyway. Dragging it to another field should check if that parent item has any activity of the approriate activation cost and add it. If it has more than one activity of the appropriate activation cost, then a dialog to choose between them, same format as above.

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

Yes. all of the above. Species and Background features as well. 

---

<span style="color:red">**FOLLOW-UP: Species & Background Features**</span>

Are "Species" and "Background" features stored as separate item types in D&D 5e, or are they special properties of feat items? Need to confirm which collection/items to scan for these in the ContextMenuHandler.

Answer:
Nope they're just considered features. I think they have a source field associated with them

---

**Suggested options:**
- [ ] Remove from plan
- [ ] Save entire plan as favorite (move to plan level, not item level?)
- [ ] View full item details
- [ ] Swap with another feature (select replacement)
- [ ] Copy feature to clipboard
- [ ] Move to different field (Action ↔ Bonus ↔ Reaction)

- Your answer:

Those all seem like good options. I think yes move save plan only to the overall plan, not item level. Add a duplicate that makes a copy in the same field

---

<span style="color:red">**FOLLOW-UP: Right-Click Context Menu in Turn Prep**</span>

So the right-click menu on features within the Turn Prep panel should have these options:
- Remove
- View Full Item Details
- Swap (with another feature)
- Copy to Clipboard
- Move to Different Field (Action ↔ Bonus ↔ Reaction ↔ Additional)
- Duplicate (copy in same field)
- Save Plan as Favorite

Is this complete? Also, what icons should each of these use? Should "Move to Different Field" be a submenu or a dialog?

Answer:

Let's drop move to different field. That can be done just through drag and drop.

Otherwise complete

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

Primarily this will be done manually. THey will Click send to history on an action plan and then we will behind the scenes look for rolls associated with the features in the action plan. THose will be recorded and saved as part of the history object. 

If no rolls are found, with thsoe actions, the history object gets created withour rolls. 

This should also record saving throws made and by whom against a spell. 

We are going to need to add functionality to edit history items and save those edits. History of past edits would be isdeal. Keeping a maximum numbber of checkpoints. Configurable, default 5. and settings for whether players are allowed to edit their history or not. I'm fine with that being a global setting for now.

It would be cool when clicking end turn on a character with at least one active turn plan to have a dialog pop up asking if they would like to save it to history and clear the plan. I fthere is more than one plan they can  choose which. They can cancel out of the dialog and do it manually later if they want.

---

<span style="color:red">**FOLLOW-UP: "Send to History" Workflow & Roll Discovery**</span>

This is a complex feature. Let me clarify implementation details:

1. **Button Location**: Is "Send to History" a button on the current turn plan card? If multiple turn plans exist, does each have its own "Send to History" button?

2. **Roll Discovery Mechanism**: When "Send to History" is clicked, how should we discover rolls?
   - [ ] Search chat messages for rolls matching feature names/IDs?
   - [ ] Hook into Foundry's roll system during the turn?
   - [ ] Search actor's recent roll history within a time window?

3. **Saving Throw Tracking**: For saving throws against a spell:
   - Track who made save (target name/ID)?
   - Track success/fail?
   - How to identify which spell (by name match in chat)?

4. **Edit History Functionality** (new feature):
   - Create checkpoint in edit history array or version the snapshot?
   - Can users undo/restore previous edits?

5. **End Turn Dialog Trigger**: What triggers the dialog?
   - [ ] Player clicks "End My Turn" button?
   - [ ] Hooks to Foundry's initiative tracker?

6. **Multiple Plans**: If multiple plans exist:
   - Show dropdown to choose which to save?
   - Show checkboxes for multiple?


Answer:

- Each turn plan card has its own send to history button

- We will search throught he chat history using the feature and/or activity id to look for rolls.

- Foundry does put the spell and the Save in the chat. Creatures that roll against it would also have rolls and pass/fail in the chat. We should search for that and add those to the history as well. 

- This is making me realize that details like the rolls made should be accessible but not part of the default view of the history snapshot Perhaps it is expandable to show details. Or a context menu item for hstory items to view details in their own pane. 

- I am curious if actor tags are flexible enough to store snapshots. It would be nice to have the ability to restore old ones.

- End turn trigger would come from the initiative system. We would need to look at Foundry for how it handles encounters and what events happen around advancving the initiative tracker. From that we could check if the actor with the turn that has just ended has an active turn plan. ANd if they do show its owner the dialog asking if they would like to save it to history.

- If multiple plans, Dialog to choose between them. List them with a radio button next to each could be good.

---

<span style="color:orange">**FOLLOW-UP: Edit History Checkpoints & Restoration**</span>

You mentioned wanting to restore old snapshots using actor tags/some storage mechanism. For the edit history feature:

1. **Edit Checkpoint Storage**: Should we:
   - [ ] Store edit checkpoints in actor flags (alongside current snapshot data)?
   - [ ] Store edit checkpoint metadata only (timestamp, what changed), allow user to manually restore by selecting checkpoint?
   - [ ] Create versioned snapshots similar to how favorites work?

2. **Restoration Workflow**: If a user can restore a previous edit checkpoint:
   - Should it create a new checkpoint before restoring (so they can redo the restore)?
   - Should restoring overwrite the current edit, or ask for confirmation first?

3. **Foundry Initiative Hook**: For detecting "end of turn" from the initiative tracker, we'll need to research:
   - What Foundry hooks/events fire when initiative advances
   - How to get the actor that just finished their turn
   - Whether we need to hook to specific combat events

Would you like me to research these Foundry events during Phase 3 implementation?

---



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

Foundry already tracks usages when features are used. Because this should be showing these items/features/spells using tidy5e's built in methods / api or whatever, we don't need to rebuild any of this. We just need to make sure we're displaying it using the methods or whatever of the underlying sheet. Tidy 5e or the Default

We just need functionality to turn current turn plans into history snapshots. 


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

FOundry is already doing this, we don't need to. See previous answer. This is why its important that we are displaying items/featurtes using the sheet's pre-existing layouts/objects so that this is all done for us already.

---

## 4. Feature Display & Styling

### Tidy 5E Theme Integration

**For Phase 3 impact on future UI (Phase 4):**
- The context menu and feature tracking will eventually appear in UI components
- Should we pre-plan how to style these elements to match Tidy 5E?
- Should we use Tidy's CSS variables for colors and spacing?
- Any specific visual feedback we should prepare for?

- Your answer:

Yes. We should be using TIdy 5Es styling and css variables. Every cotext menu item includes an icon. We should make sure that we include those for every context menu entry.

In your response please compile a list of all context menu entries so we can decide on appropriate icons.

---

<span style="color:red">**CONTEXT MENU ICONS COMPILATION**</span>

Based on your answers, here are all the context menu entries we need icons for:

**Context menu on items/spells/features (in character sheets):**
1. Add to Turn Prep → Action
2. Add to Turn Prep → Bonus Action
3. Add to Turn Prep → Reaction
4. Add to Turn Prep → Additional Features

**Context menu within Turn Prep panel (right-click on features):**
1. Remove
2. View Full Item Details
3. Swap (with another feature)
4. Copy to Clipboard
5. Move to Different Field (with submenu: Action, Bonus Action, Reaction, Additional)
6. Duplicate (copy in same field)
7. Save Plan as Favorite

**Questions:**
- Are there any context menu items I'm missing from your answers?
- Which of these can we reuse from Foundry/Tidy's existing icon sets, and which need custom icons?
- What about the "Activity Selection Dialog" (when an item has multiple activation types) - does that need icons for each activity type?

Answer:

They seem to be using fa (Font Awesome) icons. I'll use it's standard names

Can you reference that and come up with suggestions from that library for each of these options please?

We're no longer doing the move to another field option so you can switch that one

A thoguht for actions bonus actions and reactions is to adopt the Baldur's Gate 3 symbols - circle for action. triangle for bonus action, arrows for reaction.

---

**FONT AWESOME ICON SUGGESTIONS**

Here are Font Awesome icon recommendations for all context menu items:

**Context menu on items/spells/features (in character sheets):**
1. **Add to Turn Prep → Action**: `fa-circle` (BG3 circle symbol - represents Action in D&D 5e)
2. **Add to Turn Prep → Bonus Action**: `fa-play` or `fa-caret-right` (triangle/play symbol - represents Bonus Action)
3. **Add to Turn Prep → Reaction**: `fa-exchange-alt` or `fa-arrows-h` (arrows - represents Reaction)
4. **Add to Turn Prep → Additional Features**: `fa-plus-circle` or `fa-star`

**Context menu within Turn Prep panel (right-click on features):**
1. **Remove**: `fa-trash-alt` (garbage bin)
2. **View Full Item Details**: `fa-info-circle` (information icon)
3. **Swap**: `fa-exchange-alt` (swap/exchange arrows)
4. **Copy to Clipboard**: `fa-copy` (duplicate document)
5. **Duplicate**: `fa-files` or `fa-clone` (duplicate/copy)
6. **Save Plan as Favorite**: `fa-star` (star for favorites)

**Activity Selection Dialog** (when item has multiple activation types):
- Each activity row could show the BG3 symbol (circle/triangle/arrows) next to the activity name and "Select" button

---

<span style="color:orange">**FOLLOW-UP: BG3 Symbol Implementation**</span>

For the BG3 symbols (circle for action, triangle for bonus, arrows for reaction), these are distinctive visual elements but may not have perfect Font Awesome equivalents. Should we:
- [ ] Use Font Awesome icons as approximations (fa-circle, fa-play, fa-exchange-alt)?
- [ ] Create custom SVG icons matching the BG3 style exactly?
- [ ] Just use text labels (Action, Bonus Action, Reaction) with Font Awesome icons?

Which approach do you prefer?


Answer:
Font awesome icons as approximations are fine. Use fa-clone for the duplicate option
---

<span style="color:orange">**FOLLOW-UP: History Detail Display**</span>

You mentioned history snapshots could show details via expandable sections or context menu. Which would you prefer?
- [ ] Expandable detail section within the history item itself (click to expand/collapse)?
- [ ] Context menu option ("View Details") that opens rolls in a side pane or modal?
- [ ] Both options available?

Answer:

Let's have it expandable to show rolls and results.
---

### Icons & Visual Indicators

**For marked-used features:**
- Should we use a checkmark icon, a different color, or both?
- Should there be an animation when a feature is marked used?
- How should we visually distinguish "used" vs "unused" vs "limited-use"?

- Your answer:

Once a feature is used from a turn plan we should highlight that action or bonus action and dim (but not disable) actions or bonus actions (whatever the one rolled was) in other plans

THe roll should appear below the associated field. If multiple rolls are made, like with multiattack, each gets its own line.

---

<span style="color:red">**FOLLOW-UP: Visual Feedback & Roll Display**</span>

1. **Highlight & Dim Behavior**: When a feature is rolled/used:
   - Highlight the field (Action/Bonus/Reaction) used in CURRENT plan?
   - Dim same field in OTHER saved plans (favorites/history)?
   - Or only relevant when viewing active turn plan?

2. **Roll Display Location**: "Roll appears below the field" - is this:
   - In the Turn Prep tab (showing rolls as they happen)?
   - Only when viewing history after sending to history?
   - Both?

3. **Roll Format**: How should rolls display?
   - Just result (e.g., "Attack: 18")?
   - Full details (dice, bonuses)?
   - Clickable link to chat message?
   - Raw damage/effect?

4. **Multiple Rolls (Multiattack)**: If 2 sword attacks:
   - Both as separate lines below "Action" field?
   - Each labeled ("Attack 1: 14", "Attack 2: 16")?
   - Different features handled same way?

5. **Timeline**: When do rolls appear?
   - Immediately as rolled (real-time)?
   - Only after clicking "Send to History"?
   - Both?


Answer:

Disregard the dimming and shwing rolls on the turn prep card. We don't need to mess with any of that. We are simplyu searching the chat for rolls associated with the turn prep card that is being sent to history and recording those with history. details above.

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

Auto remove the unavailable feature. Set the field to blank with placeholder text "Missing: [Feature/item name]" or "Missing previously Selected Feature or item" if unknown.

This should not trigger the action or bonus action being used.

---

<span style="color:red">**FOLLOW-UP: Missing Feature Detection**</span>

1. **When should we check for missing features?**
   - Every time the sheet is opened?
   - Continuously in the background?
   - When "Send to History" is clicked?
   - On a timer?

2. **Should we notify the user?**
   - Silently remove and leave placeholder?
   - Show a warning notification ("Feature X was removed because it's no longer available")?
   - Highlight the field with the placeholder?

3. **History Impact**: If a turn plan is sent to history and contains missing features:
   - Store the "Missing" placeholders in the history snapshot?
   - Attempt to resolve them later if the feature is re-added?
   - Just flag them as unresolvable in the history?

4. **Availability Checks**: Which of these should trigger removal?
   - Item was deleted from inventory
   - Spell is no longer prepared
   - Item is unequipped
   - Activation type changed (e.g., spell became ritual-only)
   - All of the above?


Answer:

See what Tidy5E does for this on its sheet tab. I'm guessiing it checks for missing items every time you switch to that tab. We should mimic that behavior here. 

We only need to do this for features/items/spells in the current plans , not in the history.

History and favorite snapshots should store feature names when they are created, disconnected from the object they came from. those get displayed. Only if they are loaded to the current turn should we check if the feature still exists. if it doesn't, remove that item from the field. 

---

### Conflicting Data

If a player modifies turn prep in multiple tabs simultaneously (or offline):
- Should we implement conflict resolution beyond atomic auto-save?
- Or trust that auto-save prevents conflicts?

- Your answer:

Let's just trust in autosave. we can revisit later if needed.

---

## 6. Optional Future Integrations

**Not required for Phase 3, but worth thinking about:**

### Initiative & Turn Order Integration
- Should Turn Prep hook into Foundry's initiative tracker?
- When a character's turn starts, auto-load their Turn Prep plan?
- When they end their turn, auto-save current plan to history?

- Your answer:

I mentioned this earlier. On end of turn a dialog prompt detailed above. But nothing more automatic than that. 

---

### Encounter System Integration
- Should there be special handling for Turn Prep during encounters?
- Should features be auto-marked-unused when encounter starts?
- Should there be pre-turn vs post-turn plan snapshots?

- Your answer:

Nope. See above

---

### Multi-Character Support
- Should GMs be able to prepare turn plans for NPCs?
- Should allied characters share/suggest features?

- Your answer:

GMs typically have the same access to PC sheets as the PCs do. By that logic they'd be able to prep turn plans too.

This would actually be quite helpful for a DM helping a new player by setting up some sample turns as favorites for them

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
