import type { WorldPack } from '../../pack';
import { w5Roles } from './roles';
import { w5Levels } from './levels';
import { w5Crisis } from './crisis';
import { w5Review } from './beats';
import { w5Knowledge } from '../../knowledge/w5';

/** Everything World 5 adds to the content registry; loaded on demand (see content/index.ts). */
const pack: WorldPack = {
  roles: w5Roles,
  levels: w5Levels,
  crisis: w5Crisis,
  reviews: [w5Review],
  knowledge: w5Knowledge,
};
export default pack;
