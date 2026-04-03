/**
 * Generic Async Action Hook
 * Manages loading/error/data states for non-query async operations
 * Replaces ~8 useCallback + useState patterns with a single composable hook
 */

import { useCallback, useState } from "react";

export interface AsyncActionState<T> {
	data: T | null;
	error: Error | null;
	isLoading: boolean;
}

export interface UseAsyncActionOptions<T> {
	/** Called when action succeeds */
	onSuccess?: (data: T) => void;
	/** Called when action fails */
	onError?: (error: Error) => void;
	/** Reset state after operation */
	resetAfter?: number;
}

/**
 * Hook for managing async actions with state
 *
 * @example
 * const { execute, data, isLoading, error } = useAsyncAction(
 *   async (id: string) => await deletePlaylist(id),
 *   { onSuccess: () => toast.success("Deleted!") }
 * );
 *
 * const handleDelete = async (id: string) => {
 *   await execute(id);
 * };
 */
export function useAsyncAction<T, Args extends unknown[]>(
	asyncFn: (...args: Args) => Promise<T>,
	options?: UseAsyncActionOptions<T>,
) {
	const [state, setState] = useState<AsyncActionState<T>>({
		data: null,
		error: null,
		isLoading: false,
	});

	const execute = useCallback(
		async (...args: Args) => {
			setState({ data: null, error: null, isLoading: true });

			try {
				const result = await asyncFn(...args);
				setState({ data: result, error: null, isLoading: false });
				options?.onSuccess?.(result);

				if (options?.resetAfter) {
					setTimeout(() => {
						setState({ data: null, error: null, isLoading: false });
					}, options.resetAfter);
				}

				return result;
			} catch (err) {
				const error = err instanceof Error ? err : new Error(String(err));
				setState({ data: null, error, isLoading: false });
				options?.onError?.(error);
				throw error;
			}
		},
		[asyncFn, options],
	);

	const reset = useCallback(() => {
		setState({ data: null, error: null, isLoading: false });
	}, []);

	return {
		...state,
		execute,
		reset,
	};
}
