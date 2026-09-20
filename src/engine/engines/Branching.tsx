import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { BranchingConfig, ScenarioChoice } from '@/content/types';
import { economy } from '@/content/economy';
import { emptyOutcomes, type EngineResult, type ItemOutcome } from '@/engine/scoring';
import { findNodeOfChoice } from '@/engine/registry';
import { Button } from '@/components/Button';
import { RichText } from '@/components/RichText';
import { MayaTag } from '@/components/MayaTag';
import { Feedback, adaptFeedback, type FeedbackKind } from './Feedback';
import type { EngineProps, ScoredSnapshot } from './types';

const QUALITY: Record<ScenarioChoice['quality'], number> = { best: 1, ok: 0.5, bad: 0 };

interface Pending {
  kind: FeedbackKind;
  title: string;
  confirm?: string;
  explanation: string;
  note?: string;
  next: string;
}

type Snap = ScoredSnapshot & {
  nodeId: string;
  pending: Pending | null;
  decisions: { choiceId: string; quality: number; outcome: ItemOutcome }[];
};

/** Dialogue tree. `onlyItems` = [choiceId] replays the single decision that contains that choice. */
export function Branching(p: EngineProps<BranchingConfig>) {
  const startId = useMemo(() => {
    if (p.onlyItems?.length) return findNodeOfChoice(p.config.nodes, p.onlyItems[0]!)?.id ?? p.config.start;
    return p.config.start;
  }, [p.config, p.onlyItems]);
  const single = !!p.onlyItems?.length;
  const snap = p.snapshot as Partial<Snap> | undefined;
  const [nodeId, setNodeId] = useState(snap?.nodeId ?? startId);
  const [pending, setPending] = useState<Pending | null>(snap?.pending ?? null);

  const { onHold } = p;
  useEffect(() => {
    onHold?.(!!pending);
  }, [pending, onHold]);
  const [decisions, setDecisions] = useState<{ choiceId: string; quality: number; outcome: ItemOutcome }[]>(
    snap?.decisions ?? [],
  );
  const [heartsLost, setHeartsLost] = useState(snap?.heartsLost ?? 0);
  const [mistakes, setMistakes] = useState<EngineResult['mistakes']>(snap?.mistakes ?? []);
  const [shortcuts, setShortcuts] = useState<EngineResult['shortcuts']>(snap?.shortcuts ?? []);
  const usedCarriers = useRef(new Set<string>(snap?.usedCarriers ?? []));
  const done = useRef(false);

  // Every state change is reported so the host can checkpoint per item (resume after leaving).
  const { onSnapshot } = p;
  useEffect(() => {
    onSnapshot?.({
      nodeId,
      pending,
      decisions,
      heartsLost,
      mistakes,
      shortcuts,
      usedCarriers: [...usedCarriers.current],
    } satisfies Snap);
  }, [onSnapshot, nodeId, pending, decisions, heartsLost, mistakes, shortcuts]);

  const node = p.config.nodes.find((n) => n.id === nodeId);

  const finish = useCallback(
    (endNode: string, ds: typeof decisions) => {
      if (done.current) return;
      done.current = true;
      const itemResults: Record<string, ItemOutcome> = {};
      for (const d of ds) itemResults[d.choiceId] = d.outcome;
      const total = ds.length || 1;
      const correct = ds.filter((d) => d.quality === 1).length;
      p.onComplete({
        accuracy: ds.reduce((s, d) => s + d.quality, 0) / total,
        speed: p.relaxed || p.remainingFraction >= 1 ? economy.score.relaxedSpeed : p.remainingFraction,
        mistakes,
        shortcuts,
        itemResults,
        outcomes: { ...emptyOutcomes(), endNode, shortcutsTaken: shortcuts.map((s) => s.itemId) },
        correct,
        total: ds.length,
        heartsLost,
      });
    },
    [mistakes, shortcuts, heartsLost, p],
  );

  useEffect(() => {
    if (p.timeUp && !done.current) finish(nodeId, decisions);
  }, [p.timeUp, finish, nodeId, decisions]);

  const choose = (c: ScenarioChoice) => {
    if (pending || p.paused || !node) return;
    let outcome: ItemOutcome = c.quality === 'best' ? 'correct' : 'wrong';
    let note: string | undefined;
    let kind: FeedbackKind = c.quality === 'best' ? 'correct' : c.quality === 'ok' ? 'info' : 'wrong';
    if (c.shortcut) {
      outcome = 'shortcut';
      kind = 'shortcut';
      const ev = { itemId: c.id, meters: c.shortcut.meters, why: c.shortcut.why };
      if (!usedCarriers.current.has(c.id)) {
        usedCarriers.current.add(c.id);
        p.onShortcut(ev);
      }
      setShortcuts((s) => [...s, ev]);
      note = 'Shortcut taken. Not counted as correct. Meters changed.';
    } else if (c.quality === 'bad') {
      const best = node.choices?.find((x) => x.quality === 'best');
      const m = {
        itemId: c.id,
        conceptId: c.conceptId,
        prompt: node.text,
        chosen: c.text,
        correctAnswer: best?.text ?? '',
        explanation: c.explanation,
        consequence: c.consequence,
      };
      setMistakes((ms) => [...ms, m]);
      const fb = p.onMistake(m);
      if (fb.heartLost) setHeartsLost((h) => h + 1);
      note = fb.note;
    }
    if (c.meters && !c.shortcut) p.onMeters(c.meters, c.text);
    setDecisions((d) => [...d, { choiceId: c.id, quality: QUALITY[c.quality], outcome }]);
    setPending({
      kind,
      title:
        c.quality === 'best'
          ? 'Good call.'
          : c.quality === 'ok'
            ? 'Defensible, not ideal.'
            : c.shortcut
              ? 'Shortcut taken'
              : 'That one costs.',
      confirm: c.confirm,
      explanation: c.explanation,
      note,
      next: c.next,
    });
  };

  const advance = () => {
    if (!pending) return;
    const nextId = pending.next;
    setPending(null);
    if (single) {
      finish(nextId, decisions);
      return;
    }
    setNodeId(nextId);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (p.paused) return;
      if (!pending && node?.choices && e.key >= '1' && e.key <= '3') {
        const c = node.choices[Number(e.key) - 1];
        if (c) choose(c);
      } else if (pending && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        advance();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!node) return null;

  if (node.end) {
    return (
      <div className="flex flex-1 flex-col gap-3" data-testid="branching">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-card bg-surface p-4 shadow-card"
        >
          <RichText as="p" text={node.text} className="text-base leading-relaxed" />
          <RichText
            as="p"
            text={node.end.summary}
            className="mt-3 text-sm font-bold text-brand-700 dark:text-brand-300"
          />
        </motion.div>
        <Button onClick={() => finish(node.id, decisions)} full data-testid="branching-finish">
          Finish
        </Button>
      </div>
    );
  }

  const shown = adaptFeedback(p.mode, pending);

  return (
    <div className="flex flex-1 flex-col gap-3" data-testid="branching">
      <p className="text-xs font-bold uppercase tracking-wide text-muted" data-testid="engine-progress">
        Decision {decisions.length + (pending ? 0 : 1)}
      </p>
      <motion.div
        key={node.id}
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        className="rounded-card bg-surface p-4 shadow-card"
      >
        {p.cameo?.itemId === node.id ? (
          <MayaTag label={p.cameo.label} />
        ) : (
          node.speaker && (
            <p className="text-xs font-bold uppercase tracking-wide text-brand-700 dark:text-brand-300">
              {node.speaker}
            </p>
          )
        )}
        <RichText as="p" text={node.text} className="mt-1 text-base leading-relaxed" />
      </motion.div>
      {!pending && (
        <div className="grid gap-2" role="group" aria-label="Choices">
          {node.choices?.map((c, i) => (
            <button
              key={c.id}
              type="button"
              onClick={() => choose(c)}
              disabled={p.paused}
              data-testid={`choice-${c.id}`}
              className={`tap flex items-start gap-2 rounded-2xl border-2 px-3 py-3 text-left text-sm font-semibold shadow-card transition enabled:active:scale-[0.99] ${
                c.shortcut
                  ? 'border-star bg-star-soft text-amber-950'
                  : 'border-border bg-surface hover:border-brand-500'
              }`}
            >
              <kbd className="mt-0.5 hidden rounded bg-black/10 px-1 text-xs sm:inline">{i + 1}</kbd>
              <RichText text={c.text} interactive={false} />
            </button>
          ))}
        </div>
      )}
      {shown && (
        <Feedback
          auto={shown.auto}
          inline={shown.inline}
          ms={shown.ms}
          kind={shown.kind}
          title={shown.title}
          explanation={shown.explanation}
          note={shown.note}
          nextLabel="Continue"
          onNext={advance}
        />
      )}
    </div>
  );
}
