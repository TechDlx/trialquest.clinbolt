# Amendment 1 — proposed TypeScript types

Status: proposal for approval. These would be added to `src/content/types.ts` (content
schema) and `src/store/progress.ts` (persistence). Nothing here is implemented yet.

## 1. Every scorable item gets an `id`, and may carry a shortcut

```ts
/** Base for anything an engine scores: a card, a part, a choice, a pair, a queue item. */
export interface ScoredItem {
  /** Stable within its level; used for review micro-rounds and Maya cameos. */
  id: string;
  /** Optional tempting shortcut: helps timeline/budget, hurts safety or integrity. */
  shortcut?: Shortcut;
}

export interface Shortcut {
  /** Meter deltas applied the moment the option is chosen (e.g. { timeline: 10, safety: -15 }). */
  meters: Partial<Record<MeterId, number>>;
  /** One-line Dose aside shown when chosen, and repeated in the debrief. */
  why: string;
}
```

Engine configs extend this: `BucketCard extends ScoredItem`, `BuilderPart extends
ScoredItem`, `ScenarioChoice extends ScoredItem`, `ImpostorCard extends ScoredItem`,
`SequenceItem`, `MatchPair`, `DashItem`, `AllocatorCategory`. Engines accept
`onlyItems?: string[]` at runtime to restrict a config to a subset (review
micro-rounds, crisis rounds).

## 2. Simulation block (allocator + builder only)

```ts
export type SimulationKind = 'dose-response' | 'trial-power' | 'pk-next-dose' | 'price-access';

export interface SimulationBlock {
  kind: SimulationKind;
  /** Which input drives the bands: an allocator category id, or the builder slot id. */
  inputId: string;
  /** Ordered, non-overlapping ranges over the committed value (allocator) or part ids (builder). */
  bands: SimulationBand[];
  /** Band the player should land in for full accuracy; adjacent bands score 0.5. */
  targetBand: string;
  /** Reveal animation length in seconds (3–6). Skipped instantly under reduced motion. */
  revealSeconds: number;
  /** Copy for the "Commit" button, e.g. "Dose the first cohort". */
  commitLabel: string;
}

export interface SimulationBand {
  /** Becomes the artifact tag when the level emits one (e.g. 'cautious' | 'standard' | 'aggressive'). */
  tag: string;
  label: string;
  /** Allocator: inclusive numeric range. Builder: the part ids that map to this band. */
  range?: [number, number];
  parts?: string[];
  /** What the player sees happen, 1–2 sentences. */
  narration: string;
  meters?: Partial<Record<MeterId, number>>;
  /** Real-world consequence text for the debrief when this band is not the target. */
  consequence?: string;
  visual: SimulationVisual;
}

export type SimulationVisual =
  | { kind: 'dose-response'; cohort: number; responders: number; adverse: number; severe: number }
  | { kind: 'trial-power'; power: number; costMillions: number; months: number; successfulRunsOf100: number }
  | { kind: 'pk-next-dose'; exposure: number; safetyCeiling: number; points: { t: number; c: number }[] }
  | { kind: 'price-access'; coveragePct: number; patientsReachedPct: number; revenueIndex: number };

// Added to the two engine configs:
export interface AllocatorConfig { engine: 'allocator'; /* …existing… */ simulation?: SimulationBlock }
export interface BuilderConfig  { engine: 'builder';  /* …existing… */ simulation?: SimulationBlock }
```

Runtime rule: with a `simulation` block, the engine's own accuracy (constraints or
slots) is averaged with the band accuracy (target 1, adjacent 0.5, else 0). The
band's `tag` is exposed in the engine result as `outcomes.band` for artifact emission.

## 3. Artifacts (playable hand-offs)

```ts
export type ArtifactKey =
  // chain a
  | 'protocol.criteria' | 'ecrf.fields' | 'screening.eligibility' | 'monitoring.deviations'
  // chain b
  | 'ae.report' | 'ae.coded' | 'safety.report' | 'label.warnings'
  // chain c
  | 'dose.starting' | 'phase1.escalation' | 'phase1.hold';

/** Declared once per key in src/content/artifacts.ts. */
export interface ArtifactSpec {
  key: ArtifactKey;
  title: string;                 // "Starting dose"
  description: string;           // shown on the Handoff Map edge
  tags: readonly string[];       // every tag a consumer may branch on
  defaultTag: string;            // used when the artifact was never emitted (standalone / replay)
}

/** What a level writes into the store when it completes. */
export interface EmitSpec {
  key: ArtifactKey;
  /** Evaluated against the engine result in order; first match wins; else the spec's defaultTag. */
  outcomes: { tag: string; when: OutcomeRule }[];
  /** Optional extra data copied from the result for display (e.g. { mgPerKg: 3 }). */
  data?: Record<string, 'inputValue' | 'endNode' | 'accuracy'>;
}

/** Engine-agnostic rules; each engine fills the fields it knows about. */
export interface OutcomeRule {
  accuracyAtLeast?: number;      // any engine
  band?: string;                 // allocator/builder with simulation
  endNode?: string;              // branching-scenario
  chosePart?: string;            // builder (part id in any slot)
  bucketOf?: { itemId: string; bucketId: string }; // bucket-sort
  accused?: string;              // spot-the-impostor
}

/** How a later level changes when an artifact is present. */
export interface LevelVariant {
  when: Partial<Record<ArtifactKey, string>>;   // all listed key:tag pairs must match
  patch: {
    intro?: string;
    game?: DeepPartial<MiniGameConfig>;         // shallow-merged per top-level field; arrays replace
    debrief?: Partial<Debrief>;
    meterOpening?: Partial<Record<MeterId, number>>; // e.g. the W4 hold's -20 safety hit
  };
}

// Added to Level (and to CrisisRound, scoped to the crisis):
export interface Level {
  /* …existing… */
  emits?: EmitSpec[];
  consumes?: ArtifactKey[];
  variants?: LevelVariant[];
}

/** Persisted (store v2). */
export interface StoredArtifact {
  key: ArtifactKey;
  tag: string;
  data?: Record<string, string | number | boolean>;
  emittedBy: string;   // level id
  emittedAt: string;   // ISO
}
```

Validator rules: every `consumes` key is emitted by a level earlier in node order
(**fail**); every `variants[].when` tag is in the emitter spec's `tags` (**fail**);
every `emits[].outcomes[].tag` is in `tags` (**fail**); a level with no item marked
`shortcut` (**warn**).

## 4. Crisis boss

```ts
export interface CrisisRound {
  id: string;
  roleId: string;                 // must belong to the crisis's world
  seconds: number;                // 15–40
  /** One-line brief shown with the mini badge swap. */
  brief: string;
  game: MiniGameConfig;           // small config; engines other than quiz-blitz
  onlyItems?: string[];           // optional subset of the config
  /** Applied when the round fails (accuracy < clearThreshold). */
  meterHit?: Partial<Record<MeterId, number>>;
  /** Same variant mechanism as levels, keyed on earlier rounds' emitted tags. */
  emits?: EmitSpec[];
  variants?: LevelVariant[];
}

export interface CrisisBoss {
  id: string;                     // 'w1-crisis'
  worldId: WorldId;
  title: string;                  // "Day 212: liver signal"
  /** 2–3 short paragraphs setting up the emergency. */
  situation: string[];
  rounds: CrisisRound[];          // 4–7
  /** Fraction of Σ round seconds added as slack (default 0.15). */
  slack?: number;
  clearThreshold?: number;        // default 0.6
  passFraction?: number;          // default 0.6 of rounds cleared
  resolution: { success: StoryBeat; partial: StoryBeat; fail: StoryBeat };
}

// MapNode gains { kind: 'crisis'; id } and loses { kind: 'boss' }.
```

Economy additions (`economy.crisis`): `clearThreshold 0.6`, `passFraction 0.6`,
`slack 0.15`, `basePoints 100`, `speedPoints 50`, streak tiers unchanged,
`failedRoundHeart 1`.

## 5. Test Yourself (knowledge checks)

```ts
export interface KnowledgeCheck {
  id: string;                     // 'kc-<roleId>'
  roleId: string;
  questions: QuizQuestion[];      // unchanged QuizQuestion shape; the 32 W1 questions move here
  secondsPerQuestion?: number;    // default economy.quiz.defaultSecondsPerQuestion
}

/** Persisted (store v2). */
export interface KnowledgeRecord {
  attempts: number;
  bestFraction: number;           // 0..1
  ribbon: boolean;                // bestFraction >= 0.8
  lastPlayedDay?: string;         // YYYY-MM-DD, for the once-per-day replay XP
}
```

Quiz-blitz runtime: `onMistake` becomes optional and the Test Yourself host never
supplies one, so hearts and meters cannot be touched from this mode.

## 6. Maya cameo

```ts
export type MayaPresentation = 'queue' | 'data-row' | 'blinded-point' | 'dialogue' | 'consent';

export interface MayaCameo {
  /** A ScoredItem id in this level's config. */
  itemId: string;
  presentation: MayaPresentation;
  /** How she is shown in-level, e.g. "Participant 0417". */
  label: string;
  /** Debrief line revealing the cameo after the task, never during it. */
  debriefLine: string;
}

export interface Level { /* …existing… */ mayaCameo?: MayaCameo }
```

Validator: `mayaCameo.itemId` must exist in the level's config (**fail**);
`mayaCameo` only allowed on worlds ≥ 5 (**warn**).

## 7. Review nodes (situations)

```ts
/** Persisted (store v2), replaces `concepts` for review scheduling. */
export interface SituationRecord {
  levelId: string;
  itemId: string;
  box: number;      // 1..5
  dueAt: string;
  misses: number;
}
// key: `${levelId}:${itemId}`

export interface ReviewNode {
  id: string;
  worldId: WorldId;
  title: string;
  maxRounds?: number;       // default 6
  roundSeconds?: number;    // default 20
}
```

`concepts` stays (still fed by Test Yourself) but no longer drives review nodes.

## 8. Store schema v2 (migration v1 → v2)

```ts
interface ProgressDataV2 extends ProgressDataV1 {
  artifacts: Record<ArtifactKey, StoredArtifact>;   // new, {}
  knowledge: Record<string, KnowledgeRecord>;        // new, {} (keyed by roleId)
  situations: Record<string, SituationRecord>;       // new, {}
  crises: Record<string, CrisisRecord>;              // renamed from `bosses`; records copied
}
interface CrisisRecord { stars: number; bestPoints: number; attempts: number; completedAt?: string }
```

Migration copies `bosses` into `crises` under the same ids (w1-boss → w1-crisis
rename applied), initialises the three new maps, and leaves everything else intact.
Covered by a unit test with a real v1 fixture.
