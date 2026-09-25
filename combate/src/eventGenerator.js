const DEFAULT_CAMP_AFTER_FIGHTS = 3;

function numericMinimum(key, value, ctx) {
  return (ctx[key] ?? 0) >= value;
}

/**
 * Manejadores de condiciones. Cada clave del objeto `conditions` se resuelve
 * contra un handler. Todas las claves se combinan con AND.
 *
 * Tipos disponibles:
 *   - campamentos / enfrentamientos / stage: umbral minimo numerico (>=)
 *   - eleccion: verifica que la opcion elegida en un evento coincida
 *   - flag: el flag indicado debe estar truthy
 *   - notFlag: el flag indicado debe estar falsy o no existir
 */
const CONDITION_HANDLERS = {
  campamentos: numericMinimum,
  enfrentamientos: numericMinimum,
  stage: numericMinimum,
  flag: (key, flagName, ctx) => !!ctx.flags?.[flagName],
  notFlag: (key, flagName, ctx) => !ctx.flags?.[flagName],
  eleccion: (key, map, ctx) =>
    Object.entries(map ?? {}).every(([eventId, optionId]) =>
      (ctx.choices?.[eventId] ?? null) === optionId
    )
};

/**
 * Evalua un objeto de condiciones. Todas las claves deben cumplirse (AND).
 * Las claves sin handler registrado se ignoran.
 */
export function evaluateConditions(conditions = {}, ctx) {
  return Object.entries(conditions).every(([key, value]) => {
    const handler = CONDITION_HANDLERS[key];
    return handler ? handler(key, value, ctx) : true;
  });
}

function campEvent() {
  return {
    id: null,
    type: 'campamento',
    title: 'Campamento',
    description: 'El equipo descansa y se recupera de sus heridas de batalla.'
  };
}

function genericFightEvent() {
  return {
    id: null,
    type: 'enfrentamiento',
    narrativo: false,
    generic: true,
    title: 'Enfrentamiento',
    description: 'Te cruzas con enemigos en el camino.'
  };
}

/**
 * Selecciona 2 personajes aleatorios de un pool para ofrecer en reclutamiento.
 * No repite el mismo personaje en la oferta.
 */
function pickTwoRandom(pool) {
  const a = pool[Math.floor(Math.random() * pool.length)];
  let b;
  do {
    b = pool[Math.floor(Math.random() * pool.length)];
  } while (b === a && pool.length > 1);
  return [a, b];
}

/**
 * Genera un evento de reclutamiento para modo infinito.
 * Ofrece 2 personajes aleatorios; el jugador elige 1.
 */
function infiniteRecruitEvent(story, ctx) {
  const pool = story.allies ?? [];
  const [a, b] = pickTwoRandom(pool);
  ctx.recruitOffer = [a, b];
  return {
    id: null,
    type: 'reclutamiento_infinite',
    title: 'Reclutamiento',
    description: 'Elige a un nuevo miembro para tu equipo.',
    recruitOffer: [a, b]
  };
}

/**
 * Logica de eventos para modo infinito.
 * Ciclo fijo: reclutar → 3 combates → campamento → repetir
 */
function pickInfiniteEvent(story, ctx, playerTeam) {
  if (ctx.needRecruit) {
    return infiniteRecruitEvent(story, ctx);
  }

  if ((ctx.fightsSinceCamp ?? 0) >= (story.campAfterFights ?? DEFAULT_CAMP_AFTER_FIGHTS)) {
    return campEvent();
  }

  return genericFightEvent();
}

/**
 * Busca el siguiente nodo en el grafo de historia.
 *
 * `currentNodeId` siempre apunta al proximo nodo que deberia dispararse
 * (o null al inicio para bootstrap). Despues de cada evento:
 *   - No elecciones: advanceStage setea currentNodeId = event.next
 *   - Elecciones: el handler setea currentNodeId = option.next
 *
 * La funcion simplemente valida si el nodo apuntado es elegible.
 */
function findNextNode(story, ctx) {
  const nodes = story.storyNodes;
  if (!nodes && !story.randomEvents) return null;

  if (!ctx.currentNodeId) {
    // Solo el grafo principal: las entradas aleatorias jamas se eligen por
    // bootstrap (suelen llegar por el doble sorteo del fallback).
    for (const [id, node] of Object.entries(nodes ?? {})) {
      if (ctx.fired.has(id)) continue;
      if (evaluateConditions(node.conditions, ctx)) return id;
    }
    return null;
  }

  // El puntero puede apuntar a un sub-nodo de `randomEvents` (la rama de un
  // evento aleatorio avanza con la misma mecanica que el grafo principal).
  const candidate = resolveNode(story, ctx.currentNodeId);
  if (candidate && !ctx.fired.has(ctx.currentNodeId) && evaluateConditions(candidate.conditions, ctx)) {
    return ctx.currentNodeId;
  }

  return null;
}

// Resuelve un id en ambos pools de nodos (grafo principal y de eventos
// aleatorios); null si no existe en ninguno.
function resolveNode(story, id) {
  if (id == null) return null;
  return story.storyNodes?.[id] ?? story.randomEvents?.[id] ?? null;
}

// ── Eventos aleatorios ──
// Historias con `randomEvents` pueden interrumpir el fallback a combate
// generico con dos sorteos encadenados:
//   1) `randomEventChance` decide si ocurre un evento aleatorio; si la
//      tirada falla, sigue el combate generico de siempre.
//   2) Entre las entradas elegibles se sortea ponderado por `chance`
//      (peso relativo: mas alto = mas comun; por defecto 1). Una vez
//      acertado el sorteo 1 el evento queda garantizado: siempre sale
//      uno, si queda alguno elegible.
// Entradas (raices): nodos del pool a los que no apunta ningun `next`
// (ni de historia ni del pool); los demas son sub-nodos de una entrada y
// se llega a ellos por el flujo normal via currentNodeId.

/** Todos los `next` declarados (options incluidas) de ambos pools. */
function collectNextTargets(story) {
  const targets = new Set();
  const scan = (nodes) => {
    Object.values(nodes ?? {}).forEach(node => {
      if (node.next != null) targets.add(node.next);
      (node.options ?? []).forEach(opt => {
        if (opt.next != null) targets.add(opt.next);
      });
    });
  };
  scan(story.storyNodes);
  scan(story.randomEvents);
  return targets;
}

/** Entradas del pool aleatorio como [id, nodo], en orden de insercion. */
export function randomEntries(story) {
  const pool = story.randomEvents;
  if (!pool) return [];
  const targets = collectNextTargets(story);
  return Object.entries(pool).filter(([id]) => !targets.has(id));
}

/** Una entrada solo participa del sorteo si: chance > 0, no fue disparada
 * (o es repeatable) y cumple sus condiciones. */
function isEntryEligible(id, node, ctx) {
  return (node.chance ?? 1) > 0 &&
    (node.repeatable || !ctx.fired.has(id)) &&
    evaluateConditions(node.conditions, ctx);
}

/** Sorteo ponderado: `chance` como peso relativo dentro de los elegibles. */
function weightedEntryPick(entries, rng) {
  const total = entries.reduce((sum, [, node]) => sum + (node.chance ?? 1), 0);
  let roll = rng() * total;
  for (const [id, node] of entries) {
    roll -= (node.chance ?? 1);
    if (roll < 0) return id;
  }
  return entries[entries.length - 1][0]; // borde por coma flotante
}

/** Borra las marcas `fired` del sub-grafo de una entrada. Solo se aplica
 * a eventos `repeatable`, para que la repeticion vuelva a jugar la rama
 * completa (incluido su nodo final). */
function clearSubgraphFired(pool, entryId, ctx) {
  const stack = [entryId];
  const seen = new Set();
  while (stack.length) {
    const id = stack.pop();
    if (seen.has(id)) continue;
    seen.add(id);
    ctx.fired.delete(id);
    const node = pool[id];
    if (!node) continue;
    if (node.next != null) stack.push(node.next);
    (node.options ?? []).forEach(opt => {
      if (opt.next != null) stack.push(opt.next);
    });
  }
}

/** Doble sorteo de eventos aleatorios. Devuelve el evento elegido o null
 * si el fallback sigue siendo combate generico (sin pool, gate en 0,
 * pool agotado o tirada fallida). */
function pickRandomEvent(story, ctx, rng) {
  const pool = story.randomEvents;
  if (!pool || !((story.randomEventChance ?? 0) > 0)) return null;

  const eligible = randomEntries(story).filter(([id, node]) => isEntryEligible(id, node, ctx));
  if (eligible.length === 0) return null;

  // Sorteo 1: ¿evento aleatorio o combate generico?
  if (!(rng() < story.randomEventChance)) return null;

  // Sorteo 2: entre los elegibles siempre sale uno (ponderado por chance).
  const id = weightedEntryPick(eligible, rng);
  if (pool[id].repeatable) clearSubgraphFired(pool, id, ctx);
  return { ...pool[id], id, random: true };
}

/**
 * Genera el siguiente evento segun la prioridad:
 *   1. modo infinito: ciclo automatico
 *   2. campamento (tras superar N combates desde el ultimo campamento)
 *   3. siguiente nodo narrativo en el grafo de historia
 *   4. evento aleatorio (doble sorteo, ver pickRandomEvent; el id elegido
 *      se fija en `ctx.pendingRandomId` para que la tarjeta del mapa no
 *      re-tire sin avanzar de etapa)
 *   5. enfrentamiento generico
 *
 * Recompensa de orbes: hay 4 tipos (mente, poder, cuerpo, riqueza), cada
 * uno con su punto de color en la UI. Si un nodo `enfrentamiento` no
 * define `reward`, al vencer se tira por tipo de forma independiente:
 * riqueza 10%, mente 20%, poder 50%, cuerpo 90% (puede no caer ninguno).
 * Los nodos de historia deben definir la recompensa explicita por tipo:
 * `reward: { mind, power, body, wealth }` (los tipos no indicados valen
 * 0). Los atajos legados `reward: { orbs: 3 }` / `reward: 3` siguen
 * soportados por compatibilidad, pero se interpretan como 3 orbes de la
 * mente; no los uses en nodos nuevos.
 *
 * `rng` permite inyectar aleatoriedad deterministica (devTools usa
 * `() => 0`: siempre cae en el evento aleatorio y elige la primera
 * entrada elegible, para que la lista de etapas sea estable).
 */
export function pickNextEvent(story, ctx, playerTeam, rng = Math.random) {
  if (story.infiniteMode) {
    return pickInfiniteEvent(story, ctx, playerTeam);
  }

  const threshold = story.campAfterFights ?? DEFAULT_CAMP_AFTER_FIGHTS;
  if ((ctx.fightsSinceCamp ?? 0) >= threshold) {
    return campEvent();
  }

  const nextId = findNextNode(story, ctx);
  if (nextId) {
    return { ...resolveNode(story, nextId), id: nextId };
  }

  // ── Fallback ──
  // Sin nodo de historia pendiente: primero consume el pin (la tarjeta ya
  // mostro un evento aleatorio; renderMap re-tira en cada render y sin
  // pin la tarjeta podria cambiar sin avanzar de etapa). despues intenta
  // el doble sorteo; si no, combate generico.
  if (ctx.pendingRandomId != null) {
    const node = story.randomEvents?.[ctx.pendingRandomId];
    if (node && isEntryEligible(ctx.pendingRandomId, node, ctx)) {
      return { ...node, id: ctx.pendingRandomId, random: true };
    }
    ctx.pendingRandomId = null;
  }

  const picked = pickRandomEvent(story, ctx, rng);
  if (picked) {
    ctx.pendingRandomId = picked.id;
    return picked;
  }

  return genericFightEvent();
}
