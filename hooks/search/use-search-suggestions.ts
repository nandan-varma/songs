import { useEffect, useState } from "react";
import { searchMusic } from "@/lib/api";

export function useSearchSuggestions(query: string) {
	const [suggestions, setSuggestions] = useState<string[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		if (!query.trim() || query.length < 2) {
			setSuggestions([]);
			return;
		}

		const timer = setTimeout(async () => {
			setIsLoading(true);
			try {
				const results = await searchMusic(query);
				const topQuery = results.data.topQuery;
				const names = topQuery.results.slice(0, 5).map((item) => {
					return item.title;
				});
				setSuggestions(names);
			} catch {
				setSuggestions([]);
			} finally {
				setIsLoading(false);
			}
		}, 300);

		return () => clearTimeout(timer);
	}, [query]);

	return { suggestions, isLoading };
}
