# Tidy5e Render Notes

## Context
- Turn Prep runs inside Tidy5e sheets (`api.models.HtmlTab`) and mounts Svelte components via `api.svelte.framework.mount()`.
- Foundry re-renders the owning sheet whenever actor data mutates, even if the update uses `Actor.setFlag(scope, key, value)` with `render: false` (this option is not exposed on `setFlag`).
- By default, Tidy5e treats HtmlTabs as `renderScheme: 'handlebars'`, so each render cycle replaces the tab contents markup entirely. When this happens, any mounted Svelte component loses focus/scroll state because the DOM node vanishes and remounts.

## Fix Applied (Jan 2026)
1. In [src/sheets/tidy5e/tidy-sheet-integration.ts](../src/sheets/tidy5e/tidy-sheet-integration.ts), the Turn Prep tab registration now sets `renderScheme: 'force'` when constructing the HtmlTab.
2. With `renderScheme: 'force'`, Tidy5e skips replacing the tab contents on incremental renders and only injects HTML during the initial render (or a forced refresh). This keeps the tab’s DOM subtree intact between actor updates.
3. Because the DOM stays mounted, the existing Svelte component retains focus, cached scroll positions, and collapse state. We still listen to Tidy’s `onRender` hook to react to sheet-level events if needed.

## When To Reuse This Pattern
- Any HtmlTab that mounts its own reactive UI (Svelte/React/etc.) should opt into `renderScheme: 'force'` to avoid being torn down by Tidy’s change detection.
- If you need to respond to actor data updates without remounting, subscribe to Foundry hooks (e.g., `updateActor`) inside the component and update local state instead of relying on Tidy to rerender HTML.

## Troubleshooting Checklist
1. **Symptoms**: textareas lose focus, scroll resets to top, context menus close unexpectedly after autosave.
2. **Confirm**: set breakpoints/logs in `tidy-sheet-integration.ts` `onRender`. If it fires repeatedly for the same actor during typing, Tidy is re-rendering the tab.
3. **Solution**: ensure the tab registration sets `renderScheme: 'force'`. If it already does, verify no other code calls `element.innerHTML = ...` on the tab container.
4. **Fallback**: if a forced re-render is required (e.g., tab markup depends on actor data), keep `renderScheme: 'handlebars'` but add UI-state caching + scroll restoration in the component (see [src/sheets/components/TurnPlansPanel.svelte](../src/sheets/components/TurnPlansPanel.svelte)).

## Notes on Foundry `setFlag`
- `Document.setFlag(scope, key, value)` does **not** accept an options hash; updates always propagate through the sheet render pipeline.
- To minimize render churn, debounce autosaves and compare the serialized flag payload. Ignore `updateActor` events whose flag payload matches the last saved signature (as done in `TurnPlansPanel`).

## References
- Foundry V13 API: [`Document.update`](https://foundryvtt.com/api/classes/foundry.abstract.Document.html#update) and [`DatabaseUpdateOperation.render`](https://foundryvtt.com/api/interfaces/foundry.abstract.types.DatabaseUpdateOperation.html) for background on render options.
- Tidy5e source: `src/api/tab/HtmlTab.ts` shows `renderScheme` defaulting to `handlebars` for Html tabs, so overriding it is essential when embedding dynamic apps.
