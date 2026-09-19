import { test, expect, type Page } from '@playwright/test';
import { w1Levels } from '../src/content/worlds/w1/levels';
import { w1Crisis } from '../src/content/worlds/w1/crisis';
import type {
  BranchingConfig,
  BucketSortConfig,
  BuilderConfig,
  ImpostorConfig,
} from '../src/content/types';

/**
 * Reader-paced timing for the 2c checkpoint: PACE=1 npx playwright test pace --project=phone-360x740
 * Plays World 1 as a careful first-time player would: reads every screen at 200 words/min
 * (capped at 25 s per screen), takes 2.5 s per decision, and makes one wrong turn per level.
 */
test.skip(!process.env.PACE, 'set PACE=1 to run the paced timing');

const WPM = 200;
const DECISION_MS = 2500;
const readPause = async (page: Page) => {
  const text = await page.locator('main, body').first().innerText();
  const words = text.split(/\s+/).filter(Boolean).length;
  await page.waitForTimeout(Math.min(25_000, Math.round((words / WPM) * 60_000)));
};
const decide = async (page: Page) => page.waitForTimeout(DECISION_MS);
const strip = (s: string) => s.replace(/\[\[[^\]|]+\|([^\]]+)\]\]/g, '$1').replace(/\[\[([^\]]+)\]\]/g, '$1');
const level = (id: string) => w1Levels.find((l) => l.id === id)!;

async function openLevel(page: Page, id: string) {
  await page.getByTestId(`node-${id}`).click();
  await page.waitForTimeout(1600); // badge swap
  await readPause(page); // card front
  await page.getByTestId('flip-card').click();
  await readPause(page); // card back
  await page.getByTestId('start-task').click();
  await readPause(page); // level intro
  await page.getByTestId('start-level').click();
}
async function debrief(page: Page) {
  await expect(page.getByTestId('debrief')).toBeVisible();
  await readPause(page);
  await page.getByTestId('debrief-continue').click();
}

test('paced World 1 run', async ({ page }) => {
  test.setTimeout(900_000);
  await page.goto('/');
  await page.evaluate(() => window.localStorage.clear());
  await page.goto('/');
  const t: Record<string, number> = {};
  const t0 = Date.now();
  await readPause(page);
  await page.getByTestId('play').click();
  await readPause(page);
  await page.getByTestId('story-continue').click();
  await readPause(page);
  t.intro = (Date.now() - t0) / 1000;

  let t1 = Date.now();
  await openLevel(page, 'w1-l1');
  await readPause(page);
  await page.getByTestId('start-stage-voice').click();
  const b = level('w1-l1').stages[0].game as BranchingConfig;
  let nodeId = b.start;
  let wrongUsed = false;
  while (true) {
    const node = b.nodes.find((n) => n.id === nodeId)!;
    if (node.end) break;
    await readPause(page);
    await decide(page);
    const pick = !wrongUsed
      ? (node.choices!.find((c) => c.quality === 'ok') ?? node.choices![0]!)
      : node.choices!.find((c) => c.quality === 'best')!;
    wrongUsed = true;
    await page.getByTestId(`choice-${pick.id}`).click();
    await readPause(page);
    await page.getByTestId('engine-next').click();
    nodeId = pick.next;
  }
  await readPause(page);
  await page.getByTestId('branching-finish').click();
  await debrief(page);
  t.l1 = (Date.now() - t1) / 1000;

  t1 = Date.now();
  await openLevel(page, 'w1-l2');
  await readPause(page);
  await page.getByTestId('start-stage-screen').click();
  const imp = level('w1-l2').stages[0].game as ImpostorConfig;
  for (const c of imp.cards) {
    await page.getByTestId(`card-${c.id}`).click();
    await readPause(page);
  }
  const decoy = imp.cards.find((c) => !c.impostor)!;
  await page.getByTestId(`card-${decoy.id}`).click();
  await decide(page);
  await page.getByTestId('impostor-accuse').click();
  await readPause(page);
  await page.getByTestId('engine-next').click();
  const hit = imp.cards.find((c) => c.impostor)!;
  await page.getByTestId(`card-${hit.id}`).click();
  await decide(page);
  await page.getByTestId('impostor-accuse').click();
  await readPause(page);
  await page.getByTestId('engine-next').click();
  await debrief(page);
  t.l2 = (Date.now() - t1) / 1000;

  t1 = Date.now();
  await openLevel(page, 'w1-l3');
  await readPause(page);
  await page.getByTestId('start-stage-findings').click();
  const bucket = level('w1-l3').stages[0].game as BucketSortConfig;
  for (let i = 0; i < bucket.cards.length; i++) {
    const text = (await page.getByTestId('bucket-card').innerText()).trim();
    const card = bucket.cards.find((c) => strip(c.text) === text)!;
    await readPause(page);
    await decide(page);
    await page
      .getByTestId(`bucket-${i === 2 ? (card.bucketId === 'adverse' ? 'review' : 'adverse') : card.bucketId}`)
      .click();
    await readPause(page);
    await page.getByTestId('engine-next').click();
  }
  await readPause(page);
  await page.getByTestId('start-stage-dose').click();
  await readPause(page);
  await decide(page);
  await page.getByTestId('slider-dose').fill('0.5');
  await page.getByTestId('allocator-commit').click();
  await page.waitForTimeout(4000); // reveal
  await readPause(page);
  await page.getByTestId('reveal-done').click();
  await page.getByTestId('slider-dose').fill('2.5');
  await page.waitForTimeout(4000);
  await readPause(page);
  await page.getByTestId('sandbox-done').click();
  await debrief(page);
  t.l3 = (Date.now() - t1) / 1000;

  t1 = Date.now();
  await openLevel(page, 'w1-l4');
  await readPause(page);
  await page.getByTestId('start-stage-build').click();
  const bld = level('w1-l4').stages[0].game as BuilderConfig;
  await readPause(page);
  for (const slot of bld.slots) {
    const part = bld.parts.find((p) => p.slotId === slot.id)!;
    await decide(page);
    await page.getByTestId(`part-${part.id}`).click();
    await page.getByTestId(`slot-${slot.id}`).click();
  }
  await page.getByTestId('builder-check').click();
  await readPause(page);
  await page.getByTestId('engine-next').click();
  await debrief(page);
  t.l4 = (Date.now() - t1) / 1000;

  t1 = Date.now();
  await page.getByTestId('node-w1-crisis').click();
  await readPause(page);
  await page.getByTestId('start-crisis').click();
  for (let i = 0; i < w1Crisis.rounds.length; i++) {
    const g = w1Crisis.rounds[i]!.game;
    await expect(page.getByTestId('crisis-brief')).toBeVisible({ timeout: 10_000 });
    if (g.engine === 'bucket-sort') {
      for (let k = 0; k < g.cards.length; k++) {
        const text = (await page.getByTestId('bucket-card').innerText()).trim();
        const card = g.cards.find((c) => strip(c.text) === text)!;
        await decide(page);
        await page.getByTestId(`bucket-${card.bucketId}`).click();
        await page.getByTestId('engine-next').click();
      }
    } else if (g.engine === 'builder') {
      for (const slot of g.slots) {
        const part = g.parts.find((p) => p.slotId === slot.id)!;
        await decide(page);
        await page.getByTestId(`part-${part.id}`).click();
        await page.getByTestId(`slot-${slot.id}`).click();
      }
      await page.getByTestId('builder-check').click();
      await page.getByTestId('engine-next').click();
    } else if (g.engine === 'spot-the-impostor') {
      const target = g.cards.find((c) => c.impostor)!;
      await decide(page);
      await page.getByTestId(`card-${target.id}`).click();
      await decide(page);
      await page.getByTestId('impostor-accuse').click();
      await page.getByTestId('engine-next').click();
    } else if (g.engine === 'branching-scenario') {
      const node = g.nodes.find((n) => n.id === g.start)!;
      const best = node.choices!.find((c) => c.quality === 'best')!;
      await decide(page);
      await page.getByTestId(`choice-${best.id}`).click();
      await page.getByTestId('engine-next').click();
      await page.getByTestId('branching-finish').click();
    }
    if (i + 1 < w1Crisis.rounds.length) await page.getByTestId('crisis-next-round').click();
  }
  await expect(page.getByTestId('crisis-success')).toBeVisible();
  await readPause(page);
  await page.getByTestId('story-continue').click();
  await readPause(page);
  await page.getByTestId('story-continue').click();
  t.crisis = (Date.now() - t1) / 1000;
  t.total = (Date.now() - t0) / 1000;
  console.log('PACED_TIMINGS_JSON ' + JSON.stringify(t));
});
