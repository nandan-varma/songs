"use client";

import { Check, Download, Loader2, Music, Play, Plus } from "lucide-react";
import Link from "next/link";
import { memo, useCallback } from "react";
import { ProgressiveImage } from "@/components/common/progressive-image";
import { useDownloadsActions } from "@/contexts/downloads-context";
import { EntityType, type Song } from "@/types/entity";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";

interface SongItemProps {
	song: Song;
	onPlay: (song: Song) => void;
	onAddToQueue: (song: Song) => void;
	onDownload?: (song: Song) => void;
	showDownload?: boolean;
	isLoading?: boolean;
}

export const SongItem = memo(function SongItem({
	song,
	onPlay,
	onAddToQueue,
	onDownload,
	showDownload = true,
	isLoading = false,
}: SongItemProps) {
	const { isSongCached } = useDownloadsActions();

	const isDownloaded = isSongCached(song.id);

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

	const handleDownload = useCallback(
		(e: React.MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();
			if (onDownload) {
				onDownload(song);
			}
		},
		[song, onDownload],
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
						<Link href={`/song?id=${song.id}`}>
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
							disabled={isLoading}
							aria-label="Play song"
						>
							{isLoading ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<Play className="h-4 w-4" />
							)}
						</Button>
						<Button
							size="icon"
							variant="ghost"
							onClick={handleAddToQueue}
							disabled={isLoading}
							aria-label="Add to queue"
						>
							{isLoading ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<Plus className="h-4 w-4" />
							)}
						</Button>
						{showDownload && (
							<Button
								size="icon"
								variant="ghost"
								onClick={handleDownload}
								disabled={isDownloaded || !onDownload || isLoading}
								aria-label={
									isDownloaded ? "Already downloaded" : "Download song"
								}
								className={isDownloaded ? "text-green-600" : ""}
							>
								{isDownloaded ? (
									<Check className="h-4 w-4" />
								) : (
									<Download className="h-4 w-4" />
								)}
							</Button>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
});
