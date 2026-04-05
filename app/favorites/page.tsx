"use client";

import { Heart, Loader2 } from "lucide-react";
import { SongsList } from "@/components/songs-list";
import { useSongs } from "@/hooks/data/queries";
import { useFavorites } from "@/hooks/use-store";
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
				<div className="max-w-4xl mx-auto">
					<SongsList songs={favoriteSongs.map(detailedSongToSong)} />
				</div>
			) : null}
		</div>
	);
}
