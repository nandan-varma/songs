"use client";

import { GripVertical, ListMusic, Minus, Play } from "lucide-react";
import Image from "next/image";
import * as React from "react";
import { Button } from "@/components/ui/button";
import type { DetailedSong } from "@/types/entity";

interface PlaylistSongItemProps {
	song: DetailedSong;
	index: number;
	isDragging: boolean;
	onRemove: () => void;
	onPlay: () => void;
	onDragStart: (index: number) => void;
	onDragEnter: (index: number) => void;
	onDragEnd: () => void;
}

/**
 * Draggable song item for playlists
 * Supports reordering via drag-and-drop
 * Includes play button and remove action
 */
export const PlaylistSongItem = React.memo(function PlaylistSongItem({
	song,
	index,
	isDragging,
	onRemove,
	onPlay,
	onDragStart,
	onDragEnter,
	onDragEnd,
}: PlaylistSongItemProps) {
	const artistNames = song.artists.all.map((a) => a.name).join(", ");

	const handleKeyDown = (e: React.KeyboardEvent) => {
		switch (e.key) {
			case "Enter":
			case " ": {
				e.preventDefault();
				onPlay();
				break;
			}
			case "ArrowUp": {
				e.preventDefault();
				onDragEnter(Math.max(0, index - 1));
				break;
			}
			case "ArrowDown": {
				e.preventDefault();
				onDragEnter(index + 1);
				break;
			}
		}
	};

	return (
		// biome-ignore lint/a11y/useSemanticElements: div required for draggable functionality
		<div
			role="button"
			tabIndex={0}
			draggable
			onDragStart={(e) => {
				e.stopPropagation();
				onDragStart(index);
			}}
			onDragEnter={(e) => {
				e.stopPropagation();
				onDragEnter(index);
			}}
			onDragEnd={(e) => {
				e.stopPropagation();
				onDragEnd();
			}}
			onDragOver={(e) => {
				e.preventDefault();
			}}
			onClick={(e) => {
				e.stopPropagation();
			}}
			onKeyDown={handleKeyDown}
			className={`flex items-center gap-3 p-2 rounded-lg border transition-all w-full text-left ${
				isDragging
					? "opacity-40 scale-95"
					: "hover:bg-accent/50 bg-background cursor-move"
			}`}
		>
			<div className="h-8 w-8 flex items-center justify-center text-muted-foreground">
				<GripVertical className="h-4 w-4" />
			</div>
			<Button
				variant="ghost"
				size="icon"
				className="h-8 w-8"
				onClick={(e) => {
					e.stopPropagation();
					onPlay();
				}}
				aria-label="Play song"
			>
				<Play className="h-4 w-4" />
			</Button>
			<div className="relative h-10 w-10 shrink-0 rounded overflow-hidden">
				{song.image && song.image.length > 0 ? (
					<Image
						src={song.image[0]?.url || ""}
						alt={song.name}
						fill
						sizes="40px"
						className="object-cover"
					/>
				) : (
					<div className="h-full w-full bg-muted flex items-center justify-center">
						<ListMusic className="h-5 w-5 text-muted-foreground" />
					</div>
				)}
			</div>
			<div className="flex-1 min-w-0">
				<p className="font-medium text-sm truncate">{song.name}</p>
				<p className="text-xs text-muted-foreground truncate">
					{artistNames || song.album?.name}
				</p>
			</div>
			<Button
				variant="ghost"
				size="icon"
				className="h-8 w-8 text-muted-foreground hover:text-destructive"
				onClick={(e) => {
					e.stopPropagation();
					onRemove();
				}}
				aria-label="Remove song"
			>
				<Minus className="h-4 w-4" />
			</Button>
		</div>
	);
});

PlaylistSongItem.displayName = "PlaylistSongItem";
