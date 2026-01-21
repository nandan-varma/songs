"use client";

import { Check, Download, Loader2, Music, Play, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useDownloadsActions } from "@/contexts/downloads-context";
import type { HistoryItem } from "@/contexts/history-context";
import { usePlayerActions } from "@/contexts/player-context";
import { useQueueActions } from "@/contexts/queue-context";
import { getSongById } from "@/lib/api";
import { EntityType } from "@/types/entity";
import { ProgressiveImage } from "./common/progressive-image";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";

interface HistoryListProps {
	history: HistoryItem[];
}

function formatRelativeTime(date: Date): string {
	const now = new Date();
	const diffInMs = now.getTime() - date.getTime();
	const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
	const diffInHours = Math.floor(diffInMinutes / 60);
	const diffInDays = Math.floor(diffInHours / 24);

	if (diffInMinutes < 1) return "Just now";
	if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
	if (diffInHours < 24) return `${diffInHours}h ago`;
	if (diffInDays < 7) return `${diffInDays}d ago`;
	return date.toLocaleDateString();
}

function getItemTitle(item: HistoryItem): string {
	switch (item.type) {
		case EntityType.SONG:
			return item.data.name;
		case EntityType.ALBUM:
			return item.data.name;
		case EntityType.ARTIST:
			return item.data.name;
		case EntityType.PLAYLIST:
			return item.data.name;
		default:
			return "Unknown";
	}
}

interface SubtitleProps {
	item: HistoryItem;
	router: ReturnType<typeof useRouter>;
}

function Subtitle({ item, router }: SubtitleProps) {
	switch (item.type) {
		case EntityType.SONG: {
			const artistElements = item.data.artists.primary.map((artist, index) => (
				<span key={artist.id}>
					<button
						type="button"
						className="hover:underline cursor-pointer bg-transparent border-none p-0 text-inherit font-inherit"
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							router.push(`/artist?id=${artist.id}`);
						}}
					>
						{artist.name}
					</button>
					{index < item.data.artists.primary.length - 1 && ", "}
				</span>
			));
			return (
				<span>
					{artistElements} • {item.data.album.name || ""}
				</span>
			);
		}
		case EntityType.ALBUM: {
			const artistElements = item.data.artists.primary.map((artist, index) => (
				<span key={artist.id}>
					<button
						type="button"
						className="hover:underline cursor-pointer bg-transparent border-none p-0 text-inherit font-inherit"
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							router.push(`/artist?id=${artist.id}`);
						}}
					>
						{artist.name}
					</button>
					{index < item.data.artists.primary.length - 1 && ", "}
				</span>
			));
			return (
				<span>
					{artistElements} • {item.data.songCount || 0} songs
				</span>
			);
		}
		case EntityType.ARTIST:
			return <span>Artist</span>;
		case EntityType.PLAYLIST:
			return <span>{item.data.songCount || 0} songs</span>;
		default:
			return <span></span>;
	}
}

export function HistoryList({ history }: HistoryListProps) {
	const router = useRouter();
	const { addSong, addAlbum, addArtist, addPlaylist } = useQueueActions();
	const { playSong } = usePlayerActions();
	const { downloadSong, isSongCached } = useDownloadsActions();

	const [loadingSongId, setLoadingSongId] = useState<string | null>(null);

	const handlePlay = async (item: HistoryItem) => {
		if (item.type !== EntityType.SONG) return;
		setLoadingSongId(item.id);
		try {
			const detailedSong = await getSongById(item.id);
			playSong(detailedSong.data[0]);
		} catch {
			toast.error("Failed to play song");
		} finally {
			setLoadingSongId(null);
		}
	};

	const handleAddToQueue = async (item: HistoryItem) => {
		if (item.type === EntityType.SONG) {
			setLoadingSongId(item.id);
			try {
				const detailedSong = await getSongById(item.id);
				addSong(detailedSong.data[0]);
				toast.success("Added to queue");
			} catch {
				toast.error("Failed to add to queue");
			} finally {
				setLoadingSongId(null);
			}
			return;
		}

		switch (item.type) {
			case EntityType.ALBUM:
				addAlbum(item.data);
				break;
			case EntityType.PLAYLIST:
				addPlaylist(item.data);
				break;
			case EntityType.ARTIST:
				addArtist(item.data);
				break;
		}
		toast.success("Added to queue");
	};

	const handleDownload = async (item: HistoryItem) => {
		if (item.type !== EntityType.SONG) return;
		setLoadingSongId(item.id);
		try {
			const detailedSong = await getSongById(item.id);
			await downloadSong(detailedSong.data[0]);
			toast.success(`Downloaded: ${item.data.name}`);
		} catch {
			toast.error("Failed to download");
		} finally {
			setLoadingSongId(null);
		}
	};

	const isLoading = (id: string) => loadingSongId === id;

	if (history.length === 0) {
		return (
			<div className="text-center py-12">
				<p className="text-muted-foreground">No recent activity</p>
			</div>
		);
	}

	return (
		<div className="space-y-3">
			<h2 className="text-2xl font-semibold">Recent Activity</h2>
			<div className="grid gap-3">
				{history.map((item) => (
					<Card
						key={item.id}
						className="overflow-hidden hover:bg-accent/50 transition-colors cursor-pointer"
					>
						<CardContent className="p-4">
							<div className="flex items-center gap-4">
								<div className="relative h-16 w-16 shrink-0">
									{item.data.image && item.data.image.length > 0 ? (
										<ProgressiveImage
											images={item.data.image}
											alt={getItemTitle(item)}
											entityType={item.type}
											rounded="default"
										/>
									) : (
										<div className="flex h-full w-full items-center justify-center bg-muted rounded">
											<Music className="h-8 w-8 text-muted-foreground" />
										</div>
									)}
								</div>
								<div className="flex-1 min-w-0">
									<Link
										href={
											item.type === EntityType.SONG
												? `/song?id=${item.id}`
												: item.type === EntityType.ALBUM
													? `/album?id=${item.id}`
													: item.type === EntityType.ARTIST
														? `/artist?id=${item.id}`
														: `/playlist?id=${item.id}`
										}
									>
										<h3 className="font-medium truncate hover:underline">
											{getItemTitle(item)}
										</h3>
									</Link>
									<p className="text-sm text-muted-foreground truncate">
										<Subtitle item={item} router={router} />
									</p>
									<p className="text-xs text-muted-foreground">
										{formatRelativeTime(item.timestamp)}
									</p>
								</div>
								<div className="flex gap-2 shrink-0">
									{item.type === EntityType.SONG ? (
										<>
											<Button
												size="icon"
												variant="ghost"
												onClick={(e) => {
													e.preventDefault();
													e.stopPropagation();
													handlePlay(item);
												}}
												disabled={isLoading(item.id)}
												aria-label="Play song"
											>
												{isLoading(item.id) ? (
													<Loader2 className="h-4 w-4 animate-spin" />
												) : (
													<Play className="h-4 w-4" />
												)}
											</Button>
											<Button
												size="icon"
												variant="ghost"
												onClick={(e) => {
													e.preventDefault();
													e.stopPropagation();
													handleAddToQueue(item);
												}}
												disabled={isLoading(item.id)}
												aria-label="Add to queue"
											>
												{isLoading(item.id) ? (
													<Loader2 className="h-4 w-4 animate-spin" />
												) : (
													<Plus className="h-4 w-4" />
												)}
											</Button>
											<Button
												size="icon"
												variant="ghost"
												onClick={(e) => {
													e.preventDefault();
													e.stopPropagation();
													handleDownload(item);
												}}
												disabled={isSongCached(item.id) || isLoading(item.id)}
												aria-label={
													isSongCached(item.id)
														? "Already downloaded"
														: "Download song"
												}
												className={
													isSongCached(item.id) ? "text-green-600" : ""
												}
											>
												{isSongCached(item.id) ? (
													<Check className="h-4 w-4" />
												) : (
													<Download className="h-4 w-4" />
												)}
											</Button>
										</>
									) : (
										<Button
											size="icon"
											variant="ghost"
											onClick={(e) => {
												e.preventDefault();
												e.stopPropagation();
												handleAddToQueue(item);
											}}
											aria-label="Add to queue"
										>
											<Plus className="h-4 w-4" />
										</Button>
									)}
								</div>
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
