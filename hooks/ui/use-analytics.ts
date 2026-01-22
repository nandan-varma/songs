import { useCallback, useEffect, useRef } from "react";

type AnalyticsEvent =
	| { type: "song_play"; songId: string; songName: string; artist: string }
	| {
			type: "song_skip";
			songId: string;
			skipType: "next" | "previous" | "seek";
	  }
	| { type: "search"; query: string; resultCount: number }
	| { type: "page_view"; page: string; referrer?: string }
	| { type: "favorites_add"; songId: string }
	| { type: "favorites_remove"; songId: string }
	| { type: "playlist_create"; playlistName: string }
	| { type: "playlist_add"; playlistId: string; songId: string }
	| { type: "download_start"; songId: string }
	| { type: "download_complete"; songId: string }
	| { type: "offline_mode_toggle"; enabled: boolean }
	| { type: "error"; errorType: string; errorMessage: string };

interface AnalyticsContext {
	userId: string;
	sessionId: string;
	isOnline: boolean;
}

interface UseAnalyticsOptions {
	enabled?: boolean;
	onEvent?: (event: AnalyticsEvent) => void;
}

function generateSessionId(): string {
	return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function getStoredUserId(): string {
	if (typeof window === "undefined") return "anonymous";
	const key = "analytics_user_id";
	let userId = localStorage.getItem(key);
	if (!userId) {
		userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
		localStorage.setItem(key, userId);
	}
	return userId;
}

export function useAnalytics(options: UseAnalyticsOptions = {}) {
	const { enabled = true, onEvent } = options;

	const contextRef = useRef<AnalyticsContext>({
		userId: getStoredUserId(),
		sessionId: generateSessionId(),
		isOnline: true,
	});

	const isOnlineRef = useRef(true);

	useEffect(() => {
		if (typeof window === "undefined") return;

		const handleOnline = () => {
			isOnlineRef.current = true;
			contextRef.current.isOnline = true;
		};
		const handleOffline = () => {
			isOnlineRef.current = false;
			contextRef.current.isOnline = false;
		};

		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);

		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
		};
	}, []);

	const trackEvent = useCallback(
		(event: AnalyticsEvent) => {
			if (!enabled) return;

			const eventData = {
				...event,
				context: contextRef.current,
				timestamp: Date.now(),
				userAgent:
					typeof navigator !== "undefined" ? navigator.userAgent : undefined,
			};

			if (onEvent) {
				onEvent(event);
			}

			console.debug("[Analytics]", event.type, eventData);

			if (isOnlineRef.current) {
				try {
					const eventString = JSON.stringify(eventData);
					const queue = JSON.parse(
						localStorage.getItem("analytics_queue") || "[]",
					) as string[];
					queue.push(eventString);

					if (queue.length > 100) {
						queue.shift();
					}

					localStorage.setItem("analytics_queue", JSON.stringify(queue));
				} catch {
					console.warn("[Analytics] Failed to queue event");
				}
			}
		},
		[enabled, onEvent],
	);

	const trackSongPlay = useCallback(
		(songId: string, songName: string, artist: string) => {
			trackEvent({
				type: "song_play",
				songId,
				songName,
				artist,
			});
		},
		[trackEvent],
	);

	const trackSongSkip = useCallback(
		(songId: string, skipType: "next" | "previous" | "seek") => {
			trackEvent({
				type: "song_skip",
				songId,
				skipType,
			});
		},
		[trackEvent],
	);

	const trackSearch = useCallback(
		(query: string, resultCount: number) => {
			trackEvent({
				type: "search",
				query,
				resultCount,
			});
		},
		[trackEvent],
	);

	const trackPageView = useCallback(
		(page: string, referrer?: string) => {
			trackEvent({
				type: "page_view",
				page,
				referrer,
			});
		},
		[trackEvent],
	);

	const trackError = useCallback(
		(errorType: string, errorMessage: string) => {
			trackEvent({
				type: "error",
				errorType,
				errorMessage,
			});
		},
		[trackEvent],
	);

	return {
		trackEvent,
		trackSongPlay,
		trackSongSkip,
		trackSearch,
		trackPageView,
		trackError,
		userId: contextRef.current.userId,
		sessionId: contextRef.current.sessionId,
		isOnline: isOnlineRef.current,
	};
}

export function usePageTracking(
	currentPage: string,
	options: UseAnalyticsOptions = {},
) {
	const { trackPageView } = useAnalytics(options);

	useEffect(() => {
		if (typeof window !== "undefined") {
			trackPageView(currentPage, document.referrer);
		}
	}, [currentPage, trackPageView]);
}
