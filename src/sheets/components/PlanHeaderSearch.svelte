<script lang="ts">
  import { scale } from 'svelte/transition';
  import { FoundryAdapter } from '../../foundry/FoundryAdapter';
  import type { SelectedFeature } from '../../types/turn-prep.types';

  type Props = {
    actor: any;
    onSelect: (feature: SelectedFeature) => void;
  };

  let { actor, onSelect }: Props = $props();

  let searchText = $state('');
  let results = $state<{ feature: SelectedFeature; enriched: string; id: string }[]>([]);
  let showResults = $state(false);
  let loading = $state(false);
  let searchInput: HTMLInputElement | null = null;
  let searchContainer: HTMLElement | null = $state(null);
  let searchTimeout: any = null;

  async function performSearch() {
    if (!actor) return;
    loading = true;
    
    try {
      const term = searchText.toLowerCase();
      
      // Filter items
      const allItems = actor.items.filter((i: any) => {
         const name = i.name?.toLowerCase() ?? '';
         return name.includes(term);
      });

      const matches: { feature: SelectedFeature; enriched: string; id: string }[] = [];
      const MAX_RESULTS = 20;
      
      for (const item of allItems) {
        if (matches.length >= MAX_RESULTS) break;

        const actionType = item.system?.activation?.type ?? ''; 
        
        const feature: SelectedFeature = {
          itemId: item.id,
          itemName: item.name,
          itemType: item.type,
          actionType: actionType
        };
        
        // Enrich HTML for display (pseudo-rendering item link)
        // We use the same format as Sidebar favorites: @UUID[...]
        const raw = `@UUID[${item.uuid}]{${item.name}}`;
        const enriched = await FoundryAdapter.enrichHtml(raw, { async: true }) ?? raw;
        
        matches.push({ feature, enriched, id: item.id });
      }

      results = matches;
      showResults = matches.length > 0;

    } catch (e) {
      console.error('Search failed', e);
      results = [];
    } finally {
      loading = false;
    }
  }

  function handleInput() {
    if (searchTimeout) clearTimeout(searchTimeout);
    
    if (searchText.length < 2) {
      results = [];
      showResults = false;
      return;
    }
    
    // Debounce slightly
    searchTimeout = setTimeout(() => {
        void performSearch();
    }, 300);
  }

  function selectItem(match: { feature: SelectedFeature }) {
    onSelect(match.feature);
    searchText = '';
    showResults = false;
    results = [];
  }
  
  // Using onmousedown to trigger before blur
  function handleResultClick(match: { feature: SelectedFeature }) {
      selectItem(match);
  }

  function handleBlur(event: FocusEvent) {
     // Check if focus moved to our results
     // This is tricky with shadow DOM or specific events but basic approach:
     // If we click the result button, mousedown fires before blur.
     // So we can use a timeout to close.
     setTimeout(() => {
         showResults = false;
     }, 200);
  }
  
  function handleFocus() {
    if (searchText.length >= 2) {
        if (results.length > 0) showResults = true;
        else void performSearch();
    }
  }

</script>

<div class="turn-prep-search" bind:this={searchContainer}>
    <div class="turn-prep-search__field">
        <input
            type="text"
            class="turn-prep-input turn-prep-search__input"
            bind:this={searchInput}
            bind:value={searchText}
            placeholder={FoundryAdapter.localize('TURN_PREP.Common.SearchPlaceholder') || 'Search Features'}
            oninput={handleInput}
            onblur={handleBlur}
            onfocus={handleFocus}
        />
        <i class="fas fa-search turn-prep-search__icon"></i>
    </div>
    
    {#if showResults}
        <div class="turn-prep-search__results" transition:scale={{ duration: 100, start: 0.95 }}>
            {#if loading}
                <div class="turn-prep-search__loading">{FoundryAdapter.localize('TURN_PREP.Common.Loading')}</div>
            {:else if results.length === 0}
                 <div class="turn-prep-search__empty">No results</div>
            {:else}
                <ul class="turn-prep-search__list">
                    {#each results as match (match.id)}
                        <li class="turn-prep-search__item">
                            <button 
                                type="button" 
                                class="turn-prep-search__result-btn"
                                onmousedown={() => handleResultClick(match)}
                            >
                                {@html match.enriched}
                            </button>
                        </li>
                    {/each}
                </ul>
            {/if}
        </div>
    {/if}
</div>

<style lang="less">
    .turn-prep-search {
        position: relative;
        /* Component fills its container. Parent sets width/flex. */
        width: 100%;
    }

    .turn-prep-search__field {
        position: relative;
        width: 100%;
        height: 100%;
    }

    .turn-prep-search__input {
        width: 100%;
        height: 100%; 
        padding-right: 2rem; /* Make room for the search icon */
    }

    .turn-prep-search__icon {
        position: absolute;
        right: 0.5rem;
        top: 50%;
        transform: translateY(-50%);
        color: var(--t5e-text-muted-color, #888);
        pointer-events: none;
        font-size: 0.9rem;
    }

    .turn-prep-search__results {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: var(--t5e-background-200, #222);
        border: 1px solid var(--t5e-border-color, #444);
        border-radius: 0.25rem;
        max-height: 10rem; /* roughly 5 lines at 2rem per line */
        overflow-y: auto;
        z-index: 100;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        margin-top: 2px;
    }

    .turn-prep-search__list {
        list-style: none;
        margin: 0;
        padding: 0;
    }
        
    .turn-prep-search__item {
        border-bottom: 1px solid var(--t5e-border-little-light, rgba(255,255,255,0.05));
    }
    
    .turn-prep-search__item:last-child {
        border-bottom: none;
    }

    .turn-prep-search__result-btn {
        display: block;
        width: 100%;
        text-align: left;
        padding: 0.25rem 0.5rem;
        background: transparent;
        border: none;
        color: var(--t5e-text-color, inherit);
        cursor: pointer;
        font-size: 0.9rem;
        line-height: 1.5rem; 
        min-height: 2rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        
        &:hover, &:focus {
            background: var(--turn-prep-highlight, rgba(255,255,255,0.15));
            outline: none;
        }
        
        /* Ensure enriched content doesn't break layout or intercept clicks */
        :global(a.content-link) {
            pointer-events: none !important; 
            text-decoration: none !important;
            color: inherit !important;
            background: transparent !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
        }
            :global(.content-link > i) {
            margin-right: 0.25rem;
        }
    }

    .turn-prep-search__loading,
    .turn-prep-search__empty {
        padding: 0.5rem;
        color: var(--t5e-text-muted-color, #888);
        font-style: italic;
        text-align: center;
    }
</style>