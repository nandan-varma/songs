import { desEcbDecrypt } from "./des";

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

/** JioSaavn encrypts media URLs with a fixed, publicly known DES key; this is not a secret. */
const MEDIA_KEY = new TextEncoder().encode("38346591");

/** Expands JioSaavn's `encrypted_media_url` into one link per bitrate. */
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

/** Expands a JioSaavn image URL (150x150 or 50x50) into the three sizes the clients use, over https. */
export function imageLinks(image: string): Link[] {
	if (!image) return [];
	return IMAGE_SIZES.map((quality) => ({
		quality,
		url: image.replace(/150x150|50x50/, quality).replace(/^http:/, "https:"),
	}));
}
