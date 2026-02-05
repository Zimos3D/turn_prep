# Tidy5e & Svelte Integration Solution

## ✅ The "Item Piles" Pattern (WORKING)

After extensive research, we discovered it **IS possible** to use Svelte 5 with Tidy5e modules! The key pattern is derived from how **Item Piles** integrates.

---

## The Working Solution

### 1. The Build Configuration (`vite.config.ts`)
We must **bundle our own Svelte runtime** rather than trying to use Tidy's. To avoid CSS conflicts, we use `cssHash` to scope our styles.

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
    title: 'My Tab',
    tabId: 'my-tab-id',
    html: '<div id="my-root"></div>',
    enabled: (data) => true,
    onRender: ({ element, data }) => {
      const component = mount(MyComponent, {
        target: element.querySelector('#my-root'),
        props: { actor: data.actor }
      });
    }
  })
);
```

### 3. Tidy5e Components & Styling
**Limitation:** We cannot import `TidyTable`, `TidyTableRow`, etc. as they are internal to Tidy5e and not exported.

**Solution:** Build custom components that mimic Tidy's structure using their CSS classes and variables:
- CSS Variables: `var(--t5e-primary-color)`, `var(--t5e-faint-color)`, etc.
- CSS Classes: `.tidy5e-sheet`, `.items-list`, `.item`, etc.

---

## ❌ What DOESN'T Work (Critical Warnings!)

### DON'T: Use SvelteTab with Compiled Components
```typescript
// ❌ THIS WILL FAIL - Dual runtime conflict!
api.registerCharacterTab(
  new api.models.SvelteTab({
    component: MyCompiledSvelteComponent  // CRASHES with undefined errors
  })
);
```

**Why it fails**: 
- Tidy5e bundles its own Svelte runtime
- Your module bundles a separate Svelte runtime
- SvelteTab tries to mount with Tidy5e's runtime
- Your component expects YOUR runtime's functions
- Result: `TypeError: Cannot read properties of undefined (reading 'call')`

### DON'T: Try to Externalize Svelte in Build Config
```typescript
// ❌ THIS DOESN'T WORK - Has no effect
rollupOptions: {
  external: ['svelte', 'svelte/internal']  // Compiler ignores this!
}
```

**Why it fails**:
- Vite's `external` only works for `import` statements
- Svelte compiler generates inline runtime code, not imports
- No imports = nothing to externalize

### DON'T: Try to Import Tidy5e's Internal Components
```typescript
// ❌ THIS DOESN'T EXIST - Not exported
import { TidyTable, TidyTableRow } from '@tidy5e-sheet/api';
```

**Why it fails**:
- Tidy5e only exports API functions/models
- Svelte components are internal implementation details
- Not available in public API

**What IS available**:
- `api.models.*` (HtmlTab, SvelteTab classes)
- `api.registerCharacterTab()`
- `api.svelte.framework` (mount/unmount functions)
- CSS variables and classes

---

## Implementation Checklist

### Status
- ✅ `vite.config.ts` updated to bundle Svelte 5 with cssHash
- ✅ `tidy-sheet-integration.ts` uses `HtmlTab` + `mount` pattern
- ✅ `main.ts` updated to include styles
- ✅ `module.json` updated to reference generated CSS
- ✅ Project builds successfully
- ✅ Full Svelte 5 reactivity ($state, $derived, $effect) available

### You Can Now:
- ✅ Develop using standard `.svelte` files
- ✅ Use all Svelte 5 runes and features
- ✅ Build reactive components with proper state management
- ✅ Style with Tidy5e CSS variables for theming
- ✅ Have full TypeScript support and type safety

---

## Further Reading

- **RESEARCH_FINDINGS.md** - Complete technical explanation of dual runtime issue
- **PHASE4_IMPLEMENTATION_PLAN.md** - Updated with warnings and best practices
- **ARCHITECTURE.md** - Overall module architecture with Tidy5e integration notes
