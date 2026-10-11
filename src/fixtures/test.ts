import { APIRequestContext, test as base } from '@playwright/test';
import { env } from '../../config/env';
import { AdminApi } from '../api/AdminApi';
import { AuthApi } from '../api/AuthApi';
import { EmployeeApi } from '../api/EmployeeApi';
import { AddEmployeePage } from '../pages/AddEmployeePage';
import { DashboardPage } from '../pages/DashboardPage';
import { EmployeeDetailsPage } from '../pages/EmployeeDetailsPage';
import { LoginPage } from '../pages/LoginPage';
import { PimPage } from '../pages/PimPage';
import { logger } from '../utils/logger';

/** Records everything a test creates so teardown can delete it, even when the test fails. */
export interface CleanupTracker {
  employees: number[];
  users: number[];
}

interface ApiFixtures {
  employeeApi: EmployeeApi;
  adminApi: AdminApi;
  tracker: CleanupTracker;
}
interface ApiWorkerFixtures {
  apiSession: APIRequestContext;
}

/** Fixtures for API-only specs: no browser is started. */
export const apiTest = base.extend<ApiFixtures, ApiWorkerFixtures>({
  // One authenticated API session per worker (cheap, and keeps login out of every test).
  apiSession: [
    async ({ playwright }, use) => {
      const ctx = await playwright.request.newContext({ baseURL: env.baseURL });
      await AuthApi.login(ctx, env.adminUser, env.adminPassword);
      await use(ctx);
      await ctx.dispose();
    },
    { scope: 'worker' },
  ],

  employeeApi: async ({ apiSession }, use) => use(new EmployeeApi(apiSession)),
  adminApi: async ({ apiSession }, use) => use(new AdminApi(apiSession)),

  tracker: async ({ employeeApi, adminApi }, use) => {
    const tracker: CleanupTracker = { employees: [], users: [] };
    await use(tracker);
    // Teardown runs on pass AND fail. Users must go before their employees.
    try {
      if (tracker.users.length) await adminApi.deleteUsers(tracker.users);
      if (tracker.employees.length) await employeeApi.delete(tracker.employees);
    } catch (e) {
      logger.warn(`Cleanup failed (non-fatal): ${(e as Error).message}`);
    }
  },
});

interface UiFixtures {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  pimPage: PimPage;
  addEmployeePage: AddEmployeePage;
  employeeDetailsPage: EmployeeDetailsPage;
  failureEvidence: void;
}

/** UI specs get everything from apiTest plus page objects and automatic failure evidence. */
export const test = apiTest.extend<UiFixtures>({
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  dashboardPage: async ({ page }, use) => use(new DashboardPage(page)),
  pimPage: async ({ page }, use) => use(new PimPage(page)),
  addEmployeePage: async ({ page }, use) => use(new AddEmployeePage(page)),
  employeeDetailsPage: async ({ page }, use) => use(new EmployeeDetailsPage(page)),

  // Auto fixture: on failure attach a full-page screenshot, URL and JS errors to the report.
  failureEvidence: [
    async ({ page }, use, testInfo) => {
      const pageErrors: string[] = [];
      page.on('pageerror', (e) => pageErrors.push(e.message));
      await use();
      if (testInfo.status !== testInfo.expectedStatus) {
        try {
          await testInfo.attach('failure-fullpage.png', {
            body: await page.screenshot({ fullPage: true }),
            contentType: 'image/png',
          });
          await testInfo.attach('failure-context.txt', {
            body: `URL: ${page.url()}\nPage errors:\n${pageErrors.join('\n') || 'none'}`,
            contentType: 'text/plain',
          });
        } catch {
          /* page may already be closed */
        }
      }
    },
    { auto: true },
  ],
});

export { expect } from '@playwright/test';
