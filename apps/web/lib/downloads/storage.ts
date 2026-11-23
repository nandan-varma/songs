import { clear, createStore, del, entries, get, set } from "idb-keyval";
import type { DetailedSong } from "@/types/entity";

const DOWNLOAD_STORE = createStore("songs-downloads-db", "downloads");

export const DOWNLOADED_SONGS_QUERY_KEY = ["downloads", "songs"] as const;

export interface DownloadedSongRecord {
	song: DetailedSong;
	blob: Blob;
	downloadedAt: string;
}

export async function getDownloadedSong(songId: string) {
	return (await get<DownloadedSongRecord>(songId, DOWNLOAD_STORE)) ?? null;
}

export async function getDownloadedSongBlob(songId: string) {
	return (await getDownloadedSong(songId))?.blob ?? null;
}

export async function saveDownloadedSong(song: DetailedSong, blob: Blob) {
	await set(
		song.id,
		{
			song,
			blob,
			downloadedAt: new Date().toISOString(),
		},
		DOWNLOAD_STORE,
	);
}

export async function removeDownloadedSong(songId: string) {
	await del(songId, DOWNLOAD_STORE);
}

export async function listDownloadedSongs() {
	const records = await entries<string, DownloadedSongRecord>(DOWNLOAD_STORE);
	return records
		.map(([, record]) => record)
		.sort((left, right) => right.downloadedAt.localeCompare(left.downloadedAt));
}

export async function getDownloadedSongIds() {
	const records = await listDownloadedSongs();
	return records.map((record) => record.song.id);
}

export async function isDownloadedSong(songId: string) {
	return (await getDownloadedSong(songId)) !== null;
}

export async function clearDownloadedSongsStorage() {
	await clear(DOWNLOAD_STORE);
}
