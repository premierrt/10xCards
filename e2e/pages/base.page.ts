import { Page, Locator, expect } from '@playwright/test'

export abstract class BasePage {
  readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  // Common elements that might appear on any page
  get loadingSpinner(): Locator {
    return this.page.locator('[data-testid=loading-spinner]')
  }

  get errorMessage(): Locator {
    return this.page.locator('[data-testid=error-message]')
  }

  get successMessage(): Locator {
    return this.page.locator('[data-testid=success-message]')
  }

  // Common actions
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle')
  }

  async waitForElementToBeVisible(locator: Locator): Promise<void> {
    await expect(locator).toBeVisible()
  }

  async waitForElementToBeHidden(locator: Locator): Promise<void> {
    await expect(locator).toBeHidden()
  }

  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({ 
      path: `e2e/screenshots/${name}-${Date.now()}.png`,
      fullPage: true 
    })
  }
}