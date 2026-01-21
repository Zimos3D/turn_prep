<script lang="ts">
  /**
   * Turn Prep Main Tab Wrapper
   * 
   * Main tab component that wraps the DM Questions and future panels.
   * This is the primary interface mounted in the Tidy5e main tab area.
   */

  import { onMount } from 'svelte';
  import type { Actor } from 'foundry/common/types/module.mjs';
  import DmQuestionsPanel from './DmQuestionsPanel.svelte';

  // Props passed from Tidy5e
  let { actor }: { actor?: Actor } = $props();

  let currentActor: Actor | undefined = $state(actor);

  onMount(() => {
    currentActor = actor || (game.user?.character as Actor | undefined);
  });
</script>

<div class="turn-prep-main-tab">
  {#if currentActor}
    <div class="tab-content">
      <DmQuestionsPanel {actor: currentActor} />
    </div>
  {:else}
    <div class="no-actor">
      <p>Select a character to use Turn Prep features.</p>
    </div>
  {/if}
</div>

<style lang="less">
  .turn-prep-main-tab {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow-y: auto;

    .tab-content {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .no-actor {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--t5e-primary-color);

      p {
        font-size: 1.1rem;
      }
    }
  }
</style>
