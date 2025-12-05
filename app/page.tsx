"use client";

import { Loader2 } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import { OfflineSongsList } from "@/components/offline/offline-songs-list";
import { SearchContent } from "@/components/search-content";
import { useOffline } from "@/contexts/offline-context";

export default function Home() {
	const { isOfflineMode } = useOffline();

	return (
		<div className="min-h-screen bg-background">
			{isOfflineMode ? (
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
