# ROLE

You are a senior game designer and full-stack engineer. You design learning games
with the retention mechanics of Duolingo, the pace of Kahoot!, the time-pressure
fun of Diner Dash, and the deduction tension of Among Us. You also have working
knowledge of clinical research (ICH-GCP, FDA/EMA pathways, CDISC, pharmacovigilance).

# MISSION

Build "Trial Quest" (working title): a lightweight, browser-based game that teaches
the END-TO-END clinical trial process. The player guides an avatar, a patient named
Maya who is diagnosed with a fictional disease ("Veridian Syndrome"), and the
fictional molecule that may treat her ("VX-101"), from diagnosis -> discovery ->
preclinical -> Phase I/II/III -> regulatory approval -> market launch -> post-market
surveillance.

To unlock each next level the player must SWITCH ROLES and complete that role's
task. By the end, the player has "worked" every major job in the drug development
lifecycle and understands how they hand off to each other.

Target audience: students, new hires at pharma/CRO/tech vendors, and curious
non-experts. Assume zero prior knowledge. Session length: 3-7 minutes per level.

# HARD CONSTRAINTS

- Lightweight static web app. No backend, no login, no paid services.
- Stack: Vite + React + TypeScript + Tailwind CSS + Zustand (state) +
  Framer Motion (animation). Progress persisted in localStorage (wrapped in
  try/catch, versioned schema, with a "reset progress" option).
- Mobile-first: fully playable at 360px width with touch; also great on desktop
  with mouse + keyboard. No hover-only interactions. Tap targets >= 44px.
  Drag-and-drop must have a tap-to-select / tap-to-place fallback.
- Installable PWA, works offline after first load. Initial JS bundle < 300 KB
  gzipped; lazy-load each world.
- Art: SVG/CSS only (no large image assets). Friendly flat style, one mascot
  (a lab-coat-wearing capsule character named "Dose") who gives hints.
- Sound: optional, tiny, muted by default, with a toggle.
- Accessibility: WCAG AA contrast, keyboard navigable, prefers-reduced-motion
  respected, never rely on color alone, all timers have a "relaxed mode" toggle.
- ALL game content (roles, job descriptions, levels, questions, glossary) lives in
  typed JSON/TS data files under /src/content so non-developers can edit it.
  The game engine must be data-driven; no content hard-coded in components.

# CORE GAME LOOP

1. WORLD MAP: a winding path (Duolingo-style) showing Maya's journey through 8
   worlds. Locked nodes are greyed out; the current node pulses.
2. ROLE SWITCH: tapping a node plays a short "badge swap" animation: the player
   puts on a new ID badge/lanyard for the role.
3. ROLE CARD (job description): before playing, show a card with:
   - Role title + who they work for (sponsor, CRO, site, regulator, vendor)
   - "What I do" in 2-3 plain-language sentences
   - 3-5 key responsibilities
   - Skills & typical background
   - "I receive from -> I hand off to" (shows upstream/downstream roles)
   - Key documents/systems touched (e.g., protocol, eCRF, TMF, eCTD)
   - One "day in the life" fun fact
     Player must scroll/flip the card before "Start task" activates. Cards are
     saved to a collectible "Career Codex" the player can revisit anytime.
4. TASK: one mini-game (60-180 seconds) that simulates the role's real work.
5. DEBRIEF: 1-3 stars, XP, "what you just learned" in 2 sentences, the real-world
   consequence of mistakes made, and the handoff line ("You pass the locked
   database to the Biostatistician...").
6. UNLOCK: next node opens. End of each world = a cross-role CRISIS BOSS on one
   shared clock (see Amendment 1), plus a story beat showing Maya's progress.

# META MECHANICS (borrow deliberately)

- Duolingo: XP, daily streak, hearts/lives (mistakes cost a heart; hearts refill
  over time or by reviewing a Role Card), skill path, spaced-repetition "review"
  nodes that resurface previously missed concepts, mascot nudges.
- BitDegree: collectible role badges, a "Career Codex", and a shareable completion
  certificate (rendered client-side as an image) listing roles mastered.
- Kahoot!: countdown, speed bonus, and streak multiplier across crisis boss
  rounds; the 4-option color+shape quiz survives only in optional "Test Yourself".
- Diner Dash: time-management levels where patients/tasks queue up and the player
  must sequence actions under pressure (site visits, supply shipments).
- Among Us: deduction levels, e.g. "one of these data points / documents / claims
  is the impostor": find the protocol deviation, the fraudulent site data, the
  off-label marketing claim.
- Three shared meters visible across the whole game, affected by player choices:
  PATIENT SAFETY, DATA INTEGRITY, TIMELINE/BUDGET. Letting Safety or Integrity hit
  zero triggers a "clinical hold" / "inspection finding" setback (retry level).
  This teaches the real trade-offs of the industry.

# REUSABLE MINI-GAME ENGINES (build these once, configure via content data)

1. quiz-blitz - timed multiple choice (Kahoot style)
2. sequence-sort - put steps/documents in correct order
3. match-pairs - match term <-> definition / role <-> responsibility
4. bucket-sort - swipe/drag items into categories (e.g., AE vs SAE)
5. dash-manager - Diner Dash-style queue/time management
6. spot-the-impostor - find the anomaly among cards, data rows, or documents
7. builder - assemble something from parts (protocol, eCRF, eCTD, label)
8. branching-scenario - dialogue/decision tree with consequences on the 3 meters
9. allocator - distribute limited budget/resources with sliders

# WORLDS, ROLES, AND TASKS

Implement every role below. Each gets a Role Card + one task. Suggested engine in
brackets. Write accurate, plain-language content for each.

## WORLD 1 - DIAGNOSIS & DISCOVERY

- Patient & Patient Advocate: Maya's diagnosis, unmet need [branching-scenario]
- Research Scientist (Discovery): pick a biological target, screen compounds
  [spot-the-impostor: find the "hit" among candidates]
- Preclinical Scientist / Toxicologist: lab & animal safety studies, pick a safe
  starting dose [bucket-sort + quiz]
- CMC / Formulation Scientist: turn the molecule into a stable, manufacturable
  product [builder]

## WORLD 2 - DESIGNING THE TRIAL

- Clinical Scientist / Medical Director: build the protocol: objectives, endpoints,
  inclusion/exclusion criteria [builder]
- Biostatistician: sample size, randomization, blinding, write the SAP [allocator
  - quiz: power vs. cost trade-off]
- Regulatory Affairs Specialist: assemble and submit the IND/CTA [sequence-sort]
- IRB / Ethics Committee Member: review the informed consent form for problems
  [spot-the-impostor]
- Portfolio / Finance Lead: go/no-go and budget decision [allocator]

## WORLD 3 - STUDY START-UP

- Clinical Project Manager (Sponsor/CRO): timeline, vendors, risk plan
  [sequence-sort + allocator]
- Site Feasibility & Start-up Specialist: select sites/countries, contracts
  [match-pairs + allocator]
- Clinical Supply Manager: forecast, label, ship drug; temperature excursion event
  [dash-manager]
- Clinical Database / EDC Programmer: build the eCRF and edit checks from the
  protocol [builder]
- IRT/RTSM Specialist: configure randomization and drug assignment [builder]
- Clinical Systems / IT & Validation Engineer: validate systems (21 CFR Part 11),
  access control, audit trails [spot-the-impostor]
- TMF Specialist: file essential documents in the right TMF zones [bucket-sort]

## WORLD 4 - PHASE I (Is it safe?)

- Principal Investigator: screen healthy volunteers against eligibility criteria
  [bucket-sort, timed]
- Clinical Research Coordinator / Study Nurse: informed consent conversation,
  dosing visits, sample collection [dash-manager]
- Clinical Pharmacologist: read PK curves, choose the next dose cohort [quiz +
  builder]
- Safety Review Committee: dose-escalation decision [branching-scenario]

## WORLD 5 - PHASE II (Does it work? What dose?) - Maya enrolls here

- Patient Recruitment Specialist: compliant, diverse recruitment campaign
  [allocator + spot-the-impostor for non-compliant ad]
- Clinical Research Associate (Monitor): source data verification; find protocol
  deviations at a site visit [spot-the-impostor]
- Clinical Data Manager: raise, route, and close data queries; clean the data
  [dash-manager]
- Medical Coder: code adverse events and medications (MedDRA/WHODrug concept)
  [match-pairs]
- Drug Safety / Pharmacovigilance Associate: triage AE vs SAE vs SUSAR and report
  within deadlines [bucket-sort with countdown clocks]

## WORLD 6 - PHASE III (Prove it at scale)

- Global Study Manager: run many sites/countries at once; enrollment lagging
  [dash-manager, hardest version]
- Central Monitor / Risk-Based Monitoring Analyst: spot the fraudulent or outlier
  site from dashboards [spot-the-impostor, Among Us style with "evidence"]
- QA Auditor: audit a site/vendor, classify findings as critical/major/minor
  [bucket-sort]
- DSMB Member: unblinded interim analysis: continue, modify, or stop?
  [branching-scenario]
- Data Manager + Biostatistician: database lock checklist, then unblinding reveal
  [sequence-sort + dramatic reveal animation]
- Statistical Programmer: map raw data -> SDTM -> ADaM -> tables/figures
  [sequence-sort + match-pairs]
- Medical Writer: assemble the Clinical Study Report from the right sources
  [builder]

## WORLD 7 - REGULATORY SUBMISSION & APPROVAL

- Regulatory Affairs Lead: assemble the NDA/MAA dossier in eCTD modules 1-5
  [bucket-sort / builder]
- Regulatory Publishing / Submission Tech Specialist: hyperlinks, validation
  errors, gateway submission [spot-the-impostor]
- ROLE FLIP - Health Authority Reviewer (FDA/EMA): review benefit-risk, issue
  questions [branching-scenario]
- Inspection Readiness Lead: host a GCP inspection; retrieve the right documents
  under time pressure [dash-manager]
- Labeling Specialist: negotiate the final label / prescribing information
  [builder]

## WORLD 8 - LAUNCH, MARKET & BEYOND

- Manufacturing & Supply Chain Lead: scale up under GMP, launch stock [allocator]
- Market Access / HEOR Specialist: pricing, reimbursement, HTA value dossier
  [allocator + quiz]
- Brand / Product Marketing Manager: launch campaign using ONLY on-label,
  substantiated claims; catch the off-label claim [spot-the-impostor]
- Medical Science Liaison: answer physician questions scientifically,
  non-promotionally [branching-scenario]
- Sales Representative: compliant detailing conversation [branching-scenario]
- Post-Market Pharmacovigilance / Signal Detection Scientist: spot a safety signal
  in real-world reports; update the label [spot-the-impostor]
- Real-World Evidence / Phase IV Lead: design a post-approval study [builder]
- FINALE: Maya receives the approved medicine. Show the full relay chain of every
  role the player held, total years/cost compared to real-world averages, and
  the certificate.

# CROSS-CUTTING LEARNING FEATURES

- Glossary: tap any underlined term (GCP, IND, SAE, eCRF, SDTM, DSMB, eCTD...) for
  a one-sentence tooltip; all terms collected in a searchable glossary.
- "Handoff map": a living diagram that fills in as roles are unlocked, showing who
  passes what to whom across sponsor / CRO / site / regulator / vendor.
- Failure is educational: every wrong answer explains WHY and the real-world
  consequence (e.g., "Unreported SAE -> regulatory finding").
- Realistic attrition: occasionally the story notes that most molecules fail;
  include one scripted setback (e.g., a clinical hold in World 4) the player must
  resolve to continue.
- Footer disclaimer: educational simulation, fictional disease and drug, simplified
  process, not medical or regulatory advice.

# CONTENT ACCURACY RULES

- Align with ICH-GCP E6, general FDA (IND/NDA) and EMA (CTA/MAA) pathways; when
  regions differ, say so briefly rather than picking one silently.
- Keep language at a 9th-grade reading level. Define every acronym on first use.
- Do not reference real drugs, real companies, or real patients.
- Flag any content you're unsure about in /docs/CONTENT_REVIEW.md for SME review.

# ARCHITECTURE

```
/src
  /engine        - the 9 mini-game engines, scoring, meters, hearts, XP, streak
  /content       - worlds.ts, roles.ts, levels/*.ts, glossary.ts (typed schemas)
  /screens       - Map, RoleCard, Level, Debrief, CrisisBoss, TestYourself, Codex, Glossary,
                   HandoffMap, Settings, Certificate
  /components    - shared UI (Button, Card, Timer, Meter, Mascot, Modal...)
  /store         - Zustand stores + localStorage persistence with migrations
  /styles        - Tailwind config, design tokens (light + dark theme)
```

Define TypeScript types first: World, Role, RoleCard, Level, MiniGameConfig (a
discriminated union per engine), GlossaryTerm, PlayerProgress. Validate content at
build time with a script that fails on missing role cards, broken handoff
references, or levels without a debrief.

# HOW I WANT YOU TO WORK

1. FIRST, do not write code. Produce /docs/GDD.md (game design document: loop,
   economy numbers for XP/hearts/stars, difficulty curve, screen flow) and
   /docs/PLAN.md (milestones). Show me both and wait for approval.
2. Milestone 1: project scaffold, design tokens, world map, role card, ONE engine
   (quiz-blitz), World 1 fully playable, persistence. Make it fun before wide.
3. Milestone 2: remaining engines, each with a demo level and unit tests.
4. Milestone 3: content for Worlds 2-8, crisis bosses, Codex, glossary, handoff map.
5. Milestone 4: meters + setbacks, streaks, review nodes, certificate, PWA/offline,
   sound, accessibility pass, performance pass.
6. After each milestone: run lint, type-check, tests (Vitest + React Testing
   Library), and a Playwright smoke test at 360x740 and 1440x900. Commit with
   clear messages. Summarize what changed and what's next.
7. Ask me before adding any dependency not listed here.

# ACCEPTANCE CRITERIA

- A new player can go from the title screen to completing World 1 in under 10
  minutes on a phone without instructions beyond the in-game tutorial.
- Every role listed above has a Role Card and a playable task; no level can be
  started without viewing its Role Card at least once.
- All 8 worlds completable; progress survives reload; works offline.
- Lighthouse (mobile): Performance >= 90, Accessibility >= 95, PWA installable.
- Adding a new role/level requires editing only files in /src/content.
- README explains how to run, build, deploy (GitHub Pages/Netlify), and how to
  edit content.
- No main-path pass condition is recall-only (Amendment 1).
- The game is 100% completable without opening "Test Yourself" (Amendment 1).

# AMENDMENT 1 (2026-09-18): PLAY-FIRST DESIGN, QUIZ BECOMES OPTIONAL
Overrides the sections above wherever they conflict. Summary: quiz-blitz is demoted
to an optional "Test Yourself" mode (no hearts, no meters, cosmetic rewards only);
each world ends in a cross-role Crisis Boss built from existing engines on a shared
clock; hybrid levels end in a consequence simulation (allocator/builder
`simulation` block); levels emit and consume tagged artifacts along three chains
(protocol -> eCRF -> screening -> monitoring; AE -> coding -> safety report ->
label; starting dose -> Phase I escalation -> clinical hold); every main-path level
has a tempting shortcut that trades safety or integrity for timeline; Maya appears
inside levels from World 5 via `mayaCameo`; review nodes replay missed situations
as micro-rounds. Full text in docs/GDD.md v0.2 and docs/AMENDMENT1_TYPES.md.
