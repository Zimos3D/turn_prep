import { writable } from 'svelte/store';
import type { TurnSnapshot, ReactionFavoriteSnapshot, SelectedFeature } from '../../types';

export type EditModeKind = 'turn' | 'reaction';

export interface PendingFeature {
  feature: SelectedFeature;
  mode: 'action' | 'bonus' | 'reaction' | 'other';
}

export interface EditSession {
  actorId: string;
  kind: EditModeKind;
  originalId: string; // The ID of the favorite being edited
  snapshot: TurnSnapshot | ReactionFavoriteSnapshot;
  pendingFeatures: PendingFeature[];
}

function createEditSessionStore() {
  const { subscribe, set, update } = writable<EditSession | null>(null);

  return {
    subscribe,
    startSession: (session: Omit<EditSession, 'pendingFeatures'>) => set({ ...session, pendingFeatures: [] }),
    clearSession: () => set(null),
    addFeature: (feature: SelectedFeature, mode: 'action' | 'bonus' | 'reaction' | 'other') => {
      update(s => {
        if (!s) return null;
        return { ...s, pendingFeatures: [...s.pendingFeatures, { feature, mode }] };
      });
    },
    clearPendingFeatures: () => {
      update(s => {
        if (!s) return null;
        return { ...s, pendingFeatures: [] };
      });
    }
  };
}

export const editSessionStore = createEditSessionStore();
