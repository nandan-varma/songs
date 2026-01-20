"use client";

import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	DragOverlay,
	type DragStartEvent,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, ListMusic, Minus } from "lucide-react";
import Link from "next/link";
import { memo, useState } from "react";
import { ProgressiveImage } from "@/components/common/progressive-image";
import { type DetailedSong, EntityType } from "@/types/entity";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
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

interface SortableItemProps {
	song: DetailedSong;
	index: number;
	isCurrentSong: boolean;
	onRemove: (index: number) => void;
}

function SortableItem({
	song,
	index,
	isCurrentSong,
	onRemove,
}: SortableItemProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: `${song.id}-${index}`, disabled: isCurrentSong });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={`flex items-center gap-3 p-2 rounded transition-colors ${
				isDragging
					? "opacity-50"
					: isCurrentSong
						? "bg-accent"
						: "hover:bg-accent/50"
			}`}
		>
			<Button
				variant="ghost"
				size="icon"
				className={`h-8 w-8 ${!isCurrentSong ? "cursor-grab active:cursor-grabbing" : "cursor-not-allowed opacity-50"}`}
				disabled={isCurrentSong}
				{...(isCurrentSong ? {} : attributes)}
				{...(isCurrentSong ? {} : listeners)}
				aria-label={
					isCurrentSong ? "Currently playing" : `Drag ${song.name} to reorder`
				}
			>
				<GripVertical className="h-4 w-4" />
			</Button>
			<div className="relative h-10 w-10 flex-shrink-0">
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
					onClick={() => onRemove(index)}
					aria-label={`Remove ${song.name} from queue`}
				>
					<Minus className="h-4 w-4" />
				</Button>
			)}
		</div>
	);
}

export const QueueButton = memo(function QueueButton({
	queue,
	currentIndex,
	onRemoveFromQueue,
	onReorderQueue,
}: QueueButtonProps) {
	const queueCount = queue.length;
	const hasQueue = queueCount > 0;

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	const [activeId, setActiveId] = useState<string | null>(null);

	function handleDragStart(event: DragStartEvent) {
		setActiveId(event.active.id as string);
	}

	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event;

		if (over && active.id !== over.id) {
			const oldIndex = queue.findIndex(
				(song, index) => `${song.id}-${index}` === active.id,
			);
			const newIndex = queue.findIndex(
				(song, index) => `${song.id}-${index}` === over.id,
			);

			if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== currentIndex) {
				onReorderQueue(oldIndex, newIndex);
			}
		}

		setActiveId(null);
	}

	const activeSong = activeId
		? queue.find((song, index) => `${song.id}-${index}` === activeId)
		: null;

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
				<DndContext
					sensors={sensors}
					collisionDetection={closestCenter}
					onDragStart={handleDragStart}
					onDragEnd={handleDragEnd}
				>
					<SortableContext
						items={queue.map((song, index) => `${song.id}-${index}`)}
					>
						<ScrollArea className="h-[calc(100vh-8rem)] mt-4">
							<div className="space-y-2">
								{queue.map((song, index) => {
									const isCurrentSong = index === currentIndex;

									return (
										<SortableItem
											key={`${song.id}-${index}`}
											song={song}
											index={index}
											isCurrentSong={isCurrentSong}
											onRemove={onRemoveFromQueue}
										/>
									);
								})}
							</div>
						</ScrollArea>
					</SortableContext>
					<DragOverlay>
						{activeSong ? (
							<div className="flex items-center gap-3 p-2 rounded bg-background border shadow-lg">
								<div className="relative h-10 w-10 flex-shrink-0">
									{activeSong.image && activeSong.image.length > 0 && (
										<ProgressiveImage
											images={activeSong.image}
											alt={activeSong.name}
											entityType={EntityType.SONG}
											rounded="default"
										/>
									)}
								</div>
								<div className="flex-1 min-w-0">
									<div className="text-sm font-medium truncate">
										{activeSong.name}
									</div>
									<div className="text-xs text-muted-foreground truncate">
										{activeSong.artists?.primary?.map((artist, idx) => (
											<span key={artist.id}>
												{artist.name}
												{idx < activeSong.artists?.primary.length - 1 && ", "}
											</span>
										))}
									</div>
								</div>
							</div>
						) : null}
					</DragOverlay>
				</DndContext>
			</SheetContent>
		</Sheet>
	);
});
