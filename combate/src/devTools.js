import { ROLE_BY_INDEX, getLevelStats } from './models.js';
import { pickNextEvent } from './eventGenerator.js';
import { expandEventSteps, expandOptionSteps } from './eventSteps.js';
import { rollVictoryOrbs } from './gameFlow.js';
import { getCharacter } from '../data/characters.js';

function initialRun() {
  return { stage: 0, enfrentamientos: 0, campamentos: 0, fightsSinceCamp: 0, fired: new Set(), choices: {}, currentNodeId: null, flags: {}, orbes: { mind: 0, power: 0, body: 0, wealth: 0 }, pendingRandomId: null };
}

// rng deterministica para las simulaciones: el sorteo 1 siempre acierta y
// el ponderado elige la primera entrada elegible, de modo que la lista de
// etapas y los saltos son estables (e incluyen el contenido aleatorio).
const DETERMINISTIC_RNG = () => 0;

// Efectos de un PASO al completarse (simulacion: siempre exito). Paridad
// con applyStepEffects de gameFlow + las recompensas/altas que en el juego
// real ocurren durante el paso. Se aplica a cada paso de expandEventSteps.
// `node` es el nodo del grafo contenedor (para un evento top-level es el
// propio paso): fija la clave de `choices` de una eleccion sin id (paso
// de secuencia -> id del nodo, igual que en runSteps) y hace que
// `option.next` no salga del nodo.
// Devuelve los pasos de la rama elegida (`option.steps`) ya expandidos:
// applyEvent los inserta en la cola, igual que runSteps en main.js.
// Exportado para que validate-stories.mjs compruebe la paridad.
export function applyEventStep(step, run, roster, choices, node = step) {
  if (step.type === 'campamento') {
    run.campamentos++;
    run.fightsSinceCamp = 0;
  } else if (step.type === 'enfrentamiento') {
    run.enfrentamientos++;
    run.fightsSinceCamp++;
    // Recompensa de orbes: reward explicito (o heredado de la secuencia)
    // o tirada de azar por defecto (riqueza 10%, mente 20%, poder 50%,
    // cuerpo 90%; independientes)
    const gained = rollVictoryOrbs(step);
    const orbes = run.orbes ?? (run.orbes = { mind: 0, power: 0, body: 0, wealth: 0 });
    Object.keys(gained).forEach((k) => {
      orbes[k] = (orbes[k] ?? 0) + gained[k];
    });
  } else if (step.type === 'acertijo') {
    // Simula el acierto: se otorga la recompensa (explicita o tirada por defecto)
    const gained = rollVictoryOrbs(step);
    const orbes = run.orbes ?? (run.orbes = { mind: 0, power: 0, body: 0, wealth: 0 });
    Object.keys(gained).forEach((k) => {
      orbes[k] = (orbes[k] ?? 0) + gained[k];
    });
  } else if (step.type === 'reclutamiento') {
    const char = getCharacter(step.character);
    const slot = ROLE_BY_INDEX.indexOf(char?.role ?? '');
    if (slot >= 0) roster[slot] = step.character;
  } else if (step.type === 'eleccion') {
    const inSequence = node !== step;
    // Misma clave que en tiempo real (showChoiceEvent): id del paso y,
    // si es un paso de secuencia, el id del nodo inyectado por runSteps.
    const key = step.id ?? (inSequence ? node.id : null) ?? step.title;
    if (key != null && step.options?.length) {
      // Si la semilla guarda una opcion que ya no existe, la simulacion
      // cae en la primera (determinismo), como haria un jugador nuevo.
      const chosenId = step.options.some(o => o.id === choices[key])
        ? choices[key]
        : step.options[0].id;
      run.choices[key] = chosenId;
      const chosenOpt = step.options.find(o => o.id === chosenId);
      if (chosenOpt?.next && !inSequence) run.currentNodeId = chosenOpt.next;
      return expandOptionSteps(chosenOpt?.steps, node);
    }
  }
  return [];
}

// Efectos de nivel NODO (solo el evento de arriba, nunca un paso):
// paridad con completeEvent de gameFlow. Exportado para pruebas.
export function applyEvent(ev, run, roster, choices = {}) {
  // Cola de pasos igual que runSteps: una eleccion puede inyectar su
  // rama (option.steps) justo detras del paso elegido. expandEventSteps
  // siempre devuelve un array nuevo (la historia no se toca).
  const queue = expandEventSteps(ev);
  for (let i = 0; i < queue.length; i++) {
    const branch = applyEventStep(queue[i], run, roster, choices, ev);
    if (branch.length) queue.splice(i + 1, 0, ...branch);
  }

  if (ev.id) run.fired.add(ev.id);
  // Auto-flag: victoria en enfrentamiento narrativo (o secuencia narrativa)
  if ((ev.type === 'enfrentamiento' || ev.type === 'secuencia') && ev.narrativo && ev.id) {
    run.flags[ev.id] = true;
  }
  // Flags explicitos del nodo
  if (ev.setFlags) {
    Object.assign(run.flags, ev.setFlags);
  }
  if (ev.type !== 'eleccion' && ev.next) run.currentNodeId = ev.next;
  // Paridad con completeEvent: el pin del evento aleatorio se limpia al
  // completar la etapa.
  run.pendingRandomId = null;
}

/**
 * Simula la secuencia determinística de una historia secuencial y devuelve
 * la lista de etapas jugables (cada una con el evento que se juega).
 */
export function listStages(story, choices = {}) {
  const entries = [];
  const run = initialRun();
  const roster = [...story.teamA];
  // Límite de seguridad para evitar loops infinitos; el fin real lo marca el
  // evento final (que puede llegar después de `expectedStages`, según condiciones).
  const cap = 500;

  while (entries.length < cap) {
    const ev = pickNextEvent(story, run, undefined, DETERMINISTIC_RNG);
    entries.push({
      stage: entries.length + 1,
      type: ev.type,
      title: ev.title,
      id: ev.id ?? null,
      final: !!ev.final
    });
    if (ev.final) break;
    applyEvent(ev, run, roster, choices);
    run.stage++;
  }

  return entries;
}

/**
 * Deriva el estado del run (stage, contadores, fired), la nómina del equipo
 * (base + reclutas anteriores) y la cantidad de campamentos pasados, como si
 * se hubieran completado los stageNumber - 1 eventos previos de la historia.
 */
export function simulateToStage(story, stageNumber, choices = {}) {
  const completed = Math.max(0, stageNumber - 1);
  const run = initialRun();
  const roster = [...story.teamA];
  let campCount = 0;

  while (run.stage < completed) {
    const ev = pickNextEvent(story, run, undefined, DETERMINISTIC_RNG);
    if (ev.type === 'campamento') campCount++;
    applyEvent(ev, run, roster, choices);
    run.stage++;
  }

  return { run, roster, campCount };
}

/**
 * Construye el payload de partida para saltar a una etapa: equipo con HP
 * completo, niveles = nivel base + campamentos acumulados, y run reconstruido.
 */
export function buildJumpPayload(story, stageNumber, choices = {}) {
  const { run, roster, campCount } = simulateToStage(story, stageNumber, choices);

  const hp = [];
  const levels = [];
  roster.forEach((name) => {
    const base = getCharacter(name);
    if (!base) {
      hp.push(null);
      levels.push(null);
      return;
    }
    const level = (base.level ?? 1) + campCount;
    levels.push(level);
    hp.push(getLevelStats({ ...base, level }).hp);
  });

  const protagonistChar = getCharacter(story.protagonist);
  return {
    payload: {
      playerTeam: roster,
      protagonistSlot: ROLE_BY_INDEX.indexOf(protagonistChar?.role ?? ''),
      run,
      team: { hp, levels }
    }
  };
}

/**
 * Monta el panel "Herramientas de desarrollo": selector de historia secuencial,
 * selector de etapa y botón de salto.
 *
 * @param {Object[]} stories - Historias disponibles (data/stories.js)
 * @param {Function} onJump - (story, payload) => void
 */
export function setupDevPanel(stories, onJump) {
  const panel = document.getElementById('dev-panel');
  const storySel = document.getElementById('dev-story');
  const stageSel = document.getElementById('dev-stage');
  const jumpBtn = document.getElementById('dev-jump');
  const header = document.getElementById('dev-header');
  const body = document.getElementById('dev-body');
  const toggle = document.getElementById('dev-toggle');
  const choicesBox = document.getElementById('dev-choices');

  if (!panel || !storySel) return;

  const sequential = stories.filter(s => s.sequential);

  header.addEventListener('click', () => {
    body.classList.toggle('hidden');
    toggle.textContent = body.classList.contains('hidden') ? '▼' : '▲';
  });

  storySel.innerHTML = '';
  sequential.forEach((s, i) => {
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = s.title;
    storySel.appendChild(opt);
  });

  let stageEntries = [];
  let choiceControls = [];

  /**
   * Arma un selector por cada evento de elección de la historia. La opción
   * elegida define la rama que se simula al listar etapas y al saltar.
   */
  function buildChoiceControls(story) {
    const prevValues = {};
    choiceControls.forEach(({ eventId, select }) => {
      prevValues[eventId] = select.value;
    });

    choiceControls = [];
    if (!choicesBox) return;
    choicesBox.innerHTML = '';
    if (!story) return;

    // Nodos de ambos pools, con su id de clave adjunto (pickNextEvent hace
    // lo mismo al devolverlos; sin id el filtro de abajo los descartaria y
    // no apareceria ningun selector de rama).
    const dictNodes = (pool) => Object.entries(pool ?? {}).map(([id, node]) => ({ ...node, id }));
    const allNodes = [
      ...(story.storyNodes ? dictNodes(story.storyNodes) : (story.narrativeEvents ?? [])),
      ...dictNodes(story.randomEvents)
    ];
    // Una fila por eleccion sembrable: top-level o el primer paso de
    // eleccion de una secuencia (p. ej. 'viajero'); en ambos casos la
    // clave de choices es el id del nodo, igual que en tiempo real.
    const elecciones = [];
    allNodes.forEach(ev => {
      if (!ev.id) return;
      if (ev.type === 'eleccion' && Array.isArray(ev.options) && ev.options.length > 0) {
        elecciones.push(ev);
      } else if (ev.type === 'secuencia') {
        const step = (ev.steps ?? []).find(s => s?.type === 'eleccion'
          && Array.isArray(s.options) && s.options.length > 0);
        if (step) elecciones.push({ ...ev, options: step.options });
      }
    });

    elecciones.forEach(ev => {
      const row = document.createElement('div');
      row.className = 'dev-row';

      const label = document.createElement('label');
      label.textContent = ev.title ?? ev.id;

      const select = document.createElement('select');
      ev.options.forEach((opt, i) => {
        const o = document.createElement('option');
        o.value = opt.id;
        o.textContent = opt.label;
        if (i === 0) o.selected = true;
        select.appendChild(o);
      });
      if (prevValues[ev.id] != null) select.value = prevValues[ev.id];
      select.addEventListener('change', refresh);

      row.appendChild(label);
      row.appendChild(select);
      choicesBox.appendChild(row);
      choiceControls.push({ eventId: ev.id, select });
    });
  }

  function readChoiceOverrides() {
    const overrides = {};
    choiceControls.forEach(({ eventId, select }) => {
      if (select.value != null && select.value !== '') overrides[eventId] = select.value;
    });
    return overrides;
  }

  function refresh() {
    const story = sequential[parseInt(storySel.value, 10)];
    const prev = stageSel.value;
    stageSel.innerHTML = '';
    buildChoiceControls(story);
    if (!story) {
      stageEntries = [];
      stageSel.disabled = true;
      jumpBtn.disabled = true;
      return;
    }
    stageEntries = listStages(story, readChoiceOverrides());
    stageEntries.forEach(e => {
      const opt = document.createElement('option');
      opt.value = e.stage;
      opt.textContent = `Etapa ${e.stage} · ${e.title}`;
      stageSel.appendChild(opt);
    });
    if (prev && stageEntries.some(e => String(e.stage) === prev)) {
      stageSel.value = prev;
    }
    stageSel.disabled = stageEntries.length === 0;
    jumpBtn.disabled = stageEntries.length === 0;
  }

  storySel.addEventListener('change', refresh);

  jumpBtn.addEventListener('click', () => {
    const story = sequential[parseInt(storySel.value, 10)];
    const stageNumber = parseInt(stageSel.value, 10);
    const valid = story && stageEntries.some(e => e.stage === stageNumber);
    if (!valid) {
      alert('Elegí una historia y una etapa válidas.');
      return;
    }
    if (!confirm(`Saltar a la etapa ${stageNumber} de "${story.title}".\n\nSe recalcula el equipo para esa etapa (con el camino elegido) y se sobrescribirá la partida guardada. ¿Continuar?`)) {
      return;
    }
    const { payload } = buildJumpPayload(story, stageNumber, readChoiceOverrides());
    onJump(story, payload);
  });

  refresh();
}