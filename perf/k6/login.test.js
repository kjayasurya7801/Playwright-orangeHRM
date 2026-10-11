import { sleep } from 'k6';
import { Trend } from 'k6/metrics';
import { PROFILE, PROFILES } from './lib/config.js';
import { login } from './lib/auth.js';
import { buildSummary } from './lib/report.js';

const loginDuration = new Trend('login_duration', true);

export const options = {
  scenarios: {
    login: { executor: 'ramping-vus', startVUs: 1, stages: PROFILES[PROFILE], gracefulRampDown: '5s' },
  },
  thresholds: {
    http_req_failed: ['rate<0.02'],                                   // <2% transport/HTTP errors
    checks: ['rate>0.98'],                                            // >98% functional checks pass
    login_duration: ['p(95)<3000', 'avg<1500'],                       // login submit latency (ms)
    'http_req_duration{name:login_page}': ['p(95)<2000'],
  },
};

export default function () {
  login(loginDuration);
  sleep(1);
}

export function handleSummary(data) {
  return buildSummary('login', data);
}
