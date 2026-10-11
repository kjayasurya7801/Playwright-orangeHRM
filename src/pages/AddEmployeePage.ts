import { expect, Page } from '@playwright/test';
import { EmployeeData } from '../data/dataFactory';
import { actAndWaitForResponse } from '../utils/waits';
import { BasePage } from './BasePage';

export class AddEmployeePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.open('/web/index.php/pim/addEmployee');
    await expect(this.page.getByRole('heading', { name: 'Add Employee' })).toBeVisible();
  }

  async createEmployee(emp: EmployeeData): Promise<number> {
    await this.page.getByPlaceholder('First Name').fill(emp.firstName);
    await this.page.getByPlaceholder('Middle Name').fill(emp.middleName);
    await this.page.getByPlaceholder('Last Name').fill(emp.lastName);
    await this.inputByLabel('Employee Id').fill(emp.employeeId);

    // Durable signal #1: the create call succeeded and tells us the new empNumber.
    const response = await actAndWaitForResponse(
      this.page,
      { url: /\/api\/v2\/pim\/employees$/, method: 'POST' },
      () => this.page.getByRole('button', { name: 'Save' }).click(),
    );
    expect(response.ok(), `create employee -> HTTP ${response.status()}`).toBeTruthy();
    const empNumber: number = (await response.json()).data.empNumber;

    // Durable signal #2: we landed on the new employee's page showing their name.
    await this.page.waitForURL(new RegExp(`viewPersonalDetails/empNumber/${empNumber}`));
    await expect(this.page.locator('input[name="firstName"]')).toHaveValue(emp.firstName);
    return empNumber;
  }
}