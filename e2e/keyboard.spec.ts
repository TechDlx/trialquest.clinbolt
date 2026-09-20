import { expect, test, type Page } from '@playwright/test';

/** Keyboard-only walkthrough: title → intro → map → badge → role card → level → first decision. */
async function tabTo(page: Page, testId: string, max = 40) {
  for (let i = 0; i < max; i++) {
    const active = await page.evaluate(
      () => (document.activeElement as HTMLElement | null)?.dataset.testid ?? '',
    );
    if (active === testId) return;
    await page.keyboard.press('Tab');
  }
  throw new Error(`Could not reach ${testId} with Tab`);
}

test('a keyboard-only player can start the first level and make a choice', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => window.localStorage.clear());
  await page.goto('/');

  await tabTo(page, 'play');
  // Keyboard focus shows the global focus-visible ring.
  const ring = await page.evaluate(
    () => getComputedStyle(document.activeElement as HTMLElement).outlineStyle,
  );
  expect(ring).toBe('solid');
  await page.keyboard.press('Enter');
  await tabTo(page, 'story-continue');
  await page.keyboard.press('Enter');

  await expect(page.getByTestId('node-w1-l1')).toHaveAttribute('data-status', 'current');
  await tabTo(page, 'node-w1-l1');
  await page.keyboard.press('Enter');
  await tabTo(page, 'badge-swap');
  await page.keyboard.press('Enter');

  await tabTo(page, 'flip-card');
  await page.keyboard.press('Enter');
  await tabTo(page, 'start-task');
  await page.keyboard.press('Enter');
  await tabTo(page, 'start-level');
  await page.keyboard.press('Enter');
  await tabTo(page, 'start-stage-voice');
  await page.keyboard.press('Enter');

  // Choices answer to number keys as well as Tab + Enter.
  await expect(page.getByTestId('choice-c-yes')).toBeVisible();
  await page.keyboard.press('1');
  await expect(page.getByTestId('engine-feedback')).toBeVisible();
});
