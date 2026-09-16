import travesiaDeSima from './travesiaDeSima.js';
import modoLibre from './modoLibre.js';
import modoInfinito from './modoInfinito.js';
import { isDev } from '../../src/env.js';
import nuevaHistoria from './nuevaHistoria.js';

const stories = [travesiaDeSima, modoInfinito, nuevaHistoria];
if (isDev()) stories.splice(1, 0, modoLibre);

export default stories;
