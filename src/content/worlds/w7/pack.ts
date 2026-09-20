import type { WorldPack } from '../../pack';
import { w7Roles } from './roles';
import { w7Levels } from './levels';
import { w7Crisis } from './crisis';
import { w7Review } from './beats';
import { w7Knowledge } from '../../knowledge/w7';

/** Everything World 7 adds to the content registry; loaded on demand (see content/index.ts). */
const pack: WorldPack = {
  roles: w7Roles,
  levels: w7Levels,
  crisis: w7Crisis,
  reviews: [w7Review],
  knowledge: w7Knowledge,
};
export default pack;
