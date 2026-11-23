"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import { startEngine } from "@/lib/player/engine";
import { useLibrary } from "@/lib/stores/library";
import { usePlayer } from "@/lib/stores/player";

export function Providers({ children }: { children: React.ReactNode }) {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: { queries: { staleTime: 5 * 60_000, retry: 1 } },
			}),
	);

	// Persisted stores skip automatic hydration so server and first client
	// render agree; restore them here, then bind the audio engine.
	useEffect(() => {
		void usePlayer.persist.rehydrate();
		void useLibrary.persist.rehydrate();
		return startEngine();
	}, []);

	return (
		<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
			<QueryClientProvider client={queryClient}>
				{children}
				<Toaster position="top-center" />
			</QueryClientProvider>
		</ThemeProvider>
	);
}
