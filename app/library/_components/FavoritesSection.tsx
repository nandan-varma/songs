import { Heart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FavoritesSectionProps {
	favoritesCount: number;
}

export function FavoritesSection({ favoritesCount }: FavoritesSectionProps) {
	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle className="flex items-center gap-2">
					<Heart className="h-5 w-5 fill-red-500 text-red-500" />
					Favorites
				</CardTitle>
				<span className="text-sm text-muted-foreground">
					{favoritesCount} songs
				</span>
			</CardHeader>
			<CardContent>
				{favoritesCount === 0 ? (
					<p className="text-sm text-muted-foreground">
						No favorites yet. Heart some songs to add them here.
					</p>
				) : (
					<p className="text-sm text-muted-foreground">
						Favorites are tracked in the player store and can be surfaced here
						once song metadata is persisted alongside IDs.
					</p>
				)}
			</CardContent>
		</Card>
	);
}
