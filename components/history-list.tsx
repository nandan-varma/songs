"use client";

import { Radio } from "lucide-react";
import { useQueueActions } from "@/contexts/queue-context";
import type { HistoryItem } from "@/contexts/history-context";
import { EntityType } from "@/lib/types";
import { ProgressiveImage } from "./progressive-image";
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

function getItemSubtitle(item: HistoryItem): string {
	switch (item.type) {
		case EntityType.SONG:
			return `${item.data.artists.primary[0]?.name || ""} • ${item.data.album.name || ""}`;
		case EntityType.ALBUM:
			return `${item.data.artists.primary[0]?.name || ""} • ${item.data.songCount || 0} songs`;
		case EntityType.ARTIST:
			return "Artist";
		case EntityType.PLAYLIST:
			return `${item.data.songCount || 0} songs`;
		default:
			return "";
	}
}

export function HistoryList({ history }: HistoryListProps) {
	const { addSong, addAlbum, addArtist, addPlaylist } = useQueueActions();

	const handleAddToQueue = (item: HistoryItem) => {
		switch (item.type) {
			case EntityType.SONG:
				addSong(item.data);
				break;
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
	};

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
						className="overflow-hidden hover:bg-accent/50 transition-colors"
					>
						<CardContent className="p-4">
							<div className="flex items-center gap-4">
								<div className="relative h-16 w-16 flex-shrink-0">
									{item.data.image && item.data.image.length > 0 ? (
										<ProgressiveImage
											images={item.data.image}
											alt={getItemTitle(item)}
											entityType={item.type}
											rounded="default"
										/>
									) : (
										<div className="flex h-full w-full items-center justify-center bg-muted rounded">
											<Radio className="h-8 w-8 text-muted-foreground" />
										</div>
									)}
								</div>
								<div className="flex-1 min-w-0">
									<h3 className="font-medium truncate">{getItemTitle(item)}</h3>
									<p className="text-sm text-muted-foreground truncate">
										{getItemSubtitle(item)}
									</p>
									<p className="text-xs text-muted-foreground">
										{formatRelativeTime(item.timestamp)}
									</p>
								</div>
								<div className="flex gap-2 flex-shrink-0">
									<Button
										size="icon"
										variant="ghost"
										onClick={() => handleAddToQueue(item)}
										aria-label="Add to queue"
									>
										<Radio className="h-4 w-4" />
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
