"use client";

/**
 * Service Worker Manager Component
 *
 * Handles:
 * - Service worker registration and errors
 * - Displaying update notifications
 * - Offline mode detection
 * - Build info display on new deployments
 *
 * This component is typically rendered at the app root level
 */

import { AlertTriangle, RefreshCw, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useServiceWorker } from "@/hooks/network/use-service-worker";
import { formatBuildInfo, getBuildInfo } from "@/lib/deployment";
import { logError } from "@/lib/utils/logger";

/**
 * Manages Service Worker lifecycle and notifications
 *
 * Features:
 * - Registers and updates service worker
 * - Shows notifications for app updates
 * - Detects offline mode
 * - Displays build info on new deployments
 * - Handles registration errors with retry capability
 *
 * @component
 * @example
 * render() {
 *   return (
 *     <div>
 *       <main>{children}</main>
 *       <ServiceWorkerManager />
 *     </div>
 *   );
 * }
 */
export function ServiceWorkerManager() {
	const {
		updateAvailable,
		updateServiceWorker,
		isOnline,
		registrationError,
		retryRegistration,
		deploymentDetected,
	} = useServiceWorker();

	const [buildInfo, setBuildInfo] = useState<string | null>(null);

	/**
	 * Fetch build info when new deployment is detected
	 */
	useEffect(() => {
		if (deploymentDetected) {
			getBuildInfo()
				.then((info) => {
					setBuildInfo(formatBuildInfo(info));
				})
				.catch((error) => {
					logError("BuildInfoFetch", error);
					setBuildInfo("New version available");
				});
		}
	}, [deploymentDetected]);

	/**
	 * Show update notification when new version is available
	 */
	useEffect(() => {
		if (updateAvailable) {
			toast.info("Update Available", {
				description: buildInfo || "A new version of the app is available.",
				action: {
					label: "Update Now",
					onClick: updateServiceWorker,
				},
				duration: 10000,
			});
		}
	}, [updateAvailable, buildInfo, updateServiceWorker]);

	/**
	 * Notify user when offline mode is detected
	 */
	useEffect(() => {
		if (registrationError && !isOnline) {
			toast.error("Offline Mode Active", {
				description: "Some features may be limited without internet.",
				icon: <WifiOff className="h-4 w-4" />,
				duration: 5000,
			});
		}
	}, [registrationError, isOnline]);

	/**
	 * Show error UI when service worker registration fails
	 */
	if (registrationError && isOnline) {
		return (
			<div className="fixed bottom-20 left-4 right-4 z-50 max-w-md mx-auto">
				<div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
					<AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
					<div className="flex-1 min-w-0">
						<p className="text-sm font-medium text-destructive">
							Service Worker Error
						</p>
						<p className="text-xs text-muted-foreground mt-1">
							{registrationError}
						</p>
						<Button
							variant="outline"
							size="sm"
							onClick={retryRegistration}
							className="mt-3 h-8"
						>
							<RefreshCw className="h-3 w-3 mr-2" />
							Retry
						</Button>
					</div>
				</div>
			</div>
		);
	}

	return null;
}
