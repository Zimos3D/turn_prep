# Turn Prep Drag & Drop and Context Menu Plan (Foundry V13)

## Purpose
Central plan for enabling drag/drop + context-menu move/copy/reorder for Turn Prep (Turn Plans, Reactions, DM Questions) with activation-aware routing and Foundry-native item drops. Use this as the handoff doc for new agents.

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
**Status:** Implemented; needs UI/console sanity once drops are wired.

### Phase 2 — ContextMenuHost submenu support
- [x] Nested/secondary menus, positioning, hover/click open, Escape/blur close all.
- [x] Keyboard focus within menus.
**Status:** Implemented; pending in-UI verification of submenu open/close/focus.

### Phase 3 — TurnPlanFeatureTable drag/drop + menus
- [x] Rows draggable with custom payload + UUID (awaiting parent wiring to consume events).
- [x] Accept drops: reorder same-table; incoming from other tables/plans/native items (emits callbacks).
- [x] Emit move/copy/reorder events upward (parent integration pending).
- [x] Row context menu: Move to > / Copy to > (submenu hooks), Up/Down/Top/Bottom.
- [x] Drag-over highlight + placeholder index.
**Status:** Implemented in component; needs parent wiring and in-UI testing of drop/reorder and menus.

### Phase 4 — TurnPlansPanel handling
- [~] Drop routing (Action > Bonus > Additional), same-actor guard, duplicate guard wired in panel handlers (needs UI test).
- [~] Move/copy across plans via table menus and drops; remove from source on move (needs UI test).
- [ ] Reorder plans (drag + “Move >” up/down/top/bottom).
- [ ] Autosave/debounce after changes (panel calls scheduleAutoSave after mutations; verify timing).
**Checkpoint:** Drag row Plan A → Plan B; Shift-copy vs move; reorder plans; autosave once per op. Pending UI test.

### Phase 5 — ReactionPlansPanel handling
- [ ] Routing (Reaction > Additional), same-actor/duplicate guards.
- [ ] Reorder reaction cards; context menu moves; autosave.
**Checkpoint:** Drop Action-only item on Reaction panel → Additional; Reaction item → Reaction table; reorder reaction cards.

### Phase 6 — DMQuestionsPanel
- [ ] Add drag/reorder for DMQ cards.
- [ ] Add “Move >” (Up/Down/Top/Bottom) context menu.
**Checkpoint:** Reorder DM Questions by drag and menu.

### Phase 7 — Foundry native Item drop integration
- [ ] Accept native Item UUID drops on tables/panels; build SelectedFeature from `fromUuid`.
- [ ] Apply routing rules; reject cross-actor with warning.
**Checkpoint:** Drag Item from sidebar onto Turn Plan table and Reaction panel; ensure placement; cross-actor rejected.

### Phase 8 — Styling/UX polish
- [ ] Drag-over highlights/placeholders for rows/cards.
- [ ] Warnings/toasts for duplicate or cross-actor drops.
**Checkpoint:** Visual pass; warnings show and drop ignored when duplicate/cross-actor.

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