import { describe, expect, it, vi } from "vitest";
import {
	createErrorHandler,
	getAudioErrorMessage,
	handleAudioError,
	isAudioErrorRecoverable,
	MEDIA_ERROR_MESSAGES,
	MediaErrorCode,
	safeAudioOperation,
} from "@/lib/utils/audio-error";

vi.mock("@/lib/utils/logger", () => ({
	logError: vi.fn(),
}));

function makeMediaError(code: number): MediaError {
	const err = {
		code,
		message: `Media error code ${code}`,
	} as unknown as MediaError;
	return err;
}

describe("MediaErrorCode", () => {
	it("has correct code values", () => {
		expect(MediaErrorCode.MEDIA_ERR_ABORTED).toBe(1);
		expect(MediaErrorCode.MEDIA_ERR_NETWORK).toBe(2);
		expect(MediaErrorCode.MEDIA_ERR_DECODE).toBe(3);
		expect(MediaErrorCode.MEDIA_ERR_SRC_NOT_SUPPORTED).toBe(4);
	});
});

describe("MEDIA_ERROR_MESSAGES", () => {
	it("has messages for all error codes", () => {
		expect(MEDIA_ERROR_MESSAGES[MediaErrorCode.MEDIA_ERR_ABORTED]).toBe(
			"Playback was aborted",
		);
		expect(MEDIA_ERROR_MESSAGES[MediaErrorCode.MEDIA_ERR_NETWORK]).toBe(
			"Network error occurred",
		);
		expect(MEDIA_ERROR_MESSAGES[MediaErrorCode.MEDIA_ERR_DECODE]).toBe(
			"Audio decode error",
		);
		expect(
			MEDIA_ERROR_MESSAGES[MediaErrorCode.MEDIA_ERR_SRC_NOT_SUPPORTED],
		).toBe("Audio format not supported");
	});
});

describe("getAudioErrorMessage", () => {
	it("returns message for MediaError with known code", () => {
		const err = makeMediaError(MediaErrorCode.MEDIA_ERR_NETWORK);
		expect(getAudioErrorMessage(err)).toBe("Network error occurred");
	});

	it("returns message for MediaError with unknown code", () => {
		const err = makeMediaError(99);
		expect(getAudioErrorMessage(err)).toBe("Media error code 99");
	});

	it("returns message for regular Error", () => {
		const err = new Error("custom audio error");
		expect(getAudioErrorMessage(err)).toBe("custom audio error");
	});

	it("returns default for null", () => {
		expect(getAudioErrorMessage(null)).toBe("Unknown audio error");
	});

	it("returns Error message over MediaError message when both present", () => {
		const err = new Error("error message");
		expect(getAudioErrorMessage(err)).toBe("error message");
	});
});

describe("isAudioErrorRecoverable", () => {
	it("returns true for null error", () => {
		expect(isAudioErrorRecoverable(null)).toBe(true);
	});

	it("returns true for MEDIA_ERR_NETWORK", () => {
		const err = makeMediaError(MediaErrorCode.MEDIA_ERR_NETWORK);
		expect(isAudioErrorRecoverable(err)).toBe(true);
	});

	it("returns false for MEDIA_ERR_ABORTED", () => {
		const err = makeMediaError(MediaErrorCode.MEDIA_ERR_ABORTED);
		expect(isAudioErrorRecoverable(err)).toBe(false);
	});

	it("returns false for MEDIA_ERR_DECODE", () => {
		const err = makeMediaError(MediaErrorCode.MEDIA_ERR_DECODE);
		expect(isAudioErrorRecoverable(err)).toBe(false);
	});

	it("returns false for MEDIA_ERR_SRC_NOT_SUPPORTED", () => {
		const err = makeMediaError(MediaErrorCode.MEDIA_ERR_SRC_NOT_SUPPORTED);
		expect(isAudioErrorRecoverable(err)).toBe(false);
	});

	it("returns true for regular Error", () => {
		const err = new Error("some error");
		expect(isAudioErrorRecoverable(err)).toBe(true);
	});
});

describe("handleAudioError", () => {
	it("calls onRetry when error is recoverable", () => {
		const onRetry = vi.fn();
		const onFail = vi.fn();
		const err = makeMediaError(MediaErrorCode.MEDIA_ERR_NETWORK);
		handleAudioError(err, onRetry, onFail);
		expect(onRetry).toHaveBeenCalledTimes(1);
		expect(onFail).not.toHaveBeenCalled();
	});

	it("calls onFail when error is not recoverable", () => {
		const onRetry = vi.fn();
		const onFail = vi.fn();
		const err = makeMediaError(MediaErrorCode.MEDIA_ERR_DECODE);
		handleAudioError(err, onRetry, onFail);
		expect(onRetry).not.toHaveBeenCalled();
		expect(onFail).toHaveBeenCalledTimes(1);
	});

	it("calls onRetry when error is null", () => {
		const onRetry = vi.fn();
		const onFail = vi.fn();
		handleAudioError(null, onRetry, onFail);
		expect(onRetry).toHaveBeenCalledTimes(1);
		expect(onFail).not.toHaveBeenCalled();
	});
});

describe("createErrorHandler", () => {
	it("returns a function that logs with context", () => {
		const handler = createErrorHandler("TestContext");
		expect(typeof handler).toBe("function");
	});
});

describe("safeAudioOperation", () => {
	it("returns result on success", () => {
		const result = safeAudioOperation(() => 42, "test");
		expect(result).toBe(42);
	});

	it("returns undefined on error", () => {
		const result = safeAudioOperation(() => {
			throw new Error("fail");
		}, "test");
		expect(result).toBeUndefined();
	});

	it("handles non-Error throws", () => {
		const result = safeAudioOperation(() => {
			throw "string error";
		}, "test");
		expect(result).toBeUndefined();
	});

	it("returns object result on success", () => {
		const obj = { foo: "bar" };
		const result = safeAudioOperation(() => obj, "test");
		expect(result).toBe(obj);
	});
});
