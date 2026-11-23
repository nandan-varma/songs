/**
 * Error normalization utilities
 * Converts unknown error types to standardized Error objects
 */

/**
 * Normalize any error type to a standard Error object
 * @param error - Unknown error value
 * @returns Normalized Error instance with message
 */
export function normalizeError(error: unknown): Error {
	if (error instanceof Error) {
		return error;
	}

	if (typeof error === "string") {
		return new Error(error);
	}

	if (error === null || error === undefined) {
		return new Error("Unknown error occurred");
	}

	if (typeof error === "object") {
		const message =
			"message" in error && typeof error.message === "string"
				? error.message
				: JSON.stringify(error);
		return new Error(message);
	}

	return new Error(String(error));
}

/**
 * Extract error message from any error type
 * @param error - Unknown error value
 * @returns Error message string
 */
export function getErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}

	if (typeof error === "string") {
		return error;
	}

	if (error === null || error === undefined) {
		return "Unknown error";
	}

	if (typeof error === "object") {
		if ("message" in error && typeof error.message === "string") {
			return error.message;
		}
		return JSON.stringify(error);
	}

	return String(error);
}

/**
 * Get error code if available
 * @param error - Unknown error value
 * @returns Error code or undefined
 */
export function getErrorCode(error: unknown): string | undefined {
	if (error instanceof Error && "code" in error) {
		return error.code as string;
	}

	if (typeof error === "object" && error !== null && "code" in error) {
		const code = error.code;
		if (typeof code === "string" || typeof code === "number") {
			return String(code);
		}
	}

	return undefined;
}

/**
 * Check if error is an API error (has status code)
 * @param error - Unknown error value
 * @returns True if error appears to be an API error
 */
export function isApiError(error: unknown): boolean {
	if (typeof error === "object" && error !== null) {
		return "status" in error || "statusCode" in error || "code" in error;
	}
	return false;
}

/**
 * Check if error is a network error
 * @param error - Unknown error value
 * @returns True if error appears to be network-related
 */
export function isNetworkError(error: unknown): boolean {
	const message = getErrorMessage(error);
	return (
		message.toLowerCase().includes("network") ||
		message.toLowerCase().includes("fetch") ||
		message.toLowerCase().includes("timeout") ||
		message.toLowerCase().includes("connection")
	);
}

/**
 * Safe JSON parse with error handling
 * @param json - JSON string to parse
 * @param fallback - Value to return if parsing fails
 * @returns Parsed object or fallback
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
	try {
		const parsed = JSON.parse(json);
		return parsed as T;
	} catch {
		return fallback;
	}
}

/**
 * Safe JSON stringify with error handling
 * @param value - Value to stringify
 * @param fallback - Value to return if stringifying fails
 * @returns JSON string or fallback
 */
export function safeJsonStringify<T>(value: T, fallback = ""): string {
	try {
		return JSON.stringify(value);
	} catch {
		return fallback;
	}
}
