import { expect, Locator, Page } from '@playwright/test';
import { actAndWaitForResponse } from '../utils/waits';
import { BasePage } from './BasePage';

export class EmployeeDetailsPage extends BasePage {
  readonly firstName: Locator;
  readonly middleName: Locator;
  readonly lastName: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    super(page);
    this.firstName = page.locator('input[name="firstName"]');
    this.middleName = page.locator('input[name="middleName"]');
    this.lastName = page.locator('input[name="lastName"]');
    // The first form on the page is the name / id block.
    this.saveButton = page.locator('form').first().getByRole('button', { name: 'Save' });
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/viewPersonalDetails/);
    await this.waitForLoaders();
    // Form values are hydrated asynchronously; filling before that gets overwritten (classic flake).
    await expect(this.firstName).not.toHaveValue('');
  }

  async updateName(values: { middleName?: string; lastName?: string }): Promise<void> {
    await this.expectLoaded();
    if (values.middleName !== undefined) await this.middleName.fill(values.middleName);
    if (values.lastName !== undefined) await this.lastName.fill(values.lastName);

    const response = await actAndWaitForResponse(
      this.page,
      { url: /\/personal-details/, method: 'PUT' },
      () => this.saveButton.click(),
    );
    expect(response.ok(), `personal-details PUT -> ${response.status()}`).toBeTruthy();
    await this.expectToast(/Success/i);
  }
}
