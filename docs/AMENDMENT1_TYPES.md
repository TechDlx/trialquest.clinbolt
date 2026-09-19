# Amendment 1 — proposed TypeScript types (revision 3)

Status: approved in principle (revision 2); revision 3 applies the four requested changes
and adds the worked chain (c) appendix. §0 is implemented; everything else is not yet.
Schema changes that writing the appendix forced are listed in Appendix B.

Conventions used below:

- **FAIL** = content validator fails the build. **WARN** = validator prints a warning.
- "Item" = any `ScoredItem` (card, part, choice, node, pair, queue item, category, preset).

---

## 0. Engine result pipeline (prerequisite, from the M1 question)

Today `TaskResult` is engine-agnostic, but the code that turns a mistake into a heart
loss, a meter hit and a possible setback lives inside `Level.tsx`'s quiz `onMistake`
callback, is duplicated in `BossQuiz.tsx`, and the spaced-repetition update reads
`level.game.questions` directly. Step one of Milestone 2a is therefore to extract:

```ts
/** Emitted by every engine, every stage. Engines never touch the store. */
export interface EngineResult {
  accuracy: number;                       // 0..1
  speed: number;                          // 0..1 (0.5 when untimed/relaxed)
  mistakes: MistakeEvent[];               // heart-costing events, in order
  shortcuts: ShortcutEvent[];             // shortcut choices, in order
  outcomes: EngineOutcomes;               // facts OutcomeRule can test (§5)
  itemResults: Record<string, 'correct' | 'wrong' | 'shortcut' | 'skipped'>; // by item id
}

export interface MistakeEvent {
  itemId: string;
  prompt: string;
  chosen: string;
  correctAnswer: string;
  explanation: string;
  consequence: string;
}

export interface ShortcutEvent { itemId: string; shortcut: Shortcut }

/** Pure functions in src/engine/pipeline.ts, unit-tested without React. */
applyMistake(state, world, stage, mistake) -> { hearts, meters, setback?: MeterId, freeUsed }
aggregateStages(stageResults, stages) -> EngineResult        // weighted, §1
scoreLevel(level, result, progress) -> { stars, score, xp, artifacts: StoredArtifact[], situations }
```

`Level.tsx`, `CrisisBoss.tsx` and `ReviewNode.tsx` become thin hosts that call these.
The M1 acceptance (World 1 fun, under 10 minutes on a phone) is re-checked at the 2c
checkpoint after the retrofit.

---

## 1. Multi-stage levels

```ts
export interface Stage {
  id: string; // unique within the level
  title?: string; // "Classify the findings"
  brief?: string; // one line shown on the stage card
  game: MiniGameConfig; // quiz-blitz not allowed on a main-path stage (FAIL)
  /** Relative weight in the level's accuracy and speed; default 1. */
  weight?: number;
}

export interface Level {
  id: string;
  worldId: WorldId;
  roleId: string;
  title: string;
  intro: string;
  stages: [Stage, ...Stage[]]; // non-empty; single-engine levels have one stage
  debrief: Debrief;
  meterFocus?: MeterId;
  emits?: EmitSpec[]; // §4
  variants?: LevelVariant[]; // §3
  shortcutPrompt?: ShortcutPrompt; // §5, for engines that have no in-engine shortcut
  mayaCameo?: MayaCameo; // §6
}
```

Rules:

- Stages run in declared order with a 1-line stage card between them. Each stage has
  its own timer (from its config × world timer scale); hearts and meters carry across.
- `accuracy = Σ(weightᵢ × accuracyᵢ) / Σ weightᵢ`; `speed` likewise. Mistakes,
  shortcuts and `itemResults` are concatenated; `outcomes` are keyed by stage (§5).
- `Level.game` is removed. w1-l3 = `[bucket-sort stage (weight 1), allocator stage with
dose-response simulation (weight 2)]`.
- `SituationRecord` and `OutcomeRule` reference `stageId` (§5, §7). Stage ids must be
  unique per level (FAIL); item ids must be unique per stage (FAIL).

---

## 2. Simulation block

### 2a. Live preview curves (data only)

```ts
/** A metric the player watches. Points are [x, y] on the input's scale; linear interpolation at runtime. */
export interface PreviewCurve {
  id: string; // 'power' | 'costMillions' | 'coveragePct' …
  label: string;
  unit?: string; // '%', '$M', 'months'
  points: [number, number][]; // ≥ 2, strictly increasing x, covering input.min..input.max (FAIL otherwise)
  format?: 'integer' | 'percent' | 'money' | 'decimal1';
}
```

`preview: 'live'` re-interpolates every curve as the slider moves; `'on-commit'` shows
curves only in the reveal. Bands (below) are used for scoring and artifact tags only,
never for the numbers on screen.

### 2b. Discriminated union: `kind` fixes the visual, `host` fixes the band shape

```ts
export interface NumericInput {
  categoryId: string; // the allocator category that drives the simulation
  min: number;
  max: number;
  step: number;
  unit: string; // 'mg/kg', 'participants', '$ per month'
}

/** Allocator bands: half-open [min, max); the final band is [min, max] so the input max is covered. */
export interface RangeBand<V> extends BandBase<V> {
  range: [number, number];
}
/** Builder bands: the part ids (in the simulation's slot) that fall in this band. */
export interface PartsBand<V> extends BandBase<V> {
  parts: string[];
}

export interface BandBase<V> {
  tag: string; // becomes the artifact tag (§4) and appears in outcomes.band
  label: string;
  narration: string; // 1–2 sentences of what the player sees happen
  meters?: Partial<Record<MeterId, number>>;
  consequence?: string; // debrief text when this is not the target band
  visual: V;
}

export interface DoseResponseVisual {
  cohort: number;
  responders: number;
  adverse: number;
  severe: number;
}
export interface TrialPowerVisual {
  power: number;
  costMillions: number;
  months: number;
  successfulRunsOf100: number;
}
export interface PriceAccessVisual {
  coveragePct: number;
  patientsReachedPct: number;
  revenueIndex: number;
}
export interface PkNextDoseVisual {
  exposure: number;
  safetyCeiling: number;
  points: { t: number; c: number }[];
}

interface SimulationBase {
  targetBand: string; // must equal one band's tag (FAIL)
  preview: 'live' | 'on-commit';
  curves?: PreviewCurve[]; // required when preview === 'live' (FAIL)
  revealSeconds: number; // 3–6; skipped instantly under reduced motion
  commitLabel: string;
}

export type SimulationBlock =
  | (SimulationBase & {
      kind: 'dose-response';
      host: 'allocator';
      input: NumericInput;
      bands: RangeBand<DoseResponseVisual>[];
    })
  | (SimulationBase & {
      kind: 'trial-power';
      host: 'allocator';
      input: NumericInput;
      bands: RangeBand<TrialPowerVisual>[];
    })
  | (SimulationBase & {
      kind: 'price-access';
      host: 'allocator';
      input: NumericInput;
      bands: RangeBand<PriceAccessVisual>[];
    })
  | (SimulationBase & {
      kind: 'pk-next-dose';
      host: 'builder';
      slotId: string;
      bands: PartsBand<PkNextDoseVisual>[];
    });

export type AllocatorSimulation = Extract<SimulationBlock, { host: 'allocator' }>;
export type BuilderSimulation = Extract<SimulationBlock, { host: 'builder' }>;

export interface AllocatorConfig {
  engine: 'allocator';
  /* … */ simulation?: AllocatorSimulation;
}
export interface BuilderConfig {
  engine: 'builder';
  /* … */ simulation?: BuilderSimulation;
}
```

A band's `visual` type is fixed by `kind`, and its shape (`range` vs `parts`) by `host`,
so "neither" and "both" are unrepresentable. Content assignments: Toxicologist
`dose-response` on-commit; Biostatistician `trial-power` live; Market Access
`price-access` live; Clinical Pharmacologist `pk-next-dose` on-commit (builder: place
one of several dose "parts" on the chart slot).

### 2c. Validator rules for bands (all FAIL)

- Range bands sorted by `range[0]`; first `range[0] === input.min`; each
  `range[1] === next.range[0]` (no gaps, no overlaps); last `range[1] === input.max`.
- `input.min < input.max`, `step > 0`, `(max − min) % step === 0`.
- Parts bands: every candidate part for `slotId` appears in exactly one band.
- `targetBand` matches a band tag; tags unique within the block.
- Live preview requires ≥ 1 curve, each covering `input.min..input.max`.

Scoring: band accuracy = 1 for the target band, 0.5 for an adjacent band (by order),
0 otherwise. Stage accuracy with a simulation = mean(engine accuracy, band accuracy).

**The first commit is binding.** It alone determines the band accuracy, the band meters
(applied once) and the emitted artifact tag. After the reveal, every world offers a free
**"What if?" sandbox**: the slider (or parts) reopen under a clearly labelled
"Exploring, not scored" banner; the player can commit any number of times and watch the
reveal, with no hearts, no meters, no score and no artifact. "Done exploring" continues
to the debrief. Improving the recorded outcome means replaying the level (latest wins).
For `preview: 'live'` simulations the sandbox may be omitted (`sandbox: false`), since
the live curves already show the alternatives.

---

## 3. Variants (id-based patches)

```ts
/** Patch for one item collection of one stage. Items are matched by ScoredItem id. */
export interface ItemPatch<TItem extends ScoredItem = ScoredItem> {
  add?: TItem[]; // ids must be new (FAIL if they exist)
  remove?: string[]; // ids must exist (FAIL otherwise)
  replace?: (Partial<TItem> & { id: string })[]; // shallow merge onto the existing item (FAIL if missing)
}

export interface StagePatch {
  brief?: string;
  /** Keyed by the engine's collection name, e.g. bucket-sort: 'cards' | 'buckets'; builder: 'parts' | 'slots'. */
  items?: Record<string, ItemPatch>;
  /** Scalar config fields only (seconds, prompt, constraint numbers). `engine` and collections are not patchable here. */
  fields?: Partial<Omit<MiniGameConfig, 'engine' | EngineCollectionKeys>>;
}

export interface LevelVariant {
  /** All listed key:tag pairs must match the resolved artifacts (AND). */
  when: Partial<Record<ArtifactKey, string>>;
  patch: {
    intro?: string;
    stages?: Record<string, StagePatch>; // keyed by stage id (FAIL if unknown)
    debrief?: Partial<Debrief>;
    meterOpening?: Partial<Record<MeterId, number>>; // applied once when the level starts
  };
}
```

Rules:

- Every engine registers its collection names and item types in code
  (`src/engine/registry.ts`); the validator uses that to type-check `items` keys (FAIL
  on unknown collection).
- `engine` can never change. `fields` is typed to exclude it; the validator also rejects
  it at runtime for JSON content (FAIL).
- **Precedence:** all variants whose `when` matches are applied in declared order; a
  later patch wins on the same field or item.
- `consumes` is removed; it is derived as the set of keys used in `variants[].when` and
  `meterOpening` triggers. The Handoff Map reads the derived set.
- **Validator:** for each level, collect the artifact keys it consumes (every key named
  in any `variants[].when`) and enumerate **every tag assignment** over those keys: the
  cartesian product of each key's registry `tags` (which always includes the
  `defaultTag`). For each assignment, resolve the matching variants in declared order,
  build the level, and run the full level validation on the result, including
  `mayaCameo.itemId`, simulation bands, and `OutcomeRule` id references (FAIL on any).
  The all-defaults assignment is the base level. WARN when one level exceeds 24
  assignments (for example three keys with three tags each is 27).
- `meterOpening` values from several matching variants are summed, then clamped.

---

## 4. Artifacts: registry, lifecycle, namespaces

```ts
// src/content/artifacts.ts — the only place new artifact keys are added (content-only).
export const artifactRegistry = {
  'protocol.criteria': {
    title: 'Eligibility criteria',
    tags: ['tight', 'balanced', 'loose'],
    defaultTag: 'balanced',
    description: '…',
  },
  'ecrf.fields': {
    title: 'eCRF fields',
    tags: ['minimal', 'complete', 'bloated'],
    defaultTag: 'complete',
    description: '…',
  },
  'screening.eligibility': {
    title: 'Screening decisions',
    tags: ['strict', 'standard', 'lenient'],
    defaultTag: 'standard',
    description: '…',
  },
  'monitoring.deviations': {
    title: 'Deviation log',
    tags: ['clean', 'typical', 'noisy'],
    defaultTag: 'typical',
    description: '…',
  },
  'ae.report': {
    title: 'AE report',
    tags: ['complete', 'incomplete'],
    defaultTag: 'complete',
    description: '…',
  },
  'ae.coded': { title: 'Coded AE', tags: ['correct', 'miscoded'], defaultTag: 'correct', description: '…' },
  'safety.report': {
    title: 'Safety report',
    tags: ['on-time', 'late'],
    defaultTag: 'on-time',
    description: '…',
  },
  'label.warnings': {
    title: 'Label warnings',
    tags: ['boxed', 'standard', 'minimal'],
    defaultTag: 'standard',
    description: '…',
  },
  'dose.starting': {
    title: 'Starting dose',
    tags: ['cautious', 'standard', 'aggressive'],
    defaultTag: 'standard',
    description: '…',
  },
  'phase1.escalation': {
    title: 'Escalation plan',
    tags: ['slow', 'standard', 'fast'],
    defaultTag: 'standard',
    description: '…',
  },
  'phase1.hold': {
    title: 'Hold resolution',
    tags: ['mild', 'moderate', 'severe'],
    defaultTag: 'moderate',
    description: '…',
  },
} as const satisfies Record<string, ArtifactSpecBody>;

export type ArtifactKey = keyof typeof artifactRegistry;
export interface ArtifactSpecBody {
  title: string;
  description: string;
  tags: readonly string[];
  defaultTag: string;
}

/** Persisted (store v2). Partial: only emitted keys exist. */
export type ArtifactStore = Partial<Record<ArtifactKey, StoredArtifact>>;

export interface StoredArtifact {
  key: ArtifactKey;
  tag: string;
  data?: Record<string, string | number | boolean>;
  emittedBy: string; // level id
  emittedAt: string; // ISO
}

export interface EmitSpec {
  key: ArtifactKey;
  outcomes: { tag: string; when: OutcomeRule }[]; // first match wins; else defaultTag
  data?: Record<string, 'inputValue' | 'endNode' | 'accuracy' | 'band'>;
}

/** Crisis-local hand-offs between rounds. Never persisted, never on the Handoff Map. */
export type CrisisLocalKey = `local.${string}`;
export interface CrisisEmitSpec {
  key: CrisisLocalKey;
  outcomes: { tag: string; when: OutcomeRule }[];
  defaultTag: string;
  tags: string[];
}
export interface CrisisVariant {
  when: Partial<Record<CrisisLocalKey, string>>;
  patch: LevelVariant['patch'];
}
```

Lifecycle:

1. **Emit** only when the level is passed (stars ≥ 1). A failed attempt writes nothing.
2. **Replay overwrites**: latest successful completion wins, `emittedAt` updated.
3. **Consume at load**: a consumer resolves each key from the store at the moment the
   level (or a replay of it) starts; missing → `defaultTag`. Deep links and replays work.
4. **World 4 clinical hold always occurs.** The SRC level's base config is the hold
   at `moderate` severity. Chain (c) only selects variants that change `meterOpening`,
   copy, and which findings appear; every variant is winnable by the same process.
5. Crisis rounds may emit only `local.*` keys and may only branch on `local.*` keys
   emitted by an earlier round of the same crisis (FAIL otherwise). Levels may never
   reference `local.*` keys (FAIL).

Validator (FAIL): every key in `variants[].when` is emitted by a level earlier in map
order; every `when` tag and every `outcomes[].tag` is in the registry's `tags`; the
consumer's base config validates on its own and so does every variant build (§3).

---

## 5. Shortcuts and OutcomeRule

```ts
export interface Shortcut {
  meters: Partial<Record<MeterId, number>>; // at least one negative safety/integrity and one positive timeline (WARN otherwise)
  why: string; // Dose aside, repeated in the debrief
}

/** For engines with no in-engine shortcut: a Dose offer shown on the stage card. */
export interface ShortcutPrompt {
  id: string; // acts as the shortcut's item id in results/rules
  offer: string; // "Skip the second reviewer and file today?"
  accept: Shortcut; // applied if accepted; declining costs nothing
}
```

What a shortcut is, per engine:

| Engine             | Shortcut carrier                                                        | Effect on scoring                                |
| ------------------ | ----------------------------------------------------------------------- | ------------------------------------------------ |
| bucket-sort        | a **bucket** flagged `shortcut` ("Log as noise, no follow-up")          | cards placed there = `shortcut`, never correct   |
| builder            | a **part** flagged `shortcut` ("Reuse last batch's stability data")     | slot = `shortcut`, never correct                 |
| branching-scenario | a **choice** flagged `shortcut`                                         | choice quality 0 for accuracy                    |
| spot-the-impostor  | the **"Sign off without inspecting"** action flagged `shortcut`         | ends the stage; uninspected cards = `skipped`    |
| allocator          | a **preset** button flagged `shortcut` ("Cut monitoring to hit budget") | sets values; scored by constraints as usual      |
| dash-manager       | a **station** flagged `shortcut` ("Skip the ID check")                  | item served but marked `shortcut`, never correct |
| sequence-sort      | none in engine → level must use `shortcutPrompt`                        | n/a                                              |
| match-pairs        | none in engine → level must use `shortcutPrompt`                        | n/a                                              |
| quiz-blitz         | none (Test Yourself only)                                               | n/a                                              |

Rules:

- A shortcut **never counts as correct** and is **not a mistake event** (no heart).
  Its meters apply immediately, once. The item still counts in the accuracy denominator.
- **Shortcuts feed review.** A taken shortcut whose `meters` include a negative safety
  or integrity delta creates or updates the `SituationRecord` for that carrier item
  (box 1, `misses + 1`), exactly as a mistake would, even though it cost no heart. Its
  review micro-round re-presents the same temptation (§9).
- **No double-counting:** an item cannot carry both a `shortcut` and a simulation band
  (bands are outcomes of a numeric commit, not items). In an allocator stage with a
  simulation, a shortcut **preset** may carry meters; if the committed value is the one
  the preset set (unchanged since the preset was applied), the band's meters are
  suppressed and only the shortcut's apply. The band's narration, visual, accuracy and
  artifact tag still apply. (Replaces the revision 2 "empty meters" rule, which would
  have made such a shortcut invisible to review.)
- Levels with ≥ 1 shortcut carrier in any stage, or a `shortcutPrompt`, satisfy the
  "tempting shortcut" rule; otherwise WARN.

```ts
/** All present fields are ANDed. Each field is only applicable to certain engines (FAIL otherwise). */
export interface OutcomeRule {
  stageId?: string; // required when the level has > 1 stage and any engine-specific field is used (FAIL)
  accuracyAtLeast?: number; // any engine; without stageId = level accuracy
  band?: string; // allocator/builder with simulation
  endNode?: string; // branching-scenario
  chosePart?: { slotId: string; partId: string }; // builder
  bucketOf?: { itemId: string; bucketId: string }; // bucket-sort
  accused?: string; // spot-the-impostor (card id)
  tookShortcut?: string; // any engine / shortcutPrompt: the shortcut's item id
}

export interface EngineOutcomes {
  band?: string;
  endNode?: string;
  parts?: Record<string, string>; // slotId -> partId
  buckets?: Record<string, string>; // itemId -> bucketId
  accused?: string[];
  shortcutsTaken: string[];
  inputValue?: number;
}
```

Validator (FAIL): every id referenced in an `OutcomeRule` (`stageId`, `endNode`,
`slotId`, `partId`, `itemId`, `bucketId`, card id, shortcut id) exists in the stage it
targets; a field used with an engine that does not produce it.

---

## 6. Maya cameo

```ts
export type MayaPresentation = 'queue' | 'data-row' | 'blinded-point' | 'dialogue' | 'consent';

export interface MayaCameo {
  stageId: string;
  itemId: string; // a ScoredItem in that stage (FAIL if missing, also in every variant build)
  presentation: MayaPresentation;
  label: string; // in-level label, e.g. "Participant 0417"
  debriefLine: string; // revealed only after the task
}
```

WARN when used on a world < 5.

---

## 7. Crisis boss

```ts
export interface CrisisRound {
  id: string;
  roleId: string; // must belong to the crisis's world (FAIL)
  /** Budget hint shown on the round card; also the round's contribution to the shared pool. */
  seconds: number; // 15–40 (FAIL)
  brief: string;
  game: MiniGameConfig; // quiz-blitz not allowed (FAIL)
  onlyItems?: string[];
  /** Applied when the round is not cleared. Rounds punish through meters, not hearts. */
  meterHit: Partial<Record<MeterId, number>>;
  emits?: CrisisEmitSpec[];
  variants?: CrisisVariant[];
}

export interface CrisisBoss {
  id: string; // 'w1-crisis'
  worldId: WorldId;
  title: string;
  situation: string[]; // 2–3 short paragraphs
  rounds: CrisisRound[]; // 4–7 (FAIL); World 1: exactly 4, pool ≤ 120 s
  slack?: number; // default 0.15
  clearThreshold?: number; // default 0.6 round accuracy
  passFraction?: number; // default 0.6 of rounds cleared
  resolution: { success: StoryBeat; partial: StoryBeat; fail: StoryBeat };
}

/** Persisted (store v2), replaces `bosses`. */
export interface CrisisRecord {
  stars: number;
  bestPoints: number;
  attempts: number;
  completedAt?: string;
  /** true when migrated from a v1 boss-quiz record; shown as "cleared (legacy quiz)" on the map. */
  legacy?: boolean;
}
```

Economy and semantics:

- **Clock:** one shared pool = `Σ round.seconds × (1 + slack)`. It runs continuously
  across rounds; unused round time is simply still in the pool. The pool pauses during
  the mini badge swap and while paused. Pool at 0 ends the crisis; rounds not reached
  are `not cleared`. World 1: rounds 25 + 30 + 25 + 25 = 105 s → pool 120 s.
- **Round speed fraction** for points = time used in that round ÷ `round.seconds`,
  clamped to 0..1 (finishing under budget scores more; over budget scores base only).
- **Points** per cleared round = `100 + round(50 × (1 − timeUsedFraction))` × streak
  multiplier (×1.25 after 3 cleared in a row, ×1.5 after 5). Max = all rounds cleared
  instantly with full streak.
- **Hearts:** at most **1 heart per crisis attempt**, lost on the first round that is
  not cleared. Later failed rounds apply `meterHit` only.
- **Meter at zero mid-crisis:** the crisis ends immediately as `fail`, the setback
  overlay shows, the meter resets to 40, and a retry is offered (hearts permitting).
- **Relaxed mode:** no pool, no round clocks; every cleared round scores the flat
  `100 + 25` base (speed fraction fixed at 0.5); streak multiplier still applies.
- **Outcome → stars:**
  - `success`: cleared ≥ `passFraction` of rounds before the pool ran out. Stars =
    `computeScore(mean round accuracy, mean (1 − timeUsedFraction))`, minimum 1.
    Unlocks the next world, shows `resolution.success`.
  - `partial`: ≥ 1 round cleared but below `passFraction`, or pool expired first.
    0 stars, no unlock, `resolution.partial`, retry offered.
  - `fail`: 0 rounds cleared or a meter hit zero. 0 stars, `resolution.fail`.
- XP = `points ÷ max × 100`, +20 if `success` on the first attempt. Best stars/points kept.

`MapNode` gains `{ kind: 'crisis'; id }` and loses `{ kind: 'boss' }`.

---

## 8. Test Yourself (knowledge checks)

```ts
export interface KnowledgeCheck {
  id: string; // 'kc-<roleId>'
  roleId: string;
  questions: QuizQuestion[]; // unchanged shape; every question must carry roleId === this roleId (FAIL)
  secondsPerQuestion?: number;
}

export interface KnowledgeRecord {
  attempts: number;
  bestFraction: number;
  ribbon: boolean; // bestFraction ≥ 0.8
  lastPlayedDay?: string;
}
```

- The 32 World 1 questions move to `content/knowledge/w1.ts`. The 24 level questions get
  `roleId` from their level; the 8 boss questions already carry `roleId`.
- Question order: **missed first**. `concepts` (Leitner by `conceptId`) is kept for this
  one purpose: Test Yourself sorts a role's questions by `concepts[conceptId].box`
  ascending, then by `dueAt`. It drives nothing else.
- Quiz-blitz's `onMistake` becomes optional; the Test Yourself host passes none, so
  hearts and meters are unreachable from this mode.

---

## 9. Review micro-rounds (situations)

```ts
export interface SituationRecord {
  levelId: string;
  stageId: string;
  itemId: string;
  box: number;
  dueAt: string;
  misses: number;
}
// key: `${levelId}:${stageId}:${itemId}`

export interface ReviewNode {
  id: string;
  worldId: WorldId;
  title: string;
  maxRounds?: number /* 6 */;
  roundSeconds?: number; /* 20 */
}
```

Each due situation becomes one 20-second round running the original stage's engine
with the original level's artifact defaults, padded so the round is meaningful.
Padding is deterministic (seeded by the situation key) so a review is reproducible:

| Engine             | Round content                                                                                                         |
| ------------------ | --------------------------------------------------------------------------------------------------------------------- |
| bucket-sort        | the missed card + 2 other cards from the stage (min 3 cards); all original buckets                                    |
| builder            | the missed slot only, with its correct part + 2 distractor parts from the original tray (min 3 parts)                 |
| branching-scenario | starts at the **parent node** of the missed choice; that one decision with its original choices; ends after it        |
| spot-the-impostor  | the missed card + 2 innocent cards (min 3), evidence panel intact                                                     |
| allocator          | all categories shown; only the missed category adjustable, others fixed at target values; simulation (if any) skipped |
| sequence-sort      | the missed item and its two neighbours as a 3-item mini sequence                                                      |
| match-pairs        | the missed pair + 2 other pairs (3 × 3)                                                                               |
| dash-manager       | the missed item alone in the queue, all stations, patience × 1.5                                                      |

**Shortcut situations** (a `SituationRecord` whose item is a shortcut carrier) replay the
temptation, not a mistake: the round uses the padding above for the carrier's engine and
keeps the shortcut option available (the shortcut bucket, part, choice, preset, station
or sign-off). Taking it again in review costs nothing but re-schedules the situation
(box 1); declining it promotes the box. `ShortcutPrompt` situations replay the prompt on
its stage card before a 20-second slice of that stage.

No hearts at stake; completing the playlist refills hearts. Nothing due → "All caught
up", refill, no XP.

---

## 10. Validator additions (all FAIL unless noted)

- quiz-blitz on any main-path stage or crisis round.
- `OutcomeRule` fields not applicable to the targeted stage's engine; missing `stageId`
  on a multi-stage level when an engine-specific field is used.
- Any referenced id that does not exist: `endNode`, `slotId`/`partId`, `itemId`,
  `bucketId`, accused card id, shortcut id, `stageId`, `roleId`, `mayaCameo.itemId`.
- Crisis `roleId` outside the crisis's world; crisis rounds outside 4–7; a round
  outside 15–40 s; World 1 pool > 120 s.
- Band rules (§2c); variant builds (§3); artifact rules (§4); shortcut/band
  double-count rule (§5).
- WARN: level with no shortcut carrier and no `shortcutPrompt`; `mayaCameo` on world < 5;
  a shortcut whose meters do not trade timeline against safety/integrity.

---

## 11. Store schema v2 and migration

```ts
interface ProgressDataV2 extends Omit<ProgressDataV1, 'bosses'> {
  schemaVersion: 2;
  artifacts: ArtifactStore; // new, {}
  knowledge: Record<string, KnowledgeRecord>; // new, {} keyed by roleId
  situations: Record<string, SituationRecord>; // new, {}
  crises: Record<string, CrisisRecord>; // from `bosses`
  concepts: Record<string, ConceptRecord>; // kept, Test Yourself ordering only
}
```

Migration v1 → v2:

1. Apply the id rename map `{ 'w1-boss': 'w1-crisis' }` to **every** id-keyed map in
   the v1 payload (`levels`, `bosses`, `reviews`, `tipsDismissed`) and to
   `worldsCompleted` / `worldsStarted` entries, defensively. (Current node and unlock
   state are derived from these maps by `computeMapState` and are not persisted; the
   rename therefore carries over.)
2. Copy `bosses` → `crises`, setting `legacy: true` on each copied record so the map
   labels it "cleared (legacy quiz)" and offers the crisis as replayable for stars.
3. Initialise `artifacts`, `knowledge`, `situations` to `{}`.
4. Set `schemaVersion: 2`.

On every load (not only migration): prune `situations` whose `levelId`, `stageId` or
`itemId` no longer exist in content, and `levels`/`crises`/`reviews` records whose ids
are unknown are kept but ignored by the map. Covered by unit tests with a real v1
fixture captured from the current build.

---

## Appendix A — worked example: chain (c) as it would appear in `/src/content`

Engine config shapes used here (to be finalised in 2b; only the fields the example needs):

```ts
// bucket-sort
interface BucketSortConfig {
  engine: 'bucket-sort';
  prompt: string;
  seconds: number;
  buckets: Bucket[];
  cards: BucketCard[];
}
interface Bucket {
  id: string;
  label: string;
  hint?: string;
  shortcut?: Shortcut;
}
interface BucketCard extends Explained {
  id: string;
  text: string;
  bucketId: string;
} // Explained = explanation, consequence, conceptId

// allocator
interface AllocatorConfig {
  engine: 'allocator';
  prompt: string;
  seconds: number;
  context?: string[]; // worked numbers shown beside the sliders
  categories: AllocatorCategory[];
  presets?: AllocatorPreset[];
  total?: number;
  simulation?: AllocatorSimulation;
  sandbox?: boolean;
}
interface AllocatorCategory extends Explained {
  id: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  initial: number;
  target: [number, number];
}
interface AllocatorPreset {
  id: string;
  label: string;
  values: Record<string, number>;
  shortcut?: Shortcut;
}

// branching-scenario
interface BranchingConfig {
  engine: 'branching-scenario';
  start: string;
  nodes: ScenarioNode[];
}
interface ScenarioNode {
  id: string;
  speaker?: string;
  text: string;
  choices?: ScenarioChoice[];
  end?: { summary: string };
}
interface ScenarioChoice extends Explained {
  id: string;
  text: string;
  quality: 'best' | 'ok' | 'bad';
  next: string;
  meters?: Partial<Record<MeterId, number>>;
  shortcut?: Shortcut;
}
```

### A.1 `src/content/artifacts.ts` (the three chain-c keys)

```ts
export const artifactRegistry = {
  'dose.starting': {
    title: 'Starting dose',
    description: 'The first dose given to a human volunteer, chosen by the Toxicologist.',
    tags: ['cautious', 'standard', 'aggressive', 'reckless'],
    defaultTag: 'standard',
  },
  'phase1.escalation': {
    title: 'Escalation plan',
    description: 'How fast the Phase I doses step up, chosen by the Clinical Pharmacologist.',
    tags: ['slow', 'standard', 'fast'],
    defaultTag: 'standard',
  },
  'phase1.hold': {
    title: 'Hold resolution',
    description: 'How cleanly the Safety Review Committee resolved the clinical hold.',
    tags: ['mild', 'moderate', 'severe'],
    defaultTag: 'moderate',
  },
  // …chains (a) and (b)
} as const satisfies Record<string, ArtifactSpecBody>;
```

### A.2 `src/content/worlds/w1/levels.ts` — w1-l3 in full

```ts
export const w1l3: Level = {
  id: 'w1-l3',
  worldId: 'w1',
  roleId: 'preclinical-toxicologist',
  title: 'Is it safe enough to try?',
  intro:
    'The 28-day rat study on VX-101 is back. Sort what the pathologist found, then set the first dose a human volunteer will ever receive.',
  meterFocus: 'safety',
  stages: [
    {
      id: 'findings',
      title: 'Classify the findings',
      brief: 'Adverse, not adverse, or send it to pathology review?',
      weight: 1,
      game: {
        engine: 'bucket-sort',
        prompt: 'Sort each finding from the 28-day rat study.',
        seconds: 75,
        buckets: [
          { id: 'adverse', label: 'Adverse', hint: 'Harmful, dose-related, or would matter in a person' },
          { id: 'not-adverse', label: 'Not adverse', hint: 'Within normal range, or not related to dose' },
          { id: 'review', label: 'Pathology review', hint: 'Could go either way; needs the slides' },
          {
            id: 'noise',
            label: 'Log as noise',
            hint: 'Skip the review, keep the timeline',
            shortcut: {
              meters: { timeline: 10, safety: -15 },
              why: 'Skipping review is how a real liver signal gets found in humans instead of rats.',
            },
          },
        ],
        cards: [
          {
            id: 'alt',
            text: 'ALT (a liver enzyme) 3 times the upper limit at 100 mg/kg, rising with dose',
            bucketId: 'adverse',
            conceptId: 'toxicology',
            explanation:
              'A dose-related rise in a liver enzyme is a classic adverse finding. The liver is a target organ.',
            consequence:
              'Missing a liver signal in animals is how first-in-human trials produce serious liver injury.',
          },
          {
            id: 'weight-gain',
            text: 'Males gained slightly more weight than controls at every dose',
            bucketId: 'not-adverse',
            conceptId: 'noael',
            explanation:
              "A small change in the same direction at every dose, inside the lab's normal range, is not adverse.",
            consequence: 'Calling everything adverse buries the real signal and delays a drug patients need.',
          },
          {
            id: 'hypertrophy',
            text: 'Liver cells enlarged at 100 mg/kg; no cell death seen',
            bucketId: 'review',
            conceptId: 'toxicology',
            explanation:
              'Enlarged liver cells can be the liver adapting, or the start of injury. The pathologist decides from the slides.',
            consequence: 'Guessing instead of reviewing means the wrong NOAEL, and the wrong starting dose.',
          },
          {
            id: 'skin',
            text: 'One rat at 10 mg/kg had a skin lesion; so did one control rat',
            bucketId: 'not-adverse',
            conceptId: 'noael',
            explanation: 'Seen in a control animal too, and at only one dose: not related to the drug.',
            consequence: 'Chasing background findings wastes months and animals.',
          },
          {
            id: 'food',
            text: '10% weight loss and reduced food intake at 100 mg/kg',
            bucketId: 'adverse',
            conceptId: 'toxicology',
            explanation: 'Weight loss of this size is a sign of toxicity, whatever the mechanism.',
            consequence:
              'Ignoring general signs of toxicity leads to a starting dose that makes volunteers ill.',
          },
          {
            id: 'liver-weight',
            text: 'Liver weight up 15% at 30 mg/kg; enzymes and slides normal',
            bucketId: 'review',
            conceptId: 'noael',
            explanation:
              'An organ-weight change with nothing else is a judgement call. It is often adaptive, but it must be checked.',
            consequence:
              'If this is early injury, 30 mg/kg is not the NOAEL and the human dose is set too high.',
          },
        ],
      },
    },
    {
      id: 'dose',
      title: 'Set the first human dose',
      brief: 'Use the NOAEL, the human equivalent dose and a safety factor.',
      weight: 2,
      game: {
        engine: 'allocator',
        prompt: 'Choose the starting dose for the first cohort of six healthy volunteers.',
        seconds: 90,
        context: [
          'Rat [[noael|NOAEL]]: 30 mg/kg per day (liver changes at 100 mg/kg)',
          'Human equivalent dose (by body surface area): about 4.8 mg/kg',
          'Default safety factor: divide by at least 10',
          'Target organ to watch: liver',
        ],
        categories: [
          {
            id: 'dose',
            label: 'Starting dose',
            unit: 'mg/kg',
            min: 0.1,
            max: 5,
            step: 0.1,
            initial: 2.4,
            target: [0.3, 0.5],
            conceptId: 'starting-dose',
            explanation:
              '4.8 mg/kg divided by 10 is about 0.5 mg/kg. A little lower is fine; a lot lower wastes cohorts.',
            consequence:
              'Starting too high is how first-in-human trials cause serious harm. Starting far too low adds cohorts and months.',
          },
        ],
        presets: [
          {
            id: 'use-hed',
            label: 'Start at the human equivalent dose (4.8 mg/kg)',
            values: { dose: 4.8 },
            shortcut: {
              meters: { timeline: 15, safety: -25 },
              why: 'Skipping the safety factor saves cohorts and time, and bets every volunteer on rats being a perfect model of people.',
            },
          },
        ],
        simulation: {
          kind: 'dose-response',
          host: 'allocator',
          preview: 'on-commit',
          revealSeconds: 4,
          commitLabel: 'Dose the first cohort',
          targetBand: 'standard',
          input: { categoryId: 'dose', min: 0.1, max: 5, step: 0.1, unit: 'mg/kg' },
          bands: [
            {
              tag: 'cautious',
              label: 'Very cautious',
              range: [0.1, 0.3],
              narration:
                'All six volunteers are fine. Drug levels in blood are barely measurable. You will need extra cohorts before you learn anything.',
              meters: { timeline: -5 },
              consequence:
                'A start far below the standard margin adds months and cost, and still teaches nothing about safety at useful doses.',
              visual: { cohort: 6, fine: 6, mild: 0, serious: 0, exposurePct: 8 },
            },
            {
              tag: 'standard',
              label: 'Standard (HED ÷ 10)',
              range: [0.3, 0.6],
              narration:
                'All six volunteers are fine. Blood levels are measurable and well below the animal NOAEL. Escalation can begin.',
              visual: { cohort: 6, fine: 6, mild: 0, serious: 0, exposurePct: 25 },
            },
            {
              tag: 'aggressive',
              label: 'Aggressive',
              range: [0.6, 1.5],
              narration:
                'Two volunteers report nausea and one shows a mild rise in liver enzymes. Dosing pauses while the team reviews.',
              meters: { safety: -10, timeline: -5 },
              consequence:
                'A start above the standard margin turns the first cohort into the safety experiment.',
              visual: { cohort: 6, fine: 4, mild: 2, serious: 0, exposurePct: 60 },
            },
            {
              tag: 'reckless',
              label: 'No safety factor',
              range: [1.5, 5],
              narration:
                'One volunteer is admitted with liver enzymes eight times the limit. The study stops. The regulator opens a review.',
              meters: { safety: -25, timeline: -15 },
              consequence:
                'This is the scenario the safety factor exists to prevent. Real first-in-human trials have injured volunteers this way.',
              visual: { cohort: 6, fine: 2, mild: 3, serious: 1, exposurePct: 150 },
            },
          ],
        },
      },
    },
  ],
  emits: [
    {
      key: 'dose.starting',
      outcomes: [
        { tag: 'cautious', when: { stageId: 'dose', band: 'cautious' } },
        { tag: 'standard', when: { stageId: 'dose', band: 'standard' } },
        { tag: 'aggressive', when: { stageId: 'dose', band: 'aggressive' } },
        { tag: 'reckless', when: { stageId: 'dose', band: 'reckless' } },
      ],
      data: { mgPerKg: 'inputValue' },
    },
  ],
  debrief: {
    learned:
      'Animal studies find the highest dose with no harmful effect (the NOAEL) and the organs at risk. The first human dose sits well below that, with a safety factor of at least 10.',
    handoffLine:
      'You hand the safety data and your starting dose to the CMC Scientist. That dose will follow you into World 4.',
  },
};
```

How the pieces connect: the `noise` bucket is the stage-1 shortcut (helps timeline,
hurts safety, creates a review situation). The `use-hed` preset is the stage-2 shortcut;
it lands in the `reckless` band, whose meters are then suppressed in favour of the
preset's own. Whatever band the first commit lands in becomes the `dose.starting` tag.
After the reveal the "What if?" sandbox reopens the slider unscored.

### A.3 `src/content/worlds/w4/levels.ts` — the clinical hold level that consumes it

```ts
export const w4l4: Level = {
  id: 'w4-l4',
  worldId: 'w4',
  roleId: 'safety-review-committee',
  title: 'Clinical hold',
  meterFocus: 'safety',
  // Base copy = the 'standard' starting dose and 'standard' escalation (the registry defaults).
  intro:
    "Cohort 3 of the Phase I study was dosed at 2 mg/kg this morning. One volunteer's labs show ALT four times the upper limit. He feels fine. The [[fda|FDA]] has been told, and this afternoon they placed the study on clinical hold. You chair the Safety Review Committee.",
  stages: [
    {
      id: 'scenario',
      title: 'Resolve the hold',
      weight: 1,
      game: {
        engine: 'branching-scenario',
        start: 'n-data',
        nodes: [
          {
            id: 'n-data',
            speaker: 'Study physician',
            text: 'One volunteer, one lab value, no symptoms. The rest of cohort 3 is due for their second dose in an hour. Your call as chair.',
            choices: [
              {
                id: 'c-pause',
                text: 'Pause all dosing and convene the committee today',
                quality: 'best',
                next: 'n-workup',
                meters: { safety: 5 },
                conceptId: 'safety-pharmacology',
                explanation:
                  'A liver signal in a first-in-human study stops dosing until it is understood. That is what stopping rules are for.',
                consequence: 'Dosing through a signal is how a warning becomes an injury.',
              },
              {
                id: 'c-continue',
                text: 'Dose the rest of cohort 3; one lab value is not a pattern',
                quality: 'bad',
                next: 'n-workup',
                meters: { safety: -15 },
                conceptId: 'safety-pharmacology',
                explanation:
                  'You do not yet know whether this is the drug. Until you do, nobody else gets it.',
                consequence:
                  'Volunteers dosed after an unexplained liver signal have been seriously harmed in real studies.',
              },
              {
                id: 'c-stop-all',
                text: 'Stop the whole programme and tell the board it is over',
                quality: 'ok',
                next: 'n-workup',
                meters: { timeline: -20 },
                conceptId: 'phase-1',
                explanation:
                  'A hold is a pause, not a verdict. Most holds are lifted once the sponsor answers the questions.',
                consequence:
                  'Abandoning a programme at the first signal throws away the years and patients behind it.',
              },
            ],
          },
          {
            id: 'n-workup',
            speaker: 'Study physician',
            text: 'The volunteer is admitted for observation. What do you order?',
            choices: [
              {
                id: 'c-full',
                text: "Full workup: repeat liver panel, hepatitis screen, alcohol and medication history, and his cohort's drug levels",
                quality: 'best',
                next: 'n-amend',
                conceptId: 'pharmacokinetics',
                explanation:
                  'To blame or clear the drug you must rule out the common causes and see how much drug was in his blood.',
                consequence:
                  "Without the workup you cannot answer the regulator's first question: is it the drug?",
              },
              {
                id: 'c-repeat',
                text: 'Repeat the liver panel tomorrow and wait',
                quality: 'ok',
                next: 'n-amend',
                conceptId: 'pharmacokinetics',
                explanation: 'Trend matters, but a repeat alone cannot tell drug injury from a virus.',
                consequence: 'The regulator asks for the missing tests anyway, and the hold runs longer.',
              },
              {
                id: 'c-blame',
                text: 'Write to the FDA now that it is unrelated to VX-101',
                quality: 'bad',
                next: 'n-amend',
                meters: { integrity: -15 },
                conceptId: 'gcp',
                explanation:
                  'A causality call before the data is an opinion, and a regulator will read it as one.',
                consequence:
                  'Premature "not related" claims damage a sponsor\'s credibility for the rest of the programme.',
              },
            ],
          },
          {
            id: 'n-amend',
            speaker: 'Committee',
            text: 'Workup done: hepatitis negative, no alcohol, enzymes falling now that dosing has stopped. Likely drug-related, mild, reversible. The FDA wants a plan.',
            choices: [
              {
                id: 'c-amend-full',
                text: 'Amend the protocol: halve the next dose step, add twice-weekly liver tests and written stopping rules',
                quality: 'best',
                next: 'n-respond',
                conceptId: 'protocol',
                explanation:
                  'Smaller steps, closer monitoring and clear stopping rules are the standard answer to a reversible signal.',
                consequence:
                  'Without stopping rules the next cohort meets the same signal with nobody obliged to stop.',
              },
              {
                id: 'c-monitor-only',
                text: 'Keep the escalation schedule but add liver tests',
                quality: 'ok',
                next: 'n-respond',
                meters: { safety: -5 },
                conceptId: 'protocol',
                explanation:
                  'Monitoring finds problems; it does not prevent them. The dose step is the lever.',
                consequence: 'The regulator is likely to ask why the step size did not change.',
              },
              {
                id: 'c-skip',
                text: 'Answer the hold without an amendment; a rewrite costs six weeks',
                quality: 'bad',
                next: 'n-respond',
                conceptId: 'protocol',
                shortcut: {
                  meters: { timeline: 15, safety: -20 },
                  why: 'Six weeks saved now, and the next cohort meets the same signal with no stopping rule.',
                },
                explanation: 'Speed is real. So is the volunteer in the next cohort.',
                consequence: 'Holds answered without a plan get re-imposed after the next event.',
              },
            ],
          },
          {
            id: 'n-respond',
            speaker: 'Regulatory Affairs',
            text: 'Your complete response goes to the FDA today. They have 30 days to answer.',
            choices: [
              {
                id: 'c-complete',
                text: 'Send the data, the workup, the amended protocol and the stopping rules together',
                quality: 'best',
                next: 'end-lifted',
                conceptId: 'ind',
                explanation:
                  'A complete response answers every question the reviewer would ask, in one package.',
                consequence: 'Piecemeal responses restart the clock each time.',
              },
              {
                id: 'c-partial',
                text: 'Send the data now and promise the amendment later',
                quality: 'ok',
                next: 'end-lifted-slow',
                meters: { timeline: -10 },
                conceptId: 'ind',
                explanation: 'The regulator cannot lift a hold on a promise.',
                consequence: 'Expect a second information request and another month.',
              },
              {
                id: 'c-argue',
                text: 'Argue that one asymptomatic lab value should never have triggered a hold',
                quality: 'bad',
                next: 'end-lifted-slow',
                meters: { integrity: -10, timeline: -15 },
                conceptId: 'ind',
                explanation: 'Whether the hold was fair is not the question the reviewer is asking.',
                consequence:
                  'Arguing with the regulator instead of answering them is remembered at approval time.',
              },
            ],
          },
          {
            id: 'end-lifted',
            text: 'Hold lifted after 26 days. Dosing resumes at the smaller step, with the new stopping rules in place.',
            end: { summary: 'Holds are common. Handling them well is the job.' },
          },
          {
            id: 'end-lifted-slow',
            text: 'Hold lifted after 71 days and two more rounds of questions. Dosing resumes. The delay is on the timeline meter.',
            end: { summary: 'The hold was always going to lift. How long it took was up to you.' },
          },
        ],
      },
    },
  ],
  emits: [
    {
      key: 'phase1.hold',
      outcomes: [
        { tag: 'mild', when: { stageId: 'scenario', endNode: 'end-lifted', accuracyAtLeast: 0.85 } },
        { tag: 'severe', when: { stageId: 'scenario', endNode: 'end-lifted-slow' } },
      ],
    },
  ],
  // Consumed keys are derived from `when`: dose.starting (4 tags) × phase1.escalation (3 tags) = 12 assignments.
  variants: [
    {
      when: { 'dose.starting': 'cautious' },
      patch: {
        intro:
          "Cohort 5 of the Phase I study was dosed at 1.5 mg/kg this morning, after four uneventful cohorts. One volunteer's labs show ALT twice the upper limit. He feels fine. The [[fda|FDA]] has been told, and this afternoon they placed the study on clinical hold. You chair the Safety Review Committee.",
        meterOpening: { safety: -5 },
        stages: {
          scenario: {
            items: {
              nodes: {
                replace: [
                  {
                    id: 'n-amend',
                    text: 'Workup done: hepatitis negative, no alcohol, enzymes only mildly raised and already falling. Likely drug-related, mild, reversible. The FDA wants a plan.',
                  },
                ],
              },
            },
          },
        },
      },
    },
    {
      when: { 'dose.starting': 'aggressive' },
      patch: {
        intro:
          "Cohort 2 of the Phase I study was dosed at 1.2 mg/kg this morning. One volunteer's labs show ALT six times the upper limit and he is nauseous. The [[fda|FDA]] has been told, and this afternoon they placed the study on clinical hold. You chair the Safety Review Committee.",
        meterOpening: { safety: -15 },
      },
    },
    {
      when: { 'dose.starting': 'reckless' },
      patch: {
        intro:
          'Cohort 1 of the Phase I study was dosed at 4.8 mg/kg. One volunteer is in hospital with ALT eight times the upper limit and rising bilirubin. The [[fda|FDA]] placed the study on clinical hold within the hour, and their letter cites your starting dose. You chair the Safety Review Committee.',
        meterOpening: { safety: -25 },
        stages: {
          scenario: {
            items: {
              nodes: {
                replace: [
                  {
                    id: 'n-data',
                    text: 'One volunteer in hospital, a liver pattern that worries the hepatologist, and a regulator asking how the starting dose was chosen. The rest of cohort 1 is due for their second dose in an hour. Your call as chair.',
                  },
                ],
              },
            },
          },
        },
      },
    },
    {
      when: { 'phase1.escalation': 'fast' },
      patch: {
        meterOpening: { safety: -5 },
        stages: {
          scenario: {
            items: {
              nodes: {
                replace: [
                  {
                    id: 'n-respond',
                    text: 'Your complete response goes to the FDA today. They have 30 days to answer, and they have asked why the dose steps were tripled rather than doubled.',
                  },
                ],
              },
            },
          },
        },
      },
    },
    {
      when: { 'phase1.escalation': 'slow' },
      patch: {
        meterOpening: { timeline: -5 },
        stages: {
          scenario: {
            items: {
              nodes: {
                replace: [
                  {
                    id: 'n-respond',
                    text: 'Your complete response goes to the FDA today. They have 30 days to answer. The programme was already two months behind from the slow escalation.',
                  },
                ],
              },
            },
          },
        },
      },
    },
  ],
  debrief: {
    learned:
      "A clinical hold is a pause while the sponsor answers the regulator's questions. The way out is always the same: stop, investigate, amend, and respond completely.",
    handoffLine:
      'You hand the lifted hold and the amended protocol back to the Investigator. Dosing resumes.',
  },
};
```

What the example shows: the hold always happens (the base intro already has the FDA
letter); chain (c) only changes the cohort, the severity, the opening meter hit and two
node texts. A player who arrives by deep link with no artifacts gets the base. With
`reckless` + `fast`, both variants apply in order: the `reckless` intro wins (the `fast`
variant does not touch `intro`), `meterOpening` sums to −30, and `n-data` and `n-respond`
are each replaced once. All 12 assignments produce a level with the same four decisions
and the same two endings.

## Appendix B — schema changes forced by the worked example

1. **`shortcut?` leaves `ScoredItem`.** Cards, questions and queue items never carry a
   shortcut; only the per-engine carriers do (`Bucket`, `BuilderPart`, `ScenarioChoice`,
   `AllocatorPreset`, `DashStation`, the impostor sign-off action). `ScoredItem` is now
   just `{ id }`.
2. **`DoseResponseVisual` fields renamed** to what a Phase I cohort actually shows:
   `{ cohort, fine, mild, serious, exposurePct }` instead of responders/adverse/severe.
3. **`dose.starting` gains a fourth tag, `reckless`.** Four bands need four tags because
   band tags must be unique within a block (§2c). The hold level gets a fourth variant.
4. **Shortcut presets in a simulated allocator may carry meters** (§5, replacing the
   revision 2 "empty meters" rule); band meters are suppressed when the committed value
   is the preset's. Needed so change 2 (shortcuts feed review) has a delta to act on.
5. **`meterOpening` sums across matching variants** (§3), so a dose variant and an
   escalation variant can both contribute.
6. **`context?: string[]`** on the allocator config, for the worked numbers the player
   needs beside the slider. Accepts glossary links.
7. **Float tolerance** (1e-9) in the validator's step and range checks; `0.1`-step
   sliders are otherwise unrepresentable.
8. **Node patches are shallow.** Replacing a scenario node's `text` keeps its `choices`;
   to change one choice, replace the node with a full `choices` array. Documented in the
   content guide rather than adding a nested patch syntax.
9. **`sandbox?: boolean`** on allocator/builder configs (default true) to omit the "What
   if?" sandbox for live-preview simulations.
