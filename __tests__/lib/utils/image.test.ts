import { describe, expect, it } from "vitest";
import {
	getImageQuality,
	getLargestImage,
	getSmallestImage,
	sortImagesByQuality,
} from "@/lib/utils/image";
import type { Image as ImageType } from "@/types/entity";

function makeImage(quality: string, url: string): ImageType {
	return { quality, url } as ImageType;
}

describe("getImageQuality", () => {
	it("parses standard quality string", () => {
		expect(getImageQuality(makeImage("500x500", "url"))).toBe(500);
	});

	it("parses different dimensions", () => {
		expect(getImageQuality(makeImage("1000x1000", "url"))).toBe(1000);
		expect(getImageQuality(makeImage("50x50", "url"))).toBe(50);
	});

	it("returns 0 for undefined quality", () => {
		expect(
			getImageQuality(makeImage(undefined as unknown as string, "url")),
		).toBe(0);
	});

	it("returns 0 for empty string", () => {
		expect(getImageQuality(makeImage("", "url"))).toBe(0);
	});

	it("returns 0 for non-numeric quality", () => {
		expect(getImageQuality(makeImage("high", "url"))).toBe(0);
	});
});

describe("sortImagesByQuality", () => {
	it("sorts images ascending by quality", () => {
		const images = [
			makeImage("500x500", "url500"),
			makeImage("150x150", "url150"),
			makeImage("1000x1000", "url1000"),
		];
		const sorted = sortImagesByQuality(images);
		expect(sorted[0]?.url).toBe("url150");
		expect(sorted[1]?.url).toBe("url500");
		expect(sorted[2]?.url).toBe("url1000");
	});

	it("does not mutate original array", () => {
		const images = [
			makeImage("500x500", "url500"),
			makeImage("150x150", "url150"),
		];
		const sorted = sortImagesByQuality(images);
		expect(images[0]?.url).toBe("url500");
		expect(sorted[0]?.url).not.toBe("url500");
	});

	it("handles empty array", () => {
		expect(sortImagesByQuality([])).toEqual([]);
	});

	it("handles single image", () => {
		const images = [makeImage("500x500", "url500")];
		expect(sortImagesByQuality(images)).toEqual(images);
	});
});

describe("getSmallestImage", () => {
	it("returns smallest image URL", () => {
		const images = [
			makeImage("500x500", "url500"),
			makeImage("150x150", "url150"),
			makeImage("1000x1000", "url1000"),
		];
		expect(getSmallestImage(images)).toBe("url150");
	});

	it("returns placeholder for empty array", () => {
		expect(getSmallestImage([])).toBe(
			"https://placehold.co/500x500.webp?text=Image+Not+Found",
		);
	});

	it("returns placeholder for image without URL", () => {
		const images = [makeImage("500x500", "")];
		expect(getSmallestImage(images)).toBe(
			"https://placehold.co/500x500.webp?text=Image+Not+Found",
		);
	});

	it("handles single image", () => {
		const images = [makeImage("500x500", "url500")];
		expect(getSmallestImage(images)).toBe("url500");
	});
});

describe("getLargestImage", () => {
	it("returns largest image URL", () => {
		const images = [
			makeImage("500x500", "url500"),
			makeImage("150x150", "url150"),
			makeImage("1000x1000", "url1000"),
		];
		expect(getLargestImage(images)).toBe("url1000");
	});

	it("returns placeholder for empty array", () => {
		expect(getLargestImage([])).toBe(
			"https://placehold.co/500x500.webp?text=Image+Not+Found",
		);
	});

	it("returns placeholder for image without URL", () => {
		const images = [makeImage("500x500", "")];
		expect(getLargestImage(images)).toBe(
			"https://placehold.co/500x500.webp?text=Image+Not+Found",
		);
	});

	it("handles single image", () => {
		const images = [makeImage("500x500", "url500")];
		expect(getLargestImage(images)).toBe("url500");
	});
});
