import { hasCharacter } from '../data/characters.js';
import { randomEntries } from './eventGenerator.js';

// Valida cast, enlaces y configuracion de eventos de una historia.
// Solo imprime avisos por consola (nunca lanza); se llama al iniciarla.
// Cubre los dos pools de nodos (storyNodes y randomEvents) y, en
// historias antiguas, los arrays narrativeEvents/events.

// Sorteo/validacion del pool de eventos aleatorios.
function validateRandomSetup(story, warn) {
  const pool = story.randomEvents;
  if (!pool) return;

  const hasEntries = Object.keys(pool).length > 0;
  if (hasEntries && !((story.randomEventChance ?? 0) > 0)) {
    warn('Tiene randomEvents pero randomEventChance no esta definido (o es <= 0): nunca se disparara ningun evento aleatorio.');
  }

  const entries = randomEntries(story);
  if (hasEntries && entries.length === 0) {
    warn('randomEvents no tiene entradas (todos los nodos son objetivo de algun "next"): ninguno podra dispararse.');
  }

  const entryIds = new Set(entries.map(([id]) => id));
  entries.forEach(([id, node]) => {
    if (node.chance == null) {
      warn(`El evento aleatorio "${id}" no define "chance"; se usara el peso 1.`);
    } else if (!(node.chance > 0)) {
      warn(`El evento aleatorio "${id}" tiene chance <= 0: nunca saldra en el sorteo.`);
    }
  });

  Object.entries(pool).forEach(([id, node]) => {
    if (node.chance != null && !entryIds.has(id)) {
      warn(`"${id}" es sub-nodo de un evento aleatorio pero define "chance"; solo las entradas participan en el sorteo.`);
    }
  });

  if (story.storyNodes) {
    Object.keys(story.storyNodes).forEach(id => {
      if (pool[id]) warn(`El id "${id}" existe en storyNodes y randomEvents.`);
    });
  }
}

// Enlaces `next` (y `next` de opciones) que apuntan a nodos inexistentes.
function validateLinks(story, warn) {
  if (!story.storyNodes && !story.randomEvents) return;

  const known = new Set([
    ...Object.keys(story.storyNodes ?? {}),
    ...Object.keys(story.randomEvents ?? {})
  ]);
  const check = (fromId, target, field = 'next') => {
    if (target != null && !known.has(target)) {
      warn(`El nodo "${fromId}" apunta con "${field}" a "${target}", que no existe en storyNodes ni randomEvents.`);
    }
  };

  [story.storyNodes, story.randomEvents].forEach(nodes => {
    Object.entries(nodes ?? {}).forEach(([id, node]) => {
      check(id, node.next);
      (node.options ?? []).forEach(opt => check(id, opt.next));
      (node.branches ?? []).forEach(b => check(id, b, 'branches'));
    });
  });
}

// Forma `reward: { randomType: [...] }` (1 orbe de un tipo al azar de la
// lista; ver getEventOrbs en gameFlow). Lista no-array/vacia o tipos
// desconocidos hacen que la recompensa otorgue 0 orbes.
const ORB_TYPES = ['mind', 'power', 'body', 'wealth'];
function checkRandomType(event, where, warn) {
  const rt = event?.reward?.randomType;
  if (rt == null) return;
  if (!Array.isArray(rt) || rt.length === 0) {
    warn(`Evento ${where}: "reward.randomType" debe ser una lista no vacia de tipos de orbe.`);
    return;
  }
  rt.forEach((k) => {
    if (!ORB_TYPES.includes(k)) {
      warn(`Evento ${where}: "reward.randomType" contiene un tipo desconocido "${k}".`);
    }
  });
}

export function validateStoryCast(story) {
  const generic = new Set(story.genericEnemies ?? []);
  const narrative = new Set(story.narrativeEnemies ?? []);
  const allies = new Set(story.allies ?? []);

  const warn = (msg) => console.warn(`[historia "${story.title}"] ${msg}`);

  // Toda referencia a personaje es un NOMBRE (el nombre es la clave
  // estable). Aqui se avisa si el nombre no existe o si alguien dejo una
  // referencia numerica antigua (posicion en characters.js).
  const checkName = (value, label) => {
    if (value == null) return;
    if (typeof value === 'number') {
      warn(`${label}: referencia numerica (${value}); debe ser el nombre del personaje.`);
      return;
    }
    if (!hasCharacter(value)) {
      warn(`${label}: "${value}" no existe en characters.`);
    }
  };

  ['allies', 'genericEnemies', 'narrativeEnemies'].forEach(key => {
    (story[key] ?? []).forEach((n, i) => checkName(n, `${key}[${i}]`));
  });
  (story.teamA ?? []).forEach((n, i) => checkName(n, `teamA[${i}]`));
  checkName(story.protagonist, 'protagonist');

  // Lineas de dialogo de introDialog/outroDialog (mismo formato que un
  // evento `dialogo`: { speaker?, text }).
  const checkDialogLines = (lines, where, field) => {
    if (lines == null) return;
    if (!Array.isArray(lines) || lines.length === 0) {
      warn(`Evento ${where}: "${field}" debe ser una lista no vacia de lineas de dialogo.`);
      return;
    }
    lines.forEach((line, j) => {
      if (line?.text == null) {
        warn(`Evento ${where}: ${field}[${j + 1}] no tiene "text".`);
      }
      checkName(line?.speaker, `Evento ${where}: ${field}[${j + 1}]: speaker`);
    });
  };

  // Validacion de un PASO: el de una secuencia o el de una rama inline
  // (option.steps). Los campos de nivel nodo solo tienen sentido en el
  // evento contenedor (un paso = contenido, sin id/fired/puntero propio).
  // `opts` lo pasan las llamadas recursivas:
  //   - narrativo: el `narrativo` del contenedor (los pasos no lo llevan)
  //   - inheritedReward: el contenedor declara `reward` (vale para sus pasos)
  // Llama a checkEvent (definida abajo; se resuelve en tiempo de llamada).
  const checkStep = (step, at, opts) => {
    if (!step || typeof step !== 'object' || step.type == null) {
      warn(`Evento ${at}: el paso no tiene "type".`);
      return;
    }
    if (step.type === 'secuencia') {
      warn(`Evento ${at}: no se permiten secuencias anidadas.`);
      return;
    }
    ['id', 'next', 'final', 'conditions', 'branches', 'setFlags', 'narrativo'].forEach(k => {
      if (step[k] != null) {
        warn(`Evento ${at}: el paso define "${k}"; esos campos van en la secuencia.`);
      }
    });
    if (step.type === 'eleccion') {
      (step.options ?? []).forEach((o, j) => {
        if (o?.next != null) {
          warn(`Evento ${at}, opcion ${j + 1}: una eleccion dentro de una secuencia no puede ramificar con "next"; usa "steps" para la rama o saca la eleccion de la secuencia.`);
        }
      });
    }
    // La oferta encadena su combate por `branches` (puntero que sale
    // del evento): en una secuencia se romperia el aislamiento.
    if (step.type === 'reclutamiento_oferta') {
      warn(`Evento ${at}: una oferta de reclutamiento encadena por "branches" y no puede vivir dentro de una secuencia.`);
    }
    checkEvent(step, at, opts);
  };

  // Validacion estructural de un evento. `where` identifica el nodo:
  // id entre comillas (pools con clave) o numero (listas legadas).
  const checkEvent = (event, where, opts = {}) => {
    checkRandomType(event, where, warn);
    checkDialogLines(event.introDialog, where, 'introDialog');
    checkDialogLines(event.outroDialog, where, 'outroDialog');

    if (event.type === 'secuencia') {
      const steps = event.steps;
      if (!Array.isArray(steps) || steps.length === 0) {
        warn(`Evento ${where}: es una secuencia pero no tiene pasos en "steps".`);
        return;
      }
      const stepOpts = {
        narrativo: event.narrativo,
        inheritedReward: event.reward != null
      };
      steps.forEach((step, i) => checkStep(step, `${where}, paso ${i + 1}`, stepOpts));
      return;
    }

    if (event.type === 'reclutamiento') {
      checkName(event.character, `Evento ${where}: character`);
      if (event.character != null && !allies.has(event.character)) {
        warn(`Evento ${where}: ${event.character} es reclutable pero no esta en allies.`);
      }
      return;
    }

    if (event.type === 'reclutamiento_oferta') {
      if (!Array.isArray(event.branches) || event.branches.length === 0) {
        warn(`Evento ${where}: es una oferta de reclutamiento pero no declara "branches" con su nodo de combate.`);
      }
      ['wealth', 'combat', 'questions'].forEach(k => {
        const d = event.demands?.[k];
        if (d?.text == null || d?.accept == null || d?.refuse == null) {
          warn(`Evento ${where}: demands.${k} necesita "text", "accept" y "refuse".`);
        }
      });
      if (event.refuseText == null) {
        warn(`Evento ${where}: falta "refuseText" (despedida al rechazar la demanda o seguir de largo).`);
      }
      if (event.failText == null) {
        warn(`Evento ${where}: falta "failText" (resultado al fallar la prueba de confianza).`);
      }
      const trustQs = event.questions;
      if (!Array.isArray(trustQs) || trustQs.length < 3) {
        warn(`Evento ${where}: la prueba de confianza necesita "questions" con al menos 3 preguntas.`);
      }
      (Array.isArray(trustQs) ? trustQs : []).forEach((q, i) => {
        const at = `, pregunta ${i + 1}`;
        if (q?.question == null) {
          warn(`Evento ${where}${at}: la pregunta no tiene texto.`);
        }
        if (!Array.isArray(q?.options) || q.options.length === 0) {
          warn(`Evento ${where}${at}: la prueba no tiene opciones en "options".`);
        } else if (!q.options.some(o => o?.id != null && o.id === q.answer)) {
          warn(`Evento ${where}${at}: "answer" no coincide con el id de ninguna opcion.`);
        }
      });
      return;
    }

    if (event.type === 'eleccion') {
      if (!Array.isArray(event.options) || event.options.length === 0) {
        warn(`Evento ${where}: es una eleccion pero no tiene opciones en "options".`);
      } else if (event.options.some(o => o.id == null)) {
        warn(`Evento ${where}: todas las opciones deben tener un "id".`);
      } else {
        // option.steps: rama inline que el motor ejecuta tras elegir (en
        // una secuencia o como contenido del propio evento top-level).
        const branchOpts = {
          narrativo: opts.narrativo ?? event.narrativo,
          inheritedReward: opts.inheritedReward ?? event.reward != null
        };
        event.options.forEach((o, j) => {
          if (o?.steps == null) return;
          if (o.next != null) {
            warn(`Evento ${where}, opcion ${j + 1}: declara "next" y "steps"; usa solo "steps" (la rama vive dentro del evento).`);
          }
          if (!Array.isArray(o.steps) || o.steps.length === 0) {
            warn(`Evento ${where}, opcion ${j + 1}: "steps" debe ser una lista no vacia de pasos.`);
            return;
          }
          o.steps.forEach((s, k) => checkStep(s, `${where}, opcion ${j + 1}, paso ${k + 1}`, branchOpts));
        });
      }
      return;
    }

    if (event.type === 'dialogo') {
      if (!Array.isArray(event.dialog) || event.dialog.length === 0) {
        warn(`Evento ${where}: es un dialogo pero no tiene lineas en "dialog".`);
      }
      (event.dialog ?? []).forEach((line, j) => {
        checkName(line.speaker, `Evento ${where}, linea ${j + 1}: speaker`);
      });
      return;
    }

    if (event.type === 'acertijo') {
      // Dos formas: clasica (question/options/answer en el nodo) o pool
      // de preguntas `questions` (se elige una al azar al renderizar).
      const pooled = Array.isArray(event.questions) && event.questions.length > 0;
      if (event.questions != null && !pooled) {
        warn(`Evento ${where}: define "questions" pero la lista esta vacia.`);
      }
      if (!pooled && event.question == null) {
        warn(`Evento ${where}: es un acertijo pero no tiene "question".`);
      }
      const qs = pooled
        ? event.questions
        : [{ question: event.question, options: event.options, answer: event.answer }];
      let anyComplete = false;
      qs.forEach((q, i) => {
        const at = pooled ? `, pregunta ${i + 1}` : '';
        if (pooled && q?.question == null) {
          warn(`Evento ${where}${at}: la pregunta no tiene texto.`);
        }
        if (!Array.isArray(q?.options) || q.options.length === 0) {
          warn(`Evento ${where}${at}: es un acertijo pero no tiene opciones en "options".`);
        } else if (!q.options.some(o => o?.id != null && o.id === q.answer)) {
          warn(`Evento ${where}${at}: "answer" no coincide con el id de ninguna opcion.`);
        } else {
          anyComplete = true;
        }
      });
      if (anyComplete && event.reward == null && !opts.inheritedReward) {
        warn(`Evento ${where}: acertijo sin "reward"; al acertar se tirara la recompensa por defecto.`);
      }
      return;
    }

    if (event.reward != null && event.type !== 'enfrentamiento') {
      warn(`Evento ${where}: tiene "reward" pero no es un enfrentamiento; se ignorara.`);
    }

    if (event.type !== 'enfrentamiento' || !event.enemyTeam) return;

    // Los pasos de una secuencia heredan el `narrativo` de la secuencia.
    const narrativo = opts.narrativo ?? event.narrativo;
    const allowed = narrativo ? new Set([...generic, ...narrative]) : generic;
    event.enemyTeam.forEach((name, i) => {
      checkName(name, `Evento ${where}: enemyTeam[${i}]`);
      if (name != null && !allowed.has(name)) {
        warn(`Evento ${where}: ${name} no deberia aparecer en un enfrentamiento ${narrativo ? 'narrativo' : 'generico'}.`);
      }
    });
  };

  const pools = [];
  if (story.storyNodes) pools.push(['storyNodes', story.storyNodes]);
  if (story.randomEvents) pools.push(['randomEvents', story.randomEvents]);

  if (pools.length) {
    pools.forEach(([poolName, nodes]) => {
      Object.entries(nodes).forEach(([id, event]) => {
        const where = poolName === 'randomEvents' ? `"${id}" (aleatorio)` : `"${id}"`;
        checkEvent(event, where);
      });
    });
  } else {
    (story.narrativeEvents ?? story.events ?? []).forEach((event, i) => {
      checkEvent(event, String(i + 1));
    });
  }

  validateRandomSetup(story, warn);
  validateLinks(story, warn);
}
