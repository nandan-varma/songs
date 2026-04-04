/**
 * Generic drag-and-drop reordering hook
 * Handles drag state tracking and visual reordering without mutation
 * Can be used for any draggable list (queue, playlists, etc.)
 */

import { useMemo, useState } from "react";

interface UseDragReorderOptions<T> {
	items: T[];
	onReorder: (fromIndex: number, toIndex: number) => void;
	canDragItem?: (index: number) => boolean;
}

interface UseDragReorderReturn<T> {
	draggedIndex: number | null;
	dragOverIndex: number | null;
	displayItems: T[]; // Items in display order
	isDragging: (index: number) => boolean;
	handleDragStart: (index: number) => void;
	handleDragEnter: (index: number) => void;
	handleDragEnd: () => void;
}

/**
 * Manages drag state and visual reordering
 * @param items - List of items to reorder
 * @param onReorder - Callback when reordering completes
 * @param canDragItem - Optional predicate to disable dragging for specific items
 */
export function useDragReorder<T>({
	items,
	onReorder,
	canDragItem,
}: UseDragReorderOptions<T>): UseDragReorderReturn<T> {
	const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
	const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

	const handleDragStart = (index: number) => {
		if (canDragItem && !canDragItem(index)) return;
		setDraggedIndex(index);
	};

	const handleDragEnter = (index: number) => {
		if (
			draggedIndex === null ||
			draggedIndex === index ||
			(canDragItem && !canDragItem(index))
		)
			return;
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

		const newItems = [...items];
		const [draggedItem] = newItems.splice(draggedIndex, 1);
		if (!draggedItem) return items;
		newItems.splice(dragOverIndex, 0, draggedItem);
		return newItems;
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
