import { IDBConnection } from "./connection";
import {
	AudioOperations,
	type CachedSong,
	ImageOperations,
	SongOperations,
	StorageOperations,
} from "./operations";

export type { CachedSong };

/**
 * Facade for IndexedDB operations
 * Provides unified API with separated concerns
 */
class MusicDatabase {
	private connection: IDBConnection;
	private songs: SongOperations;
	private audio: AudioOperations;
	private images: ImageOperations;
	private storage: StorageOperations;

	constructor() {
		this.connection = new IDBConnection();
		this.songs = new SongOperations(this.connection);
		this.audio = new AudioOperations(this.connection);
		this.images = new ImageOperations(this.connection);
		this.storage = new StorageOperations();
	}

	// Song operations
	async saveSong(song: Parameters<SongOperations["saveSong"]>[0]) {
		return this.songs.saveSong(song);
	}

	async getSong(songId: string) {
		return this.songs.getSong(songId);
	}

	async getAllSongs() {
		return this.songs.getAllSongs();
	}

	async deleteSong(songId: string) {
		await Promise.all([
			this.songs.deleteSong(songId),
			this.audio.deleteAudioBlob(songId),
		]);
	}

	async updateLastAccessed(songId: string) {
		return this.songs.updateLastAccessed(songId);
	}

	async evictOldestIfNeeded() {
		return this.songs.evictOldestIfNeeded();
	}

	async getStorageInfo() {
		return this.songs.getStorageInfo();
	}

	// Audio operations
	async saveAudioBlob(songId: string, blob: Blob) {
		return this.audio.saveAudioBlob(songId, blob);
	}

	async getAudioBlob(songId: string) {
		return this.audio.getAudioBlob(songId);
	}

	// Image operations
	async saveImageBlob(
		key: string,
		blob: Blob,
		metadata?: { songId: string; quality: string },
	) {
		return this.images.saveImageBlob(key, blob, metadata);
	}

	async getImageBlob(key: string) {
		return this.images.getImageBlob(key);
	}

	// Storage operations
	async getStorageSize() {
		return this.storage.getStorageSize();
	}

	async getStorageQuota() {
		return this.storage.getStorageQuota();
	}

	// Bulk operations
	async clearAll() {
		await Promise.all([
			this.songs.clear(),
			this.audio.clear(),
			this.images.clear(),
		]);
	}
}

export const musicDB = new MusicDatabase();
