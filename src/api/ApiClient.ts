import { APIRequestContext, APIResponse, expect } from '@playwright/test';
import { retry } from '../utils/retry';

class RetryableHttpError extends Error {
  constructor(public status: number, url: string) {
    super(`Retryable HTTP ${status} from ${url}`);
  }
}

type FetchOptions = Parameters<APIRequestContext['fetch']>[1];

/**
 * Thin wrapper adding retry on transient failures (network errors, 429, 5xx).
 * 4xx are returned as-is so negative tests can assert on them.
 */
export async function send(
  request: APIRequestContext,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  url: string,
  options: FetchOptions = {},
): Promise<APIResponse> {
  return retry(
    async () => {
      const res = await request.fetch(url, { ...options, method });
      if (res.status() >= 500 || res.status() === 429) throw new RetryableHttpError(res.status(), url);
      return res;
    },
    { attempts: 3, delayMs: 500, label: `${method} ${url}` },
  );
}

export async function expectOk(res: APIResponse, context: string): Promise<any> {
  const body = await res.text();
  expect(res.ok(), `${context} -> HTTP ${res.status()}: ${body.slice(0, 300)}`).toBeTruthy();
  return JSON.parse(body);
}
