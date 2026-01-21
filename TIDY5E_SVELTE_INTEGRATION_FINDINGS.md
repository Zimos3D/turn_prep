# Tidy5e Svelte Integration Research Findings

## Executive Summary

After thorough examination of the Tidy5e codebase, I've determined **we've been approaching this problem correctly from the start**. Tidy5e compiles ALL their Svelte components into a single JavaScript bundle during their build process - they do NOT use raw .svelte files at runtime.

## Critical Discovery: How Tidy5e Actually Works

### Build Process
1. **vite.config.ts**: Uses `@sveltejs/vite-plugin-svelte` to compile ALL Svelte components
2. **svelte.config.js**: Configures `vitePreprocess()` for compilation
3. **Build Output**: Single `tidy5e-sheet.js` file (~large bundle with all compiled components)
4. **Entry Point**: `src/main.svelte.ts` imports and registers everything

```typescript
// vite.config.ts
plugins: [svelte({ configFile: '../svelte.config.js' })],
build: {
  lib: {
    entry: './main.svelte.ts',
    name: 'Tidy5e-Sheet-Kgar',
    fileName: 'tidy5e-sheet',
    formats: ['es'],
  },
}
```

### How Their API Works

**Key Insight**: When external modules use Tidy5e's API to register tabs, they're using Tidy5e's ALREADY-COMPILED Svelte runtime that was bundled during Tidy5e's build.

```typescript
// From TidySvelteApi.ts
export const TidySvelteApi = {
  framework: {
    getContext,    // Svelte's getContext from THEIR runtime
    setContext,    // Svelte's setContext from THEIR runtime
    mount,         // Svelte's mount from THEIR runtime
    unmount,       // Svelte's unmount from THEIR runtime
    SvelteMap,
    SvelteSet,
  },
};
```

**The Pattern**:
```typescript
// External module (like Drakkenheim) registers a tab
const contaminationTab = new api.models.SvelteTab({
  title: () => FoundryAdapter.localize('DRAKKENHEIM.CONTAMINATION.tab'),
  tabId: 'drakkenheim-contamination-tab',
  component: DrakkenheimCoreContaminationTab, // <-- THIS IS A COMPILED COMPONENT
  getContext(context: Map<string, any>) {
    return context;
  },
  iconClass: 'fa-solid fa-meteor',
});

api.registerCharacterTab(contaminationTab);
```

### The Mount Process

When Tidy5e renders a registered tab:

```typescript
// From TabContent.svelte
onMount(() => {
  if (tab.content.type !== 'svelte' || !tidyTab?.value) {
    return;
  }

  const props = tab.content.getProps?.(context) ?? {};
  const tabComponentContext = tab.content.getContext?.(allContexts) ?? allContexts;
  
  // THIS uses Tidy5e's compiled mount() function
  const svelteTabComponent = mount(tab.content.component, {
    target: tidyTab.value,
    context: tabComponentContext,
    props: props,
  });

  return () => {
    unmount(svelteTabComponent);
  };
});
```

## Why Raw .svelte Files Don't Work

1. **Browser Can't Import .svelte**: `.svelte` files are source code, not executable JavaScript
2. **MIME Type Error**: Server returns `application/octet-stream` for .svelte files
3. **No Runtime Compiler**: Svelte compiles at build time, not at runtime
4. **Module Resolution**: `import Component from './Component.svelte'` expects compiled JS output

## The Solution: We Need to Compile Our Components

### Option 1: Compile with Our Own Svelte Runtime (Won't Work)
- Creates dual runtime problem (already proven)
- Tidy5e's context/mount won't work with our compiled output
- Effect_orphan errors and Cannot read 'call' errors

### Option 2: Use Tidy5e's Svelte Runtime via API ✅

**This is what we need to do:**

1. **Compile our Svelte components with Tidy5e's runtime**
   - Import Tidy5e's mount/getContext/setContext via API
   - Use those in our component code instead of svelte's

2. **Register pre-compiled components**
   - Pass compiled component constructors to api.registerTab()
   - Not raw .svelte file references

3. **Key Files to Reference**:
   - `src/api/svelte/TidySvelteApi.ts` - Exports their Svelte runtime
   - `src/integration/modules/Drakkenheim/` - Working examples
   - `src/api/tab/SvelteTab.ts` - Tab registration model

## Recommended Approach

### Step 1: Use Tidy5e's Svelte Runtime in Our Code

```svelte
<script lang="ts">
  // Instead of:
  // import { getContext } from 'svelte';
  
  // Do this:
  const api = game.modules.get('tidy5e-sheet').api;
  const { getContext } = api.svelte.framework;
  
  let { actor }: Props = $props();
  
  // Now we can use Tidy5e components via their context
  const TidyTable = getContext('TidyTable');
  const TidyTableRow = getContext('TidyTableRow');
</script>
```

### Step 2: Build and Bundle Normally

```typescript
// vite.config.ts - Keep svelte plugin, compile as normal
plugins: [
  svelte({
    compilerOptions: {
      // Match Tidy5e's settings if needed
    }
  })
],
build: {
  // Bundle normally - output will be compiled JS
}
```

### Step 3: Register Using Tidy5e API

```typescript
// tidy-sheet-integration.ts
const api = game.modules.get('tidy5e-sheet').api;

// Import our COMPILED component
import DmQuestionsPanel from './components/DmQuestionsPanel.js'; // Note: .js not .svelte

const dmTab = new api.models.SvelteTab({
  tabId: 'turn-prep-dm-questions',
  title: 'DM Questions',
  component: DmQuestionsPanel, // Compiled component constructor
  getProps(context) {
    return {
      actor: context.actor
    };
  },
});

api.registerCharacterTab(dmTab);
```

## Testing This Approach

1. Modify `DmQuestionsPanel.svelte` to use Tidy5e's Svelte runtime
2. Update Vite config to compile (restore svelte plugin)
3. Import compiled .js output in integration file
4. Register tab with Tidy5e API
5. Test if Tidy5e's mount() accepts our compiled component

## Alternative: HTML + Tidy5e Components

If the above doesn't work (possible runtime version conflicts), we could:

1. Register HtmlTab instead of SvelteTab
2. In onRender, manually mount Tidy5e components using their API:

```typescript
const htmlTab = new api.models.HtmlTab({
  html: '<div id="dm-questions"></div>',
  tabId: 'turn-prep-dm-questions',
  onRender(params) {
    const container = params.element.querySelector('#dm-questions');
    const api = game.modules.get('tidy5e-sheet').api;
    
    // Use Tidy5e's mount with their components
    const TidyTable = api.components.TidyTable; // If exposed
    api.svelte.framework.mount(TidyTable, {
      target: container,
      props: { /* ... */ }
    });
  }
});
```

## Tidy5e Component Export Status

### CRITICAL FINDING: Components Are NOT Exported ❌

After exhaustive search of the Tidy5e codebase:

**What IS Exported (via `api`):**
```typescript
// TidySvelteApi.ts - Svelte runtime functions only
export const TidySvelteApi = {
  framework: {
    getContext,    // Svelte's getContext
    setContext,    // Svelte's setContext  
    mount,         // Svelte's mount
    unmount,       // Svelte's unmount
    SvelteMap,     // Svelte reactive map
    SvelteSet,     // Svelte reactive set
  }
};
```

**What is NOT Exported:**
- ❌ TidyTable component
- ❌ TidyTableRow component
- ❌ TidyTableCell component
- ❌ TidyTableHeaderRow component
- ❌ TidyTableHeaderCell component
- ❌ ANY Svelte components

**Evidence:**
- `src/api/index.ts` - No component exports, only types and APIs
- `src/api/Tidy5eSheetsApi.ts` - Only exposes:
  - `models` (HandlebarsTab, HtmlTab, SvelteTab, HandlebarsContent, HtmlContent)
  - `config` (various configuration APIs)
  - `constants` (SHEET_PARTS, etc.)
  - `svelte.framework` (runtime functions only)

**Component Locations (Internal Use Only):**
- `src/components/table-quadrone/TidyTable.svelte`
- `src/components/table-quadrone/TidyTableRow.svelte`
- `src/components/table-quadrone/TidyTableCell.svelte`
- `src/components/table/TidyTable.svelte` (Classic layout version)

These are compiled into Tidy5e's bundle and NOT exposed for external use.

## How Drakkenheim Module Works

### The Drakkenheim Pattern (CONFIRMED WORKING)

**Key Discovery**: Drakkenheim does NOT use Tidy5e components. They build their own simple Svelte components.

```typescript
// DrakkenheimCore.ts
const contaminationTab = new api.models.SvelteTab({
  title: () => FoundryAdapter.localize('DRAKKENHEIM.CONTAMINATION.tab'),
  tabId: 'drakkenheim-contamination-tab',
  component: DrakkenheimCoreContaminationTab, // <-- Their own compiled component
  getContext(context: Map<string, any>) {
    context ??= new Map<string, any>();
    context.set('drakkenheimVersion', getGameSetting(...));
    return context;
  },
  iconClass: 'fa-solid fa-meteor',
});

api.registerCharacterTab(contaminationTab);
api.registerNpcTab(contaminationTab);
```

**DrakkenheimCoreContaminationTab.svelte - Simple Custom Component:**
```svelte
<script lang="ts">
  import Pips from 'src/components/pips/Pips.svelte'; // Tidy5e internal component
  import { FoundryAdapter } from 'src/foundry/foundry-adapter';
  import { getSheetContext } from 'src/sheets/sheet-context.svelte';
  import { getContext } from 'svelte'; // Uses Svelte directly

  const context = $derived(getSheetContext<ActorSheetQuadroneContext>());
  const localize = FoundryAdapter.localize;
  
  let contaminationLevel = $derived(
    FoundryAdapter.getProperty<number | undefined>(
      context.actor,
      'flags.drakkenheim.contamination'
    ) ?? 0
  );
  
  let levels = Array.fromRange(6, 1);
</script>

<section class="contamination-tab">
  <Pips {...} />
  <!-- Simple custom UI, no TidyTable needed -->
</section>
```

**How They Avoid Dual Runtime:**
1. **Drakkenheim is INSIDE Tidy5e's repository** (`src/integration/modules/Drakkenheim/`)
2. They compile **with Tidy5e** during Tidy5e's build process
3. Their components become part of Tidy5e's single bundle
4. Result: Same Svelte runtime, no conflicts

**Build Process Evidence:**
```typescript
// vite.config.ts (Tidy5e)
plugins: [svelte({ configFile: '../svelte.config.js' })],
build: {
  lib: {
    entry: './main.svelte.ts',  // Includes integration modules
    name: 'Tidy5e-Sheet-Kgar',
    fileName: 'tidy5e-sheet',
    formats: ['es'],
  },
}
```

All integration modules (Drakkenheim, MCDM, Tasha's) compile as part of Tidy5e's build.

### What Drakkenheim Does NOT Do

❌ Does NOT use `TidyTable`, `TidyTableRow`, etc.
❌ Does NOT compile separately from Tidy5e  
❌ Does NOT try to import Tidy5e components
❌ Does NOT solve the dual runtime problem externally

They build **simple custom components** that fit their needs.

## MCDM Module Pattern (Also Internal)

Same pattern as Drakkenheim:
```typescript
// McdmClassBundle/McdmClassBundle.ts
const powersTab = new api.models.SvelteTab({
  title: 'Powers',
  tabId: 'mcdm-powers-tab', 
  component: McdmPowersTab, // Compiled with Tidy5e
});
```

**McdmPowersTab.svelte** - Uses Tidy5e's table components because it's **internal**:
```svelte
<script>
  import TidyTable from 'src/components/table-quadrone/TidyTable.svelte';
  import TidyTableRow from 'src/components/table-quadrone/TidyTableRow.svelte';
  // etc - these imports work because MCDM is inside Tidy5e's codebase
</script>
```

## The Brutal Truth

### For External Modules (Like Turn Prep):

**Option 1: Use Tidy5e Components**
- ❌ **IMPOSSIBLE** - Components not exported
- ❌ Cannot import `TidyTable` from outside Tidy5e
- ❌ Compiling separately = dual runtime errors

**Option 2: Compile Our Own Components**  
- ❌ **DUAL RUNTIME** - Creates separate Svelte instance
- ❌ Tidy5e's mount() incompatible with our compiled output
- ❌ Already proven to fail with effect_orphan errors

**Option 3: Raw .svelte Files**
- ❌ **BROWSER LIMITATION** - Cannot load .svelte as ES modules
- ❌ MIME type error (application/octet-stream)
- ❌ Already proven to fail

**Option 4: HTML Tab + Vanilla JS** ✅
- ✅ **ONLY WORKING OPTION** for external modules
- ❌ Cannot use Tidy5e components (not exported)
- ❌ Must build everything from scratch
- ❌ No access to TidyTable, TidyTableRow, etc.

## Can We Extend/Modify Tidy5e Components?

**Short Answer: NO** - They're not accessible.

Even if we could import them:
- Cannot extend Svelte components like classes
- Cannot modify compiled component output
- Could wrap in custom component, but still need access (which we don't have)

For search field in table header:
- Would need to build own table component
- OR request Tidy5e to add the feature
- OR build completely custom UI with vanilla JS

## Next Steps

### Immediate Reality Check

**THERE IS NO WAY** for an external module to:
1. Use Tidy5e's Svelte components
2. Compile Svelte separately without dual runtime errors  
3. Use raw .svelte files (browser limitation)

### Available Paths Forward

**Path 1: HTML Tab + Vanilla JS (Realistic)**
```typescript
const dmTab = new api.models.HtmlTab({
  tabId: 'turn-prep-dm-questions',
  title: 'DM Questions',
  html: '<div class="turn-prep-container">...</div>',
  onRender(params) {
    // Build UI with vanilla JS
    // Style to match Tidy5e aesthetically
    // No access to their components
  }
});
```

**Path 2: Request Tidy5e Enhancement (Long-term)**
- Open GitHub issue requesting component exports
- Suggest `api.components.TidyTable`, etc.
- Wait for Tidy5e developer to implement
- Probably months, not days

**Path 3: Fork Tidy5e (Nuclear Option)**
- Fork entire Tidy5e repository  
- Add Turn Prep as internal integration module
- Compile together (like Drakkenheim does)
- Maintain fork forever
- Extremely high maintenance burden

## Files Reviewed

- ✅ `src/api/index.ts` - Component exports (none found)
- ✅ `src/api/Tidy5eSheetsApi.ts` - Main API (no components)
- ✅ `src/api/svelte/TidySvelteApi.ts` - Svelte runtime only
- ✅ `src/integration/modules/Drakkenheim/` - Internal module pattern
- ✅ `src/integration/modules/McdmClassBundle/` - Internal module pattern  
- ✅ `src/integration/modules/DndTashasCauldron/` - Internal module pattern
- ✅ `src/components/table-quadrone/TidyTable.svelte` - Not exported
- ✅ `vite.config.ts` - Build configuration
- ✅ `svelte.config.js` - Svelte compilation config

## Conclusion

**The Harsh Reality:**

1. **Tidy5e does NOT export components** - Only runtime functions
2. **Drakkenheim "solves" this by being internal** - Compiles with Tidy5e
3. **External modules CANNOT use Tidy5e components** - No access
4. **Dual runtime is unavoidable for external Svelte** - Different builds = incompatible
5. **Our only option: HTML + vanilla JS** - Build everything ourselves

**Why This Matters:**

The user's requirement to "use Tidy5e components (TidyTable, etc.)" is **fundamentally impossible** for an external module. The components exist only within Tidy5e's compiled bundle and are not exposed via the API.

**Recommendation:**

Accept HTML + vanilla JS approach and:
- Style tables to match Tidy5e aesthetically using their CSS variables
- Build clean, simple UI that integrates visually
- Focus on functionality over perfect component reuse
- Consider requesting Tidy5e component export as future enhancement

# Addendum 1: 2026 Update - Svelte IS Possible (The "Item Piles" Pattern)

While the initial findings correctly identified that we cannot *reuse* Tidy5e's internal Svelte runtime or components, later investigation proved that **Svelte 5 can be bundled within our module** if configured correctly.

## The Solution Found
By adopting the pattern used by the **Item Piles** module:
1.  **Bundle Svelte Runtime**: We include our own Svelte 5 runtime in the module bundle.
2.  **Scope Styles**: We use `cssHash` in `vite.config.ts` to namespace our Svelte styles, preventing conflicts with Tidy5e's global styles.
3.  **Manual Mounting**: We use `HtmlTab` (instead of `SvelteTab`) to provide a raw DOM container, then manually mount our component using `mount(Component, { target: ... })`.

This allows us to write standard `.svelte` components and have them work inside Tidy5e without "dual runtime" errors crashing the application.

# Addendum 2: "Plugins" Investigation

Investigation into "Tidy5e Plugins" discussed on Discord reveals that "Plugin" is a **colloquial term**, not a separate technical architecture.

## Findings
1.  **No Plugin Architecture**: Tidy5e does NOT have a `registerPlugin` method or a special class of external modules with privileged access.
2.  **"Plugins" are just Modules**: When users refer to "plugins", they are referring to:
    *   **External Modules**: Standard Foundry modules (like ours) that use the public `api.registerCharacterTab`.
    *   **Internal Integrations**: Modules that are actually **bundled inside the Tidy5e repository** (like standard D&D 5e sheet features, or the Drakkenheim integration).
3.  **Privileged Access**: Only the *Internal Integrations* have access to `TidyTable` and `TidyTableRow` imports.
4.  **Conclusion**: Registering our module as a "Plugin" is not possible because no such registry exists for external code. The access limitations remain the same.

## Final Recommended Path
We must proceed as a standard External Module using the "Item Piles" pattern:
*   **Architecture**: Svelte 5 + HtmlTab + Manual Mount.
*   **Components**: Build custom components that *mimic* the HTML structure and CSS classes of Tidy5e (`.tidy-table`, `.tidy-table-row`) to achieve Visual Integration, even without Code Integration.
