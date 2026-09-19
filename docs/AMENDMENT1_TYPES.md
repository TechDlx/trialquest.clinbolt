# Amendment 1 — proposed TypeScript types (revision 2)

Status: proposal for approval. Nothing here is implemented yet. Revision 2 addresses the
nine blocking points and the minor points from the review of revision 1.

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
  id: string;                     // unique within the level
  title?: string;                 // "Classify the findings"
  brief?: string;                 // one line shown on the stage card
  game: MiniGameConfig;           // quiz-blitz not allowed on a main-path stage (FAIL)
  /** Relative weight in the level's accuracy and speed; default 1. */
  weight?: number;
}

export interface Level {
  id: string;
  worldId: WorldId;
  roleId: string;
  title: string;
  intro: string;
  stages: [Stage, ...Stage[]];    // non-empty; single-engine levels have one stage
  debrief: Debrief;
  meterFocus?: MeterId;
  emits?: EmitSpec[];             // §4
  variants?: LevelVariant[];      // §3
  shortcutPrompt?: ShortcutPrompt; // §5, for engines that have no in-engine shortcut
  mayaCameo?: MayaCameo;          // §6
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
  id: string;                     // 'power' | 'costMillions' | 'coveragePct' …
  label: string;
  unit?: string;                  // '%', '$M', 'months'
  points: [number, number][];     // ≥ 2, strictly increasing x, covering input.min..input.max (FAIL otherwise)
  format?: 'integer' | 'percent' | 'money' | 'decimal1';
}
```

`preview: 'live'` re-interpolates every curve as the slider moves; `'on-commit'` shows
curves only in the reveal. Bands (below) are used for scoring and artifact tags only,
never for the numbers on screen.

### 2b. Discriminated union: `kind` fixes the visual, `host` fixes the band shape

```ts
export interface NumericInput {
  categoryId: string;             // the allocator category that drives the simulation
  min: number; max: number; step: number;
  unit: string;                   // 'mg/kg', 'participants', '$ per month'
}

/** Allocator bands: half-open [min, max); the final band is [min, max] so the input max is covered. */
export interface RangeBand<V> extends BandBase<V> { range: [number, number] }
/** Builder bands: the part ids (in the simulation's slot) that fall in this band. */
export interface PartsBand<V> extends BandBase<V> { parts: string[] }

export interface BandBase<V> {
  tag: string;                    // becomes the artifact tag (§4) and appears in outcomes.band
  label: string;
  narration: string;              // 1–2 sentences of what the player sees happen
  meters?: Partial<Record<MeterId, number>>;
  consequence?: string;           // debrief text when this is not the target band
  visual: V;
}

export interface DoseResponseVisual { cohort: number; responders: number; adverse: number; severe: number }
export interface TrialPowerVisual   { power: number; costMillions: number; months: number; successfulRunsOf100: number }
export interface PriceAccessVisual  { coveragePct: number; patientsReachedPct: number; revenueIndex: number }
export interface PkNextDoseVisual   { exposure: number; safetyCeiling: number; points: { t: number; c: number }[] }

interface SimulationBase {
  targetBand: string;             // must equal one band's tag (FAIL)
  preview: 'live' | 'on-commit';
  curves?: PreviewCurve[];        // required when preview === 'live' (FAIL)
  revealSeconds: number;          // 3–6; skipped instantly under reduced motion
  commitLabel: string;
}

export type SimulationBlock =
  | (SimulationBase & { kind: 'dose-response'; host: 'allocator'; input: NumericInput; bands: RangeBand<DoseResponseVisual>[] })
  | (SimulationBase & { kind: 'trial-power';   host: 'allocator'; input: NumericInput; bands: RangeBand<TrialPowerVisual>[] })
  | (SimulationBase & { kind: 'price-access';  host: 'allocator'; input: NumericInput; bands: RangeBand<PriceAccessVisual>[] })
  | (SimulationBase & { kind: 'pk-next-dose';  host: 'builder';   slotId: string;      bands: PartsBand<PkNextDoseVisual>[] });

export type AllocatorSimulation = Extract<SimulationBlock, { host: 'allocator' }>;
export type BuilderSimulation   = Extract<SimulationBlock, { host: 'builder' }>;

export interface AllocatorConfig { engine: 'allocator'; /* … */ simulation?: AllocatorSimulation }
export interface BuilderConfig   { engine: 'builder';   /* … */ simulation?: BuilderSimulation }
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
Band meters apply once, on commit. A second commit in the same attempt costs a heart
from World 3 on (World 1–2: free).

---

## 3. Variants (id-based patches)

```ts
/** Patch for one item collection of one stage. Items are matched by ScoredItem id. */
export interface ItemPatch<TItem extends ScoredItem = ScoredItem> {
  add?: TItem[];                          // ids must be new (FAIL if they exist)
  remove?: string[];                      // ids must exist (FAIL otherwise)
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
    stages?: Record<string, StagePatch>;  // keyed by stage id (FAIL if unknown)
    debrief?: Partial<Debrief>;
    meterOpening?: Partial<Record<MeterId, number>>;  // applied once when the level starts
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
- **Validator:** for each level, build (a) the base level, (b) each variant alone, and
  (c) each combination of variants whose `when` clauses are jointly satisfiable (tags
  come from distinct keys or agree). Run the full level validation on every build,
  including `mayaCameo.itemId`, simulation bands, and `OutcomeRule` id references (FAIL).

---

## 4. Artifacts: registry, lifecycle, namespaces

```ts
// src/content/artifacts.ts — the only place new artifact keys are added (content-only).
export const artifactRegistry = {
  'protocol.criteria':     { title: 'Eligibility criteria',  tags: ['tight', 'balanced', 'loose'],         defaultTag: 'balanced', description: '…' },
  'ecrf.fields':           { title: 'eCRF fields',           tags: ['minimal', 'complete', 'bloated'],     defaultTag: 'complete', description: '…' },
  'screening.eligibility': { title: 'Screening decisions',   tags: ['strict', 'standard', 'lenient'],      defaultTag: 'standard', description: '…' },
  'monitoring.deviations': { title: 'Deviation log',         tags: ['clean', 'typical', 'noisy'],          defaultTag: 'typical',  description: '…' },
  'ae.report':             { title: 'AE report',             tags: ['complete', 'incomplete'],             defaultTag: 'complete', description: '…' },
  'ae.coded':              { title: 'Coded AE',              tags: ['correct', 'miscoded'],                defaultTag: 'correct',  description: '…' },
  'safety.report':         { title: 'Safety report',         tags: ['on-time', 'late'],                    defaultTag: 'on-time',  description: '…' },
  'label.warnings':        { title: 'Label warnings',        tags: ['boxed', 'standard', 'minimal'],       defaultTag: 'standard', description: '…' },
  'dose.starting':         { title: 'Starting dose',         tags: ['cautious', 'standard', 'aggressive'], defaultTag: 'standard', description: '…' },
  'phase1.escalation':     { title: 'Escalation plan',       tags: ['slow', 'standard', 'fast'],           defaultTag: 'standard', description: '…' },
  'phase1.hold':           { title: 'Hold resolution',       tags: ['mild', 'moderate', 'severe'],         defaultTag: 'moderate', description: '…' },
} as const satisfies Record<string, ArtifactSpecBody>;

export type ArtifactKey = keyof typeof artifactRegistry;
export interface ArtifactSpecBody { title: string; description: string; tags: readonly string[]; defaultTag: string }

/** Persisted (store v2). Partial: only emitted keys exist. */
export type ArtifactStore = Partial<Record<ArtifactKey, StoredArtifact>>;

export interface StoredArtifact {
  key: ArtifactKey;
  tag: string;
  data?: Record<string, string | number | boolean>;
  emittedBy: string;              // level id
  emittedAt: string;              // ISO
}

export interface EmitSpec {
  key: ArtifactKey;
  outcomes: { tag: string; when: OutcomeRule }[];   // first match wins; else defaultTag
  data?: Record<string, 'inputValue' | 'endNode' | 'accuracy' | 'band'>;
}

/** Crisis-local hand-offs between rounds. Never persisted, never on the Handoff Map. */
export type CrisisLocalKey = `local.${string}`;
export interface CrisisEmitSpec { key: CrisisLocalKey; outcomes: { tag: string; when: OutcomeRule }[]; defaultTag: string; tags: string[] }
export interface CrisisVariant { when: Partial<Record<CrisisLocalKey, string>>; patch: LevelVariant['patch'] }
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
  meters: Partial<Record<MeterId, number>>;   // at least one negative safety/integrity and one positive timeline (WARN otherwise)
  why: string;                                // Dose aside, repeated in the debrief
}

/** For engines with no in-engine shortcut: a Dose offer shown on the stage card. */
export interface ShortcutPrompt {
  id: string;                                 // acts as the shortcut's item id in results/rules
  offer: string;                              // "Skip the second reviewer and file today?"
  accept: Shortcut;                           // applied if accepted; declining costs nothing
}
```

What a shortcut is, per engine:

| Engine             | Shortcut carrier                                                                    | Effect on scoring                                  |
| ------------------ | ----------------------------------------------------------------------------------- | -------------------------------------------------- |
| bucket-sort        | a **bucket** flagged `shortcut` ("Log as noise, no follow-up")                       | cards placed there = `shortcut`, never correct     |
| builder            | a **part** flagged `shortcut` ("Reuse last batch's stability data")                  | slot = `shortcut`, never correct                   |
| branching-scenario | a **choice** flagged `shortcut`                                                      | choice quality 0 for accuracy                      |
| spot-the-impostor  | the **"Sign off without inspecting"** action flagged `shortcut`                       | ends the stage; uninspected cards = `skipped`      |
| allocator          | a **preset** button flagged `shortcut` ("Cut monitoring to hit budget")               | sets values; scored by constraints as usual        |
| dash-manager       | a **station** flagged `shortcut` ("Skip the ID check")                                | item served but marked `shortcut`, never correct   |
| sequence-sort      | none in engine → level must use `shortcutPrompt`                                     | n/a                                                |
| match-pairs        | none in engine → level must use `shortcutPrompt`                                     | n/a                                                |
| quiz-blitz         | none (Test Yourself only)                                                            | n/a                                                |

Rules:

- A shortcut **never counts as correct** and is **not a mistake event** (no heart).
  Its meters apply immediately, once. The item still counts in the accuracy denominator.
- **No double-counting:** an item cannot carry both a `shortcut` and a simulation band
  (bands are outcomes of a numeric commit, not items). In an allocator stage with a
  simulation, a shortcut preset must have empty `meters` (FAIL otherwise); the band it
  lands in supplies the consequence.
- Levels with ≥ 1 shortcut carrier in any stage, or a `shortcutPrompt`, satisfy the
  "tempting shortcut" rule; otherwise WARN.

```ts
/** All present fields are ANDed. Each field is only applicable to certain engines (FAIL otherwise). */
export interface OutcomeRule {
  stageId?: string;               // required when the level has > 1 stage and any engine-specific field is used (FAIL)
  accuracyAtLeast?: number;       // any engine; without stageId = level accuracy
  band?: string;                  // allocator/builder with simulation
  endNode?: string;               // branching-scenario
  chosePart?: { slotId: string; partId: string }; // builder
  bucketOf?: { itemId: string; bucketId: string }; // bucket-sort
  accused?: string;               // spot-the-impostor (card id)
  tookShortcut?: string;          // any engine / shortcutPrompt: the shortcut's item id
}

export interface EngineOutcomes {
  band?: string; endNode?: string;
  parts?: Record<string, string>;       // slotId -> partId
  buckets?: Record<string, string>;     // itemId -> bucketId
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
  itemId: string;                 // a ScoredItem in that stage (FAIL if missing, also in every variant build)
  presentation: MayaPresentation;
  label: string;                  // in-level label, e.g. "Participant 0417"
  debriefLine: string;            // revealed only after the task
}
```

WARN when used on a world < 5.

---

## 7. Crisis boss

```ts
export interface CrisisRound {
  id: string;
  roleId: string;                 // must belong to the crisis's world (FAIL)
  /** Budget hint shown on the round card; also the round's contribution to the shared pool. */
  seconds: number;                // 15–40 (FAIL)
  brief: string;
  game: MiniGameConfig;           // quiz-blitz not allowed (FAIL)
  onlyItems?: string[];
  /** Applied when the round is not cleared. Rounds punish through meters, not hearts. */
  meterHit: Partial<Record<MeterId, number>>;
  emits?: CrisisEmitSpec[];
  variants?: CrisisVariant[];
}

export interface CrisisBoss {
  id: string;                     // 'w1-crisis'
  worldId: WorldId;
  title: string;
  situation: string[];            // 2–3 short paragraphs
  rounds: CrisisRound[];          // 4–7 (FAIL); World 1: exactly 4, pool ≤ 120 s
  slack?: number;                 // default 0.15
  clearThreshold?: number;        // default 0.6 round accuracy
  passFraction?: number;          // default 0.6 of rounds cleared
  resolution: { success: StoryBeat; partial: StoryBeat; fail: StoryBeat };
}

/** Persisted (store v2), replaces `bosses`. */
export interface CrisisRecord {
  stars: number; bestPoints: number; attempts: number; completedAt?: string;
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
  id: string;                     // 'kc-<roleId>'
  roleId: string;
  questions: QuizQuestion[];      // unchanged shape; every question must carry roleId === this roleId (FAIL)
  secondsPerQuestion?: number;
}

export interface KnowledgeRecord {
  attempts: number;
  bestFraction: number;
  ribbon: boolean;                // bestFraction ≥ 0.8
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
  levelId: string; stageId: string; itemId: string;
  box: number; dueAt: string; misses: number;
}
// key: `${levelId}:${stageId}:${itemId}`

export interface ReviewNode { id: string; worldId: WorldId; title: string; maxRounds?: number /* 6 */; roundSeconds?: number /* 20 */ }
```

Each due situation becomes one 20-second round running the original stage's engine
with the original level's artifact defaults, padded so the round is meaningful.
Padding is deterministic (seeded by the situation key) so a review is reproducible:

| Engine             | Round content                                                                                          |
| ------------------ | ------------------------------------------------------------------------------------------------------ |
| bucket-sort        | the missed card + 2 other cards from the stage (min 3 cards); all original buckets                     |
| builder            | the missed slot only, with its correct part + 2 distractor parts from the original tray (min 3 parts)  |
| branching-scenario | starts at the **parent node** of the missed choice; that one decision with its original choices; ends after it |
| spot-the-impostor  | the missed card + 2 innocent cards (min 3), evidence panel intact                                       |
| allocator          | all categories shown; only the missed category adjustable, others fixed at target values; simulation (if any) skipped |
| sequence-sort      | the missed item and its two neighbours as a 3-item mini sequence                                        |
| match-pairs        | the missed pair + 2 other pairs (3 × 3)                                                                 |
| dash-manager       | the missed item alone in the queue, all stations, patience × 1.5                                       |

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
  artifacts: ArtifactStore;                        // new, {}
  knowledge: Record<string, KnowledgeRecord>;      // new, {} keyed by roleId
  situations: Record<string, SituationRecord>;     // new, {}
  crises: Record<string, CrisisRecord>;            // from `bosses`
  concepts: Record<string, ConceptRecord>;         // kept, Test Yourself ordering only
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
