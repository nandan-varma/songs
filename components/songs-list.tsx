"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { usePlayerActions } from "@/contexts/player-context";
import { useDownloadsActions } from "@/contexts/downloads-context";
import { getSongById } from "@/lib/api";
import type { Song } from "@/lib/types";
import { SongItem } from "./song-item";

interface SongsListProps {
	songs: Song[];
}

export function SongsList({ songs }: SongsListProps) {
	const { playSong, addToQueue } = usePlayerActions();
	const { addToDownloadQueue } = useDownloadsActions();

	const handlePlay = useCallback(
		async (song: Song) => {
			try {
				const detailedSong = await getSongById(song.id);
				playSong(detailedSong.data[0]);
				toast.success(`Now playing: ${song.title}`);
			} catch (err) {
				toast.error("Failed to play song");
				console.error(err);
			}
		},
		[playSong],
	);

	const handleAddToQueue = useCallback(
		async (song: Song) => {
			try {
				const detailedSong = await getSongById(song.id);
				addToQueue(detailedSong.data[0]);
				toast.success(`Added to queue: ${song.title}`);
			} catch (err) {
				toast.error("Failed to add to queue");
				console.error(err);
			}
		},
		[addToQueue],
	);

	const handleDownload = useCallback(
		async (song: Song) => {
			try {
				const detailedSong = await getSongById(song.id);
				addToDownloadQueue(detailedSong.data[0]);
				toast.success(`Added to download queue: ${song.title}`);
			} catch (err) {
				toast.error("Failed to add to download queue");
				console.error(err);
			}
		},
		[addToDownloadQueue],
	);

	if (songs.length === 0) {
		return null;
	}

	return (
		<div className="space-y-3">
			<h2 className="text-2xl font-semibold">Songs</h2>
			<div className="grid gap-3">
				{songs.map((song) => (
					<SongItem
						key={song.id}
						song={song}
						onPlay={handlePlay}
						onAddToQueue={handleAddToQueue}
						onDownload={handleDownload}
						showDownload={true}
					/>
				))}
			</div>
		</div>
	);
}
