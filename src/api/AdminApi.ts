import { APIRequestContext, APIResponse } from '@playwright/test';
import { buildCredentials } from '../data/dataFactory';
import { ROLE_IDS } from '../data/roles';
import { expectOk, send } from './ApiClient';

const USERS = '/web/index.php/api/v2/admin/users';

export interface CreatedUser {
  id: number;
  username: string;
  password: string;
}

export class AdminApi {
  constructor(private readonly request: APIRequestContext) {}

  /** Creates a login (ESS role) for an existing employee. */
  async createEssUser(empNumber: number): Promise<CreatedUser> {
    const { username, password } = buildCredentials();
    const res = await send(this.request, 'POST', USERS, {
      data: { username, password, status: true, userRoleId: ROLE_IDS.ESS, empNumber },
    });
    const body = await expectOk(res, 'create ESS user');
    return { id: body.data.id as number, username, password };
  }

  deleteUsers(ids: number[]): Promise<APIResponse> {
    return send(this.request, 'DELETE', USERS, { data: { ids } });
  }
}
