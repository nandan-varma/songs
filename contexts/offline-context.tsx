"use client";

import React, {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import { useDownloads } from "@/contexts/downloads-context";
import type { DetailedSong, Song } from "@/lib/types";
import { toast } from "sonner";

interface OfflineState {
	isOfflineMode: boolean;
	cachedSongsCount: number;
}

interface OfflineActions {
	setOfflineMode: (enabled: boolean) => void;
	getFilteredSongs: <T extends Song | DetailedSong>(songs: T[]) => T[];
	getCachedSongsOnly: () => DetailedSong[];
	isOnlineContentAvailable: <T extends Song | DetailedSong>(songs: T[]) => boolean;
	shouldEnableQuery: () => boolean;
}

const OfflineContext = createContext<
	(OfflineState & OfflineActions) | undefined
>(undefined);

export function OfflineProvider({ children }: { children: React.ReactNode }) {
	const [isOnline, setIsOnline] = useState(true);
	const { isSongCached, cachedSongs } = useDownloads();

	// Offline mode is purely based on network status
	const isOfflineMode = !isOnline;

	const cachedSongsCount = useMemo(() => {
		return cachedSongs.size;
	}, [cachedSongs]);

	// Monitor network status
	useEffect(() => {
		if (typeof window === "undefined") return;

		let isInitial = true;

		const updateOnlineStatus = () => {
			const online = navigator.onLine;
			const wasOnline = isOnline;
			setIsOnline(online);
			
			// Show toast notifications for network changes (skip initial load)
			if (!isInitial) {
				if (!online) {
					toast.warning("No internet connection", {
						description: "Switched to offline mode. Only cached songs are available.",
					});
				} else if (wasOnline === false) {
					toast.success("Back online", {
						description: "Internet connection restored.",
					});
				}
			}
			
			isInitial = false;
		};

		// Set initial state
		updateOnlineStatus();

		// Listen for network changes
		window.addEventListener("online", updateOnlineStatus);
		window.addEventListener("offline", updateOnlineStatus);

		return () => {
			window.removeEventListener("online", updateOnlineStatus);
			window.removeEventListener("offline", updateOnlineStatus);
		};
	}, [isOnline]);

	// Toggle is disabled - offline mode is automatic based on network
	const setOfflineMode = useCallback((enabled: boolean) => {
		// No-op: offline mode is now purely based on network status
	}, []);

	const getFilteredSongs = useCallback(
		<T extends Song | DetailedSong>(songs: T[]): T[] => {
			if (!isOfflineMode) return songs;
			return songs.filter((song) => isSongCached(song.id));
		},
		[isOfflineMode, isSongCached],
	);

	const getCachedSongsOnly = useCallback((): DetailedSong[] => {
		return Array.from(cachedSongs.values()).map((item) => item.song);
	}, [cachedSongs]);

	const isOnlineContentAvailable = useCallback(
		<T extends Song | DetailedSong>(songs: T[]): boolean => {
			if (!isOfflineMode) return true;
			return songs.some((song) => isSongCached(song.id));
		},
		[isOfflineMode, isSongCached],
	);

	const shouldEnableQuery = useCallback((): boolean => {
		return !isOfflineMode;
	}, [isOfflineMode]);

	const value = useMemo(
		() => ({
			isOfflineMode,
			cachedSongsCount,
			setOfflineMode,
			getFilteredSongs,
			getCachedSongsOnly,
			isOnlineContentAvailable,
			shouldEnableQuery,
		}),
		[
			isOfflineMode,
			cachedSongsCount,
			setOfflineMode,
			getFilteredSongs,
			getCachedSongsOnly,
			isOnlineContentAvailable,
			shouldEnableQuery,
		],
	);

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