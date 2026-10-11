import { env } from '../../config/env';
import { buildEmployee } from '../../src/data/dataFactory';
import { expect, test } from '../../src/fixtures/test';
import { LoginPage } from '../../src/pages/LoginPage';
import { DashboardPage } from '../../src/pages/DashboardPage';

// The lifecycle starts with a real UI login, so do not reuse the shared session.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Employee lifecycle', () => {
  test(
    'login -> create -> role validation -> update -> API verify -> delete',
    { tag: ['@smoke', '@regression', '@lifecycle', '@rbac'] },
    async ({
      browser,
      loginPage,
      dashboardPage,
      pimPage,
      addEmployeePage,
      employeeDetailsPage,
      employeeApi,
      adminApi,
      tracker,
    }) => {
      const emp = buildEmployee();
      const updated = { middleName: 'Updated', lastName: `${emp.lastName}Upd` };
      let empNumber = 0;
      let essUser: { id: number; username: string; password: string };

      await test.step('1. Authenticate as Admin via UI', async () => {
        await loginPage.goto();
        await loginPage.login(env.adminUser, env.adminPassword);
        await dashboardPage.expectLoaded();
        await dashboardPage.expectRoleMenus('Admin');
      });

      await test.step('2. Create employee via UI', async () => {
        await addEmployeePage.goto();
        empNumber = await addEmployeePage.createEmployee(emp);
        tracker.employees.push(empNumber); // guarantees cleanup even if a later step fails
      });

      await test.step('3. Role-based validation: ESS login has restricted access', async () => {
        essUser = await adminApi.createEssUser(empNumber);
        tracker.users.push(essUser.id);

        const essContext = await browser.newContext({ baseURL: env.baseURL });
        try {
          const essPage = await essContext.newPage();
          const essLogin = new LoginPage(essPage);
          await essLogin.goto();
          await essLogin.login(essUser.username, essUser.password);
          const essDashboard = new DashboardPage(essPage);
          await essDashboard.expectLoaded();
          await essDashboard.expectRoleMenus('ESS');

          // Server-side enforcement, not just hidden menus.
          const forbidden = await essContext.request.get('/web/index.php/api/v2/admin/users');
          expect(forbidden.ok(), 'ESS must not be able to list system users').toBeFalsy();
        } finally {
          await essContext.close();
        }

        // Remove the login now so the employee can be deleted cleanly later.
        await adminApi.deleteUsers([essUser.id]);
        tracker.users.length = 0;
      });

      await test.step('4. Update employee via UI', async () => {
        await pimPage.goto();
        await pimPage.searchByEmployeeId(emp.employeeId);
        await pimPage.expectEmployeeListed(emp.employeeId);
        await pimPage.openEmployee(emp.employeeId);
        await employeeDetailsPage.updateName(updated);
      });

      await test.step('5. API-level verification of the update', async () => {
        const details = await employeeApi.getPersonalDetails(empNumber);
        expect(details).toMatchObject({
          employeeId: emp.employeeId,
          firstName: emp.firstName,
          middleName: updated.middleName,
          lastName: updated.lastName,
        });
        const found = await employeeApi.search(emp.employeeId);
        expect(found.map((e) => e.empNumber)).toContain(empNumber);
      });

      await test.step('6. Delete employee via UI and verify removal', async () => {
        await pimPage.goto();
        await pimPage.searchByEmployeeId(emp.employeeId);
        await pimPage.deleteEmployee(emp.employeeId);
        await pimPage.searchByEmployeeId(emp.employeeId);
        await pimPage.expectNoRecords();

        // Backend agrees with the UI.
        expect(await employeeApi.search(emp.employeeId)).toHaveLength(0);
        tracker.employees.length = 0; // already gone
      });
    },
  );
});
