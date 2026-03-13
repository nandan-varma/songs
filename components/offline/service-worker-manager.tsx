"use client";

import { AlertTriangle, RefreshCw, WifiOff } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useServiceWorker } from "@/hooks/network/use-service-worker";

export function ServiceWorkerManager() {
	const {
		updateAvailable,
		updateServiceWorker,
		isOnline,
		registrationError,
		retryRegistration,
	} = useServiceWorker();

	useEffect(() => {
		if (updateAvailable) {
			toast.info("Update Available", {
				description: "A new version of the app is available.",
				action: {
					label: "Update",
					onClick: updateServiceWorker,
				},
				duration: 10000,
			});
		}
	}, [updateAvailable, updateServiceWorker]);

	useEffect(() => {
		if (registrationError && !isOnline) {
			toast.error("Offline Mode Active", {
				description: "Some features may be limited without internet.",
				icon: <WifiOff className="h-4 w-4" />,
				duration: 5000,
			});
		}
	}, [registrationError, isOnline]);

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
