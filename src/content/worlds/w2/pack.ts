import type { WorldPack } from '../../pack';
import { w2Roles } from './roles';
import { w2Levels } from './levels';
import { w2Crisis } from './crisis';
import { w2Review } from './beats';
import { w2Knowledge } from '../../knowledge/w2';

/** Everything World 2 adds to the content registry; loaded on demand (see content/index.ts). */
const pack: WorldPack = {
  roles: w2Roles,
  levels: w2Levels,
  crisis: w2Crisis,
  reviews: [w2Review],
  knowledge: w2Knowledge,
};
export default pack;
