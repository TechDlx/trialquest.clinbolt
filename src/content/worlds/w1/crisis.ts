import type { CrisisBoss } from '../../types';

/** World 1 crisis boss: an unexpected toxicity signal. Four rounds, 100 s of budget, 115 s pool. */
export const w1Crisis: CrisisBoss = {
  id: 'w1-crisis',
  worldId: 'w1',
  title: 'Day 212: the liver signal',
  situation: [
    'The second rat study is in, and it is not clean: liver cell death at the middle dose, which the first study never showed.',
    'The [[ind|IND]] filing is due in three weeks. The patient community is waiting for news. Every role in World 1 has one job to do, fast.',
  ],
  rounds: [
    {
      id: 'r-tox',
      roleId: 'preclinical-toxicologist',
      seconds: 25,
      brief: "You're the Toxicologist. Which of these four findings are adverse?",
      meterHit: { safety: -10 },
      game: {
        engine: 'bucket-sort',
        prompt: 'Sort the four new findings.',
        seconds: 25,
        buckets: [
          { id: 'adverse', label: 'Adverse' },
          { id: 'not-adverse', label: 'Not adverse' },
          { id: 'review', label: 'Pathology review' },
        ],
        cards: [
          {
            id: 'necrosis',
            text: 'Liver cell death at the middle dose, in 4 of 10 rats',
            bucketId: 'adverse',
            conceptId: 'toxicology',
            explanation: 'Cell death is injury, not adaptation. This is the signal.',
            consequence: 'Downplaying cell death is how a liver injury reaches human volunteers.',
          },
          {
            id: 'heart-rate',
            text: 'Heart rate up 5% at all doses, within normal variation',
            bucketId: 'not-adverse',
            conceptId: 'noael',
            explanation: 'Small, not dose-related, inside the normal range.',
            consequence: 'Chasing every wobble buries the real finding.',
          },
          {
            id: 'kidney',
            text: 'Mild kidney tubule changes at the top dose only',
            bucketId: 'review',
            conceptId: 'toxicology',
            explanation: 'Could be adaptive or early injury. The pathologist needs to look.',
            consequence: 'Unreviewed findings become inspection questions later.',
          },
          {
            id: 'food-3',
            text: 'Food intake down 3% in the top-dose group',
            bucketId: 'not-adverse',
            conceptId: 'noael',
            explanation: 'A 3% change with no weight loss is noise.',
            consequence: 'Over-calling minor changes delays the programme for nothing.',
          },
        ],
      },
      emits: [
        {
          key: 'local.signal',
          tags: ['contained', 'missed'],
          defaultTag: 'missed',
          outcomes: [{ tag: 'contained', when: { bucketOf: { itemId: 'necrosis', bucketId: 'adverse' } } }],
        },
      ],
    },
    {
      id: 'r-cmc',
      roleId: 'cmc-scientist',
      seconds: 30,
      brief: "You're the CMC Scientist. Slow the release and re-make the batch, or ship what you have?",
      meterHit: { timeline: -10 },
      game: {
        engine: 'builder',
        prompt: 'Rebuild the capsule for the lower peak exposure the toxicologist wants.',
        seconds: 30,
        slots: [
          { id: 'release', label: 'Release profile' },
          { id: 'batch', label: 'Trial batch' },
        ],
        parts: [
          {
            id: 'slow-coat',
            text: 'Slow-release coating: lower peak, same total dose',
            slotId: 'release',
            conceptId: 'formulation',
            explanation:
              'A slower release lowers the peak blood level that seems to drive the liver finding.',
            consequence: 'Keeping a high peak keeps the risk.',
          },
          {
            id: 'fast-coat',
            text: 'Immediate release: fastest onset',
            conceptId: 'formulation',
            explanation: 'Fast onset means a high peak. That is the wrong direction today.',
            consequence: 'A higher peak exposure repeats the animal finding in people.',
          },
          {
            id: 'new-batch',
            text: 'New batch under GMP with the new coating',
            slotId: 'batch',
            conceptId: 'gmp',
            explanation: 'A changed formulation is a new product. It needs its own batch and records.',
            consequence: 'Dosing people with an untested batch is a GMP breach.',
          },
          {
            id: 'ship-current',
            text: 'Ship the current batch; change the coating later',
            conceptId: 'gmp',
            shortcut: {
              meters: { timeline: 10, safety: -15 },
              why: 'It keeps the date. It also puts the old peak exposure into the first volunteers.',
            },
            explanation: 'The current batch has the release profile you are trying to get rid of.',
            consequence: 'Shipping the old batch defeats the point of the change.',
          },
        ],
      },
    },
    {
      id: 'r-disc',
      roleId: 'discovery-scientist',
      seconds: 25,
      brief: "You're the Discovery Scientist. If VX-101 stalls, which backup has the same liver liability?",
      meterHit: { safety: -10 },
      game: {
        engine: 'spot-the-impostor',
        prompt: 'Which backup compound shares the liver liability?',
        seconds: 25,
        targetLabel: 'the compound with the liver liability',
        cards: [
          {
            id: 'vx-140',
            title: 'VX-140',
            lines: ['Same core structure as VX-101', 'Broken down by the liver into the same by-product'],
            impostor: true,
            conceptId: 'mechanism-of-action',
            explanation: 'Same core, same liver by-product. Whatever hurt the rat liver is here too.',
            consequence: 'Backing up with a look-alike means the same failure twice.',
          },
          {
            id: 'vx-152',
            title: 'VX-152',
            lines: ['Different core structure', 'Cleared by the kidneys, not the liver'],
            conceptId: 'pharmacokinetics',
            explanation:
              'Different structure and a different clearance route: no reason to expect the same finding.',
            consequence: 'Dropping a clean backup leaves the programme with nothing.',
          },
          {
            id: 'vx-160',
            title: 'VX-160',
            lines: ['Different core structure', 'Weaker potency, clean selectivity'],
            conceptId: 'selectivity',
            explanation: 'Weaker but clean. Not the liability you are hunting.',
            consequence: 'Confusing "weak" with "toxic" throws away options.',
          },
          {
            id: 'vx-171',
            title: 'VX-171',
            lines: ['Related core structure', 'Not broken down by the liver at all'],
            conceptId: 'pharmacokinetics',
            explanation: 'Related, but it never forms the liver by-product.',
            consequence: 'Guessing by structure alone misses the actual mechanism.',
          },
        ],
      },
    },
    {
      id: 'r-adv',
      roleId: 'patient-advocate',
      seconds: 20,
      brief: "You're the Patient Advocate. The community has heard there is a delay. What do you tell them?",
      meterHit: { integrity: -10 },
      game: {
        engine: 'branching-scenario',
        start: 'n-delay',
        nodes: [
          {
            id: 'n-delay',
            speaker: 'Community forum',
            text: 'Is it true VX-101 failed? Is the trial off? People are asking whether to give up hope.',
            choices: [
              {
                id: 'c-plain',
                text: 'Tell it straight: an animal safety finding, a fix in progress, three months lost, no promises.',
                quality: 'best',
                next: 'end-trust',
                conceptId: 'attrition',
                explanation: 'Plain facts, including the delay, keep trust for the next piece of bad news.',
                consequence: 'Communities that learn of delays from rumours stop believing the sponsor.',
              },
              {
                id: 'c-spin',
                text: 'Say everything is on track; details later.',
                quality: 'bad',
                next: 'end-rumour',
                conceptId: 'attrition',
                explanation: 'It is not on track. They will find out.',
                consequence: 'A cover-up discovered later costs more trust than the delay ever would.',
              },
              {
                id: 'c-silence',
                text: 'Say nothing until the IND is filed.',
                quality: 'ok',
                next: 'end-rumour',
                conceptId: 'patient-advocate',
                explanation: 'Silence lets rumours fill the gap.',
                consequence: 'Patients who feel ignored leave registries and trials.',
              },
            ],
          },
          {
            id: 'end-trust',
            text: 'The forum thanks you for the honesty. Three people ask how to join the registry.',
            end: { summary: 'Bad news told well keeps a community.' },
          },
          {
            id: 'end-rumour',
            text: 'The rumour that VX-101 "failed" spreads for a week before anyone corrects it.',
            end: { summary: 'Silence is never neutral.' },
          },
        ],
      },
      variants: [
        {
          when: { 'local.signal': 'missed' },
          patch: {
            brief:
              "You're the Patient Advocate. Word is out that the liver finding was downplayed. What do you tell the community?",
            stage: {
              items: {
                nodes: {
                  replace: [
                    {
                      id: 'n-delay',
                      text: 'A leaked slide says the liver finding was "logged as not adverse". Is that true? Is the trial off? People are asking whether to give up hope.',
                    },
                  ],
                },
              },
            },
          },
        },
      ],
    },
  ],
  resolution: {
    success: {
      id: 'w1-crisis-success',
      title: 'Signal contained',
      paragraphs: [
        'The finding is on the record, the formulation is fixed, the backup is understood, and the community heard it from you first.',
        'Three months lost. Nobody hurt. That is what a good day looks like in drug development.',
      ],
      mayaStatus: 'Told the truth. Still hopeful.',
    },
    partial: {
      id: 'w1-crisis-partial',
      title: 'Signal half-handled',
      paragraphs: [
        'Some of it got done. Some of it did not, and the parts you missed will come back as questions from the regulator.',
        'Have another go. The clock is the point.',
      ],
      mayaStatus: 'Heard a rumour. Waiting.',
    },
    fail: {
      id: 'w1-crisis-fail',
      title: 'Signal missed',
      paragraphs: [
        'The finding was buried, the old batch shipped, and the community found out from a leak.',
        'This is how programmes end before they begin. Retry when you are ready.',
      ],
      mayaStatus: 'Lost trust in the programme.',
    },
  },
};
