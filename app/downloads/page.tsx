"use client";

import { ErrorBoundary } from "@/components/common/error-boundary";
import { OfflineSongsList } from "@/components/offline/offline-songs-list";
import { StorageInfo } from "@/components/offline/storage-info";
import { Button } from "@/components/ui/button";

function DownloadsPageContent() {
	// TODO: Get cached songs from new cache system
	const cachedSongsCount = 0;

	const handleSaveToDevice = () => {
		// TODO: Implement save to device functionality
	};

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="flex items-center justify-between mb-6">
				<div>
					<h1 className="text-3xl font-bold">Offline Music</h1>
					<p className="text-muted-foreground mt-1">
						{cachedSongsCount} cached songs
					</p>
				</div>

				<div className="flex items-center gap-2">
					{cachedSongsCount > 0 && (
						<Button variant="default" size="sm" onClick={handleSaveToDevice}>
							Save to Device
						</Button>
					)}
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
