<script lang="ts">
  /**
   * Question Row Component
   * 
   * A single row for a DM question with text input and action buttons.
   * Includes add/remove buttons and send actions.
   */

  import type { DMQuestion } from '../../types/turn-prep.types';
  import { FoundryAdapter } from '../../foundry/FoundryAdapter';

  interface Props {
    question: DMQuestion;
    onRemove?: () => void;
    onClear?: () => void;
    onUpdateText?: (text: string) => void;
    onSendDm?: () => void;
    onSendPublic?: () => void;
  }

  const {
    question,
    onRemove = () => {},
    onClear = () => {},
    onUpdateText = () => {},
    onSendDm = () => {},
    onSendPublic = () => {}
  }: Props = $props();

  function handleTextChange(text: string) {
    onUpdateText(text);
  }
</script>

<div class="question-row">
  <button
    class="action-button add-button"
    on:click={onRemove}
    title={FoundryAdapter.localize('TURN_PREP.DmQuestions.RemoveTooltip')}
    aria-label={FoundryAdapter.localize('TURN_PREP.DmQuestions.RemoveTooltip')}
  >
    <i class="fas fa-minus"></i>
  </button>

  <textarea
    class="question-text"
    bind:value={question.text}
    on:change={() => handleTextChange(question.text)}
    placeholder={FoundryAdapter.localize('TURN_PREP.DmQuestions.Placeholder')}
    rows="3"
  />

  <div class="button-group">
    <button
      class="action-button clear-button"
      on:click={onClear}
      title={FoundryAdapter.localize('TURN_PREP.DmQuestions.ClearTooltip')}
      aria-label={FoundryAdapter.localize('TURN_PREP.DmQuestions.ClearTooltip')}
    >
      <i class="fas fa-eraser"></i>
    </button>

    <button
      class="action-button whisper-button"
      on:click={onSendDm}
      title={FoundryAdapter.localize('TURN_PREP.DmQuestions.WhisperTooltip')}
      aria-label={FoundryAdapter.localize('TURN_PREP.DmQuestions.WhisperTooltip')}
    >
      <i class="far fa-paper-plane"></i>
    </button>

    <button
      class="action-button public-button"
      on:click={onSendPublic}
      title={FoundryAdapter.localize('TURN_PREP.DmQuestions.PublicTooltip')}
      aria-label={FoundryAdapter.localize('TURN_PREP.DmQuestions.PublicTooltip')}
    >
      <i class="fas fa-bullhorn"></i>
    </button>
  </div>
</div>

<style lang="less">
  .question-row {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 0.5rem;
    align-items: start;
    padding: 0.5rem;
    background: var(--t5e-sheet-background);
    border: 1px solid var(--t5e-faint-color);
    border-radius: var(--t5e-border-radius);

    .action-button {
      flex-shrink: 0;
      width: 32px;
      height: 32px;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--t5e-background);
      border: 1px solid var(--t5e-separator-color);
      border-radius: var(--t5e-border-radius);
      cursor: pointer;
      color: var(--t5e-primary-color);
      transition: all 0.2s ease;

      &:hover {
        background: var(--t5e-accent-color);
        color: var(--t5e-light-color);
        transform: scale(1.05);
      }

      &:active {
        transform: scale(0.95);
      }

      i {
        font-size: 0.9rem;
      }
    }

    .add-button {
      // Additional styling if needed
    }

    .question-text {
      min-height: 60px;
      max-height: 120px;
      resize: vertical;
      padding: 0.5rem;
      font-family: inherit;
      font-size: 0.9rem;
      background: var(--t5e-light-color);
      border: 1px solid var(--t5e-separator-color);
      border-radius: var(--t5e-border-radius);
      color: var(--t5e-primary-color);

      &:focus {
        outline: none;
        border-color: var(--t5e-accent-color);
        box-shadow: 0 0 0 2px rgba(var(--t5e-accent-color-rgb), 0.2);
      }

      &::placeholder {
        color: var(--t5e-faint-color);
      }
    }

    .button-group {
      display: flex;
      gap: 0.25rem;
      flex-wrap: wrap;
      justify-content: flex-end;

      .action-button {
        &.clear-button {
          // Eraser icon styling
        }

        &.whisper-button {
          // Whisper/plane icon styling
        }

        &.public-button {
          // Public/bullhorn icon styling
        }
      }
    }
  }
</style>
