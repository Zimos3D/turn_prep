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
import { generateId } from '../../utils/data';
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
   * Prompts to save current turn plan to history and clear it
   */
  static async showEndOfTurnDialog(actor: Actor): Promise<void> {
    try {
      // Get current turn plan
      const currentPlan = actor.getFlag(
        FLAG_SCOPE,
        'currentTurnPlan'
      ) as TurnPlan | undefined;

      if (!currentPlan) {
        debug(`No current turn plan for ${actor.name}`);
        ui.notifications?.warn(`No active turn plan to save for ${actor.name}`);
        return;
      }

      // Check if plan has any features
      const hasFeatures =
        currentPlan.actions.length > 0 ||
        currentPlan.bonusActions.length > 0 ||
        currentPlan.reactions.length > 0 ||
        currentPlan.additionalFeatures.length > 0;

      if (!hasFeatures) {
        debug(`Current turn plan is empty for ${actor.name}`);
        const clearEmpty = await Dialog.confirm({
          title: `End Turn - ${actor.name}`,
          content: `<p>Your current turn plan is empty. Clear it anyway?</p>`,
        });

        if (clearEmpty) {
          await actor.unsetFlag(FLAG_SCOPE, 'currentTurnPlan');
          ui.notifications?.info(`Turn plan cleared for ${actor.name}`);
        }
        return;
      }

      // Confirm saving to history
      const proceed = await Dialog.confirm({
        title: `End Turn - ${actor.name}`,
        content: `<p>Save your current turn plan to history and clear it?</p>
                  <p><strong>${currentPlan.name}</strong></p>
                  <ul>
                    <li>Actions: ${currentPlan.actions.length}</li>
                    <li>Bonus Actions: ${currentPlan.bonusActions.length}</li>
                    <li>Reactions: ${currentPlan.reactions.length}</li>
                    <li>Other: ${currentPlan.additionalFeatures.length}</li>
                  </ul>`,
      });

      if (!proceed) {
        debug(`User cancelled end-of-turn for ${actor.name}`);
        return;
      }

      // Create history snapshot with rolls
      const snapshot = await RollHandler.createHistorySnapshot(actor, currentPlan);

      // Get existing history and add new snapshot
      const history = (actor.getFlag(FLAG_SCOPE, 'history') as TurnHistorySnapshot[]) || [];
      history.push(snapshot);

      // Save history
      await actor.setFlag(FLAG_SCOPE, 'history', history);

      // Clear current turn plan
      await actor.unsetFlag(FLAG_SCOPE, 'currentTurnPlan');

      ui.notifications?.info(
        `Turn plan saved to history and cleared for ${actor.name}`
      );
      debug(`Saved turn plan to history: ${snapshot.name}`);
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

      // Collect all features from the plan
      const features = [
        ...plan.actions,
        ...plan.bonusActions,
        ...plan.reactions,
        ...plan.additionalFeatures,
      ];

      if (features.length === 0) {
        debug('No features in plan, no rolls to discover');
        return rolls;
      }

      // Search recent chat messages for matching rolls
      const chatMessages = Array.from(game.messages || [])
        .filter((msg: any) => msg.speaker?.actor === actor.id)
        .sort((a: any, b: any) => b.timestamp - a.timestamp)
        .slice(0, 50); // Only look at recent 50 messages

      for (const msg of chatMessages) {
        const discoveredRolls = RollHandler.parseRollsFromChatMessage(msg, features);
        rolls.push(...discoveredRolls);
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
   * Parse rolls from a chat message
   * Returns multiple rolls if message contains attack + damage
   */
  private static parseRollsFromChatMessage(
    message: any,
    features: TurnPlanFeature[]
  ): DiscoveredRoll[] {
    const discoveredRolls: DiscoveredRoll[] = [];

    try {
      // Check if message has rolls array (Foundry V13+)
      if (!message.rolls || message.rolls.length === 0) return discoveredRolls;

      // Check for D&D5e activity data
      const dnd5eFlags = message.flags?.dnd5e;
      if (!dnd5eFlags?.activity && !dnd5eFlags?.item) return discoveredRolls;

      // Try to match to a feature in the plan
      const matchingFeature = features.find(
        (f) =>
          (dnd5eFlags.activity?.id && f.activityId === dnd5eFlags.activity.id) ||
          (dnd5eFlags.item?.id && f.sourceItemId === dnd5eFlags.item.id)
      );

      if (!matchingFeature) {
        debug(`Message for ${dnd5eFlags.item?.id} not in turn plan`);
        return discoveredRolls;
      }

      // Get item name from dnd5e flags or message flavor
      const itemName = dnd5eFlags.item?.uuid 
        ? (fromUuidSync(dnd5eFlags.item.uuid) as any)?.name || message.flavor || 'Unknown'
        : message.flavor || 'Unknown';
      const actorName = message.speaker?.alias || 'Unknown';
      
      // Get activity name if available
      const activityName = dnd5eFlags.activity?.uuid
        ? (fromUuidSync(dnd5eFlags.activity.uuid) as any)?.name
        : null;

      // Parse each roll in the message
      message.rolls.forEach((roll: any, index: number) => {
        const rollType = roll.constructor.name; // 'D20Roll', 'DamageRoll', etc.
        const rollLabel = rollType === 'D20Roll' ? 'Attack' : rollType === 'DamageRoll' ? 'Damage' : rollType;
        
        // Use activity name if available, otherwise use item name
        const displayName = activityName ? `${itemName}: ${activityName}` : itemName;
        
        discoveredRolls.push({
          id: generateId(),
          actorName,
          itemName: `${displayName} (${rollLabel})`,
          rollFormula: roll.formula,
          result: roll.total,
          timestamp: message.timestamp || Date.now(),
          chatMessageId: message.id,
        });
      });

      return discoveredRolls;
    } catch (error) {
      debug(`Failed to parse rolls from message: ${error}`);
      return discoveredRolls;
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
        id: generateId(),
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
        id: generateId(),
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
        id: generateId(),
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
        id: generateId(),
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

