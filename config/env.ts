import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

export type EnvName = 'demo' | 'staging';

interface EnvConfig {
  baseURL: string;
  adminUser: string;
  adminPassword: string;
}

/**
 * Environment presets. Anything can be overridden with env vars so CI secrets
 * never need to live in the repo (the public demo creds are, by design, public).
 */
const PRESETS: Record<EnvName, EnvConfig> = {
  demo: {
    baseURL: 'https://opensource-demo.orangehrmlive.com',
    adminUser: 'Admin',
    adminPassword: 'admin123',
  },
  staging: {
    baseURL: process.env.STAGING_URL ?? '',
    adminUser: process.env.STAGING_ADMIN_USER ?? '',
    adminPassword: process.env.STAGING_ADMIN_PASSWORD ?? '',
  },
};

const name = (process.env.TEST_ENV ?? 'demo').toLowerCase() as EnvName;
if (!(name in PRESETS)) {
  throw new Error(`Unknown TEST_ENV "${name}". Valid: ${Object.keys(PRESETS).join(', ')}`);
}
const preset = PRESETS[name];

export const env = {
  name,
  baseURL: process.env.BASE_URL ?? preset.baseURL,
  adminUser: process.env.ADMIN_USERNAME ?? preset.adminUser,
  adminPassword: process.env.ADMIN_PASSWORD ?? preset.adminPassword,
} as const;

if (!env.baseURL || !env.adminUser || !env.adminPassword) {
  throw new Error(`Environment "${env.name}" is missing baseURL/credentials. See .env.example`);
}
