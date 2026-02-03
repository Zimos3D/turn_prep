# Turn Prep Tab Edit Mode Plan

A concise implementation guide to add in-tab edit mode for favorite Turn and Reaction plans (no dialogs). Edit mode is entered only from a saved favorite; current turn plans stay as-is and editable already.

## Goals
- Edit a single favorite plan directly inside the Turn Prep tab.
- Hide unrelated sections while editing; force open relevant card/notes; keep drag/reorder and shift-drag copy.
- Save overwrites the favorite; Cancel discards edits; switching tabs preserves edit mode.

## Mode Overview
- `editMode` flag plus `focusedTurnId` or `focusedReactionId` and `tempPlan` data.
- Entry: clone favorite -> validate/prune -> set mode and focused plan.
- Exit: Save (overwrite favorite) or Cancel (drop temp). Do not exit on tab switch.

## UI/Behavior Requirements
- Section visibility: if editing a Turn favorite, show only the Turn section and only the focused plan; hide Reactions and DM questions. If editing a Reaction favorite, show only the Reaction section and only the focused plan; hide Turns and DM questions.
- Section header: label becomes "Editing Turn Plan" / "Editing Reaction Plan"; remove section collapse chevron in edit mode.
- Card state: force plan expanded; notes open by default (ignore previous collapsed state). Disable plan-level collapse toggle in edit mode.
- Header actions: replace New Plan/New Reaction buttons with Save + Cancel while edit mode is active.
- Menus/context: hide the card context menu button in edit mode. Also disable right-click context menus (or constrain them to Save/Cancel only; disabling is simpler).
- Drag/reorder: keep reorder and shift-drag-to-copy enabled in edit mode.
- Add-to-Turn-Prep routing while editing:
  - Editing Turn: Action (or Action+Bonus) -> Actions table; Bonus-only -> Bonus table; everything else -> Additional.
  - Editing Reaction: Reaction activation -> Reactions table; everything else -> Additional.

## Data/Validation Rules
- On entering edit mode: clone the favorite. Remove any missing/deleted features up front. If name is missing, fall back to prior name; if still empty, use a generated unique name like "Plan N" not already used in favorites.
- Save overwrites the original favorite snapshot. Cancel discards the temp clone; favorites remain unchanged.
- Routing rules above apply only while `editMode` is true.

## API Sketch for Panels (TurnPlansPanel / ReactionPlansPanel)
- New props/inputs (example names):
  - `editMode: boolean` (default false)
  - `focusedPlanId?: string` (id of favorite being edited)
  - `initialFavoriteSnapshot?: TurnFavoriteSnapshot | ReactionFavoriteSnapshot` (the favorite payload to edit; mutually exclusive between panels)
- Events/callbacks to surface:
  - `onSaveEdit(updatedSnapshot)` -> emitted when Save is clicked.
  - `onCancelEdit()` -> emitted when Cancel is clicked.
- Internal behaviors when `editMode` is true:
  - Render only the focused card; force open card/notes; disable collapse and hide context menu button.
  - Replace header buttons with Save/Cancel wired to `onSaveEdit`/`onCancelEdit`.
  - Disable duplicate/delete/submit/add-to-favorites/arrange actions.
  - Keep drag/reorder and shift-copy active.
  - Apply routing rules for incoming "Add to Turn Prep" actions to the focused plan tables.
- Persistence: panels should retain `editMode` state across tab switches (state stored at sheet/controller level and passed back in).

## Implementation Steps (order)
1) Add edit-mode state to parent sheet/controller: `editMode`, `modeKind` (turn|reaction), `focusedPlanId`, `focusedSnapshot` (cloned/validated), and handlers to enter/exit.
2) Validation on entry: clone favorite, prune missing features, normalize name, then pass to panel via `initialFavoriteSnapshot` + `focusedPlanId` + `editMode=true`.
3) Update TurnPlansPanel rendering guards: when `editMode`, hide other sections and list items; show only focused card; change header text and buttons; hide collapse chevron and context menu; force notes open; keep reorder enabled.
4) Update ReactionPlansPanel similarly with reaction-specific routing and header label.
5) Wire Save/Cancel buttons to emit events; in controller, on Save overwrite favorite; on Cancel drop temp and clear edit state.
6) Add Add-to-Turn-Prep routing overrides keyed on `editMode` + `modeKind` to direct incoming features to focused plan tables per rules.
7) Ensure tab switches do not clear edit state; rehydrate panel props when returning.
8) QA: verify normal mode unchanged; in edit mode, only focused section/card shows, notes open, context menus hidden/disabled, reorder works, routing targets focused plan, Save overwrites favorite, Cancel restores prior view.

## Outstanding Questions for follow-up
- Context menus: confirm whether to fully disable right-click or present a minimal Save/Cancel menu. (Default to disable unless requested.)
- Styling tweaks: any desired padding/gap adjustments in edit mode beyond hiding collapse/menu buttons?
- Naming fallback: acceptable format for autogenerated names (e.g., "Plan 1") and whether to localize.

## Minimal Controller Contract (pseudo-code)
- `enterEditMode(kind, favoriteSnapshot)`:
  - clone + validate snapshot -> `editSnapshot`
  - set state: `editMode=true`, `modeKind=kind`, `focusedPlanId=favoriteSnapshot.id`, `focusedSnapshot=editSnapshot`
- `exitEditMode()`:
  - clear edit state
- Panel props:
  - `editMode={state.editMode && state.modeKind==='turn'}`
  - `focusedPlanId={state.focusedPlanId}`
  - `initialFavoriteSnapshot={state.focusedSnapshot}`
- Panel events:
  - `onSaveEdit={(updated) => overwriteFavorite(updated); exitEditMode();}`
  - `onCancelEdit={() => exitEditMode();}`

This should be enough for another agent to pick up and implement the in-tab edit mode cleanly.
