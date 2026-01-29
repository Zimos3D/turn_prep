<script lang="ts">
  import { onMount } from 'svelte';
  import type { Actor5e } from 'src/foundry/foundry.types';
  import { FLAG_SCOPE, FLAG_KEY_DATA } from 'src/constants';
  import { info, error } from 'src/utils/logging';
  import { FoundryAdapter } from 'src/foundry/FoundryAdapter';
  import ContextMenuHost from './context-menu/ContextMenuHost.svelte';
  import { ContextMenuController } from 'src/features/context-menu/ContextMenuController';
  import type { ContextMenuAction, ContextMenuSection } from 'src/features/context-menu/context-menu.types';

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

  // Collapsible state
  let collapsed = $state(false);
  const questionMenuController = new ContextMenuController('dm-questions-panel');
  let activeContextIndex = $state<number | null>(null);

  onMount(() => {
    const unsubscribe = questionMenuController.subscribe((state) => {
      const contextIndex = state?.context?.index;
      activeContextIndex = typeof contextIndex === 'number' ? contextIndex : null;
    });

    return () => unsubscribe();
  });

  // Auto-save with debounce
  let saveTimeout: number | null = null;

  function saveQuestions() {
    if (!actor) return;

    const currentData = (actor.getFlag(FLAG_SCOPE, FLAG_KEY_DATA) as any) || {};
    const payload = {
      ...currentData,
      dmQuestions: questions.map((q) => ({ ...q }))
    };

    const flagPath = `flags.${FLAG_SCOPE}.${FLAG_KEY_DATA}`;

    actor
      .update({ [flagPath]: payload }, { render: false, diff: false })
      .catch((err: unknown) => error('Failed to save DM questions', err as Error));
  }

  function debouncedSave() {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      saveQuestions();
      saveTimeout = null;
    }, 1000) as unknown as number;
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

  function duplicateQuestion(index: number) {
    const source = questions[index];
    if (!source) {
      return;
    }

    const clone = { question: source.question, answer: source.answer };
    questions = [
      ...questions.slice(0, index + 1),
      clone,
      ...questions.slice(index + 1)
    ];
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

  function getQuestionMenuActions(index: number): ContextMenuAction[] {
    return [
      {
        id: 'whisper',
        label: FoundryAdapter.localize('TURN_PREP.DmQuestions.ContextMenu.Whisper'),
        icon: 'fas fa-paper-plane',
        onSelect: () => whisperToDm(index)
      },
      {
        id: 'chat',
        label: FoundryAdapter.localize('TURN_PREP.DmQuestions.ContextMenu.SendToChat'),
        icon: 'fas fa-comments',
        onSelect: () => sendToChat(index)
      },
      {
        id: 'duplicate',
        label: FoundryAdapter.localize('TURN_PREP.DmQuestions.ContextMenu.Duplicate'),
        icon: 'fas fa-copy',
        onSelect: () => duplicateQuestion(index)
      },
      {
        id: 'delete',
        label: FoundryAdapter.localize('TURN_PREP.DmQuestions.ContextMenu.Delete'),
        icon: 'fas fa-trash',
        variant: 'destructive',
        onSelect: () => removeQuestion(index)
      }
    ];
  }

  function buildQuestionMenuSections(index: number): ContextMenuSection[] {
    return [
      {
        id: `dm-question-${index}`,
        actions: getQuestionMenuActions(index)
      }
    ];
  }

  function openQuestionContextMenu(
    index: number,
    position: { x: number; y: number },
    anchorElement?: HTMLElement | null
  ) {
    questionMenuController.open({
      sections: buildQuestionMenuSections(index),
      position,
      anchorElement: anchorElement ?? null,
      context: {
        index,
        ariaLabel: FoundryAdapter.localize('TURN_PREP.Reactions.ContextMenuLabel')
      }
    });
  }

  function handleQuestionContextMenu(index: number, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    openQuestionContextMenu(index, { x: event.clientX, y: event.clientY }, event.currentTarget as HTMLElement);
  }

  function handleQuestionMenuButton(index: number, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    const button = event.currentTarget as HTMLElement | null;

    if (button) {
      const rect = button.getBoundingClientRect();
      openQuestionContextMenu(index, { x: rect.right, y: rect.bottom + 4 }, button);
      return;
    }

    openQuestionContextMenu(index, { x: event.clientX, y: event.clientY });
  }
</script>

<div class="turn-prep-panel turn-prep-dm-questions">
  <div class="turn-prep-panel-header">
    <button 
      type="button" 
      class="turn-prep-panel-toggle"
      onclick={() => collapsed = !collapsed}
      title={collapsed ? 'Expand' : 'Collapse'}
    >
      <i class="fas fa-chevron-{collapsed ? 'right' : 'down'}"></i>
    </button>
    <h3>DM Questions</h3>
    <button type="button" class="turn-prep-panel-action-btn" onclick={addQuestion}>
      <i class="fas fa-plus"></i> Add Question
    </button>
  </div>

  {#if !collapsed}
    <div class="turn-prep-panel-list questions-list">
    {#each questions as q, i}
      <div
        class={`turn-prep-panel-card question-row ${activeContextIndex === i ? 'context-open' : ''}`}
        role="group"
        tabindex="-1"
        oncontextmenu={(event) => handleQuestionContextMenu(i, event)}
      >
        <div class="question-inputs">
          <input
            type="text"
            class="turn-prep-input question-input"
            placeholder="What do you want to ask the DM?"
            value={q.question}
            oninput={(e) => handleInput(i, 'question', e.currentTarget.value)}
          />
          <textarea
            class="turn-prep-textarea answer-input"
            placeholder="DM's answer (or your notes)"
            value={q.answer}
            oninput={(e) => handleInput(i, 'answer', e.currentTarget.value)}
          ></textarea>
        </div>
        <div class="question-actions">
          <button
            type="button"
            class={`question-menu-btn ${activeContextIndex === i ? 'is-active' : ''}`}
            title={FoundryAdapter.localize('TURN_PREP.Reactions.ContextMenuLabel')}
            aria-haspopup="menu"
            aria-expanded={activeContextIndex === i ? 'true' : 'false'}
            onclick={(event) => handleQuestionMenuButton(i, event)}
          >
            <i class="fa-solid fa-ellipsis-vertical"></i>
          </button>
        </div>
      </div>
    {/each}
    </div>
  {/if}
</div>

<ContextMenuHost controller={questionMenuController} />

<style lang="less">
  .question-row {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 0.5rem;
    border: 1px solid var(--t5e-faint-color, rgba(0, 0, 0, 0.12));
    transition: border-color 150ms ease, box-shadow 150ms ease;
  }

  .question-row.context-open {
    border-color: var(--t5e-primary-accent-color, #4b4a44);
    box-shadow: 0 0.2rem 0.6rem rgba(0, 0, 0, 0.25);
  }

  .question-inputs {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    flex: 1;
  }

  .answer-input {
    min-height: 1.75rem;
  }

  .question-actions {
    display: flex;
    flex-direction: row;
    gap: 0.25rem;
    align-items: flex-start;
    justify-content: flex-end;
  }

  .question-actions button {
    width: 2rem;
    height: 2rem;
    padding: 0;
    border-radius: 0.35rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;

    i {
      font-size: 0.9rem;
    }
  }

  .question-menu-btn {
    border: 1px solid var(--t5e-faint-color, rgba(0, 0, 0, 0.2));
    background: var(--t5e-panel-muted-bg, rgba(0, 0, 0, 0.05));
    color: var(--t5e-color-text-default, inherit);

    &:hover,
    &.is-active {
      border-color: var(--t5e-primary-accent-color, #4b4a44);
      color: var(--t5e-primary-accent-color, #4b4a44);
      background: rgba(0, 0, 0, 0.08);
    }
  }
</style>
