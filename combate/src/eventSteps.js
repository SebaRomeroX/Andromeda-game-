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
//   3) Ramas inline: una opcion de eleccion puede declarar sus propios
//      `steps: [...]`. Al elegirla, el motor los expande (con los mismos
//      derechos que cualquier paso: herencia de reward, intro/outro) y
//      los ejecuta justo detras de la eleccion, antes de lo que quede en
//      la cola. Asi UN nodo ramifica sin punteros `next` que salgan de
//      el (la validacion avisa si se declaran).
//
//        steps: [{ type: 'eleccion', options: [
//          { id: 'ayudar', label: 'Ayudar', steps: [{ type: 'enfrentamiento', ... }, ...] },
//          { id: 'ignorar', label: 'Seguir', steps: [{ type: 'dialogo', ... }] }
//        ]}]
//
// Invariantes:
//   - Un evento sin introDialog/outroDialog que no es secuencia se
//     expande a [el propio evento] (mismo objeto, identidad conservada):
//     cero cambio de comportamiento para las historias existentes.
//   - Los pasos no declaran `reward` propio: heredan el de la secuencia
//     (si la hay), de modo que `reward` en la secuencia premia a cada
//     paso que otorgue orbes. Lo mismo vale para los pasos de una rama
//     (heredan del nodo contenedor).

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
 * Pasos en linea de una opcion de eleccion (`option.steps`): misma
 * expansion que un paso normal de la secuencia, con `top` = nodo
 * contenedor (de ahi heredan el reward). Formas invalidas se ignoran
 * (la validacion avisa): entradas que no son objetos y secuencias
 * anidadas.
 */
export function expandOptionSteps(steps, top) {
  if (!Array.isArray(steps)) return [];
  return steps.flatMap(step => {
    if (!step || typeof step !== 'object' || step.type === 'secuencia') return [];
    return expandSingle(step, top);
  });
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

  const core = expandOptionSteps(event.steps, event);

  return [...dialogSteps(event.introDialog), ...core, ...dialogSteps(event.outroDialog)];
}
