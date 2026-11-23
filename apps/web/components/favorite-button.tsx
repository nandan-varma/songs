"use client";

import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Track } from "@/lib/models";
import { useLibrary } from "@/lib/stores/library";
import { cn } from "@/lib/utils";

export function FavoriteButton({ track }: { track: Track }) {
	const favorite = useLibrary((s) =>
		s.favorites.some((t) => t.id === track.id),
	);
	const toggleFavorite = useLibrary((s) => s.toggleFavorite);
	return (
		<Button
			variant="ghost"
			size="icon"
			aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
			aria-pressed={favorite}
			onClick={() => toggleFavorite(track)}
		>
			<Heart className={cn(favorite && "fill-current text-destructive")} />
		</Button>
	);
}
