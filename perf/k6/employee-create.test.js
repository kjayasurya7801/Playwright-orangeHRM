import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';
import { BASE_URL, PROFILE, PROFILES } from './lib/config.js';
import { login } from './lib/auth.js';
import { buildSummary } from './lib/report.js';

const createDuration = new Trend('employee_create_duration', true);
const JSON_HEADERS = { headers: { 'Content-Type': 'application/json' } };
const API = `${BASE_URL}/web/index.php/api/v2/pim/employees`;

export const options = {
  scenarios: {
    create: { executor: 'ramping-vus', startVUs: 1, stages: PROFILES[PROFILE], gracefulRampDown: '5s' },
  },
  thresholds: {
    http_req_failed: ['rate<0.02'],
    checks: ['rate>0.98'],
    employee_create_duration: ['p(95)<2500', 'avg<1200'],
    'http_req_duration{name:employee_delete}': ['p(95)<2500'],
  },
};

// Module-level state is per-VU in k6, so each VU logs in once and reuses its session.
let loggedIn = false;

export default function () {
  if (!loggedIn) loggedIn = login();
  if (!loggedIn) { sleep(1); return; }

  // 8-digit id; unique enough across VUs/iterations.
  const employeeId = String(10000000 + Math.floor(Math.random() * 89999999));
  const payload = JSON.stringify({
    firstName: `K6${__VU}`,
    middleName: '',
    lastName: `Perf${__ITER}`,
    empPicture: null,
    employeeId,
  });

  const res = http.post(API, payload, { ...JSON_HEADERS, tags: { name: 'employee_create' } });
  createDuration.add(res.timings.duration);

  const ok = check(res, {
    'create 200': (r) => r.status === 200,
    'create returns empNumber': (r) => { try { return !!r.json('data.empNumber'); } catch (e) { return false; } },
  });

  if (res.status === 401) loggedIn = false; // session expired: re-login next iteration

  // Always clean up what we create so the shared environment stays tidy.
  if (ok) {
    const del = http.del(API, JSON.stringify({ ids: [res.json('data.empNumber')] }), {
      ...JSON_HEADERS,
      tags: { name: 'employee_delete' },
    });
    check(del, { 'delete 200': (r) => r.status === 200 });
  }
  sleep(1);
}

export function handleSummary(data) {
  return buildSummary('employee-create', data);
}
