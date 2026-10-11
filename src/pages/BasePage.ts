import { expect, Locator, Page } from '@playwright/test';
import { retry } from '../utils/retry';
import { waitForLoaders } from '../utils/waits';

export abstract class BasePage {
  constructor(protected readonly page: Page) { }

  protected async open(path: string): Promise<void> {
    // Navigation is idempotent, so retrying it is safe and absorbs slow/throttled responses.
    await retry(
      () => this.page.goto(path, { waitUntil: 'domcontentloaded', timeout: 45_000 }),
      { attempts: 3, delayMs: 2_000, label: `goto ${path}` },
    );
    await this.waitForLoaders();
  }

  async waitForLoaders(): Promise<void> {
    await waitForLoaders(this.page);
  }

  get toast(): Locator {
    return this.page.locator('.oxd-toast');
  }

  async expectToast(text: RegExp | string): Promise<void> {
    await expect(this.toast.first()).toContainText(text);
  }

  /** OrangeHRM renders inputs inside .oxd-input-group with a <label>; locate by label text. */
  protected inputByLabel(label: string): Locator {
    return this.page.locator('.oxd-input-group').filter({ hasText: label }).locator('input').first();
  }
}
