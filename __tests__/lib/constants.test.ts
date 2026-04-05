import { describe, expect, it } from "vitest";
import { feature_flags, isValidRoute, VALID_ROUTES } from "@/lib/constants";

describe("VALID_ROUTES", () => {
	it("contains expected routes", () => {
		expect(VALID_ROUTES).toContain("/");
		expect(VALID_ROUTES).toContain("/library");
		expect(VALID_ROUTES).toContain("/downloads");
		expect(VALID_ROUTES).toContain("/favorites");
	});
});

describe("isValidRoute", () => {
	it("returns true for valid routes", () => {
		expect(isValidRoute("/")).toBe(true);
		expect(isValidRoute("/library")).toBe(true);
		expect(isValidRoute("/downloads")).toBe(true);
		expect(isValidRoute("/favorites")).toBe(true);
	});

	it("returns false for invalid routes", () => {
		expect(isValidRoute("/invalid")).toBe(false);
		expect(isValidRoute("/foo")).toBe(false);
		expect(isValidRoute("/library/foo")).toBe(false);
	});

	it("returns false for non-strings", () => {
		expect(isValidRoute(null)).toBe(false);
		expect(isValidRoute(undefined)).toBe(false);
		expect(isValidRoute(123)).toBe(false);
		expect(isValidRoute({})).toBe(false);
		expect(isValidRoute([])).toBe(false);
	});

	it("returns false for empty string", () => {
		expect(isValidRoute("")).toBe(false);
	});
});

describe("feature_flags", () => {
	it("has expected structure", () => {
		expect(feature_flags).toHaveProperty("Artist_page_singles_enabled");
	});

	it("has expected default values", () => {
		expect(feature_flags.Artist_page_singles_enabled).toBe(false);
	});
});
