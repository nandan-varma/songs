"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import { startEngine } from "@/lib/player/engine";
import { useLibrary } from "@/lib/stores/library";
import { usePlayer } from "@/lib/stores/player";
import { useSearchHistory } from "@/lib/stores/search";

export function Providers({ children }: { children: React.ReactNode }) {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: { queries: { staleTime: 5 * 60_000, retry: 1 } },
			}),
	);

	useEffect(() => {
		void usePlayer.persist.rehydrate();
		void useLibrary.persist.rehydrate();
		void useSearchHistory.persist.rehydrate();
		return startEngine();
	}, []);

	return (
		<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
			<QueryClientProvider client={queryClient}>
				<NuqsAdapter>{children}</NuqsAdapter>
				<Toaster position="top-center" />
			</QueryClientProvider>
		</ThemeProvider>
	);
}
