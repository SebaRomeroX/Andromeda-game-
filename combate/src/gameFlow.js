import state from './state.js';
import characters from '../data/characters.js';

// Avanza la stage, actualiza contadores de run
export function advanceStage() {
  const event = state.session.currentEvent;
  const type = event?.type;

  if (type === 'campamento') {
    state.run.campamentos++;
    state.run.fightsSinceCamp = 0;
  } else if (type === 'enfrentamiento') {
    state.run.enfrentamientos++;
    state.run.fightsSinceCamp++;
  }

  if (event?.id) {
    state.run.fired.add(event.id);
    // Auto-flag: victoria en enfrentamiento narrativo
    if (event.type === 'enfrentamiento' && event.narrativo) {
      state.run.flags[event.id] = true;
    }
    // Flags explicitos del nodo
    if (event.setFlags) {
      Object.assign(state.run.flags, event.setFlags);
    }
    // Avanzar posicion en el grafo de historia.
    // Para elecciones, el handler ya seteo currentNodeId con el next de la opcion elegida.
    if (event.type !== 'eleccion' && event.next) {
      state.run.currentNodeId = event.next;
    }
  }
  state.run.stage++;
}

// Determina que pasa al ganar: protagonista cae, aliados caen, victoria limpia
// Retorna: { result: 'protagonist_fallen' | 'allies_fallen' | 'clean_victory', fallen: [] }
export function resolveVictory() {
  const fallen = [];
  state.combat.teams.A.members.forEach((m, i) => {
    if (m && m.currentHp <= 0) fallen.push(i);
  });

  const protagonistSlot = state.session.protagonistSlot;

  if (fallen.includes(protagonistSlot)) {
    const protagonistName = characters[state.session.selectedStory.protagonist ?? 0].name;
    return { result: 'protagonist_fallen', fallen, protagonistName };
  }

  if (fallen.length > 0) {
    const names = fallen.map(i => characters[state.session.playerTeam[i]].name);
    return { result: 'allies_fallen', fallen, names };
  }

  return { result: 'clean_victory', fallen: [] };
}
