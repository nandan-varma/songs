"use client";

import { Music, Play, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { CachedSong } from "@/contexts/downloads-context";
import { useDownloads } from "@/contexts/downloads-context";
import { useOffline } from "@/contexts/offline-context";
import { usePlayerActions } from "@/contexts/player-context";
import { useQueueActions } from "@/contexts/queue-context";
import { musicDB } from "@/lib/db";

interface SongItemProps {
	item: CachedSong;
	imageUrl: string | undefined;
	isOfflineMode: boolean;
	onPlay: (song: CachedSong["song"]) => void;
	onAddToQueue: (song: CachedSong["song"]) => void;
	onRemove: (songId: string) => void;
}

const SongItem = memo(function SongItem({
	item,
	imageUrl,
	isOfflineMode,
	onPlay,
	onAddToQueue,
	onRemove,
}: SongItemProps) {
	const formatDuration = useMemo(() => {
		const seconds = item.song.duration;
		if (!seconds) return "0:00";
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = Math.floor(seconds % 60);
		return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
	}, [item.song.duration]);

	const handlePlay = useCallback(() => onPlay(item.song), [onPlay, item.song]);
	const handleAddToQueue = useCallback(
		() => onAddToQueue(item.song),
		[onAddToQueue, item.song],
	);
	const handleRemove = useCallback(
		() => onRemove(item.song.id),
		[onRemove, item.song.id],
	);

	const src = useMemo(() => {
		return (
			imageUrl ||
			(isOfflineMode ? "/placeholder.png" : item.song.image[0]?.url) ||
			"/placeholder.png"
		);
	}, [imageUrl, isOfflineMode, item.song.image]);

	const artistsText = useMemo(() => {
		return item.song.artists.primary
			.map((a: { name: string }) => a.name)
			.join(", ");
	}, [item.song.artists.primary]);

	return (
		<Card className="hover:bg-accent/50 transition-colors">
			<CardContent className="p-4">
				<div className="flex items-center gap-4">
					<div className="relative">
						<Image
							src={src}
							alt={item.song.name}
							width={56}
							height={56}
							className="rounded"
						/>
					</div>

					<div className="flex-1 min-w-0">
						<h4 className="font-medium truncate">{item.song.name}</h4>
						<p className="text-sm text-muted-foreground truncate">
							{artistsText}
						</p>
						{item.song.album && (
							<p className="text-xs text-muted-foreground truncate">
								{item.song.album.name}
							</p>
						)}
					</div>

					<div className="text-sm text-muted-foreground">{formatDuration}</div>

					<div className="flex items-center gap-2">
						<Button
							size="sm"
							variant="outline"
							onClick={handlePlay}
							title="Play"
						>
							<Play className="h-4 w-4" />
						</Button>
						<Button
							size="sm"
							variant="outline"
							onClick={handleAddToQueue}
							title="Add to Queue"
						>
							<Plus className="h-4 w-4" />
						</Button>
						<Button
							size="sm"
							variant="destructive"
							onClick={handleRemove}
							title="Delete"
						>
							<Trash2 className="h-4 w-4" />
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	);
});

export const OfflineSongsList = memo(function OfflineSongsList() {
	const { cachedSongs, removeSong } = useDownloads();
	const { isOfflineMode } = useOffline();
	const { playSong } = usePlayerActions();
	const { addSong } = useQueueActions();
	const [imageUrls, setImageUrls] = useState<Map<string, string>>(new Map());
	const createdUrlsRef = useRef<Set<string>>(new Set());

	const cachedSongsArray = useMemo(
		() => Array.from(cachedSongs.values()),
		[cachedSongs],
	);

	// Load cached images from IndexedDB
	useEffect(() => {
		const loadImages = async () => {
			const urls = new Map<string, string>();

			for (const item of cachedSongsArray) {
				const imageKey = `${item.song.id}-500x500`;
				const blob = await musicDB.getImageBlob(imageKey);

				if (blob) {
					const url = URL.createObjectURL(blob);
					urls.set(item.song.id, url);
					createdUrlsRef.current.add(url);
				} else {
					const mediumKey = `${item.song.id}-150x150`;
					const mediumBlob = await musicDB.getImageBlob(mediumKey);
					if (mediumBlob) {
						const url = URL.createObjectURL(mediumBlob);
						urls.set(item.song.id, url);
						createdUrlsRef.current.add(url);
					}
				}
			}

			setImageUrls(urls);
		};

		if (cachedSongsArray.length > 0) {
			loadImages();
		}

		return () => {
			// Cleanup all created URLs
			for (const url of createdUrlsRef.current) {
				URL.revokeObjectURL(url);
			}
			createdUrlsRef.current.clear();
		};
	}, [cachedSongsArray]);

	const handlePlay = useCallback(
		(song: CachedSong["song"]) => playSong(song),
		[playSong],
	);
	const handleAddToQueue = useCallback(
		(song: CachedSong["song"]) => addSong(song),
		[addSong],
	);
	const handleRemove = useCallback(
		(songId: string) => removeSong(songId),
		[removeSong],
	);

	if (cachedSongsArray.length === 0) {
		return (
			<div className="container mx-auto px-4 py-8">
				<Card className="text-center py-12">
					<CardContent>
						<Music className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
						<h3 className="text-lg font-semibold mb-2">
							No offline songs available
						</h3>
						<p className="text-muted-foreground">
							Download songs from the search page to play them offline
						</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="space-y-2">
				{/* Cached Songs */}
				{cachedSongsArray.map((item) => (
					<SongItem
						key={`cached-${item.song.id}`}
						item={item}
						imageUrl={imageUrls.get(item.song.id)}
						isOfflineMode={isOfflineMode}
						onPlay={handlePlay}
						onAddToQueue={handleAddToQueue}
						onRemove={handleRemove}
					/>
				))}
			</div>
		</div>
	);
});
