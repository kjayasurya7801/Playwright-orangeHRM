import { test as setup } from '@playwright/test';
import { env } from '../config/env';
import { DashboardPage } from '../src/pages/DashboardPage';
import { LoginPage } from '../src/pages/LoginPage';

/** Logs in once through the UI and stores the session for the chromium project. */
setup('authenticate as admin', async ({ page }) => {
  const login = new LoginPage(page);
  await login.goto();
  await login.login(env.adminUser, env.adminPassword);
  await new DashboardPage(page).expectLoaded();
  await page.context().storageState({ path: '.auth/admin.json' });
});
