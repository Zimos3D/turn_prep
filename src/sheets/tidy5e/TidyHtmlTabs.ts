/**
 * HTML Tab for Tidy5e integration
 * These use the HtmlTab class from Tidy5e API instead of SvelteTab
 */

export function createMainTabHtml(): string {
  return `
    <div class="turn-prep-tab" style="padding: 1rem;">
      <h3 style="margin-top: 0;">Turn Prep</h3>
      <p>Main tab content will go here</p>
      <p><em>DM Questions Panel coming in next phase</em></p>
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
