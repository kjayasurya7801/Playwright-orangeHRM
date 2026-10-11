import { APIRequestContext, expect } from '@playwright/test';

/**
 * OrangeHRM 5 uses a CSRF token embedded in the login page and a form POST to /auth/validate.
 * Logging in this way gives the request context an authenticated session cookie.
 */
export class AuthApi {
  static async login(request: APIRequestContext, username: string, password: string): Promise<void> {
    const loginPage = await request.get('/web/index.php/auth/login');
    expect(loginPage.ok(), 'login page reachable').toBeTruthy();
    const html = await loginPage.text();
    const match = html.match(/:token="&quot;([^&]+)&quot;"/);
    expect(match, 'CSRF token present on login page').not.toBeNull();

    const res = await request.post('/web/index.php/auth/validate', {
      form: { _token: match![1], username, password },
    });
    expect(res.url(), 'redirected away from login after valid credentials').not.toContain('/auth/login');
  }
}
