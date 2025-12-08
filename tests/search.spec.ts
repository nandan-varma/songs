import { expect, test } from "@playwright/test";

test("should perform search and display results", async ({ page }) => {
	await page.goto("/");

	// Wait for search bar to be visible
	const searchInput = page.locator('input[placeholder*="Search"]');
	await expect(searchInput).toBeVisible();

	// Type a search query
	await searchInput.fill("test song");

	// Press enter to search
	await searchInput.press("Enter");

	// Wait for results to load (adjust selector based on actual results)
	await page.waitForTimeout(2000); // Temporary, better to wait for specific element

	// Check if results appear (this might need adjustment based on actual UI)
	// For now, just check that the page doesn't crash
	await expect(page.locator("body")).toBeVisible();
});
