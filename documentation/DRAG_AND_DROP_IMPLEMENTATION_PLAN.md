# Turn Prep Drag & Drop and Context Menu Plan (Foundry V13)

## Purpose
Central plan for enabling drag/drop + context-menu move/copy/reorder for Turn Prep (Turn Plans, Reactions, DM Questions) with activation-aware routing and Foundry-native item drops. Use this as the handoff doc for new agents.

## Recent Verifications
- Move/Copy menus surface Action/Bonus/Reaction/Additional as available and honor Shift for copy.
- Drag/drop between Action and Bonus tables respects explicit targets when compatible; dual-activation items route correctly.
- Arrange submenu renders with icons and actions, and submenu interaction (hover/click/Escape) works as expected.
- Feature table reorders and drop/move/copy flows trigger debounced autosave callbacks in code.
- Plan/Reaction/DMQ card reordering is by context-menu Arrange only (drag/drop intentionally disabled for better UX) with the same Up/Down/Top/Bottom icons.

## High-Level Rules
- Activations considered: Action, Bonus Action, Reaction. Anything else → Additional Features.
- Turn Plan tables: Action, Bonus Action, Additional. Reaction-only drops here → Additional.
- Reaction Plan tables: Reaction, Additional. Action/Bonus-only drops here → Additional.
- Copy = new reference to same feature/item (same itemId/uuid). Move removes from source.
- No duplicates in the same table (skip + warn).
- Accept drops only from the same actor.
- Array order is authoritative (no separate sort key).
- DM Questions: only reorder cards (no feature tables).

## Open Questions (resolved)
- Duplicates in table? **No.**
- Multi-activity routing? **Turn:** Action > Bonus > Additional. **Reaction:** Reaction > Additional.
- DMQ needs? **Reorder only.**

## Key Files to Touch
- `src/sheets/components/TurnPlansPanel.svelte`
- `src/sheets/components/ReactionPlansPanel.svelte`
- `src/sheets/components/DMQuestionsPanel.svelte` (not shown above; add reorder + move menu)
- `src/sheets/components/TurnPlanFeatureTable.svelte`
- `src/sheets/components/context-menu/ContextMenuHost.svelte`
- Helpers: `featureDisplay.helpers`, types in `types/turn-prep.types`
- API: `TurnPrepApi`, constants: `AUTO_SAVE_DEBOUNCE_MS`, `FLAG_SCOPE`, `FLAG_KEY_DATA`

## Data / Payload Contracts (planned)
- Custom drag payload:  
  `{ kind: "turn-prep-feature", actorId, sourcePlanId?, sourceReactionId?, table: "action"|"bonus"|"reaction"|"additional", feature: SelectedFeature, index: number }`
- Native Foundry Item drop: use UUID from `text/plain` or JSON `{ type:"Item", uuid }`; resolve via `fromUuid`.

## Phased To-Do & Checkpoints

### Phase 1 — Helpers
- [x] Activation routing helper (Turn: Action > Bonus > Additional; Reaction: Reaction > Additional).
- [x] Duplicate guard (same item/feature id in target table → skip + warn).
- [x] Drop payload builder/parser (custom MIME + UUID) and array move/reorder util.
- [x] Shallow clone helper for SelectedFeature.
**Status:** Implemented and exercised in UI (helpers in active use).

### Phase 2 — ContextMenuHost submenu support
- [x] Nested/secondary menus, positioning, hover/click open, Escape/blur close all.
- [x] Keyboard focus within menus.
**Status:** Implemented and verified in UI (submenu open/close/focus/escape).

### Phase 3 — TurnPlanFeatureTable drag/drop + menus
- [x] Rows draggable with custom payload + UUID (awaiting parent wiring to consume events).
- [x] Accept drops: reorder same-table; incoming from other tables/plans/native items (emits callbacks).
- [x] Emit move/copy/reorder events upward (parent integration pending).
- [x] Row context menu: Move to > / Copy to > (submenu hooks), Up/Down/Top/Bottom.
- [x] Drag-over highlight + placeholder index.
**Status:** Implemented and verified through Turn/Reaction parents (drag/reorder, drop callbacks, move/copy menus).

### Phase 4 — TurnPlansPanel handling
- [x] Drop routing (Action > Bonus > Additional), same-actor guard, duplicate guard wired in panel handlers (tested).
- [x] Move/copy across plans via table menus and drops; remove from source on move (tested).
- [x] Reorder plans via Arrange submenu (Up/Down/Top/Bottom); drag/drop intentionally disabled for plan cards.
- [ ] Autosave/debounce after changes — feature/table mutations hit the debounced save; plan-level autosave cadence still unverified in UI.
**Checkpoint:** Validate plan-level autosave cadence (once per op) in UI.

### Phase 5 — ReactionPlansPanel handling
- [x] Routing (Reaction > Additional), same-actor/duplicate guards; move/copy/drop tested with Action/Bonus/Reaction features.
- [x] Reorder reaction cards via Arrange submenu (Up/Down/Top/Bottom); drag/drop intentionally disabled.
- [ ] Autosave cadence — feature/table mutations hit the debounced save; overall timing still unverified in UI.
**Checkpoint:** Confirm reaction-card autosave cadence (once per op) in UI.

### Phase 6 — DMQuestionsPanel
- [x] Add Arrange submenu (Up/Down/Top/Bottom) for DMQ rows; drag/drop intentionally disabled.
**Checkpoint:** Quick UI pass to confirm Arrange flow feels good.

### Phase 7 — Foundry native Item drop integration
- [x] Accept native Item UUID drops on tables/panels; build SelectedFeature from `fromUuid`.
- [x] Apply routing rules; reject cross-actor with warning.
**Checkpoint:** Cross-actor warning path can be re-checked if behavior changes, but current flow exercised with native drops.

### Phase 8 — Styling/UX polish
- [ ] Drag-over highlights/placeholders for rows/cards (current visuals acceptable; revisit if UX polish cycle runs).
- [ ] Warnings/toasts for duplicate or cross-actor drops (logic present; confirm UX surface if polishing).
**Checkpoint:** Visual pass and confirm warning surfacing if a UX polish pass is scheduled.

### Phase 9 — Final regression
- [ ] Move/copy within/between plans and to reactions; Reaction-only → Turn Plan Additional; Action/Bonus-only → Reaction Additional.
- [ ] Shift-copy vs move.
- [ ] Context menu Move to/Copy to and Move > flows.
- [ ] Autosave fires once per operation.
**Checkpoint:** Run scenarios in Foundry; console clean.

## Testing Notes (Foundry console)
- Resolve an item:  
  `fromUuid('<uuid>').then(i => console.log(i));`
- Inspect actor turn-prep flag:  
  `game.actors.get('<actorId>').getFlag('<scope>', '<key>')`  
  (Use `FLAG_SCOPE` / `FLAG_KEY_DATA` constants.)
- Ensure Shift state is read at drop (`event.shiftKey`) for copy vs move.

## Edge Cases to Watch
- Duplicate prevention in same table.
- Cross-actor drops rejected gracefully.
- Missing/deleted item from UUID.
- Multi-activity items: Turn (Action > Bonus > Additional); Reaction (Reaction > Additional).
- Dropping on panel vs specific table (fallback to Additional if incompatible).
- Autosave debounce to avoid excessive writes.

## Handoff Tips
- Start with Phase 1 helpers before wiring UI.
- Implement submenu support (Phase 2) before feature-table menus.
- Keep array order authoritative; no extra sort keys unless added later.
- Maintain collapse/notes state when moving items (if touched).
- Use consistent drag payload shape and MIME for interoperability.