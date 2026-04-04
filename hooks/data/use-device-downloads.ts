/**
 * Device Download Management Hook
 * Centralized management of download state, progress, and operations
 * Replaces: download-button.tsx complexity (useState, useCallback patterns)
 */

import { useCallback, useState } from "react";

export interface DownloadProgress {
	songId: string;
	progress: number; // 0-100
	totalBytes: number;
	downloadedBytes: number;
	speed: number; // bytes per second
	timeRemaining: number; // seconds
}

export interface DownloadState {
	/** Map of song ID to download progress */
	downloads: Map<string, DownloadProgress>;
	/** Currently downloading song IDs */
	activeDownloads: Set<string>;
	/** Completed downloads */
	completed: Set<string>;
	/** Failed downloads with errors */
	failed: Map<string, Error>;
}

export interface UseDeviceDownloadsOptions {
	/** Called when download completes */
	onDownloadComplete?: (songId: string) => void;
	/** Called when download fails */
	onDownloadError?: (songId: string, error: Error) => void;
	/** Called when download starts */
	onDownloadStart?: (songId: string) => void;
	/** Max concurrent downloads */
	maxConcurrent?: number;
}

/**
 * Hook for managing device downloads
 *
 * @example
 * const { startDownload, cancelDownload, downloads, isDownloading } =
 *   useDeviceDownloads({ maxConcurrent: 3 });
 *
 * const handleDownload = async (songId: string) => {
 *   await startDownload(songId);
 * };
 */
export function useDeviceDownloads(options?: UseDeviceDownloadsOptions) {
	const maxConcurrent = options?.maxConcurrent ?? 3;

	const [state, setState] = useState<DownloadState>({
		downloads: new Map(),
		activeDownloads: new Set(),
		completed: new Set(),
		failed: new Map(),
	});

	const [queue, setQueue] = useState<string[]>([]);

	const startDownload = useCallback(
		async (songId: string) => {
			// Add to queue if already at max concurrent
			if (state.activeDownloads.size >= maxConcurrent) {
				setQueue((prev) => [...prev, songId]);
				return;
			}

			setState((prev) => ({
				...prev,
				activeDownloads: new Set([...prev.activeDownloads, songId]),
				failed: new Map(prev.failed),
			}));

			options?.onDownloadStart?.(songId);

			try {
				// Simulate download progress
				const totalBytes = 5 * 1024 * 1024; // 5MB example
				let downloadedBytes = 0;
				const startTime = Date.now();

				while (downloadedBytes < totalBytes) {
					downloadedBytes += Math.random() * 512 * 1024; // 512KB chunks
					downloadedBytes = Math.min(downloadedBytes, totalBytes);

					const elapsed = (Date.now() - startTime) / 1000;
					const speed = downloadedBytes / elapsed;
					const timeRemaining = (totalBytes - downloadedBytes) / speed || 0;

					setState((prev) => {
						const downloads = new Map(prev.downloads);
						downloads.set(songId, {
							songId,
							progress: (downloadedBytes / totalBytes) * 100,
							totalBytes,
							downloadedBytes,
							speed,
							timeRemaining,
						});
						return { ...prev, downloads };
					});

					if (downloadedBytes < totalBytes) {
						await new Promise((resolve) => setTimeout(resolve, 100));
					}
				}

				setState((prev) => ({
					...prev,
					activeDownloads: new Set(
						[...prev.activeDownloads].filter((id) => id !== songId),
					),
					completed: new Set([...prev.completed, songId]),
				}));

				options?.onDownloadComplete?.(songId);

				// Process queue
				if (queue.length > 0) {
					const nextSongId = queue[0] as string;
					setQueue((prev) => prev.slice(1));
					await startDownload(nextSongId);
				}
			} catch (error) {
				const err = error instanceof Error ? error : new Error(String(error));
				setState((prev) => ({
					...prev,
					activeDownloads: new Set(
						[...prev.activeDownloads].filter((id) => id !== songId),
					),
					failed: new Map([...prev.failed, [songId, err]]),
				}));

				options?.onDownloadError?.(songId, err);
			}
		},
		[state.activeDownloads.size, maxConcurrent, options, queue],
	);

	const cancelDownload = useCallback((songId: string) => {
		setState((prev) => ({
			...prev,
			activeDownloads: new Set(
				[...prev.activeDownloads].filter((id) => id !== songId),
			),
			downloads: new Map([...prev.downloads].filter(([id]) => id !== songId)),
		}));

		setQueue((prev) => prev.filter((id) => id !== songId));
	}, []);

	const clearFailed = useCallback(() => {
		setState((prev) => ({
			...prev,
			failed: new Map(),
		}));
	}, []);

	const getProgress = useCallback(
		(songId: string) => state.downloads.get(songId),
		[state.downloads],
	);

	const isDownloading = useCallback(
		(songId: string) => state.activeDownloads.has(songId),
		[state.activeDownloads],
	);

	const isCompleted = useCallback(
		(songId: string) => state.completed.has(songId),
		[state.completed],
	);

	const isFailed = useCallback(
		(songId: string) => state.failed.has(songId),
		[state.failed],
	);

	return {
		...state,
		startDownload,
		cancelDownload,
		clearFailed,
		getProgress,
		isDownloading,
		isCompleted,
		isFailed,
		queueLength: queue.length,
		hasActiveDownloads: state.activeDownloads.size > 0,
	};
}
