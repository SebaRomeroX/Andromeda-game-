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
  } else if (type === 'enfrentamiento') {
    state.run.enfrentamientos++;
    state.run.fightsSinceCamp++;
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
