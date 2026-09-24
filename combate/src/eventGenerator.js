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
  if (!nodes) return null;

  if (!ctx.currentNodeId) {
    for (const [id, node] of Object.entries(nodes)) {
      if (ctx.fired.has(id)) continue;
      if (evaluateConditions(node.conditions, ctx)) return id;
    }
    return null;
  }

  const candidate = nodes[ctx.currentNodeId];
  if (candidate && !ctx.fired.has(ctx.currentNodeId) && evaluateConditions(candidate.conditions, ctx)) {
    return ctx.currentNodeId;
  }

  return null;
}

/**
 * Genera el siguiente evento segun la prioridad:
 *   1. modo infinito: ciclo automatico
 *   2. campamento (tras superar N combates desde el ultimo campamento)
 *   3. siguiente nodo narrativo en el grafo de historia
 *   4. enfrentamiento generico
 *
 * Recompensa de orbes: hay 4 tipos (mente 🔵, poder 🔴, cuerpo 💚,
 * riqueza 🟡). Si un nodo `enfrentamiento` no define `reward`, la
 * recompensa por defecto es 1 orbe de cada tipo. Un nodo puede definir
 * `reward: { mind, power, body, wealth }` por tipo, o usar los atajos
 * legados `reward: { orbs: 3 }` / `reward: 3` (3 orbes de la mente).
 */
export function pickNextEvent(story, ctx, playerTeam) {
  if (story.infiniteMode) {
    return pickInfiniteEvent(story, ctx, playerTeam);
  }

  const threshold = story.campAfterFights ?? DEFAULT_CAMP_AFTER_FIGHTS;
  if ((ctx.fightsSinceCamp ?? 0) >= threshold) {
    return campEvent();
  }

  const nextId = findNextNode(story, ctx);
  if (nextId) {
    return { ...story.storyNodes[nextId], id: nextId };
  }

  return genericFightEvent();
}
