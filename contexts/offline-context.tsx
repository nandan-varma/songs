"use client";

import type React from "react";
import { createContext, useContext } from "react";
import { useOfflineStore } from "@/stores/offline-store";
import type { DetailedSong, Song } from "@/types/entity";

interface OfflineState {
	isOfflineMode: boolean;
	cachedSongsCount: number;
}

interface OfflineActions {
	setOfflineMode: (enabled: boolean) => void;
	getFilteredSongs: <T extends Song | DetailedSong>(songs: T[]) => T[];
	getCachedSongsOnly: () => DetailedSong[];
	isOnlineContentAvailable: <T extends Song | DetailedSong>(
		songs: T[],
	) => boolean;
	shouldEnableQuery: () => boolean;
}

const OfflineContext = createContext<
	(OfflineState & OfflineActions) | undefined
>(undefined);

export function OfflineProvider({ children }: { children: React.ReactNode }) {
	const store = useOfflineStore();

	const value = {
		isOfflineMode: store.isOfflineMode,
		cachedSongsCount: store.cachedSongsCount,
		setOfflineMode: store.setOfflineMode,
		getFilteredSongs: store.getFilteredSongs,
		getCachedSongsOnly: store.getCachedSongsOnly,
		isOnlineContentAvailable: store.isOnlineContentAvailable,
		shouldEnableQuery: store.shouldEnableQuery,
	};

	return (
		<OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>
	);
}

export function useOffline() {
	const context = useContext(OfflineContext);
	if (context === undefined) {
		throw new Error("useOffline must be used within an OfflineProvider");
	}
	return context;
}
