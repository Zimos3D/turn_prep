# Tidy5e & Svelte Integration Solution

## The "Item Piles" Pattern

Contrary to initial findings, it is **possible** (and recommended) to use Svelte for external Tidy5e modules. The key logic is derived from how **Item Piles** integrates.

### 1. The Build Configuration (`vite.config.ts`)
We must **bundle our own Svelte runtime** rather than trying to use Tidy's. To avoid conflicts, we use `cssHash` to scope our styles.

```typescript
plugins: [
  svelte({
    compilerOptions: {
      // Unique hash prevents style collisions with Tidy5e's own Svelte components
      cssHash: ({ hash, css }) => `svelte-tp-${hash(css)}`
    }
  })
]
```

### 2. The Integration Logic (`tidy-sheet-integration.ts`)
We use `HtmlTab` to create a container, then **manually mount** our bundled Svelte component into it.

```typescript
import { mount } from 'svelte';
import MyComponent from './MyComponent.svelte';

api.registerCharacterTab(
  new api.models.HtmlTab({
    // ...
    html: '<div id="my-root"></div>',
    onRender: ({ element, data }) => {
      mount(MyComponent, {
        target: element.querySelector('#my-root'),
        props: { actor: data.actor }
      });
    }
  })
);
```

### 3. Tidy5e Components
**Limitation:** We still cannot import `TidyTable` or `TidyTableRow` as they are internal to Tidy5e and not exported.
**Solution:** Build custom components that mimic Tidy's structure using their CSS classes and variables (`var(--t5e-primary-color)`).

### Status
- ✅ `vite.config.ts` updated to bundle Svelte 5.
- ✅ `tidy-sheet-integration.ts` updated to use the `HtmlTab` + `mount` pattern.
- ✅ `main.ts` updated to include styles.
- ✅ `module.json` updated to reference generated CSS.
- ✅ Project builds successfully.

You can now develop using standard `.svelte` files!
