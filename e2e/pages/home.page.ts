import { Page, Locator } from '@playwright/test'
import { BasePage } from './base.page'

export class HomePage extends BasePage {
  readonly url = '/'

  // Page elements
  get heroTitle(): Locator {
    return this.page.locator('[data-testid=hero-title]')
  }

  get heroSubtitle(): Locator {
    return this.page.locator('[data-testid=hero-subtitle]')
  }

  get ctaButton(): Locator {
    return this.page.locator('[data-testid=cta-button]')
  }

  get navigation(): Locator {
    return this.page.locator('[data-testid=main-navigation]')
  }

  get footer(): Locator {
    return this.page.locator('[data-testid=footer]')
  }

  // Actions
  async goto(): Promise<void> {
    await this.page.goto(this.url)
    await this.waitForPageLoad()
  }

  async clickCTA(): Promise<void> {
    await this.ctaButton.click()
  }

  async navigateToCards(): Promise<void> {
    await this.page.click('[data-testid=nav-cards]')
  }
}