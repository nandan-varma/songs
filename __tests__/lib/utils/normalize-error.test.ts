import { describe, expect, it } from "vitest";
import {
	getErrorCode,
	getErrorMessage,
	isApiError,
	isNetworkError,
	normalizeError,
	safeJsonParse,
	safeJsonStringify,
} from "@/lib/utils/normalize-error";

describe("normalizeError", () => {
	it("returns Error instance unchanged", () => {
		const err = new Error("test");
		expect(normalizeError(err)).toBe(err);
	});

	it("converts string to Error", () => {
		const result = normalizeError("something broke");
		expect(result).toBeInstanceOf(Error);
		expect(result.message).toBe("something broke");
	});

	it("converts null to Error with default message", () => {
		const result = normalizeError(null);
		expect(result.message).toBe("Unknown error occurred");
	});

	it("converts undefined to Error with default message", () => {
		const result = normalizeError(undefined);
		expect(result.message).toBe("Unknown error occurred");
	});

	it("extracts message from object with message property", () => {
		const result = normalizeError({ message: "custom error" });
		expect(result.message).toBe("custom error");
	});

	it("stringifies object without message property", () => {
		const result = normalizeError({ foo: "bar" });
		expect(result.message).toBe('{"foo":"bar"}');
	});

	it("converts number to Error", () => {
		const result = normalizeError(42);
		expect(result.message).toBe("42");
	});

	it("converts boolean to Error", () => {
		const result = normalizeError(false);
		expect(result.message).toBe("false");
	});
});

describe("getErrorMessage", () => {
	it("extracts message from Error", () => {
		expect(getErrorMessage(new Error("test"))).toBe("test");
	});

	it("returns string as-is", () => {
		expect(getErrorMessage("error text")).toBe("error text");
	});

	it("returns default for null", () => {
		expect(getErrorMessage(null)).toBe("Unknown error");
	});

	it("returns default for undefined", () => {
		expect(getErrorMessage(undefined)).toBe("Unknown error");
	});

	it("extracts message from object with message property", () => {
		expect(getErrorMessage({ message: "obj error" })).toBe("obj error");
	});

	it("stringifies object without message property", () => {
		expect(getErrorMessage({ code: 500 })).toBe('{"code":500}');
	});

	it("converts number to string", () => {
		expect(getErrorMessage(404)).toBe("404");
	});
});

describe("getErrorCode", () => {
	it("extracts code from Error with code property", () => {
		const err = new Error("test") as Error & { code: string };
		err.code = "ENOENT";
		expect(getErrorCode(err)).toBe("ENOENT");
	});

	it("extracts code from plain object", () => {
		expect(getErrorCode({ code: "ERR_TIMEOUT" })).toBe("ERR_TIMEOUT");
	});

	it("converts numeric code to string", () => {
		expect(getErrorCode({ code: 500 })).toBe("500");
	});

	it("returns undefined for Error without code", () => {
		expect(getErrorCode(new Error("test"))).toBeUndefined();
	});

	it("returns undefined for object without code", () => {
		expect(getErrorCode({ message: "no code" })).toBeUndefined();
	});

	it("returns undefined for string", () => {
		expect(getErrorCode("error")).toBeUndefined();
	});

	it("returns undefined for null", () => {
		expect(getErrorCode(null)).toBeUndefined();
	});
});

describe("isApiError", () => {
	it("returns true for object with status", () => {
		expect(isApiError({ status: 404 })).toBe(true);
	});

	it("returns true for object with statusCode", () => {
		expect(isApiError({ statusCode: 500 })).toBe(true);
	});

	it("returns true for object with code", () => {
		expect(isApiError({ code: "ERR" })).toBe(true);
	});

	it("returns false for object without API properties", () => {
		expect(isApiError({ message: "error" })).toBe(false);
	});

	it("returns false for string", () => {
		expect(isApiError("error")).toBe(false);
	});

	it("returns false for null", () => {
		expect(isApiError(null)).toBe(false);
	});

	it("returns false for undefined", () => {
		expect(isApiError(undefined)).toBe(false);
	});
});

describe("isNetworkError", () => {
	it("detects 'network' keyword", () => {
		expect(isNetworkError(new Error("Network failure"))).toBe(true);
	});

	it("detects 'fetch' keyword", () => {
		expect(isNetworkError(new Error("Fetch failed"))).toBe(true);
	});

	it("detects 'timeout' keyword", () => {
		expect(isNetworkError(new Error("Request timeout"))).toBe(true);
	});

	it("detects 'connection' keyword", () => {
		expect(isNetworkError(new Error("Connection refused"))).toBe(true);
	});

	it("is case-insensitive", () => {
		expect(isNetworkError(new Error("NETWORK ERROR"))).toBe(true);
		expect(isNetworkError(new Error("Fetch Error"))).toBe(true);
	});

	it("returns false for non-network errors", () => {
		expect(isNetworkError(new Error("File not found"))).toBe(false);
		expect(isNetworkError(new Error("Validation failed"))).toBe(false);
	});

	it("returns false for null", () => {
		expect(isNetworkError(null)).toBe(false);
	});

	it("returns false for string without network keywords", () => {
		expect(isNetworkError("some error")).toBe(false);
	});
});

describe("safeJsonParse", () => {
	it("parses valid JSON", () => {
		expect(safeJsonParse('{"a":1}', {})).toEqual({ a: 1 });
	});

	it("parses JSON array", () => {
		expect(safeJsonParse("[1,2,3]", [])).toEqual([1, 2, 3]);
	});

	it("parses JSON string", () => {
		expect(safeJsonParse('"hello"', "")).toBe("hello");
	});

	it("parses JSON number", () => {
		expect(safeJsonParse("42", 0)).toBe(42);
	});

	it("returns fallback for invalid JSON", () => {
		expect(safeJsonParse("{invalid}", { fallback: true })).toEqual({
			fallback: true,
		});
	});

	it("returns fallback for empty string", () => {
		expect(safeJsonParse("", "default")).toBe("default");
	});
});

describe("safeJsonStringify", () => {
	it("stringifies valid object", () => {
		expect(safeJsonStringify({ a: 1 })).toBe('{"a":1}');
	});

	it("stringifies array", () => {
		expect(safeJsonStringify([1, 2, 3])).toBe("[1,2,3]");
	});

	it("stringifies null", () => {
		expect(safeJsonStringify(null)).toBe("null");
	});

	it("returns fallback for circular reference", () => {
		const obj: Record<string, unknown> = {};
		obj.self = obj;
		expect(safeJsonStringify(obj, "circular")).toBe("circular");
	});

	it("returns empty string fallback by default", () => {
		const obj: Record<string, unknown> = {};
		obj.self = obj;
		expect(safeJsonStringify(obj)).toBe("");
	});

	it("returns custom fallback", () => {
		const obj: Record<string, unknown> = {};
		obj.self = obj;
		expect(safeJsonStringify(obj, "error")).toBe("error");
	});
});
