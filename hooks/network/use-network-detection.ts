import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useIsOffline } from "./use-is-offline";

/**
 * Monitors network connectivity and provides online/offline status
 * Shows toast notifications when network status changes
 */
export function useNetworkDetection() {
	const isOffline = useIsOffline();
	const hasAnnouncedInitialState = useRef(false);

	useEffect(() => {
		if (!hasAnnouncedInitialState.current) {
			hasAnnouncedInitialState.current = true;
			return;
		}

		if (isOffline) {
			toast.warning("No internet connection", {
				description: "Only downloaded songs are available until you reconnect.",
			});
			return;
		}

		toast.success("Back online", {
			description: "Internet connection restored.",
		});
	}, [isOffline]);

	return { isOnline: !isOffline };
}
