"use client";

import { Music, Play, Plus } from "lucide-react";
import Link from "next/link";
import { memo, useCallback } from "react";
import { EntityType, type Song } from "@/lib/types";
import { ProgressiveImage } from "./progressive-image";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";

interface SongItemProps {
	song: Song;
	onPlay: (song: Song) => void;
	onAddToQueue: (song: Song) => void;
}

export const SongItem = memo(function SongItem({
	song,
	onPlay,
	onAddToQueue,
}: SongItemProps) {
	const handlePlay = useCallback(
		(e: React.MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();
			onPlay(song);
		},
		[song, onPlay],
	);

	const handleAddToQueue = useCallback(
		(e: React.MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();
			onAddToQueue(song);
		},
		[song, onAddToQueue],
	);

	return (
		<Card className="overflow-hidden hover:bg-accent/50 transition-colors">
			<CardContent className="p-4">
				<div className="flex items-center gap-4">
					<div className="relative h-16 w-16 flex-shrink-0">
						{song.image && song.image.length > 0 ? (
							<ProgressiveImage
								images={song.image}
								alt={song.title}
								entityType={EntityType.SONG}
								rounded="default"
							/>
						) : (
							<div className="flex h-full w-full items-center justify-center bg-muted rounded">
								<Music className="h-8 w-8 text-muted-foreground" />
							</div>
						)}
					</div>
					<div className="flex-1 min-w-0">
						<Link href={`/songs/${song.id}`}>
							<h3 className="font-medium truncate hover:underline">
								{song.title}
							</h3>
						</Link>
						<p className="text-sm text-muted-foreground truncate">
							{song.primaryArtists}
						</p>
						<p className="text-xs text-muted-foreground truncate">
							{song.album}
						</p>
					</div>
					<div className="flex gap-2 flex-shrink-0">
						<Button
							size="icon"
							variant="ghost"
							onClick={handlePlay}
							aria-label="Play song"
						>
							<Play className="h-4 w-4" />
						</Button>
						<Button
							size="icon"
							variant="ghost"
							onClick={handleAddToQueue}
							aria-label="Add to queue"
						>
							<Plus className="h-4 w-4" />
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	);
});
