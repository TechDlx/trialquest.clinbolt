import type { WorldPack } from '../../pack';
import { w8Roles } from './roles';
import { w8Levels } from './levels';
import { w8Crisis } from './crisis';
import { w8Review } from './beats';
import { w8Knowledge } from '../../knowledge/w8';

/** Everything World 8 adds to the content registry; loaded on demand (see content/index.ts). */
const pack: WorldPack = {
  roles: w8Roles,
  levels: w8Levels,
  crisis: w8Crisis,
  reviews: [w8Review],
  knowledge: w8Knowledge,
};
export default pack;
