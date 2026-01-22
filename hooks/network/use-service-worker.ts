import { useCallback, useEffect, useRef, useState } from "react";

export function useServiceWorker() {
	const [registration, setRegistration] =
		useState<ServiceWorkerRegistration | null>(null);
	const [updateAvailable, setUpdateAvailable] = useState(false);
	const [isOnline, setIsOnline] = useState(true);
	const [registrationError, setRegistrationError] = useState<string | null>(
		null,
	);
	const updateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	useEffect(() => {
		// Check if service workers are supported
		if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
			setRegistrationError("Service Worker not supported");
			return;
		}

		// Register service worker
		const registerSW = async () => {
			try {
				const reg = await navigator.serviceWorker.register("/sw.js", {
					scope: "/",
				});

				setRegistration(reg);
				setRegistrationError(null);

				// Check for updates
				reg.addEventListener("updatefound", () => {
					const newWorker = reg.installing;
					if (newWorker) {
						newWorker.addEventListener("statechange", () => {
							if (
								newWorker.state === "installed" &&
								navigator.serviceWorker.controller
							) {
								setUpdateAvailable(true);
							}
						});
					}
				});

				// Check for updates every hour
				updateIntervalRef.current = setInterval(
					() => {
						reg.update();
					},
					60 * 60 * 1000,
				);
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : "Unknown error";
				setRegistrationError(errorMessage);
				console.error("Service Worker registration failed:", error);
			}
		};

		registerSW();

		// Handle online/offline status
		const handleOnline = () => setIsOnline(true);
		const handleOffline = () => setIsOnline(false);

		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);

		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
			if (updateIntervalRef.current) {
				clearInterval(updateIntervalRef.current);
			}
		};
	}, []);

	const updateServiceWorker = useCallback(() => {
		if (registration?.waiting) {
			registration.waiting.postMessage({ type: "SKIP_WAITING" });
			window.location.reload();
		}
	}, [registration?.waiting]);

	const clearCache = useCallback(async () => {
		if (registration?.active) {
			registration.active.postMessage({ type: "CLEAR_CACHE" });
		}
	}, [registration?.active]);

	const retryRegistration = useCallback(async () => {
		setRegistrationError(null);
		if (registration) {
			try {
				await registration.update();
				setRegistrationError(null);
			} catch (error) {
				setRegistrationError(
					error instanceof Error ? error.message : "Retry failed",
				);
			}
		}
	}, [registration]);

	return {
		registration,
		updateAvailable,
		isOnline,
		registrationError,
		updateServiceWorker,
		clearCache,
		retryRegistration,
	};
}
