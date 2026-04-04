"use client";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type * as React from "react";
import { useEffect } from "react";
import { getQueryClient } from "@/app/get-query-client";
import { ErrorBoundary } from "@/components/common/error-boundary";
import { getDownloadedSongIds } from "@/lib/downloads/storage";
import { useAppStore } from "@/lib/store";
import { logError } from "@/lib/utils/logger";

export default function Providers({ children }: { children: React.ReactNode }) {
	const queryClient = getQueryClient();

	useEffect(() => {
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
