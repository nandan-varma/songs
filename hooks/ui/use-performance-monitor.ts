import { useCallback, useEffect, useRef } from "react";

interface PerformanceMetrics {
	renderCount: number;
	lastRenderDuration: number;
	averageRenderDuration: number;
	componentName: string;
}

interface UsePerformanceMonitorOptions {
	/** Component name for debugging */
	componentName: string;
	/** Log renders to console in development */
	logRenders?: boolean;
	/** Threshold in ms for slow render warnings */
	slowRenderThreshold?: number;
}

/**
 * Tracks render performance for a React component
 * @param options - Configuration options for the performance monitor
 * @returns Object containing metrics and reset function
 */
export function usePerformanceMonitor(options: UsePerformanceMonitorOptions) {
	const {
		componentName,
		logRenders = process.env.NODE_ENV === "development",
		slowRenderThreshold = 16,
	} = options;

	const renderCountRef = useRef(0);
	const durationRef = useRef<number[]>([]);
	const lastRenderTimeRef = useRef(performance.now());

	useEffect(() => {
		const now = performance.now();
		const duration = now - lastRenderTimeRef.current;
		lastRenderTimeRef.current = now;

		renderCountRef.current += 1;
		durationRef.current.push(duration);

		if (durationRef.current.length > 100) {
			durationRef.current.shift();
		}

		if (logRenders || duration > slowRenderThreshold) {
			console.debug(
				`[${componentName}] Render #${renderCountRef.current} took ${duration.toFixed(2)}ms`,
			);
		}
	});

	const getMetrics = useCallback((): PerformanceMetrics => {
		const durations = durationRef.current;
		const averageRenderDuration =
			durations.length > 0
				? durations.reduce((a, b) => a + b, 0) / durations.length
				: 0;

		return {
			renderCount: renderCountRef.current,
			lastRenderDuration: durations[durations.length - 1] || 0,
			averageRenderDuration,
			componentName,
		};
	}, [componentName]);

	const resetMetrics = useCallback(() => {
		renderCountRef.current = 0;
		durationRef.current = [];
		lastRenderTimeRef.current = performance.now();
	}, []);

	const isSlow = useCallback((): boolean => {
		const lastDuration =
			durationRef.current[durationRef.current.length - 1] || 0;
		return lastDuration > slowRenderThreshold;
	}, [slowRenderThreshold]);

	return {
		getMetrics,
		resetMetrics,
		isSlow,
		renderCount: renderCountRef.current,
	};
}

/**
 * Tracks mount/unmount timing for a component
 * @param componentName - Name for debugging
 * @returns Mount timing data
 */
export function useMountTiming(componentName: string) {
	const mountTimeRef = useRef<number | null>(null);
	const unmountTimeRef = useRef<number | null>(null);

	useEffect(() => {
		mountTimeRef.current = performance.now();
		return () => {
			unmountTimeRef.current = performance.now();
			console.debug(
				`[${componentName}] Mounted for ${(
					(unmountTimeRef.current || 0) - (mountTimeRef.current || 0)
				).toFixed(2)}ms`,
			);
		};
	}, [componentName]);

	return {
		mountTime: mountTimeRef.current,
		unmountTime: unmountTimeRef.current,
	};
}
