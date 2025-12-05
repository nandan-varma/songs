"use client";

import { RefreshCw, Trash2, X } from "lucide-react";
import { ErrorBoundary } from "@/components/error-boundary";
import { OfflineSongsList } from "@/components/offline/offline-songs-list";
import { StorageInfo } from "@/components/offline/storage-info";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DownloadStatus, useDownloads } from "@/contexts/downloads-context";

function DownloadsPageContent() {
	const { downloads, cachedSongs, clearQueue, removeFromQueue, retryFailed } =
		useDownloads();

	const activeDownloads = downloads.filter(
		(item) =>
			item.status === DownloadStatus.PENDING ||
			item.status === DownloadStatus.DOWNLOADING,
	);
	const failedDownloads = downloads.filter(
		(item) => item.status === DownloadStatus.FAILED,
	);

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="flex items-center justify-between mb-6">
				<div>
					<h1 className="text-3xl font-bold">Offline Music</h1>
					<p className="text-muted-foreground mt-1">
						{cachedSongs.size} cached • {activeDownloads.length} downloading
						{failedDownloads.length > 0 &&
							` • ${failedDownloads.length} failed`}
					</p>
				</div>

				<div className="flex items-center gap-2">
					{activeDownloads.length > 0 && (
						<Button variant="destructive" size="sm" onClick={clearQueue}>
							<X className="h-4 w-4 mr-2" />
							Cancel All
						</Button>
					)}
				</div>
			</div>

			<div className="mb-6">
				<StorageInfo />
			</div>

			{/* Failed Downloads Banner */}
			{failedDownloads.length > 0 && (
				<Card className="mb-6 border-red-200 bg-red-50/50 dark:bg-red-950/20">
					<CardHeader>
						<CardTitle className="flex items-center justify-between">
							<div className="flex items-center gap-2 text-red-600 dark:text-red-400">
								<X className="h-5 w-5" />
								{failedDownloads.length} Failed Download
								{failedDownloads.length > 1 ? "s" : ""}
							</div>
							<Button
								size="sm"
								variant="outline"
								onClick={() => {
									for (const item of failedDownloads) {
										retryFailed(item.song.id);
									}
								}}
							>
								<RefreshCw className="h-4 w-4 mr-2" />
								Retry All
							</Button>
						</CardTitle>
					</CardHeader>
					<CardContent>
						<ScrollArea className="max-h-40">
							<div className="space-y-2">
								{failedDownloads.map((item) => (
									<div
										key={item.id}
										className="flex items-center gap-3 text-sm"
									>
										<span className="flex-1 truncate">{item.song.name}</span>
										<Button
											size="sm"
											variant="ghost"
											onClick={() => retryFailed(item.song.id)}
										>
											<RefreshCw className="h-3 w-3" />
										</Button>
										<Button
											size="sm"
											variant="ghost"
											onClick={() => removeFromQueue(item.song.id)}
										>
											<Trash2 className="h-3 w-3" />
										</Button>
									</div>
								))}
							</div>
						</ScrollArea>
					</CardContent>
				</Card>
			)}

			<OfflineSongsList />
		</div>
	);
}

export default function DownloadsPage() {
	return (
		<ErrorBoundary context="Downloads">
			<DownloadsPageContent />
		</ErrorBoundary>
	);
}
