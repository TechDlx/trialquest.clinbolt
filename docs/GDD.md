# Trial Quest — Game Design Document

Version 0.1 · 2026-09-18 · Status: approved draft

## 1. Vision

Trial Quest is a 3-to-5-hour browser game that teaches how a medicine gets from an
idea to a patient. You follow Maya, a patient with fictional Veridian Syndrome, and
VX-101, the fictional molecule that may treat her. To move Maya forward you must
"clock in" as each of 44 real jobs in drug development, do a 1-to-3-minute version
of that job, and hand your work to the next role.

Design pillars:

1. **Learn by doing the job.** Every level is a simulation of the role's real
   work, not a quiz about it (boss quizzes are the exception, and they are fast).
2. **Failure teaches.** Every mistake explains why and names the real-world
   consequence. Hearts make mistakes matter; retries are cheap.
3. **Hand-offs are the plot.** The relay from role to role is the thing players
   should remember. The Handoff Map, the debrief hand-off line, and the finale
   relay chain all reinforce it.
4. **Respect the phone.** 360 px, one thumb, no hover, 44 px targets, relaxed-mode
   timers, reduced motion.

Audience: students, new hires at sponsors/CROs/vendors, curious non-experts. Zero
prior knowledge assumed. Reading level: 9th grade. Every acronym defined on first
use and tappable for a glossary tooltip.

## 2. Core loop (one node ≈ 3–7 minutes)

```
World Map ──tap node──▶ Badge Swap (1.5 s) ──▶ Role Card (≥ 30 s, must flip/scroll)
     ▲                                                     │
     │                                              "Start task"
     │                                                     ▼
  Unlock next node ◀── Debrief (stars, XP, learned, consequences, hand-off) ◀── Task (60–180 s)
```

1. **World Map.** Winding vertical path, 8 worlds, Duolingo style. Node states:
   `locked` (grey, lock glyph), `current` (pulsing ring, Dose mascot standing
   beside it), `done` (badge art + 1–3 stars), `review` (rotating-arrows glyph,
   optional), `boss` (crown glyph). Only the current node and any done node are
   tappable. World header shows story progress for Maya and the three meters.
2. **Badge Swap.** A lanyard drops in, the old badge slides out, the new badge
   (role title, employer colour, world number) slides in. 1.5 s, skippable,
   replaced by a cross-fade under `prefers-reduced-motion`.
3. **Role Card.** Front face: title, employer chip (Sponsor / CRO / Site /
   Regulator / Vendor / Patient), "What I do", 3–5 responsibilities. Back face
   (tap "Flip" or scroll on small screens): skills and background, "I receive
   from ➜ I hand off to" (tappable role chips), documents and systems touched,
   "Day in the life" fun fact. **Start task** is disabled until the back face has
   been shown at least once. First view of a card grants +5 XP and files it in
   the Career Codex.
4. **Task.** One of nine engines, configured from content data. HUD: hearts,
   timer (or "Relaxed" chip), the three meters, pause button. Pause menu:
   Resume, Re-read Role Card, Relaxed mode toggle, Quit to map (attempt not
   counted).
5. **Debrief.** Stars (1–3) with a short burst, XP tally counting up, "What you
   just learned" (2 sentences), a "Consequences" list built from the mistakes
   actually made (each with its real-world consequence), and the hand-off line.
   Buttons: Continue, Retry (for more stars), View Role Card.
6. **Unlock.** Path animates to the next node. After the last role of a world:
   Boss Quiz, then a story beat with Maya, then the next world opens.

## 3. Worlds, nodes, and story beats

44 role levels + 8 boss quizzes + 10 review nodes + 1 finale = 63 nodes.

| World | Title                   | Role levels | Review nodes | Story beat at end                                                                                                                 |
| ----- | ----------------------- | ----------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| 1     | Diagnosis & Discovery   | 4           | 1            | Maya gets a name for her illness; a lab finds VX-101. "Most molecules never leave this room."                                     |
| 2     | Designing the Trial     | 5           | 1            | The protocol exists on paper. Regulators allow the trial to begin.                                                                |
| 3     | Study Start-Up          | 7           | 2            | Sites are open, drug is on shelves, systems are live. Nobody has been dosed yet.                                                  |
| 4     | Phase I: Is it safe?    | 4           | 1            | **Scripted setback:** a clinical hold after a liver enzyme signal. Player must resolve it (see 3.1). Then: safe dose range found. |
| 5     | Phase II: Does it work? | 5           | 1            | Maya enrols. She doesn't know if she is on VX-101 or placebo. The right dose is found.                                            |
| 6     | Phase III: Prove it     | 7           | 2            | Database lock, unblinding: VX-101 worked. Maya was on placebo the whole time.                                                     |
| 7     | Submission & Approval   | 5           | 1            | The regulator approves VX-101 with a label.                                                                                       |
| 8     | Launch & Beyond         | 7           | 1            | Maya receives the approved medicine. Finale: relay chain, years/cost vs. real averages, certificate.                              |

Review nodes are placed after roughly every 3–4 role levels and before each boss.
They are optional; they never block the path.

### 3.1 The World 4 clinical hold (scripted setback)

After the Clinical Pharmacologist level, a "Clinical Hold" screen interrupts the
map: a volunteer's liver enzymes spiked. The Safety Review Committee level (a
branching scenario) becomes the hold-resolution task: the player must choose to
pause dosing, investigate, amend the protocol (lower dose step, add liver
monitoring), and respond to the regulator. Choosing to "push on" costs a heart
and Patient Safety −20 and re-prompts. Clearing the level lifts the hold with a
short story beat: "Holds are common. Handling them well is the job."

### 3.2 Finale

After the last World 8 level: Maya's scene, then a scrolling "relay chain" of
every badge collected in order with the hand-off lines, then a stat card:
"Your journey: N years, $X — real-world averages: 10–15 years, $1–2+ billion,
roughly 1 in 10 molecules entering Phase I reaches approval" (numbers sourced in
CONTENT_REVIEW.md), then the certificate.

## 4. Economy

All numbers live in `src/content/economy.ts` so they can be tuned without code
changes.

### 4.1 Scoring and stars (shared by all engines)

Every engine reports `accuracy` (0–1) and `speed` (0–1; 1 when finishing with
full time left, 0 at the limit; fixed at 0.5 in relaxed mode so relaxed players
can still earn 3 stars with perfect accuracy).

```
score = round(80 × accuracy + 20 × speed)      // 0–100
stars: ≥ 85 → 3, ≥ 65 → 2, ≥ 45 → 1, < 45 → fail (retry, no XP)
```

Best stars per level are kept; the map shows the best.

### 4.2 XP

| Source                                 | XP                                                                  |
| -------------------------------------- | ------------------------------------------------------------------- |
| Level completed                        | 15 × stars (15 / 30 / 45)                                           |
| Perfect run (no hearts lost)           | +10                                                                 |
| First-time completion bonus            | +10                                                                 |
| Role Card first viewed                 | +5                                                                  |
| Boss quiz                              | 0–100 (points ÷ max points × 100, rounded), +20 if passed first try |
| Review node completed                  | +15, +5 if all correct                                              |
| World completed with each meter ≥ 70   | +15 per meter (max +45)                                             |
| Streak milestones 3 / 7 / 14 / 30 days | +25 / +50 / +100 / +200                                             |

Max reachable in one clean run ≈ 44×65 + 44×5 + 8×120 + 10×20 + 8×45 ≈ 4,600.

Ranks (cumulative XP, shown on the map header and certificate):
Intern 0 · Trainee 250 · Associate 700 · Specialist 1,400 · Manager 2,200 ·
Director 3,000 · VP Development 3,800 · Chief Development Officer 4,400.

### 4.3 Hearts

- Max 5. Shown as capsule icons in the HUD and on the map.
- A **mistake event** (defined per engine in §6) costs 1 heart.
- At 0 hearts the level ends in failure. The debrief still shows what was
  learned and the consequences, then offers Retry (needs ≥ 1 heart).
- Refill: +1 heart every 30 minutes of wall-clock time, computed from a stored
  timestamp on load (no background timers). Reviewing any Role Card in the Codex
  gives +1 heart, once per card per calendar day. Completing a review node
  refills fully. World 1 is forgiving: the first mistake in each World 1 level is
  free (Dose explains why, no heart lost).
- Relaxed mode does **not** change hearts; it only removes time pressure.

### 4.4 Meters (Patient Safety, Data Integrity, Timeline/Budget)

- Each 0–100, shown as three slim bars with icon and label (never colour alone).
- Start of game: 100 / 100 / 100. At the start of each world all meters are
  raised to at least 60 ("new phase, fresh budget").
- Engines that affect meters: branching-scenario (per choice, ±5 to ±20),
  allocator (result bands), dash-manager (each expired item: −5 on the meter the
  level names), bucket-sort in safety levels (each wrong bucket: Safety −5).
  Every other mistake event costs Data Integrity −3 by default so meters stay
  live in all levels.
- A meter reaching 0 triggers a setback overlay: Safety → **Clinical Hold**,
  Integrity → **Inspection Finding**, Timeline/Budget → **Portfolio Review**.
  The level must be retried; the offending meter is reset to 40. Setback text
  explains what would happen in real life.
- Meters also feed the end-of-world XP bonus (§4.2) and the finale stats.

### 4.5 Streak

- One day of activity = completing at least one level, boss, or review node.
- Streak freezes: earn 1 per world completed, hold max 2, applied automatically
  on the first missed day. Days computed in local time from `YYYY-MM-DD`.
- Dose nudges on the map ("2 days in a row! Keep going.") — no notifications.

### 4.6 Spaced repetition (review nodes)

- Every quiz question, sort item, pair, and impostor card carries a `conceptId`
  (usually a glossary term id). A mistake puts the concept in Leitner box 1.
- Boxes: 1 → due next session, 2 → +1 day, 3 → +3 days, 4 → +7 days, 5 → retired.
  Correct answer promotes; wrong demotes to box 1.
- A review node draws up to 8 due concepts (oldest first), rendered as a short
  quiz-blitz with the original question or a generated "which definition
  matches" item. If nothing is due it shows a friendly "All caught up" and grants
  the heart refill anyway.

### 4.7 Boss quiz (Kahoot style)

- 8 questions (World 1–2) to 10 questions (World 3–8), mixing every role in the
  world. 4 options, each with a colour **and** a shape (red ▲, blue ◆, yellow ●,
  green ■). 15 s per question (relaxed: no timer, speed fixed at 0.5).
- Points per correct answer: `100 + round(50 × timeLeft / 15)`.
  Streak multiplier: ×1.25 after 3 correct in a row, ×1.5 after 5.
- Pass: ≥ 60 % correct. Stars from points ÷ max (same 85/65/45 thresholds).
- Wrong answer costs 1 heart and shows a 3-second explanation.

## 5. Difficulty curve

| World | Timer scale | Items per task | Distractors         | Hearts rule        |
| ----- | ----------- | -------------- | ------------------- | ------------------ |
| 1     | ×1.4        | 4–6            | obvious             | first mistake free |
| 2     | ×1.2        | 5–7            | plausible           | normal             |
| 3–4   | ×1.0        | 6–8            | plausible           | normal             |
| 5–6   | ×0.9        | 8–10           | subtle, two-step    | normal             |
| 7–8   | ×0.85       | 8–12           | subtle, cross-world | normal             |

Engines are introduced one at a time in the first 12 levels so each has a tutorial
moment (Dose speech bubble, "tap here" pointer, dismissable). Dash-manager and
spot-the-impostor get harder by adding concurrency (more queues) and more
red-herring evidence rather than shorter timers.

## 6. Mini-game engines

All engines share: `TaskShell` (HUD, pause, timer, relaxed mode), `useTaskRun`
(state machine: intro → playing → paused → complete/failed), `scoring.ts`,
`hearts.ts`, `meters.ts`. Each engine is a React component taking its typed
config and calling `onComplete({ accuracy, speed, mistakes[] })`.

| Engine             | Input model (touch + keyboard)                                                     | Mistake event                             | accuracy / speed                                                           |
| ------------------ | ---------------------------------------------------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------- |
| quiz-blitz         | Tap one of 4 big buttons; keys 1–4                                                 | wrong answer                              | correct ÷ N; avg time left                                                 |
| sequence-sort      | Tap item then tap slot (or drag); arrow keys + Enter                               | submit with ≥1 wrong position             | correct positions ÷ N on final submit; time left                           |
| match-pairs        | Tap left, tap right; Tab/Enter                                                     | wrong pair                                | correct ÷ (correct + wrong); time left                                     |
| bucket-sort        | Swipe (2 buckets) or drag/tap bucket button (2–4); keys 1–4                        | wrong bucket                              | correct ÷ N; avg time left per card (optional per-card deadline)           |
| dash-manager       | Tap a queued item, then tap stations in order; Tab cycles items, keys 1–5 stations | item's patience expires, or wrong station | served ÷ total; avg patience remaining                                     |
| spot-the-impostor  | Tap card to inspect (flip), tap Accuse; Enter/Space                                | wrong accusation                          | correct accusations ÷ total accusations; time left                         |
| builder            | Tap part in tray, tap slot; Enter                                                  | submit with ≥1 wrong/empty slot           | correct slots ÷ slots on final submit; time left                           |
| branching-scenario | Tap a choice (2–3 per node)                                                        | choosing a `bad` option                   | sum of choice quality ÷ max (best=1, ok=0.5, bad=0); speed = 0.5 (untimed) |
| allocator          | Steppers (−/+, 44 px) or slider per category; arrow keys                           | submit outside constraints                | categories within target ÷ categories; time left                           |

Drag-and-drop is an enhancement layered over tap-to-select / tap-to-place; the
tap path is the one tested.

## 7. Screens and flow

```
Title ─▶ (first run) Intro story + tutorial prompt ─▶ World Map
World Map ─▶ Badge Swap ─▶ Role Card ─▶ Task ─▶ Debrief ─▶ World Map
World Map ─▶ Boss Quiz ─▶ Story Beat ─▶ World Map (next world)
World Map ─▶ Review Node ─▶ Debrief ─▶ World Map
World Map ─▶ Clinical Hold overlay (W4 only) ─▶ SRC level
Last level ─▶ Finale (relay chain, stats) ─▶ Certificate
Bottom nav (Map · Codex · Handoff · Glossary · Settings) available everywhere
except inside a running task.
```

Screens: Title, Intro, WorldMap, BadgeSwap (overlay), RoleCard, Level (hosts an
engine), Debrief, BossQuiz, StoryBeat, ReviewNode, Setback (overlay), Codex,
Glossary, HandoffMap, Settings, Finale, Certificate.

Settings: sound on/off (default off), relaxed mode, reduce motion (follows OS by
default, overridable), theme (system/light/dark), text size, reset progress
(two-step confirm), about/disclaimer, content version.

## 8. Mascot and tone

Dose is a capsule (half white, half teal) in a lab coat with a lanyard. Dose
appears on the map beside the current node, in tutorial bubbles, on the debrief,
and in setbacks. Dose is warm, brief, never sarcastic about mistakes. Copy rule:
one idea per sentence, no jargon without a glossary link.

## 9. Content model (types live in `src/content/types.ts`)

- `World { id, number, title, subtitle, storyIntro, storyOutro, nodeIds[] }`
- `Role { id, title, employer, worldId, card: RoleCard }`
- `RoleCard { whatIDo, responsibilities[3–5], skills[], receivesFrom: RoleId[],
handsOffTo: RoleId[], documents[], funFact }`
- `Level { id, worldId, roleId, title, intro, game: MiniGameConfig, debrief:
{ learned, handoffLine }, meterFocus?: MeterId }`
- `MiniGameConfig` = discriminated union on `engine`, one interface per engine,
  each item carrying `conceptId` and `explanation` + `consequence` text.
- `BossQuiz { id, worldId, questions[] }`, `ReviewNode { id, worldId, afterLevelId }`
- `GlossaryTerm { id, term, short, long?, aliases[] }`
- `PlayerProgress` (schemaVersion 1): xp, hearts + heartsUpdatedAt, streak
  {count, lastDay, freezes}, levels {stars, bestScore, attempts, completedAt},
  cardsViewed {roleId → firstViewedAt, lastHeartClaimDay}, meters, concepts
  {conceptId → box, dueAt}, badges[], settings.
- Build-time validation (Vitest suite `content.validate.test.ts`, also run by
  `npm run validate:content`): every role has a card with 3–5 responsibilities
  and a fun fact; every `receivesFrom`/`handsOffTo` id exists; every level has a
  role, a debrief with both fields, and at least one item; every conceptId maps
  to a glossary term; every glossary term used in copy (`[[term]]` markup) exists;
  world node lists cover every level exactly once; boss quizzes cover every role
  in their world at least once.

## 10. Technical notes

- Vite + React 19 + TypeScript strict + Tailwind v4 + Zustand + Framer Motion.
- Routing: hash-based (works on GitHub Pages without rewrites), tiny custom router.
- Code splitting: `src/worlds/w1..w8/index.ts` each lazily import that world's
  content + engine bundles; engines are separate chunks; Framer Motion loaded in
  the core (it is needed on the map). Budget: core ≤ 300 KB gzipped, checked in
  CI via `vite build` size report.
- Persistence: single `trialquest.progress.v1` key, JSON, wrapped in try/catch,
  `migrate(from, to)` chain, "reset progress" in Settings.
- PWA: manifest, precached shell, runtime-cached lazy chunks, offline fallback.
- Sound: Web Audio API synthesised tones (tap, correct, wrong, star, unlock).
- Certificate: rendered to `<canvas>` 1200×800, "Save image" via `toBlob`.
- Accessibility: focus-visible rings, `aria-live` for timer warnings and results,
  every colour paired with a shape/label, all timers pausable and relaxable,
  `prefers-reduced-motion` disables path/badge animations.
- Disclaimer footer on Title, Map, Settings, Certificate.
