import type { Track } from "@/lib/models";

export function downloadHref(track: Track): string {
	const name = `${track.title} - ${track.artists.map((a) => a.name).join(", ")}`;
	return `/api/download?${new URLSearchParams({ url: track.audioUrl, name })}`;
}
