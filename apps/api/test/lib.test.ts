import { describe, expect, it } from "vitest";
import { decodeEntities } from "../src/lib/html";
import { audioLinks, imageLinks } from "../src/lib/media";
import { fixture } from "./helpers";

describe("audioLinks", () => {
	it("decrypts a real JioSaavn media url into one link per bitrate", () => {
		const encrypted = (
			fixture("song-details") as {
				songs: { more_info: { encrypted_media_url: string } }[];
			}
		).songs[0]?.more_info.encrypted_media_url;

		const links = audioLinks(encrypted ?? null);

		expect(links.map((link) => link.quality)).toEqual([
			"12kbps",
			"48kbps",
			"96kbps",
			"160kbps",
			"320kbps",
		]);
		expect(links[3]?.url).toBe(
			"https://aac.saavncdn.com/665/7790c3b9097592113008eaf1031d6e57_160.mp4",
		);
		expect(links[4]?.url).toBe(
			"https://aac.saavncdn.com/665/7790c3b9097592113008eaf1031d6e57_320.mp4",
		);
	});

	it("returns nothing when there is no encrypted url", () => {
		expect(audioLinks(null)).toEqual([]);
		expect(audioLinks("")).toEqual([]);
	});
});

describe("imageLinks", () => {
	it("expands one image into three sizes over https", () => {
		expect(imageLinks("http://c.saavncdn.com/a/b-150x150.jpg")).toEqual([
			{ quality: "50x50", url: "https://c.saavncdn.com/a/b-50x50.jpg" },
			{ quality: "150x150", url: "https://c.saavncdn.com/a/b-150x150.jpg" },
			{ quality: "500x500", url: "https://c.saavncdn.com/a/b-500x500.jpg" },
		]);
		expect(imageLinks("")).toEqual([]);
	});
});

describe("decodeEntities", () => {
	it("decodes named and numeric entities and leaves unknown ones alone", () => {
		expect(decodeEntities("Vishal &amp; Shekhar")).toBe("Vishal & Shekhar");
		expect(decodeEntities("&quot;Hi&quot; &#039;there&#39; &#x27;")).toBe(
			`"Hi" 'there' '`,
		);
		expect(decodeEntities("&bogus; plain")).toBe("&bogus; plain");
	});
});
