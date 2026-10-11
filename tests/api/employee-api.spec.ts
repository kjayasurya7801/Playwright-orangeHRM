import { request as pwRequest } from '@playwright/test';
import { env } from '../../config/env';
import { buildEmployee } from '../../src/data/dataFactory';
import { apiTest as test, expect } from '../../src/fixtures/test';

test.describe('Employee API', () => {
  test('create -> read -> search -> delete round trip', { tag: ['@api', '@smoke', '@regression'] }, async ({
    employeeApi,
    tracker,
  }) => {
    const emp = buildEmployee();
    const empNumber = await employeeApi.create(emp);
    tracker.employees.push(empNumber);

    const details = await employeeApi.getPersonalDetails(empNumber);
    expect(details).toMatchObject({ firstName: emp.firstName, lastName: emp.lastName, employeeId: emp.employeeId });

    expect((await employeeApi.search(emp.employeeId)).map((e) => e.empNumber)).toContain(empNumber);

    const del = await employeeApi.delete([empNumber]);
    expect(del.ok()).toBeTruthy();
    tracker.employees.length = 0;
    expect(await employeeApi.search(emp.employeeId)).toHaveLength(0);
  });

  test('rejects an employee without a last name', { tag: ['@api', '@regression'] }, async ({ employeeApi }) => {
    const res = await employeeApi.createRaw({ firstName: 'NoLast', middleName: '', lastName: '', empPicture: null });
    expect([400, 422]).toContain(res.status());
  });

  test('rejects a duplicate employee id', { tag: ['@api', '@regression'] }, async ({ employeeApi, tracker }) => {
    const emp = buildEmployee();
    tracker.employees.push(await employeeApi.create(emp));
    const dup = await employeeApi.createRaw({ ...buildEmployee({ employeeId: emp.employeeId }), empPicture: null });
    expect([400, 422]).toContain(dup.status());
  });

  test('unauthenticated requests are refused', { tag: ['@api', '@rbac', '@regression'] }, async () => {
    const anon = await pwRequest.newContext({ baseURL: env.baseURL });
    try {
      const res = await anon.get('/web/index.php/api/v2/pim/employees');
      expect(res.status()).toBe(401);
    } finally {
      await anon.dispose();
    }
  });
});
