import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	clearStorage,
	getStorageInfo,
	getStorageItem,
	hasStorageSpace,
	isStorageAvailable,
	removeStorageItem,
	setStorageItem,
} from "@/lib/utils/storage";

const localStorageMock = (() => {
	let store: Record<string, string> = {};
	return {
		getItem: vi.fn((key: string) => store[key] ?? null),
		setItem: vi.fn((key: string, value: string) => {
			store[key] = value;
		}),
		removeItem: vi.fn((key: string) => {
			delete store[key];
		}),
		key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
		get length() {
			return Object.keys(store).length;
		},
		clear: vi.fn(() => {
			store = {};
		}),
	};
})();

vi.stubGlobal("localStorage", localStorageMock);

vi.mock("@/lib/utils/logger", () => ({
	logError: vi.fn(),
}));

describe("storage", () => {
	beforeEach(() => {
		localStorageMock.clear();
		vi.clearAllMocks();
	});

	describe("getStorageItem", () => {
		it("returns stored value", () => {
			localStorageMock.setItem("songs:test", JSON.stringify({ foo: "bar" }));
			const result = getStorageItem("test", {});
			expect(result).toEqual({ foo: "bar" });
		});

		it("returns fallback when key not found", () => {
			const fallback = { default: true };
			const result = getStorageItem("nonexistent", fallback);
			expect(result).toEqual(fallback);
		});

		it("returns fallback on error", () => {
			localStorageMock.getItem.mockImplementationOnce(() => {
				throw new Error("Storage error");
			});
			const result = getStorageItem("test", "fallback");
			expect(result).toBe("fallback");
		});
	});

	describe("setStorageItem", () => {
		it("stores value as JSON", () => {
			const result = setStorageItem("test", { foo: "bar" });
			expect(result).toBe(true);
			expect(localStorageMock.setItem).toHaveBeenCalledWith(
				"songs:test",
				'{"foo":"bar"}',
			);
		});

		it("returns false on error", () => {
			localStorageMock.setItem.mockImplementationOnce(() => {
				throw new Error("Storage error");
			});
			const result = setStorageItem("test", "value");
			expect(result).toBe(false);
		});
	});

	describe("removeStorageItem", () => {
		it("removes item", () => {
			localStorageMock.setItem("songs:test", "value");
			const result = removeStorageItem("test");
			expect(result).toBe(true);
			expect(localStorageMock.removeItem).toHaveBeenCalledWith("songs:test");
		});

		it("returns false on error", () => {
			localStorageMock.removeItem.mockImplementationOnce(() => {
				throw new Error("Storage error");
			});
			const result = removeStorageItem("test");
			expect(result).toBe(false);
		});
	});

	describe("clearStorage", () => {
		it("clears only namespaced items", () => {
			localStorageMock.setItem("songs:key1", "value1");
			localStorageMock.setItem("songs:key2", "value2");
			localStorageMock.setItem("other:key", "value");
			const count = clearStorage();
			expect(count).toBe(2);
		});

		it("returns 0 when no items", () => {
			const count = clearStorage();
			expect(count).toBe(0);
		});

		it("handles errors gracefully", () => {
			localStorageMock.key.mockImplementationOnce(() => {
				throw new Error("Error");
			});
			const count = clearStorage();
			expect(count).toBe(0);
		});
	});

	describe("isStorageAvailable", () => {
		it("returns true when storage works", () => {
			expect(isStorageAvailable()).toBe(true);
		});

		it("returns false when storage throws", () => {
			localStorageMock.setItem.mockImplementationOnce(() => {
				throw new Error("Quota exceeded");
			});
			expect(isStorageAvailable()).toBe(false);
		});
	});

	describe("getStorageInfo", () => {
		it("returns storage info when available", async () => {
			vi.stubGlobal("navigator", {
				storage: {
					estimate: vi.fn().mockResolvedValue({ usage: 1000, quota: 1000000 }),
				},
			});
			const result = await getStorageInfo();
			expect(result).toEqual({ usage: 1000, quota: 1000000 });
			vi.unstubAllGlobals();
		});

		it("returns undefined when not available", async () => {
			vi.stubGlobal("navigator", {});
			const result = await getStorageInfo();
			expect(result).toBeUndefined();
			vi.unstubAllGlobals();
		});
	});

	describe("hasStorageSpace", () => {
		it("returns true when space available", async () => {
			vi.stubGlobal("navigator", {
				storage: {
					estimate: vi.fn().mockResolvedValue({ usage: 1000, quota: 1000000 }),
				},
			});
			const result = await hasStorageSpace(1000);
			expect(result).toBe(true);
			vi.unstubAllGlobals();
		});

		it("returns false when over quota", async () => {
			vi.stubGlobal("navigator", {
				storage: {
					estimate: vi
						.fn()
						.mockResolvedValue({ usage: 999999, quota: 1000000 }),
				},
			});
			const result = await hasStorageSpace(10000);
			expect(result).toBe(false);
			vi.unstubAllGlobals();
		});

		it("returns true when estimate fails", async () => {
			vi.stubGlobal("navigator", {
				storage: {
					estimate: vi.fn().mockRejectedValue(new Error("Error")),
				},
			});
			const result = await hasStorageSpace();
			expect(result).toBe(true);
			vi.unstubAllGlobals();
		});
	});
});
