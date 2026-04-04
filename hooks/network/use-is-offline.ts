"use client";

import { useSyncExternalStore } from "react";

function subscribe(onStoreChange: () => void) {
	window.addEventListener("online", onStoreChange);
	window.addEventListener("offline", onStoreChange);

	return () => {
		window.removeEventListener("online", onStoreChange);
		window.removeEventListener("offline", onStoreChange);
	};
}

function getSnapshot() {
	return typeof navigator !== "undefined" ? !navigator.onLine : false;
}

export function useIsOffline() {
	return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
