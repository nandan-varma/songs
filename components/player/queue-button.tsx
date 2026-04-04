"use client";

import { ListMusic } from "lucide-react";
import { motion } from "motion/react";
import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useQueueDragManager } from "@/hooks/ui/use-queue-drag";
import type { DetailedSong } from "@/types/entity";
import { QueueHeader } from "./queue-header";
import { QueueItemDraggable } from "./queue-item-draggable";

interface QueueButtonProps {
	queue: DetailedSong[];
	currentIndex: number;
	onRemoveFromQueue: (index: number) => void;
	onReorderQueue: (fromIndex: number, toIndex: number) => void;
}

/**
 * Queue button with drag-reorderable queue viewer
 * - Touch-friendly button (40-48px)
 * - Shows queue count badge
 * - Opens sheet with draggable items
 * - Supports keyboard navigation and removal of queue items
 */
export const QueueButton = memo(function QueueButton({
	queue,
	currentIndex,
	onRemoveFromQueue,
	onReorderQueue,
}: QueueButtonProps) {
	const queueCount = queue.length;
	const hasQueue = queueCount > 0;

	const {
		displayQueue,
		isDragging,
		handleDragStart,
		handleDragEnter,
		handleDragEnd,
	} = useQueueDragManager({
		queueLength: queueCount,
		currentIndex,
		onReorderQueue,
	});

	return (
		<Sheet>
			<SheetTrigger asChild>
				<motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
					<Button
						variant="ghost"
						size="icon"
						className="relative h-10 w-10 sm:h-11 sm:w-11 md:h-12 md:w-12 hover:bg-primary/10 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary"
						aria-label={`Queue (${queueCount} songs)`}
					>
						<ListMusic className="h-5 w-5 sm:h-5 sm:w-5 md:h-6 md:w-6" />
						{hasQueue && (
							<span
								className="absolute -top-1 -right-1 h-5 w-5 sm:h-5 sm:w-5 md:h-6 md:w-6 rounded-full bg-primary text-xs font-bold text-primary-foreground flex items-center justify-center"
								aria-hidden="true"
							>
								{queueCount > 99 ? "99+" : queueCount}
							</span>
						)}
					</Button>
				</motion.div>
			</SheetTrigger>
			<SheetContent>
				<QueueHeader queueCount={queueCount} />
				<div className="h-[calc(100vh-8rem)] mt-4 overflow-y-auto">
					<div className="space-y-2 pr-4">
						{displayQueue.map((displayIndex) => {
							const song = queue[displayIndex];
							if (!song) return null;

							const isCurrentSong = displayIndex === currentIndex;

							return (
								<QueueItemDraggable
									key={`${song.id}-${displayIndex}`}
									song={song}
									index={displayIndex}
									isCurrentSong={isCurrentSong}
									isDragging={isDragging(displayIndex)}
									onRemove={onRemoveFromQueue}
									onDragStart={handleDragStart}
									onDragEnter={handleDragEnter}
									onDragEnd={handleDragEnd}
								/>
							);
						})}
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);
});

QueueButton.displayName = "QueueButton";
