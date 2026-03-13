import { useCallback, useEffect, useState } from "react";

const SEARCH_HISTORY_KEY = "music-app-search-history";
const MAX_HISTORY_ITEMS = 10;

export function useSearchHistory() {
	const [history, setHistory] = useState<string[]>([]);

	useEffect(() => {
		if (typeof window === "undefined") return;

		try {
			const data = localStorage.getItem(SEARCH_HISTORY_KEY);
			if (data) {
				const parsed = JSON.parse(data);
				setHistory(parsed);
			}
		} catch (_error) {
			setHistory([]);
		}
	}, []);

	const addToHistory = useCallback((query: string) => {
		if (!query.trim()) return;

		setHistory((prev) => {
			const filtered = prev.filter(
				(item) => item.toLowerCase() !== query.toLowerCase(),
			);
			const updated = [query, ...filtered].slice(0, MAX_HISTORY_ITEMS);

			if (typeof window !== "undefined") {
				localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
			}

			return updated;
		});
	}, []);

	const removeFromHistory = useCallback((query: string) => {
		setHistory((prev) => {
			const filtered = prev.filter((item) => item !== query);
			if (typeof window !== "undefined") {
				localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(filtered));
			}
			return filtered;
		});
	}, []);

	const clearHistory = useCallback(() => {
		setHistory([]);
		if (typeof window !== "undefined") {
			localStorage.removeItem(SEARCH_HISTORY_KEY);
		}
	}, []);

	return {
		history,
		addToHistory,
		removeFromHistory,
		clearHistory,
		maxItems: MAX_HISTORY_ITEMS,
	};
}
