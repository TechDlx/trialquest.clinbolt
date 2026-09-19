/** Tunable numbers for the game economy. See docs/GDD.md section 4. */
export const economy = {
  score: {
    accuracyWeight: 80,
    speedWeight: 20,
    relaxedSpeed: 0.5,
    starThresholds: { three: 85, two: 65, one: 45 },
  },
  xp: {
    perStar: 15,
    perfectRun: 10,
    firstCompletion: 10,
    roleCardFirstView: 5,
    bossMax: 100,
    bossFirstTryPass: 20,
    reviewComplete: 15,
    reviewPerfect: 5,
    worldMeterBonus: 15,
    worldMeterThreshold: 70,
    knowledgeFirstRibbon: 10,
    knowledgePerCorrectReplay: 2,
    knowledgeReplayMaxPerDay: 10,
    streakMilestones: { 3: 25, 7: 50, 14: 100, 30: 200 } as Record<number, number>,
  },
  ranks: [
    { title: 'Intern', xp: 0 },
    { title: 'Trainee', xp: 250 },
    { title: 'Associate', xp: 700 },
    { title: 'Specialist', xp: 1400 },
    { title: 'Manager', xp: 2200 },
    { title: 'Director', xp: 3000 },
    { title: 'VP Development', xp: 3800 },
    { title: 'Chief Development Officer', xp: 4400 },
  ],
  hearts: { max: 5, refillMinutes: 30, codexReviewRefill: 1 },
  meters: {
    max: 100,
    worldStartMinimum: 60,
    setbackResetTo: 40,
    defaultMistakeIntegrity: -3,
    /** Summed variant meterOpening hits may never take a meter to this value or below from the setback floor. */
    openingFloor: 10,
  },
  boss: {
    basePoints: 100,
    speedPoints: 50,
    passFraction: 0.6,
    streak: [
      { after: 5, multiplier: 1.5 },
      { after: 3, multiplier: 1.25 },
    ],
  },
  crisis: {
    slack: 0.15,
    clearThreshold: 0.6,
    passFraction: 0.6,
    heartsPerAttempt: 1,
    minRounds: 4,
    maxRounds: 7,
    roundSeconds: [15, 40] as const,
    poolMax: 120,
  },
  knowledge: { ribbonFraction: 0.8 },
  quiz: { defaultSecondsPerQuestion: 20, bossSecondsPerQuestion: 15 },
  streak: { maxFreezes: 2 },
  review: { maxItems: 6, roundSeconds: 20, boxDelaysDays: [0, 1, 3, 7] },
} as const;

export interface Rank {
  title: string;
  xp: number;
}

export function rankForXp(xp: number): { current: Rank; next?: Rank } {
  let current: Rank = economy.ranks[0];
  let next: Rank | undefined;
  for (let i = 0; i < economy.ranks.length; i++) {
    const rank = economy.ranks[i]!;
    if (xp >= rank.xp) {
      current = rank;
      next = economy.ranks[i + 1];
    }
  }
  return next ? { current, next } : { current };
}
