# Trial Quest content guide

For people who write and edit game content and are not developers. You will edit
TypeScript files under `src/content/`, but you only ever write data: words, numbers,
lists and ids. No logic. If the validator is happy, the game will run.

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

## 2. Ground rules

- **Fictional only.** Veridian Syndrome and VX-101 are made up. Never name a real drug,
  company, patient or product. Compounds are `VX-###`.
- **9th-grade reading level.** Short sentences. Define an acronym the first time it
  appears in a level, then link it (below).
- **Region differences:** say "in the US… in the EU…" briefly rather than picking one.
- **Unsure?** Add a row to `docs/CONTENT_REVIEW.md` with the file, the claim and why.
- **Ids** are lowercase with hyphens (`liver-weight`), unique within their list, and
  never change once players have saved progress (they are stored on the player's phone).

## 3. Glossary links

Write `[[noael]]` to show the glossary term's name, or `[[noael|the NOAEL]]` to show
your own words. The term must exist in `glossary.ts` (the validator checks). Players
tap the link for the one-sentence definition. Use the first mention of a term in each
level; do not link every occurrence.

## 4. Anatomy of a level

Read `docs/AMENDMENT1_TYPES.md`, Appendix A.2 (`w1-l3`), alongside this. A level has:

```
id, worldId, roleId, title, intro     who and what
meterFocus                            which meter a mistake damages (safety | integrity | timeline)
stages: [ … ]                         one or more mini-games, played in order
emits / variants                      optional hand-offs (section 7)
debrief: { learned, handoffLine }     two sentences of learning + who gets the work next
```

### Stages

Most levels have one stage. A stage is one mini-game:

```ts
{ id: 'findings', title: 'Classify the findings', brief: 'One line shown before it starts', weight: 1, game: { … } }
```

`weight` says how much this stage counts toward the level's score (default 1). The
Toxicologist level uses weight 1 for sorting and weight 2 for the dose decision.

### Mini-game types (`game.engine`)

| Engine               | The player…                                                  | Good for                                  |
| -------------------- | ------------------------------------------------------------ | ----------------------------------------- |
| `bucket-sort`        | sorts cards into 2–4 buckets                                 | classify: AE vs SAE, adverse vs not       |
| `builder`            | drags parts into slots                                       | assemble a protocol, eCRF, label          |
| `branching-scenario` | makes 2–3 choices through a short story                      | judgement calls with consequences         |
| `spot-the-impostor`  | inspects cards and accuses the odd one out                   | find the deviation, the off-label claim   |
| `allocator`          | sets sliders under constraints                               | dose, sample size, budget, price          |
| `sequence-sort`      | puts steps in order                                          | submission steps, database lock checklist |
| `match-pairs`        | matches left to right                                        | term ↔ definition, AE ↔ MedDRA code       |
| `dash-manager`       | serves a queue of items at stations before patience runs out | visits, shipments, queries                |
| `quiz-blitz`         | answers 4-option questions                                   | **Test Yourself only.** Never in a level. |

Every card, part, choice, pair or queue item needs an `id`, and every scorable one needs
three text fields the game shows when the player gets it wrong:

- `explanation`: why the right answer is right (one or two sentences).
- `consequence`: what goes wrong in the real world if you get this wrong.
- `conceptId`: the glossary term this teaches (used to order Test Yourself questions).

## 5. Shortcuts (the tempting wrong turn)

Every level must offer at least one **shortcut**: an option that saves time or money
and hurts patient safety or data integrity. It is not a mistake (no heart is lost); the
meters are the cost, and the game brings the same temptation back later in a review.

```ts
shortcut: {
  meters: { timeline: 10, safety: -15 },     // positive timeline, negative safety or integrity
  why: 'Skipping review is how a real liver signal gets found in humans instead of rats.',
}
```

Where it goes depends on the engine: a bucket ("Log as noise"), a part ("Reuse last
batch's data"), a choice, an allocator preset ("Start at the HED"), a dash station
("Skip the ID check"), or the impostor "Sign off without inspecting" button.
`sequence-sort` and `match-pairs` have none; give those levels a `shortcutPrompt`
instead (a Dose offer before the stage: "Skip the second reviewer and file today?").

Write `why` as Dose would say it: short, warm, no lecture.

## 6. Consequence simulations (allocator and builder)

Some decisions are numbers: the starting dose, the sample size, the price. For those,
add a `simulation` block so the player commits a value and **watches what happens**.

```ts
simulation: {
  kind: 'dose-response',          // dose-response | trial-power | price-access | pk-next-dose
  host: 'allocator',
  preview: 'on-commit',           // 'live' = numbers move as the slider moves
  revealSeconds: 4,
  commitLabel: 'Dose the first cohort',
  targetBand: 'standard',
  input: { categoryId: 'dose', min: 0.1, max: 5, step: 0.1, unit: 'mg/kg' },
  bands: [ … ],
}
```

**Bands** split the slider into ranges. Each band has a `tag`, a `narration` (what the
player sees happen), optional `meters`, a `consequence` for the debrief, and a `visual`
(the numbers the animation draws: for `dose-response`, how many of the cohort were
fine / mildly ill / seriously ill, and the exposure as a percent of target).

Rules the validator enforces:

- Bands are in order, touch each other, and cover the whole slider: the first starts at
  `min`, each one ends where the next begins, the last ends at `max`.
- `targetBand` is one of the tags. Tags are unique.
- For `preview: 'live'`, add `curves`: lists of `[x, y]` points per metric; the game
  draws straight lines between them. Cover the whole slider range.

The **first commit counts**. After the reveal the player gets a free "What if?" sandbox
to try other values; nothing in the sandbox is scored.

## 7. Hand-offs between levels (artifacts)

A level can **emit** an artifact (a named result with a tag), and a later level can
**change** depending on it. The Toxicologist's starting dose changes how bad the World 4
clinical hold is. Full example: `docs/AMENDMENT1_TYPES.md`, Appendix A.

### Declaring an artifact

In `src/content/artifacts.ts`:

```ts
'dose.starting': {
  title: 'Starting dose',
  description: 'The first dose given to a human volunteer, chosen by the Toxicologist.',
  tags: ['cautious', 'standard', 'aggressive', 'reckless'],
  defaultTag: 'standard',          // used when the player never played the emitting level
},
```

### Emitting

```ts
emits: [{
  key: 'dose.starting',
  outcomes: [
    { tag: 'cautious', when: { stageId: 'dose', band: 'cautious' } },
    …
  ],
}],
```

`when` can test: `band` (simulation), `endNode` (scenario ending), `chosePart`,
`bucketOf`, `accused`, `tookShortcut`, or `accuracyAtLeast`. Several fields together
mean "all of these". First matching outcome wins; if none match, the `defaultTag` is used.
Artifacts are only written when the level is passed. Replaying overwrites.

### Consuming (variants)

```ts
variants: [{
  when: { 'dose.starting': 'reckless' },
  patch: {
    intro: 'A different opening paragraph…',
    meterOpening: { safety: -25 },
    stages: { scenario: { items: { nodes: { replace: [{ id: 'n-data', text: 'New text for this node' }] } } } },
  },
}],
```

Things to know:

- Write the level so the **base version works on its own**. Variants only patch it.
- A patch can change `intro`, the `debrief`, an opening meter hit, and items by id:
  `add`, `remove` or `replace`. `replace` merges the fields you give onto the item, so
  replacing a scenario node's `text` keeps its choices. To change one choice, replace
  the node with its whole `choices` list.
- If several variants match, they apply in the order written; later ones win.
- The validator builds every combination of tags the level could see and checks each.
  Keep it to about 24 combinations per level (for example, two artifacts with three or
  four tags each).
- Only chains (a), (b) and (c) from the amendment exist for now. Ask before adding a key.

## 8. Maya on screen (World 5 onward)

To put Maya inside a level, name one item:

```ts
mayaCameo: { stageId: 'queue', itemId: 'visit-0417', presentation: 'queue', label: 'Participant 0417', debriefLine: 'That was Maya\'s visit 6 blood draw.' }
```

She must stay anonymous during the task. The `debriefLine` is where the reveal happens.

## 9. Crisis bosses

One per world, in `crisis.ts`: a 2–3 paragraph `situation`, then 4–7 `rounds`. Each
round is a badge swap into one role of that world, a `brief` line, a small mini-game
(same shapes as levels, but 2–4 items), `seconds` (15–40) and a `meterHit` applied if
the round is not cleared. Write three `resolution` story beats: success, partial, fail.

## 10. Test Yourself

Optional quizzes in `knowledge/<world>.ts`, one list per role, 4 options each, one
correct, with `explanation`, `consequence`, `conceptId` and `roleId`. These never gate
progress, cost hearts or move meters. Move retired quiz questions here rather than
deleting them.

## 11. Check your work

```
npm run validate:content
```

It prints exactly what is missing or wrong: a role without a card, a level without a
debrief, a `[[link]]` to a term that does not exist, bands with a gap, an artifact tag
that is not in the registry, a level with no shortcut (warning). Fix until it is clean,
then run `npm test` and play the level on a phone-sized window (`npm run dev`).

## 12. Checklist before you hand a level over

- [ ] Player can tell what to do from `intro` + `brief` without help
- [ ] Every wrong answer has an `explanation` and a real-world `consequence`
- [ ] At least one shortcut, written in Dose's voice
- [ ] First mention of each term is a `[[glossary link]]`
- [ ] Nothing real: no real drugs, companies, patients
- [ ] Uncertain claims logged in `docs/CONTENT_REVIEW.md`
- [ ] `npm run validate:content` is clean
