import type { WorldPack } from '../../pack';
import { w1Roles } from './roles';
import { w1Levels } from './levels';
import { w1Crisis } from './crisis';
import { w1Review } from './beats';
import { w1Knowledge } from '../../knowledge/w1';

/** Everything World 1 adds to the content registry; loaded on demand (see content/index.ts). */
const pack: WorldPack = {
  roles: w1Roles,
  levels: w1Levels,
  crisis: w1Crisis,
  reviews: [w1Review],
  knowledge: w1Knowledge,
};
export default pack;
