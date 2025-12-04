import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
	type DetailedSong,
	type Image,
	ImageQuality,
	type Song,
} from "./types";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * Get image URL by quality preference
 * @param images - Array of images with different qualities
 * @param quality - Preferred quality level ('low', 'medium', 'high')
 * @returns Image URL or null if not found
 */
export function getImageByQuality(
	images: Image[] | undefined,
	quality: "low" | "medium" | "high",
): string | null {
	if (!images || images.length === 0) return null;

	const qualityMap = {
		low: [ImageQuality.LOW, 0],
		medium: [ImageQuality.MEDIUM, 1],
		high: [ImageQuality.HIGH, 2],
	} as const;

	const [targetQuality, targetIndex] = qualityMap[quality];

	// Try to find by quality string match first
	const imageByQuality = images.find(
		(img) =>
			img.quality === targetQuality || img.quality === targetQuality.toString(),
	);
	if (imageByQuality?.url) return imageByQuality.url;

	// Fallback to index-based access
	if (images[targetIndex]?.url) return images[targetIndex].url;

	// Final fallback to any available image
	return images[0]?.url || null;
}

/**
 * Get image URL with fallback
 * @param images - Array of images
 * @param fallbackUrl - Fallback URL if no images available
 * @returns Image URL (preferring high quality) or fallback
 */
export function getImageUrl(
	images: Image[] | undefined,
	fallbackUrl: string = "https://placehold.co/500x500?text=No+Image",
): string {
	if (!images || images.length === 0) return fallbackUrl;

	// Try high quality first
	const highQuality = getImageByQuality(images, "high");
	if (highQuality) return highQuality;

	// Fallback to any available image
	return images[images.length - 1]?.url || images[0]?.url || fallbackUrl;
}

export function detailedSongToSong(detailedSong: DetailedSong): Song {
	return {
		id: detailedSong.id,
		title: detailedSong.name,
		image: detailedSong.image,
		album: detailedSong.album.name || "",
		url: detailedSong.url,
		type: detailedSong.type,
		description: detailedSong.artists.primary.map((a) => a.name).join(", "),
		primaryArtists: detailedSong.artists.primary.map((a) => a.name).join(", "),
		singers: detailedSong.artists.all.map((a) => a.name).join(", "),
		language: detailedSong.language,
	};
}
