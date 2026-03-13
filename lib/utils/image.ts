import type { Image as ImageType } from "@/types/entity";

export function getImageQuality(image: ImageType): number {
	return parseInt(image.quality?.split("x")[0] || "0", 10) || 0;
}

export function sortImagesByQuality(images: ImageType[]): ImageType[] {
	return [...images].sort((a, b) => getImageQuality(a) - getImageQuality(b));
}

export function getSmallestImage(images: ImageType[]): string {
	if (!images || images.length === 0) {
		return "https://placehold.co/500x500.webp?text=Image+Not+Found";
	}
	const sorted = sortImagesByQuality(images);
	return (
		sorted[0]?.url || "https://placehold.co/500x500.webp?text=Image+Not+Found"
	);
}

export function getLargestImage(images: ImageType[]): string {
	if (!images || images.length === 0) {
		return "https://placehold.co/500x500.webp?text=Image+Not+Found";
	}
	const sorted = sortImagesByQuality(images);
	return (
		sorted[sorted.length - 1]?.url ||
		sorted[0]?.url ||
		"https://placehold.co/500x500.webp?text=Image+Not+Found"
	);
}
