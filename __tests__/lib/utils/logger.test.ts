import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { debug, logError, logInfo, logWarning } from "@/lib/utils/logger";

describe("logger", () => {
	let consoleSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
	});

	afterEach(() => {
		consoleSpy.mockRestore();
	});

	describe("in development mode", () => {
		it("logError calls console.error", () => {
			logError("TestContext", new Error("test error"));
			expect(consoleSpy).toHaveBeenCalled();
		});

		it("logError formats with context", () => {
			logError("TestContext", new Error("test error"));
			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining("[TestContext]"),
				expect.any(Error),
			);
		});
	});

	describe("logWarning", () => {
		let warnSpy: ReturnType<typeof vi.spyOn>;

		beforeEach(() => {
			warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
		});

		afterEach(() => {
			warnSpy.mockRestore();
		});

		it("calls console.warn in development", () => {
			logWarning("TestContext", "test message");
			expect(warnSpy).toHaveBeenCalled();
		});
	});

	describe("logInfo", () => {
		let logSpy: ReturnType<typeof vi.spyOn>;

		beforeEach(() => {
			logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
		});

		afterEach(() => {
			logSpy.mockRestore();
		});

		it("calls console.log in development", () => {
			logInfo("TestContext", "test message");
			expect(logSpy).toHaveBeenCalled();
		});
	});

	describe("debug", () => {
		let debugSpy: ReturnType<typeof vi.spyOn>;

		beforeEach(() => {
			debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
		});

		afterEach(() => {
			debugSpy.mockRestore();
		});

		it("calls console.debug in development", () => {
			debug("TestContext", "arg1", "arg2");
			expect(debugSpy).toHaveBeenCalled();
		});

		it("passes multiple arguments", () => {
			debug("TestContext", "arg1", { key: "value" });
			expect(debugSpy).toHaveBeenCalledWith(
				expect.stringContaining("[TestContext]"),
				"arg1",
				{ key: "value" },
			);
		});
	});
});
