/**
 * Logger utility for MCP communication
 * 
 * This file provides logging functions that use stderr instead of stdout
 * to avoid interfering with the MCP protocol's JSON communication.
 */

/**
 * Log a debug message to stderr with timestamp
 */
export function debug(message: string): void {
  process.stderr.write(`[DEBUG ${new Date().toISOString()}] ${message}\n`);
}

/**
 * Log an info message to stderr with timestamp
 */
export function info(message: string): void {
  process.stderr.write(`[INFO ${new Date().toISOString()}] ${message}\n`);
}

/**
 * Log a warning message to stderr with timestamp
 */
export function warn(message: string): void {
  process.stderr.write(`[WARN ${new Date().toISOString()}] ${message}\n`);
}

/**
 * Log an error message to stderr with timestamp
 */
export function error(message: string): void {
  process.stderr.write(`[ERROR ${new Date().toISOString()}] ${message}\n`);
}

/**
 * Format an error object to a string with details
 */
export function formatError(err: unknown): string {
  if (err instanceof Error) {
    return `${err.message}${err.stack ? `\n${err.stack}` : ''}`;
  }
  return String(err);
}

/**
 * Deprecated console.log replacement
 * Use this function instead of console.log to avoid breaking MCP communication
 */
export function log(message: string): void {
  process.stderr.write(`${message}\n`);
} 