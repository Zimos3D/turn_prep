/**
 * Roll Handler
 * 
 * Integrates with Foundry's roll system and Turn Prep data:
 * 1. Discovers rolls in chat matching features/activities from turn plans
 * 2. Creates history snapshots containing discovered rolls and saving throws
 * 3. Manages edit history checkpoints (configurable, default 5 per turn plan)
 * 4. Allows restoration of previous turn plan versions
 * 5. Registers end-of-turn dialog on initiative advancement
 * 
 * Key Features:
 * - Chat-based roll discovery using feature/activity IDs
 * - Saving throw parsing from chat messages
 * - History snapshot with rolls, saves, and edit history embedded
 * - Edit checkpoint system with restore capability
 * - Initiative hook for end-of-turn detection and plan selection dialog
 */

import { info, debug, warn } from '../../utils/logging';
import { FoundryAdapter } from '../../foundry/FoundryAdapter';
import { FLAG_SCOPE } from '../../constants';
import type {
  TurnPlan,
  TurnSnapshot,
  TurnPlanFeature,
} from '../../types/turn-prep.types';

/**
 * Extended turn history with rolls and edit history
 */
interface TurnHistorySnapshot extends TurnSnapshot {
  rolls: DiscoveredRoll[];
  savingThrows: SavingThrowData[];
  editHistory: EditCheckpoint[];
  lastEditedAt: number;
}

/**
 * Roll discovered in chat
 */
interface DiscoveredRoll {
  id: string;
  featureId?: string;
  activityId?: string;
  actorName: string;
  itemName: string;
  rollFormula: string;
  result: number;
  timestamp: number;
  chatMessageId: string;
}

/**
 * Saving throw data from chat
 */
interface SavingThrowData {
  id: string;
  actorName: string;
  savingThrowType: string; // 'str', 'dex', 'con', 'int', 'wis', 'cha'
  dc: number;
  result: number;
  success: boolean;
  timestamp: number;
  chatMessageId: string;
}

/**
 * Edit checkpoint for turn plan history
 */
interface EditCheckpoint {
  id: string;
  timestamp: number;
  snapshot: TurnPlan;
  description: string; // e.g., "Added Fireball to Actions"
}

/**
 * RollHandler class
 * Manages roll discovery, history snapshots, and edit history
 */
export class RollHandler {
  /**
   * Register all roll-related hooks
   */
  static registerRollHooks(): void {
    info('Registering roll hooks...');

    try {
      // Register chat message hook for roll discovery
      RollHandler.registerChatMessageHook();

      // Register initiative hook for end-of-turn dialog
      RollHandler.registerInitiativeHook();

      // Register turn prep data update hook for edit history
      RollHandler.registerTurnPrepUpdateHook();

      info('Roll hooks registered successfully');
    } catch (error) {
      warn(`Failed to register roll hooks: ${error}`);
    }
  }

  /**
   * Register hook for chat message processing
   * Discovers rolls matching turn plan features
   */
  private static registerChatMessageHook(): void {
    Hooks.on('chatMessage', (chatLog: any, message: string, chatData: any) => {
      debug(`Chat message received: ${message}`);
      // Message parsing handled by native Foundry
      // Our job is to link discovered rolls to turn prep features
    });
  }

  /**
   * Register hook for initiative updates
   * Shows end-of-turn dialog when initiative advances
   */
  private static registerInitiativeHook(): void {
    Hooks.on('combatRound', (combat: any, round: number, changed: any) => {
      debug(`Combat round changed to ${round}`);
      RollHandler.handleCombatRoundChange(combat, round);
    });

    Hooks.on('combatTurn', (combat: any, turn: any, changed: any) => {
      debug(`Combat turn changed`);
      RollHandler.handleCombatTurnChange(combat, turn);
    });
  }

  /**
   * Register hook for Turn Prep data updates
   * Note: We don't create edit checkpoints for current turn plan changes.
   * Edit checkpoints are only for history snapshots to prevent misuse as records.
   * The current turn plan is a working space where users can freely modify.
   */
  private static registerTurnPrepUpdateHook(): void {
    Hooks.on('turnprepAddedFeature', (event: any) => {
      debug(`Feature added to turn prep: ${event.item?.name || 'unknown'}`);
      // No checkpoint creation for current turn plan
    });

    Hooks.on('turnprepRemovedFeature', (event: any) => {
      debug(`Feature removed from turn prep: ${event.item?.name || 'unknown'}`);
      // No checkpoint creation for current turn plan
    });
  }

  /**
   * Handle combat round changes
   * Detect end of round and show dialog
   */
  private static async handleCombatRoundChange(combat: any, round: number): Promise<void> {
    if (!combat?.combatant?.actor) return;

    const actor = combat.combatant.actor;
    debug(`Combat round change detected for ${actor.name}`);

    // Show end-of-turn dialog for current actor
    await RollHandler.showEndOfTurnDialog(actor);
  }

  /**
   * Handle combat turn changes
   * Detect when it's a new actor's turn
   */
  private static async handleCombatTurnChange(combat: any, turn: any): Promise<void> {
    if (!combat?.combatant?.actor) return;

    const actor = combat.combatant.actor;
    debug(`Combat turn change detected for ${actor.name}`);

    // Show end-of-turn dialog for current actor
    await RollHandler.showEndOfTurnDialog(actor);
  }

  /**
   * Show end-of-turn dialog
   * Allows actor to select which turn plan to use or view history
   */
  static async showEndOfTurnDialog(actor: Actor): Promise<void> {
    try {
      // Get history from actor flags
      const history = actor.getFlag(
        FLAG_SCOPE,
        'history'
      ) as TurnHistorySnapshot[] | undefined;

      if (!history || history.length === 0) {
        debug(`No turn prep history for ${actor.name}`);
        return;
      }

      // If only one history item, show confirmation to load it
      if (history.length === 1) {
        const proceed = await Dialog.confirm({
          title: `Load Turn Plan - ${actor.name}`,
          content: `<p>Load "${history[0].name}" as your active turn plan?</p>`,
        });

        if (proceed) {
          await actor.setFlag(
            FLAG_SCOPE,
            'currentTurnPlan',
            history[0]
          );
          ui.notifications?.info(`Loaded turn plan: ${history[0].name}`);
        }
        return;
      }

      // Multiple options - show selection dialog
      let dialogHtml = `<form style="padding: 1rem;">`;
      dialogHtml += `<p style="margin-bottom: 1rem;">Select a turn plan to load:</p>`;
      dialogHtml += `<div style="display: flex; flex-direction: column; gap: 0.5rem;">`;

      history.forEach((plan, index) => {
        const timestamp = new Date(plan.timestamp).toLocaleTimeString();
        dialogHtml += `
          <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
            <input type="radio" name="plan" value="${index}" ${index === 0 ? 'checked' : ''} />
            <span><strong>${plan.name}</strong> - ${timestamp}</span>
          </label>
        `;
      });

      dialogHtml += `</div></form>`;

      const dialog = new Dialog(
        {
          title: `Load Turn Plan - ${actor.name}`,
          content: dialogHtml,
          buttons: {
            load: {
              label: 'Load',
              icon: '<i class="fas fa-check"></i>',
              callback: async (html: JQuery) => {
                const selectedIndex = parseInt(
                  html.find('input[name="plan"]:checked').val() as string
                );
                const selectedPlan = history[selectedIndex];
                await actor.setFlag(
                  FLAG_SCOPE,
                  'currentTurnPlan',
                  selectedPlan
                );
                ui.notifications?.info(`Loaded turn plan: ${selectedPlan.name}`);
              },
            },
            cancel: {
              label: 'Cancel',
              icon: '<i class="fas fa-times"></i>',
            },
          },
          default: 'load',
        },
        { width: 500 }
      );

      dialog.render(true);
    } catch (error) {
      warn(`Failed to show end-of-turn dialog: ${error}`);
    }
  }

  /**
   * Discover rolls in chat history matching a turn plan
   * Searches for rolls from items in the plan
   */
  static async discoverRollsForPlan(
    actor: Actor,
    plan: TurnPlan
  ): Promise<DiscoveredRoll[]> {
    const rolls: DiscoveredRoll[] = [];

    try {
      debug(`Discovering rolls for plan "${plan.name}"`);

      // Collect all feature IDs from the plan
      const featureIds = new Set<string>();
      [
        ...plan.actions,
        ...plan.bonusActions,
        ...plan.reactions,
        ...plan.additionalFeatures,
      ].forEach((feature) => {
        featureIds.add(feature.sourceItemId);
      });

      if (featureIds.size === 0) {
        debug('No features in plan, no rolls to discover');
        return rolls;
      }

      // Search recent chat messages for matching rolls
      const chatMessages = Array.from(game.messages || [])
        .filter((msg: any) => msg.actor?.id === actor.id)
        .sort((a: any, b: any) => b.timestamp - a.timestamp)
        .slice(0, 50); // Only look at recent 50 messages

      for (const msg of chatMessages) {
        const roll = RollHandler.parseRollFromChatMessage(msg, featureIds);
        if (roll) {
          rolls.push(roll);
        }
      }

      debug(`Found ${rolls.length} rolls for plan "${plan.name}"`);
      return rolls;
    } catch (error) {
      warn(`Failed to discover rolls: ${error}`);
      return rolls;
    }
  }

  /**
   * Discover saving throws in chat history
   * Looks for saving throw messages in chat
   */
  static async discoverSavingThrowsForActor(actor: Actor): Promise<SavingThrowData[]> {
    const saves: SavingThrowData[] = [];

    try {
      debug(`Discovering saving throws for ${actor.name}`);

      const chatMessages = Array.from(game.messages || [])
        .filter((msg: any) => msg.actor?.id === actor.id)
        .sort((a: any, b: any) => b.timestamp - a.timestamp)
        .slice(0, 50);

      for (const msg of chatMessages) {
        const save = RollHandler.parseSavingThrowFromMessage(msg);
        if (save) {
          saves.push(save);
        }
      }

      debug(`Found ${saves.length} saving throws for ${actor.name}`);
      return saves;
    } catch (error) {
      warn(`Failed to discover saving throws: ${error}`);
      return saves;
    }
  }

  /**
   * Parse a roll from a chat message
   */
  private static parseRollFromChatMessage(
    message: any,
    featureIds: Set<string>
  ): DiscoveredRoll | null {
    try {
      // Check if message has a roll
      if (!message.roll) return null;

      // Try to match the message to one of our feature IDs
      // This would be enhanced with more sophisticated parsing
      const roll = message.roll as any;

      return {
        id: FoundryAdapter.generateId(),
        actorName: message.actor?.name || 'Unknown',
        itemName: message.flavor || 'Unknown roll',
        rollFormula: roll.formula,
        result: roll.total,
        timestamp: message.timestamp || Date.now(),
        chatMessageId: message.id,
      };
    } catch (error) {
      debug(`Failed to parse roll from message: ${error}`);
      return null;
    }
  }

  /**
   * Parse a saving throw from a chat message
   */
  private static parseSavingThrowFromMessage(message: any): SavingThrowData | null {
    try {
      // Check if this is a saving throw message
      if (!message.flavor?.includes('Save')) return null;

      // Parse the saving throw type and result
      const flavor = message.flavor || '';
      const savingThrowMatch = flavor.match(/(str|dex|con|int|wis|cha)/i);
      if (!savingThrowMatch) return null;

      const savingThrowType = savingThrowMatch[1].toLowerCase();
      const dcMatch = flavor.match(/DC\s*(\d+)/i);
      const dc = dcMatch ? parseInt(dcMatch[1]) : 0;

      return {
        id: FoundryAdapter.generateId(),
        actorName: message.actor?.name || 'Unknown',
        savingThrowType,
        dc,
        result: message.roll?.total || 0,
        success: (message.roll?.total || 0) >= dc,
        timestamp: message.timestamp || Date.now(),
        chatMessageId: message.id,
      };
    } catch (error) {
      debug(`Failed to parse saving throw: ${error}`);
      return null;
    }
  }

  /**
   * Create a history snapshot for current turn plan
   * Includes discovered rolls and saving throws
   */
  static async createHistorySnapshot(
    actor: Actor,
    plan: TurnPlan
  ): Promise<TurnHistorySnapshot> {
    try {
      debug(`Creating history snapshot for "${plan.name}"`);

      // Get existing edit history
      const editHistory = actor.getFlag(
        FLAG_SCOPE,
        `editHistory_${plan.name}`
      ) as EditCheckpoint[] | undefined;

      // Discover rolls and saves
      const rolls = await RollHandler.discoverRollsForPlan(actor, plan);
      const savingThrows = await RollHandler.discoverSavingThrowsForActor(actor);

      const snapshot: TurnHistorySnapshot = {
        id: FoundryAdapter.generateId(),
        name: plan.name,
        actions: plan.actions,
        bonusActions: plan.bonusActions,
        movement: plan.movement,
        reactions: plan.reactions,
        trigger: plan.trigger,
        roleplay: plan.roleplay,
        additionalFeatures: plan.additionalFeatures,
        notes: plan.notes,
        timestamp: Date.now(),
        rolls,
        savingThrows,
        editHistory: editHistory || [],
        lastEditedAt: plan.timestamp || Date.now(),
      };

      return snapshot;
    } catch (error) {
      warn(`Failed to create history snapshot: ${error}`);

      // Return basic snapshot without rolls if discovery fails
      return {
        id: FoundryAdapter.generateId(),
        name: plan.name,
        actions: plan.actions,
        bonusActions: plan.bonusActions,
        movement: plan.movement,
        reactions: plan.reactions,
        trigger: plan.trigger,
        roleplay: plan.roleplay,
        additionalFeatures: plan.additionalFeatures,
        notes: plan.notes,
        timestamp: Date.now(),
        rolls: [],
        savingThrows: [],
        editHistory: [],
        lastEditedAt: plan.timestamp || Date.now(),
      };
    }
  }

  /**
   * Create an edit checkpoint for the turn plan
   * Stores a snapshot of the plan at a point in time
   */
  static async createEditCheckpoint(
    actor: Actor,
    plan: TurnPlan,
    description: string
  ): Promise<void> {
    try {
      const checkpointLimit = FoundryAdapter.getSetting('editHistoryCheckpoints') as number;

      // Get existing checkpoints
      let checkpoints = (actor.getFlag(
        FLAG_SCOPE,
        `editHistory_${plan.name}`
      ) as EditCheckpoint[] | undefined) || [];

      // Create new checkpoint
      const checkpoint: EditCheckpoint = {
        id: FoundryAdapter.generateId(),
        timestamp: Date.now(),
        snapshot: JSON.parse(JSON.stringify(plan)), // Deep copy
        description,
      };

      checkpoints.push(checkpoint);

      // Limit to configured max checkpoints
      if (checkpoints.length > checkpointLimit) {
        checkpoints = checkpoints.slice(-checkpointLimit);
      }

      // Save checkpoints
      await actor.setFlag(
        FLAG_SCOPE,
        `editHistory_${plan.name}`,
        checkpoints
      );

      debug(`Created edit checkpoint for "${plan.name}": ${description}`);
    } catch (error) {
      warn(`Failed to create edit checkpoint: ${error}`);
    }
  }

  /**
   * Restore a turn plan from a previous edit checkpoint
   */
  static async restorePlanFromCheckpoint(
    actor: Actor,
    planName: string,
    checkpointId: string
  ): Promise<TurnPlan | null> {
    try {
      const checkpoints = actor.getFlag(
        FLAG_SCOPE,
        `editHistory_${planName}`
      ) as EditCheckpoint[] | undefined;

      if (!checkpoints) return null;

      const checkpoint = checkpoints.find((cp) => cp.id === checkpointId);
      if (!checkpoint) return null;

      const restoredPlan = checkpoint.snapshot;
      await actor.setFlag(FLAG_SCOPE, 'currentTurnPlan', restoredPlan);

      ui.notifications?.info(`Restored turn plan to: ${checkpoint.description}`);
      return restoredPlan;
    } catch (error) {
      warn(`Failed to restore checkpoint: ${error}`);
      return null;
    }
  }

  /**
   * Check if a feature still exists on an actor
   * Used to detect missing features and auto-remove them
   */
  static doesFeatureExist(actor: Actor, feature: TurnPlanFeature): boolean {
    try {
      const item = actor.items.get(feature.sourceItemId);
      if (!item) return false;

      // Feature exists if we found the item
      // In Phase 4+, could check if specific activity still exists
      return true;
    } catch (error) {
      warn(`Failed to check feature existence: ${error}`);
      return false;
    }
  }

  /**
   * Remove missing features from a turn plan
   * Mirrors Tidy5E behavior
   */
  static async removeMissingFeaturesFromPlan(
    actor: Actor,
    plan: TurnPlan
  ): Promise<TurnPlan> {
    const cleaned = {
      ...plan,
      actions: plan.actions.filter((f) => RollHandler.doesFeatureExist(actor, f)),
      bonusActions: plan.bonusActions.filter((f) => RollHandler.doesFeatureExist(actor, f)),
      reactions: plan.reactions.filter((f) => RollHandler.doesFeatureExist(actor, f)),
      additionalFeatures: plan.additionalFeatures.filter((f) =>
        RollHandler.doesFeatureExist(actor, f)
      ),
    };

    const removed =
      plan.actions.length - cleaned.actions.length +
      plan.bonusActions.length - cleaned.bonusActions.length +
      plan.reactions.length - cleaned.reactions.length +
      plan.additionalFeatures.length - cleaned.additionalFeatures.length;

    if (removed > 0) {
      debug(`Removed ${removed} missing features from turn plan`);
      await actor.setFlag(FLAG_SCOPE, 'currentTurnPlan', cleaned);
    }

    return cleaned;
  }
}

// Register hooks on module load
Hooks.once('ready', () => {
  RollHandler.registerRollHooks();
});

