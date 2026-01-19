# Phase 2 Clarification Questions - Data Layer

Answer these questions to guide the implementation of the data layer. This phase focuses on data persistence, feature management, and sheet integration.

---

## 1. Data Storage Strategy

### Actor Flag Storage
- Should each actor's Turn Prep data be stored in their actor flags (actor.getFlag())?
- Or should we use world-level settings + a mapping of actor IDs?
- What's your preference for data organization?
- Your answer:

---

### Data Persistence
- Should data auto-save after every change, or require explicit saves?
- Should there be an "unsaved changes" indicator in the UI?
- How should we handle conflicts if a player modifies data in multiple tabs simultaneously?
- Your answer:

---

### Data Backup & Recovery
- Should we implement automatic rollback on data corruption?
- How many versions of history should we keep per actor (default 10, configurable)?
- Should deleted favorite plans be recoverable, or permanently deleted?
- Your answer:

---

## 2. Feature Selection & Querying

### Feature Types
- Should we query items by D&D 5e type (weapon, spell, feat, class feature)?
- Or just show all items/features on the actor sheet?
- How should we handle non-D&D features (homebrew items)?
- Your answer:

---

### Feature Display
- When showing available features, should we show:
  - [ ] Only items with activation costs defined?
  - [ ] All items regardless of activation type?
  - [ ] Grouped by activation cost type (Action, Bonus Action, Reaction)?
  - [ ] Filtered by what the character can actually use?
- Your answer:

---

### Feature Filtering
- Should features be filterable by:
  - [ ] Item type (spell, weapon, feat, class feature)?
  - [ ] Activation cost (action, bonus, reaction)?
  - [ ] Equipped/unequipped status?
  - [ ] Prepared/unprepared status (for spellcasters)?
- Your answer:

---

## 3. Turn Plan Management

### Current Turn Plan
- Should the current turn plan auto-load the last saved plan when the sheet opens?
- Or always start blank and require explicit "Load Favorite" action?
- Should there be a "Clear" button to reset the current plan?
- Your answer:

---

### Plan Naming
- Should plan names be auto-generated (e.g., "Turn Plan #1") or required input?
- Should we suggest names based on selected features?
- Any max length for plan names?
- Your answer:

---

### Validation Rules
- What makes a turn plan "valid" for saving as a favorite?
  - At least one feature selected?
  - All required fields filled?
  - No invalid references?
- Should incomplete plans be saveable?
- Your answer:

---

## 4. History & Favorites

### History Snapshots
- When should a turn plan be added to history?
  - [ ] Only when explicitly saved as favorite?
  - [ ] After combat encounter ends?
  - [ ] Only when player manually clicks "Save to History"?
  - [ ] Each time player changes tabs/closes sheet?
- Your answer:

---

### Snapshot Data
- For each snapshot, store:
  - [ ] Feature IDs + names only?
  - [ ] Full feature data (icons, descriptions)?
  - [ ] Current state of each feature (charges, uses remaining)?
  - [ ] Just the names as plain text (per your clarifications)?
- Your answer:

---

### Favorites Organization
- Should favorites auto-group by category tags (as you mentioned)?
- Should we allow renaming favorites after saving?
- Should we track "usage count" or "last used date"?
- Your answer:

---

### Deletion & Recovery
- When user deletes a favorite, should we:
  - [ ] Permanently delete immediately?
  - [ ] Move to trash/archive first?
  - [ ] Ask for confirmation with option to undo?
- Your answer:

---

## 5. Sheet Integration

### Tab Placement
- Should the Turn Prep tab appear:
  - [ ] As a main character sheet tab (alongside Attributes, Inventory)?
  - [ ] As a sidebar panel?
  - [ ] As a collapsible widget on the current tab?
- Your answer:

---

### Tidy 5E Integration
- Should we hook into Tidy 5E's custom tab system?
- Should we inherit Tidy's theme/color customization settings?
- Are there specific Tidy patterns we should follow for styling?
- Your answer:

---

### Default Sheet Fallback
- For players using default D&D 5e sheets, how should we inject the UI?
  - [ ] As a new sheet tab?
  - [ ] As a sidebar on the character sheet?
  - [ ] As a separate floating window?
- Your answer:

---

## 6. Context Menu Integration

### Right-Click Behavior
- Where should "Add to Turn Prep" context menu appear?
  - [ ] On inventory items?
  - [ ] On spells/abilities?
  - [ ] On class features?
  - [ ] All of the above?
- Your answer:

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

---

### Three-Dot Menu
- Should the three-dot menu (⋮) appear:
  - [ ] On each feature in the turn plan?
  - [ ] On each history/favorite snapshot?
  - [ ] On favorite groups?
  - [ ] All of the above?
- Options in menu?
- Your answer:

---

## 7. Missing Feature Handling

### Missing Item Behavior
- When a feature is missing from the actor sheet, should we:
  - [ ] Display it in a different color (as you mentioned)?
  - [ ] Show a warning icon?
  - [ ] Disable the ability to use it?
  - [ ] All of the above?
- Your answer:

---

### Placeholder Text
- What should the placeholder say for missing features?
  - "Missing: [Feature Name]"?
  - "Item no longer on sheet"?
  - Something else?
- Your answer:

---

### Replacement Workflow
- When a player loads a snapshot with missing features, should we:
  - [ ] Let them manually replace features?
  - [ ] Suggest similar replacement features?
  - [ ] Allow them to save the modified plan?
- Your answer:

---

## 8. UI/UX Details

### Drag & Drop
- Should features be reorderable (drag/drop) in the current turn plan?
- Should snapshots in history/favorites be reorderable?
- Your answer:

---

### Text Truncation
- For trigger/context text truncation (you mentioned ellipsis):
  - What's the max character length before truncating?
  - Should truncated text show full text on hover?
  - Any other text fields that need truncation?
- Your answer:

---

### Visual Hierarchy
- How should we distinguish between:
  - [ ] Current turn plan vs history vs favorites?
  - [ ] Valid features vs missing features?
  - [ ] Selected vs unselected features?
  - [ ] Categories/groups vs individual items?
- Your answer:

---

### Notifications & Feedback
- When should users get toast notifications?
  - [ ] Plan saved successfully?
  - [ ] Feature added/removed?
  - [ ] Error saving data?
  - [ ] All of the above?
- Your answer:

---

## 9. Performance Considerations

### Data Size
- With max history of 50 snapshots × multiple actors, how concerned are you about data size?
- Should we compress snapshots or prune old data?
- Any performance concerns with large parties (10+ actors)?
- Your answer:

---

### UI Rendering
- Should history/favorites list be virtualized (lazy-load)?
- Or load all at once?
- Any concerns with rendering hundreds of snapshots?
- Your answer:

---

## 10. Developer Experience

### Testing Data
- Should we provide sample/test Turn Prep data structures?
- Should there be a "Generate Test Data" command for development?
- Your answer:

---

### Debug Features
- Should debug mode expose:
  - [ ] Raw actor flag contents?
  - [ ] Data validation logs?
  - [ ] Settings/configuration dump?
  - [ ] Feature query results?
- Your answer:

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
