# Trial Quest — Delivery Plan

## Milestone 0 — Design docs
- `docs/GDD.md`, `docs/PLAN.md`. Approved 2026-09-18.

## Milestone 1 — "Make it fun before wide"
Scope:
- Vite + React + TS scaffold, Tailwind v4 tokens (light/dark, WCAG AA palette,
  employer colours, star/heart/meter colours), ESLint + Prettier, Vitest + RTL,
  Playwright config with 360×740 and 1440×900 projects.
- Content types (`src/content/types.ts`), `economy.ts`, World 1 content: 4 roles
  with full Role Cards, 4 levels, 1 review node, 1 boss quiz, ~25 glossary terms.
- Engine core: `TaskShell`, `useTaskRun`, `scoring.ts`, `hearts.ts`, timer with
  relaxed mode, `quiz-blitz` engine (also powers boss quiz and review nodes).
- Screens: Title, Intro, WorldMap (all 8 worlds drawn, only W1 unlocked), Badge
  Swap, Role Card (flip gating), Level, Debrief, BossQuiz, StoryBeat, Settings
  (reset progress), Codex (W1 cards).
- Zustand progress store + localStorage persistence with schema version + reset.
- Dose mascot (SVG) with tutorial bubbles on the first three screens.
- Content validation suite.

Note: World 1's intended engines (branching, impostor, bucket, builder) arrive in
Milestone 2. In M1 the four W1 levels ship as quiz-blitz "story quizzes" so the
world is fully playable end to end; M2 swaps in the intended engines without
touching the screens.

Exit: title → World 1 complete in < 10 min on a phone; lint, tsc, unit tests,
Playwright smoke green; progress survives reload; commit.

## Milestone 2 — Remaining engines
- sequence-sort, match-pairs, bucket-sort, dash-manager, spot-the-impostor,
  builder, branching-scenario, allocator. Each: component, config type, unit
  tests (state machine + scoring), one demo level in a hidden "Engine lab" route,
  keyboard + tap paths tested.
- Swap World 1 levels to their intended engines.

Exit: all 9 engines playable on 360 px with touch and keyboard; tests green; commit.

## Milestone 3 — Content
- Worlds 2–8: 40 roles' cards, 40 levels, 8 boss quizzes, review nodes, story
  beats, full glossary (~120 terms), `docs/CONTENT_REVIEW.md` for SME flags.
- Career Codex (all cards, badges), Glossary screen with search and inline
  tooltips, Handoff Map (fills in as roles unlock).
- Lazy-loading per world; bundle size check.

Exit: all 8 worlds completable; content validation green; commit.

## Milestone 4 — Meta and polish
- Meters + setbacks (clinical hold in W4, inspection finding, portfolio review),
  hearts refill, daily streak + freezes, spaced-repetition review nodes,
  finale + certificate (canvas), PWA + offline, sound toggle, accessibility pass
  (axe in Playwright, keyboard walkthrough), performance pass (Lighthouse mobile
  ≥ 90 perf, ≥ 95 a11y), README (run, build, deploy to GitHub Pages/Netlify,
  edit content).

Exit: acceptance criteria in SPEC.md all met; commit; summary.

After each milestone: `npm run lint && npm run typecheck && npm test &&
npm run e2e`, commit with a clear message, summarise what changed and what is next.
