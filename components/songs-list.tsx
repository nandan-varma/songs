"use client";

import React, { useCallback, useState } from "react";
import { toast } from "sonner";
import { useDownloadsActions } from "@/contexts/downloads-context";
import { usePlayerActions } from "@/contexts/player-context";
import { useQueueActions } from "@/contexts/queue-context";
import { getSongById } from "@/lib/api";
import type { Song } from "@/types/entity";
import { SongItem } from "./song-item";

interface SongsListProps {
	songs: Song[];
}

export const SongsList = React.memo(function SongsList({
	songs,
}: SongsListProps) {
	const { playSong } = usePlayerActions();
	const { addSong } = useQueueActions();
	const { downloadSong } = useDownloadsActions();

	const [loadingSongId, setLoadingSongId] = useState<string | null>(null);

	const handlePlay = useCallback(
		async (song: Song) => {
			setLoadingSongId(song.id);
			try {
				const detailedSong = await getSongById(song.id);
				playSong(detailedSong.data[0]);
			} catch (err) {
				toast.error("Failed to play song");
				console.error(err);
			} finally {
				setLoadingSongId(null);
			}
		},
		[playSong],
	);

	const handleAddToQueue = useCallback(
		async (song: Song) => {
			setLoadingSongId(song.id);
			try {
				const detailedSong = await getSongById(song.id);
				addSong(detailedSong.data[0]);
			} catch (err) {
				toast.error("Failed to add to queue");
				console.error(err);
			} finally {
				setLoadingSongId(null);
			}
		},
		[addSong],
	);

	const handleDownload = useCallback(
		async (song: Song) => {
			setLoadingSongId(song.id);
			try {
				const detailedSong = await getSongById(song.id);
				await downloadSong(detailedSong.data[0]);
				toast.success(`Downloaded: ${song.title}`);
			} catch (err) {
				toast.error("Failed to download");
				console.error(err);
			} finally {
				setLoadingSongId(null);
			}
		},
		[downloadSong],
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
						isLoading={loadingSongId === song.id}
					/>
				))}
			</div>
		</div>
	);
});
