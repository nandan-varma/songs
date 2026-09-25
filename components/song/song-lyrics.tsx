"use client";

import { Loader2, Mic2 } from "lucide-react";
import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSongLyrics } from "@/hooks/data/queries";

interface SongLyricsProps {
	songId: string;
}

/**
 * Displays full lyrics for a song, shown only when the song reports `hasLyrics`.
 */
export const SongLyrics = memo(function SongLyrics({
	songId,
}: SongLyricsProps) {
	const { data: lyrics, isPending, error } = useSongLyrics(songId);

	if (error) return null;

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-lg">
					<Mic2 className="h-4 w-4" />
					Lyrics
				</CardTitle>
			</CardHeader>
			<CardContent>
				{isPending ? (
					<div className="flex items-center justify-center py-8">
						<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
					</div>
				) : (
					<div className="space-y-1 text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
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
