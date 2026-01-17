"use client";

import { createContext, type ReactNode, useContext, useMemo } from "react";
import { type CachedSong, useCacheManager } from "@/hooks/use-cache-manager";
import { useDeviceStorage } from "@/hooks/use-device-storage";
import { useDownloadOperations } from "@/hooks/use-download-operations";
import type { DetailedSong } from "@/lib/types";

export type { CachedSong } from "@/hooks/use-cache-manager";

interface DownloadsState {
	cachedSongs: Map<string, CachedSong>;
	isDownloading: boolean;
}

interface DownloadsActions {
	downloadSong: (song: DetailedSong) => Promise<void>;
	removeSong: (songId: string) => void;
	getSongBlob: (songId: string) => Blob | null;
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
	const cacheManager = useCacheManager();
	const downloadOps = useDownloadOperations({
		cachedSongs: cacheManager.cachedSongs,
		addToCache: cacheManager.addToCache,
		removeFromCache: cacheManager.removeFromCache,
	});
	const deviceStorage = useDeviceStorage({
		cachedSongs: cacheManager.cachedSongs,
	});

	const stateValue = useMemo(
		() => ({
			cachedSongs: cacheManager.cachedSongs,
			isDownloading: downloadOps.isDownloading,
		}),
		[cacheManager.cachedSongs, downloadOps.isDownloading],
	);

	const actionsValue = useMemo(
		() => ({
			downloadSong: downloadOps.downloadSong,
			removeSong: downloadOps.removeSong,
			getSongBlob: cacheManager.getSongBlob,
			isSongCached: cacheManager.isSongCached,
			saveToDevice: deviceStorage.saveToDevice,
		}),
		[
			downloadOps.downloadSong,
			downloadOps.removeSong,
			cacheManager.getSongBlob,
			cacheManager.isSongCached,
			deviceStorage.saveToDevice,
		],
	);

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
