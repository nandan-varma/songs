import { useEffect, useState } from "react";

export function useServiceWorker() {
	const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
	const [updateAvailable, setUpdateAvailable] = useState(false);
	const [isOnline, setIsOnline] = useState(true);

	useEffect(() => {
		// Check if service workers are supported
		if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
			return;
		}

		// Register service worker
		const registerSW = async () => {
			try {
				const reg = await navigator.serviceWorker.register("/sw.js", {
					scope: "/",
				});

				setRegistration(reg);

				// Check for updates
				reg.addEventListener("updatefound", () => {
					const newWorker = reg.installing;
					if (newWorker) {
						newWorker.addEventListener("statechange", () => {
							if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
								setUpdateAvailable(true);
							}
						});
					}
				});

				// Check for updates every hour
				setInterval(() => {
					reg.update();
				}, 60 * 60 * 1000);
			} catch (error) {
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
		};
	}, []);

	const updateServiceWorker = () => {
		if (registration?.waiting) {
			registration.waiting.postMessage({ type: "SKIP_WAITING" });
			window.location.reload();
		}
	};

	const clearCache = async () => {
		if (registration?.active) {
			registration.active.postMessage({ type: "CLEAR_CACHE" });
		}
	};

	return {
		registration,
		updateAvailable,
		isOnline,
		updateServiceWorker,
		clearCache,
	};
}
