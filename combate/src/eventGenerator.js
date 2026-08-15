const DEFAULT_CAMP_AFTER_FIGHTS = 3;

function numericMinimum(key, value, ctx) {
  return (ctx[key] ?? 0) >= value;
}

/**
 * Manejadores de condiciones. Cada clave del objeto `conditions` se resuelve
 * contra un handler. Por ahora todos son umbrales mínimos (>=) sobre contadores,
 * salvo `eleccion`, que exige que la opción elegida en un evento de elección
 * coincida exactamente con la indicada (ej: { eleccion: { 'eleccion-caminos': 'izquierda' } }).
 * Extensiones futuras planeadas: `personajeInTeam`, `personajeHasDied`,
 * `specificNarrativeEventHasOcurred` (usaría ctx.fired.has(id)).
 */
const CONDITION_HANDLERS = {
  campamentos: numericMinimum,
  enfrentamientos: numericMinimum,
  stage: numericMinimum,
  eleccion: (key, map, ctx) =>
    Object.entries(map ?? {}).every(([eventId, optionId]) => (ctx.choices?.[eventId] ?? null) === optionId)
};

/**
 * Evalúa un objeto de condiciones. Todas las claves deben cumplirse (AND).
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
 * Genera el siguiente evento según la prioridad:
 *   1. campamento (tras superar N combates desde el último campamento)
 *   2. primer evento narrativo disponible cuyo `conditions` se cumple
 *   3. enfrentamiento genérico
 */
export function pickNextEvent(story, ctx) {
  const threshold = story.campAfterFights ?? DEFAULT_CAMP_AFTER_FIGHTS;
  if ((ctx.fightsSinceCamp ?? 0) >= threshold) {
    return campEvent();
  }

  for (const ev of story.narrativeEvents ?? []) {
    if (ev.id && ctx.fired && ctx.fired.has(ev.id)) continue;
    if (evaluateConditions(ev.conditions, ctx)) {
      return ev;
    }
  }

  return genericFightEvent();
}