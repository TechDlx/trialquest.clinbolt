/**
 * Content schema for Trial Quest.
 * Everything a non-developer edits lives under /src/content and conforms to these types.
 * Copy fields may contain glossary links written as [[term-id]] or [[term-id|Shown text]].
 */

export type WorldId = 'w1' | 'w2' | 'w3' | 'w4' | 'w5' | 'w6' | 'w7' | 'w8';

export type Employer = 'sponsor' | 'cro' | 'site' | 'regulator' | 'vendor' | 'patient';

export type MeterId = 'safety' | 'integrity' | 'timeline';

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

/** Small set of badge glyphs drawn as inline SVG (see components/BadgeGlyph). */
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
  /** One sentence, shown in the tooltip. */
  short: string;
  /** Optional longer explanation for the Glossary screen. */
  long?: string;
  aliases?: string[];
  /** World where the term is first introduced (for grouping). */
  worldId?: WorldId;
}

export interface RoleCard {
  /** 2-3 plain-language sentences. */
  whatIDo: string;
  /** 3-5 items. */
  responsibilities: string[];
  skills: string[];
  /** Typical background, one sentence. */
  background: string;
  receivesFrom: string[]; // role ids
  handsOffTo: string[]; // role ids
  documents: string[];
  funFact: string;
}

/** Lightweight identity for every role in the game; used for handoff references and the map. */
export interface RoleRef {
  id: string;
  title: string;
  /** Short label for badges and the map (<= 20 chars). */
  shortTitle: string;
  employer: Employer;
  worldId: WorldId;
  badgeIcon: BadgeIcon;
}

export interface Role extends RoleRef {
  card: RoleCard;
}

export interface Explained {
  /** Why the correct answer is correct. Shown after any answer. */
  explanation: string;
  /** What happens in the real world if you get this wrong. Shown in the debrief. */
  consequence: string;
  /** Glossary term or concept id used for spaced repetition. */
  conceptId: string;
}

export interface QuizOption {
  text: string;
  correct?: boolean;
}

export interface QuizQuestion extends Explained {
  id: string;
  prompt: string;
  /** Exactly 4 options, exactly 1 correct. */
  options: QuizOption[];
  /** Overrides the engine default. */
  seconds?: number;
  /** Boss quizzes: which role this question belongs to. */
  roleId?: string;
}

export interface QuizBlitzConfig {
  engine: 'quiz-blitz';
  questions: QuizQuestion[];
  /** Base seconds per question before the world timer scale is applied. */
  secondsPerQuestion: number;
  shuffleOptions?: boolean;
}

/** Discriminated union on `engine`; other engines are added in Milestone 2. */
export type MiniGameConfig = QuizBlitzConfig;

export interface Debrief {
  /** "What you just learned" in 2 sentences. */
  learned: string;
  /** e.g. "You pass the locked database to the Biostatistician." */
  handoffLine: string;
}

export interface Level {
  id: string;
  worldId: WorldId;
  roleId: string;
  title: string;
  /** 1-2 sentences shown before the task starts. */
  intro: string;
  game: MiniGameConfig;
  debrief: Debrief;
  /** Meter that mistakes in this level damage (default: integrity). */
  meterFocus?: MeterId;
}

export interface BossQuiz {
  id: string;
  worldId: WorldId;
  title: string;
  secondsPerQuestion: number;
  questions: QuizQuestion[];
}

export interface ReviewNode {
  id: string;
  worldId: WorldId;
  title: string;
}

export interface StoryBeat {
  id: string;
  title: string;
  /** Plain paragraphs; may include glossary links. */
  paragraphs: string[];
  /** One line describing Maya right now, shown under her portrait. */
  mayaStatus: string;
}

export type MapNode =
  | { kind: 'level'; id: string; roleId: string }
  | { kind: 'review'; id: string }
  | { kind: 'boss'; id: string }
  | { kind: 'finale'; id: string };

export interface World {
  id: WorldId;
  number: number;
  title: string;
  subtitle: string;
  /** 'ready' worlds must pass full content validation; 'planned' worlds only draw on the map. */
  status: 'ready' | 'planned';
  intro: StoryBeat;
  outro: StoryBeat;
  nodes: MapNode[];
  /** Multiplies every timer in this world (difficulty curve). */
  timerScale: number;
  /** First mistake in each level is free (tutorial worlds). */
  firstMistakeFree: boolean;
}
