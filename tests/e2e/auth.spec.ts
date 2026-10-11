import { env } from '../../config/env';
import { expect, test } from '../../src/fixtures/test';

// These tests exercise the login screen itself, so start from a logged-out state.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Authentication', () => {
  test('valid credentials land on the dashboard and can log out', { tag: ['@smoke', '@auth', '@regression'] }, async ({
    loginPage,
    dashboardPage,
  }) => {
    await loginPage.goto();
    await loginPage.login(env.adminUser, env.adminPassword);
    await dashboardPage.expectLoaded();
    await dashboardPage.logout();
  });

  test('invalid credentials are rejected', { tag: ['@auth', '@regression'] }, async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login(env.adminUser, 'definitely-wrong');
    await loginPage.expectInvalidCredentials();
  });

  test('empty form shows required-field validation', { tag: ['@auth', '@regression'] }, async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.submit.click();
    await loginPage.expectRequiredErrors(2);
  });

  test('protected pages redirect anonymous users to login', { tag: ['@auth', '@regression'] }, async ({ page }) => {
    await page.goto('/web/index.php/pim/viewEmployeeList');
    await expect(page).toHaveURL(/auth\/login/);
  });
});
