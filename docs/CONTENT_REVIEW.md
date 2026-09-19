# Content review log

Claims flagged for subject-matter-expert (SME) review, sorted into three groups.
**Blocks release** marks the rows that must be settled before World 1 ships to a real
audience. Resolve a row by editing the content file and striking it here.

## Group A — a practitioner would call this wrong (take to an SME before Milestone 3)

| #   | Blocks release | File                                               | Claim                                                                                                   | Why                                                                                                                                                  |
| --- | -------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 13  | yes            | `w1/levels.ts` w1-l3 `context`                     | Rat NOAEL 30 mg/kg/day → HED ≈ 4.8 mg/kg (BSA, Km 6/37) → ÷10 → MRSD ≈ 0.5 mg/kg.                       | The arithmetic is standard, but a rat-only NOAEL is not: programmes use rodent plus non-rodent and the lower HED governs. Say so, or add a dog line. |
| 16  | yes            | w1-l3 `use-hed` preset                             | "Start at the human equivalent dose" is presented as a choosable shortcut.                              | A no-safety-factor first dose would not survive IND review; the realistic cost is months at IND, not injured volunteers. Consider re-framing.        |
| 17  | yes            | `w4/levels.ts` w4-l4 base intro                    | The FDA has placed a hold on one asymptomatic ALT 4× ULN.                                               | A hold on one lab value is not how holds happen; sponsors pause dosing and notify. Reframe as sponsor pause plus regulator review.                   |
| 25  | yes            | `w1/crisis.ts` round 1                             | Liver cell death at the middle dose in 4 of 10 rats; kidney tubule change sent to review.               | Confirm the four findings and their adverse / not adverse calls against STP adversity practice.                                                      |
| 14  | no             | w1-l3 simulation bands                             | Cohort outcomes per band (standard 6/6 fine; aggressive 4/2; reckless 2/3/1); exposure curve 3 %–260 %. | Illustrative numbers that a practitioner may read as data. The reveal is labelled "Dose's projection"; confirm that is enough.                       |
| 15  | no             | w1-l3 `standard` band                              | Widened to [0.3, 0.8) mg/kg so 1.5× the MRSD is still "standard".                                       | Confirm the edges; 2 of 6 volunteers unwell at HED/8 was judged harsh and moved to the aggressive band.                                              |
| 26  | no             | w1-l2 cards                                        | ">100× selectivity", "reproduced in 3 of 3 runs", assay interference (PAINS) as a false-positive class. | Confirm the discovery heuristics read correctly to a chemist.                                                                                        |
| 5   | no             | `w1/roles.ts` toxicologist fun fact; w1-l3 context | "Safety factor of at least 10."                                                                         | Matches the FDA 2005 default; MABEL applies to high-risk biologics. The intro now says so; confirm wording.                                          |

## Group B — acceptable simplification that needs a nod

| #   | File                                             | Claim                                                                                                   | Why                                                                                                                |
| --- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| 1   | `glossary.ts` attrition; knowledge w1            | "Roughly 9 in 10 candidates that enter human trials never get approved."                                | ≈10 % likelihood of approval from Phase I is widely cited; varies by area and source (BIO 2011–2020 gives ~7.9 %). |
| 2   | `glossary.ts` development-timeline; knowledge w1 | "10 to 15 years and over a billion dollars."                                                            | Cost estimates range $1–2.6 B by method; keep the range vague.                                                     |
| 3   | `w1/roles.ts` discovery fun fact                 | "5,000–10,000 compounds screened → ~250 to animal testing → ~1 approved."                               | Classic PhRMA figure, dated; fine as an illustration.                                                              |
| 7   | knowledge w1 (rare disease explanation)          | "Most rare diseases still have no approved treatment."                                                  | Widely stated (~95 %); source varies.                                                                              |
| 8   | w1 crisis round 1                                | Classifying findings as adverse / not adverse / pathology review.                                       | Adversity is study-specific (STP/ESTP); the game version is a teaching abstraction.                                |
| 9   | w1 crisis round 2                                | A slower-release coating as the response to a liver signal.                                             | One option among several (dose, schedule); copy says "for the lower peak exposure the toxicologist wants".         |
| 11  | w4-l4 variants                                   | Aggressive and reckless starts attribute the signal to the starting dose; cautious and standard do not. | Directional teaching device; does not claim determinism.                                                           |
| 12  | (planned) W2 `trial-power` simulation            | Power / cost / months as sample size changes.                                                           | Will use a simple two-arm formula with stated assumptions.                                                         |
| 18  | w4-l4 `n-data`                                   | "The rest of cohort 3 is due back for their next visit tomorrow."                                       | Replaced "second dose in an hour" (single-ascending-dose cohorts get one dose); confirm the visit framing.         |
| 19  | w4-l4 endings                                    | Hold durations 26 / 40 / 71 days.                                                                       | Illustrative; the 30-day FDA response clock is real, durations vary.                                               |
| 23  | w1-l3 intro                                      | "The EU also uses MABEL for higher-risk molecules."                                                     | The EMA 2017 first-in-human guideline applies MABEL more broadly than "EU only"; wording is a simplification.      |
| 24  | w4-l4 debrief                                    | "'Clinical hold' is the FDA's term; EU authorities can pause a trial in a similar way."                 | Confirm against CTR 536/2014 wording (suspension / revocation of authorisation).                                   |

## Group C — wording only

| #   | File                                   | Claim                                                                                                     | Why                                                                               |
| --- | -------------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| 4   | knowledge w1 (rare disease thresholds) | US < 200,000 people; EU < 1 in 2,000.                                                                     | Correct per the Orphan Drug Act and EU Reg. 141/2000; check "in the EU" phrasing. |
| 6   | knowledge w1 (eCTD modules)            | Module 3 Quality, 4 Nonclinical, 5 Clinical.                                                              | Correct; Module 1 regional admin, Module 2 summaries.                             |
| 10  | w1-l3 simulation narration             | Band narration is labelled "Dose's projection".                                                           | Confirms the reveal reads as a forecast, not data (see 14).                       |
| 20  | w4-l4 variants                         | Wording of "left little room" and "cites your starting dose".                                             | Tone check only (substance is row 11).                                            |
| 21  | w4-l4 reckless intro                   | "rising bilirubin, a sign the liver is struggling"                                                        | Hy's law territory, kept at a 9th-grade level without naming it. Confirm wording. |
| 22  | w4-l4 copy                             | "the specialist" for hepatologist; "bilirubin" kept and explained; "cause-and-effect call" for causality. | Confirm the substitutions.                                                        |

Release gate: Group A rows marked **yes** (13, 16, 17, 25) block release of World 1 to
learners. Everything else can ship with the current wording.

## Milestone 3 additions (Worlds 2–8), 2026-09-19

Same three groups. Rows marked **yes** block release of that world to learners.

### Group A — a practitioner would call this wrong

| #   | Blocks release | File                                | Claim                                                                                                   | Why                                                                                                                                                     |
| --- | -------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 27  | yes            | `w2/levels.ts` w2-l2 simulation     | Power curve: n=100 → 46 %, n=200 → 80 %, n=260 → 89 % for "20 more fatigue-free days".                  | Illustrative two-arm numbers with an unstated SD. Either state the assumptions in `context` or have a statistician set the curve.                       |
| 28  | yes            | `w4/levels.ts` w4-l1 `v-vitamin`    | A daily multivitamin is a "query the sponsor" case under "no daily medicines".                          | Many protocols allow supplements explicitly; confirm the grey area is realistic or swap for a borderline prescription medicine.                         |
| 29  | yes            | `w5/levels.ts` w5-l5 `liver` card   | Jaundice + ALT 10× ULN, "possibly related", is a SUSAR on a 7-day clock.                                | 7 days applies to fatal or life-threatening; hospitalised jaundice may be 15-day unless judged life-threatening. Explanation says 7; confirm or say 15. |
| 30  | yes            | `w7/levels.ts` w7-l5, w7 crisis     | Two serious dose-related, reversible liver cases in ~1,400 patients justify a boxed warning.            | Boxed warnings are a judgement on severity and manageability; an SME should confirm the game's "boxed is best" answer or make "standard" acceptable.    |
| 31  | no             | `w6/levels.ts` w6-l4 futility node  | Conditional power 55 % vs a 20 % futility boundary; "sample size re-estimation only if planned".        | Correct in principle; confirm the numbers read sensibly to a statistician.                                                                              |
| 32  | no             | `w8/levels.ts` w8-l2 simulation     | Coverage / patients-reached curves by monthly price; "$800–1,600 value-based" for 21 fatigue-free days. | Entirely illustrative; no real HTA threshold is implied. Confirm the reveal is labelled clearly enough as a projection.                                 |
| 33  | no             | `w8/levels.ts` w8-l6 `sig-pancreas` | 9 reports vs 1 expected with 2 positive rechallenges is a validated signal.                             | Reasonable teaching example; confirm the disproportionality framing.                                                                                    |

### Group B — acceptable simplification that needs a nod

| #   | File                              | Claim                                                                                                       | Why                                                                                                         |
| --- | --------------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| 34  | `w2/levels.ts` w2-l3              | "In the US the study may start after 30 days unless the FDA objects; in the EU you wait for authorisation." | CTR 536/2014 timelines are simplified to "a fixed assessment timetable".                                    |
| 35  | `w2/roles.ts` irb-member          | "At least one non-scientist and one member with no ties to the institution."                                | Matches 21 CFR 56.107; EU committee composition varies by member state.                                     |
| 36  | `w3/levels.ts` w3-l3, w3-l5       | QP release framed as EU-only; "IVRS" as the older name for IRT.                                             | Both fine as simplifications.                                                                               |
| 37  | `w3/levels.ts` w3-l6              | Shared site login as a "critical" Part 11 finding.                                                          | Severity is inspector judgement; the game treats it as critical for teaching.                               |
| 38  | `w4/levels.ts` w4-l3 simulation   | Peak exposure 50 % → 80 % on a doubling; 130 % on a 3.3× step; ceiling = 100.                               | Toy linear PK; labelled "Dose's projection".                                                                |
| 39  | `w5/levels.ts` w5-l1              | Referral bonuses to specialists framed as a conflict of interest / undue influence.                         | Finder's fees are widely prohibited by ethics committees and codes; regional rules differ.                  |
| 40  | `w5/levels.ts` w5-l4              | Coded terms shown as plain words ("Alanine aminotransferase increased") rather than exact dictionary text.  | Deliberate: no licensed dictionary text is reproduced.                                                      |
| 41  | `w6/levels.ts` w6-l3              | Critical / major / minor grading criteria.                                                                  | Follows common sponsor practice and EMA inspection classification; wording is the game's.                   |
| 42  | `w6/levels.ts` w6-l5, w6-l6       | Lock → codes → analysis order; SDTM → ADaM → TLF; Define-XML; double programming.                           | Standard practice, simplified.                                                                              |
| 43  | `w7/levels.ts` w7-l3, w7/roles.ts | "Day 60 filing review", "about ten months" FDA review, "210-day" EU clock.                                  | Day-74 letter / 60-day filing and standard 10-month review are FDA practice; EU clock stops are simplified. |
| 44  | `w7/levels.ts` w7-l2              | 900 MB file over the gateway limit; scans fail validation.                                                  | Limits and error categories vary by agency and year; kept generic.                                          |
| 45  | `w8/levels.ts` w8-l4, w8-l5       | MSL/rep boundaries: unsolicited off-label questions, one-business-day AE reporting, travel as inducement.   | Reflects common codes (e.g., industry codes, anti-kickback rules); country detail omitted.                  |
| 46  | `w8/levels.ts` w8-l7, w8 crisis   | "Dear prescriber" letter before the label text changes; post-approval study as the confirming step.         | Order of DHCP letter and label variation differs by region; kept as a teaching sequence.                    |

### Group C — wording only

| #   | File                       | Claim                                                          | Why                                                             |
| --- | -------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------- |
| 47  | `w5/index.ts`, w6 outro    | Maya is "Participant 0417"; she was on placebo the whole time. | Story device; confirm the tone of the unblinding reveal.        |
| 48  | `w6/levels.ts` w6-l4 cameo | "The point on the fatigue chart you looked at was Maya."       | Confirm a single-patient point on a DSMB chart reads plausibly. |
| 49  | `w8/index.ts` outro        | "Forty-four jobs. Ten years."                                  | Matches the game's timeline; not a claim about real averages.   |

Release gate for Worlds 2–8: rows 27–30 marked **yes**. Everything else can ship with the
current wording.
