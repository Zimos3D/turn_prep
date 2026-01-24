<script lang="ts">
  /**
   * Turn Prep Main Tab Wrapper
   * 
   * Main tab component that wraps the DM Questions and Turn Plans panels.
   * This is the primary interface mounted in the Tidy5e main tab area.
   */

  import { onMount } from 'svelte';
  import type { Actor } from 'foundry/common/types/module.mjs';
  import TurnPlansPanel from '../components/TurnPlansPanel.svelte';
  import DmQuestionsPanel from '../components/DmQuestionsPanel.svelte';

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
      <div class="panels-container">
        <div class="panel-section">
          <h2 class="panel-title">Turn Plans</h2>
          <TurnPlansPanel actor={currentActor} />
        </div>
        <hr class="panel-divider" />
        <div class="panel-section">
          <h2 class="panel-title">DM Questions</h2>
          <DmQuestionsPanel actor={currentActor} />
        </div>
      </div>
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

      .panels-container {
        display: flex;
        flex-direction: column;
        gap: var(--t5e-spacing-lg, 1.5rem);
        padding: var(--t5e-spacing-lg, 1.5rem);

        .panel-section {
          display: flex;
          flex-direction: column;
          gap: var(--t5e-spacing-md, 1rem);

          .panel-title {
            margin: 0;
            font-size: 1.2rem;
            font-weight: bold;
            color: var(--t5e-primary-color);
            padding-bottom: var(--t5e-spacing-md, 1rem);
            border-bottom: 2px solid var(--t5e-border-color, rgba(0, 0, 0, 0.2));
          }
        }

        .panel-divider {
          border: none;
          border-top: 2px solid var(--t5e-border-color, rgba(0, 0, 0, 0.15));
          margin: var(--t5e-spacing-md, 1rem) 0;
        }
      }
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
