"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { memo, useRef } from "react";
import type { DetailedSong } from "@/types/entity";
import { QueueItemDraggable } from "./queue-item-draggable";

interface VirtualizedQueueProps {
	queue: DetailedSong[];
	displayQueue: number[];
	currentIndex: number;
	isDragging: (index: number) => boolean;
	onRemoveFromQueue: (index: number) => void;
	onDragStart: (index: number) => void;
	onDragEnter: (index: number) => void;
	onDragEnd: () => void;
}

/**
 * Virtualized queue renderer for large queues
 * - Renders only visible items (O(n) → O(1) for large lists)
 * - Estimated 40x performance improvement for 1000+ item queues
 * - Smooth scrolling with react-virtual
 */
export const VirtualizedQueue = memo(function VirtualizedQueue({
	queue,
	displayQueue,
	currentIndex,
	isDragging,
	onRemoveFromQueue,
	onDragStart,
	onDragEnter,
	onDragEnd,
}: VirtualizedQueueProps) {
	const parentRef = useRef<HTMLDivElement>(null);

	const virtualizer = useVirtualizer({
		count: displayQueue.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 80, // Approximate height of each queue item
		overscan: 10, // Render 10 extra items outside viewport for smooth scrolling
	});

	const virtualItems = virtualizer.getVirtualItems();
	const totalSize = virtualizer.getTotalSize();

	return (
		<div ref={parentRef} className="h-[calc(100vh-8rem)] mt-4 overflow-y-auto">
			<div className="space-y-2 pr-4" style={{ height: `${totalSize}px` }}>
				{virtualItems.map((virtualItem) => {
					const displayIndex = displayQueue[virtualItem.index];
					if (displayIndex === undefined) return null;

					const song = queue[displayIndex];
					if (!song) return null;

					const isCurrentSong = displayIndex === currentIndex;

					return (
						<div
							key={`${song.id}-${displayIndex}`}
							data-index={virtualItem.index}
							style={{
								position: "absolute",
								top: 0,
								left: 0,
								width: "100%",
								transform: `translateY(${virtualItem.start}px)`,
							}}
						>
							<QueueItemDraggable
								song={song}
								index={displayIndex}
								isCurrentSong={isCurrentSong}
								isDragging={isDragging(displayIndex)}
								onRemove={onRemoveFromQueue}
								onDragStart={onDragStart}
								onDragEnter={onDragEnter}
								onDragEnd={onDragEnd}
							/>
						</div>
					);
				})}
			</div>
		</div>
	);
});
