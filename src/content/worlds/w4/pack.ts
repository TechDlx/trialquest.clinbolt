import type { WorldPack } from '../../pack';
import { w4Roles } from './roles';
import { w4Levels } from './levels';
import { w4Crisis } from './crisis';
import { w4Review } from './beats';
import { w4Knowledge } from '../../knowledge/w4';

/** Everything World 4 adds to the content registry; loaded on demand (see content/index.ts). */
const pack: WorldPack = {
  roles: w4Roles,
  levels: w4Levels,
  crisis: w4Crisis,
  reviews: [w4Review],
  knowledge: w4Knowledge,
};
export default pack;
