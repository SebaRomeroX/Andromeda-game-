import { ROLE_BY_INDEX, getLevelStats } from './models.js';
import { pickNextEvent } from './eventGenerator.js';
import characters from '../data/characters.js';

function initialRun() {
  return { stage: 0, enfrentamientos: 0, campamentos: 0, fightsSinceCamp: 0, fired: new Set(), choices: {} };
}

function applyEvent(ev, run, roster) {
  if (ev.type === 'campamento') {
    run.campamentos++;
    run.fightsSinceCamp = 0;
  } else if (ev.type === 'enfrentamiento') {
    run.enfrentamientos++;
    run.fightsSinceCamp++;
  } else if (ev.type === 'reclutamiento') {
    const char = characters[ev.character];
    const slot = ROLE_BY_INDEX.indexOf(char?.role);
    if (slot >= 0) roster[slot] = ev.character;
  } else if (ev.type === 'eleccion') {
    if (ev.id && ev.options?.length) run.choices[ev.id] = ev.options[0].id;
  }
  if (ev.id) run.fired.add(ev.id);
}

/**
 * Simula la secuencia determinística de una historia secuencial y devuelve
 * la lista de etapas jugables (cada una con el evento que se juega).
 */
export function listStages(story) {
  const entries = [];
  const run = initialRun();
  const roster = [...story.teamA];
  // Límite de seguridad para evitar loops infinitos; el fin real lo marca el
  // evento final (que puede llegar después de `expectedStages`, según condiciones).
  const cap = 500;

  while (entries.length < cap) {
    const ev = pickNextEvent(story, run);
    entries.push({
      stage: entries.length + 1,
      type: ev.type,
      title: ev.title,
      id: ev.id ?? null,
      final: !!ev.final
    });
    if (ev.final) break;
    applyEvent(ev, run, roster);
    run.stage++;
  }

  return entries;
}

/**
 * Deriva el estado del run (stage, contadores, fired), la nómina del equipo
 * (base + reclutas anteriores) y la cantidad de campamentos pasados, como si
 * se hubieran completado los stageNumber - 1 eventos previos de la historia.
 */
export function simulateToStage(story, stageNumber) {
  const completed = Math.max(0, stageNumber - 1);
  const run = initialRun();
  const roster = [...story.teamA];
  let campCount = 0;

  while (run.stage < completed) {
    const ev = pickNextEvent(story, run);
    if (ev.type === 'campamento') campCount++;
    applyEvent(ev, run, roster);
    run.stage++;
  }

  return { run, roster, campCount };
}

/**
 * Construye el payload de partida para saltar a una etapa: equipo con HP
 * completo, niveles = nivel base + campamentos acumulados, y run reconstruido.
 */
export function buildJumpPayload(story, stageNumber) {
  const { run, roster, campCount } = simulateToStage(story, stageNumber);

  const hp = [];
  const levels = [];
  roster.forEach((idx) => {
    if (idx == null || idx < 0) {
      hp.push(null);
      levels.push(null);
      return;
    }
    const base = characters[idx];
    if (!base) {
      hp.push(null);
      levels.push(null);
      return;
    }
    const level = (base.level ?? 1) + campCount;
    levels.push(level);
    hp.push(getLevelStats({ ...base, level }).hp);
  });

  return {
    payload: {
      playerTeam: roster,
      protagonistSlot: ROLE_BY_INDEX.indexOf(characters[story.protagonist ?? 0].role),
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

  function refresh() {
    const story = sequential[parseInt(storySel.value, 10)];
    const prev = stageSel.value;
    stageSel.innerHTML = '';
    if (!story) {
      stageEntries = [];
      stageSel.disabled = true;
      jumpBtn.disabled = true;
      return;
    }
    stageEntries = listStages(story);
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
    if (!confirm(`Saltar a la etapa ${stageNumber} de "${story.title}".\n\nSe recalcula el equipo para esa etapa y se sobrescribirá la partida guardada. ¿Continuar?`)) {
      return;
    }
    const { payload } = buildJumpPayload(story, stageNumber);
    onJump(story, payload);
  });

  refresh();
}