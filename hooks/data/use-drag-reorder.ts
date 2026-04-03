/**
 * Drag-Drop Reorder State Management Hook
 * Manages dragging, reordering, and validation for drag-drop operations
 * Used by: queue-button, playlist-edit-dialog
 * Replaces: ~6 useState patterns in queue/playlist components
 */

import { useCallback, useState } from "react";

export interface DragItem<T> {
	id: string;
	data: T;
	index: number;
}

export interface DragState<T> {
	/** Currently dragged item, null if not dragging */
	draggedItem: DragItem<T> | null;
	/** Items being reordered */
	items: T[];
	/** Whether drag operation is in progress */
	isDragging: boolean;
	/** Whether reorder is valid (for validation callbacks) */
	isValid: boolean;
}

export interface UseDragReorderOptions<T> {
	/** Initial items list */
	items: T[];
	/** Extract unique ID from item */
	getItemId: (item: T) => string;
	/** Validate if drop is allowed */
	canDrop?: (source: T, target: T, targetIndex: number) => boolean;
	/** Called after successful reorder */
	onReorder?: (items: T[]) => void;
}

/**
 * Hook for managing drag-drop reordering
 *
 * @example
 * const { items, draggedItem, startDrag, endDrag, handleDrop } = useDragReorder({
 *   items: songs,
 *   getItemId: (song) => song.id,
 *   onReorder: (newOrder) => updateQueueOrder(newOrder),
 * });
 */
export function useDragReorder<T>(options: UseDragReorderOptions<T>) {
	const [state, setState] = useState<DragState<T>>({
		draggedItem: null,
		items: options.items,
		isDragging: false,
		isValid: true,
	});

	const startDrag = useCallback(
		(item: T, index: number) => {
			setState((prev) => ({
				...prev,
				draggedItem: { id: options.getItemId(item), data: item, index },
				isDragging: true,
				isValid: true,
			}));
		},
		[options],
	);

	const endDrag = useCallback(() => {
		setState((prev) => ({
			...prev,
			draggedItem: null,
			isDragging: false,
		}));
	}, []);

	const handleDrop = useCallback(
		(targetItem: T, targetIndex: number) => {
			if (!state.draggedItem) return;

			// Validate drop
			if (
				options.canDrop &&
				!options.canDrop(state.draggedItem.data, targetItem, targetIndex)
			) {
				setState((prev) => ({ ...prev, isValid: false }));
				endDrag();
				return;
			}

			// Perform reorder
			const newItems = [...state.items];
			const sourceIndex = state.draggedItem.index;

			// Remove from source
			newItems.splice(sourceIndex, 1);

			// Insert at target (adjust index if dropping after source)
			const insertIndex =
				targetIndex > sourceIndex ? targetIndex - 1 : targetIndex;
			newItems.splice(insertIndex, 0, state.draggedItem.data);

			setState((prev) => ({
				...prev,
				items: newItems,
				draggedItem: null,
				isDragging: false,
				isValid: true,
			}));

			options.onReorder?.(newItems);
		},
		[state, options, endDrag],
	);

	const reset = useCallback(() => {
		setState({
			draggedItem: null,
			items: options.items,
			isDragging: false,
			isValid: true,
		});
	}, [options.items]);

	return {
		...state,
		startDrag,
		endDrag,
		handleDrop,
		reset,
	};
}
