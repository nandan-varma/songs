"use client";

import { useQueryState } from "nuqs";
import { useEffect } from "react";
import { SongHeader } from "@/components/song/song-header";
import { SongSuggestions } from "@/components/song/song-suggestions";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useOffline } from "@/hooks/cache";
import { useSongSuggestions } from "@/hooks/data/queries";
import { useSongFromQuery } from "@/hooks/pages/use-song";
import { useOfflinePlayerActions } from "@/hooks/player/use-offline-player";
import { useAppStore } from "@/lib/store";
import { detailedSongToSong } from "@/lib/utils";
import { EntityType } from "@/types/entity";

export function Client() {
	const [id] = useQueryState("id");
	const { playSong, addToQueue } = useOfflinePlayerActions();
	const isOfflineMode = useOffline();
	const addToVisitHistory = useAppStore((state) => state.addToVisitHistory);

	const { data: songData, isPending } = useSongFromQuery();
	const { data: suggestions = [] } = useSongSuggestions(id || "", 10, {
		enabled: !!id && !isOfflineMode,
	});

	const song = songData?.[0];
	const filteredSuggestions = suggestions;

	// Track visit to song
	useEffect(() => {
		if (song && !isOfflineMode) {
			addToVisitHistory({
				entityId: song.id,
				entityType: EntityType.SONG,
				entityName: song.name,
				image: song.image,
				timestamp: Date.now(),
			});
		}
	}, [song?.id, isOfflineMode, addToVisitHistory, song]);

	if (!id) {
		return (
			<div className="container mx-auto px-4 py-8">
				<p className="text-center text-destructive">Song ID is required</p>
			</div>
		);
	}

	if (isOfflineMode) {
		return (
			<div className="container mx-auto px-4 py-8">
				<Card className="text-center py-12">
					<CardContent>
						<p className="text-muted-foreground">
							Song details are not available in offline mode. Please disable
							offline mode to view this song.
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
				<Card>
					<CardContent className="p-6">
						<div className="flex flex-col md:flex-row gap-6">
							{/* Album Art Skeleton */}
							<Skeleton className="w-full md:w-64 aspect-square rounded-lg flex-shrink-0" />

							{/* Song Details Skeleton */}
							<div className="flex-1 space-y-4">
								<div className="space-y-2">
									<Skeleton className="h-6 w-16" />
									<Skeleton className="h-10 w-3/4" />
								</div>

								<div className="space-y-2">
									<Skeleton className="h-4 w-1/2" />
									<Skeleton className="h-4 w-3/5" />
									<div className="flex gap-4">
										<Skeleton className="h-4 w-12" />
										<Skeleton className="h-4 w-16" />
										<Skeleton className="h-4 w-14" />
									</div>
									<Skeleton className="h-6 w-24" />
								</div>

								{/* Action Buttons Skeleton */}
								<div className="flex gap-2">
									<Skeleton className="h-11 w-20" />
									<Skeleton className="h-11 w-32" />
									<Skeleton className="h-11 w-28" />
									<Skeleton className="h-11 w-24" />
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (!song) {
		return (
			<div className="container mx-auto px-4 py-8">
				<p className="text-center text-destructive">Song not found</p>
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 py-8 pb-32 space-y-8">
			<SongHeader
				song={song}
				onPlay={() => playSong(song)}
				onAddToQueue={() => addToQueue(song)}
			/>

			<SongSuggestions
				suggestions={filteredSuggestions.map(detailedSongToSong)}
			/>
		</div>
	);
}
