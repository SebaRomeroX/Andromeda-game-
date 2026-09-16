import travesiaDeSima from './travesiaDeSima.js';
import modoLibre from './modoLibre.js';
import modoInfinito from './modoInfinito.js';
import { isDev } from '../../src/env.js';

const stories = [travesiaDeSima, modoInfinito];
if (isDev()) stories.splice(1, 0, modoLibre);

export default stories;
