import { cache } from "react";
import {
	getAlbumById,
	getArtistById,
	getPlaylistById,
	getSongById,
} from "./api";
import type {
	DetailedAlbum,
	DetailedArtist,
	DetailedPlaylist,
	DetailedSong,
} from "./types";

// Cached fetch functions to avoid duplicate requests between metadata and page rendering

export const getAlbum = cache(async (id: string): Promise<DetailedAlbum> => {
	const response = await getAlbumById(id);
	return response.data;
});

export const getArtist = cache(async (id: string): Promise<DetailedArtist> => {
	const response = await getArtistById(id);
	return response.data;
});

export const getSong = cache(async (id: string): Promise<DetailedSong[]> => {
	const response = await getSongById(id);
	return response.data;
});

export const getPlaylist = cache(
	async (id: string): Promise<DetailedPlaylist> => {
		const response = await getPlaylistById(id);
		return response.data;
	},
);
