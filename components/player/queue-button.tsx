"use client";

import { GripVertical, ListMusic, Minus } from "lucide-react";
import Link from "next/link";
import { memo, useMemo, useState } from "react";
import { ProgressiveImage } from "@/components/common/progressive-image";
import { type DetailedSong, EntityType } from "@/types/entity";
import { Button } from "../ui/button";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "../ui/sheet";

interface QueueButtonProps {
	queue: DetailedSong[];
	currentIndex: number;
	onRemoveFromQueue: (index: number) => void;
	onReorderQueue: (fromIndex: number, toIndex: number) => void;
}

interface QueueItemProps {
	song: DetailedSong;
	index: number;
	isCurrentSong: boolean;
	onRemove: (index: number) => void;
	onDragStart: (index: number) => void;
	onDragEnter: (index: number) => void;
	onDragEnd: () => void;
	isDragging: boolean;
}

const QueueItem = memo(function QueueItem({
	song,
	index,
	isCurrentSong,
	onRemove,
	onDragStart,
	onDragEnter,
	onDragEnd,
	isDragging,
}: QueueItemProps) {
	return (
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

export const QueueButton = memo(function QueueButton({
	queue,
	currentIndex,
	onRemoveFromQueue,
	onReorderQueue,
}: QueueButtonProps) {
	const queueCount = queue.length;
	const hasQueue = queueCount > 0;

	const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
	const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

	const handleDragStart = (index: number) => {
		if (index === currentIndex) return;
		setDraggedIndex(index);
	};

	const handleDragEnter = (index: number) => {
		if (
			draggedIndex === null ||
			draggedIndex === index ||
			index === currentIndex
		)
			return;
		setDragOverIndex(index);
	};

	const handleDragEnd = () => {
		if (
			draggedIndex === null ||
			dragOverIndex === null ||
			draggedIndex === currentIndex
		) {
			setDraggedIndex(null);
			setDragOverIndex(null);
			return;
		}

		if (draggedIndex !== dragOverIndex) {
			onReorderQueue(draggedIndex, dragOverIndex);
		}

		setDraggedIndex(null);
		setDragOverIndex(null);
	};

	// Compute display order based on drag state
	const displayQueue = useMemo(() => {
		if (draggedIndex === null || dragOverIndex === null) {
			return queue;
		}

		const newQueue = [...queue];
		const [draggedSong] = newQueue.splice(draggedIndex, 1);
		if (!draggedSong) return queue;
		newQueue.splice(dragOverIndex, 0, draggedSong);
		return newQueue;
	}, [queue, draggedIndex, dragOverIndex]);

	return (
		<Sheet>
			<SheetTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className="relative h-10 w-10"
					aria-label={`Queue (${queueCount} songs)`}
				>
					<ListMusic className="h-5 w-5" />
					{hasQueue && (
						<span
							className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-medium text-primary-foreground flex items-center justify-center"
							aria-hidden="true"
						>
							{queueCount}
						</span>
					)}
				</Button>
			</SheetTrigger>
			<SheetContent>
				<SheetHeader>
					<SheetTitle>Queue ({queueCount})</SheetTitle>
				</SheetHeader>
				<div className="h-[calc(100vh-8rem)] mt-4 overflow-y-auto">
					<div className="space-y-2 pr-4">
						{displayQueue.map((song, _visualIndex) => {
							const originalIndex = queue.findIndex((s) => s.id === song.id);
							const isCurrentSong = originalIndex === currentIndex;

							return (
								<QueueItem
									key={`${song.id}-${originalIndex}`}
									song={song}
									index={originalIndex}
									isCurrentSong={isCurrentSong}
									onRemove={onRemoveFromQueue}
									onDragStart={handleDragStart}
									onDragEnter={handleDragEnter}
									onDragEnd={handleDragEnd}
									isDragging={draggedIndex === originalIndex}
								/>
							);
						})}
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);
});
