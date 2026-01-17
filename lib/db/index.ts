import { IDBConnection } from "./connection";
import { IDBOperations } from "./operations";

export type { CachedSong } from "./operations";

/**
 * Main database facade that combines connection and operations
 * Provides a clean interface for the rest of the application
 */
class MusicDatabase {
	private connection: IDBConnection;
	private operations: IDBOperations;

	constructor() {
		this.connection = new IDBConnection();
		this.operations = new IDBOperations(this.connection);
	}

	// Delegate all operations to the operations class
	async open() {
		return this.connection.open();
	}

	async saveSong(song: Parameters<IDBOperations["saveSong"]>[0]) {
		return this.operations.saveSong(song);
	}

	async saveAudioBlob(
		songId: string,
		blob: Blob,
	) {
		return this.operations.saveAudioBlob(songId, blob);
	}

	async saveImageBlob(
		key: string,
		blob: Blob,
		metadata?: { songId: string; quality: string },
	) {
		return this.operations.saveImageBlob(key, blob, metadata);
	}

	async getSong(songId: string) {
		return this.operations.getSong(songId);
	}

	async getAudioBlob(songId: string) {
		return this.operations.getAudioBlob(songId);
	}

	async getImageBlob(key: string) {
		return this.operations.getImageBlob(key);
	}

	async getAllSongs() {
		return this.operations.getAllSongs();
	}

	async deleteSong(songId: string) {
		return this.operations.deleteSong(songId);
	}

	async updateLastAccessed(songId: string) {
		return this.operations.updateLastAccessed(songId);
	}

	async clearAll() {
		return this.operations.clearAll();
	}

	async getStorageSize() {
		return this.operations.getStorageSize();
	}
}

export const musicDB = new MusicDatabase();
