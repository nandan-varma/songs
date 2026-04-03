"use client";

import { useCallback, useEffect, useState } from "react";
import type { CacheKey, CacheTime } from "@/lib/cache";
import { cacheManager } from "@/lib/cache";

/**
 * Universal cache hook for reading and writing to the unified cache
 * Handles memory (Query), IndexedDB, and localStorage transparently
 */
export function useCache<T>(
	key: CacheKey,
	ttl: CacheTime = 1000 * 60 * 10,
	store: keyof typeof import("@/lib/cache/constants").STORAGE_CONFIG.STORES = "METADATA",
) {
	const [data, setData] = useState<T | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	// Load data on mount
	useEffect(() => {
		let isMounted = true;

		const loadData = async () => {
			try {
				setIsLoading(true);
				const cached = await cacheManager.get<T>(key, store);
				if (isMounted) {
					setData(cached);
					setError(null);
				}
			} catch (e) {
				if (isMounted) {
					setError(e instanceof Error ? e : new Error(String(e)));
				}
			} finally {
				if (isMounted) {
					setIsLoading(false);
				}
			}
		};

		loadData();

		return () => {
			isMounted = false;
		};
	}, [key, store]);

	// Write to cache
	const updateCache = useCallback(
		async (value: T) => {
			try {
				await cacheManager.set<T>(key, value, ttl, store);
				setData(value);
				setError(null);
			} catch (e) {
				setError(e instanceof Error ? e : new Error(String(e)));
			}
		},
		[key, ttl, store],
	);

	// Invalidate cache
	const invalidate = useCallback(() => {
		const keyStr = typeof key === "string" ? key : String(key);
		cacheManager.invalidate(keyStr);
		setData(null);
	}, [key]);

	return {
		data,
		isLoading,
		error,
		updateCache,
		invalidate,
	};
}
