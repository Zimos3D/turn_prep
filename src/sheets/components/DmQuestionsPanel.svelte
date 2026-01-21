/**
 * DM Questions Panel Component
 * 
 * Svelte component for managing DM questions.
 * Allows adding/removing questions and sending to chat or DM whisper.
 * 
 * Props:
 * - actor: The character actor
 * - questions: Array of questions
 * - onUpdate: Callback when questions change
 * 
 * TODO: Implement UI:
 * - Repeating text input fields for questions
 * - + button to add new question
 * - - button to delete question (disabled for first)
 * - "Send to Chat" and "Whisper to DM" buttons for each
 * - Handle Foundry chat creation
 */

<script lang="ts">
  /**
   * DM Questions Panel
   * 
   * Allows players to quickly enter questions for the DM during their turn.
   * Questions can be sent as whispers (private) or public chat.
   * Questions persist per character in actor flags.
   */

  import { onMount } from 'svelte';
  import type { DMQuestion } from '../../types/turn-prep.types';
  import { FoundryAdapter } from '../../foundry/FoundryAdapter';
  import { TurnPrepApiInstance as api } from '../../api/TurnPrepApi';
  import QuestionRow from './QuestionRow.svelte';

  // Props
  let { actor }: { actor: Actor } = $props();

  // State
  let questions: DMQuestion[] = $state([]);
  let loading = $state(true);

  // Initialize questions from actor flags
  onMount(async () => {
    try {
      const stored = await api.getDMQuestions(actor);
      questions = stored || [];
      
      // Ensure at least one empty question exists
      if (questions.length === 0) {
        questions = [createEmptyQuestion()];
      }
      loading = false;
    } catch (error) {
      console.error('Failed to load DM questions:', error);
      questions = [createEmptyQuestion()];
      loading = false;
    }
  });

  // Create a new empty question
  function createEmptyQuestion(): DMQuestion {
    return {
      id: foundry.utils.randomID(),
      text: '',
      tags: [],
      createdTime: Date.now()
    };
  }

  // Add new question row
  function addQuestion() {
    questions = [...questions, createEmptyQuestion()];
  }

  // Remove question (but keep at least one)
  function removeQuestion(id: string) {
    if (questions.length <= 1) {
      ui.notifications?.warn(
        FoundryAdapter.localize('TURN_PREP.DmQuestions.MinimumOneQuestion')
      );
      return;
    }
    questions = questions.filter(q => q.id !== id);
    saveQuestions();
  }

  // Update question text
  function updateQuestion(id: string, text: string) {
    const question = questions.find(q => q.id === id);
    if (question) {
      question.text = text;
    }
  }

  // Clear question text (keep row)
  function clearQuestion(id: string) {
    const question = questions.find(q => q.id === id);
    if (question) {
      question.text = '';
    }
  }

  // Send question to DM (whisper)
  async function sendToDm(id: string) {
    const question = questions.find(q => q.id === id);
    if (!question || !question.text.trim()) {
      ui.notifications?.warn(
        FoundryAdapter.localize('TURN_PREP.DmQuestions.EmptyQuestion')
      );
      return;
    }

    try {
      await api.sendQuestionToDm(actor, question.text);
      ui.notifications?.info(
        FoundryAdapter.localize('TURN_PREP.DmQuestions.SentToDm')
      );
    } catch (error) {
      console.error('Failed to send question to DM:', error);
      ui.notifications?.error(
        FoundryAdapter.localize('TURN_PREP.DmQuestions.SendFailed')
      );
    }
  }

  // Send question to public chat
  async function sendPublic(id: string) {
    const question = questions.find(q => q.id === id);
    if (!question || !question.text.trim()) {
      ui.notifications?.warn(
        FoundryAdapter.localize('TURN_PREP.DmQuestions.EmptyQuestion')
      );
      return;
    }

    try {
      await api.sendQuestionPublic(actor, question.text);
      ui.notifications?.info(
        FoundryAdapter.localize('TURN_PREP.DmQuestions.SentToPublic')
      );
    } catch (error) {
      console.error('Failed to send question to public:', error);
      ui.notifications?.error(
        FoundryAdapter.localize('TURN_PREP.DmQuestions.SendFailed')
      );
    }
  }

  // Save all questions to actor flags
  async function saveQuestions() {
    try {
      await api.saveDMQuestions(actor, questions);
    } catch (error) {
      console.error('Failed to save DM questions:', error);
    }
  }

  // Auto-save on changes
  $effect.post(() => {
    saveQuestions();
  });
</script>

<div class="dm-questions-panel">
  <div class="panel-header">
    <h3>{FoundryAdapter.localize('TURN_PREP.DmQuestions.Title')}</h3>
  </div>

  {#if loading}
    <div class="loading">
      <p>{FoundryAdapter.localize('TURN_PREP.Loading')}</p>
    </div>
  {:else}
    <div class="questions-list">
      {#each questions as question (question.id)}
        <QuestionRow
          {question}
          onRemove={() => removeQuestion(question.id)}
          onClear={() => clearQuestion(question.id)}
          onUpdateText={(text) => updateQuestion(question.id, text)}
          onSendDm={() => sendToDm(question.id)}
          onSendPublic={() => sendPublic(question.id)}
        />
      {/each}
    </div>

    <div class="add-question-button">
      <button
        class="tidy-button"
        on:click={addQuestion}
        title={FoundryAdapter.localize('TURN_PREP.DmQuestions.AddTooltip')}
      >
        <i class="fas fa-plus"></i>
        {FoundryAdapter.localize('TURN_PREP.DmQuestions.AddQuestion')}
      </button>
    </div>
  {/if}
</div>

<style lang="less">
  .dm-questions-panel {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1rem;

    .panel-header {
      border-bottom: 1px solid var(--t5e-separator-color);
      padding-bottom: 0.5rem;
      margin-bottom: 0.5rem;

      h3 {
        margin: 0;
        font-size: 1.1rem;
        color: var(--t5e-primary-color);
      }
    }

    .loading {
      display: flex;
      justify-content: center;
      padding: 2rem;
      color: var(--t5e-primary-color);
    }

    .questions-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .add-question-button {
      display: flex;
      justify-content: center;
      margin-top: 0.5rem;

      button {
        padding: 0.5rem 1rem;
        background: var(--t5e-accent-color);
        color: var(--t5e-light-color);
        border: none;
        border-radius: var(--t5e-border-radius);
        cursor: pointer;
        font-size: 0.9rem;
        transition: all 0.2s ease;

        &:hover {
          transform: translateY(-1px);
          box-shadow: var(--t5e-shadow-light);
        }

        i {
          margin-right: 0.5rem;
        }
      }
    }
  }
</style>
