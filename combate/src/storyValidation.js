import characters from '../data/characters.js';
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

  // Validacion estructural de un evento. `where` identifica el nodo:
  // id entre comillas (pools con clave) o numero (listas legadas).
  const checkEvent = (event, where) => {
    checkRandomType(event, where, warn);
    if (event.type === 'reclutamiento') {
      if (event.character != null && !allies.has(event.character)) {
        warn(`Evento ${where}: ${characters[event.character]?.name ?? event.character} es reclutable pero no esta en allies.`);
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
      }
      return;
    }

    if (event.type === 'dialogo') {
      if (!Array.isArray(event.dialog) || event.dialog.length === 0) {
        warn(`Evento ${where}: es un dialogo pero no tiene lineas en "dialog".`);
      }
      (event.dialog ?? []).forEach((line, j) => {
        const sp = line.speaker;
        if (sp != null && (sp < 0 || sp >= characters.length)) {
          warn(`Evento ${where}, linea ${j + 1}: speaker ${sp} no es un indice valido de characters.`);
        }
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
      if (anyComplete && event.reward == null) {
        warn(`Evento ${where}: acertijo sin "reward"; al acertar se tirara la recompensa por defecto.`);
      }
      return;
    }

    if (event.reward != null && event.type !== 'enfrentamiento') {
      warn(`Evento ${where}: tiene "reward" pero no es un enfrentamiento; se ignorara.`);
    }

    if (event.type !== 'enfrentamiento' || !event.enemyTeam) return;

    const allowed = event.narrativo ? new Set([...generic, ...narrative]) : generic;
    event.enemyTeam.forEach(idx => {
      if (idx >= 0 && !allowed.has(idx)) {
        warn(`Evento ${where}: ${characters[idx]?.name ?? idx} no deberia aparecer en un enfrentamiento ${event.narrativo ? 'narrativo' : 'generico'}.`);
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
