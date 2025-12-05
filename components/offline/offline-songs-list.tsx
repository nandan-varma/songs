"use client";

import { Download, Music, Play, Plus, Trash2, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DownloadStatus, useDownloads } from "@/contexts/downloads-context";
import { usePlayerActions } from "@/contexts/player-context";
import { musicDB } from "@/lib/db";

export function OfflineSongsList() {
	const { cachedSongs, downloads, removeFromQueue } = useDownloads();
	const { playSong, addToQueue } = usePlayerActions();
	const [imageUrls, setImageUrls] = useState<Map<string, string>>(new Map());

	const activeDownloads = downloads.filter(
		(item) =>
			item.status === DownloadStatus.PENDING ||
			item.status === DownloadStatus.DOWNLOADING,
	);
	const cachedSongsArray = Array.from(cachedSongs.values());

	// Load cached images from IndexedDB
	useEffect(() => {
		const loadImages = async () => {
			const urls = new Map<string, string>();

			for (const item of cachedSongsArray) {
				const imageKey = `${item.song.id}-500x500`;
				const blob = await musicDB.getImageBlob(imageKey);

				if (blob) {
					urls.set(item.song.id, URL.createObjectURL(blob));
				} else {
					const mediumKey = `${item.song.id}-150x150`;
					const mediumBlob = await musicDB.getImageBlob(mediumKey);
					if (mediumBlob) {
						urls.set(item.song.id, URL.createObjectURL(mediumBlob));
					}
				}
			}

			setImageUrls(urls);
		};

		if (cachedSongsArray.length > 0) {
			loadImages();
		}

		return () => {
			for (const url of imageUrls.values()) {
				URL.revokeObjectURL(url);
			}
		};
	}, [cachedSongsArray, imageUrls]);

	const formatDuration = (seconds: number | null) => {
		if (!seconds) return "0:00";
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = Math.floor(seconds % 60);
		return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
	};

	if (cachedSongsArray.length === 0 && activeDownloads.length === 0) {
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
			<div className="flex items-center justify-between mb-6">
				<div>
					<h1 className="text-3xl font-bold">Offline Music</h1>
					<p className="text-muted-foreground mt-1">
						{cachedSongsArray.length} cached • {activeDownloads.length}{" "}
						downloading
					</p>
				</div>
			</div>

			<div className="space-y-2">
				{/* Active Downloads */}
				{activeDownloads.map((item) => (
					<Card
						key={`download-${item.id}`}
						className="hover:bg-accent/50 transition-colors"
					>
						<CardContent className="p-4">
							<div className="flex items-center gap-4">
								<div className="relative">
									<Image
										src={item.song.image[0]?.url || "/placeholder.png"}
										alt={item.song.name}
										width={56}
										height={56}
										className="rounded opacity-50"
									/>
									<div className="absolute inset-0 flex items-center justify-center">
										<Download className="h-6 w-6 text-primary animate-pulse" />
									</div>
								</div>

								<div className="flex-1 min-w-0">
									<h4 className="font-medium truncate">{item.song.name}</h4>
									<p className="text-sm text-muted-foreground truncate">
										{item.song.artists.primary.map((a) => a.name).join(", ")}
									</p>
									<div className="mt-2 space-y-1">
										<Progress value={item.progress} className="h-2" />
										<p className="text-xs text-muted-foreground">
											{item.status === DownloadStatus.DOWNLOADING
												? `${item.progress}% downloaded`
												: "Pending..."}
										</p>
									</div>
								</div>

								<Button
									size="sm"
									variant="ghost"
									onClick={() => removeFromQueue(item.song.id)}
									title="Cancel"
								>
									<X className="h-4 w-4" />
								</Button>
							</div>
						</CardContent>
					</Card>
				))}

				{/* Cached Songs */}
				{cachedSongsArray.map((item) => (
					<Card
						key={`cached-${item.id}`}
						className="hover:bg-accent/50 transition-colors"
					>
						<CardContent className="p-4">
							<div className="flex items-center gap-4">
								<div className="relative">
									<Image
										src={
											imageUrls.get(item.song.id) ||
											item.song.image[0]?.url ||
											"/placeholder.png"
										}
										alt={item.song.name}
										width={56}
										height={56}
										className="rounded"
									/>
								</div>

								<div className="flex-1 min-w-0">
									<h4 className="font-medium truncate">{item.song.name}</h4>
									<p className="text-sm text-muted-foreground truncate">
										{item.song.artists.primary.map((a) => a.name).join(", ")}
									</p>
									{item.song.album && (
										<p className="text-xs text-muted-foreground truncate">
											{item.song.album.name}
										</p>
									)}
								</div>

								<div className="text-sm text-muted-foreground">
									{formatDuration(item.song.duration)}
								</div>

								<div className="flex items-center gap-2">
									<Button
										size="sm"
										variant="outline"
										onClick={() => playSong(item.song)}
										title="Play"
									>
										<Play className="h-4 w-4" />
									</Button>
									<Button
										size="sm"
										variant="outline"
										onClick={() => addToQueue(item.song)}
										title="Add to Queue"
									>
										<Plus className="h-4 w-4" />
									</Button>
									<Button
										size="sm"
										variant="destructive"
										onClick={() => removeFromQueue(item.song.id)}
										title="Delete"
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
