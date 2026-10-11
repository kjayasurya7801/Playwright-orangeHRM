export const BASE_URL = __ENV.BASE_URL || 'https://opensource-demo.orangehrmlive.com';
export const USERNAME = __ENV.ADMIN_USERNAME || 'Admin';
export const PASSWORD = __ENV.ADMIN_PASSWORD || 'admin123';

// Keep load gentle by default: the public demo is a shared service.
export const PROFILE = __ENV.PROFILE || 'smoke';

export const PROFILES = {
  smoke: [
    { duration: '15s', target: 2 },
    { duration: '30s', target: 2 },
    { duration: '10s', target: 0 },
  ],
  load: [
    { duration: '30s', target: 5 },
    { duration: '1m', target: 5 },
    { duration: '15s', target: 0 },
  ],
};
