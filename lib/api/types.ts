/**
 * API Types and Response Wrappers
 * Provides typed wrappers for API responses with proper error handling
 */

import type {
	DetailedAlbum,
	DetailedArtist,
	DetailedPlaylist,
	DetailedSong,
} from "@/types/entity";

/**
 * Standard API response wrapper
 * Ensures all API responses follow a consistent structure
 */
export interface ApiResponse<T> {
	data: T;
	status: number;
	message?: string;
	timestamp: number;
}

/**
 * Paginated response wrapper for list endpoints
 */
export interface PaginatedResponse<T> {
	results: T[];
	total: number;
	start: number;
	count: number;
}

/**
 * Search response with multiple entity types
 */
export interface SearchResults {
	songs: PaginatedResponse<DetailedSong>;
	albums: PaginatedResponse<DetailedAlbum>;
	artists: PaginatedResponse<DetailedArtist>;
	playlists: PaginatedResponse<DetailedPlaylist>;
}

/**
 * Discriminated union for entity types
 * Enables type-safe handling of different entity types
 */
export type Entity =
	| { type: "song"; data: DetailedSong }
	| { type: "album"; data: DetailedAlbum }
	| { type: "artist"; data: DetailedArtist }
	| { type: "playlist"; data: DetailedPlaylist };

/**
 * Helper to create typed entity wrapper
 */
export function createEntity(
	type: "song" | "album" | "artist" | "playlist",
	data: unknown,
): Entity {
	return { type, data } as Entity;
}

/**
 * Type guard functions for entity discrimination
 */
export function isSong(
	entity: Entity,
): entity is { type: "song"; data: DetailedSong } {
	return entity.type === "song";
}

export function isAlbum(
	entity: Entity,
): entity is { type: "album"; data: DetailedAlbum } {
	return entity.type === "album";
}

export function isArtist(
	entity: Entity,
): entity is { type: "artist"; data: DetailedArtist } {
	return entity.type === "artist";
}

export function isPlaylist(
	entity: Entity,
): entity is { type: "playlist"; data: DetailedPlaylist } {
	return entity.type === "playlist";
}

/**
 * Query options for API calls
 */
export interface QueryOptions {
	/** Abort signal for request cancellation */
	signal?: AbortSignal;
	/** Custom timeout in milliseconds */
	timeout?: number;
	/** Retry configuration */
	retry?: {
		count: number;
		delay: number;
	};
	/** Cache configuration */
	cache?: {
		duration: number;
		key?: string;
	};
}

/**
 * Async operation result - either success or error
 */
export type AsyncResult<T> =
	| { status: "success"; data: T }
	| { status: "error"; error: Error };

/**
 * Helper to create successful result
 */
export function successResult<T>(data: T): AsyncResult<T> {
	return { status: "success", data };
}

/**
 * Helper to create error result
 */
export function errorResult<T>(error: Error): AsyncResult<T> {
	return { status: "error", error };
}

/**
 * Extracts data from AsyncResult
 */
export function getResultData<T>(result: AsyncResult<T>): T | null {
	return result.status === "success" ? result.data : null;
}

/**
 * Extracts error from AsyncResult
 */
export function getResultError<T>(result: AsyncResult<T>): Error | null {
	return result.status === "error" ? result.error : null;
}

/**
 * API error codes
 */
export enum ApiErrorCode {
	NETWORK_ERROR = "NETWORK_ERROR",
	NOT_FOUND = "NOT_FOUND",
	UNAUTHORIZED = "UNAUTHORIZED",
	INVALID_REQUEST = "INVALID_REQUEST",
	SERVER_ERROR = "SERVER_ERROR",
	TIMEOUT = "TIMEOUT",
	UNKNOWN = "UNKNOWN",
}

/**
 * Typed API error with code and context
 */
export class ApiError extends Error {
	constructor(
		message: string,
		public code: ApiErrorCode = ApiErrorCode.UNKNOWN,
		public statusCode?: number,
		public originalError?: unknown,
	) {
		super(message);
		this.name = "ApiError";
		Object.setPrototypeOf(this, ApiError.prototype);
	}
}

/**
 * Maps HTTP status codes to error codes
 */
export function getErrorCodeFromStatus(status: number): ApiErrorCode {
	switch (status) {
		case 404:
			return ApiErrorCode.NOT_FOUND;
		case 401:
		case 403:
			return ApiErrorCode.UNAUTHORIZED;
		case 400:
			return ApiErrorCode.INVALID_REQUEST;
		case 408:
		case 504:
			return ApiErrorCode.TIMEOUT;
		case 500:
		case 502:
		case 503:
			return ApiErrorCode.SERVER_ERROR;
		default:
			return ApiErrorCode.UNKNOWN;
	}
}

/**
 * Response wrapper factory
 * Ensures consistent API response handling
 */
export class ResponseHandler {
	static async handleJsonResponse<T>(response: Response): Promise<T> {
		if (!response.ok) {
			const errorCode = getErrorCodeFromStatus(response.status);
			throw new ApiError(
				`HTTP ${response.status}: ${response.statusText}`,
				errorCode,
				response.status,
			);
		}

		try {
			return (await response.json()) as T;
		} catch {
			throw new ApiError(
				"Failed to parse response JSON",
				ApiErrorCode.SERVER_ERROR,
			);
		}
	}

	static createTimeoutPromise<T>(ms: number): Promise<T> {
		return new Promise((_, reject) => {
			setTimeout(() => {
				reject(
					new ApiError(`Request timeout after ${ms}ms`, ApiErrorCode.TIMEOUT),
				);
			}, ms);
		});
	}

	static async handleWithTimeout<T>(
		promise: Promise<T>,
		timeoutMs?: number,
	): Promise<T> {
		if (!timeoutMs) return promise;

		return Promise.race([
			promise,
			ResponseHandler.createTimeoutPromise<T>(timeoutMs),
		]);
	}

	static async retry<T>(
		fn: () => Promise<T>,
		maxAttempts = 3,
		delayMs = 1000,
	): Promise<T> {
		let lastError: unknown;

		for (let attempt = 1; attempt <= maxAttempts; attempt++) {
			try {
				return await fn();
			} catch (error) {
				lastError = error;
				if (attempt < maxAttempts) {
					await new Promise((resolve) => setTimeout(resolve, delayMs));
				}
			}
		}

		throw lastError;
	}
}
