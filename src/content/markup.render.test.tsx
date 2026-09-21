import { describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { content } from '@/content';
import { labLevels } from '@/content/lab';
import type { MainPathConfig, Stage } from '@/content/types';
import { EngineHost } from '@/engine/EngineHost';
import { Feedback } from '@/engine/engines/Feedback';
import { Debrief } from '@/screens/Debrief';

/** Raw markup anywhere a player can read or hear it. */
function leaks(root: HTMLElement): string[] {
  const texts = [root.textContent ?? ''];
  root.querySelectorAll('[aria-label]').forEach((el) => texts.push(el.getAttribute('aria-label')!));
  return texts.filter((t) => t.includes('[[') || t.includes(']]'));
}

const host = {
  seed: 1,
  paused: false,
  relaxed: true,
  remainingFraction: 1,
  timeUp: false,
  mode: 'level' as const,
  onMistake: vi.fn(() => ({ heartLost: false })),
  onShortcut: vi.fn(),
  onMeters: vi.fn(),
  onComplete: vi.fn(),
};

const stages: [string, Stage][] = [
  ...Object.values(content.levelById).flatMap((l) => l.stages.map((s) => [l.id, s] as [string, Stage])),
  ...labLevels.flatMap((l) => l.stages.map((s) => [l.id, s] as [string, Stage])),
  ...content.crises.flatMap((c) => c.rounds.map((r) => [c.id, r as unknown as Stage] as [string, Stage])),
].filter(([, s]) => s.game.engine !== 'quiz-blitz');

/** Every content string carrying markup, so the free-text slots below see real copy. */
const marked: string[] = [];
const walk = (v: unknown) => {
  if (typeof v === 'string') {
    if (v.includes('[[')) marked.push(v);
  } else if (Array.isArray(v)) v.forEach(walk);
  else if (v && typeof v === 'object') Object.values(v).forEach(walk);
};
walk(content.levels);
walk(content.crises);

describe('glossary markup never reaches the screen raw', () => {
  it.each(stages.map(([id, s]) => [`${id} / ${s.id}`, s] as const))('engine stage %s', (_name, stage) => {
    const { container } = render(<EngineHost {...host} config={stage.game as MainPathConfig} />);
    expect(leaks(container)).toEqual([]);
    cleanup();
  });

  it('debrief mistakes and shortcuts', () => {
    expect(marked.length).toBeGreaterThan(50);
    const mistakes = marked.map((t, i) => ({
      itemId: `m${i}`,
      conceptId: 'c',
      prompt: t,
      chosen: t,
      correctAnswer: t,
      explanation: t,
      consequence: t,
    }));
    const { container, getByTestId } = render(
      <Debrief
        kind="review"
        title="t"
        stars={2}
        score={50}
        xp={{ total: 0, lines: [] }}
        mistakes={mistakes}
        shortcuts={[{ itemId: 's', meters: { timeline: 5 }, why: marked[0]! }]}
        correct={1}
        total={2}
        failed={false}
        canRetry={false}
        onContinue={() => {}}
        onRetry={() => {}}
      />,
    );
    getByTestId('debrief-see-all').click();
    expect(leaks(container)).toEqual([]);
  });

  it('feedback panel and inline confirmation', () => {
    const t = marked[0]!;
    const a = render(
      <Feedback kind="wrong" title={t} correctAnswer={t} explanation={t} note={t} onNext={() => {}} />,
    );
    expect(leaks(a.container)).toEqual([]);
    const b = render(<Feedback kind="correct" title={t} explanation="" inline onNext={() => {}} />);
    expect(leaks(b.container)).toEqual([]);
  });
});
