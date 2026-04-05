import { describe, expect, it } from "vitest";
import {
	clampPlaybackSpeed,
	clampVolume,
	createPlaylistId,
	dedupeByEntity,
	dedupeById,
	dedupeStrings,
	moveItem,
	shuffleQueue,
} from "@/lib/store/internal";
import type { DetailedSong } from "@/types/entity";

function makeSong(id: string): DetailedSong {
	return { id, name: `Song ${id}`, type: "song" } as unknown as DetailedSong;
}

describe("clampVolume", () => {
	it("returns volume within range", () => {
		expect(clampVolume(0.5)).toBe(0.5);
	});

	it("clamps below 0 to 0", () => {
		expect(clampVolume(-0.5)).toBe(0);
		expect(clampVolume(-10)).toBe(0);
	});

	it("clamps above 1 to 1", () => {
		expect(clampVolume(1.5)).toBe(1);
		expect(clampVolume(100)).toBe(1);
	});

	it("handles boundary values", () => {
		expect(clampVolume(0)).toBe(0);
		expect(clampVolume(1)).toBe(1);
	});
});

describe("clampPlaybackSpeed", () => {
	it("returns speed within range", () => {
		expect(clampPlaybackSpeed(1)).toBe(1);
		expect(clampPlaybackSpeed(1.5)).toBe(1.5);
	});

	it("clamps below 0.25 to 0.25", () => {
		expect(clampPlaybackSpeed(0)).toBe(0.25);
		expect(clampPlaybackSpeed(-1)).toBe(0.25);
	});

	it("clamps above 2 to 2", () => {
		expect(clampPlaybackSpeed(3)).toBe(2);
		expect(clampPlaybackSpeed(10)).toBe(2);
	});

	it("handles boundary values", () => {
		expect(clampPlaybackSpeed(0.25)).toBe(0.25);
		expect(clampPlaybackSpeed(2)).toBe(2);
	});
});

describe("createPlaylistId", () => {
	it("generates ID with playlist_ prefix", () => {
		const id = createPlaylistId();
		expect(id.startsWith("playlist_")).toBe(true);
	});

	it("generates unique IDs", () => {
		const id1 = createPlaylistId();
		const id2 = createPlaylistId();
		expect(id1).not.toBe(id2);
	});
});

describe("dedupeStrings", () => {
	it("adds new item to front", () => {
		const result = dedupeStrings(["b", "c"], "a", 10);
		expect(result).toEqual(["a", "b", "c"]);
	});

	it("moves existing item to front", () => {
		const result = dedupeStrings(["a", "b", "c"], "b", 10);
		expect(result).toEqual(["b", "a", "c"]);
	});

	it("respects max size", () => {
		const result = dedupeStrings(["a", "b", "c"], "d", 3);
		expect(result).toEqual(["d", "a", "b"]);
	});

	it("handles empty array", () => {
		const result = dedupeStrings([], "a", 5);
		expect(result).toEqual(["a"]);
	});

	it("handles max size of 1", () => {
		const result = dedupeStrings(["a", "b"], "c", 1);
		expect(result).toEqual(["c"]);
	});
});

describe("dedupeById", () => {
	it("adds new item to front", () => {
		const items = [{ id: "b" }, { id: "c" }];
		const result = dedupeById(items, { id: "a" }, 10);
		expect(result.map((i) => i.id)).toEqual(["a", "b", "c"]);
	});

	it("moves existing item to front", () => {
		const items = [{ id: "a" }, { id: "b" }, { id: "c" }];
		const result = dedupeById(items, { id: "b" }, 10);
		expect(result.map((i) => i.id)).toEqual(["b", "a", "c"]);
	});

	it("respects max size", () => {
		const items = [{ id: "a" }, { id: "b" }, { id: "c" }];
		const result = dedupeById(items, { id: "d" }, 3);
		expect(result.map((i) => i.id)).toEqual(["d", "a", "b"]);
	});
});

describe("dedupeByEntity", () => {
	it("adds new item to front", () => {
		const items = [{ entityId: "b" }, { entityId: "c" }];
		const result = dedupeByEntity(items, { entityId: "a" }, 10);
		expect(result.map((i) => i.entityId)).toEqual(["a", "b", "c"]);
	});

	it("moves existing item to front", () => {
		const items = [{ entityId: "a" }, { entityId: "b" }];
		const result = dedupeByEntity(items, { entityId: "b" }, 10);
		expect(result.map((i) => i.entityId)).toEqual(["b", "a"]);
	});

	it("respects max size", () => {
		const items = [{ entityId: "a" }, { entityId: "b" }];
		const result = dedupeByEntity(items, { entityId: "c" }, 2);
		expect(result.map((i) => i.entityId)).toEqual(["c", "a"]);
	});
});

describe("moveItem", () => {
	it("moves item forward", () => {
		const result = moveItem(["a", "b", "c", "d"], 0, 2);
		expect(result).toEqual(["b", "c", "a", "d"]);
	});

	it("moves item backward", () => {
		const result = moveItem(["a", "b", "c", "d"], 3, 1);
		expect(result).toEqual(["a", "d", "b", "c"]);
	});

	it("returns unchanged array for invalid fromIndex", () => {
		const items = ["a", "b", "c"];
		const result = moveItem(items, 10, 0);
		expect(result).toBe(items);
	});

	it("handles moving to same position", () => {
		const result = moveItem(["a", "b", "c"], 1, 1);
		expect(result).toEqual(["a", "b", "c"]);
	});

	it("handles single item array", () => {
		const result = moveItem(["a"], 0, 0);
		expect(result).toEqual(["a"]);
	});

	it("handles empty array", () => {
		const result = moveItem([], 0, 0);
		expect(result).toEqual([]);
	});
});

describe("shuffleQueue", () => {
	it("returns same queue for empty array", () => {
		const result = shuffleQueue([], 0);
		expect(result.queue).toEqual([]);
		expect(result.queueIndex).toBe(0);
	});

	it("returns same queue for single item", () => {
		const songs = [makeSong("a")];
		const result = shuffleQueue(songs, 0);
		expect(result.queue).toEqual(songs);
		expect(result.queueIndex).toBe(0);
	});

	it("places current song at index 0", () => {
		const songs = [makeSong("a"), makeSong("b"), makeSong("c")];
		const result = shuffleQueue(songs, 1);
		expect(result.queue[0]?.id).toBe("b");
		expect(result.queueIndex).toBe(0);
	});

	it("includes all songs in shuffled queue", () => {
		const songs = [makeSong("a"), makeSong("b"), makeSong("c"), makeSong("d")];
		const result = shuffleQueue(songs, 0);
		const ids = result.queue.map((s) => s.id).sort();
		expect(ids).toEqual(["a", "b", "c", "d"]);
	});

	it("handles current index at end", () => {
		const songs = [makeSong("a"), makeSong("b"), makeSong("c")];
		const result = shuffleQueue(songs, 2);
		expect(result.queue[0]?.id).toBe("c");
		expect(result.queue.length).toBe(3);
	});

	it("handles current index out of bounds by duplicating first song", () => {
		const songs = [makeSong("a"), makeSong("b")];
		const result = shuffleQueue(songs, 10);
		expect(result.queue.length).toBe(3);
		expect(result.queue[0]?.id).toBe("a");
		expect(result.queueIndex).toBe(0);
	});
});
