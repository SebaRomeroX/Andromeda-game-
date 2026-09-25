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
  const check = (fromId, target) => {
    if (target != null && !known.has(target)) {
      warn(`El nodo "${fromId}" apunta con "next" a "${target}", que no existe en storyNodes ni randomEvents.`);
    }
  };

  [story.storyNodes, story.randomEvents].forEach(nodes => {
    Object.entries(nodes ?? {}).forEach(([id, node]) => {
      check(id, node.next);
      (node.options ?? []).forEach(opt => check(id, opt.next));
    });
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
    if (event.type === 'reclutamiento') {
      if (event.character != null && !allies.has(event.character)) {
        warn(`Evento ${where}: ${characters[event.character]?.name ?? event.character} es reclutable pero no esta en allies.`);
      }
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
      if (event.question == null) {
        warn(`Evento ${where}: es un acertijo pero no tiene "question".`);
      }
      if (!Array.isArray(event.options) || event.options.length === 0) {
        warn(`Evento ${where}: es un acertijo pero no tiene opciones en "options".`);
      } else if (!event.options.some(o => o.id != null && o.id === event.answer)) {
        warn(`Evento ${where}: "answer" no coincide con el id de ninguna opcion.`);
      } else if (event.reward == null) {
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
