import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL, USERNAME, PASSWORD } from './config.js';

/**
 * Performs the real OrangeHRM login handshake (CSRF token + form POST).
 * Returns true on success. Tags requests with stable names so metrics
 * aren't split per-URL.
 */
export function login(trend) {
  http.cookieJar().clear(BASE_URL);

  const page = http.get(`${BASE_URL}/web/index.php/auth/login`, { tags: { name: 'login_page' } });
  const m = page.body && page.body.match(/:token="&quot;([^&]+)&quot;"/);
  if (!check(page, { 'login page 200': (r) => r.status === 200 }) || !m) return false;

  const res = http.post(
    `${BASE_URL}/web/index.php/auth/validate`,
    { _token: m[1], username: USERNAME, password: PASSWORD },
    { tags: { name: 'login_submit' } },
  );
  if (trend) trend.add(res.timings.duration);

  return check(res, {
    'login lands on dashboard': (r) => r.status === 200 && r.url.indexOf('/auth/login') === -1,
  });
}
