import { describe, expect, it } from "vitest";
import {
	BackupDataSchema,
	FavoriteItemSchema,
	HistoryItemSchema,
	isValidPlaylistName,
	isValidSearchQuery,
	PlaylistItemSchema,
	sanitizeSearchQuery,
	VALIDATION,
} from "@/lib/validations/backup";

describe("BackupDataSchema", () => {
	it("validates complete backup data", () => {
		const data = {
			version: "1.0.0",
			timestamp: Date.now(),
		};
		expect(BackupDataSchema.safeParse(data).success).toBe(true);
	});

	it("validates with optional localStorage", () => {
		const data = {
			version: "1.0.0",
			timestamp: Date.now(),
			localStorage: { key: "value" },
		};
		expect(BackupDataSchema.safeParse(data).success).toBe(true);
	});

	it("validates with optional indexedDB", () => {
		const data = {
			version: "1.0.0",
			timestamp: Date.now(),
			indexedDB: {
				store: {
					song1: [
						{
							id: "song1",
							name: "Test Song",
							type: "song",
							year: "2024",
							releaseDate: "2024-01-01",
							duration: 180,
							label: "Test",
							explicitContent: false,
							playCount: 100,
							language: "hindi",
							hasLyrics: false,
							lyricsId: null,
							url: "https://example.com/song",
							copyright: "2024",
							album: {
								id: "album1",
								name: "Album",
								url: "https://example.com/album",
							},
							artists: { primary: [], featured: [], all: [] },
							image: [],
							downloadUrl: [],
						},
					],
				},
			},
		};
		expect(BackupDataSchema.safeParse(data).success).toBe(true);
	});

	it("fails without version", () => {
		const data = { timestamp: Date.now() };
		expect(BackupDataSchema.safeParse(data).success).toBe(false);
	});

	it("fails without timestamp", () => {
		const data = { version: "1.0.0" };
		expect(BackupDataSchema.safeParse(data).success).toBe(false);
	});

	it("fails with wrong types", () => {
		const data = { version: 123, timestamp: "not-a-number" };
		expect(BackupDataSchema.safeParse(data).success).toBe(false);
	});
});

describe("FavoriteItemSchema", () => {
	it("validates song favorite", () => {
		expect(
			FavoriteItemSchema.safeParse({ id: "1", type: "song" }).success,
		).toBe(true);
	});

	it("validates album favorite", () => {
		expect(
			FavoriteItemSchema.safeParse({ id: "2", type: "album" }).success,
		).toBe(true);
	});

	it("validates artist favorite", () => {
		expect(
			FavoriteItemSchema.safeParse({ id: "3", type: "artist" }).success,
		).toBe(true);
	});

	it("fails with invalid type", () => {
		expect(
			FavoriteItemSchema.safeParse({ id: "1", type: "playlist" }).success,
		).toBe(false);
	});

	it("fails without id", () => {
		expect(FavoriteItemSchema.safeParse({ type: "song" }).success).toBe(false);
	});

	it("fails without type", () => {
		expect(FavoriteItemSchema.safeParse({ id: "1" }).success).toBe(false);
	});
});

describe("PlaylistItemSchema", () => {
	it("validates minimal playlist", () => {
		const data = { id: "1", name: "My Playlist", songIds: [] };
		expect(PlaylistItemSchema.safeParse(data).success).toBe(true);
	});

	it("validates full playlist", () => {
		const data = {
			id: "1",
			name: "My Playlist",
			songIds: ["a", "b"],
			createdAt: "2024-01-01T00:00:00.000Z",
			updatedAt: "2024-01-02T00:00:00.000Z",
		};
		expect(PlaylistItemSchema.safeParse(data).success).toBe(true);
	});

	it("fails with empty name", () => {
		const data = { id: "1", name: "", songIds: [] };
		expect(PlaylistItemSchema.safeParse(data).success).toBe(false);
	});

	it("fails with name over 100 chars", () => {
		const data = { id: "1", name: "a".repeat(101), songIds: [] };
		expect(PlaylistItemSchema.safeParse(data).success).toBe(false);
	});

	it("fails without songIds", () => {
		const data = { id: "1", name: "Playlist" };
		expect(PlaylistItemSchema.safeParse(data).success).toBe(false);
	});
});

describe("HistoryItemSchema", () => {
	it("validates minimal history item", () => {
		const data = { songId: "1", playedAt: "2024-01-01T00:00:00.000Z" };
		expect(HistoryItemSchema.safeParse(data).success).toBe(true);
	});

	it("validates with optional duration", () => {
		const data = {
			songId: "1",
			playedAt: "2024-01-01T00:00:00.000Z",
			duration: 180,
		};
		expect(HistoryItemSchema.safeParse(data).success).toBe(true);
	});

	it("fails with invalid datetime", () => {
		const data = { songId: "1", playedAt: "not-a-date" };
		expect(HistoryItemSchema.safeParse(data).success).toBe(false);
	});

	it("fails without songId", () => {
		const data = { playedAt: "2024-01-01T00:00:00.000Z" };
		expect(HistoryItemSchema.safeParse(data).success).toBe(false);
	});
});

describe("VALIDATION constants", () => {
	it("has correct search query limits", () => {
		expect(VALIDATION.SEARCH_QUERY.min).toBe(1);
		expect(VALIDATION.SEARCH_QUERY.max).toBe(500);
	});

	it("has correct playlist name limits", () => {
		expect(VALIDATION.PLAYLIST_NAME.min).toBe(1);
		expect(VALIDATION.PLAYLIST_NAME.max).toBe(100);
	});

	it("has correct import size limit", () => {
		expect(VALIDATION.IMPORT_SIZE.max).toBe(10 * 1024 * 1024);
	});

	it("has correct song title limits", () => {
		expect(VALIDATION.SONG_TITLE.min).toBe(1);
		expect(VALIDATION.SONG_TITLE.max).toBe(500);
	});

	it("has correct artist name limits", () => {
		expect(VALIDATION.ARTIST_NAME.min).toBe(1);
		expect(VALIDATION.ARTIST_NAME.max).toBe(200);
	});

	it("has correct album name limits", () => {
		expect(VALIDATION.ALBUM_NAME.min).toBe(1);
		expect(VALIDATION.ALBUM_NAME.max).toBe(300);
	});
});

describe("isValidSearchQuery", () => {
	it("returns true for valid query", () => {
		expect(isValidSearchQuery("hello")).toBe(true);
	});

	it("returns true for single character", () => {
		expect(isValidSearchQuery("a")).toBe(true);
	});

	it("returns true for max length", () => {
		expect(isValidSearchQuery("a".repeat(500))).toBe(true);
	});

	it("returns false for empty string", () => {
		expect(isValidSearchQuery("")).toBe(false);
	});

	it("returns false for over max length", () => {
		expect(isValidSearchQuery("a".repeat(501))).toBe(false);
	});
});

describe("isValidPlaylistName", () => {
	it("returns true for valid name", () => {
		expect(isValidPlaylistName("My Playlist")).toBe(true);
	});

	it("returns true for single character", () => {
		expect(isValidPlaylistName("a")).toBe(true);
	});

	it("returns true for max length", () => {
		expect(isValidPlaylistName("a".repeat(100))).toBe(true);
	});

	it("returns false for empty string", () => {
		expect(isValidPlaylistName("")).toBe(false);
	});

	it("returns false for over max length", () => {
		expect(isValidPlaylistName("a".repeat(101))).toBe(false);
	});
});

describe("sanitizeSearchQuery", () => {
	it("trims whitespace", () => {
		expect(sanitizeSearchQuery("  hello  ")).toBe("hello");
	});

	it("removes control characters", () => {
		const input = `hello\x00world`;
		expect(sanitizeSearchQuery(input)).toBe("helloworld");
	});

	it("removes tab character", () => {
		const input = "hello\tworld";
		expect(sanitizeSearchQuery(input)).toBe("helloworld");
	});

	it("removes newline character", () => {
		const input = "hello\nworld";
		expect(sanitizeSearchQuery(input)).toBe("helloworld");
	});

	it("removes DEL character (127)", () => {
		const input = `hello\x7Fworld`;
		expect(sanitizeSearchQuery(input)).toBe("helloworld");
	});

	it("preserves printable characters", () => {
		expect(sanitizeSearchQuery("hello world!@#$%^&*()")).toBe(
			"hello world!@#$%^&*()",
		);
	});

	it("truncates to max length", () => {
		const input = "a".repeat(600);
		const result = sanitizeSearchQuery(input);
		expect(result.length).toBe(500);
	});

	it("handles multiple control characters", () => {
		const input = `\x00a\x01b\x02c`;
		expect(sanitizeSearchQuery(input)).toBe("abc");
	});

	it("returns empty string for only control characters", () => {
		expect(sanitizeSearchQuery("\x00\x01\x02")).toBe("");
	});

	it("handles empty input", () => {
		expect(sanitizeSearchQuery("")).toBe("");
	});
});
