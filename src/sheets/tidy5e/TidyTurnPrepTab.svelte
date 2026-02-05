<script lang="ts">
  import { onMount } from 'svelte';
  import DmQuestionsPanel from '../components/DmQuestionsPanel.svelte';
  import ReactionPlansPanel from '../components/ReactionPlansPanel.svelte';
  import TurnPlansPanel from '../components/TurnPlansPanel.svelte';
  import type { Actor5e } from '../../foundry/foundry.types';
  import { editSessionStore } from '../../features/edit-mode/EditSessionStore';

  interface Props {
    actor: Actor5e;
  }

  let { actor }: Props = $props();

  let activeEditKind: 'turn' | 'reaction' | null = $state(null);

  onMount(() => {
    const unsubscribe = editSessionStore.subscribe(session => {
       if (session && session.actorId === actor.id) {
           activeEditKind = session.kind;
       } else {
           activeEditKind = null;
       }
    });
    return unsubscribe;
  });
</script>

<div class="turn-prep-tab">
  <div class="turn-prep-panels">
    {#if !activeEditKind}
    <div class="panel-section">
      <DmQuestionsPanel {actor} />
    </div>
    {/if}
    
    {#if activeEditKind !== 'reaction'}
    <div class="panel-section">
      <TurnPlansPanel actor={actor} />
    </div>
    {/if}

    {#if activeEditKind !== 'turn'}
    <div class="panel-section">
      <ReactionPlansPanel actor={actor} />
    </div>
    {/if}
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
  }

  .panel-section {
    /* Each panel section */
  }
</style>
