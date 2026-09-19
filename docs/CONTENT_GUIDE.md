# Trial Quest content guide

For people who write and edit game content and are not developers. You edit TypeScript
files under `src/content/`, but you only ever write data: words, numbers, lists and ids.
No logic. If the validator is happy, the game will run.

## 1. Where things live

| What you want to change                       | File                                   |
| --------------------------------------------- | -------------------------------------- |
| A role's name, employer, badge icon           | `src/content/roleIndex.ts`             |
| A Role Card (job description)                 | `src/content/worlds/<world>/roles.ts`  |
| A level (the task the player plays)           | `src/content/worlds/<world>/levels.ts` |
| The end-of-world crisis                       | `src/content/worlds/<world>/crisis.ts` |
| Test Yourself questions                       | `src/content/knowledge/<world>.ts`     |
| Story beats and the order of nodes on the map | `src/content/worlds.ts`                |
| Glossary terms                                | `src/content/glossary.ts`              |
| Artifacts (things one level hands to another) | `src/content/artifacts.ts`             |
| Numbers: XP, hearts, timers, star thresholds  | `src/content/economy.ts`               |

Every file is a list of objects. Copy an existing one, change the words, keep the shape.
The complete worked examples are `w1-l3` in `worlds/w1/levels.ts` (two stages, both kinds
of shortcut, a simulation, an artifact) and `w4-l4` in `worlds/w4/levels.ts` (a scenario
that consumes that artifact through five variants).

## 2. Ground rules

- **Fictional only.** Veridian Syndrome and VX-101 are made up. Never name a real drug,
  company, patient or product. Compounds are `VX-###`.
- **9th-grade reading level.** Short sentences. Define an acronym the first time it appears
  in a level ("ALT (a liver enzyme)"), then link it.
- **Regions:** say "in the US… in the EU…" briefly rather than picking one silently.
- **Unsure?** Add a row to `docs/CONTENT_REVIEW.md` with the file, the claim and why.
- **Ids** are lowercase with hyphens (`liver-weight`), unique within a stage, and never
  change once players have saved progress (they are stored on the player's phone).

## 3. Links and live values in copy

- `[[noael]]` shows the glossary term's name; `[[noael|the NOAEL]]` shows your own words.
  The term must exist in `glossary.ts`. Link the first mention in each level.
- `{{dose.starting.mgPerKg}}` inserts a value a player produced earlier (see §7). If the
  player never produced it, the fallback from `artifacts.ts` is used. Never type a
  player-dependent number into copy by hand; use this instead.

## 4. Anatomy of a level

```
id, worldId, roleId, title, intro     who and what
meterFocus                            which meter a mistake damages (safety | integrity | timeline)
stages: [ … ]                         one or more mini-games, played in order
emits / variants                      optional hand-offs (§7)
shortcutPrompt                        only for engines with no built-in shortcut (§5)
debrief: { learned, handoffLine }     two sentences of learning + who gets the work next
```

### Stages

```ts
{ id: 'findings', title: 'Classify the findings', brief: 'One line shown before it starts', weight: 1, game: { … } }
```

Cards, parts and impostor cards are shuffled at runtime, so their order in the file does
not matter (scenario nodes and sequence-sort items keep their order). Size the timer with
the card count: `seconds = 15 + 12 × items` for bucket-sort and impostor, `20 + 15 × slots`
for builder, `20 + 10 × items` for sequence and match. The world's timer scale is applied
on top, so World 1 players get 40 % more.

Most levels have one stage. `weight` says how much the stage counts toward the score
(default 1). Each timed stage has its own `seconds` inside `game`; the world's timer scale
is applied automatically. Scenarios have no timer.

### Mini-game types (`game.engine`)

| Engine               | The player…                                                   | Items you write                           |
| -------------------- | ------------------------------------------------------------- | ----------------------------------------- |
| `bucket-sort`        | sorts cards into 2–4 buckets                                  | `buckets`, `cards` (each has `bucketId`)  |
| `builder`            | taps a part, then the slot it belongs in                      | `slots`, `parts` (`slotId` or none)       |
| `branching-scenario` | makes 2–3 choices through a short story                       | `nodes`, each with `choices` or `end`     |
| `spot-the-impostor`  | inspects cards and accuses the one that matches `targetLabel` | `cards` (one or more `impostor: true`)    |
| `allocator`          | sets sliders; optionally commits to a simulation              | `categories`, `presets`, `simulation`     |
| `sequence-sort`      | puts steps in order                                           | `items` in the correct order              |
| `match-pairs`        | matches left to right                                         | `pairs`                                   |
| `dash-manager`       | serves a queue at stations before patience runs out           | `stations`, `items` with `steps`          |
| `quiz-blitz`         | answers 4-option questions                                    | **Test Yourself only.** Never in a level. |

Every scorable item needs three text fields: `explanation` (why the right answer is right,
shown inline when the player gets it wrong), `consequence` (what goes wrong in the real
world, shown in the debrief), `conceptId` (the glossary term this teaches). An optional
`confirm` (up to 12 words) is the one-line confirmation shown when they get it right;
correct answers never block, they auto-advance. Card text, choice text and node text may
all carry `[[glossary links]]`.

## 5. Shortcuts (the tempting wrong turn)

Every level must offer at least one shortcut: an option that saves time or money and hurts
patient safety or data integrity. It is not a mistake (no heart); the meters are the cost,
and the game replays the same temptation in a later review.

```ts
shortcut: {
  meters: { timeline: 10, safety: -15 },   // positive timeline, negative safety or integrity
  why: 'Skipping review is how a real liver signal gets found in humans instead of rats.',
}
```

Where it goes:

| Engine                     | Put `shortcut` on…                                                                             | Rules                                                  |
| -------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| bucket-sort                | a **bucket** ("Log as noise")                                                                  | no card may have that bucket as its correct `bucketId` |
| builder                    | a **part** ("Reuse last batch's data")                                                         | a shortcut part has no `slotId`                        |
| branching-scenario         | a **choice**                                                                                   | `quality` must be `'bad'`                              |
| allocator                  | a **preset** ("Start at the HED")                                                              | see §6 for how it combines with a simulation           |
| dash-manager               | a **station** ("Skip the ID check")                                                            |                                                        |
| spot-the-impostor          | the `signOff` button ("Sign off without checking")                                             |                                                        |
| sequence-sort, match-pairs | nothing in the engine: give the level a `shortcutPrompt` (a Dose offer before the first stage) |                                                        |

A shortcut applies once per attempt even if the player uses it several times. Write `why`
as Dose would say it: short, warm, no lecture.

## 6. Consequence simulations (allocator)

For numeric decisions (starting dose, sample size, price) add a `simulation` so the player
commits a value and **watches what happens**.

```ts
simulation: {
  kind: 'dose-response',          // dose-response | trial-power | price-access (allocator); pk-next-dose (builder)
  host: 'allocator',
  preview: 'on-commit',           // 'live' = numbers move as the slider moves (needs curves)
  revealSeconds: 4,
  commitLabel: 'Project the first cohort',
  targetBand: 'standard',
  input: { categoryId: 'dose', min: 0.1, max: 5, step: 0.1, unit: 'mg/kg' },
  curves: [{ id: 'exposure', label: 'Projected exposure', unit: '% of target', points: [[0.1, 3], [0.5, 25], [5, 260]] }],
  bands: [ … ],
}
```

- **Bands** split the slider into ranges `[from, to)`; the last band includes `to`. They
  must start at `min`, touch each other, and end at `max`. Each has a `tag`, a `narration`,
  optional `meters`, a `consequence`, and a `visual` (for `dose-response`: `cohort`,
  `fine`, `mild`, `serious`, and `exposureCurve` naming a curve so the reveal shows the
  exposure at the committed value).
- **Curves** are `[x, y]` points; the game draws straight lines between them. Cover the
  whole slider.
- **The first commit is binding.** Score, band meters and the artifact come from it. After
  the reveal the player gets a free "What if?" sandbox; nothing there counts.
- **A shortcut preset with a simulation:** its positive meters apply the moment it is
  tapped (the lure). If the player commits without moving the slider, the negatives apply
  at the reveal as the worse of the preset's and the band's. If they drag the slider first,
  it is an ordinary band result.

## 7. Hand-offs between levels (artifacts)

A level can **emit** an artifact (a name plus a tag), and a later level can **change**
depending on it. The Toxicologist's starting dose changes the World 4 clinical hold.

### Declaring an artifact (`src/content/artifacts.ts`)

```ts
'dose.starting': {
  title: 'Starting dose',
  description: 'The first dose given to a human volunteer, chosen by the Toxicologist.',
  tags: ['cautious', 'standard', 'aggressive', 'reckless'],
  defaultTag: 'standard',           // used when the player never played the emitting level
  fields: { mgPerKg: { label: 'Starting dose (mg/kg)', fallback: 0.5 } },   // for {{dose.starting.mgPerKg}}
},
```

### Emitting

```ts
emits: [{
  key: 'dose.starting',
  outcomes: [{ tag: 'cautious', when: { stageId: 'dose', band: 'cautious' } }, …],
  data: { mgPerKg: 'inputValue' },
}],
```

`when` can test `band`, `endNode`, `chosePart`, `bucketOf`, `accused`, `tookShortcut`,
`accuracyAtLeast`. Several fields together mean "all of these". Name the `stageId` when
the level has more than one stage. First match wins; otherwise the `defaultTag`.
Artifacts are written only when the level is passed. Replaying overwrites.

### Consuming (variants)

```ts
variants: [{
  when: { 'dose.starting': 'reckless' },
  patch: {
    intro: 'The very first cohort was dosed at {{dose.starting.mgPerKg}} mg/kg…',
    meterOpening: { safety: -20 },
    stages: {
      scenario: {
        items: {
          nodes:   { replace: [{ id: 'n-data', text: 'New text; the node keeps its choices' }], add: [{ id: 'n-sentinel', text: '…', choices: [ … ] }] },
          choices: { replace: [{ id: 'c-amend-full', next: 'n-sentinel' }] },
        },
      },
    },
  },
}],
```

- The keys under `stages` are **stage ids** from this level (`scenario` above is the id
  of the hold level's only stage).
- Several keys in one `when` must **all** match (`{ 'dose.starting': 'cautious',
'phase1.escalation': 'slow' }` fires only for that combination).
- `meterOpening` uses the three meter names: `safety`, `integrity`, `timeline`.
- Write the level so the **base version works on its own**; variants only patch it.
- Patch items by id with `add`, `remove`, `replace`. `replace` merges the fields you give.
  For scenarios, `nodes.replace` may change `text`, `speaker` or `end` only; to change a
  choice (its `next`, its text) use `items.choices`. To add a choice, give it a `nodeId`.
- If several variants match, they apply in the order written; later ones win. Opening
  meter hits add up, and may never leave a meter at 10 or below.
- The validator builds every combination of tags the level could see (for example
  4 × 3 = 12) and checks each. Keep it to about 24.
- Only chains (a), (b) and (c) exist for now. Ask before adding a key.

## 8. Maya on screen (World 5 onward)

```ts
mayaCameo: { stageId: 'queue', itemId: 'visit-0417', presentation: 'queue', label: 'Participant 0417', debriefLine: 'That was Maya\'s visit 6 blood draw.' }
```

She stays anonymous during the task. The `debriefLine` is the reveal.

## 9. Crisis bosses

One per world in `crisis.ts`: 2–3 paragraphs of `situation`, then 4–7 `rounds`. Each round
is a badge swap into one role of the world, a one-line `brief`, a small mini-game (same
shapes as levels, 2–4 items), `seconds` (15–40) and a `meterHit` applied if the round is
not cleared. Rounds can hand a `local.signal`-style tag to a later round with `emits` and
`variants` (same shapes as levels, local keys only). Write three `resolution` beats:
success, partial, fail. World 1's pool must stay at or under 120 seconds.

## 10. Test Yourself

Optional quizzes in `knowledge/<world>.ts`, one list per role, 4 options each, one correct,
with `explanation`, `consequence`, `conceptId` and `roleId`. They never gate progress, cost
hearts or move meters. Move retired quiz questions here rather than deleting them.

## 11. Review rounds (what the game does with mistakes)

You do not write review rounds. Each situation a player gets wrong comes back later as a
20-second round of the same engine, padded automatically:

| Engine             | The round shows                                   |
| ------------------ | ------------------------------------------------- |
| bucket-sort        | the missed card + 2 others, all buckets           |
| builder            | the missed slot, its correct part + 2 distractors |
| branching-scenario | the one decision that contained the missed choice |
| spot-the-impostor  | the missed card, the real target, + 1 other       |
| allocator          | only the missed category editable; no simulation  |
| sequence-sort      | the missed item and its two neighbours            |
| match-pairs        | the missed pair + 2 others                        |
| dash-manager       | the missed item alone, patience × 1.5             |

A shortcut the player took comes back with the same temptation available.

## 12. Check your work

```
npm run validate:content
```

The validator also prints each level's **estimated play time** (200 words per minute, 2.5 s
per decision, one wrong turn, the card front in full and a third of the back) and warns
above 210 s. World 1 in one sitting must fit 12 minutes and each crisis pool 120 s.

**Word budgets** (warnings, not failures):

| Field                   | Budget                                    |
| ----------------------- | ----------------------------------------- |
| Level `intro`           | 40 words                                  |
| Card / part / item text | 18                                        |
| `explanation`           | 25                                        |
| `consequence`           | 20                                        |
| `confirm`               | 12                                        |
| Scenario node `text`    | 45                                        |
| Choice `text`           | 16                                        |
| Debrief `learned`       | 40                                        |
| Role card front         | 60 (title + "What I do" + hand-off chips) |

Trim by tightening sentences, not by dropping a fact an SME flagged.

Every message names the file, the id, what is wrong and a fix. Common ones:

| Message                                                    | What it means                                                                                                                                                   |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Glossary link [[x]] points to a term that does not exist` | Add the term to `glossary.ts` or fix the spelling.                                                                                                              |
| `{{key.field}}: artifact "key" has no field "field"`       | Declare the field with a fallback under `fields` in `artifacts.ts`.                                                                                             |
| `Item ids repeat within the stage`                         | Two items in one stage share an id; rename one.                                                                                                                 |
| `Band starts at X but the previous band ends at Y`         | Bands must touch: each `to` is the next band's `from`.                                                                                                          |
| `Last band ends at X, not at the input maximum Y`          | Extend the last band to the slider's max.                                                                                                                       |
| `targetBand "x" is not a band tag`                         | `targetBand` must equal one band's `tag`.                                                                                                                       |
| `cannot replace unknown id "x"`                            | A variant names an id that is not in the base level.                                                                                                            |
| `nodes.replace may change copy only`                       | You put `choices` in a node replace; use `items.choices` instead.                                                                                               |
| `meterOpening on safety sums to -35 …`                     | Opening hits are too big for the worst combination; reduce one.                                                                                                 |
| `Consumes "key" but no level emits it`                     | Write the emitting level, or mark the key (in `artifacts.ts`) or the level `planned: true`. Planned references are listed, and fail once the world is released. |
| `intro is 57 words; budget is 40` (warning)                | Tighten the sentence; keep the fact.                                                                                                                            |
| `Estimated 240 s at 200 wpm … budget is 210 s` (warning)   | Fewer items, shorter copy, or split the level.                                                                                                                  |
| `Level offers no tempting shortcut` (warning)              | Add a shortcut carrier or a `shortcutPrompt`.                                                                                                                   |
| `Every decision leads to the same next node` (warning)     | Make at least one choice go somewhere different.                                                                                                                |
| `Engine "quiz-blitz" is not allowed on the main path`      | Quizzes belong in `knowledge/`.                                                                                                                                 |

Then `npm test`, and play the level on a phone-sized window (`npm run dev`).

## 13. Checklist before you hand a level over

- [ ] Player can tell what to do from `intro` + `brief` without help
- [ ] Every wrong answer has an `explanation` and a real-world `consequence`
- [ ] At least one shortcut, written in Dose's voice
- [ ] First mention of each term is a `[[glossary link]]`; acronyms defined once
- [ ] No hard-coded player-dependent numbers; `{{key.field}}` instead
- [ ] Nothing real: no real drugs, companies, patients
- [ ] Uncertain claims logged in `docs/CONTENT_REVIEW.md`
- [ ] `npm run validate:content` is clean
