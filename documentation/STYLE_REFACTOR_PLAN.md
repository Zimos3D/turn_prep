# Turn Prep Panel Styling Refactor Plan

## Objectives
- Normalize shared layout/styling primitives across DM Questions, Turn Plans, and Reaction Plans so spacing adjustments can be made once.
- Move reusable selectors out of component-scoped `<style>` tags and into `styles/components/panels.less`, which is already imported by `styles/turn-prep.less`.
- Keep panel-specific/structural rules close to their markup when they are unique, but document which ones should remain inline.
- Align the newer Reaction panel spacings/paddings with the compaction work already performed on DM Questions and Turn Plans.

## Architectural Guidance
- **Shared primitives belong in LESS:** Elements repeated across panels (panel containers, headers, common buttons, lists, cards, collapsible sections) should live in `styles/components/panels.less`. This ensures a single-source-of-truth for vertical rhythm tweaks.
- **Component-unique selectors can stay inline:** When a rule only affects a single component and is tightly coupled to its markup (e.g., DM question action buttons, Turn Plan feature grids), keeping it inside the Svelte file keeps intent local. The key is to keep inline sections minimal and clearly separated from shared foundations.
- **Use composition instead of overrides:** After introducing shared classes, components should layer only the deltas they genuinely need, avoiding per-panel overrides of core values where possible.

## Current Redundancy Audit
| Selector | DM Questions ([src/sheets/components/DmQuestionsPanel.svelte](src/sheets/components/DmQuestionsPanel.svelte)) | Turn Plans ([src/sheets/components/TurnPlansPanel.svelte](src/sheets/components/TurnPlansPanel.svelte)) | Reaction Plans ([src/sheets/components/ReactionPlansPanel.svelte](src/sheets/components/ReactionPlansPanel.svelte)) | Notes |
| --- | --- | --- | --- | --- |
| `.turn-prep-panel-header` | Yes | Yes | Yes | Identical flex layout intent but differing gaps/padding/margins. |
| `.turn-prep-panel-toggle` | Yes | Yes | Yes | Same behavior, only border width differs. |
| `.turn-prep-panel-action-btn` | Yes | Yes | Yes | Same styling, Reaction panel adds `margin-left: auto`. |
| Panel wrapper (`.turn-prep-dm-questions`, `.turn-plans-panel`, `.reaction-plans-panel`) | Yes | Yes | Yes | Only purpose is padding/margin; should share a base `.turn-prep-panel`. |
| List containers (`.questions-list`, `.turn-plans-list`, `.reaction-plans-list`) | Yes | Yes | Yes | All are column flex w/ gaps; gap values vary (0.25–1rem). |
| Card containers (`.question-row`, `.turn-plan-card`, `.reaction-card`) | Yes | Yes | Yes | Each defines background, border, radius, padding w/ minor differences. |
| Loading/empty states (`.turn-plans-loading`, `.reaction-plans-loading`, `.turn-plans-empty`, `.reaction-plans-empty`) | Present | Present | Present | Could be unified into `.turn-prep-panel-loading` / `.turn-prep-panel-empty`. |

## Proposed `styles/components/panels.less` Structure
1. **Base Panel Wrapper**
   - `.turn-prep-panel` (padding, background inheritance, max-width behaviors as needed).
   - Modifier classes for compact vs default spacing if required later.
2. **Header Block**
   - `.turn-prep-panel-header` with consistent padding (`0.25rem 0.5rem` per DM/Turn), small gap, border radius, accent background.
   - `.turn-prep-panel-header h3` shared typography.
   - `.turn-prep-panel-toggle` for chevron button (use thinner `1px`/`2px` border to keep compact look, applied once).
   - `.turn-prep-panel-action-btn` for header actions; include `margin-left: auto` so every panel auto-aligns the CTA to the right.
3. **Panel Body Utility Classes**
   - `.turn-prep-panel-list` for column flex wrappers with configurable gaps (set default `0.5rem`, allow `data-gap="tight"` attribute or modifier class if Reaction needs different spacing).
   - `.turn-prep-panel-card` for shared card chrome (background, border, radius, padding). Specific panels can extend via descendant selectors.
   - `.turn-prep-panel-empty` and `.turn-prep-panel-loading` for centered text blocks with consistent padding and tertiary color.
4. **Form Fieldset Utilities**
   - `.turn-prep-field` (column flex, label styles) used in Turn + Reaction when input stacks appear.
   - `.turn-prep-input` / `.turn-prep-textarea` hook classes that can reuse the rules currently repeated.
5. **Collapsible Notes / Inline Label Rows**
   - `.turn-prep-inline-label-row` to cover Reaction’s trigger label + input line, potentially re-used later.
   - `.turn-prep-collapsible-notes` for the shared border + toggle pattern used by Reaction notes and (future) other panels.

## Classes to Extract into LESS
| New LESS Rule | Existing Selectors to Migrate | Target Usage |
| --- | --- | --- |
| `.turn-prep-panel` | `.turn-prep-dm-questions`, `.turn-plans-panel`, `.reaction-plans-panel` (container padding) | Wraps each panel container; set base padding ~`0.5rem`. |
| `.turn-prep-panel-header` | Header styles from all three panels | Shared flex header block. |
| `.turn-prep-panel-toggle` | Toggle button styles from all three | Collapsible chevron button. |
| `.turn-prep-panel-action-btn` | Action button styles from all three + Reaction’s `margin-left` override | CTA alignment and styling. |
| `.turn-prep-panel-list` | `.questions-list`, `.turn-plans-list`, `.reaction-plans-list` | Unified column list spacing with optional modifier classes (`.is-compact`, `.is-roomy`). |
| `.turn-prep-panel-card` | `.question-row`, `.turn-plan-card`, `.reaction-card` (base chrome only) | Shared card background/border/padding. Unique layout stays per component. |
| `.turn-prep-panel-empty` | `.turn-plans-empty`, `.reaction-plans-empty` (and future DM empty state if added) | Consistent empty messaging. |
| `.turn-prep-panel-loading` | `.turn-plans-loading`, `.reaction-plans-loading` | Consistent loading presentation. |
| `.turn-prep-field`, `.turn-prep-field label`, `.turn-prep-input`, `.turn-prep-textarea` | `.plan-field` input styles, Reaction name input focus rule | Shared form field styling. |
| `.turn-prep-inline-label-row` | `.reaction-name-row` | Inline label/input layout.
| `.turn-prep-collapsible` + `.turn-prep-collapsible__toggle`, `.turn-prep-collapsible__body` | `.reaction-notes`, `.notes-toggle`, `.notes-input` | Provides reusable pattern for collapsible note sections.

## Panel-Specific Styles to Keep Inline (but Document)
- **DM Questions**
  - `.questions-list` becomes `.turn-prep-panel-list` usage; only keep unique grid layout for `.question-row` (grid columns, action button column) and `.question-actions button` color variations tied to whisper/chat/remove semantics.
  - `.question-inputs` vertical stacking remains local (only DM panel needs dual inputs side-by-side).
- **Turn Plans**
  - `.turn-plan-card` extends `.turn-prep-panel-card`; keep nested `.plan-header`, `.plan-content`, `.plan-feature-sections`, `.plan-field` variations because they mirror Turn Plan data structure.
  - Table spacing integration with `TurnPlanFeatureTable` stays local.
- **Reaction Plans**
  - `.reaction-card` extends `.turn-prep-panel-card`; keep `.reaction-name-row` (or rename to `.turn-prep-inline-label-row` usage), `.reaction-notes`, `.notes-toggle`, `.notes-input` but migrate shared chrome to collapsible utility.
  - `.reaction-plans-panel :global(.turn-prep-panel-action-btn)` override goes away once shared header handles CTA alignment.

## Reaction Panel Alignment Tasks
1. Reduce `.reaction-plans-panel` padding from `1rem` to the shared `0.5rem` once `.turn-prep-panel` is applied.
2. Lower `.reaction-plans-list` gap from `1rem` to match `.turn-prep-panel-list` default (`0.5rem`), unless a modifier class explicitly opts into wider spacing.
3. Ensure `.reaction-card` uses the same padding (`0.5rem`) as `.turn-plan-card` after the shared card style is applied; keep any extra spacing (e.g., `gap: 0.75rem`) only where necessary.
4. Verify typography sizes for reaction inputs (currently `0.95rem`) align with Turn Plan/DM defaults (`0.9–1rem`).

## Implementation Steps (Post-Approval)
1. **Author shared LESS rules**
   - Expand `styles/components/panels.less` with the sections listed above, using LESS variables from `styles/variables.less` for colors and spacings.
   - Include mixins or modifier classes for compact vs roomy spacing if needed for future iterations.
2. **Update panel containers**
   - Apply `.turn-prep-panel` class to wrappers in [DmQuestionsPanel](src/sheets/components/DmQuestionsPanel.svelte), [TurnPlansPanel](src/sheets/components/TurnPlansPanel.svelte), and [ReactionPlansPanel](src/sheets/components/ReactionPlansPanel.svelte), removing redundant padding declarations.
3. **Replace inline header/toggle/action styles**
   - Remove duplicated header/toggle/action button rules from each component’s `<style>` block once the shared LESS classes exist.
   - Ensure Reaction header no longer needs a custom `:global(.turn-prep-panel-action-btn)` override because the shared rule handles right alignment.
4. **Adopt shared list/card utilities**
   - Swap `.questions-list`, `.turn-plans-list`, `.reaction-plans-list` definitions for `.turn-prep-panel-list`, keeping only per-panel modifiers if the layout deviates (e.g., Turn Plan gap `0.25rem`).
   - Wrap `.question-row`, `.turn-plan-card`, `.reaction-card` in `.turn-prep-panel-card`, then leave only unique grid/flex rules inline.
5. **Hook shared form styles**
   - Apply `.turn-prep-field` + `.turn-prep-input` / `.turn-prep-textarea` classes to Turn Plan form controls and Reaction name input so focus/spacing is uniform.
6. **Introduce collapsible utility**
   - Define `.turn-prep-collapsible` styles in LESS; update Reaction notes markup to use the shared classes.
   - Consider using the same utility later for Turn Plan movement/roleplay sections if collapsible behavior is desired.
7. **Prune leftover inline styles**
   - Keep only structurally unique selectors within each Svelte file (documented above) to minimize future adjustments.

## Open Questions / Items to Confirm with Stakeholders
1. **Spacing presets:** Should we introduce named spacing tokens (`--turn-prep-gap-tight`, etc.) to enable quick experimentation with compact vs roomy layouts?

    ### Answer
    I don't think we need to accommodate two versions of spacing here. The player is always going to want to maximize what they can see without scrolling (within reason). Also, the rest of the sheet does seem to prioritize this as well, so this will help the sheeet feel more consistent.

2. **Legacy browser support:** Are there constraints (e.g., Foundry version) that limit newer CSS features (like logical properties) before codifying them in shared LESS?

    ### Answer
    I'm developing for the current FOundry  version which is 13. I encourage you to do some searches to check its docs about that. I am not interested in testing for and supporting older versions. 

3. **Rollout strategy:** Should we refactor panels incrementally (one per PR) or in a single change set to avoid inconsistent states during testing?

    ### Answer
    Let's do one big edit and then test and check everything.

Once approved, we can proceed to implement the shared LESS rules and trim the component-local `<style>` sections accordingly.
