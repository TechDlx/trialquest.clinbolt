import { useCallback, useMemo, useState } from 'react';
import { content, knowledgeQuestions } from '@/content';
import { economy } from '@/content/economy';
import { navigate } from '@/app/router';
import { useProgress } from '@/store/progress';
import { useSettings } from '@/store/settings';
import { dayKey } from '@/engine/dates';
import { QuizBlitz } from '@/engine/quiz-blitz/QuizBlitz';
import type { EngineResult } from '@/engine/scoring';
import { conceptOutcomes } from '@/engine/pipeline';
import { Button } from '@/components/Button';
import { Page, TopBar } from '@/components/Layout';
import { Speech } from '@/components/Mascot';
import { ShapeIcon } from '@/components/Icons';

/**
 * Optional knowledge check. Never gates progress, never touches hearts or meters.
 * Rewards: +10 XP and a ribbon the first time a role reaches 80%; small once-a-day replay XP.
 */
export function TestYourselfScreen({ roleId, worldId }: { roleId?: string; worldId?: string }) {
  const progress = useProgress();
  const relaxed = useSettings((s) => s.relaxed);
  const [phase, setPhase] = useState<'intro' | 'playing' | 'done'>('intro');
  const [result, setResult] = useState<{ fraction: number; xp: number; ribbonNew: boolean } | null>(null);
  const [seed, setSeed] = useState(1);
  const roleIds = useMemo(() => {
    if (roleId) return [roleId];
    return content.roleIndex
      .filter(
        (r) =>
          r.worldId === worldId &&
          Object.values(content.levelById).some(
            (l) => l.roleId === r.id && (progress.levels[l.id]?.stars ?? 0) > 0,
          ),
      )
      .map((r) => r.id);
  }, [roleId, worldId, progress.levels]);
  const questions = useMemo(
    () => roleIds.flatMap((rid) => knowledgeQuestions(rid, (c) => progress.concepts[c]?.box ?? 0)),
    [roleIds, progress.concepts],
  );
  const title = roleId
    ? (content.roleRefById[roleId]?.title ?? 'Test Yourself')
    : `World ${content.worldById[worldId ?? '']?.number ?? ''} knowledge check`;
  const back = roleId ? ({ name: 'codex', roleId } as const) : ({ name: 'map', worldId } as const);

  const onComplete = useCallback(
    (r: EngineResult) => {
      const s = useProgress.getState();
      const fraction = r.total ? r.correct / r.total : 0;
      let xp = 0;
      let ribbonNew = false;
      for (const rid of roleIds) {
        const rec = s.knowledge[rid];
        const today = dayKey();
        if (!rec?.ribbon && fraction >= economy.knowledge.ribbonFraction) {
          xp += economy.xp.knowledgeFirstRibbon;
          ribbonNew = true;
        } else if (rec?.lastPlayedDay !== today)
          xp += Math.min(
            economy.xp.knowledgeReplayMaxPerDay,
            r.correct * economy.xp.knowledgePerCorrectReplay,
          );
        s.recordKnowledge(rid, fraction, roleIds.length > 1 ? Math.round(xp / roleIds.length) : xp);
        if (roleIds.length > 1) xp = 0;
      }
      for (const c of conceptOutcomes(
        questions.map((q) => q.conceptId),
        r.mistakes,
      ))
        s.recordConcept(c.conceptId, c.correct);
      setResult({ fraction, xp: useProgress.getState().xp - s.xp + xp, ribbonNew });
      setPhase('done');
    },
    [roleIds, questions],
  );

  if (questions.length === 0) {
    return (
      <Page nav={roleId ? 'codex' : 'map'}>
        <TopBar title="Test Yourself" back={back} />
        <p className="text-sm text-muted">No questions yet for this selection. Finish a level first.</p>
      </Page>
    );
  }

  if (phase === 'intro') {
    return (
      <Page nav={roleId ? 'codex' : 'map'}>
        <TopBar title="Test Yourself" back={back} />
        <div className="rounded-card bg-surface p-4 shadow-card">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">Optional knowledge check</p>
          <h1 className="text-xl font-black">{title}</h1>
          <p className="mt-2 text-sm text-muted">
            {questions.length} questions. No hearts, no meters, nothing to unlock. Score 80% for the Knowledge
            Check ribbon. Missed concepts come first.
          </p>
          <div className="mt-3 flex gap-2" aria-hidden="true">
            <span className="rounded-lg bg-ans-red p-1.5 text-white">
              <ShapeIcon shape="triangle" size={16} />
            </span>
            <span className="rounded-lg bg-ans-blue p-1.5 text-white">
              <ShapeIcon shape="diamond" size={16} />
            </span>
            <span className="rounded-lg bg-ans-yellow p-1.5 text-white">
              <ShapeIcon shape="circle" size={16} />
            </span>
            <span className="rounded-lg bg-ans-green p-1.5 text-white">
              <ShapeIcon shape="square" size={16} />
            </span>
          </div>
        </div>
        <Speech mood="think" className="mt-3">
          Pure bonus. Skip it and you lose nothing.
        </Speech>
        <Button
          size="lg"
          full
          className="mt-4"
          onClick={() => {
            setSeed((Date.now() % 1_000_000) + 1);
            setPhase('playing');
          }}
          data-testid="start-test"
        >
          Start
        </Button>
      </Page>
    );
  }

  if (phase === 'playing') {
    return (
      <Page>
        <TopBar title={title} back={back} />
        <QuizBlitz
          questions={questions}
          secondsPerQuestion={economy.quiz.defaultSecondsPerQuestion}
          relaxed={relaxed}
          mode="review"
          seed={seed}
          onComplete={onComplete}
        />
      </Page>
    );
  }

  return (
    <Page nav={roleId ? 'codex' : 'map'}>
      <TopBar title="Test Yourself" back={back} />
      <div className="rounded-card bg-surface p-4 text-center shadow-card" data-testid="test-result">
        <p className="text-3xl font-black">{Math.round((result?.fraction ?? 0) * 100)}%</p>
        {result?.ribbonNew && (
          <p className="mt-1 font-bold text-brand-700 dark:text-brand-300">
            🎗️ Knowledge Check ribbon earned
          </p>
        )}
        {result && result.xp > 0 && <p className="mt-1 text-sm">+{result.xp} XP (bonus)</p>}
        {result && result.xp === 0 && (
          <p className="mt-1 text-sm text-muted">
            Replay XP is once a day. Missed concepts will come first next time.
          </p>
        )}
      </div>
      <Button size="lg" full className="mt-4" onClick={() => navigate(back)}>
        Done
      </Button>
    </Page>
  );
}
