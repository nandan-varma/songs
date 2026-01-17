import { useEffect, useState } from "react";
import { toast } from "sonner";

/**
 * Monitors network connectivity and provides online/offline status
 * Shows toast notifications when network status changes
 */
export function useNetworkDetection() {
	const [isOnline, setIsOnline] = useState(true);

	useEffect(() => {
		if (typeof window === "undefined") return;

		let isInitial = true;

		const updateOnlineStatus = () => {
			const online = navigator.onLine;
			const wasOnline = isOnline;
			setIsOnline(online);

			// Show toast notifications for network changes (skip initial load)
			if (!isInitial) {
				if (!online) {
					toast.warning("No internet connection", {
						description:
							"Switched to offline mode. Only cached songs are available.",
					});
				} else if (wasOnline === false) {
					toast.success("Back online", {
						description: "Internet connection restored.",
					});
				}
			}

			isInitial = false;
		};

		// Set initial state
		updateOnlineStatus();

		// Listen for network changes
		window.addEventListener("online", updateOnlineStatus);
		window.addEventListener("offline", updateOnlineStatus);

		return () => {
			window.removeEventListener("online", updateOnlineStatus);
			window.removeEventListener("offline", updateOnlineStatus);
		};
	}, [isOnline]);

	return { isOnline };
}
