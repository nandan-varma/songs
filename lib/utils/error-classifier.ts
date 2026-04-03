/**
 * Error Classifier Utility
 * Categorizes errors for appropriate handling and user messaging
 */

export enum ErrorCategory {
	/** Network-related errors (timeouts, connection failures) */
	NETWORK = "NETWORK",
	/** Authentication/Authorization errors */
	AUTH = "AUTH",
	/** Data validation errors */
	VALIDATION = "VALIDATION",
	/** Server errors (5xx) */
	SERVER = "SERVER",
	/** Client errors (4xx, excluding validation and auth) */
	CLIENT = "CLIENT",
	/** Audio playback errors */
	AUDIO = "AUDIO",
	/** Storage/Database errors */
	STORAGE = "STORAGE",
	/** Unknown errors */
	UNKNOWN = "UNKNOWN",
}

export interface ClassifiedError {
	category: ErrorCategory;
	message: string;
	isDeveloper: boolean;
	isRetryable: boolean;
	userMessage?: string;
}

/**
 * Classify an error for appropriate handling
 * @param error - The error to classify
 * @returns ClassifiedError with category, messages, and flags
 */
export function classifyError(error: unknown): ClassifiedError {
	// Network errors
	if (error instanceof TypeError) {
		if (
			error.message.includes("fetch") ||
			error.message.includes("network") ||
			error.message.includes("Failed to fetch")
		) {
			return {
				category: ErrorCategory.NETWORK,
				message: error.message,
				isDeveloper: true,
				isRetryable: true,
				userMessage: "Network connection failed. Please check your internet.",
			};
		}
	}

	// HTTP Response errors
	if (error instanceof Response) {
		const status = error.status;

		if (status === 401 || status === 403) {
			return {
				category: ErrorCategory.AUTH,
				message: `HTTP ${status}: ${error.statusText}`,
				isDeveloper: false,
				isRetryable: false,
				userMessage: "Authentication failed. Please log in again.",
			};
		}

		if (status === 400) {
			return {
				category: ErrorCategory.VALIDATION,
				message: `HTTP ${status}: ${error.statusText}`,
				isDeveloper: true,
				isRetryable: false,
				userMessage: "Invalid data provided. Please check your input.",
			};
		}

		if (status >= 500) {
			return {
				category: ErrorCategory.SERVER,
				message: `HTTP ${status}: ${error.statusText}`,
				isDeveloper: false,
				isRetryable: true,
				userMessage: "Server error. Please try again later.",
			};
		}

		if (status >= 400) {
			return {
				category: ErrorCategory.CLIENT,
				message: `HTTP ${status}: ${error.statusText}`,
				isDeveloper: true,
				isRetryable: false,
				userMessage: "Request failed. Please try again.",
			};
		}
	}

	// Error object
	if (error instanceof Error) {
		const msg = error.message.toLowerCase();

		// Audio errors
		if (msg.includes("audio") || msg.includes("media")) {
			return {
				category: ErrorCategory.AUDIO,
				message: error.message,
				isDeveloper: false,
				isRetryable: true,
				userMessage: "Failed to play audio. Please try another file.",
			};
		}

		// Storage/DB errors
		if (
			msg.includes("indexeddb") ||
			msg.includes("quota exceeded") ||
			msg.includes("storage")
		) {
			return {
				category: ErrorCategory.STORAGE,
				message: error.message,
				isDeveloper: true,
				isRetryable: false,
				userMessage: "Storage full. Please clear some data.",
			};
		}

		// Auth errors
		if (msg.includes("unauthorized") || msg.includes("unauthenticated")) {
			return {
				category: ErrorCategory.AUTH,
				message: error.message,
				isDeveloper: false,
				isRetryable: false,
				userMessage: "Authentication failed. Please log in again.",
			};
		}

		// Validation errors
		if (msg.includes("validation") || msg.includes("invalid")) {
			return {
				category: ErrorCategory.VALIDATION,
				message: error.message,
				isDeveloper: true,
				isRetryable: false,
				userMessage: "Invalid data provided.",
			};
		}

		// Generic error
		return {
			category: ErrorCategory.UNKNOWN,
			message: error.message,
			isDeveloper: true,
			isRetryable: true,
		};
	}

	// Unknown error type
	return {
		category: ErrorCategory.UNKNOWN,
		message: String(error),
		isDeveloper: false,
		isRetryable: false,
	};
}

/**
 * Get user-friendly error message
 * @param error - The error to get message for
 * @returns User-friendly message
 */
export function getUserErrorMessage(error: unknown): string {
	const classified = classifyError(error);
	return (
		classified.userMessage || "An unexpected error occurred. Please try again."
	);
}

/**
 * Should show error to user?
 * @param category - Error category
 * @returns True if error should be shown to user
 */
export function shouldShowError(category: ErrorCategory): boolean {
	return [
		ErrorCategory.AUTH,
		ErrorCategory.AUDIO,
		ErrorCategory.NETWORK,
		ErrorCategory.VALIDATION,
	].includes(category);
}

/**
 * Can retry this error?
 * @param error - The error to check
 * @returns True if error is retryable
 */
export function isErrorRetryable(error: unknown): boolean {
	return classifyError(error).isRetryable;
}
