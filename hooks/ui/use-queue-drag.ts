/**
 * Hook for managing drag-and-drop queue reordering
 * Handles drag state, drop target tracking, and queue reordering logic
 * Returns utilities for drag lifecycle management
 */

import { useMemo, useState } from "react";

interface UseQueueDragManagerOptions {
	queueLength: number;
	currentIndex: number;
	onReorderQueue: (fromIndex: number, toIndex: number) => void;
}

interface UseQueueDragManagerReturn {
	draggedIndex: number | null;
	dragOverIndex: number | null;
	displayQueue: number[]; // Indices in display order
	isDragging: (index: number) => boolean;
	handleDragStart: (index: number) => void;
	handleDragEnter: (index: number) => void;
	handleDragEnd: () => void;
}

/**
 * Manages queue drag state and reordering logic
 * Computes display order based on drag state without mutating original queue
 */
export function useQueueDragManager({
	queueLength,
	currentIndex,
	onReorderQueue,
}: UseQueueDragManagerOptions): UseQueueDragManagerReturn {
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
			// Return indices in original order
			return Array.from({ length: queueLength }, (_, i) => i);
		}

		// Create display order with dragged item moved
		const indices = Array.from({ length: queueLength }, (_, i) => i);
		const [dragged] = indices.splice(draggedIndex, 1);
		if (dragged === undefined) return indices;
		indices.splice(dragOverIndex, 0, dragged);
		return indices;
	}, [queueLength, draggedIndex, dragOverIndex]);

	return {
		draggedIndex,
		dragOverIndex,
		displayQueue,
		isDragging: (index: number) => draggedIndex === index,
		handleDragStart,
		handleDragEnter,
		handleDragEnd,
	};
}
