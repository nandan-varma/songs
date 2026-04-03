import { useCallback, useEffect, useRef, useState } from "react";
import { checkForNewDeployment, getBuildInfo } from "@/lib/deployment";

export function useServiceWorker() {
	const [registration, setRegistration] =
		useState<ServiceWorkerRegistration | null>(null);
	const [updateAvailable, setUpdateAvailable] = useState(false);
	const [isOnline, setIsOnline] = useState(true);
	const [registrationError, setRegistrationError] = useState<string | null>(
		null,
	);
	const [deploymentDetected, setDeploymentDetected] = useState(false);
	const updateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const buildIdRef = useRef<string | null>(null);

	useEffect(() => {
		// Check if service workers are supported
		if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
			setRegistrationError("Service Worker not supported");
			return;
		}

		// Register service worker
		const registerSW = async () => {
			try {
				// Get initial build info
				const buildInfo = await getBuildInfo();
				buildIdRef.current = buildInfo.id;

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
								setDeploymentDetected(true);
							}
						});
					}
				});

				// Listen for deployment detection messages from SW
				navigator.serviceWorker.addEventListener("message", (event) => {
					if (event.data?.type === "DEPLOYMENT_DETECTED") {
						console.log(
							"[useServiceWorker] Deployment detected:",
							event.data.buildInfo,
						);
						setDeploymentDetected(true);
						setUpdateAvailable(true);
						buildIdRef.current = event.data.buildInfo.id;
					}
				});

				// Check for updates every hour
				updateIntervalRef.current = setInterval(
					async () => {
						try {
							reg.update();
							// Also check if deployment info has changed
							if (buildIdRef.current) {
								const hasNewDeployment = await checkForNewDeployment(
									buildIdRef.current,
								);
								if (hasNewDeployment) {
									const newBuildInfo = await getBuildInfo();
									buildIdRef.current = newBuildInfo.id;
									setDeploymentDetected(true);
								}
							}
						} catch (err) {
							console.error("Update check error:", err);
						}
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
			// Send clear cache message to SW before updating
			if (registration.active) {
				registration.active.postMessage({ type: "CLEAR_CACHE" });
			}
			// Skip waiting to activate immediately
			registration.waiting.postMessage({ type: "SKIP_WAITING" });
			// Reload after a short delay to allow SW activation
			setTimeout(() => {
				window.location.reload();
			}, 100);
		}
	}, [registration?.waiting, registration?.active]);

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
		deploymentDetected,
		updateServiceWorker,
		clearCache,
		retryRegistration,
	};
}
