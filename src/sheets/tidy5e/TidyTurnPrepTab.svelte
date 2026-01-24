<script lang="ts">
  import DmQuestionsPanel from '../components/DmQuestionsPanel.svelte';
  import TurnPlansPanel from '../components/TurnPlansPanel.svelte';
  import type { Actor5e } from '../../foundry/foundry.types';

  interface Props {
    actor: Actor5e;
  }

  let { actor }: Props = $props();
</script>

<div class="turn-prep-tab">
  <div class="turn-prep-panels">
    <div class="panel-section">
      <DmQuestionsPanel {actor} />
    </div>
    
    <div class="panel-divider"></div>
    
    <div class="panel-section">
      <TurnPlansPanel actor={actor} />
    </div>
  </div>
</div>

<style>
  .turn-prep-tab {
    height: 100%;
    overflow-y: auto;
    padding: 0.5rem;
  }

  .turn-prep-panels {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .panel-section {
    /* Each panel section */
  }

  .panel-divider {
    height: 1px;
    background: var(--t5e-separator-color, #ddd);
    margin: 1rem 0;
  }
</style>
