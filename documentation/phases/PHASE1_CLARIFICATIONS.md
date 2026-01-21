# Phase 1 Clarification Questions

Answer these questions to guide the implementation of the foundation layer. Take your time and provide as much detail as needed.

---

## 1. Type System & Data Structure

### DM Questions
- Should DM Questions have an `id` field for referencing them elsewhere?
- Do they need timestamps (created/modified dates)?
- Any metadata beyond text content (tags, categories, priority)?
- Your answer:

 While it's not something I'm actiively worried about right now, I could see wanting to put togerher a dm facing aggregation of the DM questions in a panel available to the DM. 
 
 Let's include tag data that could be referenced by such a panel to access these questions. Let'salso keep track of created time, for sorting if nothing else. I don't think the timestamp needs to be visible at all right now. Category tags are a good idea too. 
 
 An idea for the future is to be able to have a category for safety issues at the table if the game gets into triggering subject matter.

---

### Turn Plans
- Beyond the core fields (id, action, bonusAction, movement, trigger, roleplay), what metadata should we store?
- Should turn plans have timestamps (created, modified, lastUsed)?
- Do we need tags/categories for organization?
- Should there be a "notes" or "context" field?
- Your answer:

 A field to name the plan would be good. This will be especially helpful for stored favorites
 
 We don't need to see a timestamp on the active turn plan. When they are added to the history panel they should be sorted by created time, but I don't know that we need to see it there either.

 tags and categories are a great idea. Being able to separate out attack turns from healing turns from control turns could be a great way to sort stored turns. Let's include that as an optional field and have favorite stored turns auto-group by category tags. 

 The trigger field can serve as the notes / context field.



---

### Reactions
- What metadata defines a reaction in your system?
- Just trigger text and response text, or more?
- Should reactions link to specific features/items, or are they generic?
- Do they need priority/ordering when multiple could apply?
- Your answer:

Features have an activation section. Within that there is an activation time panel and then and activation cost menu. Action, Bonus Action, and Reaction are among the options for that. 
I pulled this from the console of the selection of action cost in case it's helpful:
    <optgroup label="Standard"><option value="action" selected="">Action</option><option value="bonus">Bonus Action</option><option value="reaction">Reaction</option></optgroup><optgroup label="Time"><option value="minute">Minute</option><option value="hour">Hour</option><option value="day">Day</option></optgroup><optgroup label="Rest"><option value="longRest">End of a Long Rest</option><option value="shortRest">End of a Short Rest</option></optgroup><optgroup label="Combat"><option value="encounter">Start of Encounter</option><option value="turnStart">Start of Turn</option><option value="turnEnd">End of Turn</option></optgroup><optgroup label="Monster"><option value="legendary">Legendary Action</option><option value="mythic">Mythic Action</option><option value="lair">Lair Action</option></optgroup><optgroup label="Vehicle"><option value="crew">Crew Action</option></optgroup><option value="special">Special</option><option value="">None</option>

Trigger should just be a text box. The response should allow for the selection of features with activation time of a reaction. Those reactions should also be able to be sent to this section via the Prep for Turn Context Menu option. 

As in the actions plan we should have a space for additional features, things that can affect or modify the specific reaction listed that we want to be sure to use.

---

### History & Favorites
- For history: Just the turn plan ID and timestamp, or full snapshot of all data?
- How should we handle changes to items/features between history entries?
- For favorites: Just a flag, or separate collection with metadata (date added, usage count)?
- Your answer:

The history and favorite snapshots should be displayed in the sidebar as a simplified summary of the features used. They should show the names of the features used in plain text without icons or anything. To keep their size consistent, string fields like the trigger/context should be truncated witha n ellipsis if the string is too long to display in the turn snapshot layout. Each of these should have a button to load it into the current turn

When the snapshot is created, let's store the name of the feature or item at that time. the id of the releveant item/feature/etc... should be saved as well but not displayed. When the snapshot isloaded into the current turn prep, we can check if the associated item is still on the sheet. If it is load it normally. if it's not we should change the associated field a different color and change its placeholder text to show that the relevant feature is missing. The player could then replace that item in the plan and save it again.

We will need to also have a way to delete favorites via a context menu. A convention I see on the Tidy5e sheet, maybe it's part of the default sheet as well,  is the furthest right icon in a widget is three dots in a vertical colums. That opens up a context menu of options. I think the same list as you get when right clicking.

---

## 2. Foundry API Questions

### Version Compatibility
- What's the minimum D&D 5e system version we should support?
- Are there any breaking changes between 5e versions we need to handle?
- Any helper libraries from the 5e system we should leverage (item type queries, action type helpers, etc.)?
- Your answer:

We should only be considering D&D version 5+. I'm not interested in testing backwards compatibility for earlier versions.

I don't know about relevant breaking changes but would encourage you to do some research into that before proceeding

I use MidiQOL extensively in my game. I'd like to be able to leverage it but I'd rather not make it a requirement.

---

### Tidy 5E Sheets
- What version of Tidy 5E should we target?
- Are there specific APIs or patterns for sidebar tabs vs character tabs we should know about?
- Any known limitations with custom tab registration?
- Your answer:

Current Version is 12.2.2, so let's tarket compatibility with anything v12 or newer.

I don't know about the patterns, but a priority here is to Have things look as native to the tidy5e sheet as possible. Please prioritize looking into the source of that repo and using its patterns wherever possible. For example, Tidy 5e gives us a customiation panel to allow for different tint colors across the sheet. I'd like for this to pickup and follow those settings.

I don't know about custom tab registation, but I do know that Tidy5e sheets is built to be extendable. Please hook into it using its published endpoints or whatever over rebuilding things wherever possible.

---

## 3. Feature Representation

### What to Store With Selected Features
- Should we store just `itemId`, or also `itemName`, `itemIcon`, `itemType`?
- Do we need to store the action cost type (action, bonus action, reaction)?
- Should we capture feature source (class, race, item, spell)?
- What if an item is deleted—should we preserve historical references?
- Your answer:

When displaying things in the current turn, I want to see the features shown just as they would be on another tab of the sheet. this should connect to all of the data about the item live as opposed to storing anything. We'll only need to store info about it when it gets moved to a snapshot for history or favorite. There we will want to store item id, name, type, action type cost. That way we can display those names even if the underlying feature changes. I discussed above how we will handle missing features only when a snapshot is loaded back into the current turn.

---

## 4. Logging & Error Handling

### Debug Logging
- How verbose should logging be? (minimal, normal, verbose)
- Should logs go to console, browser console, or Foundry's console?
- Any patterns you prefer for log prefixes/formatting?
- Your answer:

We should be fairly verbose in our logging. I am more familiar with python than javascript. I assume javascript allows for types of logs so that we can set what actually gets logged by debug, error, warning etc...

Look at what Tidy5e does for where logs go and mimic that behavior. Adopt its pattern, if any, for log prefixes as well.

---

### Error Recovery
- If actor data corruption is detected, should we silently fix it, warn the user, or error out?
- Should we maintain a backup/rollback capability?
- How should we handle missing referenced items (deleted features)?
- Your answer:

What's your recommendation here? If it can be silently fixed, that's great I suppose. But a way to roll back if that attempt fails is probably a good idea as well. 

I've discussed handling of deleted features above in this document.

---

### Notifications
- When should users be notified (toast messages, console only, both)?
- Which operations warrant user notifications vs silent logging?
- Your answer:

I'm not sure I understand. What things would you foresee a user needing to be notified about?

---

## 5. Standards & Patterns

### Async/Await Style
- Do you prefer `async/await` throughout, or are `Promise` chains acceptable?
- Any preference on error handling (try/catch vs `.catch()`)?
- Your answer:

As best you can follow best practices and follow standards set by Tidy5e

---

### Error Types
- Should we create custom error classes or use standard Error?
- What error information is most useful (stack traces, operation context, recovery suggestions)?
- Your answer:

I'm not sure. I think whatever is going to be most helpful in pinpointing where the error happened and what operation was being attempted at the time.

---

### Code Style
- Strict null checks or lenient?
- Preference for error messages (technical detail vs user-friendly)?
- Any naming conventions beyond the ones in ARCHITECTURE.md?
- Your answer:

I don't really know. What do you recommend?

---

## 6. Development Approach

### Incremental Testing
- Should we test with placeholder/mock data during development, or use real Foundry actor data?
- How much should we test before moving to the next phase?
- Your answer:

I think I saw in the architecture document a way to hook into a locally running instance of founry for dynamic testing with easy updates for changes. I'd like to get that testing environment going early and use reall actor data. 

THis will be a separate instance of Foundry than my live production version so I'm not worried about messign up any data.

Let's work through errors we're getting before moving on, but I imagine that we will need to revisit as we move into future phases and resolve issues with how the components interact.

---

### Constant Values
- History limit default: 10? Higher? Lower?
- Any other configurable constants we should define upfront?
- Your answer:

The only other module wide setting I'm thinking about is a way to toggle DM visiblity of this part of the character sheet. I'm not worried about it for my own personal use, but I do foresee wanting to share this module and I could see other tables valuing DMs not being able to see player plans when they view player sheets. 

That gets into Core foundry functionality I suppose. Is it possible to have certain parts of the sheet be hiden from the DM?

---

### Placeholder Data
- Should foundation layer include example/test data structures, or just types?
- Your answer:

If you're able to find a valid and reputable source of test / placeholder data, please bring that into the project.

---

## 7. Resources & Examples

### Turn Plan Example
- Can you provide an example of what a realistic turn plan looks like for your use case?
- Example structure:

```
{
  Name (text):A name for this plan 
  Trigger (text): If the Gnoll Chieftan moves to attack my Rogue ally
  Action (Foundry Item(s)): Attack with Weapon from Inventory
  Bonus Action(Foundry Feature(s)): Second Wind Fighter Class Feature
  Movement(text): Movenext to the Gnoll Chieftan
  Additional Features(Foundry featues/items/spells/etc...): Great Weapon Master feat. Tactical Fighter class feature that gives me advantage if I missed with my last attack.
  Category (text): "Attack" "Support" "Healing" "Control" etc...
}
```

---

### D&D 5e System Details
- How are action types represented in the D&D 5e system? (string IDs, enums, etc.)
- Any item types we need to special-case?
- Your answer:

Since we're just dealing with turns in combat, I think we are fine to just worry about the basic action economy. See above for more info about how the system handles activation cost for time.e

---

### Custom Tidy 5E Setup
- Are you using any custom Tidy 5E configuration or plugins?
- Any stylistic integrations we should be aware of?
- Your answer:

I don't have any additional customizations on top of the tidy 5e sheet to worry about

As much as possible inherit style from tidy5e sheets so it feels as native to the sheet as possible.

---

## Priority

Which of these question categories are most critical to answer first? Rank them 1-7:

- [ ] Type System & Data Structure
- [ ] Foundry API Questions
- [ ] Feature Representation
- [ ] Logging & Error Handling
- [ ] Standards & Patterns
- [ ] Development Approach
- [ ] Resources & Examples

Your priority order:

I answered them all so this is irrelevant.