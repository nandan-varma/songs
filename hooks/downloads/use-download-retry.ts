import { useCallback, useRef } from "react";

interface RetryConfig {
	maxRetries?: number;
	retryDelay?: number;
	onRetry?: (attempt: number) => void;
}

/**
 * Manages download retry logic with exponential backoff
 * Single responsibility: Retry mechanism
 */
export function useDownloadRetry({
	maxRetries = 3,
	retryDelay = 1000,
	onRetry,
}: RetryConfig = {}) {
	const retryCount = useRef(0);

	const executeWithRetry = useCallback(
		async <T>(operation: () => Promise<T>): Promise<T> => {
			retryCount.current = 0;

			while (retryCount.current <= maxRetries) {
				try {
					const result = await operation();
					retryCount.current = 0;
					return result;
				} catch (error) {
					retryCount.current++;

					if (retryCount.current > maxRetries) {
						throw error;
					}

					onRetry?.(retryCount.current);

					// Exponential backoff
					await new Promise((resolve) =>
						setTimeout(resolve, retryDelay * retryCount.current),
					);
				}
			}

			throw new Error("Max retries exceeded");
		},
		[maxRetries, retryDelay, onRetry],
	);

	const reset = useCallback(() => {
		retryCount.current = 0;
	}, []);

	return {
		executeWithRetry,
		reset,
		currentRetryCount: retryCount.current,
	};
}
