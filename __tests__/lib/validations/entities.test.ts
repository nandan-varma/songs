import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
	AlbumMiniSchema,
	ArtistMiniSchema,
	createPaginatedResponseSchema,
	DetailedAlbumSchema,
	DetailedArtistSchema,
	DetailedPlaylistSchema,
	DetailedSongSchema,
	DownloadUrlSchema,
	ImageSchema,
	LocalPlaylistSchema,
	parseEntity,
	SearchResponseSchema,
} from "@/lib/validations/entities";
import {
	ArtistRole,
	AudioQuality,
	EntityType,
	ImageQuality,
	Language,
} from "@/types/entity";

describe("parseEntity", () => {
	it("returns data on successful parse", () => {
		const data = {
			quality: ImageQuality.HIGH,
			url: "https://example.com/img.jpg",
		};
		const result = parseEntity(ImageSchema, data);
		expect(result).not.toBeNull();
		expect(result?.quality).toBe(ImageQuality.HIGH);
	});

	it("returns null on failed parse", () => {
		const data = { quality: "invalid" };
		const result = parseEntity(ImageSchema, data);
		expect(result).toBeNull();
	});

	it("handles null input", () => {
		const result = parseEntity(ImageSchema, null);
		expect(result).toBeNull();
	});

	it("handles undefined input", () => {
		const result = parseEntity(ImageSchema, undefined);
		expect(result).toBeNull();
	});
});

describe("ImageSchema", () => {
	it("validates valid image", () => {
		const data = {
			quality: ImageQuality.HIGH,
			url: "https://example.com/img.jpg",
		};
		expect(ImageSchema.safeParse(data).success).toBe(true);
	});

	it("rejects invalid quality", () => {
		const data = { quality: "invalid", url: "https://example.com/img.jpg" };
		expect(ImageSchema.safeParse(data).success).toBe(false);
	});

	it("rejects invalid URL", () => {
		const data = { quality: ImageQuality.HIGH, url: "not-a-url" };
		expect(ImageSchema.safeParse(data).success).toBe(false);
	});
});

describe("DownloadUrlSchema", () => {
	it("validates valid download URL", () => {
		const data = {
			quality: AudioQuality.VERY_HIGH,
			url: "https://example.com/audio.mp3",
		};
		expect(DownloadUrlSchema.safeParse(data).success).toBe(true);
	});

	it("rejects invalid quality", () => {
		const data = { quality: "invalid", url: "https://example.com/audio.mp3" };
		expect(DownloadUrlSchema.safeParse(data).success).toBe(false);
	});
});

describe("ArtistMiniSchema", () => {
	it("validates valid artist", () => {
		const data = {
			id: "artist1",
			name: "Test Artist",
			role: ArtistRole.SINGER,
			type: EntityType.ARTIST,
			image: [],
			url: "https://example.com/artist",
		};
		expect(ArtistMiniSchema.safeParse(data).success).toBe(true);
	});

	it("accepts string role", () => {
		const data = {
			id: "artist1",
			name: "Test Artist",
			role: "singer",
			type: "artist",
			image: [],
			url: "https://example.com/artist",
		};
		expect(ArtistMiniSchema.safeParse(data).success).toBe(true);
	});

	it("rejects missing required fields", () => {
		const data = { id: "artist1" };
		expect(ArtistMiniSchema.safeParse(data).success).toBe(false);
	});
});

describe("AlbumMiniSchema", () => {
	it("validates valid album", () => {
		const data = {
			id: "album1",
			name: "Test Album",
			url: "https://example.com/album",
		};
		expect(AlbumMiniSchema.safeParse(data).success).toBe(true);
	});

	it("allows null values", () => {
		const data = { id: null, name: null, url: null };
		expect(AlbumMiniSchema.safeParse(data).success).toBe(true);
	});
});

describe("DetailedSongSchema", () => {
	it("validates complete song data", () => {
		const data = {
			id: "song1",
			name: "Test Song",
			type: "song",
			year: "2024",
			releaseDate: "2024-01-01",
			duration: 180,
			label: "Test",
			explicitContent: false,
			playCount: 1000,
			language: Language.HINDI,
			hasLyrics: true,
			lyricsId: "lyrics1",
			url: "https://example.com/song",
			copyright: "2024 Test",
			album: { id: "album1", name: "Album", url: "https://example.com/album" },
			artists: {
				primary: [
					{
						id: "a1",
						name: "Artist",
						role: "singer",
						type: "artist",
						image: [],
						url: "https://example.com/a",
					},
				],
				featured: [],
				all: [],
			},
			image: [
				{ quality: ImageQuality.HIGH, url: "https://example.com/img.jpg" },
			],
			downloadUrl: [
				{
					quality: AudioQuality.VERY_HIGH,
					url: "https://example.com/audio.mp3",
				},
			],
		};
		expect(DetailedSongSchema.safeParse(data).success).toBe(true);
	});

	it("allows nullable fields to be null", () => {
		const data = {
			id: "song1",
			name: "Test Song",
			type: "song",
			year: null,
			releaseDate: null,
			duration: null,
			label: null,
			explicitContent: false,
			playCount: null,
			language: Language.HINDI,
			hasLyrics: false,
			lyricsId: null,
			url: "https://example.com/song",
			copyright: null,
			album: { id: null, name: null, url: null },
			artists: { primary: [], featured: [], all: [] },
			image: [],
			downloadUrl: [],
		};
		expect(DetailedSongSchema.safeParse(data).success).toBe(true);
	});

	it("rejects missing required fields", () => {
		const data = { id: "song1" };
		expect(DetailedSongSchema.safeParse(data).success).toBe(false);
	});
});

describe("DetailedAlbumSchema", () => {
	it("validates complete album data", () => {
		const data = {
			id: "album1",
			name: "Test Album",
			description: "Album description",
			year: 2024,
			type: EntityType.ALBUM,
			playCount: 1000,
			language: Language.HINDI,
			explicitContent: false,
			artists: { primary: [], featured: [], all: [] },
			songCount: 10,
			url: "https://example.com/album",
			image: [],
			songs: [],
		};
		expect(DetailedAlbumSchema.safeParse(data).success).toBe(true);
	});
});

describe("DetailedArtistSchema", () => {
	it("validates minimal artist data", () => {
		const data = {
			id: "artist1",
			name: "Test Artist",
			url: "https://example.com/artist",
			type: EntityType.ARTIST,
			image: [],
			followerCount: null,
			fanCount: null,
			isVerified: null,
			dominantLanguage: null,
			dominantType: null,
			bio: null,
			dob: null,
			fb: null,
			twitter: null,
			wiki: null,
			availableLanguages: [],
			isRadioPresent: null,
			topSongs: null,
			topAlbums: null,
			singles: null,
			similarArtists: null,
		};
		expect(DetailedArtistSchema.safeParse(data).success).toBe(true);
	});
});

describe("DetailedPlaylistSchema", () => {
	it("validates complete playlist data", () => {
		const data = {
			id: "playlist1",
			name: "Test Playlist",
			description: "Playlist description",
			year: 2024,
			type: EntityType.PLAYLIST,
			playCount: 100,
			language: Language.HINDI,
			explicitContent: false,
			songCount: 10,
			url: "https://example.com/playlist",
			image: [],
			songs: [],
			artists: [],
		};
		expect(DetailedPlaylistSchema.safeParse(data).success).toBe(true);
	});
});

describe("LocalPlaylistSchema", () => {
	it("validates playlist with songs", () => {
		const data = {
			id: "playlist1",
			name: "My Playlist",
			songs: [],
			createdAt: Date.now(),
			updatedAt: Date.now(),
		};
		expect(LocalPlaylistSchema.safeParse(data).success).toBe(true);
	});

	it("rejects empty name", () => {
		const data = {
			id: "playlist1",
			name: "",
			songs: [],
			createdAt: Date.now(),
			updatedAt: Date.now(),
		};
		expect(LocalPlaylistSchema.safeParse(data).success).toBe(false);
	});
});

describe("createPaginatedResponseSchema", () => {
	it("validates paginated response", () => {
		const data = {
			results: [1, 2, 3],
			total: 100,
			start: 0,
			count: 10,
		};
		const schema = createPaginatedResponseSchema(z.number());
		expect(schema.safeParse(data).success).toBe(true);
	});
});

describe("SearchResponseSchema", () => {
	it("validates complete search response", () => {
		const data = {
			songs: { results: [], position: 1 },
			albums: { results: [], position: 2 },
			artists: { results: [], position: 3 },
			playlists: { results: [], position: 4 },
		};
		expect(SearchResponseSchema.safeParse(data).success).toBe(true);
	});

	it("allows missing optional fields", () => {
		const data = {
			songs: { results: [], position: 1 },
			albums: { results: [], position: 2 },
			artists: { results: [], position: 3 },
			playlists: { results: [], position: 4 },
		};
		expect(SearchResponseSchema.safeParse(data).success).toBe(true);
	});
});
