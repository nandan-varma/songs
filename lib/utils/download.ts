/**
 * Audio quality selection and download utilities
 */

import type { DetailedSong, DownloadUrl } from "@/types/entity";

/**
 * Quality preference order (best to worst)
 */
export const AUDIO_QUALITY_ORDER = [
	"320kbps",
	"160kbps",
	"96kbps",
	"64kbps",
	"32kbps",
	"12kbps",
] as const;

/**
 * Select best available download URL based on quality preference
 * @param downloadUrls - Array of available download URLs
 * @param preferredQuality - Preferred quality (default: 320kbps)
 * @returns Best available download URL or undefined if none available
 */
export function selectBestDownloadUrl(
	downloadUrls: DownloadUrl[] | undefined,
	preferredQuality: string = "320kbps",
): DownloadUrl | undefined {
	if (!downloadUrls || downloadUrls.length === 0) {
		return undefined;
	}

	// Try to find preferred quality
	const preferredUrl = downloadUrls.find(
		(url) => url.quality === preferredQuality,
	);
	if (preferredUrl) {
		return preferredUrl;
	}

	// Fall back to quality order
	for (const quality of AUDIO_QUALITY_ORDER) {
		const url = downloadUrls.find((u) => u.quality === quality);
		if (url) {
			return url;
		}
	}

	// Last resort: return first available
	return downloadUrls[0];
}

/**
 * Get download URL string from song
 * @param song - Song to get download URL from
 * @param preferredQuality - Preferred quality
 * @returns Download URL string or undefined
 */
export function getDownloadUrl(
	song: DetailedSong,
	preferredQuality?: string,
): string | undefined {
	const downloadUrl = selectBestDownloadUrl(song.downloadUrl, preferredQuality);
	return downloadUrl?.url;
}

/**
 * Validate download URL is accessible
 * @param url - URL to validate
 * @returns Promise resolving to true if URL is accessible
 */
export async function validateDownloadUrl(url: string): Promise<boolean> {
	try {
		const response = await fetch(url, { method: "HEAD" });
		return response.ok;
	} catch {
		return false;
	}
}

/**
 * Get all available qualities from download URLs
 * @param downloadUrls - Array of download URLs
 * @returns Array of available qualities
 */
export function getAvailableQualities(
	downloadUrls: DownloadUrl[] | undefined,
): string[] {
	if (!downloadUrls) {
		return [];
	}
	return downloadUrls.map((url) => url.quality);
}

/**
 * Check if a quality is available
 * @param downloadUrls - Array of download URLs
 * @param quality - Quality to check
 * @returns True if quality is available
 */
export function isQualityAvailable(
	downloadUrls: DownloadUrl[] | undefined,
	quality: string,
): boolean {
	return downloadUrls?.some((url) => url.quality === quality) ?? false;
}
