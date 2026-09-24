import state from './state.js';
import characters from '../data/characters.js';

// Avanza la stage, actualiza contadores de run
export function advanceStage() {
  const event = state.session.currentEvent;
  const type = event?.type;
  const story = state.session.selectedStory;

  if (type === 'campamento') {
    state.run.campamentos++;
    state.run.fightsSinceCamp = 0;
    if (story?.infiniteMode) {
      state.run.needRecruit = true;
    }
  } else if (type === 'enfrentamiento') {
    state.run.enfrentamientos++;
    state.run.fightsSinceCamp++;
  } else if (type === 'reclutamiento_infinite') {
    state.run.needRecruit = false;
  }

  if (event?.id) {
    if (!story?.infiniteMode) {
      state.run.fired.add(event.id);
    }
    if (event.type === 'enfrentamiento' && event.narrativo) {
      state.run.flags[event.id] = true;
    }
    if (event.setFlags) {
      Object.assign(state.run.flags, event.setFlags);
    }
    if (event.type !== 'eleccion' && event.next) {
      state.run.currentNodeId = event.next;
    }
  }
  state.run.stage++;
}

// ── Recompensa de orbes de un evento de combate (fuente unica) ──
// Devuelve { mind, power, body, wealth }:
//  - sin `reward`            -> 1 de cada tipo (valor por defecto)
//  - `reward: 3` (atajo)     -> 3 mente, 0 resto (compat. legado)
//  - `reward: { orbs: 3 }`   -> 3 mente, 0 resto (compat. legado)
//  - `reward: { mind, power, body, wealth }` -> por tipo; los tipos no
//    indicados valen 0 (la recompensa explicita sustituye al defecto).
//    `orbs` se mapea a `mind` si no hay `mind` explicito.
const DEFAULT_ORB_REWARD = Object.freeze({ mind: 1, power: 1, body: 1, wealth: 1 });
const ZERO_ORB_REWARD = Object.freeze({ mind: 0, power: 0, body: 0, wealth: 0 });

export function emptyOrbs() {
  return { mind: 0, power: 0, body: 0, wealth: 0 };
}

export function getEventOrbs(event) {
  const reward = event?.reward;

  if (reward == null) return { ...DEFAULT_ORB_REWARD };

  if (typeof reward === 'number') return { ...ZERO_ORB_REWARD, mind: reward };

  const mind = reward.mind ?? reward.orbs ?? 0;
  return {
    mind,
    power: reward.power ?? 0,
    body: reward.body ?? 0,
    wealth: reward.wealth ?? 0
  };
}

// ── Display de orbes (iconos, colores y etiquetas por tipo) ──
export const ORB_META = [
  { key: 'mind', icon: '🔵', color: '#5ea8ff', label: 'mente' },
  { key: 'power', icon: '🔴', color: '#ff5c5c', label: 'poder' },
  { key: 'body', icon: '💚', color: '#5cd65c', label: 'cuerpo' },
  { key: 'wealth', icon: '🟡', color: '#ffd700', label: 'riqueza' }
];

// Totales siempre con los 4 tipos: "🔵 3 · 🔴 1 · 💚 2 · 🟡 0"
export function formatOrbTotals(orbes) {
  return ORB_META
    .map(m => `${m.icon} ${orbes?.[m.key] ?? 0}`)
    .join(' · ');
}

// Ganancia en texto plano (log), solo tipos > 0:
// "🔵 +1 · 🔴 +1 · 💚 +1 · 🟡 +1"
export function formatOrbGainText(gained) {
  return ORB_META
    .filter(m => (gained?.[m.key] ?? 0) > 0)
    .map(m => `${m.icon} +${gained[m.key]}`)
    .join(' · ');
}

// Ganancia en HTML coloreado (modal de victoria), solo tipos > 0:
// '<span style="color:#5ea8ff">🔵 +1</span> ...'
export function formatOrbGainHtml(gained) {
  return ORB_META
    .filter(m => (gained?.[m.key] ?? 0) > 0)
    .map(m => `<span style="color:${m.color}">${m.icon} +${gained[m.key]}</span>`)
    .join(' ');
}

// Determina que pasa al ganar: protagonista cae, aliados caen, victoria limpia
export function resolveVictory() {
  const fallen = [];
  state.combat.teams.A.members.forEach((m, i) => {
    if (m && m.currentHp <= 0) fallen.push(i);
  });

  const protagonistSlot = state.session.protagonistSlot;
  const story = state.session.selectedStory;

  if (!story?.noProtagonist && fallen.includes(protagonistSlot)) {
    const protagonistName = characters[state.session.selectedStory.protagonist ?? 0].name;
    return { result: 'protagonist_fallen', fallen, protagonistName };
  }

  if (fallen.length > 0) {
    const names = fallen.map(i => characters[state.session.playerTeam[i]].name);
    return { result: 'allies_fallen', fallen, names };
  }

  return { result: 'clean_victory', fallen: [] };
}
