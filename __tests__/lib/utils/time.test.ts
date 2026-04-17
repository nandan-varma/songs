import { describe, expect, it } from "vitest";
import {
	calculateProgress,
	clampTime,
	formatDuration,
	formatTime,
	percentToVolume,
	progressToTime,
	volumeToPercent,
} from "@/lib/utils/time";

describe("formatTime", () => {
	it("formats zero seconds correctly", () => {
		expect(formatTime(0)).toBe("0:00");
	});

	it("formats whole seconds correctly", () => {
		expect(formatTime(65)).toBe("1:05");
		expect(formatTime(120)).toBe("2:00");
		expect(formatTime(3661)).toBe("61:01");
	});

	it("truncates fractional seconds", () => {
		expect(formatTime(59.9)).toBe("0:59");
		expect(formatTime(60.999)).toBe("1:00");
	});

	it("formats negative seconds", () => {
		expect(formatTime(-5)).toBe("-1:-5");
	});

	it("handles NaN", () => {
		expect(formatTime(NaN)).toBe("0:00");
	});

	it("handles Infinity", () => {
		expect(formatTime(Infinity)).toBe("0:00");
		expect(formatTime(-Infinity)).toBe("0:00");
	});
});

describe("formatDuration", () => {
	it("returns 0:00 for zero", () => {
		expect(formatDuration(0)).toBe("0:00");
	});

	it("returns 0:00 for NaN", () => {
		expect(formatDuration(NaN)).toBe("0:00");
	});

	it("returns 0:00 for Infinity", () => {
		expect(formatDuration(Infinity)).toBe("0:00");
		expect(formatDuration(-Infinity)).toBe("0:00");
	});

	it("formats valid durations", () => {
		expect(formatDuration(180)).toBe("3:00");
		expect(formatDuration(245.5)).toBe("4:05");
	});
});

describe("percentToVolume", () => {
	it("converts 0% to 0", () => {
		expect(percentToVolume(0)).toBe(0);
	});

	it("converts 100% to 1", () => {
		expect(percentToVolume(100)).toBe(1);
	});

	it("converts 50% to 0.5", () => {
		expect(percentToVolume(50)).toBe(0.5);
	});

	it("clamps negative percentages to 0", () => {
		expect(percentToVolume(-10)).toBe(0);
		expect(percentToVolume(-100)).toBe(0);
	});

	it("clamps percentages over 100 to 1", () => {
		expect(percentToVolume(150)).toBe(1);
		expect(percentToVolume(200)).toBe(1);
	});
});

describe("volumeToPercent", () => {
	it("converts 0 to 0%", () => {
		expect(volumeToPercent(0)).toBe(0);
	});

	it("converts 1 to 100%", () => {
		expect(volumeToPercent(1)).toBe(100);
	});

	it("converts 0.5 to 50%", () => {
		expect(volumeToPercent(0.5)).toBe(50);
	});

	it("rounds to nearest integer", () => {
		expect(volumeToPercent(0.333)).toBe(33);
		expect(volumeToPercent(0.667)).toBe(67);
	});

	it("handles values outside 0-1 range", () => {
		expect(volumeToPercent(1.5)).toBe(150);
		expect(volumeToPercent(-0.5)).toBe(-50);
	});
});

describe("percentToVolume and volumeToPercent round-trip", () => {
	it("round-trips common values", () => {
		expect(volumeToPercent(percentToVolume(0))).toBe(0);
		expect(volumeToPercent(percentToVolume(25))).toBe(25);
		expect(volumeToPercent(percentToVolume(50))).toBe(50);
		expect(volumeToPercent(percentToVolume(75))).toBe(75);
		expect(volumeToPercent(percentToVolume(100))).toBe(100);
	});
});

describe("clampTime", () => {
	it("clamps negative time to 0", () => {
		expect(clampTime(-5, 100)).toBe(0);
	});

	it("clamps time over duration to duration", () => {
		expect(clampTime(150, 100)).toBe(100);
	});

	it("returns time when within range", () => {
		expect(clampTime(50, 100)).toBe(50);
	});

	it("returns time when duration is zero", () => {
		expect(clampTime(50, 0)).toBe(50);
	});

	it("returns time when duration is NaN", () => {
		expect(clampTime(50, NaN)).toBe(50);
	});

	it("returns time when duration is Infinity", () => {
		expect(clampTime(50, Infinity)).toBe(50);
	});
});

describe("calculateProgress", () => {
	it("calculates 0% progress", () => {
		expect(calculateProgress(0, 100)).toBe(0);
	});

	it("calculates 50% progress", () => {
		expect(calculateProgress(50, 100)).toBe(50);
	});

	it("calculates 100% progress", () => {
		expect(calculateProgress(100, 100)).toBe(100);
	});

	it("clamps progress below 0 to 0", () => {
		expect(calculateProgress(-10, 100)).toBe(0);
	});

	it("clamps progress above 100 to 100", () => {
		expect(calculateProgress(150, 100)).toBe(100);
	});

	it("returns 0 when duration is zero", () => {
		expect(calculateProgress(50, 0)).toBe(0);
	});

	it("returns 0 when duration is NaN", () => {
		expect(calculateProgress(50, NaN)).toBe(0);
	});

	it("returns 0 when duration is Infinity", () => {
		expect(calculateProgress(50, Infinity)).toBe(0);
	});
});

describe("progressToTime", () => {
	it("converts 0% progress to 0 seconds", () => {
		expect(progressToTime(0, 100)).toBe(0);
	});

	it("converts 50% progress to half duration", () => {
		expect(progressToTime(50, 100)).toBe(50);
	});

	it("converts 100% progress to full duration", () => {
		expect(progressToTime(100, 100)).toBe(100);
	});

	it("clamps progress below 0 to 0", () => {
		expect(progressToTime(-10, 100)).toBe(0);
	});

	it("clamps progress above 100 to duration", () => {
		expect(progressToTime(150, 100)).toBe(100);
	});

	it("returns 0 when duration is zero", () => {
		expect(progressToTime(50, 0)).toBe(0);
	});

	it("returns 0 when duration is NaN", () => {
		expect(progressToTime(50, NaN)).toBe(0);
	});

	it("returns 0 when duration is Infinity", () => {
		expect(progressToTime(50, Infinity)).toBe(0);
	});
});

describe("calculateProgress and progressToTime round-trip", () => {
	it("round-trips common values", () => {
		const duration = 200;
		const times = [0, 50, 100, 150, 200];
		for (const time of times) {
			const progress = calculateProgress(time, duration);
			const roundTripped = progressToTime(progress, duration);
			expect(roundTripped).toBe(time);
		}
	});
});
