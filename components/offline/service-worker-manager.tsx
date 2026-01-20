"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { useServiceWorker } from "@/hooks/network/use-service-worker";

export function ServiceWorkerManager() {
	const { updateAvailable, updateServiceWorker } = useServiceWorker();

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

	return null;
}
