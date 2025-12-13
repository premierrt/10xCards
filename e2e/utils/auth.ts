import { Page, expect } from '@playwright/test'

export class AuthUtils {
  constructor(private page: Page) {}

  async login(email: string = 'test@example.com', password: string = 'testpassword123') {
    await this.page.goto('/auth/signin')
    await this.page.fill('[data-testid=email-input]', email)
    await this.page.fill('[data-testid=password-input]', password)
    await this.page.click('[data-testid=signin-button]')
    
    // Wait for successful login redirect
    await expect(this.page).toHaveURL(/\/dashboard|\//)
  }

  async logout() {
    await this.page.click('[data-testid=user-menu]')
    await this.page.click('[data-testid=logout-button]')
    
    // Wait for logout redirect
    await expect(this.page).toHaveURL(/\/auth\/signin|\//)
  }

  async isLoggedIn(): Promise<boolean> {
    try {
      await this.page.waitForSelector('[data-testid=user-menu]', { timeout: 2000 })
      return true
    } catch {
      return false
    }
  }
}