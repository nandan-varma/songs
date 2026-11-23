"use client";

import { SongListSkeleton } from "@/components/skeletons";
import { SongList } from "@/components/song-list";
import { EmptyState, ErrorState } from "@/components/states";
import { useSuggestions } from "@/lib/api/queries";

export function Suggestions({ songId }: { songId: string }) {
	const { data, isPending, isError, refetch } = useSuggestions(songId);
	if (isPending) return <SongListSkeleton count={4} />;
	if (isError) {
		return (
			<ErrorState
				message="Suggestions are unavailable."
				onRetry={() => refetch()}
			/>
		);
	}
	if (data.length === 0)
		return <EmptyState title="No suggestions for this song" />;
	return <SongList tracks={data} />;
}
