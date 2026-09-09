const DEFAULT_CAMP_AFTER_FIGHTS = 3;

function numericMinimum(key, value, ctx) {
  return (ctx[key] ?? 0) >= value;
}

/**
 * Manejadores de condiciones. Cada clave del objeto `conditions` se resuelve
 * contra un handler. Por ahora todos son umbrales minimos (>=) sobre contadores.
 */
const CONDITION_HANDLERS = {
  campamentos: numericMinimum,
  enfrentamientos: numericMinimum,
  stage: numericMinimum
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

  // Sin posicion: bootstrap, encontrar el primer nodo elegible
  if (!ctx.currentNodeId) {
    for (const [id, node] of Object.entries(nodes)) {
      if (ctx.fired.has(id)) continue;
      if (evaluateConditions(node.conditions, ctx)) return id;
    }
    return null;
  }

  // Validar si el nodo apuntado es elegible
  const candidate = nodes[ctx.currentNodeId];
  if (candidate && !ctx.fired.has(ctx.currentNodeId) && evaluateConditions(candidate.conditions, ctx)) {
    return ctx.currentNodeId;
  }

  return null;
}

/**
 * Genera el siguiente evento segun la prioridad:
 *   1. campamento (tras superar N combates desde el ultimo campamento)
 *   2. siguiente nodo narrativo en el grafo de historia
 *   3. enfrentamiento generico
 */
export function pickNextEvent(story, ctx) {
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
