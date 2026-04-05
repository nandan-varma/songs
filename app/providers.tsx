"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type * as React from "react";
import { useEffect, useState } from "react";
import { ErrorBoundary } from "@/components/common/error-boundary";
import { getDownloadedSongIds } from "@/lib/downloads/storage";
import { useAppStore } from "@/lib/store";
import { logError } from "@/lib/utils/logger";

function createQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 60 * 1000,
			},
		},
	});
}

export default function Providers({ children }: { children: React.ReactNode }) {
	const [queryClient] = useState(createQueryClient);

	useEffect(() => {
		useAppStore.persist.rehydrate();

		void getDownloadedSongIds()
			.then((songIds) => {
				useAppStore.getState().syncDownloadedSongs(songIds);
			})
			.catch((error) => {
				logError("Providers:syncDownloads", error);
			});
	}, []);

	return (
		<QueryClientProvider client={queryClient}>
			<ErrorBoundary context="App">
				{children}
				{process.env.NODE_ENV === "development" && <ReactQueryDevtools />}
			</ErrorBoundary>
		</QueryClientProvider>
	);
}
