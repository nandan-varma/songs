import { desEcbDecrypt } from "./des.js";

export interface Link {
	quality: string;
	url: string;
}

const AUDIO_QUALITIES = [
	["_12", "12kbps"],
	["_48", "48kbps"],
	["_96", "96kbps"],
	["_160", "160kbps"],
	["_320", "320kbps"],
] as const;

const IMAGE_SIZES = ["50x50", "150x150", "500x500"] as const;

const MEDIA_KEY = new TextEncoder().encode("38346591");

export function audioLinks(encrypted: string | null): Link[] {
	if (!encrypted) return [];
	const url = new TextDecoder().decode(
		desEcbDecrypt(MEDIA_KEY, Buffer.from(encrypted, "base64")),
	);
	return AUDIO_QUALITIES.map(([suffix, quality]) => ({
		quality,
		url: url.replace("_96", suffix),
	}));
}

export function imageLinks(image: string): Link[] {
	if (!image) return [];
	return IMAGE_SIZES.map((quality) => ({
		quality,
		url: image.replace(/150x150|50x50/, quality).replace(/^http:/, "https:"),
	}));
}
