import { test } from '@playwright/test';
import { w1Levels } from '../src/content/worlds/w1/levels';
import type { BucketSortConfig } from '../src/content/types';

/** Visual check helper: SHOTS=1 npx playwright test screenshots --project=phone-360x740 */
test.skip(!process.env.SHOTS, 'set SHOTS=1 to capture screenshots');

const out = process.env.SHOTS_DIR ?? 'test-results/shots';
const strip = (s: string) => s.replace(/\[\[[^\]|]+\|([^\]]+)\]\]/g, '$1').replace(/\[\[([^\]]+)\]\]/g, '$1');

test('capture key screens', async ({ page }, info) => {
  const name = info.project.name;
  const shot = (n: string, fullPage = true) => page.screenshot({ path: `${out}/${name}-${n}.png`, fullPage });
  await page.goto('/');
  await page.evaluate(() => window.localStorage.clear());
  await page.goto('/');
  await page.getByTestId('play').click();
  await page.getByTestId('story-continue').click();
  await page.waitForTimeout(400);
  await shot('01-map', false);

  // Level 1: scenario with a shortcut choice
  await page.getByTestId('node-w1-l1').click();
  await page.getByTestId('badge-swap').click();
  await page.getByTestId('flip-card').click();
  await page.getByTestId('start-task').click();
  await shot('02-level-intro');
  await page.getByTestId('start-level').click();
  await shot('03-stage-card');
  await page.getByTestId('start-stage-voice').click();
  await shot('04-branching');
  await page.getByTestId('choice-c-later').click();
  await page.waitForTimeout(300);
  await shot('05-branching-feedback');

  // Level 3 straight in (card gate): bucket sort, then the dose simulation and sandbox
  await page.goto('/#/role/preclinical-toxicologist?level=w1-l3');
  await page.getByTestId('flip-card').click();
  await page.getByTestId('start-task').click();
  await page.getByTestId('start-level').click();
  await page.getByTestId('start-stage-findings').click();
  await shot('06-bucket-sort');
  const bucket = w1Levels.find((l) => l.id === 'w1-l3')!.stages[0].game as BucketSortConfig;
  for (let i = 0; i < bucket.cards.length; i++) {
    const text = (await page.getByTestId('bucket-card').innerText()).trim();
    const card = bucket.cards.find((c) => strip(c.text) === text)!;
    await page.getByTestId(`bucket-${i === 1 ? 'noise' : card.bucketId}`).click();
    if (i === 1) await shot('07-shortcut-feedback');
    await page.getByTestId('engine-next').click();
  }
  await page.getByTestId('start-stage-dose').click();
  await shot('08-allocator');
  await page.getByTestId('slider-dose').fill('0.5');
  await page.getByTestId('allocator-commit').click();
  await page.waitForTimeout(2500);
  await shot('09-reveal');
  await page.getByTestId('reveal-done').click();
  await page.getByTestId('slider-dose').fill('4.8');
  await page.waitForTimeout(1500);
  await shot('10-sandbox');
  await page.getByTestId('sandbox-done').click();
  await shot('11-debrief');

  // Crisis intro (needs all levels done: fake it via the store)
  await page.evaluate(() => {
    const raw = JSON.parse(window.localStorage.getItem('trialquest.progress')!);
    for (const id of ['w1-l1', 'w1-l2', 'w1-l3', 'w1-l4'])
      raw.state.levels[id] = { stars: 2, bestScore: 70, attempts: 1, completedAt: new Date().toISOString() };
    window.localStorage.setItem('trialquest.progress', JSON.stringify(raw));
  });
  await page.goto('/#/map/w1');
  await page.reload();
  await page.getByTestId('node-w1-crisis').click();
  await shot('12-crisis-intro');
  await page.getByTestId('start-crisis').click();
  await page.waitForTimeout(1200);
  await shot('13-crisis-round');
});
