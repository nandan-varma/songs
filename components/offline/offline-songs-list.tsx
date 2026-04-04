"use client";

import { Music, Play, Plus, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCachedSongs, useDownloadSong, useOffline } from "@/hooks/cache";
import { useAppStore } from "@/hooks/use-store";
import type { DetailedSong } from "@/types/entity";

interface SongItemProps {
	song: DetailedSong;
	imageUrl: string | undefined;
	isOfflineMode: boolean;
	onPlay: (song: DetailedSong) => void;
	onAddToQueue: (song: DetailedSong) => void;
	onRemove: (songId: string) => void;
}

const SongItem = memo(function SongItem({
	song,
	imageUrl,
	isOfflineMode,
	onPlay,
	onAddToQueue,
	onRemove,
}: SongItemProps) {
	const formatDuration = useMemo(() => {
		const seconds = song.duration;
		if (!seconds) return "0:00";
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = Math.floor(seconds % 60);
		return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
	}, [song.duration]);

	const handlePlay = useCallback(() => onPlay(song), [onPlay, song]);
	const handleAddToQueue = useCallback(
		() => onAddToQueue(song),
		[onAddToQueue, song],
	);
	const handleRemove = useCallback(
		() => onRemove(song.id),
		[onRemove, song.id],
	);

	const src = useMemo(() => {
		return (
			imageUrl ||
			(isOfflineMode ? "/placeholder.png" : song.image[0]?.url) ||
			"/placeholder.png"
		);
	}, [imageUrl, isOfflineMode, song.image]);

	const artistsText = useMemo(() => {
		return song.artists.primary.map((a: { name: string }) => a.name).join(", ");
	}, [song.artists.primary]);

	return (
		<motion.div
			whileHover={{ y: -2 }}
			transition={{ type: "spring", stiffness: 400, damping: 25 }}
		>
			<Card className="hover:bg-accent/50 transition-colors">
				<CardContent className="p-2 md:p-4">
					<div className="flex items-center gap-2 md:gap-4">
						<div className="relative">
							<Image
								src={src}
								alt={song.name}
								width={48}
								height={48}
								className="rounded md:w-14 md:h-14"
							/>
						</div>

						<div className="flex-1 min-w-0">
							<h4 className="font-medium text-sm md:text-base truncate">
								{song.name}
							</h4>
							<p className="text-xs md:text-sm text-muted-foreground truncate">
								{artistsText}
							</p>
							{song.album && (
								<p className="text-xs text-muted-foreground truncate hidden sm:block">
									{song.album.name}
								</p>
							)}
						</div>

						<div className="text-xs md:text-sm text-muted-foreground hidden md:block">
							{formatDuration}
						</div>

						<div className="flex items-center gap-1 md:gap-2">
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
								className="hidden sm:block"
							>
								<Plus className="h-4 w-4" />
							</Button>
							<Button
								size="sm"
								variant="destructive"
								onClick={handleRemove}
								title="Delete"
								className="hidden md:block"
							>
								<Trash2 className="h-4 w-4" />
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>
		</motion.div>
	);
});

export const OfflineSongsList = memo(function OfflineSongsList() {
	const { cachedSongs, isLoading, count } = useCachedSongs();
	const { removeSong } = useDownloadSong();
	const isOfflineMode = useOffline();
	const [imageUrls, setImageUrls] = useState<Map<string, string>>(new Map());
	const createdUrlsRef = useRef<Set<string>>(new Set());

	// Load cached images from IndexedDB
	useEffect(() => {
		const loadImages = async () => {
			const urls = new Map<string, string>();

			// TODO: Load images from cache manager when needed
			// For now, images are served from the API in image URLs

			setImageUrls(urls);
		};

		if (cachedSongs.length > 0) {
			loadImages();
		}

		return () => {
			// Cleanup all created URLs
			for (const url of createdUrlsRef.current) {
				URL.revokeObjectURL(url);
			}
			createdUrlsRef.current.clear();
		};
	}, [cachedSongs.length]);

	const handlePlay = useCallback((song: DetailedSong) => {
		const { playSong, addToPlaybackHistory } = useAppStore.getState();
		playSong(song);
		addToPlaybackHistory(song);
	}, []);

	const handleAddToQueue = useCallback((song: DetailedSong) => {
		const { addSongToQueue } = useAppStore.getState();
		addSongToQueue(song);
	}, []);

	const handleRemove = useCallback(
		(songId: string) => {
			removeSong(songId);
		},
		[removeSong],
	);

	if (isLoading) {
		return (
			<div className="container mx-auto px-4 py-8">
				<Card className="text-center py-12">
					<CardContent>
						<div className="flex justify-center">
							<div className="animate-spin">
								<Music className="h-6 w-6 text-muted-foreground" />
							</div>
						</div>
						<p className="text-muted-foreground mt-4">
							Loading cached songs...
						</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (cachedSongs.length === 0) {
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
			<motion.div
				className="space-y-2"
				initial="hidden"
				animate="show"
				transition={{ staggerChildren: 0.05 }}
			>
				{/* Cached Songs */}
				{cachedSongs.map((song: DetailedSong) => (
					<motion.div
						key={`cached-${song.id}`}
						variants={{
							hidden: { opacity: 0, y: 10 },
							show: { opacity: 1, y: 0 },
						}}
					>
						<SongItem
							song={song}
							imageUrl={imageUrls.get(song.id)}
							isOfflineMode={isOfflineMode}
							onPlay={handlePlay}
							onAddToQueue={handleAddToQueue}
							onRemove={handleRemove}
						/>
					</motion.div>
				))}
			</motion.div>
		</div>
	);
});
