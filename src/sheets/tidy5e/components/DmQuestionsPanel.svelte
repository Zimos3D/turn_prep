<script lang="ts">
  import type { Actor5e } from 'src/foundry/foundry.types';
  import { FLAG_SCOPE, FLAG_KEY_DATA } from 'src/constants';
  import { info } from 'src/utils/logging';

  // Actor passed as prop from Tidy5e
  interface Props {
    actor: Actor5e;
  }
  
  let { actor }: Props = $props();

  interface DmQuestion {
    question: string;
    answer: string;
  }

  // Load initial data directly
  function loadQuestions(): DmQuestion[] {
    if (!actor) {
      return Array.from({ length: 5 }, () => ({ question: '', answer: '' }));
    }
    
    const savedData = actor.getFlag(FLAG_SCOPE, FLAG_KEY_DATA) as any;
    if (savedData?.dmQuestions) {
      // Handle both old object format and new array format
      if (Array.isArray(savedData.dmQuestions)) {
        return savedData.dmQuestions;
      } else if (typeof savedData.dmQuestions === 'object') {
        // Migrate from old format
        const oldData = savedData.dmQuestions as Record<string, { question: string; answer: string }>;
        const migrated = Object.values(oldData);
        info('Migrated DM Questions from object to array format');
        // Save migrated data asynchronously
        setTimeout(() => {
          const currentData = actor.getFlag(FLAG_SCOPE, FLAG_KEY_DATA) as any || {};
          actor.setFlag(FLAG_SCOPE, FLAG_KEY_DATA, {
            ...currentData,
            dmQuestions: migrated
          });
        }, 0);
        return migrated;
      }
    }
    
    // If no questions, start with 5 empty ones
    return Array.from({ length: 5 }, () => ({ question: '', answer: '' }));
  }

  // Initialize questions from actor flags
  let questions = $state<DmQuestion[]>(loadQuestions());

  // Auto-save with debounce
  let saveTimeout: number | null = null;

  function saveQuestions() {
    const currentData = actor.getFlag(FLAG_SCOPE, FLAG_KEY_DATA) as any || {};
    actor.setFlag(FLAG_SCOPE, FLAG_KEY_DATA, {
      ...currentData,
      dmQuestions: questions
    });
  }

  function debouncedSave() {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      saveQuestions();
      saveTimeout = null;
    }, 500) as unknown as number;
  }

  function handleInput(index: number, field: 'question' | 'answer', value: string) {
    questions[index][field] = value;
    debouncedSave();
  }

  function addQuestion() {
    questions = [...questions, { question: '', answer: '' }];
    saveQuestions();
  }

  function removeQuestion(index: number) {
    // If only one question, clear it instead of removing
    if (questions.length === 1) {
      questions[index] = { question: '', answer: '' };
    } else {
      questions = questions.filter((_, i) => i !== index);
    }
    saveQuestions();
  }

  function clearQuestion(index: number) {
    questions[index] = { question: '', answer: '' };
    saveQuestions();
  }

  async function whisperToDm(index: number) {
    const q = questions[index];
    if (!q.question) return;

    const content = q.question;

    const gmUsers = game.users?.filter(u => u.isGM) || [];
    const gmIds = gmUsers.map(u => u.id);

    await ChatMessage.create({
      content,
      whisper: gmIds,
      speaker: ChatMessage.getSpeaker({ actor })
    });

    ui.notifications?.info('Question whispered to DM');
  }

  async function sendToChat(index: number) {
    const q = questions[index];
    if (!q.question) return;

    const content = q.question;

    await ChatMessage.create({
      content,
      speaker: ChatMessage.getSpeaker({ actor })
    });

    ui.notifications?.info('Question sent to chat');
  }
</script>

<div class="turn-prep-dm-questions">
  <div class="questions-header">
    <h3>DM Questions</h3>
    <button type="button" class="add-question-btn" onclick={addQuestion}>
      <i class="fas fa-plus"></i> Add Question
    </button>
  </div>

  <div class="questions-list">
    {#each questions as q, i}
      <div class="question-row">
        <div class="question-inputs">
          <input
            type="text"
            class="question-input"
            placeholder="What do you want to ask the DM?"
            value={q.question}
            oninput={(e) => handleInput(i, 'question', e.currentTarget.value)}
            onblur={() => saveQuestions()}
          />
          <textarea
            class="answer-input"
            placeholder="DM's answer (or your notes)"
            value={q.answer}
            oninput={(e) => handleInput(i, 'answer', e.currentTarget.value)}
            onblur={() => saveQuestions()}
          ></textarea>
        </div>
        <div class="question-actions">
          <button
            type="button"
            class="whisper-btn"
            title="Whisper to DM"
            onclick={() => whisperToDm(i)}
          >
            <i class="fas fa-paper-plane"></i>
          </button>
          <button
            type="button"
            class="chat-btn"
            title="Send to chat"
            onclick={() => sendToChat(i)}
          >
            <i class="fas fa-comments"></i>
          </button>
          <button
            type="button"
            class="remove-btn"
            title="Remove this question"
            onclick={() => removeQuestion(i)}
          >
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    {/each}
  </div>
</div>

<style lang="less">
  .turn-prep-dm-questions {
    padding: 0.5rem;
  }

  .questions-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;

    h3 {
      margin: 0;
      font-size: 1.2rem;
    }

    .add-question-btn {
      padding: 0.25rem 0.75rem;
      background: var(--t5e-primary-accent-color, #4b4a44);
      color: white;
      border: none;
      border-radius: 3px;
      cursor: pointer;
      font-size: 0.9rem;

      &:hover {
        background: var(--t5e-primary-accent-color-hover, #5a5850);
      }

      i {
        margin-right: 0.25rem;
      }
    }
  }

  .questions-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .question-row {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 0.5rem;
    padding: 0.75rem;
    background: var(--t5e-faint-color, rgba(0, 0, 0, 0.05));
    border-radius: 4px;
    border: 1px solid var(--t5e-faintest-color, rgba(0, 0, 0, 0.1));
  }

  .question-inputs {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    flex: 1;
  }

  .question-input,
  .answer-input {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid var(--t5e-separator-color, #ccc);
    border-radius: 3px;
    font-family: inherit;
    font-size: 0.9rem;
    background: white;

    &:focus {
      outline: none;
      border-color: var(--t5e-primary-accent-color, #4b4a44);
    }
  }

  .answer-input {
    min-height: 1.75rem;
    resize: vertical;
    font-family: inherit;
  }

  .question-actions {
    display: flex;
    flex-direction: row;
    gap: 0.25rem;
    align-items: flex-start;
  }

  .question-actions button {
    width: 2rem;
    height: 2rem;
    padding: 0;
    border: none;
    border-radius: 3px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;

    i {
      font-size: 0.9rem;
    }
  }

  .whisper-btn {
    background: var(--t5e-primary-accent-color, #4b4a44);
    color: white;

    &:hover {
      background: var(--t5e-primary-accent-color-hover, #5a5850);
    }
  }

  .chat-btn {
    background: #2196f3;
    color: white;

    &:hover {
      background: #1976d2;
    }
  }

  .remove-btn {
    background: #f44336;
    color: white;

    &:hover {
      background: #d32f2f;
    }
  }
</style>
