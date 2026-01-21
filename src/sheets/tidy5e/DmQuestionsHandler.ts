/**
 * DM Questions Panel Handler
 * Manages the interactive DM Questions panel in the Turn Prep tab
 * Supports dynamic add/remove of question rows
 */

import { info, error as logError } from '../../utils/logging';
import { FLAG_SCOPE, FLAG_KEY_DATA } from '../../constants';
import { createQuestionRowHtml } from './TidyHtmlTabs';

export interface DmQuestion {
  id: string;       // UUID
  text: string;     // Question content
  createdTime: number; // Timestamp
}

// Track which panels have been initialized to prevent duplicate initialization
const initializedPanels = new WeakSet<HTMLElement>();

/**
 * Initialize DM Questions panel for an actor's sheet
 */
export function initializeDmQuestionsPanel(actor: any, tabElement: HTMLElement): void {
  if (!actor || !tabElement) {
    logError('Cannot initialize DM Questions panel: missing actor or element');
    return;
  }

  // Check if this panel has already been initialized
  if (initializedPanels.has(tabElement)) {
    return; // Already initialized, skip to prevent duplicate listeners
  }

  // Mark as initialized
  initializedPanels.add(tabElement);

  // Load existing questions from actor flags
  loadQuestionsFromActor(actor, tabElement);

  // Attach event listeners for Add Question button
  attachAddQuestionListener(actor, tabElement);

  info(`DM Questions panel initialized for ${actor.name}`);
}

/**
 * Load saved questions from actor flags and render them
 */
function loadQuestionsFromActor(actor: any, tabElement: HTMLElement): void {
  try {
    const turnPrepData = actor.getFlag(FLAG_SCOPE, FLAG_KEY_DATA) || {};
    let questions: DmQuestion[] = turnPrepData.dmQuestions || [];

    // MIGRATION: Convert old object format to new array format
    if (!Array.isArray(questions) && typeof questions === 'object') {
      info('Migrating DM Questions from old format to new array format');
      const oldQuestions = questions as any;
      questions = Object.keys(oldQuestions)
        .filter(key => oldQuestions[key] && oldQuestions[key].trim())
        .map((key, index) => ({
          id: `migrated-${Date.now()}-${index}`,
          text: oldQuestions[key],
          createdTime: Date.now()
        }));
    }

    // If no questions, create one default question
    if (questions.length === 0) {
      questions.push({
        id: generateUUID(),
        text: '',
        createdTime: Date.now()
      });
    }

    // Render all questions
    const listContainer = tabElement.querySelector('.dm-questions-list');
    if (!listContainer) {
      logError('Cannot find dm-questions-list container');
      return;
    }

    listContainer.innerHTML = '';
    questions.forEach(question => {
      renderQuestionRow(actor, tabElement, question);
    });
  } catch (err) {
    logError('Failed to load DM Questions', err as Error);
  }
}

/**
 * Render a single question row
 */
function renderQuestionRow(actor: any, tabElement: HTMLElement, question: DmQuestion): void {
  const listContainer = tabElement.querySelector('.dm-questions-list');
  if (!listContainer) return;

  const rowHtml = createQuestionRowHtml(question.id, question.text);
  listContainer.insertAdjacentHTML('beforeend', rowHtml);

  // Get the newly added row
  const questionRow = listContainer.querySelector<HTMLElement>(
    `.question-row[data-question-id="${question.id}"]`
  );
  if (!questionRow) return;

  // Attach event listeners to this row
  attachRowEventListeners(actor, tabElement, questionRow, question.id);
}

/**
 * Attach event listeners to a question row
 */
function attachRowEventListeners(
  actor: any, 
  tabElement: HTMLElement, 
  questionRow: HTMLElement, 
  questionId: string
): void {
  const textarea = questionRow.querySelector<HTMLTextAreaElement>('.dm-question-input');
  const addBelowBtn = questionRow.querySelector<HTMLButtonElement>('.add-below-btn');
  const removeBtn = questionRow.querySelector<HTMLButtonElement>('.remove-question-btn');
  const clearBtn = questionRow.querySelector<HTMLButtonElement>('.clear-question-btn');
  const whisperBtn = questionRow.querySelector<HTMLButtonElement>('.whisper-question-btn');
  const publicBtn = questionRow.querySelector<HTMLButtonElement>('.public-question-btn');

  // Auto-save on input change (debounced)
  if (textarea) {
    let saveTimeout: number | null = null;
    
    textarea.addEventListener('input', () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
      
      saveTimeout = window.setTimeout(() => {
        saveAllQuestions(actor, tabElement);
      }, 500); // 500ms debounce
    });
    
    // Also save on blur
    textarea.addEventListener('blur', () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
        saveTimeout = null;
      }
      saveAllQuestions(actor, tabElement);
    });
  }

  // Add below button
  if (addBelowBtn) {
    addBelowBtn.addEventListener('click', (e) => {
      e.preventDefault();
      addQuestionBelow(actor, tabElement, questionId);
    });
  }

  // Remove button
  if (removeBtn) {
    removeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      removeQuestion(actor, tabElement, questionId);
    });
  }

  // Clear button
  if (clearBtn) {
    clearBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (textarea) {
        textarea.value = '';
        saveAllQuestions(actor, tabElement);
      }
    });
  }

  // Whisper to DM button
  if (whisperBtn) {
    whisperBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      if (textarea && textarea.value.trim()) {
        await sendQuestionToDM(actor, textarea.value.trim());
      }
    });
  }

  // Public chat button
  if (publicBtn) {
    publicBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      if (textarea && textarea.value.trim()) {
        await sendQuestionPublic(actor, textarea.value.trim());
      }
    });
  }
}

/**
 * Attach listener for the main Add Question button
 */
function attachAddQuestionListener(actor: any, tabElement: HTMLElement): void {
  const addBtn = tabElement.querySelector<HTMLButtonElement>('.add-question-btn');
  if (!addBtn) return;

  addBtn.addEventListener('click', (e) => {
    e.preventDefault();
    addQuestionAtEnd(actor, tabElement);
  });
}

/**
 * Add a new question at the end of the list
 */
function addQuestionAtEnd(actor: any, tabElement: HTMLElement): void {
  const newQuestion: DmQuestion = {
    id: generateUUID(),
    text: '',
    createdTime: Date.now()
  };

  renderQuestionRow(actor, tabElement, newQuestion);
  saveAllQuestions(actor, tabElement);
}

/**
 * Add a new question below a specific question
 */
function addQuestionBelow(actor: any, tabElement: HTMLElement, afterQuestionId: string): void {
  const newQuestion: DmQuestion = {
    id: generateUUID(),
    text: '',
    createdTime: Date.now()
  };

  const listContainer = tabElement.querySelector('.dm-questions-list');
  if (!listContainer) return;

  const afterRow = listContainer.querySelector<HTMLElement>(
    `.question-row[data-question-id="${afterQuestionId}"]`
  );
  if (!afterRow) return;

  // Insert HTML after the current row
  const rowHtml = createQuestionRowHtml(newQuestion.id, newQuestion.text);
  afterRow.insertAdjacentHTML('afterend', rowHtml);

  // Get the newly added row and attach listeners
  const newRow = afterRow.nextElementSibling as HTMLElement;
  if (newRow) {
    attachRowEventListeners(actor, tabElement, newRow, newQuestion.id);
  }

  saveAllQuestions(actor, tabElement);
}

/**
 * Remove a question (minimum 1 must remain)
 */
function removeQuestion(actor: any, tabElement: HTMLElement, questionId: string): void {
  const listContainer = tabElement.querySelector('.dm-questions-list');
  if (!listContainer) return;

  const allRows = listContainer.querySelectorAll('.question-row');
  
  // Don't allow removing if only 1 row remains
  if (allRows.length <= 1) {
    // @ts-ignore - Foundry UI notification
    ui.notifications?.warn('At least one question row must remain');
    return;
  }

  const rowToRemove = listContainer.querySelector<HTMLElement>(
    `.question-row[data-question-id="${questionId}"]`
  );
  
  if (rowToRemove) {
    rowToRemove.remove();
    saveAllQuestions(actor, tabElement);
  }
}

/**
 * Save all current questions to actor flags
 */
async function saveAllQuestions(actor: any, tabElement: HTMLElement): Promise<void> {
  try {
    const listContainer = tabElement.querySelector('.dm-questions-list');
    if (!listContainer) return;

    const questions: DmQuestion[] = [];
    const rows = listContainer.querySelectorAll<HTMLElement>('.question-row');

    rows.forEach(row => {
      const questionId = row.dataset.questionId;
      const textarea = row.querySelector<HTMLTextAreaElement>('.dm-question-input');
      
      if (questionId && textarea) {
        questions.push({
          id: questionId,
          text: textarea.value,
          createdTime: Date.now() // Could track actual creation time in data attribute
        });
      }
    });

    // Get existing turn prep data
    const existingData = actor.getFlag(FLAG_SCOPE, FLAG_KEY_DATA) || {};
    
    // Update with new questions
    const updatedData = {
      ...existingData,
      dmQuestions: questions
    };

    // Save to actor flags
    await actor.setFlag(FLAG_SCOPE, FLAG_KEY_DATA, updatedData);
    
    info(`DM Questions saved for ${actor.name}: ${questions.length} questions`);
  } catch (err) {
    logError('Failed to save DM Questions', err as Error);
    // @ts-ignore - Foundry UI notification
    ui.notifications?.error('Failed to save DM Questions');
  }
}

/**
 * Send question to DM as whisper
 */
async function sendQuestionToDM(actor: any, questionText: string): Promise<void> {
  try {
    // Get GM user IDs
    const gmIds = (game as any).users
      .filter((u: any) => u.isGM)
      .map((u: any) => u.id);

    if (gmIds.length === 0) {
      // @ts-ignore
      ui.notifications?.warn('No GM is currently online');
      return;
    }

    // Create whisper message
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content: `<strong>Question for DM:</strong><br/>${questionText}`,
      whisper: gmIds
    });

    // @ts-ignore
    ui.notifications?.info('Question sent to DM');
  } catch (err) {
    logError('Failed to send question to DM', err as Error);
    // @ts-ignore
    ui.notifications?.error('Failed to send question to DM');
  }
}

/**
 * Send question to public chat
 */
async function sendQuestionPublic(actor: any, questionText: string): Promise<void> {
  try {
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content: `<strong>Question:</strong><br/>${questionText}`
    });

    // @ts-ignore
    ui.notifications?.info('Question sent to chat');
  } catch (err) {
    logError('Failed to send question to chat', err as Error);
    // @ts-ignore
    ui.notifications?.error('Failed to send question to chat');
  }
}

/**
 * Generate a simple UUID
 */
function generateUUID(): string {
  return `question-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
