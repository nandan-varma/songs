import { describe, expect, it } from "vitest";
import {
	detailedSongToSong,
	getImageByQuality,
	getImageUrl,
	songToDetailedSong,
} from "@/lib/utils";
import type {
	AudioQuality,
	DetailedSong,
	Image,
	ImageQuality,
	Song,
} from "@/types/entity";

function makeImage(quality: string, url: string): Image {
	return { quality: quality as ImageQuality, url };
}

function makeDetailedSong(overrides?: Partial<DetailedSong>): DetailedSong {
	return {
		id: "song1",
		name: "Test Song",
		type: "song",
		year: "2024",
		releaseDate: "2024-01-01",
		duration: 180,
		label: "Test Label",
		explicitContent: false,
		playCount: 1000,
		language: "hindi",
		hasLyrics: true,
		lyricsId: "lyrics1",
		url: "https://example.com/song",
		copyright: "2024 Test",
		album: {
			id: "album1",
			name: "Test Album",
			url: "https://example.com/album",
		},
		artists: {
			primary: [
				{
					id: "artist1",
					name: "Artist One",
					role: "singer",
					type: "artist",
					image: [],
					url: "https://example.com/artist1",
				},
			],
			featured: [],
			all: [
				{
					id: "artist1",
					name: "Artist One",
					role: "singer",
					type: "artist",
					image: [],
					url: "https://example.com/artist1",
				},
			],
		},
		image: [makeImage("500x500", "https://example.com/image.jpg")],
		downloadUrl: [
			{
				quality: "VERY_HIGH" as unknown as AudioQuality,
				url: "https://example.com/download",
			},
		],
		...overrides,
	};
}

function makeSong(overrides?: Partial<Song>): Song {
	return {
		id: "song1",
		title: "Test Song",
		image: [makeImage("500x500", "https://example.com/image.jpg")],
		album: "Test Album",
		url: "https://example.com/song",
		type: "song",
		description: "Artist One",
		primaryArtists: "Artist One",
		singers: "Artist One",
		language: "hindi",
		...overrides,
	};
}

describe("getImageByQuality", () => {
	it("returns null for undefined images", () => {
		expect(getImageByQuality(undefined, "high")).toBeNull();
	});

	it("returns null for empty array", () => {
		expect(getImageByQuality([], "high")).toBeNull();
	});

	it("finds high quality image", () => {
		const images = [
			makeImage("150x150", "url_low"),
			makeImage("500x500", "url_high"),
		];
		expect(getImageByQuality(images, "high")).toBe("url_high");
	});

	it("finds medium quality image", () => {
		const images = [
			makeImage("150x150", "url_low"),
			makeImage("500x500", "url_high"),
		];
		expect(getImageByQuality(images, "medium")).toBe("url_low");
	});

	it("finds low quality image", () => {
		const images = [
			makeImage("150x150", "url_low"),
			makeImage("500x500", "url_high"),
		];
		expect(getImageByQuality(images, "low")).toBe("url_low");
	});

	it("falls back to index when quality not found", () => {
		const images = [{ quality: "unknown" as ImageQuality, url: "url_unknown" }];
		expect(getImageByQuality(images, "high")).toBe("url_unknown");
	});

	it("falls back to first image when index out of range", () => {
		const images = [{ quality: "unknown" as ImageQuality, url: "" }];
		expect(getImageByQuality(images, "high")).toBeNull();
	});

	it("falls back to first image when no URL found", () => {
		const images = [makeImage("150x150", "url_low")];
		expect(getImageByQuality(images, "high")).toBe("url_low");
	});

	it("returns null when all images have empty URLs", () => {
		const images = [makeImage("150x150", ""), makeImage("500x500", "")];
		expect(getImageByQuality(images, "low")).toBeNull();
	});
});

describe("getImageUrl", () => {
	it("returns fallback for undefined images", () => {
		expect(getImageUrl(undefined)).toBe(
			"https://placehold.co/500x500.webp?text=No+Image",
		);
	});

	it("returns fallback for empty array", () => {
		expect(getImageUrl([])).toBe(
			"https://placehold.co/500x500.webp?text=No+Image",
		);
	});

	it("returns custom fallback", () => {
		expect(getImageUrl([], "https://custom.com/fallback.jpg")).toBe(
			"https://custom.com/fallback.jpg",
		);
	});

	it("prefers high quality image", () => {
		const images = [
			makeImage("150x150", "url_low"),
			makeImage("500x500", "url_high"),
		];
		expect(getImageUrl(images)).toBe("url_high");
	});

	it("falls back to first image when no high quality", () => {
		const images = [
			{ quality: "unknown" as ImageQuality, url: "url_first" },
			{ quality: "unknown" as ImageQuality, url: "url_last" },
		];
		expect(getImageUrl(images)).toBe("url_first");
	});

	it("falls back to first image for single item", () => {
		const images = [{ quality: "unknown" as ImageQuality, url: "url_only" }];
		expect(getImageUrl(images)).toBe("url_only");
	});

	it("falls back to default when image has empty URL", () => {
		const images = [{ quality: "unknown" as ImageQuality, url: "" }];
		expect(getImageUrl(images)).toBe(
			"https://placehold.co/500x500.webp?text=No+Image",
		);
	});
});

describe("detailedSongToSong", () => {
	it("converts detailed song to song", () => {
		const detailed = makeDetailedSong();
		const result = detailedSongToSong(detailed);
		expect(result.id).toBe("song1");
		expect(result.title).toBe("Test Song");
		expect(result.album).toBe("Test Album");
		expect(result.url).toBe("https://example.com/song");
		expect(result.type).toBe("song");
		expect(result.language).toBe("hindi");
	});

	it("maps primary artists to description", () => {
		const detailed = makeDetailedSong({
			artists: {
				primary: [
					{
						id: "a1",
						name: "Artist One",
						role: "singer",
						type: "artist",
						image: [],
						url: "",
					},
					{
						id: "a2",
						name: "Artist Two",
						role: "singer",
						type: "artist",
						image: [],
						url: "",
					},
				],
				featured: [],
				all: [],
			},
		});
		const result = detailedSongToSong(detailed);
		expect(result.description).toBe("Artist One, Artist Two");
		expect(result.primaryArtists).toBe("Artist One, Artist Two");
	});

	it("maps all artists to singers", () => {
		const detailed = makeDetailedSong({
			artists: {
				primary: [],
				featured: [],
				all: [
					{
						id: "a1",
						name: "Singer One",
						role: "singer",
						type: "artist",
						image: [],
						url: "",
					},
				],
			},
		});
		const result = detailedSongToSong(detailed);
		expect(result.singers).toBe("Singer One");
	});

	it("handles empty album name", () => {
		const detailed = makeDetailedSong({
			album: { id: null, name: "", url: null },
		});
		const result = detailedSongToSong(detailed);
		expect(result.album).toBe("");
	});

	it("handles empty artists", () => {
		const detailed = makeDetailedSong({
			artists: { primary: [], featured: [], all: [] },
		});
		const result = detailedSongToSong(detailed);
		expect(result.description).toBe("");
		expect(result.primaryArtists).toBe("");
		expect(result.singers).toBe("");
	});
});

describe("songToDetailedSong", () => {
	it("converts song to detailed song", () => {
		const song = makeSong();
		const result = songToDetailedSong(song);
		expect(result.id).toBe("song1");
		expect(result.name).toBe("Test Song");
		expect(result.type).toBe("song");
		expect(result.language).toBe("hindi");
		expect(result.url).toBe("https://example.com/song");
	});

	it("sets defaults for missing fields", () => {
		const song = {
			id: "song1",
			title: "Test",
			image: [],
			album: "",
			url: "",
			type: "song",
			description: "",
			primaryArtists: "",
			singers: "",
			language: "",
		};
		const result = songToDetailedSong(song);
		expect(result.year).toBeNull();
		expect(result.releaseDate).toBeNull();
		expect(result.duration).toBeNull();
		expect(result.label).toBeNull();
		expect(result.explicitContent).toBe(false);
		expect(result.playCount).toBeNull();
		expect(result.hasLyrics).toBe(false);
		expect(result.lyricsId).toBeNull();
		expect(result.copyright).toBeNull();
		expect(result.album).toEqual({ id: null, name: "", url: null });
		expect(result.artists).toEqual({ primary: [], featured: [], all: [] });
		expect(result.image).toEqual([]);
		expect(result.downloadUrl).toEqual([]);
	});

	it("defaults type to 'song' when not provided", () => {
		const song = makeSong({ type: undefined as unknown as string });
		const result = songToDetailedSong(song);
		expect(result.type).toBe("song");
	});
});
