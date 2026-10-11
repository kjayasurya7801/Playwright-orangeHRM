export interface EmployeeData {
  firstName: string;
  middleName: string;
  lastName: string;
  employeeId: string;
}

const rand = (len: number) =>
  Array.from({ length: len }, () => 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]).join('');

/** OrangeHRM employee ids are limited to 10 chars: use 8 random digits. */
const numericId = () => String(Math.floor(10_000_000 + Math.random() * 89_999_999));

/**
 * Unique-per-call data => tests never collide when run in parallel or re-run
 * against a shared environment (the public demo is shared by everyone).
 */
export function buildEmployee(overrides: Partial<EmployeeData> = {}): EmployeeData {
  return {
    firstName: `Qa${rand(5)}`,
    middleName: '',
    lastName: `Auto${rand(5)}`,
    employeeId: numericId(),
    ...overrides,
  };
}

export function buildCredentials() {
  return {
    username: `ess_${rand(6)}`,
    // satisfies OrangeHRM policy: upper, lower, digit, special, >= 7 chars
    password: `Qa@${rand(4)}Zz9!`,
  };
}
