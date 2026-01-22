"use client";

import { Heart } from "lucide-react";
import { motion } from "motion/react";
import { memo } from "react";
import { useFavorites } from "@/contexts/favorites-context";
import type { DetailedSong } from "@/types/entity";
import { Button } from "../ui/button";

interface FavoriteButtonProps {
	song: DetailedSong;
	size?: "sm" | "default" | "lg";
	variant?: "ghost" | "outline" | "default";
}

export const FavoriteButton = memo(function FavoriteButton({
	song,
	size = "default",
	variant = "ghost",
}: FavoriteButtonProps) {
	const { isFavorite, toggleFavorite } = useFavorites();
	const isFav = isFavorite(song.id);

	return (
		<motion.div
			whileHover={{ scale: 1.15 }}
			whileTap={{ scale: 0.9 }}
			transition={{ type: "spring", stiffness: 400, damping: 20 }}
		>
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
				<motion.div
					animate={isFav ? { scale: [1, 1.3, 1] } : {}}
					transition={{ duration: 0.3 }}
				>
					<Heart className={`${isFav ? "fill-current" : ""} h-4 w-4`} />
				</motion.div>
			</Button>
		</motion.div>
	);
});
