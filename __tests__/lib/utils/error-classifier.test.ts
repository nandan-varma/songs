import { describe, expect, it } from "vitest";
import {
	classifyError,
	ErrorCategory,
	getUserErrorMessage,
	isErrorRetryable,
	shouldShowError,
} from "@/lib/utils/error-classifier";

describe("classifyError", () => {
	describe("TypeError network errors", () => {
		it("classifies 'Failed to fetch' as NETWORK", () => {
			const err = new TypeError("Failed to fetch");
			const result = classifyError(err);
			expect(result.category).toBe(ErrorCategory.NETWORK);
			expect(result.isRetryable).toBe(true);
			expect(result.userMessage).toContain("Network connection failed");
		});

		it("classifies 'network error' as NETWORK", () => {
			const err = new TypeError("network error occurred");
			const result = classifyError(err);
			expect(result.category).toBe(ErrorCategory.NETWORK);
		});

		it("classifies 'fetch failed' as NETWORK", () => {
			const err = new TypeError("fetch failed");
			const result = classifyError(err);
			expect(result.category).toBe(ErrorCategory.NETWORK);
		});

		it("does not classify TypeError without network keywords as NETWORK", () => {
			const err = new TypeError("some other error");
			const result = classifyError(err);
			expect(result.category).not.toBe(ErrorCategory.NETWORK);
		});
	});

	describe("Response errors", () => {
		it("classifies 401 as AUTH", () => {
			const response = new Response("", {
				status: 401,
				statusText: "Unauthorized",
			});
			const result = classifyError(response);
			expect(result.category).toBe(ErrorCategory.AUTH);
			expect(result.isRetryable).toBe(false);
			expect(result.userMessage).toContain("log in again");
		});

		it("classifies 403 as AUTH", () => {
			const response = new Response("", {
				status: 403,
				statusText: "Forbidden",
			});
			const result = classifyError(response);
			expect(result.category).toBe(ErrorCategory.AUTH);
		});

		it("classifies 400 as VALIDATION", () => {
			const response = new Response("", {
				status: 400,
				statusText: "Bad Request",
			});
			const result = classifyError(response);
			expect(result.category).toBe(ErrorCategory.VALIDATION);
			expect(result.isRetryable).toBe(false);
		});

		it("classifies 500 as SERVER", () => {
			const response = new Response("", {
				status: 500,
				statusText: "Internal Server Error",
			});
			const result = classifyError(response);
			expect(result.category).toBe(ErrorCategory.SERVER);
			expect(result.isRetryable).toBe(true);
		});

		it("classifies 503 as SERVER", () => {
			const response = new Response("", {
				status: 503,
				statusText: "Service Unavailable",
			});
			const result = classifyError(response);
			expect(result.category).toBe(ErrorCategory.SERVER);
		});

		it("classifies 404 as CLIENT", () => {
			const response = new Response("", {
				status: 404,
				statusText: "Not Found",
			});
			const result = classifyError(response);
			expect(result.category).toBe(ErrorCategory.CLIENT);
			expect(result.isRetryable).toBe(false);
		});

		it("classifies 429 as CLIENT", () => {
			const response = new Response("", {
				status: 429,
				statusText: "Too Many Requests",
			});
			const result = classifyError(response);
			expect(result.category).toBe(ErrorCategory.CLIENT);
		});
	});

	describe("Error object keyword matching", () => {
		it("classifies audio errors", () => {
			const err = new Error("audio playback failed");
			const result = classifyError(err);
			expect(result.category).toBe(ErrorCategory.AUDIO);
			expect(result.isRetryable).toBe(true);
			expect(result.userMessage).toContain("Failed to play audio");
		});

		it("classifies media errors", () => {
			const err = new Error("media element error");
			const result = classifyError(err);
			expect(result.category).toBe(ErrorCategory.AUDIO);
		});

		it("classifies storage errors", () => {
			const err = new Error("indexeddb transaction failed");
			const result = classifyError(err);
			expect(result.category).toBe(ErrorCategory.STORAGE);
			expect(result.isRetryable).toBe(false);
		});

		it("classifies quota exceeded as STORAGE", () => {
			const err = new Error("quota exceeded limit");
			const result = classifyError(err);
			expect(result.category).toBe(ErrorCategory.STORAGE);
		});

		it("classifies unauthorized errors as AUTH", () => {
			const err = new Error("unauthorized access");
			const result = classifyError(err);
			expect(result.category).toBe(ErrorCategory.AUTH);
			expect(result.isRetryable).toBe(false);
		});

		it("classifies unauthenticated errors as AUTH", () => {
			const err = new Error("unauthenticated request");
			const result = classifyError(err);
			expect(result.category).toBe(ErrorCategory.AUTH);
		});

		it("classifies validation errors", () => {
			const err = new Error("validation failed for field");
			const result = classifyError(err);
			expect(result.category).toBe(ErrorCategory.VALIDATION);
			expect(result.isRetryable).toBe(false);
		});

		it("classifies invalid data errors", () => {
			const err = new Error("invalid input provided");
			const result = classifyError(err);
			expect(result.category).toBe(ErrorCategory.VALIDATION);
		});

		it("classifies unknown errors as UNKNOWN", () => {
			const err = new Error("something went wrong");
			const result = classifyError(err);
			expect(result.category).toBe(ErrorCategory.UNKNOWN);
			expect(result.isDeveloper).toBe(true);
			expect(result.isRetryable).toBe(true);
			expect(result.userMessage).toBeUndefined();
		});
	});

	describe("non-Error values", () => {
		it("classifies null as UNKNOWN", () => {
			const result = classifyError(null);
			expect(result.category).toBe(ErrorCategory.UNKNOWN);
			expect(result.message).toBe("null");
		});

		it("classifies undefined as UNKNOWN", () => {
			const result = classifyError(undefined);
			expect(result.category).toBe(ErrorCategory.UNKNOWN);
			expect(result.message).toBe("undefined");
		});

		it("classifies string as UNKNOWN", () => {
			const result = classifyError("oops");
			expect(result.category).toBe(ErrorCategory.UNKNOWN);
			expect(result.message).toBe("oops");
		});

		it("classifies number as UNKNOWN", () => {
			const result = classifyError(42);
			expect(result.category).toBe(ErrorCategory.UNKNOWN);
			expect(result.message).toBe("42");
		});

		it("classifies plain object as UNKNOWN", () => {
			const result = classifyError({ foo: "bar" });
			expect(result.category).toBe(ErrorCategory.UNKNOWN);
		});
	});
});

describe("getUserErrorMessage", () => {
	it("returns user message for classified errors", () => {
		const err = new TypeError("Failed to fetch");
		expect(getUserErrorMessage(err)).toContain("Network connection failed");
	});

	it("returns default message for UNKNOWN errors", () => {
		const err = new Error("something went wrong");
		expect(getUserErrorMessage(err)).toBe(
			"An unexpected error occurred. Please try again.",
		);
	});

	it("returns default message for null", () => {
		expect(getUserErrorMessage(null)).toBe(
			"An unexpected error occurred. Please try again.",
		);
	});
});

describe("shouldShowError", () => {
	it("returns true for AUTH", () => {
		expect(shouldShowError(ErrorCategory.AUTH)).toBe(true);
	});

	it("returns true for AUDIO", () => {
		expect(shouldShowError(ErrorCategory.AUDIO)).toBe(true);
	});

	it("returns true for NETWORK", () => {
		expect(shouldShowError(ErrorCategory.NETWORK)).toBe(true);
	});

	it("returns true for VALIDATION", () => {
		expect(shouldShowError(ErrorCategory.VALIDATION)).toBe(true);
	});

	it("returns false for SERVER", () => {
		expect(shouldShowError(ErrorCategory.SERVER)).toBe(false);
	});

	it("returns false for CLIENT", () => {
		expect(shouldShowError(ErrorCategory.CLIENT)).toBe(false);
	});

	it("returns false for STORAGE", () => {
		expect(shouldShowError(ErrorCategory.STORAGE)).toBe(false);
	});

	it("returns false for UNKNOWN", () => {
		expect(shouldShowError(ErrorCategory.UNKNOWN)).toBe(false);
	});
});

describe("isErrorRetryable", () => {
	it("returns true for network errors", () => {
		expect(isErrorRetryable(new TypeError("Failed to fetch"))).toBe(true);
	});

	it("returns true for server errors", () => {
		const response = new Response("", { status: 500 });
		expect(isErrorRetryable(response)).toBe(true);
	});

	it("returns true for audio errors", () => {
		expect(isErrorRetryable(new Error("audio playback failed"))).toBe(true);
	});

	it("returns true for unknown errors", () => {
		expect(isErrorRetryable(new Error("something went wrong"))).toBe(true);
	});

	it("returns false for auth errors", () => {
		const response = new Response("", { status: 401 });
		expect(isErrorRetryable(response)).toBe(false);
	});

	it("returns false for validation errors", () => {
		const response = new Response("", { status: 400 });
		expect(isErrorRetryable(response)).toBe(false);
	});

	it("returns false for client errors", () => {
		const response = new Response("", { status: 404 });
		expect(isErrorRetryable(response)).toBe(false);
	});

	it("returns false for storage errors", () => {
		expect(isErrorRetryable(new Error("indexeddb failed"))).toBe(false);
	});

	it("returns false for null", () => {
		expect(isErrorRetryable(null)).toBe(false);
	});
});
