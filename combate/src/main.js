import state, { initState } from './state.js';
import { startTurn, onTargetClick } from './combat.js';
import { renderTeams, renderHP, renderStatus, renderBuffs, renderActions, clearTargets, renderTeamsHeader } from './renderer.js';
import { log, clearLog } from './log.js';
import characters from '../data/characters.js';

document.getElementById('combat-area').addEventListener('click', (e) => {
  const slot = e.target.closest('.member-slot.targetable');
  if (slot) {
    onTargetClick(slot.dataset.team, parseInt(slot.dataset.index));
  }
});

export function initGame() {
  const teamA = [characters[2], characters[0], null, characters[1]];
  const teamB = [characters[4], characters[5], characters[6], characters[3]];

  initState(teamA, teamB);

  renderTeamsHeader();
  renderTeams();
  renderHP();
  renderStatus();
  renderBuffs();
  clearTargets();
  renderActions([], () => {});
  clearLog();

  const aNames = teamA.filter(Boolean).map(c => c.name).join(', ');
  const bNames = teamB.filter(Boolean).map(c => c.name).join(', ');
  log(`⚔️ ¡Combate: EQUIPO A (${aNames}) vs EQUIPO B (${bNames})!`);

  startTurn();
}

window.initGame = initGame;
initGame();
