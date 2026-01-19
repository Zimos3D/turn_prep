/**
 * Logging Utilities
 * 
 * Provides consistent console logging for the module.
 * Follows Tidy 5E patterns with [module-id] prefix.
 * Includes debug mode support and multiple log levels.
 */

import { LOG_PREFIX, LogLevel, MODULE_ID } from '../constants';

// ============================================================================
// Logging Configuration
// ============================================================================

/**
 * Internal debug mode flag
 * Can be enabled via: window.TURN_PREP_DEBUG = true
 */
let debugMode = (globalThis as any).TURN_PREP_DEBUG === true;

/**
 * Enable or disable debug logging
 */
export function setDebugMode(enabled: boolean): void {
  debugMode = enabled;
  if (enabled) {
    console.log(`${LOG_PREFIX} Debug mode enabled`);
  }
}

/**
 * Check if debug mode is enabled
 */
export function isDebugMode(): boolean {
  return debugMode;
}

// ============================================================================
// Core Logging Functions
// ============================================================================

/**
 * Log a debug message
 * Only logged if debug mode is enabled
 * @param message - The message to log
 * @param args - Additional arguments to log
 */
export function debug(message: string, ...args: any[]): void {
  if (!debugMode) return;
  console.debug(`${LOG_PREFIX} [DEBUG]`, message, ...args);
}

/**
 * Log an info message
 * Always logged in development/testing
 * @param message - The message to log
 * @param args - Additional arguments to log
 */
export function info(message: string, ...args: any[]): void {
  console.info(`${LOG_PREFIX}`, message, ...args);
}

/**
 * Log a warning message
 * @param message - The warning message
 * @param args - Additional arguments to log
 */
export function warn(message: string, ...args: any[]): void {
  console.warn(`${LOG_PREFIX} [WARN]`, message, ...args);
}

/**
 * Log an error message with optional error object
 * @param message - The error message
 * @param error - Optional Error object or additional args
 */
export function error(message: string, error?: Error | any, ...args: any[]): void {
  console.error(`${LOG_PREFIX} [ERROR]`, message);
  if (error instanceof Error) {
    console.error('Stack:', error.stack);
    console.error('Details:', error);
  } else if (error) {
    console.error('Details:', error, ...args);
  } else if (args.length > 0) {
    console.error('Details:', ...args);
  }
}

// ============================================================================
// Context-Aware Logging
// ============================================================================

/**
 * Log a message with operation context
 * Useful for tracking what operation failed
 * @param operation - What operation was being performed
 * @param message - The log message
 * @param args - Additional arguments
 */
export function logOperation(operation: string, message: string, ...args: any[]): void {
  info(`[${operation}] ${message}`, ...args);
}

/**
 * Log an error with operation context
 * @param operation - What operation failed
 * @param message - The error message
 * @param error - Optional error object
 */
export function logOperationError(
  operation: string,
  message: string,
  error?: Error
): void {
  error(`[${operation}] ${message}`, error);
}

// ============================================================================
// Data Logging
// ============================================================================

/**
 * Log an object in a readable format
 * Useful for debugging complex data structures
 * @param label - Label for the data
 * @param data - The object to log
 */
export function logData(label: string, data: any): void {
  debug(`[DATA] ${label}`, data);
  if (debugMode) {
    console.table(data);
  }
}

/**
 * Log a data change for comparison
 * @param label - What changed
 * @param before - Previous value
 * @param after - New value
 */
export function logDataChange(label: string, before: any, after: any): void {
  debug(`[CHANGE] ${label}`);
  debug('Before:', before);
  debug('After:', after);
}

// ============================================================================
// Foundry UI Notifications
// ============================================================================

/**
 * Show a notification to the user in Foundry UI
 * Uses Foundry's built-in notification system
 * @param message - The message to display
 * @param type - Type of notification (info, warning, error)
 * @param duration - How long to show (ms), 0 = persistent
 */
export function notify(
  message: string,
  type: 'info' | 'warning' | 'error' = 'info',
  duration: number = 5000
): void {
  if (typeof ui !== 'undefined' && ui.notifications) {
    ui.notifications[type === 'warning' ? 'warn' : type](message, { permanent: duration === 0 });
  } else {
    // Fallback if Foundry UI not ready
    console.log(`${LOG_PREFIX} [NOTIFY:${type.toUpperCase()}]`, message);
  }
}

/**
 * Show a success notification
 * @param message - The success message
 */
export function notifySuccess(message: string): void {
  notify(message, 'info', 3000);
}

/**
 * Show a warning notification
 * @param message - The warning message
 */
export function notifyWarning(message: string): void {
  notify(message, 'warning', 5000);
}

/**
 * Show an error notification
 * @param message - The error message
 */
export function notifyError(message: string): void {
  notify(message, 'error', 0); // Persistent
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format a value for logging
 * Handles various types: objects, errors, strings, etc.
 * @param value - The value to format
 * @returns Formatted string
 */
export function formatValue(value: any): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (value instanceof Error) return `Error: ${value.message}`;
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/**
 * Create a section divider in console logs
 * Useful for grouping related logs
 * @param title - Section title
 */
export function logSection(title: string): void {
  console.log(`\n${LOG_PREFIX} ========== ${title} ==========\n`);
}
