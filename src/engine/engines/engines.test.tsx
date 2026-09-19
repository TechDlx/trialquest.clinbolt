import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { content } from '@/content';
import type {
  AllocatorConfig,
  BranchingConfig,
  BucketSortConfig,
  BuilderConfig,
  DashConfig,
  ImpostorConfig,
  MatchPairsConfig,
  SequenceSortConfig,
} from '@/content/types';
import { BucketSort } from './BucketSort';
import { Branching } from './Branching';
import { Builder } from './Builder';
import { Impostor } from './Impostor';
import { Allocator, bandFor, combinedNegatives, interpolateCurve } from './Allocator';
import { SequenceSort } from './SequenceSort';
import { MatchPairs } from './MatchPairs';
import { DashManager } from './DashManager';
import type { EngineResult } from '@/engine/scoring';
import type { EngineSnapshot } from './types';

function host() {
  return {
    seed: 1,
    paused: false,
    relaxed: true,
    remainingFraction: 1,
    timeUp: false,
    mode: 'level' as const,
    onMistake: vi.fn(() => ({ heartLost: true })),
    onShortcut: vi.fn(),
    onMeters: vi.fn(),
    onComplete: vi.fn<(r: EngineResult) => void>(),
  };
}
const next = () => fireEvent.click(screen.getByTestId('engine-next'));
/** Correct answers show an inline confirmation and auto-advance; wrong ones wait for Next. */
const advance = () =>
  waitFor(() => expect(screen.queryByTestId('engine-feedback')).toBeNull(), { timeout: 3000 });
const w1 = (id: string, stage: number) => content.levelById[id]!.stages[stage]!.game;

describe('BucketSort', () => {
  it('scores correct, wrong and shortcut placements; shortcut fires once per carrier', async () => {
    const h = host();
    const cfg = w1('w1-l3', 0) as BucketSortConfig;
    render(<BucketSort {...h} config={cfg} onlyItems={['alt', 'skin', 'hypertrophy']} />);
    // Cards are seeded-shuffled; read each card's text and sort it deliberately.
    const cardById = Object.fromEntries(
      cfg.cards.map((c) => [c.text.replace(/\[\[[^\]|]+\|([^\]]+)\]\]/g, '$1'), c]),
    );
    for (let i = 0; i < 3; i++) {
      const text = screen.getByTestId('bucket-card').textContent!.trim();
      const card = cardById[text]!;
      if (i === 0) fireEvent.click(screen.getByTestId(`bucket-${card.bucketId}`));
      else if (i === 1) fireEvent.click(screen.getByTestId('bucket-noise'));
      else
        fireEvent.click(
          screen.getByTestId(`bucket-${card.bucketId === 'adverse' ? 'not-adverse' : 'adverse'}`),
        );
      if (i === 0) {
        expect(screen.getByTestId('engine-feedback')).toHaveAttribute('data-inline', 'true');
        await advance();
      } else next();
    }
    expect(h.onShortcut).toHaveBeenCalledTimes(1);
    expect(h.onShortcut.mock.calls[0]![0]).toMatchObject({
      itemId: 'noise',
      meters: { timeline: 10, safety: -15 },
    });
    expect(h.onMistake).toHaveBeenCalledTimes(1);
    const r = h.onComplete.mock.calls[0]![0];
    expect(r.total).toBe(3);
    expect(r.correct).toBe(1);
    expect(Object.values(r.itemResults).sort()).toEqual(['correct', 'shortcut', 'wrong']);
    expect(r.outcomes.shortcutsTaken).toEqual(['noise']);
    expect(r.speed).toBe(0.5);
  });

  it('finishes with skipped cards when time runs out', () => {
    const h = host();
    const { rerender } = render(
      <BucketSort {...h} config={w1('w1-l3', 0) as BucketSortConfig} relaxed={false} />,
    );
    rerender(
      <BucketSort
        {...h}
        config={w1('w1-l3', 0) as BucketSortConfig}
        relaxed={false}
        timeUp
        remainingFraction={0}
      />,
    );
    const r = h.onComplete.mock.calls[0]![0];
    expect(r.total).toBe(5);
    expect(Object.values(r.itemResults).every((v) => v === 'skipped')).toBe(true);
  });
});

describe('Branching', () => {
  it('walks the tree, applies choice meters, treats a shortcut as not-correct without a heart, and reports the end node', () => {
    const h = host();
    render(<Branching {...h} config={w1('w1-l1', 0) as BranchingConfig} />);
    fireEvent.click(screen.getByTestId('choice-c-later'));
    expect(h.onMeters).toHaveBeenCalledWith({ timeline: -5 }, expect.any(String));
    next();
    fireEvent.click(screen.getByTestId('choice-c-fastest'));
    expect(h.onMistake).toHaveBeenCalledTimes(1);
    next();
    fireEvent.click(screen.getByTestId('choice-c-hype'));
    expect(h.onShortcut).toHaveBeenCalledTimes(1);
    expect(h.onMistake).toHaveBeenCalledTimes(1);
    next();
    fireEvent.click(screen.getByTestId('branching-finish'));
    const r = h.onComplete.mock.calls[0]![0];
    expect(r.outcomes.endNode).toBe('end-hype');
    expect(r.accuracy).toBeCloseTo(0.5 / 3);
    expect(r.itemResults['c-hype']).toBe('shortcut');
  });

  it('onlyItems replays a single decision and finishes after it', async () => {
    const h = host();
    render(<Branching {...h} config={w1('w1-l1', 0) as BranchingConfig} onlyItems={['c-marker']} />);
    expect(screen.getByTestId('choice-c-fatigue')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('choice-c-fatigue'));
    await advance();
    expect(h.onComplete).toHaveBeenCalledTimes(1);
    expect(h.onComplete.mock.calls[0]![0].accuracy).toBe(1);
  });
});

describe('Builder', () => {
  it('checks slots, costs a heart per wrong submit, locks correct slots, and finishes when built', async () => {
    const h = host();
    const cfg = w1('w1-l4', 0) as BuilderConfig;
    render(<Builder {...h} config={cfg} />);
    const place = (part: string, slot: string) => {
      fireEvent.click(screen.getByTestId(`part-${part}`));
      fireEvent.click(screen.getByTestId(`slot-${slot}`));
    };
    place('iv-bag', 'form');
    place('lactose-coat', 'excipient');
    place('assay-dissolution', 'test');
    place('borrowed-stability', 'storage');
    expect(h.onShortcut).toHaveBeenCalledTimes(1);
    next(); // shortcut aside
    fireEvent.click(screen.getByTestId('builder-check'));
    expect(h.onMistake).toHaveBeenCalledTimes(1);
    next();
    fireEvent.click(screen.getByTestId('slot-form')); // clear the wrong part
    place('capsule', 'form');
    fireEvent.click(screen.getByTestId('slot-storage'));
    place('below-25', 'storage');
    fireEvent.click(screen.getByTestId('builder-check'));
    await advance();
    const r = h.onComplete.mock.calls[0]![0];
    expect(r.correct).toBe(4);
    expect(r.outcomes.parts).toMatchObject({ form: 'capsule', storage: 'below-25' });
    expect(r.shortcuts[0]!.itemId).toBe('borrowed-stability');
  });
});

describe('Impostor', () => {
  it('inspect, accuse wrong (heart), accuse right (finish); sign-off is a shortcut', async () => {
    const h = host();
    render(<Impostor {...h} config={w1('w1-l2', 0) as ImpostorConfig} />);
    fireEvent.click(screen.getByTestId('card-vx-088'));
    fireEvent.click(screen.getByTestId('impostor-accuse'));
    expect(h.onMistake).toHaveBeenCalledTimes(1);
    next();
    fireEvent.click(screen.getByTestId('card-vx-101'));
    fireEvent.click(screen.getByTestId('impostor-accuse'));
    await advance();
    const r = h.onComplete.mock.calls[0]![0];
    expect(r.outcomes.accused).toEqual(['vx-088', 'vx-101']);
    expect(r.accuracy).toBe(0.5);
    expect(r.correct).toBe(1);
  });
  it('sign-off ends the stage as a shortcut', () => {
    const h = host();
    render(<Impostor {...h} config={w1('w1-l2', 0) as ImpostorConfig} />);
    fireEvent.click(screen.getByTestId('shortcut-nominate-potent'));
    next();
    expect(h.onShortcut).toHaveBeenCalledTimes(1);
    expect(h.onComplete.mock.calls[0]![0].accuracy).toBe(0);
  });
});

describe('Allocator with simulation', () => {
  const cfg = w1('w1-l3', 1) as AllocatorConfig;
  const sim = cfg.simulation!;

  it('helpers: band lookup is half-open, last band closed; curves interpolate; combined negatives take the worse', () => {
    expect(bandFor(sim, 0.3).band.tag).toBe('standard');
    expect(bandFor(sim, 0.79).band.tag).toBe('standard');
    expect(bandFor(sim, 0.8).band.tag).toBe('aggressive');
    expect(bandFor(sim, 5).band.tag).toBe('reckless');
    expect(interpolateCurve(sim.curves![0]!, 0.4)).toBeCloseTo(17.5);
    expect(combinedNegatives({ timeline: 15, safety: -25 }, { safety: -10, timeline: -10 })).toEqual({
      safety: -25,
      timeline: -10,
    });
  });

  it('first commit is binding: band meters, band in outcomes, then a free sandbox', () => {
    const h = host();
    render(<Allocator {...h} config={cfg} />);
    fireEvent.change(screen.getByTestId('slider-dose'), { target: { value: '0.5' } });
    fireEvent.click(screen.getByTestId('allocator-commit'));
    expect(screen.getByTestId('reveal')).toHaveAttribute('data-band', 'standard');
    expect(screen.getByTestId('reveal-exposure')).toHaveTextContent('25');
    expect(h.onMeters).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('reveal-done'));
    expect(screen.getByTestId('sandbox-banner')).toBeInTheDocument();
    fireEvent.change(screen.getByTestId('slider-dose'), { target: { value: '4' } });
    expect(screen.getByTestId('reveal')).toHaveAttribute('data-band', 'reckless');
    expect(h.onMeters).not.toHaveBeenCalled(); // sandbox never touches meters
    fireEvent.click(screen.getByTestId('sandbox-done'));
    const r = h.onComplete.mock.calls[0]![0];
    expect(r.outcomes.band).toBe('standard');
    expect(r.outcomes.inputValue).toBe(0.5);
    expect(r.accuracy).toBe(1);
    expect(h.onMistake).not.toHaveBeenCalled();
  });

  it('shortcut preset: lure at tap, worse-of negatives at reveal, no double counting', () => {
    const h = host();
    render(<Allocator {...h} config={cfg} />);
    fireEvent.click(screen.getByTestId('preset-use-hed'));
    expect(h.onShortcut).toHaveBeenCalledWith(
      expect.objectContaining({ itemId: 'use-hed', meters: { timeline: 15 } }),
    );
    fireEvent.click(screen.getByTestId('allocator-commit'));
    expect(h.onMeters).toHaveBeenCalledTimes(1);
    expect(h.onMeters.mock.calls[0]![0]).toEqual({ safety: -25, timeline: -10 });
    expect(screen.getByTestId('reveal')).toHaveAttribute('data-band', 'reckless');
    expect(h.onMistake).toHaveBeenCalledTimes(1); // two bands away from target
  });

  it('a manual drag to the preset value is a normal band result', () => {
    const h = host();
    render(<Allocator {...h} config={cfg} />);
    fireEvent.change(screen.getByTestId('slider-dose'), { target: { value: '4.8' } });
    fireEvent.click(screen.getByTestId('allocator-commit'));
    expect(h.onShortcut).not.toHaveBeenCalled();
    expect(h.onMeters.mock.calls[0]![0]).toEqual({ safety: -10, timeline: -10 });
  });
});

describe('SequenceSort / MatchPairs / DashManager', () => {
  const seq: SequenceSortConfig = {
    engine: 'sequence-sort',
    prompt: 'Order',
    seconds: 30,
    items: ['a', 'b', 'c'].map((id) => ({
      id,
      text: id.toUpperCase(),
      explanation: 'because ' + id,
      consequence: 'bad ' + id,
      conceptId: 'gcp',
    })),
  };
  it('sequence: swapping by tap and checking reports position accuracy', async () => {
    const h = host();
    render(<SequenceSort {...h} config={seq} />);
    // Put into correct order using the buttons: read current order from the list.
    const order = () =>
      screen.getAllByRole('listitem').map((li) => li.textContent!.replace(/[▲▼\d]/g, '').trim());
    for (let pass = 0; pass < 3; pass++) {
      const cur = order();
      const want = ['A', 'B', 'C'];
      const i = cur.findIndex((x, k) => x !== want[k]);
      if (i < 0) break;
      const j = cur.indexOf(want[i]!);
      fireEvent.click(screen.getByTestId(`seq-${cur[i]!.toLowerCase()}`));
      fireEvent.click(screen.getByTestId(`seq-${cur[j]!.toLowerCase()}`));
    }
    fireEvent.click(screen.getByTestId('sequence-check'));
    await advance();
    expect(h.onComplete.mock.calls[0]![0].accuracy).toBe(1);
  });

  it('match: a wrong pair costs a heart, all matched finishes', async () => {
    const h = host();
    const cfg: MatchPairsConfig = {
      engine: 'match-pairs',
      prompt: 'Match',
      seconds: 30,
      pairs: ['x', 'y', 'z'].map((id) => ({
        id,
        left: id,
        right: id + '!',
        explanation: 'e ' + id,
        consequence: 'c ' + id,
        conceptId: 'gcp',
      })),
    };
    render(<MatchPairs {...h} config={cfg} />);
    fireEvent.click(screen.getByTestId('left-x'));
    fireEvent.click(screen.getByTestId('right-y'));
    expect(h.onMistake).toHaveBeenCalledTimes(1);
    next();
    for (const id of ['x', 'y', 'z']) {
      fireEvent.click(screen.getByTestId(`left-${id}`));
      fireEvent.click(screen.getByTestId(`right-${id}`));
      await advance();
    }
    const r = h.onComplete.mock.calls[0]![0];
    expect(r.correct).toBe(3);
    expect(r.accuracy).toBe(0.75);
  });

  it('dash: serving an item through its stations counts as correct; a shortcut station does not', () => {
    vi.useFakeTimers();
    const h = host();
    const cfg: DashConfig = {
      engine: 'dash-manager',
      prompt: 'Serve',
      seconds: 60,
      stations: [
        { id: 's1', label: 'Check in' },
        { id: 's2', label: 'Dose' },
        {
          id: 'skip',
          label: 'Skip ID check',
          shortcut: { meters: { timeline: 10, integrity: -10 }, why: 'why' },
        },
      ],
      items: [
        {
          id: 'p1',
          label: 'Patient 1',
          steps: ['s1', 's2'],
          patienceSeconds: 30,
          arrivesAt: 0,
          explanation: 'e',
          consequence: 'c',
          conceptId: 'gcp',
        },
        {
          id: 'p2',
          label: 'Patient 2',
          steps: ['s1', 's2'],
          patienceSeconds: 30,
          arrivesAt: 0,
          explanation: 'e',
          consequence: 'c',
          conceptId: 'gcp',
        },
      ],
    };
    render(<DashManager {...h} config={cfg} />);
    act(() => vi.advanceTimersByTime(300));
    fireEvent.click(screen.getByTestId('dash-item-p1'));
    fireEvent.click(screen.getByTestId('station-s1'));
    fireEvent.click(screen.getByTestId('station-s2'));
    fireEvent.click(screen.getByTestId('dash-item-p2'));
    fireEvent.click(screen.getByTestId('station-skip'));
    next();
    const r = h.onComplete.mock.calls[0]![0];
    expect(r.itemResults).toEqual({ p1: 'correct', p2: 'shortcut' });
    expect(h.onShortcut).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});

describe('snapshots: an engine resumes exactly where it stopped', () => {
  it('branching: the node, decisions, pending explanation and hearts survive a remount', () => {
    const h = host();
    const snaps: EngineSnapshot[] = [];
    const cfg = w1('w1-l1', 0) as BranchingConfig;
    const { unmount } = render(<Branching {...h} config={cfg} onSnapshot={(x) => snaps.push(x)} />);
    fireEvent.click(screen.getByTestId('choice-c-later'));
    next();
    fireEvent.click(screen.getByTestId('choice-c-fastest')); // a mistake, explanation left open
    expect(h.onMistake).toHaveBeenCalledTimes(1);
    const saved = snaps.at(-1)!;
    unmount();

    const h2 = host();
    render(<Branching {...h2} config={cfg} snapshot={saved} />);
    expect(screen.getByTestId('engine-feedback')).toBeInTheDocument(); // same explanation still up
    expect(h2.onMistake).not.toHaveBeenCalled(); // not charged again
    next();
    fireEvent.click(screen.getByTestId('choice-c-hype'));
    next();
    fireEvent.click(screen.getByTestId('branching-finish'));
    const r = h2.onComplete.mock.calls[0]![0];
    expect(r.outcomes.endNode).toBe('end-hype');
    expect(r.mistakes).toHaveLength(1);
    expect(r.heartsLost).toBe(1);
    expect(r.itemResults).toMatchObject({ 'c-later': 'wrong', 'c-fastest': 'wrong', 'c-hype': 'shortcut' });
  });

  it('allocator: a committed simulation resumes in the reveal with the binding value', () => {
    const h = host();
    const snaps: EngineSnapshot[] = [];
    const cfg = w1('w1-l3', 1) as AllocatorConfig;
    const { unmount } = render(<Allocator {...h} config={cfg} onSnapshot={(x) => snaps.push(x)} />);
    fireEvent.change(screen.getByTestId('slider-dose'), { target: { value: '0.5' } });
    fireEvent.click(screen.getByTestId('allocator-commit'));
    expect(screen.getByTestId('reveal')).toHaveAttribute('data-band', 'standard');
    const saved = snaps.at(-1)!;
    unmount();

    const h2 = host();
    render(<Allocator {...h2} config={cfg} snapshot={saved} />);
    expect(screen.getByTestId('allocator')).toHaveAttribute('data-phase', 'reveal');
    expect(screen.getByTestId('reveal')).toHaveAttribute('data-band', 'standard');
    fireEvent.click(screen.getByTestId('reveal-done'));
    fireEvent.change(screen.getByTestId('slider-dose'), { target: { value: '4' } });
    fireEvent.click(screen.getByTestId('sandbox-done'));
    const r = h2.onComplete.mock.calls[0]![0];
    expect(r.outcomes.band).toBe('standard');
    expect(r.outcomes.inputValue).toBe(0.5);
  });
});

describe('crisis mode defers explanations', () => {
  it('flashes and auto-advances on wrong answers too; no Next button while the pool runs', async () => {
    const h = { ...host(), mode: 'crisis' as const };
    render(<BucketSort {...h} config={w1('w1-l3', 0) as BucketSortConfig} onlyItems={['alt']} />);
    fireEvent.click(screen.getByTestId('bucket-not-adverse'));
    expect(screen.getByTestId('engine-feedback')).toHaveAttribute('data-inline', 'true');
    expect(screen.queryByTestId('engine-next')).toBeNull();
    expect(h.onMistake).toHaveBeenCalledTimes(1);
    await advance();
    expect(h.onComplete).toHaveBeenCalledTimes(1);
  });
});
