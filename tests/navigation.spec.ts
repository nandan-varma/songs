import { test, expect } from "@playwright/test";

test("should load home page and display navigation", async ({ page }) => {
	await page.goto("/");

	// Check page title
	await expect(page).toHaveTitle(/Music App/);

	// Check navigation elements
	await expect(page.locator("nav")).toBeVisible();
	await expect(page.getByRole("link", { name: "Music App" })).toBeVisible();
	await expect(page.getByText("Downloads")).toBeVisible();
});

test("should navigate to downloads page", async ({ page }) => {
	await page.goto("/");

	// Click downloads link
	await page.getByText("Downloads").click();

	// Verify URL
	await expect(page).toHaveURL("/downloads");

	// Check page content
	await expect(page.locator("h1")).toContainText("Offline Music");
});
