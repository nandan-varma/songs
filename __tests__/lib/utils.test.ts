import type { DetailedSong } from "../../lib/types";
import { cn, detailedSongToSong } from "../../lib/utils";

describe("cn", () => {
	it("merges class names correctly", () => {
		expect(cn("class1", "class2")).toBe("class1 class2");
	});

	it("handles conditional classes", () => {
		expect(cn("class1", true && "class2", false && "class3")).toBe(
			"class1 class2",
		);
	});

	it("handles undefined and null values", () => {
		expect(cn("class1", undefined, null, "class2")).toBe("class1 class2");
	});

	it("handles arrays of classes", () => {
		expect(cn("class1", ["class2", "class3"])).toBe("class1 class2 class3");
	});

	it("handles objects with boolean values", () => {
		expect(cn("class1", { class2: true, class3: false })).toBe("class1 class2");
	});

	it("handles empty inputs", () => {
		expect(cn()).toBe("");
		expect(cn("")).toBe("");
	});

	it("handles Tailwind responsive classes", () => {
		expect(cn("md:flex", "lg:block")).toBe("md:flex lg:block");
	});

	it("does not deduplicate classes by default", () => {
		expect(cn("class1", "class1", "class2")).toBe("class1 class1 class2");
	});
});

describe("detailedSongToSong", () => {
	const mockDetailedSong = {
		id: "1",
		name: "Test Song",
		type: "song" as const,
		year: "2023",
		releaseDate: null,
		duration: 180,
		label: null,
		explicitContent: false,
		playCount: null,
		language: "english",
		hasLyrics: false,
		lyricsId: null,
		url: "song-url",
		copyright: null,
		artists: {
			primary: [
				{
					id: "a1",
					name: "Test Artist",
					role: "primary" as const,
					type: "artist" as const,
					image: [],
					url: "artist-url",
				},
			],
			featured: [],
			all: [
				{
					id: "a1",
					name: "Test Artist",
					role: "primary" as const,
					type: "artist" as const,
					image: [],
					url: "artist-url",
				},
			],
		},
		album: { id: "al1", name: "Test Album", url: "album-url" },
		image: [{ quality: "500x500", url: "cover.jpg" }],
		downloadUrl: [{ quality: "160kbps", url: "audio.mp3" }],
	};

	it("converts detailed song to song format", () => {
		const result = detailedSongToSong(mockDetailedSong);

		expect(result).toEqual({
			id: "1",
			title: "Test Song",
			image: [{ quality: "500x500", url: "cover.jpg" }],
			album: "Test Album",
			url: "song-url",
			type: "song",
			description: "Test Artist",
			singers: "Test Artist",
			primaryArtists: "Test Artist",
			language: "english",
		});
	});

	it("handles optional language field", () => {
		const songWithoutLanguage = {
			...mockDetailedSong,
			language: undefined,
		} as unknown as DetailedSong;
		const result = detailedSongToSong(songWithoutLanguage);
		expect(result.language).toBeUndefined();
	});
});
