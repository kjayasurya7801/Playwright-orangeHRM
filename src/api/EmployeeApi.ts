import { APIRequestContext, APIResponse } from '@playwright/test';
import { EmployeeData } from '../data/dataFactory';
import { expectOk, send } from './ApiClient';

const BASE = '/web/index.php/api/v2/pim/employees';

export class EmployeeApi {
  constructor(private readonly request: APIRequestContext) {}

  /** Raw create (for negative tests). */
  createRaw(payload: Record<string, unknown>): Promise<APIResponse> {
    return send(this.request, 'POST', BASE, { data: payload });
  }

  async create(emp: EmployeeData): Promise<number> {
    const res = await this.createRaw({ ...emp, empPicture: null });
    const body = await expectOk(res, 'create employee');
    return body.data.empNumber as number;
  }

  async getPersonalDetails(empNumber: number): Promise<any> {
    const res = await send(this.request, 'GET', `${BASE}/${empNumber}/personal-details`);
    return (await expectOk(res, `get personal details ${empNumber}`)).data;
  }

  /** Search by name or employee id. Returns the matching list. */
  async search(nameOrId: string): Promise<any[]> {
    const res = await send(this.request, 'GET', BASE, {
      params: {
        limit: 50,
        offset: 0,
        model: 'detailed',
        nameOrId,
        includeEmployees: 'onlyCurrent',
        sortField: 'employee.firstName',
        sortOrder: 'ASC',
      },
    });
    return (await expectOk(res, `search employees "${nameOrId}"`)).data;
  }

  async delete(empNumbers: number[]): Promise<APIResponse> {
    return send(this.request, 'DELETE', BASE, { data: { ids: empNumbers } });
  }
}
