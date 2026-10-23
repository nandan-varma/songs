"use client";

import { shuffle } from "es-toolkit";
import { Heart, Loader2, Play, Shuffle } from "lucide-react";
import { SongsList } from "@/components/songs-list";
import { Button } from "@/components/ui/button";
import { useSongs } from "@/hooks/data/queries";
import { useAppStore, useFavorites } from "@/hooks/use-store";
import { useStoreHydrated } from "@/hooks/use-store-hydrated";
import { detailedSongToSong } from "@/lib/utils";

export default function FavoritesPage() {
	const isHydrated = useStoreHydrated();
	const { favoriteIds } = useFavorites();

	// Convert set to array for querying
	const favoriteIdsArray = Array.from(favoriteIds || []);

	// Fetch detailed song data for the favorite IDs
	const { data: favoriteSongs, isLoading } = useSongs(favoriteIdsArray, {
		enabled: isHydrated && favoriteIdsArray.length > 0,
	});

	if (!isHydrated) {
		return (
			<div className="container mx-auto py-6 px-4 sm:px-6 max-w-7xl flex items-center justify-center min-h-[50vh]">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="container mx-auto py-6 px-4 sm:px-6 max-w-7xl">
			<div className="flex items-center gap-3 mb-6">
				<div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-500">
					<Heart className="h-6 w-6 fill-current" />
				</div>
				<div>
					<h1 className="text-3xl font-bold">Favorites</h1>
					<p className="text-muted-foreground">
						{favoriteIdsArray.length}{" "}
						{favoriteIdsArray.length === 1 ? "song" : "songs"}
					</p>
				</div>
			</div>

			{favoriteIdsArray.length === 0 ? (
				<div className="flex flex-col items-center justify-center min-h-[40vh] text-muted-foreground space-y-4">
					<Heart className="h-16 w-16 opacity-20" />
					<p className="text-lg font-medium">No favorites yet</p>
					<p className="text-sm text-center max-w-sm">
						Like songs while listening to them, and they will appear here in
						your favorites collection.
					</p>
				</div>
			) : isLoading ? (
				<div className="flex justify-center py-12">
					<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
				</div>
			) : favoriteSongs && favoriteSongs.length > 0 ? (
				<div className="max-w-4xl mx-auto space-y-4">
					<div className="flex gap-2">
						<Button
							onClick={() => useAppStore.getState().playQueue(favoriteSongs)}
							className="gap-1.5"
						>
							<Play className="h-4 w-4" />
							Play
						</Button>
						<Button
							variant="secondary"
							onClick={() =>
								useAppStore.getState().playQueue(shuffle(favoriteSongs))
							}
							className="gap-1.5"
						>
							<Shuffle className="h-4 w-4" />
							Shuffle
						</Button>
					</div>
					<SongsList
						songs={favoriteSongs.map(detailedSongToSong)}
						detailedSongs={favoriteSongs}
						numbered
					/>
				</div>
			) : null}
		</div>
	);
}
