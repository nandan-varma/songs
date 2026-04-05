import { describe, expect, it } from "vitest";
import {
	AUDIO_QUALITY_ORDER,
	getAvailableQualities,
	getDownloadUrl,
	isQualityAvailable,
	selectBestDownloadUrl,
} from "@/lib/utils/download";
import type { DetailedSong, DownloadUrl } from "@/types/entity";

function makeUrl(quality: string, url: string): DownloadUrl {
	return { quality, url } as DownloadUrl;
}

describe("AUDIO_QUALITY_ORDER", () => {
	it("has qualities in descending order", () => {
		expect(AUDIO_QUALITY_ORDER[0]).toBe("320kbps");
		expect(AUDIO_QUALITY_ORDER[AUDIO_QUALITY_ORDER.length - 1]).toBe("12kbps");
	});
});

describe("selectBestDownloadUrl", () => {
	it("returns undefined for empty array", () => {
		expect(selectBestDownloadUrl([])).toBeUndefined();
	});

	it("returns undefined for undefined input", () => {
		expect(selectBestDownloadUrl(undefined)).toBeUndefined();
	});

	it("returns preferred quality when available", () => {
		const urls = [makeUrl("160kbps", "url160"), makeUrl("320kbps", "url320")];
		const result = selectBestDownloadUrl(urls, "320kbps");
		expect(result?.url).toBe("url320");
	});

	it("falls back to quality order when preferred not available", () => {
		const urls = [makeUrl("96kbps", "url96"), makeUrl("64kbps", "url64")];
		const result = selectBestDownloadUrl(urls, "320kbps");
		expect(result?.quality).toBe("96kbps");
	});

	it("returns first available when no quality matches", () => {
		const urls = [makeUrl("unknown", "url_unknown")];
		const result = selectBestDownloadUrl(urls, "320kbps");
		expect(result?.quality).toBe("unknown");
	});

	it("selects highest available from quality order", () => {
		const urls = [makeUrl("32kbps", "url32"), makeUrl("160kbps", "url160")];
		const result = selectBestDownloadUrl(urls, "320kbps");
		expect(result?.quality).toBe("160kbps");
	});

	it("uses default 320kbps when no preferred specified", () => {
		const urls = [makeUrl("320kbps", "url320"), makeUrl("160kbps", "url160")];
		const result = selectBestDownloadUrl(urls);
		expect(result?.quality).toBe("320kbps");
	});

	it("handles single item array", () => {
		const urls = [makeUrl("96kbps", "url96")];
		const result = selectBestDownloadUrl(urls, "96kbps");
		expect(result?.url).toBe("url96");
	});
});

describe("getDownloadUrl", () => {
	it("returns URL string from song", () => {
		const song = {
			downloadUrl: [makeUrl("320kbps", "https://example.com/song.mp3")],
		} as DetailedSong;
		expect(getDownloadUrl(song)).toBe("https://example.com/song.mp3");
	});

	it("returns undefined when no download URLs", () => {
		const song = { downloadUrl: [] } as unknown as DetailedSong;
		expect(getDownloadUrl(song)).toBeUndefined();
	});

	it("passes preferred quality through", () => {
		const song = {
			downloadUrl: [makeUrl("160kbps", "url160"), makeUrl("96kbps", "url96")],
		} as DetailedSong;
		expect(getDownloadUrl(song, "96kbps")).toBe("url96");
	});
});

describe("getAvailableQualities", () => {
	it("returns array of quality strings", () => {
		const urls = [makeUrl("320kbps", "url1"), makeUrl("160kbps", "url2")];
		expect(getAvailableQualities(urls)).toEqual(["320kbps", "160kbps"]);
	});

	it("returns empty array for undefined", () => {
		expect(getAvailableQualities(undefined)).toEqual([]);
	});

	it("returns empty array for empty array", () => {
		expect(getAvailableQualities([])).toEqual([]);
	});
});

describe("isQualityAvailable", () => {
	it("returns true when quality exists", () => {
		const urls = [makeUrl("320kbps", "url1"), makeUrl("160kbps", "url2")];
		expect(isQualityAvailable(urls, "320kbps")).toBe(true);
	});

	it("returns false when quality does not exist", () => {
		const urls = [makeUrl("160kbps", "url2")];
		expect(isQualityAvailable(urls, "320kbps")).toBe(false);
	});

	it("returns false for undefined", () => {
		expect(isQualityAvailable(undefined, "320kbps")).toBe(false);
	});

	it("returns false for empty array", () => {
		expect(isQualityAvailable([], "320kbps")).toBe(false);
	});
});
