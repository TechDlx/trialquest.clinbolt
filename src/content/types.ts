/**
 * Content schema for Trial Quest (Amendment 1, types revision 4).
 * Everything a non-developer edits lives under /src/content and conforms to these types.
 * Copy fields may contain glossary links [[term-id|Shown text]] and artifact
 * interpolation {{artifact.key.field}} (see richText.ts).
 */
import type { ArtifactKey } from './artifacts';

export type WorldId = 'w1' | 'w2' | 'w3' | 'w4' | 'w5' | 'w6' | 'w7' | 'w8';
export type Employer = 'sponsor' | 'cro' | 'site' | 'regulator' | 'vendor' | 'patient';
export type MeterId = 'safety' | 'integrity' | 'timeline';
export type MeterDelta = Partial<Record<MeterId, number>>;

export type EngineId =
  | 'quiz-blitz'
  | 'sequence-sort'
  | 'match-pairs'
  | 'bucket-sort'
  | 'dash-manager'
  | 'spot-the-impostor'
  | 'builder'
  | 'branching-scenario'
  | 'allocator';

export type BadgeIcon =
  | 'heart'
  | 'flask'
  | 'mouse'
  | 'pill'
  | 'document'
  | 'chart'
  | 'stamp'
  | 'scale'
  | 'coins'
  | 'calendar'
  | 'globe'
  | 'truck'
  | 'database'
  | 'dice'
  | 'shield'
  | 'folder'
  | 'stethoscope'
  | 'clipboard'
  | 'curve'
  | 'committee'
  | 'megaphone'
  | 'magnifier'
  | 'tag'
  | 'siren'
  | 'lock'
  | 'code'
  | 'pen'
  | 'link'
  | 'briefcase'
  | 'factory'
  | 'handshake'
  | 'radar'
  | 'telescope';

export interface GlossaryTerm {
  id: string;
  term: string;
  short: string;
  long?: string;
  aliases?: string[];
  worldId?: WorldId;
}

export interface RoleCard {
  whatIDo: string;
  responsibilities: string[];
  skills: string[];
  background: string;
  receivesFrom: string[];
  handsOffTo: string[];
  documents: string[];
  funFact: string;
}

export interface RoleRef {
  id: string;
  title: string;
  shortTitle: string;
  employer: Employer;
  worldId: WorldId;
  badgeIcon: BadgeIcon;
}

export interface Role extends RoleRef {
  card: RoleCard;
}

/** Text shown when the player gets an item wrong. */
export interface Explained {
  explanation: string;
  consequence: string;
  conceptId: string;
  /** Optional one-line inline confirmation when the player gets it right (<= 12 words). */
  confirm?: string;
}

/** A tempting shortcut: helps timeline/budget, hurts safety or integrity. Not a mistake. */
export interface Shortcut {
  meters: MeterDelta;
  why: string;
}

/** For engines with no in-engine shortcut carrier: a Dose offer on the stage card. */
export interface ShortcutPrompt {
  id: string;
  offer: string;
  accept: Shortcut;
}

// ---------------------------------------------------------------- quiz-blitz (Test Yourself only)

export interface QuizOption {
  text: string;
  correct?: boolean;
}

export interface QuizQuestion extends Explained {
  id: string;
  prompt: string;
  options: QuizOption[];
  seconds?: number;
  roleId?: string;
}

export interface QuizBlitzConfig {
  engine: 'quiz-blitz';
  questions: QuizQuestion[];
  secondsPerQuestion: number;
  shuffleOptions?: boolean;
}

// ---------------------------------------------------------------- bucket-sort

export interface Bucket {
  id: string;
  label: string;
  hint?: string;
  shortcut?: Shortcut;
}

export interface BucketCard extends Explained {
  id: string;
  text: string;
  bucketId: string;
}

export interface BucketSortConfig {
  engine: 'bucket-sort';
  prompt: string;
  seconds: number;
  buckets: Bucket[];
  cards: BucketCard[];
}

// ---------------------------------------------------------------- builder

export interface BuilderSlot {
  id: string;
  label: string;
  hint?: string;
}

export interface BuilderPart extends Explained {
  id: string;
  text: string;
  /** Correct slot; omit for a distractor. */
  slotId?: string;
  shortcut?: Shortcut;
}

export interface BuilderConfig {
  engine: 'builder';
  prompt: string;
  seconds: number;
  slots: BuilderSlot[];
  parts: BuilderPart[];
  simulation?: BuilderSimulation;
  sandbox?: boolean;
}

// ---------------------------------------------------------------- branching-scenario

export interface ScenarioChoice extends Explained {
  id: string;
  text: string;
  quality: 'best' | 'ok' | 'bad';
  next: string;
  meters?: MeterDelta;
  shortcut?: Shortcut;
}

export interface ScenarioNode {
  id: string;
  speaker?: string;
  text: string;
  choices?: ScenarioChoice[];
  end?: { summary: string };
}

export interface BranchingConfig {
  engine: 'branching-scenario';
  start: string;
  nodes: ScenarioNode[];
}

// ---------------------------------------------------------------- spot-the-impostor

export interface ImpostorCard extends Explained {
  id: string;
  title: string;
  lines: string[];
  impostor?: boolean;
}

export interface ImpostorConfig {
  engine: 'spot-the-impostor';
  prompt: string;
  seconds: number;
  /** Word for the thing being hunted, e.g. "the real hit" or "the deviation". */
  targetLabel: string;
  cards: ImpostorCard[];
  /** "Sign off without inspecting": ends the stage, uninspected cards count as skipped. */
  signOff?: { id: string; label: string; shortcut: Shortcut };
}

// ---------------------------------------------------------------- allocator

export interface AllocatorCategory extends Explained {
  id: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  initial: number;
  /** Inclusive range counted as correct. */
  target: [number, number];
}

export interface AllocatorPreset {
  id: string;
  label: string;
  values: Record<string, number>;
  shortcut?: Shortcut;
}

export interface AllocatorConfig {
  engine: 'allocator';
  prompt: string;
  seconds: number;
  context?: string[];
  categories: AllocatorCategory[];
  presets?: AllocatorPreset[];
  /** If set, category values must sum to this. */
  total?: number;
  simulation?: AllocatorSimulation;
  sandbox?: boolean;
}

// ---------------------------------------------------------------- sequence-sort

export interface SequenceItem extends Explained {
  id: string;
  text: string;
}

export interface SequenceSortConfig {
  engine: 'sequence-sort';
  prompt: string;
  seconds: number;
  /** In the correct order. */
  items: SequenceItem[];
}

// ---------------------------------------------------------------- match-pairs

export interface MatchPair extends Explained {
  id: string;
  left: string;
  right: string;
}

export interface MatchPairsConfig {
  engine: 'match-pairs';
  prompt: string;
  seconds: number;
  pairs: MatchPair[];
}

// ---------------------------------------------------------------- dash-manager

export interface DashStation {
  id: string;
  label: string;
  shortcut?: Shortcut;
}

export interface DashItem extends Explained {
  id: string;
  label: string;
  /** Station ids to visit, in order. */
  steps: string[];
  patienceSeconds: number;
  /** Seconds after the stage starts when the item appears. */
  arrivesAt: number;
}

export interface DashConfig {
  engine: 'dash-manager';
  prompt: string;
  seconds: number;
  stations: DashStation[];
  items: DashItem[];
}

// ---------------------------------------------------------------- simulation

export interface PreviewCurve {
  id: string;
  label: string;
  unit?: string;
  /** [x, y] points on the input scale; linear interpolation at runtime. */
  points: [number, number][];
  format?: 'integer' | 'percent' | 'money' | 'decimal1';
}

export interface NumericInput {
  categoryId: string;
  min: number;
  max: number;
  step: number;
  unit: string;
}

export interface BandBase<V> {
  tag: string;
  label: string;
  narration: string;
  meters?: MeterDelta;
  consequence?: string;
  visual: V;
}
/** Half-open [min, max); the last band is closed so it covers input.max. */
export interface RangeBand<V> extends BandBase<V> {
  range: [number, number];
}
export interface PartsBand<V> extends BandBase<V> {
  parts: string[];
}

export interface DoseResponseVisual {
  cohort: number;
  fine: number;
  mild: number;
  serious: number;
  /** Curve id whose interpolated value at the committed dose is shown as exposure. */
  exposureCurve?: string;
}
export interface TrialPowerVisual {
  power: number;
  costMillions: number;
  months: number;
  successfulRunsOf100: number;
}
export interface PriceAccessVisual {
  coveragePct: number;
  patientsReachedPct: number;
  revenueIndex: number;
}
export interface PkNextDoseVisual {
  exposure: number;
  safetyCeiling: number;
  points: { t: number; c: number }[];
}

interface SimulationBase {
  targetBand: string;
  preview: 'live' | 'on-commit';
  curves?: PreviewCurve[];
  revealSeconds: number;
  commitLabel: string;
}

export type SimulationBlock =
  | (SimulationBase & {
      kind: 'dose-response';
      host: 'allocator';
      input: NumericInput;
      bands: RangeBand<DoseResponseVisual>[];
    })
  | (SimulationBase & {
      kind: 'trial-power';
      host: 'allocator';
      input: NumericInput;
      bands: RangeBand<TrialPowerVisual>[];
    })
  | (SimulationBase & {
      kind: 'price-access';
      host: 'allocator';
      input: NumericInput;
      bands: RangeBand<PriceAccessVisual>[];
    })
  | (SimulationBase & {
      kind: 'pk-next-dose';
      host: 'builder';
      slotId: string;
      bands: PartsBand<PkNextDoseVisual>[];
    });

export type AllocatorSimulation = Extract<SimulationBlock, { host: 'allocator' }>;
export type BuilderSimulation = Extract<SimulationBlock, { host: 'builder' }>;

// ---------------------------------------------------------------- union

export type MiniGameConfig =
  | QuizBlitzConfig
  | BucketSortConfig
  | BuilderConfig
  | BranchingConfig
  | ImpostorConfig
  | AllocatorConfig
  | SequenceSortConfig
  | MatchPairsConfig
  | DashConfig;

export type MainPathConfig = Exclude<MiniGameConfig, QuizBlitzConfig>;

// ---------------------------------------------------------------- artifacts, rules, variants

/** All present fields are ANDed. */
export interface OutcomeRule {
  stageId?: string;
  accuracyAtLeast?: number;
  band?: string;
  endNode?: string;
  chosePart?: { slotId: string; partId: string };
  bucketOf?: { itemId: string; bucketId: string };
  accused?: string;
  tookShortcut?: string;
}

export type EmitDataSource = 'inputValue' | 'endNode' | 'accuracy' | 'band';

export interface EmitSpec {
  key: ArtifactKey;
  outcomes: { tag: string; when: OutcomeRule }[];
  data?: Record<string, EmitDataSource>;
}

export interface ItemPatch<T = Record<string, unknown>> {
  add?: T[];
  remove?: string[];
  replace?: (Partial<T> & { id: string })[];
}

export interface StagePatch {
  brief?: string;
  /** Keyed by the engine's collection name (see engine/registry.ts). */
  items?: Record<string, ItemPatch>;
  /** Scalar config fields only; `engine` and collections are never patchable. */
  fields?: Record<string, string | number | boolean>;
}

export interface LevelVariant {
  when: Partial<Record<ArtifactKey, string>>;
  patch: {
    intro?: string;
    stages?: Record<string, StagePatch>;
    debrief?: Partial<Debrief>;
    meterOpening?: MeterDelta;
  };
}

// ---------------------------------------------------------------- levels

export interface Stage {
  id: string;
  title?: string;
  brief?: string;
  game: MiniGameConfig;
  weight?: number;
}

export interface Debrief {
  learned: string;
  handoffLine: string;
}

export type MayaPresentation = 'queue' | 'data-row' | 'blinded-point' | 'dialogue' | 'consent';

export interface MayaCameo {
  stageId: string;
  itemId: string;
  presentation: MayaPresentation;
  label: string;
  debriefLine: string;
}

export interface Level {
  id: string;
  worldId: WorldId;
  roleId: string;
  title: string;
  intro: string;
  stages: [Stage, ...Stage[]];
  debrief: Debrief;
  meterFocus?: MeterId;
  emits?: EmitSpec[];
  variants?: LevelVariant[];
  shortcutPrompt?: ShortcutPrompt;
  mayaCameo?: MayaCameo;
  /** Authored ahead of its world; the validator lists it and skips its missing emitters until the world is released. */
  planned?: boolean;
}

// ---------------------------------------------------------------- crisis boss

export type CrisisLocalKey = `local.${string}`;

export interface CrisisEmitSpec {
  key: CrisisLocalKey;
  tags: string[];
  defaultTag: string;
  outcomes: { tag: string; when: OutcomeRule }[];
}

export interface CrisisVariant {
  when: Partial<Record<CrisisLocalKey, string>>;
  patch: { brief?: string; stage?: StagePatch; meterHit?: MeterDelta };
}

export interface CrisisRound {
  id: string;
  roleId: string;
  seconds: number;
  brief: string;
  game: MainPathConfig;
  onlyItems?: string[];
  meterHit: MeterDelta;
  emits?: CrisisEmitSpec[];
  variants?: CrisisVariant[];
}

export interface CrisisBoss {
  id: string;
  worldId: WorldId;
  title: string;
  situation: string[];
  rounds: CrisisRound[];
  slack?: number;
  clearThreshold?: number;
  passFraction?: number;
  resolution: { success: StoryBeat; partial: StoryBeat; fail: StoryBeat };
}

// ---------------------------------------------------------------- knowledge, review, story, map

export interface KnowledgeCheck {
  id: string;
  roleId: string;
  questions: QuizQuestion[];
  secondsPerQuestion?: number;
}

export interface ReviewNode {
  id: string;
  worldId: WorldId;
  title: string;
  maxRounds?: number;
  /** Minimum seconds for a timed round (default economy.review.roundSeconds). */
  roundSeconds?: number;
}

export interface StoryBeat {
  id: string;
  title: string;
  paragraphs: string[];
  mayaStatus: string;
}

export type MapNode =
  | { kind: 'level'; id: string; roleId: string }
  | { kind: 'review'; id: string }
  | { kind: 'crisis'; id: string }
  | { kind: 'finale'; id: string };

export interface World {
  id: WorldId;
  number: number;
  title: string;
  subtitle: string;
  status: 'ready' | 'planned';
  intro: StoryBeat;
  outro: StoryBeat;
  nodes: MapNode[];
  timerScale: number;
  firstMistakeFree: boolean;
}
