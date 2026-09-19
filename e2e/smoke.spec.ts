import { expect, test, type Page } from '@playwright/test';
import { w1Levels } from '../src/content/worlds/w1/levels';
import { w1Boss } from '../src/content/worlds/w1/boss';

/**
 * Smoke test: a new player goes from the title screen through World 1 (all four levels and
 * the boss quiz) using only taps/clicks. Runs at 360x740 (touch) and 1440x900 (mouse).
 * Correct answers are looked up from the content files, so nothing leaks into the DOM.
 */

const correctFor = (prompt: string) => {
  const all = [...w1Levels.flatMap((l) => l.game.questions), ...w1Boss.questions];
  const q = all.find((x) => x.prompt === prompt);
  if (!q) throw new Error(`No question matches prompt: ${prompt}`);
  return q.options.find((o) => o.correct)!.text;
};

async function answerAllCorrectly(page: Page, count: number) {
  for (let i = 0; i < count; i++) {
    await expect(page.getByTestId('quiz-progress')).toHaveText(`Question ${i + 1} of ${count}`);
    const prompt = (await page.getByTestId('quiz-prompt').innerText()).trim();
    const answer = correctFor(prompt);
    await page.getByRole('button', { name: new RegExp(`: ${escapeRe(answer)}$`) }).click();
    await expect(page.getByTestId('quiz-feedback')).toContainText('Correct!');
    // Relaxed mode shows a Next/Finish button; timed mode auto-advances.
    const next = page.getByTestId('quiz-next');
    if (await next.isVisible().catch(() => false)) await next.click();
  }
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function playLevel(page: Page, levelId: string) {
  const level = w1Levels.find((l) => l.id === levelId)!;
  await page.getByTestId(`node-${levelId}`).click();
  await expect(page.getByTestId('badge-swap')).toBeVisible();
  await page.getByTestId('badge-swap').click(); // skip the animation
  await expect(page.getByTestId('rolecard-front')).toBeVisible();
  await expect(page.getByTestId('start-task')).toBeDisabled();
  await page.getByTestId('flip-card').click();
  await expect(page.getByTestId('rolecard-back')).toBeVisible();
  await page.getByTestId('start-task').click();
  await page.getByTestId('start-level').click();
  await answerAllCorrectly(page, level.game.questions.length);
  await expect(page.getByTestId('debrief')).toBeVisible();
  await expect(page.getByTestId('debrief-score')).toContainText(
    `${level.game.questions.length} of ${level.game.questions.length} correct`,
  );
  await page.getByTestId('debrief-continue').click();
  await expect(page.getByTestId(`node-${levelId}`)).toHaveAttribute('data-status', 'done');
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => window.localStorage.clear());
  await page.goto('/');
});

test('new player completes World 1 end to end', async ({ page }) => {
  test.setTimeout(180_000);
  await expect(page).toHaveTitle(/Trial Quest/);
  await page.getByTestId('play').click();
  await expect(page.getByTestId('intro')).toBeVisible();
  await page.getByTestId('story-continue').click();

  await expect(page.getByTestId('node-w1-l1')).toHaveAttribute('data-status', 'current');
  await expect(page.getByTestId('node-w1-l2')).toBeDisabled();

  for (const id of ['w1-l1', 'w1-l2', 'w1-l3', 'w1-l4']) await playLevel(page, id);

  // Progress survives a reload (the map is restored from localStorage), and the title offers Continue.
  await page.reload();
  await expect(page.getByTestId('node-w1-l4')).toHaveAttribute('data-status', 'done');
  await page.goto('/#/');
  await expect(page.getByTestId('continue')).toBeVisible();
  await page.getByTestId('continue').click();
  await expect(page.getByTestId('node-w1-l4')).toHaveAttribute('data-status', 'done');
  await expect(page.getByTestId('node-w1-boss')).toHaveAttribute('data-status', 'current');

  // Boss quiz.
  await page.getByTestId('node-w1-boss').click();
  await page.getByTestId('start-boss').click();
  await answerAllCorrectly(page, w1Boss.questions.length);
  await expect(page.getByTestId('debrief')).toBeVisible();
  await page.getByTestId('debrief-continue').click();
  await expect(page.getByTestId('story-outro')).toBeVisible();
  await page.getByTestId('story-continue').click();

  // World 2 header is unlocked (content is planned, so nodes show as coming soon).
  await expect(page.getByTestId('node-w2-l1')).toHaveAttribute('data-status', 'planned');

  // Codex has the four World 1 badges.
  await page.getByTestId('nav-codex').click();
  await expect(page.getByTestId('codex-cmc-scientist')).toBeVisible();
});

test('a wrong answer explains itself and the role card gate holds', async ({ page }) => {
  await page.getByTestId('play').click();
  await page.getByTestId('story-continue').click();
  // Deep-linking to a level without reading the card redirects to the card.
  await page.goto('/#/level/w1-l1');
  await expect(page.getByTestId('rolecard-front')).toBeVisible();
  await page.getByTestId('flip-card').click();
  await page.getByTestId('start-task').click();
  await page.getByTestId('start-level').click();

  const prompt = (await page.getByTestId('quiz-prompt').innerText()).trim();
  const right = correctFor(prompt);
  const options = page.getByTestId('quiz-option');
  const n = await options.count();
  for (let i = 0; i < n; i++) {
    const label = (await options.nth(i).getAttribute('aria-label')) ?? '';
    if (!label.endsWith(`: ${right}`)) {
      await options.nth(i).click();
      break;
    }
  }
  await expect(page.getByTestId('quiz-feedback')).toContainText('Not quite.');
  await expect(page.getByTestId('quiz-feedback')).toContainText('Correct answer:');
  await expect(page.getByTestId('quiz-feedback')).toContainText('First slip in World 1 is free');
});

test('settings: relaxed mode removes the timer and reset clears progress', async ({ page }) => {
  await page.getByTestId('play').click();
  await page.getByTestId('story-continue').click();
  await page.getByTestId('nav-settings').click();
  await page.getByTestId('setting-relaxed').check();
  await page.goto('/#/role/patient-advocate?level=w1-l1');
  await page.getByTestId('flip-card').click();
  await page.getByTestId('start-task').click();
  await page.getByTestId('start-level').click();
  await expect(page.getByText('Relaxed mode: no timer')).toBeVisible();

  await page.goto('/#/settings');
  await page.getByTestId('reset-progress').click();
  await page.getByTestId('reset-confirm-input').fill('RESET');
  await page.getByTestId('reset-confirm').click();
  await expect(page.getByTestId('play')).toBeVisible();
});
