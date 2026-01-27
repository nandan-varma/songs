"use client";

import { createContext, type ReactNode, useContext } from "react";
import type { CachedSong } from "@/hooks/data/use-cache-manager";
import { useDownloadsStore } from "@/stores/downloads-store";
import type { DetailedSong } from "@/types/entity";

export type { CachedSong } from "@/hooks/data/use-cache-manager";

interface DownloadsState {
	cachedSongs: Map<string, CachedSong>;
	isDownloading: boolean;
}

interface DownloadsActions {
	downloadSong: (song: DetailedSong) => Promise<void>;
	removeSong: (songId: string) => void;
	getSongBlob: (songId: string) => Promise<Blob | null>;
	isSongCached: (songId: string) => boolean;
	saveToDevice: () => Promise<void>;
}

const DownloadsStateContext = createContext<DownloadsState | undefined>(
	undefined,
);
const DownloadsActionsContext = createContext<DownloadsActions | undefined>(
	undefined,
);

export function DownloadsProvider({ children }: { children: ReactNode }) {
	const store = useDownloadsStore();

	const stateValue = {
		cachedSongs: store.cachedSongs,
		isDownloading: store.isDownloading,
	};

	const actionsValue = {
		downloadSong: store.downloadSong,
		removeSong: store.removeSong,
		getSongBlob: store.getSongBlob,
		isSongCached: store.isSongCached,
		saveToDevice: store.saveToDevice,
	};

	return (
		<DownloadsStateContext.Provider value={stateValue}>
			<DownloadsActionsContext.Provider value={actionsValue}>
				{children}
			</DownloadsActionsContext.Provider>
		</DownloadsStateContext.Provider>
	);
}

export function useDownloadsState() {
	const context = useContext(DownloadsStateContext);
	if (context === undefined) {
		throw new Error(
			"useDownloadsState must be used within a DownloadsProvider",
		);
	}
	return context;
}

export function useDownloadsActions() {
	const context = useContext(DownloadsActionsContext);
	if (context === undefined) {
		throw new Error(
			"useDownloadsActions must be used within a DownloadsProvider",
		);
	}
	return context;
}

export function useDownloads() {
	return {
		...useDownloadsState(),
		...useDownloadsActions(),
	};
}
