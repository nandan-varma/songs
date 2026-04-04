/**
 * Response Unwrapping Utilities
 * Extracts data from ApiResponse wrappers for use in React Query hooks
 */

import type { ApiResponse } from "@/types/api";

/**
 * Unwraps an ApiResponse<T> to extract T
 * Provides type-safe extraction of data from standard API responses
 *
 * @param response - The API response object with .data property
 * @returns The extracted data
 *
 * @example
 * const response = await getSongById(id);
 * const song = unwrapApiResponse(response);
 */
export function unwrapApiResponse<T>(response: ApiResponse<T>): T {
	return response.data;
}

/**
 * Safely unwraps a response that might be wrapped or unwrapped
 * Useful as a compatibility layer during migration
 *
 * @param response - Response that may or may not be wrapped
 * @returns Extracted data
 *
 * @example
 * const data = safeUnwrap(response);
 */
export function safeUnwrap<T>(response: ApiResponse<T> | T): T {
	if (response && typeof response === "object" && "data" in response) {
		return (response as ApiResponse<T>).data;
	}
	return response as T;
}

/**
 * Type guard to check if a value is an ApiResponse
 */
export function isApiResponse<T>(value: unknown): value is ApiResponse<T> {
	return (
		typeof value === "object" &&
		value !== null &&
		"data" in value &&
		"success" in value
	);
}
