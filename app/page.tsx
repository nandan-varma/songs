"use client";

import { Loader2 } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { ErrorBoundary } from "@/components/common/error-boundary";
import { OfflineSongsList } from "@/components/offline/offline-songs-list";
import SearchContent from "@/components/search-content";
import { useOfflineStore } from "@/stores/offline-store";

export default function Home() {
	const [mounted, setMounted] = useState(false);
	const isOnline = useOfflineStore((state) => state.isOnline);

	useEffect(() => {
		setMounted(true);
	}, []);

	const isOfflineMode = !isOnline;

	return (
		<div className="min-h-screen bg-background" suppressHydrationWarning>
			{mounted && isOfflineMode ? (
				<ErrorBoundary context="OfflineSongsList">
					<OfflineSongsList />
				</ErrorBoundary>
			) : (
				<ErrorBoundary context="SearchContent">
					<Suspense
						fallback={
							<div className="container mx-auto px-4 py-8">
								<div className="flex justify-center py-12">
									<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
								</div>
							</div>
						}
					>
						<SearchContent />
					</Suspense>
				</ErrorBoundary>
			)}
		</div>
	);
}
