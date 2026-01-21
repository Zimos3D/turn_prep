<script lang="ts">
  import DmQuestionsPanel from './components/DmQuestionsPanel.svelte';
  import type { Actor5e } from '../../foundry/foundry.types';

  interface Props {
    actor: Actor5e;
  }

  let { actor }: Props = $props();
</script>

<div class="turn-prep-tab">
  <DmQuestionsPanel {actor} />
</div>

<style>
  .turn-prep-tab {
    height: 100%;
    overflow-y: auto;
    padding: 0.5rem;
  }
</style>
