/**
 * Manual wrapper for Svelte-style tab components that works with Tidy5e's expectations
 * This bypasses the Svelte compiler and uses plain DOM manipulation
 */

export function createTidyTurnPrepTab() {
  return function TidyTurnPrepTab($$anchor: HTMLElement) {
    const div = document.createElement('div');
    div.className = 'turn-prep-tab';
    div.innerHTML = `
      <h3>Turn Prep</h3>
      <p>Main tab content will go here</p>
      <p><em>DM Questions Panel coming in next phase</em></p>
    `;
    
    // Apply styles
    const style = div.style;
    style.padding = '1rem';
    
    $$anchor.appendChild(div);
  };
}

export function createTidyTurnsSidebarTab() {
  return function TidyTurnsSidebarTab($$anchor: HTMLElement) {
    const div = document.createElement('div');
    div.className = 'turn-prep-sidebar';
    div.innerHTML = `
      <h4>Turns History</h4>
      <p>Sidebar tab content will go here</p>
      <p><em>History & Favorites coming in later phase</em></p>
    `;
    
    // Apply styles
    const style = div.style;
    style.padding = '0.5rem';
    
    $$anchor.appendChild(div);
  };
}
