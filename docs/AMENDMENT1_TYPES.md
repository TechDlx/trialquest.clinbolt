# Amendment 1 — types (revision 4, implemented)

Status: **implemented**. The source of truth is now `src/content/types.ts`; this document
explains the rules behind those types and records what changed since revision 3. Every
S-item and C-item from the revision 3 review is marked below.

Conventions: **FAIL** = `npm run validate:content` fails the build; **WARN** = printed.

---

## 0. Engine result pipeline — done

`src/engine/pipeline.ts` holds every rule: `applyMistake`, `applyMeterDelta` (shortcuts,
bands, crisis `meterHit`; a meter at zero is a setback), `scoreLevel`, `scoreBoss`,
`scoreCrisis`, `crisisRoundPoints`, `conceptOutcomes`, `aggregateStages`. Screens are hosts.
Engines emit `EngineResult { accuracy, speed, mistakes, shortcuts, itemResults, outcomes,
correct, total, heartsLost }` and never touch the store. The quiz characterization tests
were retired with the quiz levels; their rules live in `pipeline.test.ts` (15 tests,
including a crisis/boss result driving a meter to zero).

## 1. Multi-stage levels — done

`Level.stages: [Stage, ...Stage[]]`, `Stage { id, title?, brief?, game, weight? }`.
`StageRunner` plays stages in order with a stage card between them and its own timer per
stage (`seconds` × world timer scale; branching scenarios are untimed). Accuracy and speed
are weight-averaged; mistakes and shortcuts concatenate; `outcomes` are keyed by stage for
`OutcomeRule.stageId`. `SituationRecord` keys are `level:stage:item`. w1-l3 is
`findings` (bucket-sort, weight 1) then `dose` (allocator + simulation, weight 2).

## 2. Simulation — done

Discriminated on `kind` (visual type) and `host` (band shape: `RangeBand` for allocator,
`PartsBand` for builder). `preview: 'live' | 'on-commit'` with data-only `curves`
(`[x, y]` points, linear interpolation; a `PreviewCurve` may be named by
`DoseResponseVisual.exposureCurve` so the reveal shows the value at the committed dose:
**S6 done**). Half-open bands, last band closed; validator FAILs on gaps, overlaps,
coverage, bad `targetBand`, duplicate tags, missing curves for live preview, curves that
do not cover the range.

**First commit is binding.** It alone sets band accuracy, band meters and the artifact
tag; sandbox edits never reach the score (covered by `engines.test.tsx`). After the
reveal an on-commit simulation opens the labelled "What if?" sandbox (`sandbox: false`
to omit); live previews have no sandbox.

`DoseResponseVisual = { cohort, fine, mild, serious, exposureCurve? }` (**S7 done**: the
body now matches the code; the old responders/adverse fields are gone).

## 3. Variants — done

`LevelVariant { when, patch: { intro?, stages?: Record<stageId, StagePatch>, debrief?, meterOpening? } }`.
`StagePatch { brief?, items?: Record<collection, ItemPatch>, fields? }` with
`ItemPatch { add?, remove?, replace? }` matched by item id. Collections per engine are
registered in `src/engine/registry.ts`; `engine` and collections are not patchable via
`fields` (PatchError). All matching variants apply in declared order; later wins.
`meterOpening` sums across matching variants.

**S1 done:** `choices` is a registered virtual collection of branching scenarios (ids
unique per stage). `items.choices.replace [{ id: 'c-pause', next: 'n-sentinel' }]` works;
`items.choices.add` needs a `nodeId`. `nodes.replace` may change copy only (`text`,
`speaker`, `end`); a `choices` key in a node replace is a PatchError and a validator FAIL.

**Validation (revised):** the validator enumerates **every tag assignment** over the
consumed keys (cartesian product of registry tags, defaults included), builds the level
for each, and runs full stage validation, cameo checks and rule checks on the result.
WARN above 24 assignments. `consumes` is derived from `variants[].when`.

**S5 done:** summed `meterOpening` may never take a meter to 10 or below from the
post-setback floor of 40, for any assignment (FAIL). The reckless hold opening is −20 so
that reckless + fast escalation (−25) leaves 15.

## 4. Artifacts — done

`src/content/artifacts.ts` is the registry; `ArtifactKey = keyof typeof artifactRegistry`.
Each spec has `tags`, `defaultTag` and optional `fields: { name: { label, fallback } }`.

**S2 done:** copy may contain `{{key.field}}`; `interpolate()` resolves it from
`StoredArtifact.data` or the registry fallback (FAIL on unknown key or field). The hold
level's `aggressive` and `reckless` intros use `{{dose.starting.mgPerKg}}`; no variant
copy carries a hard-coded player-dependent number. The `cautious` and `standard` causes
are independent of the dose (**C3**).

Lifecycle: emit only on a pass (stars ≥ 1); replay overwrites (`emittedAt` updated);
consumers resolve at level start (`buildLevel(level, artifacts)`); missing → `defaultTag`.
Consumers must come after their emitter on the map (FAIL; WARN while the consumer's
world is still `planned`, because Milestone 3 authors emitters later). Crisis rounds use
`local.*` keys, never persisted, never on the Handoff Map; a round may only branch on a
local key emitted by an earlier round (FAIL).

## 5. Shortcuts and OutcomeRule — done

Carriers: bucket, builder part, scenario choice, allocator preset, dash station, impostor
sign-off; `sequence-sort` and `match-pairs` use `Level.shortcutPrompt`. A shortcut never
counts as correct and is not a mistake event.

**S3 done (allocator preset with a simulation):** the shortcut applies when the preset was
_tapped and committed unchanged_. Positive deltas apply at the tap (the lure). At the
reveal, for each meter the worse of the shortcut's negative and the band's negative
applies, once; no suppression. `use-hed` nets timeline +15 then −10, safety −25 with the
revised band values. A manual drag to the same value is a normal band result.

**S4 done:** "once" = once per carrier per attempt (`usedCarriers` in each engine and in
the level host). Every card placed in a shortcut bucket is still marked `shortcut`.

Shortcuts with a negative safety or integrity delta create a `SituationRecord` and are
replayed as temptations in review nodes.

`OutcomeRule { stageId?, accuracyAtLeast?, band?, endNode?, chosePart?, bucketOf?,
accused?, tookShortcut? }`; all present fields are ANDed. The validator FAILs on fields
that the stage's engine cannot produce, on a missing `stageId` for a multi-stage level, and
on any referenced id that does not exist.

## 6. Maya cameo — done (type + validation; rendering arrives with World 5 content)

`MayaCameo { stageId, itemId, presentation, label, debriefLine }`. FAIL if the item is
missing in any variant build; WARN before World 5.

## 7. Crisis boss — done

`CrisisBoss { rounds: CrisisRound[4..7], slack, clearThreshold, passFraction, resolution }`,
`CrisisRound { roleId, seconds (15–40), brief, game (no quiz), onlyItems?, meterHit, emits?, variants? }`.
One shared pool = Σ seconds × (1 + slack), continuous across rounds, paused during badge
swaps. Round speed = time used ÷ round seconds. Points `100 + 50 × (1 − used)` × streak
(×1.25 after 3, ×1.5 after 5). At most **one heart per attempt**; other failed rounds hit
meters only. A meter at zero ends the crisis as `fail` with the setback. Relaxed mode:
no clock, flat 125 points per cleared round. `success` (≥ passFraction cleared before the
pool expires) → stars from `computeScore`, minimum 1, unlocks the world; `partial` and
`fail` → 0 stars, retry. `CrisisRecord.legacy` marks migrated boss-quiz records; the map
shows "cleared (legacy quiz)" and offers the crisis for stars. World 1: 4 rounds,
100 s of budget, 115 s pool (≤ 120).

## 8. Test Yourself — done

`KnowledgeCheck` content in `src/content/knowledge/`; the 32 World 1 questions are
preserved verbatim (`w1.legacyLevels.ts`, `w1.legacyBoss.ts`) and grouped by role.
Reached from a completed node's sheet on the map and from a completed Role Card in the
Codex. `QuizBlitz.onMistake` is optional and Test Yourself passes none. Questions are
ordered missed-first using `concepts` (its only remaining job). Rewards: +10 XP and the
ribbon at ≥ 80 % (first time), else +2 per correct once a day, capped at 10.

## 9. Review micro-rounds — done

`src/engine/review.ts` builds 20-second rounds from due situations with per-engine
padding (table in `docs/CONTENT_GUIDE.md`); shortcut situations keep the temptation
available and count "correct" as not taking it. `SituationRecord` is pruned on load when
its level, stage or item no longer exists.

## 10. Validator — done

`src/content/validate.ts` returns `Issue { severity, file, id, message, fix }`;
`formatIssue` prints file · id, the problem in plain language, and a fix. Added since
revision 3: quiz-blitz anywhere on the main path; rule fields not applicable to the
engine; every dangling id; crisis `roleId` outside its world; **S8** WARN when a
scenario never branches (every multi-choice node's choices share one `next`); unreachable
nodes; shortcut buckets that are a card's correct bucket; shortcut parts with a `slotId`;
shortcut choices not marked `bad`. The guide has a "common validator errors" section.

## 11. Store schema v2 — done

`ProgressData` gained `artifacts`, `knowledge`, `situations`, `crises` (from `bosses`).
Migration v1→v2 applies the id rename map to every id-keyed map and list, marks migrated
crisis records `legacy: true`, and initialises the new maps; a real v1 fixture is tested
in `src/store/migration.test.ts`. `pruneSituations` runs on load.

---

## Appendix A — the worked chain (c) is now real content

- `src/content/worlds/w1/levels.ts` → `w1-l3` (findings + dose stages, `noise` bucket
  shortcut, `use-hed` preset shortcut, on-commit dose-response with an exposure curve,
  emits `dose.starting` with `mgPerKg`). **C4:** the reveal is framed as "Dose's
  projection of the first cohort"; the World 1 band safety hits were reduced (aggressive
  −5, reckless −10) and the World 4 opening hits kept, so one decision is not charged
  twice. **C5:** a MABEL sentence in the intro; ALT is defined on first use in every level.
  `standard` widened to [0.3, 0.8) per the review note.
- `src/content/worlds/w4/levels.ts` → `w4-l4` (registered early because it consumes
  chain c). **C1:** `c-skip` routes to `n-respond-noplan` and can only reach
  `end-reimposed` or, by writing the amendment after all, `n-respond`; `c-continue` goes
  to `n-workup-2` (a second volunteer affected); `c-stop-all` gets the board pushback
  node with a real `end-abandoned` ending. **C2:** the `reckless` variant adds
  `n-sentinel` (sentinel dosing decision) via `nodes.add` and reroutes two choices via
  `choices.replace`; 12 assignments total. **C3:** `cautious` opens with a timeline cost
  and an independent trigger at cohort 5; only `aggressive`/`reckless` cite the dose.
  **C5:** the intro notes that "clinical hold" is the FDA term.
- `src/content/worlds/w1/crisis.ts` → the World 1 crisis with a `local.signal` hand-off
  from round 1 to round 4.

## Appendix B — changelog

**Revision 4 (implemented):** S1 choices collection and copy-only node replace; S2
`{{key.field}}` interpolation with registry fallbacks; S3 preset-shortcut trigger on the
action with worse-of negatives; S4 once per carrier per attempt; S5 opening floor; S6
exposure curve in the reveal; S7 body reconciled; S8 non-branching warning and
plain-language issues; C1–C6 as in Appendix A and `docs/CONTENT_REVIEW.md`. Also:
`ItemPatch` typed loosely (`Record<string, unknown>`) so content literals type-check;
missing-emitter is a WARN for planned worlds; `sandbox` defaults on; branching is untimed.

**Revision 3:** binding first commit + sandbox; shortcuts feed review; tag-assignment
validation; worked example; `shortcut?` off `ScoredItem`; dose tags gain `reckless`;
preset meters allowed; `meterOpening` sums; `context` on allocator; float tolerance.

**Revision 2:** stages, discriminated simulation, id-based patches, artifact registry,
per-engine shortcut table, crisis economy, review padding, migration.
