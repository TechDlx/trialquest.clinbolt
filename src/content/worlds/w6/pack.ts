import type { WorldPack } from '../../pack';
import { w6Roles } from './roles';
import { w6Levels } from './levels';
import { w6Crisis } from './crisis';
import { w6Reviews } from './beats';
import { w6Knowledge } from '../../knowledge/w6';

/** Everything World 6 adds to the content registry; loaded on demand (see content/index.ts). */
const pack: WorldPack = {
  roles: w6Roles,
  levels: w6Levels,
  crisis: w6Crisis,
  reviews: w6Reviews,
  knowledge: w6Knowledge,
};
export default pack;
