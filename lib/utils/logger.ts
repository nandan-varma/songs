/**
 * General logging utilities
 * Controls console output based on environment
 */

const IS_PRODUCTION = process.env.NODE_ENV === "production";

/**
 * Log error in development only
 * In production, errors are silently ignored unless critical
 */
export function logError(context: string, error: unknown): void {
	if (!IS_PRODUCTION) {
		console.error(`[${context}]`, error);
	}
}

/**
 * Log warning in development only
 */
export function logWarning(context: string, message: string): void {
	if (!IS_PRODUCTION) {
		console.warn(`[${context}] ${message}`);
	}
}

/**
 * Log info in development only
 */
export function logInfo(context: string, message: string): void {
	if (!IS_PRODUCTION) {
		console.log(`[${context}] ${message}`);
	}
}

/**
 * Debug log - only shows in development
 */
export function debug(context: string, ...args: unknown[]): void {
	if (!IS_PRODUCTION) {
		console.debug(`[${context}]`, ...args);
	}
}
