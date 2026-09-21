import { expect, test, type Page } from '@playwright/test';
import { expectAccessible } from './axe';

/** The frame adapts by width: bottom tabs on a phone, a left rail from 1024px, side panels from 1280px. */

async function seedWorldOne(page: Page) {
  await page.goto('/');
  await page.evaluate(() => {
    window.localStorage.clear();
    const done = { stars: 2, bestScore: 70, attempts: 1, completedAt: new Date().toISOString() };
    window.localStorage.setItem(
      'trialquest.progress',
      JSON.stringify({
        state: {
          levels: { 'w1-l1': done, 'w1-l2': done, 'w1-l3': done },
          tipsDismissed: { 'map-first': true, 'rolecard-first': true, 'level-first': true },
        },
        version: 2,
      }),
    );
  });
  await page.reload();
}

test('the frame matches the viewport: rail and panels on desktop, tabs on a phone', async ({
  page,
}, info) => {
  const desktop = info.project.name.startsWith('desktop');
  await seedWorldOne(page);
  await page.goto('/#/map');
  await expect(page.getByTestId('maya-status').filter({ visible: true })).toHaveCount(1);

  if (desktop) {
    await expect(page.getByTestId('side-nav')).toBeVisible();
    // The rail is a flex column: the logo must keep its own width, not stretch to the rail's.
    const logo = await page.getByTestId('side-nav').getByRole('img', { name: 'ClinBolt' }).boundingBox();
    expect(Math.round(logo!.width)).toBe(122);
    await expect(page.getByTestId('bottom-nav')).toBeHidden();
    await expect(page.getByTestId('map-aside')).toBeVisible();
    await expect(page.getByTestId('map-next-up')).toContainText('CMC Scientist');
    await expect(page.getByTestId('continue-current')).toBeHidden();
  } else {
    await expect(page.getByTestId('bottom-nav')).toBeVisible();
    await expect(page.getByTestId('side-nav')).toBeHidden();
    await expect(page.getByTestId('map-aside')).toBeHidden();
    await expect(page.getByTestId('continue-current')).toBeVisible();
  }
  await expectAccessible(page, 'map frame');

  // The rail navigates like the tabs do.
  await page.getByTestId(desktop ? 'side-nav-codex' : 'nav-codex').click();
  await expect(page.getByRole('heading', { name: 'Career Codex' })).toBeVisible();
  await expectAccessible(page, 'codex frame');

  // In a task the badge panel is desktop-only; the pause menu still offers the card everywhere.
  await page.goto('/#/role/cmc-scientist?level=w1-l4');
  await page.getByTestId('flip-card').click();
  await page.getByTestId('start-task').click();
  await page.getByTestId('start-level').click();
  await page.locator('[data-testid^="start-stage-"]').first().click();
  const aside = page.getByTestId('task-aside');
  if (desktop) {
    await expect(aside).toBeVisible();
    await expect(aside).toContainText('CMC / Formulation Scientist');
    await expect(aside).toContainText('I hand off to');
  } else {
    await expect(aside).toBeHidden();
  }
  await expectAccessible(page, 'task frame');
});

test('home and intro: two columns on desktop, one column on a phone', async ({ page }, info) => {
  const desktop = info.project.name.startsWith('desktop');
  await page.goto('/');
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();

  // The picture sits beside the title on desktop and below it on a phone.
  const title = await page.getByRole('heading', { name: 'Trial Quest' }).boundingBox();
  const scene = await page.getByRole('img', { name: 'Maya' }).first().boundingBox();
  if (desktop) expect(scene!.x).toBeGreaterThan(title!.x + title!.width);
  else expect(scene!.y).toBeGreaterThan(title!.y + title!.height);
  await expectAccessible(page, 'home layout');

  await page.getByTestId('play').click();
  const heading = await page.getByRole('heading', { name: 'A name for it' }).boundingBox();
  const room = await page.getByTestId('intro').locator('svg[viewBox="0 0 350 210"]').boundingBox();
  if (desktop) expect(room!.x + room!.width).toBeLessThan(heading!.x);
  else expect(room!.y).toBeGreaterThan(heading!.y);
  await expectAccessible(page, 'intro layout');
});
