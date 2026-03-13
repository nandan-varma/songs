import type { DetailedSong } from "@/types/entity";

export interface FavoriteSong {
	songId: string;
	song: DetailedSong;
	addedAt: Date;
}

export interface FavoritesDB {
	songId: string;
	song: DetailedSong;
	addedAt: number;
}
