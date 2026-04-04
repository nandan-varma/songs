"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";

export function useStoreHydrated() {
	const [hydrated, setHydrated] = useState(useAppStore.persist.hasHydrated());

	useEffect(() => {
		setHydrated(useAppStore.persist.hasHydrated());

		const unsubscribeHydrate = useAppStore.persist.onHydrate(() => {
			setHydrated(false);
		});
		const unsubscribeFinishHydration = useAppStore.persist.onFinishHydration(
			() => {
				setHydrated(true);
			},
		);

		return () => {
			unsubscribeHydrate();
			unsubscribeFinishHydration();
		};
	}, []);

	return hydrated;
}
