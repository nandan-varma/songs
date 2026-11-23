"use client";

import { TrackList } from "@/components/track-list";
import { useSuggestions } from "@/lib/api/queries";

export function Suggestions({ songId }: { songId: string }) {
	const { data } = useSuggestions(songId);
	if (!data?.length) {
		return (
			<p className="text-sm text-muted-foreground">
				No suggestions for this song.
			</p>
		);
	}
	return <TrackList tracks={data} />;
}
