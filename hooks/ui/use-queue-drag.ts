"use client";

/**
 * Unified drag-and-drop reordering hook
 * Consolidates 3 previous implementations into a single, reusable hook
 * - useQueueDragManager: Queue-specific drag logic
 * - useDragReorder (ui): Generic drag logic
 * - useDragReorder (data): Advanced drag with validation
 *
 * Handles drag state tracking, visual reordering, and reorder callbacks
 * Works with any list (queue, playlists, etc.)
 */

import { useMemo, useState } from "react";

interface UseDragManagerOptions<T> {
	/** List of items to reorder */
	items: T[];
	/** Callback when reordering completes (fromIndex, toIndex) */
	onReorder: (fromIndex: number, toIndex: number) => void;
	/** Optional: Predicate to disable dragging for specific items */
	canDragItem?: (index: number) => boolean;
	/** Optional: Index that cannot be dragged (e.g., current playing index) */
	excludeIndex?: number;
}

interface UseDragManagerReturn<T> {
	draggedIndex: number | null;
	dragOverIndex: number | null;
	/** Items in display order (with drag preview) */
	displayItems: T[];
	/** Check if item is currently being dragged */
	isDragging: (index: number) => boolean;
	handleDragStart: (index: number) => void;
	handleDragEnter: (index: number) => void;
	handleDragEnd: () => void;
}

/**
 * Unified drag-and-drop management
 * Replaces: useQueueDragManager, useDragReorder (both versions)
 * Usage:
 *   const { displayItems, isDragging, handleDragStart, ... } = useDragManager({
 *     items: queue,
 *     onReorder: (from, to) => reorderQueue(from, to),
 *     excludeIndex: currentIndex, // e.g., don't drag current song
 *   });
 */
export function useDragManager<T>({
	items,
	onReorder,
	canDragItem,
	excludeIndex,
}: UseDragManagerOptions<T>): UseDragManagerReturn<T> {
	const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
	const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

	const handleDragStart = (index: number) => {
		// Prevent dragging if item is excluded or canDragItem returns false
		if (excludeIndex !== undefined && index === excludeIndex) return;
		if (canDragItem && !canDragItem(index)) return;
		setDraggedIndex(index);
	};

	const handleDragEnter = (index: number) => {
		// Don't drag over same item, excluded item, or if not currently dragging
		if (
			draggedIndex === null ||
			draggedIndex === index ||
			(excludeIndex !== undefined && index === excludeIndex) ||
			(canDragItem && !canDragItem(index))
		) {
			return;
		}
		setDragOverIndex(index);
	};

	const handleDragEnd = () => {
		if (draggedIndex === null || dragOverIndex === null) {
			setDraggedIndex(null);
			setDragOverIndex(null);
			return;
		}

		if (draggedIndex !== dragOverIndex) {
			onReorder(draggedIndex, dragOverIndex);
		}

		setDraggedIndex(null);
		setDragOverIndex(null);
	};

	// Compute display order based on drag state
	const displayItems = useMemo(() => {
		if (draggedIndex === null || dragOverIndex === null) {
			return items;
		}

		const itemsCopy = [...items];
		const [draggedItem] = itemsCopy.splice(draggedIndex, 1);
		if (draggedItem === undefined) return items;
		itemsCopy.splice(dragOverIndex, 0, draggedItem);
		return itemsCopy;
	}, [items, draggedIndex, dragOverIndex]);

	return {
		draggedIndex,
		dragOverIndex,
		displayItems,
		isDragging: (index: number) => draggedIndex === index,
		handleDragStart,
		handleDragEnter,
		handleDragEnd,
	};
}

// Backward compatibility export for current queue-button usage
export function useQueueDragManager({
	queueLength,
	currentIndex,
	onReorderQueue,
}: {
	queueLength: number;
	currentIndex: number;
	onReorderQueue: (fromIndex: number, toIndex: number) => void;
}) {
	const indices = Array.from({ length: queueLength }, (_, i) => i);
	const { displayItems: displayQueue, ...rest } = useDragManager({
		items: indices,
		onReorder: onReorderQueue,
		excludeIndex: currentIndex,
	});

	return {
		displayQueue: displayQueue as number[],
		...rest,
	};
}
