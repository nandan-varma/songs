/**
 * Query Factory - Eliminates repetition in React Query hooks
 * Provides helpers for creating type-safe query hooks with defaults
 */

import type { UseQueryOptions, UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import type { ApiError } from "@/lib/api/types";

/**
 * Options for creating a query hook
 */
export interface CreateQueryOptions<T, E = ApiError> {
	/** Query stale time (ms) - how long until query becomes stale */
	staleTime?: number;
	/** Cache time (ms) - how long to keep unused queries cached */
	gcTime?: number;
	/** Whether to refetch on window focus */
	refetchOnWindowFocus?: boolean;
	/** Whether to refetch on mount */
	refetchOnMount?: boolean | "stale";
	/** Retry configuration */
	retry?: number | ((count: number, error: E) => boolean);
}

/**
 * Standard query hook defaults
 */
export const QUERY_DEFAULTS = {
	/** Metadata stale time - 10 minutes */
	metadata: 10 * 60 * 1000,
	/** Search results stale time - 5 minutes */
	search: 5 * 60 * 1000,
	/** Suggestions stale time - 15 minutes */
	suggestions: 15 * 60 * 1000,
	/** Downloads stale time - 1 hour */
	downloads: 60 * 60 * 1000,
	/** Cache time (gc time) - 30 minutes */
	gcTime: 30 * 60 * 1000,
} as const;

/**
 * Helper to create query key
 * @param namespace - Unique namespace for the query
 * @param params - Parameters that should be part of the key
 * @returns Query key array
 *
 * @example
 * const key = createQueryKey("song", { id: "123" });
 * // Returns: ["song", { id: "123" }]
 */
export function createQueryKey(
	namespace: string,
	params?: Record<string, any>,
): readonly string[] | readonly [string, Record<string, any>] {
	return params ? [namespace, params] : [namespace];
}

/**
 * Merge query options with defaults
 * @param options - User provided options
 * @param defaults - Default options
 * @returns Merged options
 *
 * @example
 * const mergedOptions = mergeQueryOptions(userOptions, QUERY_PRESETS.metadata);
 */
export function mergeQueryOptions<T, E = ApiError>(
	options?: CreateQueryOptions<T, E>,
	defaults?: CreateQueryOptions<T, E>,
): CreateQueryOptions<T, E> {
	return {
		staleTime:
			options?.staleTime ?? defaults?.staleTime ?? QUERY_DEFAULTS.metadata,
		gcTime: options?.gcTime ?? defaults?.gcTime ?? QUERY_DEFAULTS.gcTime,
		refetchOnWindowFocus:
			options?.refetchOnWindowFocus ?? defaults?.refetchOnWindowFocus ?? false,
		refetchOnMount:
			options?.refetchOnMount ?? defaults?.refetchOnMount ?? "stale",
		retry: options?.retry ?? defaults?.retry ?? 1,
	};
}

/**
 * Presets for common query configurations
 */
export const QUERY_PRESETS = {
	/** Metadata queries (songs, albums, artists) */
	metadata: {
		staleTime: QUERY_DEFAULTS.metadata,
		gcTime: QUERY_DEFAULTS.gcTime,
		retry: 2,
		refetchOnWindowFocus: false,
	},
	/** Search queries */
	search: {
		staleTime: QUERY_DEFAULTS.search,
		gcTime: QUERY_DEFAULTS.gcTime,
		retry: 1,
		refetchOnWindowFocus: false,
	},
	/** Suggestion queries */
	suggestions: {
		staleTime: QUERY_DEFAULTS.suggestions,
		gcTime: QUERY_DEFAULTS.gcTime,
		retry: 1,
		refetchOnWindowFocus: false,
	},
	/** Download-related queries */
	downloads: {
		staleTime: QUERY_DEFAULTS.downloads,
		gcTime: QUERY_DEFAULTS.gcTime,
		retry: 3,
		refetchOnWindowFocus: false,
	},
} as const;
