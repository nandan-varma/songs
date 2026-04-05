"use client";

import { GripVertical, Minus } from "lucide-react";
import Link from "next/link";
import { memo } from "react";
import { ProgressiveImage } from "@/components/common/progressive-image";
import { Button } from "@/components/ui/button";
import type { DetailedSong } from "@/types/entity";
import { EntityType } from "@/types/entity";

interface QueueItemDraggableProps {
	song: DetailedSong;
	index: number;
	isCurrentSong: boolean;
	isDragging: boolean;
	onRemove: (index: number) => void;
	onDragStart: (index: number) => void;
	onDragEnter: (index: number) => void;
	onDragEnd: () => void;
}

/**
 * Draggable queue item component
 * Supports drag reordering with keyboard navigation
 * Current song cannot be dragged
 */
export const QueueItemDraggable = memo(function QueueItemDraggable({
	song,
	index,
	isCurrentSong,
	isDragging,
	onRemove,
	onDragStart,
	onDragEnter,
	onDragEnd,
}: QueueItemDraggableProps) {
	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (isCurrentSong) return;

		switch (e.key) {
			case "Enter":
			case " ": {
				e.preventDefault();
				// Could play the song or show options
				break;
			}
			case "ArrowUp": {
				e.preventDefault();
				onDragEnter(Math.max(0, index - 1));
				break;
			}
			case "ArrowDown": {
				e.preventDefault();
				onDragEnter(Math.min(0, index + 1)); // Will be handled by parent
				break;
			}
		}
	};

	return (
		<article
			onDragEnter={(e) => {
				e.stopPropagation();
				if (!isCurrentSong) onDragEnter(index);
			}}
			onDragOver={(e) => {
				e.preventDefault();
			}}
			onClick={(e) => {
				e.stopPropagation();
			}}
			onKeyDown={handleKeyDown}
			className={`flex items-center gap-3 p-2 rounded border transition-all w-full text-left ${
				isDragging
					? "opacity-40 scale-95"
					: isCurrentSong
						? "bg-accent"
						: "hover:bg-accent/50 bg-background cursor-move"
			}`}
		>
			<button
				type="button"
				draggable={!isCurrentSong}
				onDragStart={(e) => {
					e.stopPropagation();
					if (!isCurrentSong) {
						onDragStart(index);
					}
				}}
				onDragEnd={(e) => {
					e.stopPropagation();
					onDragEnd();
				}}
				onKeyDown={handleKeyDown}
				aria-label={`Reorder ${song.name}`}
				className={`h-8 w-8 border-0 bg-transparent p-0 flex items-center justify-center ${
					isCurrentSong
						? "text-muted-foreground/50 cursor-not-allowed"
						: "text-muted-foreground cursor-grab active:cursor-grabbing"
				}`}
				disabled={isCurrentSong}
			>
				<GripVertical className="h-4 w-4" />
			</button>
			<div className="relative h-10 w-10 shrink-0">
				{song.image && song.image.length > 0 && (
					<ProgressiveImage
						images={song.image}
						alt={song.name}
						entityType={EntityType.SONG}
						rounded="default"
						sizes="40px"
					/>
				)}
			</div>

			<div className="flex-1 min-w-0">
				<Link
					href={`/song?id=${song.id}`}
					className="text-sm font-medium truncate hover:underline block"
				>
					{song.name}
				</Link>
				<div className="text-xs text-muted-foreground truncate">
					{song.artists?.primary?.map((artist, idx) => (
						<span key={artist.id}>
							<Link
								href={`/artist?id=${artist.id}`}
								className="hover:underline"
							>
								{artist.name}
							</Link>
							{idx < song.artists.primary.length - 1 && ", "}
						</span>
					))}
				</div>
			</div>

			{!isCurrentSong && (
				<Button
					variant="outline"
					size="icon"
					onClick={(e) => {
						e.stopPropagation();
						onRemove(index);
					}}
					aria-label={`Remove ${song.name} from queue`}
				>
					<Minus className="h-4 w-4" />
				</Button>
			)}
		</article>
	);
});

QueueItemDraggable.displayName = "QueueItemDraggable";
