# Search Feature Refinements

## Overview
Refined the search feature based on user feedback to improve layout, usability, and visual consistency.

## Changes
1.  **Localization & Icon**:
    - Added localization key `TURN_PREP.Common.SearchPlaceholder` ("Search Features").
    - Added a magnifying glass icon (`fas fa-search`) inside the search input on the right side.
    - Updated placeholder text to "Search Features" (via localization).

2.  **Layout Adjustment (70/30)**:
    - Adjusted the flex distribution in `TurnPlansPanel` and `ReactionPlansPanel` to give 70% width to the plan/reaction name and 30% to the search bar. This provides more room for names and a more compact search bar.

3.  **Search Results UI**:
    - Ensured search result items are full-width clickable buttons.
    - Removed default Foundry styling (borders/backgrounds) from the inner enriched HTML links (`content-link`) using `!important` to prevent "outline" artifacts.
    - Added hover highlight to the entire row/button.

## Files Updated
- `public/lang/en.json`: Key added.
- `src/sheets/components/TurnPlansPanel.svelte`: CSS flex update.
- `src/sheets/components/ReactionPlansPanel.svelte`: CSS flex update.
- `src/sheets/components/PlanHeaderSearch.svelte`: Markup (icon), CSS (icon positioning,result styling).

## Verification
- Build passed with no warnings.
- Layout and styling code reviewed for consistency.
