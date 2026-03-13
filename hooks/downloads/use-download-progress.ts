import { useCallback, useState } from "react";

export interface DownloadProgress {
	downloadedBytes: number;
	totalBytes: number;
	percentage: number;
}

/**
 * Manages download progress tracking
 * Single responsibility: Progress state management
 */
export function useDownloadProgress() {
	const [progress, setProgress] = useState<DownloadProgress>({
		downloadedBytes: 0,
		totalBytes: 0,
		percentage: 0,
	});

	const updateProgress = useCallback((downloaded: number, total: number) => {
		const percentage = total > 0 ? Math.round((downloaded / total) * 100) : 0;
		setProgress({
			downloadedBytes: downloaded,
			totalBytes: total,
			percentage,
		});
	}, []);

	const resetProgress = useCallback(() => {
		setProgress({
			downloadedBytes: 0,
			totalBytes: 0,
			percentage: 0,
		});
	}, []);

	return {
		progress,
		updateProgress,
		resetProgress,
	};
}
