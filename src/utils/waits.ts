import { expect, Page, Response } from '@playwright/test';

/**
 * Perform an action and wait for the network response it triggers.
 * Registers the listener BEFORE acting, which removes the classic
 * "response arrived before I started waiting" race.
 */
export async function actAndWaitForResponse(
  page: Page,
  match: { url: RegExp; method?: string },
  action: () => Promise<unknown>,
): Promise<Response> {
  const [response] = await Promise.all([
    page.waitForResponse(
      (r) => match.url.test(r.url()) && (!match.method || r.request().method() === match.method),
    ),
    action(),
  ]);
  return response;
}

/** Wait until OrangeHRM's loading spinners / form loaders are gone. */
export async function waitForLoaders(page: Page): Promise<void> {
  await expect(page.locator('.oxd-loading-spinner, .oxd-form-loader')).toHaveCount(0);
}

/**
 * Poll a value until it satisfies a predicate (for eventually-consistent data).
 * Uses expect.poll so timeouts/intervals integrate with Playwright reporting.
 */
export async function pollUntil<T>(
  producer: () => Promise<T>,
  predicate: (value: T) => boolean,
  message: string,
  timeout = 15_000,
): Promise<void> {
  await expect
    .poll(async () => predicate(await producer()), { message, timeout, intervals: [500, 1000, 2000] })
    .toBe(true);
}
