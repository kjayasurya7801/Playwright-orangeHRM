import { expect, Locator, Page } from '@playwright/test';
import { ROLE_POLICIES, RoleName } from '../data/roles';
import { BasePage } from './BasePage';

export class DashboardPage extends BasePage {
  readonly heading: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Dashboard' });
  }

  sideMenuItem(name: string): Locator {
    return this.page.locator('.oxd-main-menu').getByRole('link', { name, exact: true });
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/dashboard\/index/);
    await expect(this.heading).toBeVisible();
  }

  /** Role-based validation driven by the shared ROLE_POLICIES table. */
  async expectRoleMenus(role: RoleName): Promise<void> {
    const policy = ROLE_POLICIES[role];
    for (const item of policy.visible) await expect(this.sideMenuItem(item), `${role} sees ${item}`).toBeVisible();
    for (const item of policy.hidden) await expect(this.sideMenuItem(item), `${role} must not see ${item}`).toHaveCount(0);
  }

  async logout(): Promise<void> {
    await this.page.locator('.oxd-userdropdown-tab').click();
    await this.page.getByRole('menuitem', { name: 'Logout' }).click();
    await expect(this.page).toHaveURL(/auth\/login/);
  }
}
