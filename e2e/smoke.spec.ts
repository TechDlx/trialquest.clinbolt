import { expect, test, type Page } from '@playwright/test';
import { w1Levels } from '../src/content/worlds/w1/levels';
import { expectAccessible } from './axe';
import type {
  AllocatorConfig,
  BranchingConfig,
  BucketSortConfig,
  BuilderConfig,
  ImpostorConfig,
} from '../src/content/types';

/**
 * Smoke test: a new player goes from the title screen through World 1 (four levels on their
 * intended engines, the crisis boss, the story beat) and one optional Test Yourself run.
 * Runs at 360x740 (touch) and 1440x900. Correct answers come from the content files.
 * Reports wall-clock timings for the 2c checkpoint.
 */
const level = (id: string) => w1Levels.find((l) => l.id === id)!;
const timings: Record<string, number> = {};
const timed = async (label: string, fn: () => Promise<void>) => {
  const t = Date.now();
  await fn();
  timings[label] = (Date.now() - t) / 1000;
};

async function openLevel(page: Page, levelId: string) {
  await page.getByTestId(`node-${levelId}`).click();
  await expect(page.getByTestId('badge-swap')).toBeVisible();
  await page.getByTestId('badge-swap').click();
  await expect(page.getByTestId('rolecard-front')).toBeVisible();
  await expectAccessible(page, `role card ${levelId}`);
  await expect(page.getByTestId('start-task')).toBeDisabled();
  await page.getByTestId('flip-card').click();
  await expect(page.getByTestId('rolecard-back')).toBeVisible();
  await page.getByTestId('start-task').click();
  await expect(page.getByTestId('start-level')).toBeVisible();
  await expectAccessible(page, `level intro ${levelId}`);
  await page.getByTestId('start-level').click();
}

async function finishLevel(page: Page, levelId: string, expectContinueLabel?: string) {
  await expect(page.getByTestId('debrief')).toBeVisible();
  await expectAccessible(page, `debrief ${levelId}`);
  if (expectContinueLabel) await expect(page.getByTestId('debrief-continue')).toHaveText(expectContinueLabel);
  await page.getByTestId('debrief-continue').click();
  await expect(page.getByTestId(`node-${levelId}`)).toHaveAttribute('data-status', 'done');
}

/** Marks nodes done in the saved game, so a deep link past the unlock gate is legitimate. */
async function markDone(page: Page, ids: { levels?: string[]; crises?: string[] }) {
  await page.evaluate((ids) => {
    const raw = JSON.parse(window.localStorage.getItem('trialquest.progress') ?? '{"state":{},"version":2}');
    const at = new Date().toISOString();
    raw.state.levels ??= {};
    raw.state.crises ??= {};
    for (const id of ids.levels ?? [])
      raw.state.levels[id] = { stars: 2, bestScore: 70, attempts: 1, completedAt: at };
    for (const id of ids.crises ?? [])
      raw.state.crises[id] = { stars: 2, bestPoints: 500, attempts: 1, completedAt: at };
    window.localStorage.setItem('trialquest.progress', JSON.stringify(raw));
  }, ids);
}

const strip = (s: string) => s.replace(/\[\[[^\]|]+\|([^\]]+)\]\]/g, '$1').replace(/\[\[([^\]]+)\]\]/g, '$1');

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => window.localStorage.clear());
  await page.goto('/');
});

test('new player completes World 1 end to end on the intended engines', async ({ page }) => {
  test.setTimeout(240_000);
  const t0 = Date.now();
  await expect(page).toHaveTitle(/Trial Quest/);
  await expectAccessible(page, 'title');
  await page.getByTestId('play').click();
  await expect(page.getByTestId('intro')).toBeVisible();
  await expectAccessible(page, 'intro');
  await page.getByTestId('story-continue').click();
  await expect(page.getByTestId('node-w1-l1')).toHaveAttribute('data-status', 'current');
  await expectAccessible(page, 'world map');
  await expect(page.getByTestId('node-w1-l2')).toBeDisabled();

  // ---- w1-l1 branching scenario: best choices, plus the shortcut once to see the meters move.
  await timed('l1', async () => {
    await openLevel(page, 'w1-l1');
    await page.getByTestId('start-stage-voice').click();
    const cfg = level('w1-l1').stages[0].game as BranchingConfig;
    let nodeId = cfg.start;
    while (true) {
      const node = cfg.nodes.find((n) => n.id === nodeId)!;
      if (node.end) break;
      const best = node.choices!.find((c) => c.quality === 'best')!;
      await page.getByTestId(`choice-${best.id}`).click(); // best choices auto-advance
      nodeId = best.next;
    }
    await page.getByTestId('branching-finish').click();
    await finishLevel(page, 'w1-l1');
  });

  // ---- w1-l2 spot the hit.
  await timed('l2', async () => {
    await openLevel(page, 'w1-l2');
    await page.getByTestId('start-stage-screen').click();
    const cfg = level('w1-l2').stages[0].game as ImpostorConfig;
    const hit = cfg.cards.find((c) => c.impostor)!;
    await page.getByTestId(`card-${hit.id}`).click();
    await page.getByTestId('impostor-accuse').click();
    await finishLevel(page, 'w1-l2');
  });

  // ---- w1-l3 classify findings, then the dose simulation (first commit binding, sandbox free).
  await timed('l3', async () => {
    await openLevel(page, 'w1-l3');
    await page.getByTestId('start-stage-findings').click();
    const bucket = level('w1-l3').stages[0].game as BucketSortConfig;
    for (let i = 0; i < bucket.cards.length; i++) {
      const text = (await page.getByTestId('bucket-card').innerText()).trim();
      const card = bucket.cards.find((c) => strip(c.text) === text)!;
      await page.getByTestId(`bucket-${card.bucketId}`).click();
      await expect(page.getByTestId('engine-feedback')).toHaveAttribute('data-inline', 'true');
      await expect(page.getByTestId('engine-feedback')).toBeHidden({ timeout: 5000 });
    }
    await page.getByTestId('start-stage-dose').click();
    const alloc = level('w1-l3').stages[1].game as AllocatorConfig;
    await page.getByTestId('slider-dose').fill('0.5');
    await page.getByTestId('allocator-commit').click();
    await expect(page.getByTestId('reveal')).toHaveAttribute('data-band', alloc.simulation!.targetBand);
    await page.getByTestId('reveal-done').click();
    await expect(page.getByTestId('sandbox-banner')).toBeVisible();
    await page.getByTestId('slider-dose').fill('4.8');
    await expect(page.getByTestId('reveal')).toHaveAttribute('data-band', 'reckless');
    await page.getByTestId('sandbox-done').click();
    await expect(page.getByTestId('debrief-artifacts')).toContainText('Starting dose');
    await expect(page.getByTestId('debrief-artifacts')).toContainText('standard');
    await finishLevel(page, 'w1-l3');
  });

  // ---- w1-l4 builder.
  await timed('l4', async () => {
    await openLevel(page, 'w1-l4');
    await page.getByTestId('start-stage-build').click();
    const cfg = level('w1-l4').stages[0].game as BuilderConfig;
    for (const slot of cfg.slots) {
      const part = cfg.parts.find((p) => p.slotId === slot.id)!;
      await page.getByTestId(`part-${part.id}`).click();
      await page.getByTestId(`slot-${slot.id}`).click();
    }
    await page.getByTestId('builder-check').click();
    await finishLevel(page, 'w1-l4', 'Continue to the crisis');
  });

  // Progress survives a reload.
  await page.reload();
  await expect(page.getByTestId('node-w1-l4')).toHaveAttribute('data-status', 'done');
  await expect(page.getByTestId('node-w1-crisis')).toHaveAttribute('data-status', 'current');

  // ---- Crisis boss: four rounds, four engines, one clock.
  await timed('crisis', async () => {
    await page.getByTestId('node-w1-crisis').click();
    await expectAccessible(page, 'crisis intro');
    await page.getByTestId('start-crisis').click();
    const { w1Crisis } = await import('../src/content/worlds/w1/crisis');
    for (let i = 0; i < w1Crisis.rounds.length; i++) {
      const round = w1Crisis.rounds[i]!;
      await expect(page.getByTestId('crisis-brief')).toBeVisible({ timeout: 10_000 });
      const g = round.game;
      if (g.engine === 'bucket-sort') {
        for (let k = 0; k < g.cards.length; k++) {
          const text = (await page.getByTestId('bucket-card').innerText()).trim();
          const card = g.cards.find((c) => strip(c.text) === text)!;
          await page.getByTestId(`bucket-${card.bucketId}`).click();
          await expect(page.getByTestId('engine-feedback')).toBeHidden({ timeout: 5000 });
        }
      } else if (g.engine === 'builder') {
        for (const slot of g.slots) {
          const part = g.parts.find((p) => p.slotId === slot.id)!;
          await page.getByTestId(`part-${part.id}`).click();
          await page.getByTestId(`slot-${slot.id}`).click();
        }
        await page.getByTestId('builder-check').click();
      } else if (g.engine === 'spot-the-impostor') {
        const hit = g.cards.find((c) => c.impostor)!;
        await page.getByTestId(`card-${hit.id}`).click();
        await page.getByTestId('impostor-accuse').click();
      } else if (g.engine === 'branching-scenario') {
        const node = g.nodes.find((n) => n.id === g.start)!;
        const best = node.choices!.find((c) => c.quality === 'best')!;
        await page.getByTestId(`choice-${best.id}`).click();
        await page.getByTestId('branching-finish').click();
      }
      await expect(page.getByTestId('engine-next')).toHaveCount(0);
      if (i + 1 < w1Crisis.rounds.length) await page.getByTestId('crisis-next-round').click();
    }
    await expect(page.getByTestId('crisis-success')).toBeVisible();
    await expectAccessible(page, 'crisis resolution');
    await page.getByTestId('debrief-continue').click();
    await expect(page.getByTestId('story-outro')).toBeVisible();
    await expectAccessible(page, 'story outro');
    await page.getByTestId('story-continue').click();
  });
  timings.total = (Date.now() - t0) / 1000;

  // World 2 unlocked: its first level is now the current node.
  await expect(page.getByTestId('node-w2-l1')).toHaveAttribute('data-status', 'current');

  // ---- Optional Test Yourself from a done node; never required, never costs hearts.
  await page.getByTestId('node-w1-l1').click();
  await page.getByTestId('sheet-test').click();
  await page.getByTestId('start-test').click();
  await expect(page.getByTestId('quiz-blitz')).toBeVisible();

  console.log('TIMINGS_JSON ' + JSON.stringify(timings));
});

test('a wrong turn explains itself, the shortcut costs meters not hearts, and the card gate holds', async ({
  page,
}) => {
  await page.getByTestId('play').click();
  await page.getByTestId('story-continue').click();
  await page.goto('/#/level/w1-l1');
  await expect(page.getByTestId('rolecard-front')).toBeVisible();
  await page.getByTestId('flip-card').click();
  await page.getByTestId('start-task').click();
  await page.getByTestId('start-level').click();
  await page.getByTestId('start-stage-voice').click();
  await expectAccessible(page, 'branching scenario');
  await page.getByTestId('choice-c-no').click();
  await expect(page.getByTestId('engine-feedback')).toHaveAttribute('data-kind', 'wrong');
  await expectAccessible(page, 'wrong-turn feedback');
  await expect(page.getByTestId('engine-feedback')).toContainText('first slip on each try is free');
  await page.getByTestId('engine-next').click();
  // Declining the interviews takes the parallel branch (-b ids).
  await page.getByTestId('choice-c-fatigue-b').click();
  await page.getByTestId('choice-c-hype-b').click();
  await expect(page.getByTestId('engine-feedback')).toHaveAttribute('data-kind', 'shortcut');
  const hearts = await page.evaluate(
    () => JSON.parse(window.localStorage.getItem('trialquest.progress')!).state.hearts,
  );
  const meters = await page.evaluate(
    () => JSON.parse(window.localStorage.getItem('trialquest.progress')!).state.meters,
  );
  expect(hearts).toBe(5);
  expect(meters.integrity).toBe(85);
  expect(meters.timeline).toBe(100);
});

test('settings: relaxed mode removes the timer and reset clears progress', async ({ page }) => {
  await page.getByTestId('play').click();
  await page.getByTestId('story-continue').click();
  // The tabs sit at the bottom on a phone and in the left rail on desktop.
  await page
    .getByTestId(/^(side-)?nav-settings$/)
    .filter({ visible: true })
    .click();
  await expectAccessible(page, 'settings');
  await page.getByTestId('setting-relaxed').check();
  await markDone(page, { levels: ['w1-l1', 'w1-l2'] });
  await page.reload();
  await page.goto('/#/role/preclinical-toxicologist?level=w1-l3');
  await page.getByTestId('flip-card').click();
  await page.getByTestId('start-task').click();
  await page.getByTestId('start-level').click();
  await expect(page.getByTestId('stage-card-findings')).toContainText('Relaxed mode');
  await expectAccessible(page, 'stage card');
  await page.getByTestId('start-stage-findings').click();
  await expect(page.getByTestId('bucket-card')).toBeVisible();
  await expectAccessible(page, 'bucket sort');
  await page.goto('/#/settings');
  await page.getByTestId('reset-progress').click();
  await page.getByTestId('reset-confirm-input').fill('RESET');
  await page.getByTestId('reset-confirm').click();
  await expect(page.getByTestId('play')).toBeVisible();
});

test('secondary screens pass the accessibility gate', async ({ page }) => {
  await page.getByTestId('play').click();
  await page.getByTestId('story-continue').click();
  for (const [hash, heading] of [
    ['#/codex', 'Career Codex'],
    ['#/glossary', 'Glossary'],
    ['#/handoff', 'Handoff map'],
  ] as const) {
    await page.goto('/' + hash);
    await expect(page.getByRole('heading', { name: heading })).toBeVisible();
    await expectAccessible(page, heading);
  }
  // Locked until the journey is done, like any node.
  await page.goto('/#/finale');
  await expect(page.getByTestId('locked-to-map')).toBeVisible();
  await expectAccessible(page, 'locked deep link');
  await markDone(page, {
    crises: [1, 2, 3, 4, 5, 6, 7, 8].map((n) => `w${n}-crisis`),
    // Levels per world, W1 to W8: the finale is the last node, so every one must be done.
    levels: [4, 5, 7, 4, 5, 7, 5, 7].flatMap((count, w) =>
      Array.from({ length: count }, (_, i) => `w${w + 1}-l${i + 1}`),
    ),
  });
  await page.reload();
  await expect(page.getByTestId('finale')).toBeVisible();
  await expectAccessible(page, 'finale');
});
