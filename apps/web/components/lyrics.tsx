"use client";

import { ErrorState } from "@/components/states";
import { Skeleton } from "@/components/ui/skeleton";
import { useLyrics } from "@/lib/api/queries";

export function Lyrics({ lyricsId }: { lyricsId: string }) {
	const { data, isPending, isError, refetch } = useLyrics(lyricsId);
	if (isPending) {
		return (
			<div aria-busy className="space-y-2">
				<Skeleton className="h-4 w-2/3" />
				<Skeleton className="h-4 w-1/2" />
				<Skeleton className="h-4 w-3/5" />
			</div>
		);
	}
	if (isError) {
		return (
			<ErrorState
				message="Lyrics are not available."
				onRetry={() => refetch()}
			/>
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
