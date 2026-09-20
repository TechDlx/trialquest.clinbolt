import type { StoryBeat } from './types';
import { figures } from './figures';

/**
 * The finale: Maya's last scene, the journey stat card and the certificate text.
 * Real-world comparison figures are ranges with sources in docs/CONTENT_REVIEW.md rows 50–52
 * (checked 2026-09-20): PhRMA for the timeline; Wouters 2020 (JAMA) and DiMasi 2016 (J Health Econ)
 * for the cost range; BIO/Informa/QLS 2021 and Citeline 2024 for likelihood of approval.
 */
export const finaleContent = {
  beat: {
    id: 'finale',
    title: 'One capsule, every morning',
    paragraphs: [
      'Maya takes VX-101 with breakfast. Her liver tests are normal. Her fatigue is not gone, but it is smaller than her life now, instead of the other way round.',
      'She never met the toxicologist who set the first dose, the coordinator who drew the blood on the clock, the coder who spelled her rash correctly, or the reviewer who read her letter. She did not have to. You were all of them.',
      'This is what it takes to get a medicine to one person: forty-four jobs, ten years, and no shortcuts that survive contact with an inspector.',
    ],
    mayaStatus: 'Treated. Monitored. Having a good spring.',
  } satisfies StoryBeat,

  journey: {
    /** Baseline for a clean run; the timeline meter shifts it. */
    baseYears: 10.5,
    baseCostBillions: 1.3,
    timelinePivot: 70,
    yearsPerTimelinePoint: 0.05,
    costPerTimelinePoint: 0.01,
    realWorld: {
      years: '10 to 15 years',
      cost: 'about $1 billion to $2.6 billion per approved medicine, depending on how it is counted',
      approval: `${figures.approval.short[0]!.toUpperCase()}${figures.approval.short.slice(1)} molecules that enter human trials (${figures.approval.detail}) are ever approved.`,
    },
  },

  certificate: {
    title: 'Certificate of Completion',
    subtitle: 'Trial Quest',
    line: 'completed the journey from an unmet need to an approved medicine, working as',
    disclaimer:
      'Educational simulation. Fictional disease and drug. Simplified process. Not medical or regulatory advice.',
  },
};
