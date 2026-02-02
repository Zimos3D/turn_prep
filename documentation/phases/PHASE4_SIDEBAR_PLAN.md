# Phase 4 Sidebar Plan — Favorites & Recent Turn Plans

**Goal**: Build the sidebar tab that shows Favorite Turn Plans, Favorite Reaction Plans, and Recent Turn Plans in one vertically scrollable view with collapsible sections for focus.

## Scope
- Main sidebar tab content (HTML/Svelte mount pattern already established for tabs).
- Data sources: actor flags via TurnPrepAPI (favorites + recent snapshots created by Save / Save & Clear actions).
- No chat roll capture, no initiative hooks, no combat state dependencies.

## Deliverables
- Sidebar layout with three collapsible sections: Favorites (turn plans), Favorites (reaction plans), Recent Turn Plans.
- Card components for plan snapshots (summary + expanded details, load + context menu actions).
- Data loading + persistence wiring to TurnPrepAPI.
- LESS styles aligned with Tidy5e look.
- Localization keys for all labels, buttons, tooltips.

## Implementation Outline
- **Component Structure**: HistoryFavoritesPanel.svelte → FavoritesTurnSection, FavoritesReactionSection, RecentSection; shared PlanCard.
- **Data Flow**: load favorites/recent on mount; refresh on relevant events (favorite toggle, save, delete); prune recent list to limit.
- **Actions**: load to current plan, duplicate (favorites only), edit, delete, favorite toggle; future-safe hooks for navigation from context menu.
- **Styling**: reuse Tidy5e spacing, borders, and ellipsis/context menu patterns; ensure mobile-friendly vertical scroll.

## Decisions (from user responses)
- Section order: Favorites (turn) → Favorites (reaction) → Recent.
- Sections: keep collapsible headers with hover-visible arrow; cards themselves do not expand.
- Card layout (all lists):
  - Title: plan name (or reaction trigger used as title) bold + underlined, paragraph size.
  - Rows: italic labels "Action:", "Bonus Actions:", "Additional Features:" with inline item links (Foundry enrich HTML). Items wrap inline; examples: `@UUID[Actor.S1Z0NuEkyQaVKws7.Item.ykJ1kH5a5HvuvvDJ]{Booming Blade}`.
  - Right side: vertical ellipsis for context menu.
  - No expanded body, no notes section.
- Context menu entries: Load; Delete; Duplicate; Edit (stub/not yet implemented); Favorite toggle (Recent only). Use existing icons from other context menus.
- Headers: titles only; icons — fa-hourglass (Favorite Turns), fa-retweet (Favorite Reactions), fa-history (Recent Turns).
- Style: compact padding; card borders only (no dividers); background colors — accent for favorite turns, lighter default for reactions, darker default for recent turns.
- Behavior: loading adds a new plan at the bottom of current turn plans (does not switch tabs); duplicate creates a new favorite; delete requires confirmation for all.
- Ordering: Recent list newest-first; no timestamps shown.
- Empty states: leave blank space under headers (no CTA/illustration).
- Scroll: standard (non-sticky) headers; OK for context menu to overlap content.
- Favorite indicator: no star on favorites cards (location implies favorite).
- Favoriting a recent plan keeps it in Recent and also shows in Favorites.
- Section headers start expanded by default; remember collapse state within the session if feasible.
- Missing items: display stored names via enrich; rely on Foundry’s default hover behavior if item missing.
- Context menu access via Tidy5e ellipsis, both click and right-click.

## Finalized Assumptions
- Recent Turn Plans limited by setting (default 10), newest-first.
- Favorites unbounded, grouped by type (turn vs reaction).
- Loading a card adds as a new plan at the bottom of current turn plans.
- Missing items rely on stored name/enrich; Foundry handles missing-link hover state.
- Context menu uses standard Tidy5e ellipsis control (right-click and icon).
