/**
 * Zod schemas for API request and response validation
 * Ensures runtime type safety for all API interactions
 */

import { z } from "zod";

/**
 * Base schema for API responses
 */
export const ApiResponseSchema = z.object({
	success: z.boolean().describe("Whether the API call was successful"),
	data: z.unknown().describe("Response data payload"),
});

/**
 * Schema for paginated responses
 */
export const PaginatedResponseSchema = z.object({
	total: z.number().int().min(0).describe("Total number of items"),
	start: z.number().int().min(0).describe("Starting index"),
	results: z.array(z.unknown()).describe("Array of results"),
});

/**
 * Validate API response structure
 * @param data - Data to validate
 * @returns Parsed data if valid, throws error if invalid
 */
export function validateApiResponse<T>(
	data: unknown,
	schema: z.ZodSchema<T>,
): T {
	return schema.parse(data);
}

/**
 * Safe API response validation with fallback
 * @param data - Data to validate
 * @param schema - Zod schema for validation
 * @param fallback - Fallback value if validation fails
 * @returns Validated data or fallback
 */
export function safeValidateApiResponse<T>(
	data: unknown,
	schema: z.ZodSchema<T>,
	fallback: T,
): T {
	try {
		return schema.parse(data);
	} catch {
		return fallback;
	}
}

/**
 * Get validation error details
 * @param error - Zod validation error
 * @returns Formatted error message
 */
export function getValidationErrorMessage(error: z.ZodError): string {
	const issues = error.issues.map((issue) => {
		const path = issue.path.join(".");
		return `${path || "root"}: ${issue.message}`;
	});
	return issues.join("\n");
}

/**
 * Create a safe API fetch with validation
 * @param url - URL to fetch
 * @param schema - Zod schema for response validation
 * @returns Promise resolving to validated data
 */
export async function fetchWithValidation<T>(
	url: string,
	schema: z.ZodSchema<T>,
	options?: { signal?: AbortSignal },
): Promise<T> {
	const response = await fetch(url, { signal: options?.signal });

	if (!response.ok) {
		throw new Error(`HTTP ${response.status}: ${response.statusText}`);
	}

	const data = await response.json();
	return validateApiResponse(data, schema);
}
