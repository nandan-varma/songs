"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";

export function useStoreHydrated() {
	const [hydrated, setHydrated] = useState(false);

	useEffect(() => {
		setHydrated(useAppStore.persist?.hasHydrated() ?? false);

		const unsubscribeHydrate = useAppStore.persist?.onHydrate(() => {
			setHydrated(false);
		});
		const unsubscribeFinishHydration = useAppStore.persist?.onFinishHydration(
			() => {
				setHydrated(true);
			},
		);

		return () => {
			unsubscribeHydrate?.();
			unsubscribeFinishHydration?.();
		};
	}, []);

	return hydrated;
}
