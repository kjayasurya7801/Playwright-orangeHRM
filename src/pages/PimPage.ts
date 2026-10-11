import { expect, Locator, Page } from '@playwright/test';
import { actAndWaitForResponse } from '../utils/waits';
import { BasePage } from './BasePage';

export class PimPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.open('/web/index.php/pim/viewEmployeeList');
  }

  row(employeeId: string): Locator {
    return this.page.locator('.oxd-table-card').filter({ hasText: employeeId });
  }

  async searchByEmployeeId(employeeId: string): Promise<void> {
    await this.page
      .locator('.oxd-table-filter')
      .locator('.oxd-input-group')
      .filter({ hasText: 'Employee Id' })
      .locator('input')
      .fill(employeeId);
    await actAndWaitForResponse(this.page, { url: /\/api\/v2\/pim\/employees/, method: 'GET' }, () =>
      this.page.getByRole('button', { name: 'Search' }).click(),
    );
    await this.waitForLoaders();
  }

  async expectEmployeeListed(employeeId: string): Promise<void> {
    await expect(this.row(employeeId)).toHaveCount(1);
  }

  async openEmployee(employeeId: string): Promise<void> {
    await this.row(employeeId).locator('.oxd-table-cell').nth(2).click();
  }

  async deleteEmployee(employeeId: string): Promise<void> {
    await this.row(employeeId).locator('button').filter({ has: this.page.locator('.bi-trash') }).click();
    await actAndWaitForResponse(this.page, { url: /\/api\/v2\/pim\/employees/, method: 'DELETE' }, () =>
      this.page.getByRole('button', { name: /Yes, Delete/ }).click(),
    );
    await this.expectToast(/Success/i);
  }

  async expectNoRecords(): Promise<void> {
    await expect(this.page.getByText('No Records Found').first()).toBeVisible();
  }
}
