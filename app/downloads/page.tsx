"use client";

import { ErrorBoundary } from "@/components/common/error-boundary";
import { Button } from "@/components/ui/button";
import { OfflineSongsList } from "@/components/offline/offline-songs-list";
import { StorageInfo } from "@/components/offline/storage-info";
import { useCachedSongs } from "@/hooks/cache";

function DownloadsPageContent() {
	const { count: cachedSongsCount } = useCachedSongs();

	return (
		<div className="container mx-auto px-4 py-4 md:py-8 space-y-4 md:space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">Offline Music</h1>
					<p className="text-muted-foreground mt-1">
						{cachedSongsCount} cached{" "}
						{cachedSongsCount === 1 ? "song" : "songs"}
					</p>
				</div>
			</div>

			<StorageInfo />

			<OfflineSongsList />
		</div>
	);
}

export default function DownloadsPage() {
	return (
		<ErrorBoundary
			context="DownloadsPage"
			fallback={({ resetError }) => (
				<div className="container mx-auto px-4 py-4 md:py-8 flex flex-col items-center justify-center min-h-[50vh] space-y-4">
					<p className="text-muted-foreground">
						Failed to load downloads. Please try again.
					</p>
					<Button onClick={resetError}>Try Again</Button>
				</div>
			)}
		>
			<DownloadsPageContent />
		</ErrorBoundary>
	);
}
