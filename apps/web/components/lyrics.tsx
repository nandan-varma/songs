"use client";

import { useLyrics } from "@/lib/api/queries";

export function Lyrics({ lyricsId }: { lyricsId: string }) {
	const { data, isPending, isError } = useLyrics(lyricsId);
	if (isPending)
		return <p className="text-sm text-muted-foreground">Loading lyrics...</p>;
	if (isError) {
		return (
			<p className="text-sm text-muted-foreground">Lyrics are not available.</p>
		);
	}
	return (
		<div className="space-y-2">
			<p className="leading-relaxed whitespace-pre-line">{data.text}</p>
			{data.copyright && (
				<p className="text-xs text-muted-foreground">{data.copyright}</p>
			)}
		</div>
	);
}
