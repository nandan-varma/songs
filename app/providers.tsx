"use client";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type * as React from "react";
import { useEffect } from "react";
import { getQueryClient } from "@/app/get-query-client";
import { ErrorBoundary } from "@/components/common/error-boundary";
import { useDownloadsStore } from "@/stores/downloads-store";
import { useFavoritesStore } from "@/stores/favorites-store";
import { useOfflineStore } from "@/stores/offline-store";
import { usePlaylistsStore } from "@/stores/playlists-store";

export default function Providers({ children }: { children: React.ReactNode }) {
	const queryClient = getQueryClient();

	// Initialize stores on mount
	useEffect(() => {
		// Load data from IndexedDB
		useFavoritesStore.getState().loadFavorites();
		usePlaylistsStore.getState().loadPlaylists();
		useDownloadsStore.getState().loadCachedSongs();

		// Set up network detection for offline mode
		const handleOnline = () => useOfflineStore.getState().setIsOnline(true);
		const handleOffline = () => useOfflineStore.getState().setIsOnline(false);

		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);

		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
		};
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
