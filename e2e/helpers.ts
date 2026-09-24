// Shared e2e helpers. A first visit shows the welcome screen (the sample survey no longer loads by
// itself), so most specs start by choosing "Load sample survey" there.
import { expect, type FrameLocator, type Page } from '@playwright/test';

/** On the welcome screen, click Load sample survey and wait for the Data View. */
export async function loadSampleFromWelcome(page: Page | FrameLocator): Promise<void> {
  await expect(page.locator('.welcome')).toBeVisible({ timeout: 30_000 });
  await page.getByRole('button', { name: /Load sample survey/ }).click();
  await expect(page.locator('.grid-scroll')).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('.dataset-size')).toContainText('cases');
}

/** Open the app fresh and load the bundled sample survey. */
export async function openWithSample(page: Page): Promise<void> {
  await page.goto('/');
  await loadSampleFromWelcome(page);
}
