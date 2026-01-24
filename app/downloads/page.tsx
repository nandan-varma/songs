"use client";

import { ErrorBoundary } from "@/components/common/error-boundary";
import { OfflineSongsList } from "@/components/offline/offline-songs-list";
import { StorageInfo } from "@/components/offline/storage-info";
import { useDownloadsStore } from "@/stores/downloads-store";

function DownloadsPageContent() {
	const cachedSongs = useDownloadsStore((state) => state.cachedSongs);

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="flex items-center justify-between mb-6">
				<div>
					<h1 className="text-3xl font-bold">Offline Music</h1>
					<p className="text-muted-foreground mt-1">
						{cachedSongs.size} cached songs
					</p>
				</div>
			</div>

			<div className="mb-6">
				<StorageInfo />
			</div>

			<OfflineSongsList />
		</div>
	);
}

export default function DownloadsPage() {
	return (
		<ErrorBoundary>
			<DownloadsPageContent />
		</ErrorBoundary>
	);
}
