import Dexie, { type EntityTable } from "dexie";
import type { DetailedSong } from "@/types/entity";

export interface CachedSong {
	id: string;
	metadata: DetailedSong;
	images: { [quality: string]: Blob };
	cachedAt: number;
	lastAccessed: number;
}

export interface AudioBlob {
	songId: string;
	blob: Blob;
}

export interface ImageBlob {
	key: string;
	blob: Blob;
	metadata?: {
		songId: string;
		quality: string;
	};
}

export interface FavoriteSong {
	songId: string;
	song: DetailedSong;
	addedAt: number;
}

export interface Playlist {
	id: string;
	name: string;
	songs: DetailedSong[];
	createdAt: number;
	updatedAt: number;
}

const MAX_CACHED_SONGS = 100;
const MAX_STORAGE_MB = 500;
const EVICTION_BATCH_PERCENT = 0.1;

class MusicAppDatabase extends Dexie {
	songs!: EntityTable<CachedSong, "id">;
	audio!: EntityTable<AudioBlob, "songId">;
	images!: EntityTable<ImageBlob, "key">;
	favorites!: EntityTable<FavoriteSong, "songId">;
	playlists!: EntityTable<Playlist, "id">;

	constructor() {
		super("MusicAppDB");

		this.version(1).stores({
			songs: "id, cachedAt, lastAccessed",
			audio: "songId",
			images: "key",
			favorites: "songId, addedAt",
			playlists: "id, createdAt, updatedAt",
		});
	}

	// Storage utilities
	async getStorageEstimate(): Promise<{
		usage: number;
		quota: number;
		usageMB: number;
		quotaMB: number;
	}> {
		if (
			typeof navigator !== "undefined" &&
			"storage" in navigator &&
			"estimate" in navigator.storage
		) {
			const estimate = await navigator.storage.estimate();
			const usage = estimate.usage || 0;
			const quota = estimate.quota || 0;
			return {
				usage,
				quota,
				usageMB: usage / (1024 * 1024),
				quotaMB: quota / (1024 * 1024),
			};
		}
		return { usage: 0, quota: 0, usageMB: 0, quotaMB: 0 };
	}

	// Song operations with LRU eviction
	async saveSong(song: DetailedSong): Promise<void> {
		const cachedSong: CachedSong = {
			id: song.id,
			metadata: song,
			images: {},
			cachedAt: Date.now(),
			lastAccessed: Date.now(),
		};
		await this.songs.put(cachedSong);
	}

	async getSong(songId: string): Promise<CachedSong | undefined> {
		const song = await this.songs.get(songId);
		if (song) {
			// Update last accessed timestamp
			await this.songs.update(songId, { lastAccessed: Date.now() });
		}
		return song;
	}

	async getAllSongs(): Promise<CachedSong[]> {
		return await this.songs.toArray();
	}

	async deleteSong(songId: string): Promise<void> {
		await this.transaction("rw", [this.songs, this.audio], async () => {
			await this.songs.delete(songId);
			await this.audio.delete(songId);
		});
	}

	async evictOldestIfNeeded(): Promise<void> {
		const { usageMB, quotaMB } = await this.getStorageEstimate();
		const songCount = await this.songs.count();

		const needsEvictionByCount = songCount >= MAX_CACHED_SONGS;
		const needsEvictionByStorage = quotaMB > 0 && usageMB >= MAX_STORAGE_MB;

		if (!needsEvictionByCount && !needsEvictionByStorage) {
			return;
		}

		// Get oldest songs by lastAccessed
		const evictCount = Math.ceil(songCount * EVICTION_BATCH_PERCENT);
		const oldestSongs = await this.songs
			.orderBy("lastAccessed")
			.limit(evictCount)
			.toArray();

		// Delete songs and their associated audio
		for (const song of oldestSongs) {
			await this.deleteSong(song.id);
		}
	}

	async getStorageInfo(): Promise<{
		songCount: number;
		usageMB: number;
		quotaMB: number;
	}> {
		const songCount = await this.songs.count();
		const { usageMB, quotaMB } = await this.getStorageEstimate();
		return { songCount, usageMB, quotaMB };
	}

	// Audio operations
	async saveAudioBlob(songId: string, blob: Blob): Promise<void> {
		await this.audio.put({ songId, blob });
	}

	async getAudioBlob(songId: string): Promise<Blob | undefined> {
		const record = await this.audio.get(songId);
		return record?.blob;
	}

	// Image operations
	async saveImageBlob(
		key: string,
		blob: Blob,
		metadata?: { songId: string; quality: string },
	): Promise<void> {
		await this.images.put({ key, blob, metadata });
	}

	async getImageBlob(key: string): Promise<Blob | undefined> {
		const record = await this.images.get(key);
		return record?.blob;
	}

	// Favorites operations
	async addFavorite(song: DetailedSong): Promise<void> {
		await this.favorites.put({
			songId: song.id,
			song,
			addedAt: Date.now(),
		});
	}

	async removeFavorite(songId: string): Promise<void> {
		await this.favorites.delete(songId);
	}

	async getFavorites(): Promise<FavoriteSong[]> {
		return await this.favorites.orderBy("addedAt").reverse().toArray();
	}

	async isFavorite(songId: string): Promise<boolean> {
		return (await this.favorites.get(songId)) !== undefined;
	}

	// Playlist operations
	async savePlaylist(playlist: Playlist): Promise<void> {
		await this.playlists.put(playlist);
	}

	async getPlaylist(id: string): Promise<Playlist | undefined> {
		return await this.playlists.get(id);
	}

	async getAllPlaylists(): Promise<Playlist[]> {
		return await this.playlists.orderBy("updatedAt").reverse().toArray();
	}

	async deletePlaylist(id: string): Promise<void> {
		await this.playlists.delete(id);
	}

	// Storage info - calculate actual size of stored blobs
	async getStorageSize(): Promise<number> {
		const { usage } = await this.getStorageEstimate();
		return usage;
	}

	// Clear all data
	async clearAll(): Promise<void> {
		await this.transaction(
			"rw",
			[this.songs, this.audio, this.images, this.favorites, this.playlists],
			async () => {
				await this.songs.clear();
				await this.audio.clear();
				await this.images.clear();
				await this.favorites.clear();
				await this.playlists.clear();
			},
		);
	}
}

export const db = new MusicAppDatabase();
