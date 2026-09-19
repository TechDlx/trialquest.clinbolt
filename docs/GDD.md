# Trial Quest — Game Design Document

Version 0.2 · 2026-09-18 · Status: draft for approval (Amendment 1 applied)

Changes from v0.1 are marked **[A1]**. Where this document and SPEC.md differ, SPEC
Amendment 1 wins.

## 1. Vision

Trial Quest is a 3-to-5-hour browser game that teaches how a medicine gets from an
idea to a patient. You follow Maya, a patient with fictional Veridian Syndrome, and
VX-101, the fictional molecule that may treat her. To move Maya forward you must
"clock in" as each of 44 real jobs in drug development, do a 1-to-3-minute version
of that job, and hand your work to the next role.

Design pillars:

1. **Learn by doing the job.** **[A1]** Every main-path level is a simulation of the
   role's real work with visible consequences. No main-path pass condition is
   recall-only. Quizzes exist only as the optional "Test Yourself" mode.
2. **Failure teaches.** Every mistake explains why and names the real-world
   consequence. Hearts make mistakes matter; retries are cheap.
3. **Hand-offs are the plot.** **[A1]** Hand-offs are playable: the protocol you
   write shapes the eCRF you build, the dose you pick shapes the Phase I escalation
   and the clinical hold. The Handoff Map, the debrief hand-off line, and the finale
   relay chain reinforce it.
4. **Respect the phone.** 360 px, one thumb, no hover, 44 px targets, relaxed-mode
   timers, reduced motion.

Audience: students, new hires at sponsors/CROs/vendors, curious non-experts. Zero
prior knowledge assumed. Reading level: 9th grade. Every acronym defined on first
use and tappable for a glossary tooltip.

## 2. Core loop (one node ≈ 3–7 minutes) **[A1]**

```
World Map ──tap node──▶ Badge Swap (1.5 s) ──▶ Role Card (must flip)
     ▲                                                     │
     │                                              "Start task"
     │                                                     ▼
  Unlock next node ◀── Debrief (stars, XP, consequences, artifact handed off) ◀── Task (60–180 s)
```

1. **World Map.** Winding vertical path, 8 worlds. Node states: `locked`,
   `current` (pulsing ring, Dose beside it), `done` (badge + stars), `review`
   (optional), `crisis` (siren glyph, end of world). Completed level nodes also show
   a small "Test Yourself" ribbon slot (see §7).
2. **Badge Swap.** Lanyard drops, new badge slides in. 1.5 s, skippable, cross-fade
   under reduced motion.
3. **Role Card.** Front: title, employer, "What I do", responsibilities. Back:
   skills, "I receive from ➜ I hand off to", documents, day-in-the-life. **Start task**
   unlocks after the back face has been shown. First view: +5 XP, filed in the Codex.
4. **Task.** One of nine engines, configured from content. **[A1]** Every task is a
   "do the job" simulation: sort, build, decide, allocate, spot, manage a queue. Where
   the job is a judgement with a numeric answer (starting dose, sample size, next
   dose, price), the engine ends with a **consequence simulation**: the player commits
   a value and watches what happens (§6.2). The HUD shows hearts, timer or "Relaxed"
   chip, the three meters, pause.
5. **Debrief.** Stars, XP tally, "What you just learned", a "Consequences" list built
   from the mistakes actually made, the hand-off line, and **[A1]** the artifact you
   just produced ("You handed off: Starting dose 3 mg/kg (cautious)").
6. **Unlock.** Next node opens. **[A1]** End of each world = a **Crisis Boss** (§8):
   one cross-role emergency on a shared clock, resolved by rapid badge-swapping
   through that world's roles. Then a story beat with Maya.

Optional at any time: **Test Yourself** (§7) from the Codex or from a completed node.
It never gates progress.

## 3. Worlds, nodes, and story beats

44 role levels + 8 crisis bosses + 10 review nodes + 1 finale = 63 nodes.

| World | Title                 | Levels | Reviews | Crisis (end of world)                                                                                                           | Story beat                                                                     |
| ----- | --------------------- | ------ | ------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 1     | Diagnosis & Discovery | 4      | 1       | Unexpected toxicity signal in an animal study: classify findings, reformulate, check the backup, tell the community             | Maya has a name for it; VX-101 exists. "Most molecules never leave this room." |
| 2     | Designing the Trial   | 5      | 1       | Regulator returns the IND/CTA with questions: fix the endpoint, re-power, answer the IRB, re-budget                             | The protocol exists. The trial may begin.                                      |
| 3     | Study Start-Up        | 7      | 2       | A site's freezer fails the night before first dose: reship, re-file, re-validate, re-consent plan                               | Sites open, drug on shelves, systems live.                                     |
| 4     | Phase I               | 4      | 1       | Liver enzyme spike in cohort 3: screen, manage the visit, read PK, decide on the hold (**scripted setback**, shaped by chain c) | Safe dose range found.                                                         |
| 5     | Phase II              | 5      | 1       | A site's data looks too clean: monitor, query, code, triage the SAE that surfaces                                               | Maya enrols, blinded. The right dose is found.                                 |
| 6     | Phase III             | 7      | 2       | Interim analysis week: DSMB, lock, program, write, all before the deadline                                                      | Unblinding: it worked. Maya was on placebo.                                    |
| 7     | Submission & Approval | 5      | 1       | Day-74 filing review letter: publish fix, answer questions, host the inspector, negotiate the label                             | Approved, with a label.                                                        |
| 8     | Launch & Beyond       | 7      | 1       | Post-market signal: pull the off-label claim, brief MSLs, confirm the signal, update the label                                  | Maya receives the medicine. Finale.                                            |

Review nodes are optional and never block. **[A1]** They replay missed _situations_
as 20-second micro-rounds (§4.6), not quiz questions.

### 3.1 The World 4 clinical hold (scripted setback) **[A1]**

Shaped by artifact chain (c). The `dose.starting` artifact from the Toxicologist
(`cautious` / `standard` / `aggressive`) and `phase1.escalation` from the Clinical
Pharmacologist (`slow` / `standard` / `fast`) select the Safety Review Committee
scenario variant: an aggressive start plus fast escalation gives a harsher signal,
a longer hold text, and a −20 Safety opening hit; cautious choices give a mild signal
that still needs the correct process. Every variant is winnable; the process is what
is graded.

### 3.2 Finale

Maya's scene, the relay chain of every badge with hand-off lines and the artifacts
that travelled down the chain, the years/cost stat card, then the certificate.
**[A1]** The certificate carries an optional "Knowledge checks: N of 44" line only if
the player opened Test Yourself at least once.

## 4. Economy

All numbers live in `src/content/economy.ts`.

### 4.1 Scoring and stars (shared by all engines)

Every engine reports `accuracy` (0–1) and `speed` (0–1; fixed at 0.5 when untimed or
in relaxed mode).

```
score = round(80 × accuracy + 20 × speed)
stars: ≥ 85 → 3, ≥ 65 → 2, ≥ 45 → 1, < 45 → fail (retry, no XP)
```

**[A1]** "Accuracy" is always a measure of _doing the job well_: correct buckets,
correct order, correct parts, defensible value in the simulation band, best/ok/bad
choices in a scenario. It is never a count of recalled facts.

### 4.2 XP

| Source                                          | XP                                             |
| ----------------------------------------------- | ---------------------------------------------- |
| Level completed                                 | 15 × stars                                     |
| Perfect run (no hearts lost)                    | +10                                            |
| First-time completion                           | +10                                            |
| Role Card first viewed                          | +5                                             |
| **[A1]** Crisis boss                            | 0–100 by points ÷ max, +20 first try           |
| Review node completed                           | +15, +5 if all clean                           |
| World completed with each meter ≥ 70            | +15 per meter                                  |
| Streak milestones 3 / 7 / 14 / 30 days          | +25 / +50 / +100 / +200                        |
| **[A1]** Test Yourself (per role, first ≥ 80 %) | +10 and the Knowledge Check ribbon             |
| **[A1]** Test Yourself (replays)                | +2 per correct, once per role per day, max +10 |

Ranks unchanged: Intern 0 · Trainee 250 · Associate 700 · Specialist 1,400 ·
Manager 2,200 · Director 3,000 · VP Development 3,800 · Chief Development Officer 4,400.
Test Yourself XP is bonus on top; every rank is reachable without it.

### 4.3 Hearts

Max 5. A **mistake event** (per engine, §6) costs 1 heart. At 0 hearts the level
pauses in place (clock held, engine mounted) and a hearts sheet opens: re-read any
collected Role Card for +1 heart, or wait for the refill, then continue exactly where
you stopped. Quitting keeps a **per-item checkpoint** (`attempts` in the progress store):
completed stages, the current stage's engine state (every engine reports a serializable
snapshot after each change) and the seconds left on its clock are saved, and the level
intro offers "Continue where you left off" or "Start over". Only a meter setback ends the level. Refill +1 per
30 min, +1 per Codex card review per day, full refill on a review node. World 1:
first mistake per level is free.
**[A1]** Test Yourself never touches hearts. Crisis boss: a failed round costs 1 heart.

### 4.4 Meters (Patient Safety, Data Integrity, Timeline/Budget)

Each 0–100, start 100, raised to ≥ 60 at each world start. Setbacks at 0: Clinical
Hold / Inspection Finding / Portfolio Review (retry level, meter reset to 40).

**[A1] Meters carry the stakes.** Every main-path level contains at least one
**tempting shortcut**: an option that improves Timeline/Budget and hurts Safety or
Integrity (e.g. "skip the repeat assay, ship on time": Timeline +10, Integrity −15).
Content marks such options with `shortcut: true`; the validator warns when a level
has none. Shortcuts are never the "right" answer for stars, but they are not
mistake events either: the meters are the cost. This is how the trade-off is taught.

Test Yourself never moves meters.

### 4.5 Streak

Unchanged: one completed level, crisis, or review per local calendar day; freezes
earned per world, max 2, auto-applied.

### 4.6 Spaced repetition (review nodes) **[A1]**

- Every scorable item in every engine has an `id`. A mistake records the
  **situation** `levelId:itemId` in Leitner box 1 (boxes 1→5, delays 0/1/3/7 days,
  5 = retired).
- A review node picks up to 6 due situations (oldest first) and builds a playlist of
  **20-second micro-rounds**, each running the original engine restricted to that
  item (`onlyItems`), with the original level's artifact defaults. No hearts at
  stake. Completing the playlist refills hearts.
- Nothing due: "All caught up", hearts refilled, no XP.

### 4.7 Crisis boss **[A1]** (replaces the boss quiz)

- One story situation, an ordered playlist of 4–7 **micro-rounds** (15–40 s each),
  each a badge-swap into one role of that world running one existing engine with a
  small config (≤ 4 items / 1 decision / 1 build slot group).
- **Shared clock:** total = Σ round seconds + 15 % slack. Unused seconds carry over
  to the next round (Diner Dash pressure). Clock expiry ends the crisis; rounds not
  reached count as failed. Relaxed mode: no clock, speed fixed at 0.5.
- **Round result:** `cleared` when round accuracy ≥ 0.6. Points per cleared round =
  `100 + round(50 × timeLeft/roundSeconds)` × streak multiplier (×1.25 after 3
  cleared in a row, ×1.5 after 5). A failed round costs 1 heart and applies the
  round's `meterHit`.
- **Pass:** ≥ 60 % of rounds cleared before the clock runs out. Stars from
  `computeScore(mean round accuracy, mean time-left fraction)`. XP = points ÷ max ×
  100, +20 if passed first try. Pass unlocks the next world and its story beat.
- **Resolution text** is chosen by outcome (`success`, `partial`, `fail`) and names
  the meters' state ("You kept patients safe but the timeline slipped two months").

### 4.8 Test Yourself **[A1]** (optional knowledge check)

- Reuses the quiz-blitz engine unchanged (colour + shape answers, 1–4 keys,
  countdown, speed bonus, streak multiplier; relaxed mode removes the timer).
- Entry points: a "Test Yourself" button on any completed Role Card in the Codex,
  and on any completed level node on the map (long-press or the node's detail sheet).
  Questions are drawn from `KnowledgeCheck` content for roles the player has
  finished; the world-node variant mixes all finished roles in that world.
- Rewards are cosmetic/bonus only (§4.2): small XP, the **Knowledge Check ribbon** on
  the role badge (Codex + map), and an optional certificate line. No hearts, no
  meters, no unlocks. A player who never opens it can 100 % the game.

## 5. Difficulty curve

| World | Timer scale | Items per task | Distractors         | Hearts rule        |
| ----- | ----------- | -------------- | ------------------- | ------------------ |
| 1     | ×1.4        | 4–6            | obvious             | first mistake free |
| 2     | ×1.2        | 5–7            | plausible           | normal             |
| 3–4   | ×1.0        | 6–8            | plausible           | normal             |
| 5–6   | ×0.9        | 8–10           | subtle, two-step    | normal             |
| 7–8   | ×0.85       | 8–12           | subtle, cross-world | normal             |

Engines are introduced one at a time across the first 12 levels with a Dose tutorial
bubble. **[A1]** Crisis bosses use engines the player has already met in that world.

## 6. Mini-game engines

All engines share `TaskShell`, `useTaskRun`, `scoring.ts`, `hearts.ts`, `meters.ts`.
Each engine takes its typed config and calls
`onComplete({ accuracy, speed, mistakes[], outcomes })`.

| Engine                                   | Input model (touch + keyboard)                         | Mistake event                     | accuracy / speed                                          |
| ---------------------------------------- | ------------------------------------------------------ | --------------------------------- | --------------------------------------------------------- |
| quiz-blitz **[A1]** _Test Yourself only_ | Tap one of 4 buttons; keys 1–4                         | wrong answer (no heart)           | correct ÷ N; avg time left                                |
| sequence-sort                            | Tap item then slot (or drag); arrows + Enter           | submit with ≥ 1 wrong position    | correct positions ÷ N on final submit; time left          |
| match-pairs                              | Tap left, tap right; Tab/Enter                         | wrong pair                        | correct ÷ (correct + wrong); time left                    |
| bucket-sort                              | Swipe (2 buckets) or tap bucket button (2–4); keys 1–4 | wrong bucket                      | correct ÷ N; avg time left per card                       |
| dash-manager                             | Tap queued item, tap stations in order; Tab, keys 1–5  | patience expires or wrong station | served ÷ total; avg patience remaining                    |
| spot-the-impostor                        | Tap card to inspect, tap Accuse; Enter/Space           | wrong accusation                  | correct accusations ÷ accusations; time left              |
| builder                                  | Tap part in tray, tap slot; Enter                      | submit with ≥ 1 wrong/empty slot  | correct slots ÷ slots; time left                          |
| branching-scenario                       | Tap a choice (2–3 per node)                            | choosing a `bad` option           | Σ choice quality ÷ max (best 1, ok 0.5, bad 0); speed 0.5 |
| allocator                                | Steppers (−/+) or slider per category; arrow keys      | submit outside constraints        | categories within target ÷ categories; time left          |

All engines support `onlyItems?: string[]` (for review micro-rounds and crisis
rounds) and every scorable item has a stable `id`.

### 6.1 Shortcut options **[A1]**

Any option/item/choice may carry `shortcut: { meters: { timeline: +10, safety: −15 },
why: "…" }`. Choosing it applies the meters immediately, shows a one-line Dose aside,
and is recorded for the debrief. It is not a mistake event.

### 6.2 Consequence simulation **[A1]**

An optional `simulation` block on **allocator** (numeric inputs) and **builder**
(discrete choice) configs. The engine's normal interaction ends with "Commit", then
the simulation plays a 3–6 second reveal and shows the outcome band:

| Kind            | Player commits          | Reveal                                                        | Used by                      |
| --------------- | ----------------------- | ------------------------------------------------------------- | ---------------------------- |
| `dose-response` | starting dose (slider)  | first cohort of 6 avatars: responders / adverse events / fine | Toxicologist (W1), SRC (W4)  |
| `trial-power`   | sample size (slider)    | power, cost, months update live; then "run it 100 times" bar  | Biostatistician (W2)         |
| `pk-next-dose`  | next dose on a PK chart | exposure curve vs. safety ceiling                             | Clinical Pharmacologist (W4) |
| `price-access`  | price (slider)          | payer coverage %, patients reached, revenue index             | Market Access (W8)           |

Bands are ordered ranges over the committed value. Each band has a `tag` (this is
what becomes the artifact), narration, meter deltas, and kind-specific visual
numbers. Accuracy = 1 for the target band, 0.5 for an adjacent band, 0 otherwise;
the player can watch the outcome, then "Try another value" costs no heart until the
timer is up (one heart per extra attempt after the first in worlds 3+).

## 7. Screens and flow **[A1]**

```
Title ─▶ (first run) Intro ─▶ World Map
World Map ─▶ Badge Swap ─▶ Role Card ─▶ Task (+ simulation) ─▶ Debrief ─▶ World Map
World Map ─▶ Crisis Boss (rounds with mini badge swaps) ─▶ Resolution ─▶ Story Beat ─▶ next world
World Map ─▶ Review Node (micro-round playlist) ─▶ Debrief ─▶ World Map
World Map ─▶ Clinical Hold overlay (W4) ─▶ SRC level (variant by chain c)
Codex ─▶ Role Card ─▶ Test Yourself (optional) ─▶ Knowledge Check result
Map node (done) ─▶ Test Yourself for that world (optional)
Last level ─▶ Finale ─▶ Certificate
```

Screens: Title, Intro, WorldMap, BadgeSwap, RoleCard, Level, Debrief, **CrisisBoss**
(replaces BossQuiz), **TestYourself** (hosts quiz-blitz), StoryBeat, ReviewNode,
Setback, Codex, Glossary, HandoffMap, Settings, Finale, Certificate.

## 8. Crisis boss design notes **[A1]**

- Open with a 2-line situation card and the shared clock. Each round starts with a
  0.6 s mini badge swap (skippable, cross-fade under reduced motion) and a one-line
  brief ("You're the Toxicologist. Which findings are adverse?").
- Round order tells the story of the hand-off: the output tag of a round can select
  the variant of a later round in the same crisis (same `variants` mechanism as
  levels, scoped to the crisis).
- World 1 crisis (proposed content): _"Day 212: the 28-day rat study shows liver
  changes at the mid dose."_
  1. Toxicologist, bucket-sort, 30 s: sort 4 findings into Adverse / Not adverse /
     Needs pathology review.
  2. CMC Scientist, builder, 35 s: rebuild the capsule with a slower-release
     excipient set (3 slots, 6 parts, one tempting "ship current batch" shortcut).
  3. Discovery Scientist, spot-the-impostor, 30 s: among 4 backup compounds, find
     the one whose selectivity data is the off-target liability.
  4. Patient Advocate, branching-scenario, 40 s: tell the community about a 3-month
     delay without over- or under-promising (2 decisions).

## 9. Mascot and tone

Unchanged. Dose is warm, brief, never sarcastic. **[A1]** Dose voices the shortcut
aside ("Faster, sure. But that's a finding waiting to happen.").

## 10. Content model (types live in `src/content/types.ts`)

Unchanged from v0.1 except as proposed in `docs/AMENDMENT1_TYPES.md`: `CrisisBoss`,
`KnowledgeCheck`, artifact types, `SimulationBlock`, `MayaCameo`, `shortcut`, and
`id` on every scorable item. `BossQuiz` is retired; its questions become
`KnowledgeCheck` content.

Validation additions: crisis rounds reference roles in their world; each crisis has
≥ 4 rounds within 15–40 s; every `consumes` artifact is emitted by an earlier level
in node order (fail); every level has ≥ 1 shortcut option (warn); every
`mayaCameo.itemId` exists in that level's config (fail); every `KnowledgeCheck`
question keeps the quiz-question shape (fail).

## 11. Playable hand-offs: the artifact system **[A1]**

**Goal:** earlier choices change later content, without code in content files and
without breaking standalone play or replay.

- An **artifact** is a small JSON-serialisable record with a `key`, a discrete
  `tag` (the outcome that later content branches on), optional `data`, and
  provenance (`emittedBy`, `emittedAt`).
- **Emitting:** a level declares `emits: [{ key, outcomes: [{ tag, when }] }]`.
  `when` rules are engine-agnostic (`accuracyAtLeast`, `endNode`, `band`,
  `chosePart`, `bucketOf`) and are evaluated against the engine result on completion;
  first match wins; `default` tag if none match.
- **Consuming:** a level declares `consumes: ['dose.starting']` and
  `variants: [{ when: { 'dose.starting': 'aggressive' }, patch: { intro, game: {…} } }]`.
  Patches are shallow-merged into the level's copy at load time. A missing artifact
  resolves to the key's `defaultTag`, so every level works standalone, on deep
  link, and on replay. Replaying an emitter overwrites its artifact.
- **Chains in scope now:**
  a) `protocol.criteria` (W2 Clinical Scientist) → `ecrf.fields` (W3 EDC) →
  `screening.eligibility` (W4 PI) → `monitoring.deviations` (W5 CRA)
  b) `ae.report` (W4 CRC) → `ae.coded` (W5 Coder) → `safety.report` (W5 PV) →
  `label.warnings` (W7 Labeling)
  c) `dose.starting` (W1 Toxicologist) → `phase1.escalation` (W4 Pharmacologist) →
  `phase1.hold` (W4 SRC, the scripted setback)
- **Persistence:** `PlayerProgress` schema v2 adds `artifacts` and `knowledge`;
  migration v1→v2 fills both with `{}`.
- **Visibility:** the debrief shows the artifact produced; the Handoff Map shows
  artifacts travelling along edges; the finale relay chain lists them.

## 12. Maya on screen **[A1]**

From World 5 on, levels may set `mayaCameo: { itemId, presentation, debriefLine }`.
The engine renders that item with Maya's presentation: `queue` (portrait in the
CRC's visit queue), `data-row` (anonymised "Participant 0417" row in a query list),
`blinded-point` (an unlabeled point in the DSMB chart, revealed in the debrief),
`dialogue` (she speaks in a scenario), `consent` (her consent form in a builder).
The debrief line ("That query was Maya's visit 6 blood draw") lands after the task so
the cameo never leaks the blind mid-level.

## 13. Technical notes

Unchanged from v0.1 (Vite, React 19, TS strict, Tailwind v4, Zustand, Framer Motion,
hash routing, per-world lazy chunks, ≤ 300 KB gzipped core, PWA, Web Audio tones,
canvas certificate, WCAG AA). **[A1]** Quiz-blitz stays in the core bundle only if
Test Yourself is on the map; otherwise it moves to the Codex chunk.
