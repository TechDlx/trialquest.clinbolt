import type { CrisisBoss, KnowledgeCheck, Level, ReviewNode, Role } from './types';

/** What one world contributes to the registry. Each world's `pack.ts` is a separate lazy chunk. */
export interface WorldPack {
  roles: Role[];
  levels: Level[];
  crisis: CrisisBoss;
  reviews: ReviewNode[];
  knowledge: KnowledgeCheck[];
}
