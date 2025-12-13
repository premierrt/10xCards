import { test, expect } from '@playwright/test'

test.describe('Smoke Tests', () => {
  test('application starts and serves content', async ({ page }) => {
    await page.goto('/')
    
    // Basic smoke test - just ensure the page loads
    await expect(page).toHaveURL('/')
    
    // Check that the page is not completely empty
    const body = page.locator('body')
    await expect(body).not.toBeEmpty()
  })
})