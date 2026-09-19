/**
 * Artifact registry: the things one level hands to a later one.
 * Adding a chain is content-only: add a key here, emit it from one level, branch on it in another.
 * `fields` declare the data a level may attach and the fallback used in {{key.field}} copy when
 * the artifact was never emitted.
 */
export interface ArtifactSpecBody {
  title: string;
  description: string;
  tags: readonly string[];
  defaultTag: string;
  fields?: Record<string, { label: string; fallback: string | number }>;
  /** The emitting level is not written yet; consumers may reference it without failing validation. */
  planned?: boolean;
}

export const artifactRegistry = {
  // chain (a): protocol -> eCRF -> screening -> monitoring
  'protocol.criteria': {
    title: 'Eligibility criteria',
    description: "How tight the protocol's inclusion and exclusion criteria are.",
    tags: ['tight', 'balanced', 'loose'],
    defaultTag: 'balanced',
  },
  'ecrf.fields': {
    title: 'eCRF fields',
    description: 'Which data fields the case report form collects.',
    tags: ['minimal', 'complete', 'bloated'],
    defaultTag: 'complete',
  },
  'screening.eligibility': {
    title: 'Screening decisions',
    description: 'How strictly the investigator applied the criteria.',
    tags: ['strict', 'standard', 'lenient'],
    defaultTag: 'standard',
  },
  'monitoring.deviations': {
    title: 'Deviation log',
    description: 'How clean the site looked to the monitor.',
    tags: ['clean', 'typical', 'noisy'],
    defaultTag: 'typical',
  },
  // chain (b): AE -> coding -> safety report -> label
  'ae.report': {
    title: 'AE report',
    description: 'How complete the adverse event report from the site was.',
    tags: ['complete', 'incomplete'],
    defaultTag: 'complete',
  },
  'ae.coded': {
    title: 'Coded AE',
    description: 'Whether the event was coded to the right term.',
    tags: ['correct', 'miscoded'],
    defaultTag: 'correct',
  },
  'safety.report': {
    title: 'Safety report',
    description: 'Whether the expedited report met its deadline.',
    tags: ['on-time', 'late'],
    defaultTag: 'on-time',
  },
  'label.warnings': {
    title: 'Label warnings',
    description: 'How prominent the safety warning on the label is.',
    tags: ['boxed', 'standard', 'minimal'],
    defaultTag: 'standard',
  },
  // chain (c): starting dose -> escalation -> clinical hold
  'dose.starting': {
    title: 'Starting dose',
    description: 'The first dose given to a human volunteer, chosen by the Toxicologist.',
    tags: ['cautious', 'standard', 'aggressive', 'reckless'],
    defaultTag: 'standard',
    fields: {
      mgPerKg: { label: 'Starting dose (mg/kg)', fallback: 0.5 },
    },
  },
  'phase1.escalation': {
    title: 'Escalation plan',
    description: 'How fast the Phase I doses step up, chosen by the Clinical Pharmacologist.',
    tags: ['slow', 'standard', 'fast'],
    defaultTag: 'standard',
    planned: true,
  },
  'phase1.hold': {
    title: 'Hold resolution',
    description: 'How cleanly the Safety Review Committee resolved the clinical hold.',
    tags: ['mild', 'moderate', 'severe'],
    defaultTag: 'moderate',
    fields: {
      days: { label: 'Days on hold', fallback: 30 },
    },
  },
} as const satisfies Record<string, ArtifactSpecBody>;

export type ArtifactKey = keyof typeof artifactRegistry;

export const artifactKeys = Object.keys(artifactRegistry) as ArtifactKey[];

export function isArtifactKey(k: string): k is ArtifactKey {
  return Object.prototype.hasOwnProperty.call(artifactRegistry, k);
}

export interface StoredArtifact {
  key: ArtifactKey;
  tag: string;
  data?: Record<string, string | number | boolean>;
  emittedBy: string;
  emittedAt: string;
}

export type ArtifactStore = Partial<Record<ArtifactKey, StoredArtifact>>;
