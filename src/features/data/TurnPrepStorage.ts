/**
 * Turn Prep Storage Layer
 * 
 * Handles persistence of turn prep data to actor flags.
 * All data is stored in actor.flags['turn-prep'].turnPrepData
 * This abstraction allows changing storage location easily if needed.
 * 
 * TODO: Implement storage class with methods:
 * - static async save(actor: Actor, data: TurnPrepData): Promise<void>
 * - static load(actor: Actor): TurnPrepData
 * - static async clear(actor: Actor): Promise<void>
 * - static isFlagValid(data: any): boolean (validation)
 * - Handle data migrations if schema changes
 * - Graceful fallback if data is corrupted
 */

// TODO: Implement TurnPrepStorage class
