import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  readonly username: Locator;
  readonly password: Locator;
  readonly submit: Locator;

  constructor(page: Page) {
    super(page);
    this.username = page.getByPlaceholder('Username');
    this.password = page.getByPlaceholder('Password');
    this.submit = page.getByRole('button', { name: 'Login' });
  }

  async goto(): Promise<void> {
    await this.open('/web/index.php/auth/login');
    await expect(this.submit).toBeVisible();
  }

  async login(user: string, pass: string): Promise<void> {
    await this.username.fill(user);
    await this.password.fill(pass);
    await this.submit.click();
  }

  async expectInvalidCredentials(): Promise<void> {
    await expect(this.page.getByText('Invalid credentials')).toBeVisible();
    await expect(this.page).toHaveURL(/auth\/login/);
  }

  async expectRequiredErrors(count: number): Promise<void> {
    await expect(this.page.getByText('Required')).toHaveCount(count);
  }
}
