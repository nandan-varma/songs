"use client";

import { Loader2, Mic2 } from "lucide-react";
import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSongLyrics } from "@/hooks/data/queries";
import { cn } from "@/lib/utils";

interface SongLyricsProps {
	songId: string;
	/** Cap the height and scroll inside the card; turn off when the parent already scrolls. */
	capHeight?: boolean;
}

/**
 * Displays full lyrics for a song, shown only when the song reports `hasLyrics`.
 */
export const SongLyrics = memo(function SongLyrics({
	songId,
	capHeight = true,
}: SongLyricsProps) {
	const { data: lyrics, isPending, error } = useSongLyrics(songId);

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-lg">
					<Mic2 className="h-4 w-4" />
					Lyrics
				</CardTitle>
			</CardHeader>
			<CardContent>
				{error ? (
					<p className="py-6 text-center text-sm text-muted-foreground">
						Lyrics aren't available for this song.
					</p>
				) : isPending ? (
					<div className="flex items-center justify-center py-8">
						<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
					</div>
				) : (
					<div
						className={cn(
							"space-y-1 text-sm leading-relaxed text-muted-foreground whitespace-pre-line",
							capHeight && "max-h-96 overflow-y-auto",
						)}
					>
						{lyrics?.lyrics.replace(/<br\s*\/?>/gi, "\n")}
					</div>
				)}
				{lyrics?.copyright && (
					<p className="mt-4 text-xs text-muted-foreground/70">
						{lyrics.copyright}
					</p>
				)}
			</CardContent>
		</Card>
	);
});
