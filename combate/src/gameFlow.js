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
//  - sin `reward`            -> tirada de azar por tipo (valor por defecto):
//                               riqueza 10%, mente 20%, poder 50%, cuerpo 90%.
//                               Las tiradas son independientes: puede caer
//                               uno de cada tipo, varios, o ninguno.
//  - `reward: 3` (atajo legado) -> 3 mente, 0 resto (solo compat.; los
//                                  nodos nuevos usan el formato por tipo)
//  - `reward: { orbs: 3 }`       -> 3 mente, 0 resto (atajo legado)
//  - `reward: { mind, power, body, wealth }` -> por tipo; los tipos no
//    indicados valen 0 (la recompensa explicita sustituye al defecto).
//    `orbs` se mapea a `mind` si no hay `mind` explicito.
const ZERO_ORB_REWARD = Object.freeze({ mind: 0, power: 0, body: 0, wealth: 0 });

// Probabilidad de ganar 1 orbe de cada tipo al vencer sin `reward`
// explicito. Claves alineadas con ORB_META (riqueza=dorado, mente=azul,
// poder=rojo, cuerpo=verde).
export const DEFAULT_ORB_CHANCES = Object.freeze({
  wealth: 0.10,
  mind: 0.20,
  power: 0.50,
  body: 0.90
});

export function emptyOrbs() {
  return { mind: 0, power: 0, body: 0, wealth: 0 };
}

// Tirada de la recompensa por defecto: 1 orbe por tipo que supera su
// probabilidad, con tiradas independientes entre si.
export function rollDefaultOrbs(rng = Math.random) {
  const orbs = emptyOrbs();
  for (const [key, chance] of Object.entries(DEFAULT_ORB_CHANCES)) {
    if (rng() < chance) orbs[key] = 1;
  }
  return orbs;
}

export function getEventOrbs(event, rng = Math.random) {
  const reward = event?.reward;

  if (reward == null) return rollDefaultOrbs(rng);

  if (typeof reward === 'number') return { ...ZERO_ORB_REWARD, mind: reward };

  const mind = reward.mind ?? reward.orbs ?? 0;
  return {
    mind,
    power: reward.power ?? 0,
    body: reward.body ?? 0,
    wealth: reward.wealth ?? 0
  };
}

// Recompensa de una victoria. Se tira UNA SOLA VEZ, en el momento en que
// se detecta el triunfo (combat.js); el resultado se guarda en
// `state.session.pendingOrbReward` para mostrarlo en el modal de victoria
// y otorgarlo despues (handleVictory) sin volver a tirar. Si el combate se
// pierde y se reintenta, la nueva victoria vuelve a tirar.
export function rollVictoryOrbs(event, rng = Math.random) {
  return getEventOrbs(event, rng);
}

// ── Display de orbes (colores y etiquetas por tipo) ──
export const ORB_META = [
  { key: 'mind', color: '#5ea8ff', label: 'mente' },
  { key: 'power', color: '#ff5c5c', label: 'poder' },
  { key: 'body', color: '#5cd65c', label: 'cuerpo' },
  { key: 'wealth', color: '#ffd700', label: 'riqueza' }
];

// Punto de color con brillo: icono comun de los orbes en toda la UI.
export function orbDotHtml(color) {
  return `<span style="display:inline-block;width:.65em;height:.65em;border-radius:50%;background:${color};box-shadow:0 0 6px ${color};margin-right:.45em;vertical-align:middle;"></span>`;
}

// Totales siempre con los 4 tipos (HTML, cabecera del mapa):
// "<punto>3 · <punto>1 · <punto>2 · <punto>0"
export function formatOrbTotalsHtml(orbes) {
  return ORB_META
    .map(m => `${orbDotHtml(m.color)}${orbes?.[m.key] ?? 0}`)
    .join(' · ');
}

// Ganancia en HTML en una sola linea (log de batalla), solo tipos > 0:
// "<punto>+1 · <punto>+1 ..."
export function formatOrbGainInlineHtml(gained) {
  return ORB_META
    .filter(m => (gained?.[m.key] ?? 0) > 0)
    .map(m => `${orbDotHtml(m.color)}+${gained[m.key]}`)
    .join(' · ');
}

// Ganancia en HTML (modal de victoria): una linea por tipo de orbe,
// cada una con su punto de color con brillo; solo tipos > 0. Ej:
// '<punto mente>1 orbe de mente<br>...'
// Si no hay ninguna ganancia: "ninguna".
export function formatOrbGainHtml(gained) {
  const items = ORB_META
    .filter(m => (gained?.[m.key] ?? 0) > 0)
    .map(m => {
      const n = gained[m.key];
      return `${orbDotHtml(m.color)}${n} ${n === 1 ? 'orbe' : 'orbes'} de ${m.label}`;
    });

  if (items.length === 0) return '<span style="color:#888;">ninguna</span>';
  return items.join('<br>');
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
