import type { WorldPack } from '../../pack';
import { w3Roles } from './roles';
import { w3Levels } from './levels';
import { w3Crisis } from './crisis';
import { w3Reviews } from './beats';
import { w3Knowledge } from '../../knowledge/w3';

/** Everything World 3 adds to the content registry; loaded on demand (see content/index.ts). */
const pack: WorldPack = {
  roles: w3Roles,
  levels: w3Levels,
  crisis: w3Crisis,
  reviews: w3Reviews,
  knowledge: w3Knowledge,
};
export default pack;
