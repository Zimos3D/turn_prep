# Phase 2 Clarification Questions - Data Layer

Answer these questions to guide the implementation of the data layer. This phase focuses on data persistence, feature management, and sheet integration.

---

## 1. Data Storage Strategy

### Actor Flag Storage
- Should each actor's Turn Prep data be stored in their actor flags (actor.getFlag())?
- Or should we use world-level settings + a mapping of actor IDs?
- What's your preference for data organization?
- Your answer:

Yes. Let's use actor flags for storage. that feels the most simple and straightforward. It makes sense to keep all of this tied to the actor. 

I don't have a strong preference for data organization. Use your judgment while also referencing Tidy5e standards where applicable.

---

### Data Persistence
- Should data auto-save after every change, or require explicit saves?
- Should there be an "unsaved changes" indicator in the UI?
- How should we handle conflicts if a player modifies data in multiple tabs simultaneously?
- Your answer:

Autosave after every change ideally. that should take care of conflicts if it's saving right away after edits. Let me know if you think some additional conflict resolution logic is necessary and what you would recommend.

---

### Data Backup & Recovery
- Should we implement automatic rollback on data corruption?
- How many versions of history should we keep per actor (default 10, configurable)?
- Should deleted favorite plans be recoverable, or permanently deleted?
- Your answer:

If this is straightforward, let's go ahead and implement it, but if this gets complicated around where to store these restore states - we can skip this for now.

I am fine with deleted favorites being permanently deleted, but I would like to add an "Are you sure?" dialog popup before deleting as a layer of protection. 

---

## 2. Feature Selection & Querying

### Feature Types
- Should we query items by D&D 5e type (weapon, spell, feat, class feature)?
- Or just show all items/features on the actor sheet?
- How should we handle non-D&D features (homebrew items)?
- Your answer:

We should query all of these types at once and look at activities associated with them. The Action and bnus action fields should be filtered by their activation time cost (Action, bonus action respectively) the additional features field should accept any of these types. Non standard stuff should be queried too and filtered the same way by action economy where applicable

---

### Feature Display
- When showing available features, should we show:
  - [ ] Only items with activation costs defined?
  - [ ] All items regardless of activation type?
  - [ ] Grouped by activation cost type (Action, Bonus Action, Reaction)?
  - [ ] Filtered by what the character can actually use?
- Your answer:

The Turn plan will have spots for action and bonus action. The reaction section will have a space for Reactions. These fields should show only features/items that match that activation cost. The additional features field should show everything. These should then be filtered by searching what the user begins to type.

Would it be beneficial to have the query only happen once a set number of characters have been typed, maybe 3, to not get as many results to show?

---

### Feature Filtering
- Should features be filterable by:
  - [ ] Item type (spell, weapon, feat, class feature)?
  - [ ] Activation cost (action, bonus, reaction)?
  - [ ] Equipped/unequipped status?
  - [ ] Prepared/unprepared status (for spellcasters)?
- Your answer:

I think that by default we should filter out unequipped inentory and unprepared spells. Perhaps we need an actor level setting to control this behavior and allow for unprepared/unequipped items to show up. 

---

## 3. Turn Plan Management

### Current Turn Plan
- Should the current turn plan auto-load the last saved plan when the sheet opens?
- Or always start blank and require explicit "Load Favorite" action?
- Should there be a "Clear" button to reset the current plan?
- Your answer:

I think when a turn is completed and ssent to history, the plan should clear. Favorites or history turn snapshots can be loaded into the current plan easily.

A clear button is a good idea.

---

### Plan Naming
- Should plan names be auto-generated (e.g., "Turn Plan #1") or required input?
- Should we suggest names based on selected features?
- Any max length for plan names?
- Your answer:

We should impose sdome kind of limit, but it should be well beyond what anyone would need. Like 1000 characters. We will autotruncate it in the snapshot 

Auto-Fill names with a nbumber are a good idea. Generic names are fine without referencing the items.

---

### Validation Rules
- What makes a turn plan "valid" for saving as a favorite?
  - At least one feature selected?
  - All required fields filled?
  - No invalid references?
- Should incomplete plans be saveable?
- Your answer:

We're not cops. ANything can be saveable. No required fields. A unique id for the plan behind the scenes will be generated and that will be the only required piece of data.

---

## 4. History & Favorites

### History Snapshots
- When should a turn plan be added to history?
  - [ ] Only when explicitly saved as favorite?
  - [ ] After combat encounter ends?
  - [ ] Only when player manually clicks "Save to History"?
  - [ ] Each time player changes tabs/closes sheet?
- Your answer:

For now let's keep it as only when the player clicks save to history. In a future version I'll want to hook this in to the encounter system in foundry and have an option to have this happen automatically when the player ends their turn int he initiative tracker. 

---

### Snapshot Data
- For each snapshot, store:
  - [ ] Feature IDs + names only?
  - [ ] Full feature data (icons, descriptions)?
  - [ ] Current state of each feature (charges, uses remaining)?
  - [ ] Just the names as plain text (per your clarifications)?
- Your answer:

Feature IDs plus names. We'll display the saved names. The ids will be referenced when the favorite/history snapshot is loaded back into the current turn plan
---

### Favorites Organization
- Should favorites auto-group by category tags (as you mentioned)?
- Should we allow renaming favorites after saving?
- Should we track "usage count" or "last used date"?
- Your answer:

Let's not mess with the category sorting for now. 

I do like the idea of being able to rename after saving. I'd also like to be able to mark a snapshot from history as a favorite directly from a context menu without needing to load it back into the current turn plan.

---

### Deletion & Recovery
- When user deletes a favorite, should we:
  - [ ] Permanently delete immediately?
  - [ ] Move to trash/archive first?
  - [ ] Ask for confirmation with option to undo?
- Your answer:

Yes ask for confirmation. If we can make it undoable let's do that too. Once confirmed, we can completely delete it from the actor though.

---

## 5. Sheet Integration

### Tab Placement
- Should the Turn Prep tab appear:
  - [ ] As a main character sheet tab (alongside Attributes, Inventory)?
  - [ ] As a sidebar panel?
  - [ ] As a collapsible widget on the current tab?
- Your answer:

Yes. This should be a main character sheet tab. It should be the second tab after the "Sheet" tab and before the "Character" tab. The History/Favorites panel should be added to Tidy 5e's sidebar under the heading "Turns" with an hourglass icon

---

### Tidy 5E Integration
- Should we hook into Tidy 5E's custom tab system?
- Should we inherit Tidy's theme/color customization settings?
- Are there specific Tidy patterns we should follow for styling?
- Your answer:

Yes. Use Tidy5e's custom tab system. Yes follow its color customizations.

Follow Tidy5e's styling as closely as possible

---

### Default Sheet Fallback
- For players using default D&D 5e sheets, how should we inject the UI?
  - [ ] As a new sheet tab?
  - [ ] As a sidebar on the character sheet?
  - [ ] As a separate floating window?
- Your answer:

As a New sheet tab there. Usign an hourglass icon. THis is secondary for the time being.

---

## 6. Context Menu Integration

### Right-Click Behavior
- Where should "Add to Turn Prep" context menu appear?
  - [ ] On inventory items?
  - [ ] On spells/abilities?
  - [ ] On class features?
  - [ ] All of the above?
- Your answer:

All of the above. We will need some custom logic to look at the item and its attached activities to check for Action, Bonus Action, Reaction activation costs to be able to auto-add it to the right place in the turn plan. 


---

### Context Menu Actions
- What options should appear when right-clicking features in Turn Prep?
  - [ ] Add to current plan?
  - [ ] Remove from current plan?
  - [ ] Save this as favorite?
  - [ ] Open item details?
  - [ ] Delete from history/favorites?
  - [ ] Other?
- Your answer:

we should be displaying these items the same way tidy5e shows them on its "Sheet" tab. THs gives us automatically icon, name, a click to roll button, action economy, other details, and a collapsible view of the feature's full text. With that we should also inherit all of its existing context menu options. 

We will add these additional context menu options:
- Remove from Turn Plan *(On items in the current turn plan)*
- Delete Favorite *(On items in the favories panel of the sidebar)*
- Save as favorite *(On a current plan and on a history snapshot)*
- Add to Current Plan *(On items in all tabs except for the turn prep tab. Including the Standard Favorites panel from Tidy 5E's Sheet (not the favorite turns panel we're building here))*

---

### Three-Dot Menu
- Should the three-dot menu (⋮) appear:
  - [ ] On each feature in the turn plan?
  - [ ] On each history/favorite snapshot?
  - [ ] On favorite groups?
  - [ ] All of the above?
- Options in menu?
- Your answer:

As I mentioned above, if we display these features/items exactly as tidy5e does on its Sheet tab, we'll get the 3 dot icon from that automatically.

On the Favorites and History, let's have two icons:  
  - A right arrow icon to load it into the current plan.
  - The three dots icon for a context menu

For the context menu for the snapshots we should have the following options:
  - "Delete Snapshot"
  - "Load as Current Plan"
  - "Rename"
  - "Add as Favorite" (History Snapshots only)


---

## 7. Missing Feature Handling

### Missing Item Behavior
- When a feature is missing from the actor sheet, should we:
  - [ ] Display it in a different color (as you mentioned)?
  - [ ] Show a warning icon?
  - [ ] Disable the ability to use it?
  - [ ] All of the above?
- Your answer:

When a history or favorite snapshot is created, it should  store the names of the features/items at the time of use. these are what are displayed in the snapshot. The ids of the associated feature/item/etc.. are stored but not displayed. 

When a snapshot is loaded as a current turn, the item ids will be referenced to add the item to the plan. If that item is no longer there or attached to the character sheet. We should change the color of the field to a light red / pink and show a warning saying "{item name} is missing in the placeholder text. The user can then swap out that item for a valid one to make their turn valid again.

---

### Placeholder Text
- What should the placeholder say for missing features?
  - "Missing: [Feature Name]"?
  - "Item no longer on sheet"?
  - Something else?
- Your answer:

Yes. "Missing: [Feature Name]" is perfect. Since we have the name stored with the snapshot object, we can use that here.

---

### Replacement Workflow
- When a player loads a snapshot with missing features, should we:
  - [ ] Let them manually replace features?
  - [ ] Suggest similar replacement features?
  - [ ] Allow them to save the modified plan?
- Your answer:

Yes. We let them manually replace features. We will alert them via the visual changes to the field and the placehodler text. If they save it without repalcing the missing item/feature it should save as blank for that field which is fine. 

We should add a pop up asking the player if they are sure they are done if action or bonus action are empty.

---

## 8. UI/UX Details

### Drag & Drop
- Should features be reorderable (drag/drop) in the current turn plan?
- Should snapshots in history/favorites be reorderable?
- Your answer:

yes. drag and drop reordering within the turn plans is desirable. When dropped, there should be validation on the fields associated with a particular activation cost. If it is invalid it should go back. 

It would be really cool if drag and drop would move an item, while shift + drag and drop would copy it without removing it from the field where it came from.

Favorites should be reorderable
History Items should not be. It would be neat if dragging and dropping a history snapshot into the favorites section of that sidebar panel would add it to favorites.

---

### Text Truncation
- For trigger/context text truncation (you mentioned ellipsis):
  - What's the max character length before truncating?
  - Should truncated text show full text on hover?
  - Any other text fields that need truncation?
- Your answer:

Ideally, I'd like it to just extend to the end of its line within its object and just not word wrap. Is that possible?

Full text on hover is a great idea. Let's do that. This should be for every Line in the Snapshot's object. Fields with multiple features would get one line per feature. 

---

### Visual Hierarchy
- How should we distinguish between:
  - [ ] Current turn plan vs history vs favorites?
  - [ ] Valid features vs missing features?
  - [ ] Selected vs unselected features?
  - [ ] Categories/groups vs individual items?
- Your answer:

Favorites and History live in Tidy 5E's collapsible Sidebar under a "Turns" tab with an hourglass icon

Favorites at the top, history below that. History is limited and is attached to a global setting we've already set up.
---

### Notifications & Feedback
- When should users get toast notifications?
  - [ ] Plan saved successfully?
  - [ ] Feature added/removed?
  - [ ] Error saving data?
  - [ ] All of the above?
- Your answer:

Error saving data. I've mentioned pop up notifications in other places. not sure if that's the same thing. 

- A pop up check when deleting a favorite.
- A pop up check when submitting or saving a turn that is missing an action or a bonus action or with more than one action or bonus action


---

## 9. Performance Considerations

### Data Size
- With max history of 50 snapshots × multiple actors, how concerned are you about data size?
- Should we compress snapshots or prune old data?
- Any performance concerns with large parties (10+ actors)?
- Your answer:

Each snapshot is just storing a handfull of ids and strings. I can't imagine that the size of that would get concerning. please correct me if I'm wrong.

---

### UI Rendering
- Should history/favorites list be virtualized (lazy-load)?
- Or load all at once?
- Any concerns with rendering hundreds of snapshots?
- Your answer:

I think load all at once. If someone goes so hog wild with this that they have hundreds of turns prepped on a single actor, their performance issues are on them.

---

## 10. Developer Experience

### Testing Data
- Should we provide sample/test Turn Prep data structures?
- Should there be a "Generate Test Data" command for development?
- Your answer:

I'm not worried about including this for now. 

---

### Debug Features
- Should debug mode expose:
  - [ ] Raw actor flag contents?
  - [ ] Data validation logs?
  - [ ] Settings/configuration dump?
  - [ ] Feature query results?
- Your answer:

the first three

---

## Priority

Which of these question categories are most critical to answer first? Rank them 1-10:

- [ ] Data Storage Strategy
- [ ] Feature Selection & Querying
- [ ] Turn Plan Management
- [ ] History & Favorites
- [ ] Sheet Integration
- [ ] Context Menu Integration
- [ ] Missing Feature Handling
- [ ] UI/UX Details
- [ ] Performance Considerations
- [ ] Developer Experience

Your priority order:

I answered all of them. THis isn't relevant.