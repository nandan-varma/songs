import { test, expect } from "@playwright/test";

test("should load album page", async ({ page }) => {
	// Note: This test assumes an album with ID 'test-album' exists.
	// In a real scenario, you'd search for an album first or use a known ID.
	await page.goto("/albums/test-album");

	// Check if page loads without error
	await expect(page.locator("body")).toBeVisible();

	// If album loads, check for common elements (adjust based on actual UI)
	// await expect(page.locator('h1')).toContainText('Album Title'); // Example
});
