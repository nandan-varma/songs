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
		// ARIA: Using a div with role="button" instead of semantic <button> is intentional.
		// Draggable elements require custom event handling (onDragStart, onDragEnter, etc.)
		// that cannot be reliably attached to semantic buttons. This pattern maintains
		// full keyboard accessibility (tabIndex={0}, onKeyDown) while supporting drag-drop.
		<div
			role="button"
			tabIndex={0}
			draggable={!isCurrentSong}
			onDragStart={(e) => {
				e.stopPropagation();
				if (!isCurrentSong) onDragStart(index);
			}}
			onDragEnter={(e) => {
				e.stopPropagation();
				if (!isCurrentSong) onDragEnter(index);
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
			className={`flex items-center gap-3 p-2 rounded border transition-all w-full text-left ${
				isDragging
					? "opacity-40 scale-95"
					: isCurrentSong
						? "bg-accent"
						: "hover:bg-accent/50 bg-background cursor-move"
			}`}
		>
			<div
				className={`h-8 w-8 flex items-center justify-center ${
					isCurrentSong
						? "text-muted-foreground/50 cursor-not-allowed"
						: "text-muted-foreground"
				}`}
			>
				<GripVertical className="h-4 w-4" />
			</div>
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
		</div>
	);
});

QueueItemDraggable.displayName = "QueueItemDraggable";
