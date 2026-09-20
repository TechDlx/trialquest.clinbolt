# Trial Quest

A lightweight browser game that teaches the end-to-end clinical trial process. You guide
Maya, a patient with the fictional Veridian Syndrome, and VX-101, the fictional molecule
that may treat her, by "clocking in" as each of 44 real drug-development roles.

**Educational simulation. Fictional disease and drug. Simplified process. Not medical or regulatory advice.**

## Run

```bash
npm install
npm run dev          # http://localhost:5173
```

Requires Node 20 or newer.

## Check

```bash
npm run typecheck    # tsc
npm run lint         # eslint (includes jsx-a11y)
npm test             # vitest: unit tests + content validation
npm run e2e          # playwright smoke test at 360x740 (touch) and 1440x900
npm run e2e:install  # one-time: download Chromium for Playwright
PACE=1 npm run e2e:pace   # reader-paced World 1 timing (set PACE=1 in the environment)
```

`npm run validate:content` runs only the content validator. It fails on missing role
cards, broken hand-off references, levels without a debrief, malformed quiz questions,
or glossary links that point nowhere.

## Build and deploy

```bash
npm run build        # outputs dist/ (PWA: manifest + service worker; installable, offline after first load)
npm run preview      # serve dist/ locally
```

The app uses hash routing and relative asset paths, so `dist/` works from any static host
or sub-folder with no rewrite rules.

- **GitHub Pages:** build, then publish `dist/` to the `gh-pages` branch (for example with
  `npx gh-pages -d dist`, or a Pages workflow that uploads `dist/`). No base-path config needed.
- **Netlify:** build command `npm run build`, publish directory `dist`. Optionally set
  `VITE_BASE=/` for absolute asset URLs.

## Edit content

All game content lives under `src/content/` and is typed by `src/content/types.ts`.
Nothing about roles, levels, quizzes or glossary terms is hard-coded in components.

| What                                        | Where                                                           |
| ------------------------------------------- | --------------------------------------------------------------- |
| Role list (all 44, ids and titles)          | `src/content/roleIndex.ts`                                      |
| Role Cards (full job descriptions)          | `src/content/worlds/<world>/roles.ts`                           |
| Levels (mini-game configs + debriefs)       | `src/content/worlds/<world>/levels.ts`                          |
| Crisis bosses                               | `src/content/worlds/<world>/crisis.ts`                          |
| Test Yourself questions                     | `src/content/knowledge/<world>.ts`                              |
| Artifacts (hand-offs between levels)        | `src/content/artifacts.ts`                                      |
| Finale text and journey figures             | `src/content/finale.ts`                                         |
| Story beats and map nodes                   | `src/content/worlds.ts`, `src/content/worlds/<world>/index.ts`  |
| Glossary                                    | `src/content/glossary.ts` and `src/content/glossary/<world>.ts` |
| Economy numbers (XP, hearts, stars, timers) | `src/content/economy.ts`                                        |

Copy fields accept glossary links: write `[[gcp]]` or `[[gcp|Good Clinical Practice]]`
to make a tappable term. Every link must resolve to a glossary id; the validator checks this.
The full authoring guide (shortcuts, simulations, artifacts, word budgets) is `docs/CONTENT_GUIDE.md`.

To add a role: add it to `roleIndex.ts`, write its card in the world's `roles.ts`, add a
level in `levels.ts`, give it a Test Yourself set in `knowledge/<world>.ts`, and register the
world's files in `src/content/index.ts`. Run `npm test`; the validator tells you what is missing.

Claims that need subject-matter review are logged in `docs/CONTENT_REVIEW.md`.

## Project layout

```
src/
  app/         router + App shell
  components/  shared UI (Button, Hud, Mascot, RichText, Modal...)
  content/     all game content + validator
  engine/      mini-game engines, scoring, hearts, progression, timer
  screens/     Title, WorldMap, RoleCard, Level, Debrief, BossQuiz, Codex...
  store/       Zustand stores with safe, versioned localStorage persistence
  styles/      Tailwind v4 tokens (light + dark)
docs/          GDD.md, PLAN.md, CONTENT_REVIEW.md
e2e/           Playwright smoke tests
```

Design and delivery notes: `docs/GDD.md`, `docs/PLAN.md`.
