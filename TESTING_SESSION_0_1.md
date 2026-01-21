# Turn Prep Phase 4 - Session 0 & 1 Testing Guide

## What Was Implemented

### Session 0: Tidy5e Tab Registration ✅
- **File**: `src/sheets/tidy5e/tidy-sheet-integration.ts`
  - Implemented `initializeTidy5eSheets()` function
  - Registers main "Turn Prep" tab in character sheet
  - Registers "Turns" sidebar tab for history/favorites
  - Auto-show sidebar when main tab is activated
  - Placeholder renderers for both tabs

- **File**: `src/hooks/ready.ts` (updated)
  - Integrated `initializeTidy5eSheets()` call in setup flow
  - Proper error handling and logging

### Session 1: DM Questions Panel ✅
- **Components**:
  - `src/sheets/components/DmQuestionsPanel.svelte` - Main panel
  - `src/sheets/components/QuestionRow.svelte` - Individual question row

- **Features Implemented**:
  - ✅ Add new question rows (+button)
  - ✅ Remove question rows (-button, min 1 row required)
  - ✅ Clear text from individual questions (eraser icon)
  - ✅ Send as whisper to DM (plane icon)
  - ✅ Send as public chat (bullhorn icon)
  - ✅ Auto-save to actor flags
  - ✅ Persistent storage per character
  - ✅ Load existing questions on component mount

- **API Methods** (added to `TurnPrepApi.ts`):
  - `getDMQuestions(actor)` - Retrieve stored questions
  - `saveDMQuestions(actor, questions)` - Save questions to flags
  - `sendQuestionToDm(actor, text)` - Send whisper to GM
  - `sendQuestionPublic(actor, text)` - Send to public chat

- **Storage** (added to `TurnPrepStorage.ts`):
  - `getDMQuestions(actor)` - Load from storage
  - `saveDMQuestions(actor, questions)` - Persist to flags
  - `getInstance()` - Singleton pattern

- **Localization** (updated `public/lang/en.json`):
  - Migrated to `TURN_PREP.*` namespace
  - Added 15+ DM Questions keys
  - Added placeholder keys for future components
  - All buttons and messages localized

- **Tab Wrappers**:
  - `src/sheets/default/TurnPrepMainTab.svelte` - Main tab wrapper
  - `src/sheets/tidy5e/TidyTurnsSidebarTab.svelte` - Sidebar wrapper (placeholder)

## Testing Checklist

### Prerequisites
- [ ] Foundry VTT running with D&D 5e system
- [ ] Tidy 5e Sheets module installed and active
- [ ] Turn Prep module installed and enabled
- [ ] At least one character actor created

### Step 1: Verify Tab Registration
1. Open a character sheet
2. **Expected**: Should see "Turn Prep" tab in the main tab bar
3. **Expected**: Clicking "Turn Prep" should auto-show the sidebar
4. **Expected**: Sidebar should automatically switch to "Turns" tab
5. **Issue**: If tabs don't appear, check browser console for errors

### Step 2: Verify DM Questions Panel Loads
1. Click the "Turn Prep" tab
2. **Expected**: DM Questions panel should display with:
   - Title "DM Questions"
   - One empty question row
   - "Add Question" button at bottom
3. **Issue**: If panel doesn't load, check:
   - Browser console for Svelte component errors
   - Network tab for module loading
   - Turn Prep module is enabled in Foundry settings

### Step 3: Test Add/Remove Questions
1. Click the "+" button (Add Question)
2. **Expected**: New empty question row appears below
3. Click the "-" button on any row except if it's the last one
4. **Expected**: Row is removed, warning shown if trying to remove last row
5. Add 3 more questions (total 5+)
6. **Expected**: All rows persist and are editable

### Step 4: Test Text Entry & Persistence
1. Type a question in the first row: "What is the AC of the enemy?"
2. Type in another row: "Can I use my bonus action after disengage?"
3. Refresh the page (F5)
4. Open the character sheet again and navigate to Turn Prep tab
5. **Expected**: Both questions are still there (persistence works)

### Step 5: Test Send to DM (Whisper)
1. Type a question: "Am I within range for my spell?"
2. Click the paper plane icon (send to DM)
3. **Expected**: Chat message appears as whisper (only visible to GMs)
4. **Expected**: Message format: "[Character Name] asks: [question text]"
5. **Check**: Question text remains in the field (doesn't clear)
6. **Issue**: If no message appears, check:
   - Are there any GM users in the world?
   - Check browser console for errors

### Step 6: Test Send to Public Chat
1. Type a question: "What does the shopkeeper look like?"
2. Click the bullhorn icon (send public)
3. **Expected**: Chat message appears in public chat
4. **Expected**: All players can see it
5. **Expected**: Message format: "[Character Name] asks: [question text]"
6. **Check**: Question text remains in the field (doesn't clear)

### Step 7: Test Clear Button
1. Type a long question in a row
2. Click the eraser icon
3. **Expected**: Text is cleared, row remains
4. **Expected**: No notification about deletion

### Step 8: Test Notifications
1. Try to send an empty question (leave text blank, click send)
2. **Expected**: Warning: "Please enter a question before sending"
3. Try to remove the last question row
4. **Expected**: Warning: "You must keep at least one question row"

### Step 9: Test Sidebar Tab Placeholder
1. While on Turn Prep tab, look at the sidebar
2. **Expected**: Sidebar shows "Turns" tab selected
3. **Expected**: Sidebar displays placeholder: "📚 History & Favorites Tab - Coming soon..."
4. **Note**: This is intentional - History panel will be implemented in Session 5

### Step 10: Test Multiple Characters
1. Create or select a different character
2. Open its character sheet and go to Turn Prep tab
3. Add a question specific to this character
4. Switch back to the first character
5. **Expected**: First character's questions are still there (not the second character's)
6. Switch to second character
7. **Expected**: Second character's questions are visible

## Known Limitations (Intentional)

- ✅ History & Favorites panel is a placeholder (will be implemented later)
- ✅ Turn Plans panel not yet implemented (Session 2)
- ✅ Reactions panel not yet implemented (Session 4)
- ✅ Dialog migrations not yet done (Session 6)

## Debugging

If you encounter issues:

1. **Check Console**: Press F12, go to Console tab
   - Look for TypeScript/JavaScript errors
   - Look for "Turn Prep" log messages

2. **Check Module Load**: In console, type:
   ```javascript
   game.modules.get('turn-prep').active
   ```
   Should return `true`

3. **Check API**: In console, type:
   ```javascript
   game.TurnPrepAPI
   ```
   Should show the API object with methods

4. **Test DM Questions API**:
   ```javascript
   // Get current character
   const actor = game.user.character;
   
   // Get all questions
   const questions = await game.TurnPrepAPI.getDMQuestions(actor);
   console.log(questions);
   
   // Save a test question
   await game.TurnPrepAPI.saveDMQuestions(actor, [{
     id: foundry.utils.randomID(),
     text: 'Test question',
     tags: [],
     createdTime: Date.now()
   }]);
   ```

5. **Check Tidy5e Integration**: In console, type:
   ```javascript
   game.TurnPrepAPI.isTidyIntegrated()
   ```
   Should return `true` if Tidy5e is active

## Next Steps After Testing

After confirming all tests pass:

1. Commit changes to git with session summary
2. Update PROJECT_STATUS.md with completion notes
3. Begin Session 2: Turn Plans Panel implementation
4. Continue with remaining sessions following the timeline

## Build Status

✅ Build: Successful (98.52 kB gzipped)
✅ No compilation errors
✅ All components compile correctly
✅ Ready for Foundry testing

---

**Test Date**: January 21, 2026  
**Session**: 0 & 1 (Tab Registration + DM Questions)  
**Status**: Ready for Foundry VTT Testing
