/**
 * HTML Tab for Tidy5e integration
 * These use the HtmlTab class from Tidy5e API instead of SvelteTab
 */

export function createMainTabHtml(): string {
  return `
    <div class="turn-prep-tab" style="padding: 1rem;">
      <h3 style="margin-top: 0;">Turn Prep</h3>
      
      <!-- DM Questions Panel -->
      <section class="dm-questions-panel" style="margin-bottom: 1.5rem; padding: 1rem; background: rgba(0,0,0,0.1); border-radius: 4px;">
        <h4 style="margin-top: 0; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem;">
          <i class="fas fa-question-circle"></i>
          DM Questions
        </h4>
        
        <div class="dm-questions-list" style="display: flex; flex-direction: column; gap: 0.75rem;">
          <!-- Questions will be dynamically added here -->
        </div>
        
        <div style="margin-top: 0.75rem;">
          <button 
            class="add-question-btn" 
            title="Add Question"
            style="padding: 0.4rem 0.75rem; background: rgba(100,150,200,0.3); border: 1px solid rgba(100,150,200,0.5); border-radius: 3px; cursor: pointer; color: inherit; display: inline-flex; align-items: center; gap: 0.5rem;"
          >
            <i class="fas fa-plus"></i>
            Add Question
          </button>
        </div>
      </section>
      
      <!-- Turn Plans Panel (placeholder) -->
      <section class="turn-plans-panel" style="margin-bottom: 1.5rem; padding: 1rem; background: rgba(0,0,0,0.1); border-radius: 4px;">
        <h4 style="margin-top: 0; margin-bottom: 0.75rem;">Turn Plans</h4>
        <p style="color: rgba(255,255,255,0.6); font-style: italic;">Coming soon...</p>
      </section>
    </div>
  `;
}

/**
 * Create HTML for a single question row
 */
export function createQuestionRowHtml(questionId: string, questionText: string = ''): string {
  return `
    <div class="question-row" data-question-id="${questionId}" style="display: grid; grid-template-columns: 1fr auto auto auto auto; gap: 0.5rem; align-items: start;">
      <textarea 
        class="dm-question-input" 
        placeholder="What question do you have for the DM?"
        style="padding: 0.5rem; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.2); border-radius: 3px; color: inherit; resize: vertical; min-height: 4rem; max-height: 8rem; font-family: inherit; font-size: inherit;"
      >${questionText}</textarea>
      <button 
        class="add-below-btn" 
        title="Add Question Below"
        style="padding: 0.5rem; background: rgba(100,150,200,0.2); border: 1px solid rgba(100,150,200,0.3); border-radius: 3px; cursor: pointer; height: 100%; min-height: 2.5rem;"
      >
        <i class="fas fa-plus"></i>
      </button>
      <button 
        class="remove-question-btn" 
        title="Remove Question"
        style="padding: 0.5rem; background: rgba(200,100,100,0.2); border: 1px solid rgba(200,100,100,0.3); border-radius: 3px; cursor: pointer; height: 100%; min-height: 2.5rem;"
      >
        <i class="fas fa-minus"></i>
      </button>
      <button 
        class="clear-question-btn" 
        title="Clear Text"
        style="padding: 0.5rem; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); border-radius: 3px; cursor: pointer; height: 100%; min-height: 2.5rem;"
      >
        <i class="fas fa-eraser"></i>
      </button>
      <div style="display: flex; flex-direction: column; gap: 0.25rem;">
        <button 
          class="whisper-question-btn" 
          title="Send to DM (Whisper)"
          style="padding: 0.4rem 0.5rem; background: rgba(150,100,200,0.2); border: 1px solid rgba(150,100,200,0.3); border-radius: 3px; cursor: pointer; font-size: 0.9rem;"
        >
          <i class="fas fa-paper-plane"></i>
        </button>
      <button 
        class="public-question-btn" 
        title="Send to Public Chat"
        style="padding: 0.4rem 0.5rem; background: rgba(100,200,150,0.2); border: 1px solid rgba(100,200,150,0.3); border-radius: 3px; cursor: pointer; font-size: 0.9rem;"
      >
        <i class="fas fa-comments"></i>
      </button>
      </div>
    </div>
  `;
}

export function createSidebarTabHtml(): string {
  return `
    <div class="turn-prep-sidebar" style="padding: 0.5rem;">
      <h4 style="margin-top: 0; font-size: 0.9rem;">Turns History</h4>
      <p>Sidebar tab content will go here</p>
      <p><em>History & Favorites coming in later phase</em></p>
    </div>
  `;
}
