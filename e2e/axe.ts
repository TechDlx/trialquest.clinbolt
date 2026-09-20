import { expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Accessibility gate for the smoke run: any serious or critical axe violation fails the test.
 * Rules excluded, with reasons, are listed in EXCLUDED_RULES; keep it empty unless a rule is
 * demonstrably wrong for this UI.
 */
export const EXCLUDED_RULES: { rule: string; reason: string }[] = [];

export async function expectAccessible(page: Page, screenName: string) {
  // Let entry animations (opacity fades up to ~300 ms) settle so axe measures the final colours.
  await page.waitForTimeout(450);
  const builder = new AxeBuilder({ page }).withTags([
    'wcag2a',
    'wcag2aa',
    'wcag21a',
    'wcag21aa',
    'best-practice',
  ]);
  if (EXCLUDED_RULES.length) builder.disableRules(EXCLUDED_RULES.map((r) => r.rule));
  const results = await builder.analyze();
  const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  const summary = serious
    .map(
      (v) =>
        `${v.id} (${v.impact}): ${v.help}\n` +
        v.nodes
          .slice(0, 3)
          .map((n) => `  - ${n.target.join(' ')}: ${n.failureSummary?.split('\n')[1] ?? ''}`)
          .join('\n'),
    )
    .join('\n');
  expect(serious, `axe on ${screenName}:\n${summary}`).toEqual([]);
}
