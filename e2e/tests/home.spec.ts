import { test, expect } from "@playwright/test";

test.describe("Home Page", () => {
  test("should load home page successfully", async ({ page }) => {
    await page.goto("/");

    // Just verify page loads without error
    await expect(page).toHaveURL("/");
  });

  test("should have a title", async ({ page }) => {
    await page.goto("/");

    // Check if page has some title
    const title = await page.title();
    expect(title).toBeTruthy();
  });
});
