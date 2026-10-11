import { logger } from './logger';

export interface RetryOptions {
  attempts?: number;
  delayMs?: number;
  /** Multiplier applied to the delay after each failed attempt (exponential backoff). */
  backoff?: number;
  shouldRetry?: (error: unknown) => boolean;
  label?: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Retries an async operation with exponential backoff.
 * Use ONLY around non-assertion, idempotent operations (HTTP calls, setup, cleanup).
 * Never wrap business assertions: that hides real defects.
 */
export async function retry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const { attempts = 3, delayMs = 500, backoff = 2, shouldRetry = () => true, label = 'operation' } = options;
  let lastError: unknown;
  let delay = delayMs;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === attempts || !shouldRetry(error)) break;
      logger.warn(`${label} failed (attempt ${attempt}/${attempts}): ${(error as Error).message}. Retrying in ${delay}ms`);
      await sleep(delay);
      delay *= backoff;
    }
  }
  throw lastError;
}
