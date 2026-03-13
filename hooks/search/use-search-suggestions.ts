import { useEffect, useRef, useState } from "react";
import { searchMusic } from "@/lib/api";

export function useSearchSuggestions(query: string) {
	const [suggestions, setSuggestions] = useState<string[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const abortControllerRef = useRef<AbortController | null>(null);

	useEffect(() => {
		if (!query.trim() || query.length < 2) {
			setSuggestions([]);
			return;
		}

		// Cancel previous request
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
		}

		abortControllerRef.current = new AbortController();

		const timer = setTimeout(async () => {
			setIsLoading(true);
			try {
				const results = await searchMusic(query, {
					signal: abortControllerRef.current?.signal,
				});
				const topQuery = results.data.topQuery;
				const names = topQuery.results.slice(0, 5).map((item) => {
					return item.title;
				});
				setSuggestions(names);
			} catch (error) {
				if (error instanceof Error && error.name !== "AbortError") {
					setSuggestions([]);
				}
			} finally {
				setIsLoading(false);
			}
		}, 300);

		return () => {
			clearTimeout(timer);
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}
		};
	}, [query]);

	return { suggestions, isLoading };
}
