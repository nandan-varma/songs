"use client";

import { useQueryState } from "nuqs";
import { AlbumHeader } from "@/components/album/album-header";
import { SongsList } from "@/components/songs-list";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAlbum } from "@/hooks/data/queries";
import { useIsOffline } from "@/hooks/network/use-is-offline";
import { useOfflinePlayerActions } from "@/hooks/player/use-offline-player";
import { detailedSongToSong } from "@/lib/utils";

export function Client() {
	const [id] = useQueryState("id");
	const { playQueue, addToQueue } = useOfflinePlayerActions();
	const isOffline = useIsOffline();

	const {
		data: album,
		error,
		isPending,
	} = useAlbum(id || "", {
		enabled: !!id && !isOffline,
	});

	const filteredSongs = album?.songs ?? [];

	if (!id) {
		return (
			<div className="container mx-auto px-4 py-8">
				<p className="text-center text-destructive">Album ID is required</p>
			</div>
		);
	}

	if (isOffline) {
		return (
			<div className="container mx-auto px-4 py-8">
				<Card className="text-center py-12">
					<CardContent>
						<p className="text-muted-foreground">
							Album details are not available in offline mode. Please disable
							offline mode to view this album.
						</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	// Show loading state while fetching
	if (isPending) {
		return (
			<div className="container mx-auto px-4 py-8 pb-32 space-y-8">
				{/* Album Header */}
				<Card>
					<CardContent className="p-6">
						<div className="flex flex-col md:flex-row gap-6">
							{/* Album Art Skeleton */}
							<Skeleton className="relative aspect-square w-full md:w-64 flex-shrink-0 rounded-lg" />

							{/* Album Details Skeleton */}
							<div className="flex-1 space-y-4">
								<div className="space-y-2">
									<Skeleton className="h-6 w-16" />
									<Skeleton className="h-10 w-3/4" />
								</div>

								<div className="space-y-2">
									<Skeleton className="h-4 w-1/2" />
									<div className="flex gap-4">
										<Skeleton className="h-4 w-12" />
										<Skeleton className="h-4 w-16" />
										<Skeleton className="h-4 w-20" />
									</div>
									<Skeleton className="h-4 w-full" />
									<Skeleton className="h-4 w-2/3" />
								</div>

								{/* Action Buttons Skeleton */}
								<div className="flex gap-2">
									<Skeleton className="h-11 w-24" />
									<Skeleton className="h-11 w-32" />
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Track List Skeleton */}
				<div className="space-y-4">
					{Array.from({ length: 10 }).map((_, i) => (
						<div
							// Skeleton items are static loading placeholders with a fixed count.
							// The index is stable and appropriate for keys here since items don't reorder.
							// biome-ignore lint/suspicious/noArrayIndexKey: skeleton keys are stable
							key={`track-skeleton-${i}`}
							className="flex items-center gap-4 p-4 rounded-lg border"
						>
							<Skeleton className="h-12 w-12 rounded" />
							<div className="flex-1 space-y-2">
								<Skeleton className="h-4 w-3/4" />
								<Skeleton className="h-3 w-1/2" />
							</div>
							<Skeleton className="h-8 w-8" />
						</div>
					))}
				</div>
			</div>
		);
	}

	if (error || !album) {
		return (
			<div className="container mx-auto px-4 py-8">
				<p className="text-center text-destructive">
					{error instanceof Error ? error.message : "Album not found"}
				</p>
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 py-8 pb-32 space-y-8">
			<AlbumHeader
				album={album}
				songsCount={filteredSongs.length}
				onPlayAll={() => playQueue(filteredSongs)}
				onAddAllToQueue={() => {
					for (const song of filteredSongs) {
						addToQueue(song);
					}
				}}
			/>

			{filteredSongs.length > 0 && (
				<SongsList songs={filteredSongs.map(detailedSongToSong)} />
			)}
		</div>
	);
}
