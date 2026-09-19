import { test } from '@playwright/test';

/** Visual check helper: SHOTS=1 npx playwright test screenshots --project=phone-360x740 */
test.skip(!process.env.SHOTS, 'set SHOTS=1 to capture screenshots');

const out = process.env.SHOTS_DIR ?? 'test-results/shots';

test('capture key screens', async ({ page }, info) => {
  const name = info.project.name;
  await page.goto('/');
  await page.evaluate(() => window.localStorage.clear());
  await page.goto('/');
  await page.screenshot({ path: `${out}/${name}-01-title.png`, fullPage: true });
  await page.getByTestId('play').click();
  await page.screenshot({ path: `${out}/${name}-02-intro.png`, fullPage: true });
  await page.getByTestId('story-continue').click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${out}/${name}-03-map.png`, fullPage: false });
  await page.getByTestId('node-w1-l1').click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/${name}-04-badge.png` });
  await page.getByTestId('badge-swap').click();
  await page.screenshot({ path: `${out}/${name}-05-card-front.png`, fullPage: true });
  await page.getByTestId('flip-card').click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${out}/${name}-06-card-back.png`, fullPage: true });
  await page.getByTestId('start-task').click();
  await page.screenshot({ path: `${out}/${name}-07-level-intro.png`, fullPage: true });
  await page.getByTestId('start-level').click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/${name}-08-quiz.png`, fullPage: true });
  await page.getByTestId('quiz-option').nth(1).click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/${name}-09-feedback.png`, fullPage: true });
});
