import { mount } from 'svelte';
import { FoundryAdapter } from '../../foundry/FoundryAdapter';
import { TurnPrepStorage } from '../data/TurnPrepStorage';
import type { TurnSnapshot, ReactionFavoriteSnapshot, TurnPrepData } from '../../types';
import EditTurnFavoriteDialog from '../../sheets/dialogs/EditTurnFavoriteDialog.svelte';
import EditReactionFavoriteDialog from '../../sheets/dialogs/EditReactionFavoriteDialog.svelte';

function clonePlain<T>(value: T): T {
  // Use JSON clone to avoid structuredClone failures on non-transferable values
  return value ? JSON.parse(JSON.stringify(value)) as T : value;
}

const ApplicationV2: any = (globalThis as any).foundry?.applications?.api?.ApplicationV2 ?? (globalThis as any).Application;
const DialogV2: any = (globalThis as any).foundry?.applications?.api?.DialogV2;

interface BaseDialogProps<TSnapshot> {
  actor: any;
  snapshot: TSnapshot;
  onSaved?: () => Promise<void> | void;
  title: string;
  kind: 'turn' | 'reaction';
}

abstract class BaseFavoriteEditor<TSnapshot> extends ApplicationV2 {
  protected component: any = null;
  protected dirty = false;
  protected current: TSnapshot;
  protected props: BaseDialogProps<TSnapshot>;
  protected skipPrompt = false;

  constructor(props: BaseDialogProps<TSnapshot>) {
    super(props);
    this.props = props;
    this.current = clonePlain(props.snapshot);
  }

  protected abstract renderComponent(target: HTMLElement): void;
  protected abstract handleSaveData(snapshot: TSnapshot): Promise<void>;

  // ApplicationV2 requires HTML render/replace hooks; we mount Svelte manually.
  override async _renderHTML(_context: any, _options: any): Promise<HTMLElement> {
    const container = document.createElement('div');
    container.classList.add('turn-prep-edit-container');
    return container;
  }

  override async _replaceHTML(result: HTMLElement, _content: any, _options: any): Promise<HTMLElement> {
    this.renderComponent(result);
    // Keep a reference for close() cleanup
    this.element = result;
    return result;
  }

  override async render(force?: boolean, options?: any): Promise<any> {
    const result = await super.render(force, options);
    const target = (this.element as HTMLElement)?.querySelector('.window-content') as HTMLElement ?? (this.element as HTMLElement);
    if (target) {
      this.renderComponent(target);
    }
    return result;
  }

  protected onDirtyChange = (dirty: boolean) => {
    this.dirty = dirty;
  };

  protected onChange = (working: TSnapshot) => {
    this.current = working;
  };

  protected onSave = async (updated: TSnapshot) => {
    this.skipPrompt = true;
    this.dirty = false;
    this.current = updated;
    await this.handleSaveData(updated);
    await this.close();
  };

  protected onCancel = async () => {
    await this.close();
  };

  protected async promptUnsaved(): Promise<boolean> {
    const message = FoundryAdapter.localize('TURN_PREP.Dialog.UnsavedChangesPrompt') || 'Save changes before closing?';
    const title = FoundryAdapter.localize('TURN_PREP.Dialog.UnsavedChangesTitle') || 'Unsaved Changes';

    if (DialogV2?.confirm) {
      return await DialogV2.confirm({
        title,
        content: `<p>${message}</p>`,
        yes: { label: FoundryAdapter.localize('TURN_PREP.Common.Save') || 'Save' },
        no: { label: FoundryAdapter.localize('TURN_PREP.Common.Discard') || 'Discard' }
      });
    }

    return window.confirm(message);
  }

  protected destroyComponent() {
    if (this.component?.$destroy) {
      this.component.$destroy();
    }
    this.component = null;
  }

  override async close(options?: any): Promise<any> {
    if (!this.skipPrompt && this.dirty) {
      const shouldSave = await this.promptUnsaved();
      if (shouldSave) {
        await this.onSave(this.current);
        return this;
      }
      // discard
      this.dirty = false;
    }

    this.destroyComponent();
    this.skipPrompt = false;
    return super.close(options);
  }
}

class TurnFavoriteEditor extends BaseFavoriteEditor<TurnSnapshot> {
  static override DEFAULT_OPTIONS = {
    id: 'turn-prep-edit-turn-favorite',
    window: { title: FoundryAdapter.localize('TURN_PREP.Dialog.EditTurnPlan') || 'Edit Turn Plan', minimizable: false, resizable: true },
    position: { width: 620 },
  };

  protected renderComponent(target: HTMLElement): void {
    if (this.component) {
      this.component.$set({
        snapshot: this.props.snapshot,
        title: FoundryAdapter.localize('TURN_PREP.Dialog.EditTurnPlan') || 'Edit Turn Plan',
      });
      return;
    }

    this.component = mount(EditTurnFavoriteDialog, {
      target,
      props: {
        snapshot: this.props.snapshot,
        title: FoundryAdapter.localize('TURN_PREP.Dialog.EditTurnPlan') || 'Edit Turn Plan',
        onSave: this.onSave,
        onCancel: this.onCancel,
        onDirtyChange: this.onDirtyChange,
        onChange: this.onChange,
      },
    });
  }

  protected async handleSaveData(snapshot: TurnSnapshot): Promise<void> {
    const data = await TurnPrepStorage.load(this.props.actor);
    const updatedFavorites = (data.favoritesTurn ?? data.favorites ?? []).map((s) => (s.id === snapshot.id ? snapshot : s));
    (data as TurnPrepData).favoritesTurn = updatedFavorites;
    await TurnPrepStorage.save(this.props.actor, data);
    await this.props.onSaved?.();
  }
}

class ReactionFavoriteEditor extends BaseFavoriteEditor<ReactionFavoriteSnapshot> {
  static override DEFAULT_OPTIONS = {
    id: 'turn-prep-edit-reaction-favorite',
    window: { title: FoundryAdapter.localize('TURN_PREP.Dialog.EditReactionPlan') || 'Edit Reaction Plan', minimizable: false, resizable: true },
    position: { width: 560 },
  };

  protected renderComponent(target: HTMLElement): void {
    if (this.component) {
      this.component.$set({
        snapshot: this.props.snapshot,
        title: FoundryAdapter.localize('TURN_PREP.Dialog.EditReactionPlan') || 'Edit Reaction Plan',
      });
      return;
    }

    this.component = mount(EditReactionFavoriteDialog, {
      target,
      props: {
        snapshot: this.props.snapshot,
        title: FoundryAdapter.localize('TURN_PREP.Dialog.EditReactionPlan') || 'Edit Reaction Plan',
        onSave: this.onSave,
        onCancel: this.onCancel,
        onDirtyChange: this.onDirtyChange,
        onChange: this.onChange,
      },
    });
  }

  protected async handleSaveData(snapshot: ReactionFavoriteSnapshot): Promise<void> {
    const data = await TurnPrepStorage.load(this.props.actor);
    const updatedFavorites = (data.favoritesReaction ?? []).map((s) => (s.id === snapshot.id ? snapshot : s));
    (data as TurnPrepData).favoritesReaction = updatedFavorites;
    await TurnPrepStorage.save(this.props.actor, data);
    await this.props.onSaved?.();
  }
}

export function openTurnFavoriteEditor(props: { actor: any; snapshot: TurnSnapshot; onSaved?: () => Promise<void> | void }) {
  const app = new TurnFavoriteEditor({ actor: props.actor, snapshot: props.snapshot, onSaved: props.onSaved, title: 'Edit Turn Plan', kind: 'turn' });
  return app.render(true);
}

export function openReactionFavoriteEditor(props: { actor: any; snapshot: ReactionFavoriteSnapshot; onSaved?: () => Promise<void> | void }) {
  const app = new ReactionFavoriteEditor({ actor: props.actor, snapshot: props.snapshot, onSaved: props.onSaved, title: 'Edit Reaction Plan', kind: 'reaction' });
  return app.render(true);
}
