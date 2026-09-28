// ── Secuencias de pasos ──
// Todo evento se expande en la lista de PASOS que el motor ejecuta en
// orden (ver runSteps en main.js). Dos formas de autoría:
//
//   1) Sintaxis abreviada: CUALQUIER evento puede declarar `introDialog`
//      (dialogo antes) y `outroDialog` (dialogo despues), arrays de lineas
//      { speaker?, text } igual que un evento `dialogo`.
//
//        'prueba-fuerza': {
//          type: 'enfrentamiento',
//          introDialog: [{ speaker: 'Akay', text: 'Nadie pasa...' }],
//          enemyTeam: [...], reward: {...}, next: 'prueba-final'
//        }
//
//   2) Evento compuesto: `type: 'secuencia'` con `steps: [...]`, una
//      mezcla explicita de pasos (dialogo, enfrentamiento, eleccion,
//      acertijo, campamento, reclutamiento...). Los pasos NO llevan
//      `id`/`next`/`final`/`conditions`: esos campos viven en la
//      secuencia (un solo nodo del grafo = un solo `fired`/`next`).
//
// Invariantes:
//   - Un evento sin introDialog/outroDialog que no es secuencia se
//     expande a [el propio evento] (mismo objeto, identidad conservada):
//     cero cambio de comportamiento para las historias existentes.
//   - Los pasos no declaran `reward` propio: heredan el de la secuencia
//     (si la hay), de modo que `reward` en la secuencia premia a cada
//     paso que otorgue orbes.

// Lineas -> paso de dialogo (el motor ya sabe renderizarlas).
function dialogSteps(lines) {
  if (!Array.isArray(lines) || lines.length === 0) return [];
  return [{ type: 'dialogo', dialog: lines }];
}

// Un paso sin `reward` propio hereda el del evento de arriba.
function inheritReward(step, top) {
  if (step === top || step?.reward != null || top?.reward == null) return step;
  return { ...step, reward: top.reward };
}

// Expande un paso individual (propio intro/outro incluidos).
function expandSingle(step, top) {
  const s = inheritReward(step, top);
  return [...dialogSteps(s.introDialog), s, ...dialogSteps(s.outroDialog)];
}

/**
 * Devuelve la lista de pasos (no vacía) que ejecutará el motor para un
 * evento. Nunca lanza con datos authorados; la validación estructural
 * (storyValidation.js) avisa de formas inválidas.
 */
export function expandEventSteps(event) {
  if (!event) return [];

  if (event.type !== 'secuencia') {
    return expandSingle(event, event);
  }

  const steps = Array.isArray(event.steps) ? event.steps : [];
  const core = steps.flatMap(step => {
    // Defensa: la validacion avisa; una secuencia anidada se ignora.
    if (!step || typeof step !== 'object' || step.type === 'secuencia') return [];
    return expandSingle(step, event);
  });

  return [...dialogSteps(event.introDialog), ...core, ...dialogSteps(event.outroDialog)];
}
