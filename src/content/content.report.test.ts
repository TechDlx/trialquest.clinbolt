/**
 * Content report: per-level word counts and reader-paced time estimates.
 * Always passes; run `npm run content:report` to read it.
 */
import { describe, it } from 'vitest';
import { content } from './index';
import { BUDGETS, cardFrontWords, estimateLevel, words } from './estimate';

describe('content report', () => {
  it('prints per-level word counts and time estimates', () => {
    const rows = content.levels.map((l) => {
      const role = content.roleById[l.roleId];
      const e = estimateLevel(l, role);
      return {
        level: l.id,
        card: e.words.card,
        intro: e.words.intro,
        task: e.words.task,
        feedback: e.words.feedback,
        debrief: e.words.debrief,
        total: e.words.total,
        decisions: e.decisions,
        seconds: e.seconds,
        over: e.seconds > BUDGETS.levelSeconds ? 'OVER' : '',
      };
    });
    console.table(rows);
    const cards = content.roles.map((r) => ({
      role: r.id,
      front: cardFrontWords(r),
      whatIDo: words(r.card.whatIDo),
    }));
    console.table(cards);
    for (const w of content.worlds.filter((x) => x.status === 'ready')) {
      const intro = w.intro.paragraphs.reduce((n, p) => n + words(p), 0);
      console.log(`${w.id} intro story: ${intro} words ≈ ${Math.round((intro / 200) * 60)} s`);
    }
  });
});
