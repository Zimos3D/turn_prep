/**
 * Tidy 5E Turns Sidebar Tab Component
 * 
 * Sidebar tab for Tidy 5E (only appears in Tidy sheets).
 * Shows favorites and history with hourglass icon.
 * Favorites are reorderable, history is limited to 10 entries (configurable).
 * 
 * TODO: Implement:
 * - Tab selector buttons (Favorites / History)
 * - HistoryFavoritesList component for each
 * - Pass draggable=true for favorites
 * - Pass draggable=false for history
 * - Handle save/load of turn snapshots
 * - Use hourglass or clock icon (fa-hourglass or fa-clock)
 */

<script lang="ts">
  /**
   * History & Favorites Sidebar Tab Wrapper
   * 
   * Sidebar tab component that displays history and favorites.
   * This is a placeholder for now - will be implemented in the next session.
   */

  import type { Actor } from 'foundry/common/types/module.mjs';

  // Props passed from Tidy5e
  let { actor }: { actor?: Actor } = $props();
</script>

<div class="turn-prep-sidebar-tab">
  <div class="placeholder">
    <p>📚 History & Favorites Tab</p>
    <p style="font-size: 0.9rem; color: var(--t5e-faint-color);">
      Coming soon...
    </p>
  </div>
</div>

<style lang="less">
  .turn-prep-sidebar-tab {
    display: flex;
    flex-direction: column;
    padding: 1rem;
    height: 100%;

    .placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--t5e-primary-color);

      p {
        margin: 0.5rem 0;
      }
    }
  }
</style>
