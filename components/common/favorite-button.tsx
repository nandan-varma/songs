"use client";

import { Heart } from "lucide-react";
import { useFavorites } from "@/contexts/favorites-context";
import type { DetailedSong } from "@/types/entity";
import { Button } from "../ui/button";

interface FavoriteButtonProps {
	song: DetailedSong;
	size?: "sm" | "default" | "lg";
	variant?: "ghost" | "outline" | "default";
}

export function FavoriteButton({
	song,
	size = "default",
	variant = "ghost",
}: FavoriteButtonProps) {
	const { isFavorite, toggleFavorite } = useFavorites();
	const isFav = isFavorite(song.id);

	return (
		<Button
			variant={variant}
			size={size === "sm" ? "icon" : size === "lg" ? "icon" : "icon"}
			className={
				isFav
					? "text-red-500 hover:text-red-600"
					: "text-muted-foreground hover:text-foreground"
			}
			onClick={(e) => {
				e.stopPropagation();
				toggleFavorite(song);
			}}
			aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
		>
			<Heart className={`${isFav ? "fill-current" : ""} h-4 w-4`} />
		</Button>
	);
}
