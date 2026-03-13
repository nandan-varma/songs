/**
 * Error handling utilities for audio player
 */

const IS_DEV = process.env.NODE_ENV === "development";

/**
 * Media error codes from HTML5 AudioElement
 */
export enum MediaErrorCode {
	MEDIA_ERR_ABORTED = 1,
	MEDIA_ERR_NETWORK = 2,
	MEDIA_ERR_DECODE = 3,
	MEDIA_ERR_SRC_NOT_SUPPORTED = 4,
}

/**
 * Human-readable messages for media error codes
 */
export const MEDIA_ERROR_MESSAGES: Record<number, string> = {
	[MediaErrorCode.MEDIA_ERR_ABORTED]: "Playback was aborted",
	[MediaErrorCode.MEDIA_ERR_NETWORK]: "Network error occurred",
	[MediaErrorCode.MEDIA_ERR_DECODE]: "Audio decode error",
	[MediaErrorCode.MEDIA_ERR_SRC_NOT_SUPPORTED]: "Audio format not supported",
};

/**
 * Log audio error with context information
 * @param error - MediaError from audio element
 * @param context - Where the error occurred
 */
export function logAudioError(error: MediaError | null, context: string): void {
	if (!error) return;

	const errorInfo = {
		code: error.code,
		message: error.message,
		MEDIA_ERR_ABORTED: error.MEDIA_ERR_ABORTED,
		MEDIA_ERR_NETWORK: error.MEDIA_ERR_NETWORK,
		DECODE: error.MEDIA_ERR_DECODE,
		SRC_NOT_SUPPORTED: error.MEDIA_ERR_SRC_NOT_SUPPORTED,
		context,
		timestamp: new Date().toISOString(),
	};

	if (IS_DEV) {
		console.error(`[Audio Error] ${context}:`, errorInfo);
	} else {
		console.error(`[Audio Error] ${context}:`, error.code, error.message);
	}
}

/**
 * Get human-readable error message
 * @param error - MediaError from audio element
 * @returns Human-readable error message
 */
export function getAudioErrorMessage(error: MediaError | null): string {
	if (!error) {
		return "Unknown audio error";
	}
	return MEDIA_ERROR_MESSAGES[error.code] || error.message || "Unknown error";
}

/**
 * Check if error is recoverable (can retry playback)
 * @param error - MediaError from audio element
 * @returns True if playback can be retried
 */
export function isAudioErrorRecoverable(error: MediaError | null): boolean {
	if (!error) return true;
	return error.code === MediaErrorCode.MEDIA_ERR_NETWORK;
}

/**
 * Handle audio error with appropriate recovery action
 * @param error - MediaError from audio element
 * @param onRetry - Callback to retry playback
 * @param onFail - Callback when error is not recoverable
 */
export function handleAudioError(
	error: MediaError | null,
	onRetry: () => void,
	onFail: () => void,
): void {
	logAudioError(error, "AudioErrorHandler");

	if (isAudioErrorRecoverable(error)) {
		onRetry();
	} else {
		onFail();
	}
}

/**
 * Silent error handler for non-critical operations
 * Used for operations where failure doesn't affect playback
 */
export function silentErrorHandler(error: unknown): void {
	if (IS_DEV) {
		console.debug("[Silent Error]", error);
	}
}

/**
 * Create a wrapped error handler for Promise catches
 * @param context - Where the error occurred
 * @returns Error handler function
 */
export function createErrorHandler(context: string) {
	return (error: unknown): void => {
		if (IS_DEV) {
			console.error(`[Error] ${context}:`, error);
		}
	};
}

/**
 * Safe audio operation wrapper
 * @param operation - Function that may throw
 * @param context - Operation context for error logging
 * @returns Result of operation or undefined on error
 */
export function safeAudioOperation<T>(
	operation: () => T,
	context: string,
): T | undefined {
	try {
		return operation();
	} catch (error) {
		logAudioError(error as MediaError, context);
		return undefined;
	}
}
