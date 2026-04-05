import { describe, expect, it } from "vitest";
import { type BuildInfo, formatBuildInfo } from "@/lib/deployment";

describe("formatBuildInfo", () => {
	it("formats build info with version and timestamp", () => {
		const buildInfo: BuildInfo = {
			id: "abc123",
			timestamp: 1704067200000, // 2024-01-01
			version: "1.0.0",
			git: {},
			env: "production",
		};
		const result = formatBuildInfo(buildInfo);
		expect(result).toContain("v1.0.0");
	});

	it("includes commit hash when present", () => {
		const buildInfo: BuildInfo = {
			id: "abc123",
			timestamp: 1704067200000,
			version: "1.0.0",
			git: { commit: "abc123def" },
			env: "production",
		};
		const result = formatBuildInfo(buildInfo);
		expect(result).toContain("abc123def");
	});

	it("excludes commit when not present", () => {
		const buildInfo: BuildInfo = {
			id: "abc123",
			timestamp: 1704067200000,
			version: "1.0.0",
			git: {},
			env: "production",
		};
		const result = formatBuildInfo(buildInfo);
		expect(result).not.toContain("commit");
	});

	it("handles zero timestamp", () => {
		const buildInfo: BuildInfo = {
			id: "abc123",
			timestamp: 0,
			version: "0.0.0",
			git: {},
			env: "development",
		};
		const result = formatBuildInfo(buildInfo);
		expect(result).toContain("v0.0.0");
	});
});
