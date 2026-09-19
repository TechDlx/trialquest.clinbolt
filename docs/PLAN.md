# Trial Quest — Delivery Plan

Version 0.2 · 2026-09-18 · revised for SPEC Amendment 1

## Milestone 0 — Design docs

Done. GDD v0.2 and this plan supersede v0.1 after approval.

## Milestone 1 — Scaffold + World 1 (quiz-blitz placeholder) — DONE 2026-09-18

Delivered: scaffold, tokens, world map, role cards, quiz-blitz engine, World 1 content,
persistence, 51 unit tests, Playwright smoke at 360×740 and 1440×900. Commit `2118fc5`.

### World 1 audit against Amendment 1

| Node    | Role                | Built as                                      | Pass condition today   | Amendment 1 status                                                                |
| ------- | ------------------- | --------------------------------------------- | ---------------------- | --------------------------------------------------------------------------------- |
| w1-l1   | Patient Advocate    | quiz-blitz, 6 questions, `meterFocus: safety` | score ≥ 45 from recall | **Rebuild** on branching-scenario                                                 |
| w1-l2   | Discovery Scientist | quiz-blitz, 6 questions                       | score ≥ 45 from recall | **Rebuild** on spot-the-impostor (find the hit)                                   |
| w1-l3   | Toxicologist        | quiz-blitz, 6 questions, `meterFocus: safety` | score ≥ 45 from recall | **Rebuild** on bucket-sort + allocator `dose-response` sim; emits `dose.starting` |
| w1-l4   | CMC Scientist       | quiz-blitz, 6 questions                       | score ≥ 45 from recall | **Rebuild** on builder                                                            |
| w1-r1   | Review              | quiz-blitz over missed `conceptId`s           | n/a (optional)         | **Rebuild** as micro-round playlist over missed situations                        |
| w1-boss | Boss quiz           | quiz-blitz, 8 questions, 15 s, ≥ 60 % to pass | recall, gates World 2  | **Replace** with World 1 Crisis Boss                                              |

Other findings:

- All 4 levels are 100 % recall-gated. 24 level questions + 8 boss questions = 32
  authored questions; all move into `KnowledgeCheck` content (none deleted).
- Quiz mistakes currently cost hearts and move meters (`src/screens/Level.tsx`,
  `src/screens/BossQuiz.tsx`). Both must be removed from the quiz path.
- Spaced repetition is keyed by `conceptId`; must be re-keyed by situation
  (`levelId:itemId`).
- `BossQuiz` type, `bossQuizzes` registry, `content.bossById`, `boss` map-node kind,
  `economy.boss`, `progress.bosses` all need renaming/retirement to crisis.
- No level has a shortcut option or an artifact. Store schema must bump to v2.

## Milestone 2 — Engines, crisis boss, artifacts, World 1 retrofit

Order matters: engines first, then the systems they plug into, then the retrofit.

1. **Types and validation** (from `docs/AMENDMENT1_TYPES.md`): `id` on every scorable
   item, `shortcut`, `SimulationBlock`, artifact types, `CrisisBoss`, `KnowledgeCheck`,
   `MayaCameo`. Retire `BossQuiz`. Extend the validator (artifact refs fail, missing
   shortcut warns, crisis round rules).
2. **Store v2**: `artifacts`, `knowledge`, situations-based `review`; migration v1→v2
   with tests; `crises` replaces `bosses`.
3. **Engines** (each: component, config type, `onlyItems`, shortcut handling, unit
   tests, demo level in a hidden `#/lab` route): branching-scenario,
   spot-the-impostor, bucket-sort, builder, allocator (+ `simulation` with
   `dose-response`, `trial-power`, `pk-next-dose`, `price-access` renderers),
   sequence-sort, match-pairs, dash-manager.
4. **Artifact runtime**: `emits` evaluation, `consumes`/`variants` patching with
   defaults, debrief "You handed off" card, Handoff Map edge labels.
5. **Crisis boss screen**: shared clock with carry-over, mini badge swaps, round
   playlist, points/streak, resolution text, meters/hearts; World 1 crisis content.
6. **Test Yourself**: `KnowledgeCheck` content for the 4 World 1 roles (the 32 existing
   questions), entry from Codex cards and completed map nodes, ribbon, bonus XP;
   quiz-blitz decoupled from hearts/meters.
7. **World 1 retrofit**: rebuild w1-l1..l4 on their intended engines (with ≥ 1
   shortcut each; l3 emits `dose.starting`), review node as micro-rounds, remove the
   boss quiz node, add the crisis node.
8. Update SPEC.md acceptance criteria (done with this plan), README, GDD.

Exit: World 1 completable with zero quiz questions on the main path; all 9 engines
playable at 360 px with touch and keyboard; validator passes; e2e smoke updated
(includes crisis boss and one Test Yourself run); commit.

## Milestone 3 — Content for Worlds 2–8

- 40 role cards, 40 levels on intended engines, each with ≥ 1 shortcut; the 4 hybrid
  simulation levels (Biostatistician, Clinical Pharmacologist, Market Access, plus
  Toxicologist from M2).
- Artifact chains a, b, c wired end to end; World 4 clinical hold variants from chain c.
- 7 crisis bosses (W2–W8), 9 review nodes, story beats, full glossary (~120 terms),
  `KnowledgeCheck` for all 44 roles, `mayaCameo` in W5–W8 levels.
- Codex, Glossary, Handoff Map lane diagram with artifact edges, lazy loading per
  world, bundle check, `docs/CONTENT_REVIEW.md` flags.

Exit: all 8 worlds completable without Test Yourself; validator green; commit.

## Milestone 4 — Meta and polish

Meters/setbacks, hearts refill, streak + freezes, spaced-repetition micro-rounds,
finale + certificate (with optional knowledge-check line), PWA/offline, sound,
accessibility pass (axe in Playwright, keyboard walkthrough), performance pass
(Lighthouse mobile ≥ 90 / ≥ 95), README deploy + content guide.

Exit: SPEC.md acceptance criteria (as amended) all met; commit; summary.

After each milestone: `npm run lint && npm run typecheck && npm test && npm run e2e`,
commit, summarise what changed and what is next.
