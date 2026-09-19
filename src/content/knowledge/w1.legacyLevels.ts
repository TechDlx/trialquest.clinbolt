import type { QuizQuestion } from '../types';
/** Legacy World 1 quiz levels, preserved verbatim as Test Yourself source material. */
type LegacyLevel = {
  id: string;
  roleId: string;
  game: { questions: QuizQuestion[] } & Record<string, unknown>;
} & Record<string, unknown>;

/**
 * World 1 levels. Milestone 1 ships these as quiz-blitz "story quizzes".
 * Milestone 2 swaps them to the engines named in SPEC.md
 * (branching-scenario, spot-the-impostor, bucket-sort, builder).
 */
export const w1LegacyLevels: LegacyLevel[] = [
  {
    id: 'w1-l1',
    worldId: 'w1',
    roleId: 'patient-advocate',
    title: "Maya's diagnosis",
    intro:
      'Maya has been tired and in pain for two years. Today a specialist finally names it: Veridian Syndrome. There is no approved treatment. Help Maya understand what happens next.',
    game: {
      engine: 'quiz-blitz',
      secondsPerQuestion: 20,
      shuffleOptions: true,
      questions: [
        {
          id: 'w1-l1-q1',
          conceptId: 'unmet-need',
          prompt:
            'The doctor says there is "no approved treatment" for Veridian Syndrome. That makes it an example of…',
          options: [
            { text: 'An unmet medical need', correct: true },
            { text: 'A cured disease' },
            { text: 'A placebo condition' },
            { text: 'A side effect' },
          ],
          explanation:
            'An unmet need is a health problem with no good treatment. It is the starting point for almost every new medicine.',
          consequence:
            'If nobody names the unmet need clearly, researchers may build a medicine that does not solve the problem patients actually have.',
        },
        {
          id: 'w1-l1-q2',
          conceptId: 'rare-disease',
          prompt: 'Veridian Syndrome affects about 1 in 50,000 people. That makes it…',
          options: [
            { text: 'A rare disease', correct: true },
            { text: 'A common infection' },
            { text: 'A seasonal outbreak' },
            { text: 'A lifestyle condition' },
          ],
          explanation:
            'In the US a rare disease affects fewer than 200,000 people; in the EU, fewer than 1 in 2,000. Special incentives ("orphan drug" programs) exist to encourage research into them.',
          consequence:
            'Rare diseases without loud advocates often get no research at all. Most rare diseases still have no approved treatment.',
        },
        {
          id: 'w1-l1-q3',
          conceptId: 'patient-advocate',
          prompt: 'A patient advocate is best described as…',
          options: [
            {
              text: 'Someone who speaks up for what patients need to researchers, companies and regulators',
              correct: true,
            },
            { text: 'A lawyer who sues hospitals' },
            { text: 'A doctor who prescribes medicines' },
            { text: 'A nurse who gives injections' },
          ],
          explanation:
            'Advocates bring the patient voice into research decisions: what to study, how to measure it, and how to make trials easier to join.',
          consequence:
            'Without advocates, trials get designed around what is easy to measure instead of what matters to people living with the disease.',
        },
        {
          id: 'w1-l1-q4',
          conceptId: 'clinical-trial',
          prompt: 'Maya hears the words "clinical trial". What is a clinical trial?',
          options: [
            {
              text: 'A research study in people that tests whether a treatment is safe and works',
              correct: true,
            },
            { text: 'A free treatment that is guaranteed to cure you' },
            { text: 'A test run only on animals' },
            { text: 'A survey about hospital food' },
          ],
          explanation:
            'Trials are experiments, not guaranteed treatments. Participants may receive the new drug, a standard treatment, or a placebo.',
          consequence:
            'Patients who think a trial is guaranteed treatment can feel misled. Honest expectations are the foundation of informed consent.',
        },
        {
          id: 'w1-l1-q5',
          conceptId: 'patient-reported-outcome',
          prompt: "Researchers ask Maya's patient group what improvement would matter most to them. Why?",
          options: [
            { text: 'So the trial measures outcomes patients actually care about', correct: true },
            { text: "To decide the drug's price" },
            { text: "To pick the trial's logo" },
            { text: 'Because it is required to be on TV' },
          ],
          explanation:
            'Patient-reported outcomes (PROs) capture how people feel and function in their own words. Regulators encourage sponsors to include them.',
          consequence:
            'A drug can improve a lab number while patients feel no better. Measuring the wrong thing wastes years and hope.',
        },
        {
          id: 'w1-l1-q6',
          conceptId: 'attrition',
          prompt: 'Roughly what fraction of drug candidates that enter human trials ever get approved?',
          options: [
            { text: 'About 1 in 10', correct: true },
            { text: 'About 9 in 10' },
            { text: 'Nearly all of them' },
            { text: 'About half' },
          ],
          explanation:
            'Most candidates fail for safety or lack of effect. That is why the process has so many checkpoints.',
          consequence:
            'Overpromising to patients about an experimental drug is a real harm. Advocates keep hope honest.',
        },
      ],
    },
    debrief: {
      learned:
        'Every medicine starts with an unmet need and a patient who can describe it. Advocates make sure research measures what matters to people, not just what is easy to measure.',
      handoffLine: "You hand Maya's story and her community's priorities to the Discovery Scientist.",
    },
    meterFocus: 'safety',
  },
  {
    id: 'w1-l2',
    worldId: 'w1',
    roleId: 'discovery-scientist',
    title: 'Find the hit',
    intro:
      "In a lab across the city, a team studies why Maya's cells misbehave. They find a protein, VRD-1, that seems to drive the disease. Now: find a molecule that can block it.",
    game: {
      engine: 'quiz-blitz',
      secondsPerQuestion: 20,
      shuffleOptions: true,
      questions: [
        {
          id: 'w1-l2-q1',
          conceptId: 'target',
          prompt: 'In drug discovery, the protein VRD-1 that drives the disease is called the…',
          options: [
            { text: 'Target', correct: true },
            { text: 'Placebo' },
            { text: 'Excipient' },
            { text: 'Sponsor' },
          ],
          explanation:
            'A target is the molecule in the body a drug is designed to act on. Picking the wrong target is the most expensive mistake in discovery.',
          consequence:
            'Chasing a target that does not really drive the disease means years of work on a drug that cannot help anyone.',
        },
        {
          id: 'w1-l2-q2',
          conceptId: 'hts',
          prompt:
            'The lab uses robots to test 200,000 compounds against VRD-1 in a few days. This is called…',
          options: [
            { text: 'High-throughput screening', correct: true },
            { text: 'A Phase III trial' },
            { text: 'Good Manufacturing Practice' },
            { text: 'Informed consent' },
          ],
          explanation:
            'High-throughput screening (HTS) tests huge compound libraries quickly to find the few that act on the target.',
          consequence: 'Without screening at scale, discovery relies on guesswork and takes far longer.',
        },
        {
          id: 'w1-l2-q3',
          conceptId: 'hit',
          prompt: 'Compound #4471 blocks VRD-1 strongly in the screen. Right now it is a…',
          options: [
            { text: 'Hit', correct: true },
            { text: 'Approved drug' },
            { text: 'Placebo' },
            { text: 'Biomarker' },
          ],
          explanation:
            'A hit is any compound that shows activity in a screen. Most hits fail once you look closer.',
          consequence:
            'Treating a raw hit as a drug skips the work that weeds out false positives and toxic molecules.',
        },
        {
          id: 'w1-l2-q4',
          conceptId: 'lead-compound',
          prompt:
            'The team improves #4471 so it blocks VRD-1 more strongly and ignores similar proteins. They name it VX-101. VX-101 is now the…',
          options: [
            { text: 'Lead compound', correct: true },
            { text: 'Excipient' },
            { text: 'Adverse event' },
            { text: 'Clinical hold' },
          ],
          explanation:
            'A lead is the improved, best-in-class molecule chosen to move forward. Chemists tune it for potency, selectivity and safety.',
          consequence:
            'A lead that hits many similar proteins ("off-target") is a common source of side effects later.',
        },
        {
          id: 'w1-l2-q5',
          conceptId: 'in-vitro',
          prompt: "Testing VX-101 on Maya's cells in a dish is an example of…",
          options: [
            { text: 'In vitro testing', correct: true },
            { text: 'In vivo testing' },
            { text: 'A clinical trial' },
            { text: 'Post-market surveillance' },
          ],
          explanation:
            '"In vitro" means in glass: cells or molecules in a dish. "In vivo" means in a living organism.',
          consequence:
            'Results in a dish often do not carry over to a whole body. Knowing which is which keeps claims honest.',
        },
        {
          id: 'w1-l2-q6',
          conceptId: 'mechanism-of-action',
          prompt: '"Mechanism of action" means…',
          options: [
            { text: 'How a drug produces its effect in the body', correct: true },
            { text: 'How much a drug costs' },
            { text: 'How a drug is packaged' },
            { text: 'Who sells the drug' },
          ],
          explanation:
            'Knowing the mechanism helps predict both benefits and side effects, and it goes into every later document about the drug.',
          consequence:
            'Drugs with unclear mechanisms are harder to dose, harder to explain to regulators, and harder to trust.',
        },
      ],
    },
    debrief: {
      learned:
        'Discovery goes target, then screen, then hit, then lead. Each step throws away most candidates so that only the strongest molecule moves forward.',
      handoffLine: 'You hand VX-101, and everything you know about it, to the Toxicologist.',
    },
  },
  {
    id: 'w1-l3',
    worldId: 'w1',
    roleId: 'preclinical-toxicologist',
    title: 'Is it safe enough to try?',
    intro:
      'VX-101 works in a dish. Before anyone can take it, you must learn what it does to a whole living body, and pick a first human dose that will not hurt a volunteer.',
    meterFocus: 'safety',
    game: {
      engine: 'quiz-blitz',
      secondsPerQuestion: 20,
      shuffleOptions: true,
      questions: [
        {
          id: 'w1-l3-q1',
          conceptId: 'preclinical',
          prompt: 'Studies done in the lab and in animals before human testing are called…',
          options: [
            { text: 'Preclinical studies', correct: true },
            { text: 'Phase III studies' },
            { text: 'Post-market studies' },
            { text: 'Market access studies' },
          ],
          explanation:
            'Preclinical (or nonclinical) work answers "is it safe enough to try in people?" before any human is dosed.',
          consequence: 'Skipping or rushing preclinical work is how dangerous drugs reach volunteers.',
        },
        {
          id: 'w1-l3-q2',
          conceptId: 'glp',
          prompt: 'The strict rules for how preclinical safety studies are run and recorded are called…',
          options: [
            { text: 'GLP: Good Laboratory Practice', correct: true },
            { text: 'GCP: Good Clinical Practice' },
            { text: 'GMP: Good Manufacturing Practice' },
            { text: 'GDP: Good Distribution Practice' },
          ],
          explanation:
            'GLP covers lab safety studies. GCP covers trials in people. GMP covers manufacturing. Regulators check all three.',
          consequence:
            'A safety study that was not run under GLP may be rejected by regulators, and must be repeated.',
        },
        {
          id: 'w1-l3-q3',
          conceptId: 'noael',
          prompt:
            'In the rat study, 30 mg/kg per day caused no harmful effects, but 100 mg/kg caused liver changes. The NOAEL is…',
          options: [
            { text: '30 mg/kg', correct: true },
            { text: '100 mg/kg' },
            { text: '0 mg/kg' },
            { text: '1,000 mg/kg' },
          ],
          explanation:
            'NOAEL is the highest dose with no observed adverse effect. It anchors the first human dose.',
          consequence:
            'Picking the wrong NOAEL can put the first human dose in the range that damaged animal livers.',
        },
        {
          id: 'w1-l3-q4',
          conceptId: 'starting-dose',
          prompt:
            'To choose the first human dose, you convert the animal NOAEL to a human equivalent dose, then…',
          options: [
            { text: 'Divide by a safety factor of at least 10', correct: true },
            { text: 'Multiply by 10 to make sure it works' },
            { text: 'Use it unchanged' },
            { text: 'Double it for adults' },
          ],
          explanation:
            'Humans may be more sensitive than the animals studied. The safety factor gives room for that uncertainty.',
          consequence:
            'Starting too high is how first-in-human trials cause serious harm. Starting low and stepping up is the rule.',
        },
        {
          id: 'w1-l3-q5',
          conceptId: 'three-rs',
          prompt: 'The "3Rs" of ethical animal research are…',
          options: [
            { text: 'Replace, Reduce, Refine', correct: true },
            { text: 'Repeat, Record, Report' },
            { text: 'Randomize, Recruit, Retain' },
            { text: 'Review, Reject, Resubmit' },
          ],
          explanation:
            'Use non-animal methods where possible, use as few animals as possible, and minimize any suffering.',
          consequence:
            'Ethics committees and regulators expect the 3Rs; ignoring them can block a study from being approved.',
        },
        {
          id: 'w1-l3-q6',
          conceptId: 'pharmacokinetics',
          prompt: 'Pharmacokinetics (PK) describes…',
          options: [
            { text: 'What the body does to the drug: absorb, distribute, break down, remove', correct: true },
            { text: 'What the drug costs' },
            { text: 'How the drug is advertised' },
            { text: 'Which regulator approves it' },
          ],
          explanation:
            'PK tells you how much drug is in the blood over time. Pharmacodynamics (PD) is the flip side: what the drug does to the body.',
          consequence:
            'Without PK data you cannot say how often to dose, or whether a drug even reaches the organ it needs to.',
        },
      ],
    },
    debrief: {
      learned:
        'Animal studies under GLP find the highest safe dose (the NOAEL) and the organs at risk. The first human dose is set well below that with a safety factor.',
      handoffLine:
        'You hand the safety data and the recommended starting dose to the CMC Scientist and the trial designers.',
    },
  },
  {
    id: 'w1-l4',
    worldId: 'w1',
    roleId: 'cmc-scientist',
    title: 'Make it a medicine',
    intro:
      'VX-101 is a white powder in a vial. Maya cannot swallow a powder. Turn it into a product that is stable, safe to make, and identical every time.',
    game: {
      engine: 'quiz-blitz',
      secondsPerQuestion: 20,
      shuffleOptions: true,
      questions: [
        {
          id: 'w1-l4-q1',
          conceptId: 'cmc',
          prompt: 'CMC stands for…',
          options: [
            { text: 'Chemistry, Manufacturing and Controls', correct: true },
            { text: 'Clinical Monitoring Committee' },
            { text: 'Cost, Marketing and Compliance' },
            { text: 'Central Medical Coding' },
          ],
          explanation:
            'CMC is everything about making the product and proving each batch meets its specification.',
          consequence:
            'Weak CMC is one of the most common reasons regulators delay approving a drug that otherwise works.',
        },
        {
          id: 'w1-l4-q2',
          conceptId: 'api',
          prompt: 'The part of a tablet that actually produces the effect is the…',
          options: [
            { text: 'API: active pharmaceutical ingredient', correct: true },
            { text: 'Excipient' },
            { text: 'Coating color' },
            { text: 'Barcode' },
          ],
          explanation:
            'The API (also called the drug substance) is the molecule itself. Everything else in the tablet is there to deliver it.',
          consequence:
            'Mixing up the API and the excipients on a label or batch record is a serious quality failure.',
        },
        {
          id: 'w1-l4-q3',
          conceptId: 'excipient',
          prompt: 'The fillers, binders and coatings that help deliver the active ingredient are called…',
          options: [
            { text: 'Excipients', correct: true },
            { text: 'Adverse events' },
            { text: 'Biomarkers' },
            { text: 'Endpoints' },
          ],
          explanation:
            'Excipients are "inactive" but critical: they control how fast a tablet dissolves and how long it lasts on a shelf.',
          consequence:
            'A poorly chosen excipient can make a drug absorb too fast, too slow, or fall apart in the bottle.',
        },
        {
          id: 'w1-l4-q4',
          conceptId: 'stability',
          prompt: 'A stability study tells you…',
          options: [
            {
              text: 'How long the product keeps its strength and purity under set storage conditions',
              correct: true,
            },
            { text: 'How many patients to enrol' },
            { text: 'Whether the drug works in people' },
            { text: 'What the drug should cost' },
          ],
          explanation:
            'Stability data sets the shelf life and the storage instructions ("store below 25 °C") on the label.',
          consequence:
            'Drug that degrades in storage can lose effect or form harmful by-products before it reaches a patient.',
        },
        {
          id: 'w1-l4-q5',
          conceptId: 'gmp',
          prompt: 'Clinical trial batches must be made under…',
          options: [
            { text: 'GMP: Good Manufacturing Practice', correct: true },
            { text: 'GLP: Good Laboratory Practice' },
            { text: 'GCP: Good Clinical Practice' },
            { text: 'No rules until the drug is approved' },
          ],
          explanation: 'GMP ensures every batch is made and tested the same way, with records to prove it.',
          consequence:
            'A batch made outside GMP cannot be given to trial participants. Regulators can shut a facility for GMP failures.',
        },
        {
          id: 'w1-l4-q6',
          conceptId: 'ectd',
          prompt: 'The CMC information goes into which part of the IND / CTA submission?',
          options: [
            { text: 'The Quality section (eCTD Module 3)', correct: true },
            { text: 'The marketing plan' },
            { text: 'The informed consent form' },
            { text: 'The site contract' },
          ],
          explanation:
            'The eCTD has five modules. Module 3 is Quality (CMC), Module 4 is nonclinical, Module 5 is clinical.',
          consequence:
            'Filing information in the wrong module causes validation errors and delays the review clock.',
        },
      ],
    },
    debrief: {
      learned:
        'CMC turns a molecule into a product: the right formulation, proven stability, and batches made under GMP. Every batch must be identical and documented.',
      handoffLine:
        'You hand stable VX-101 capsules and their batch records to the trial team. World 1 is almost complete.',
    },
  },
];
