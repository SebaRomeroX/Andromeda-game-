import state, { initState } from './state.js';
import { startTurn } from './combat.js';
import { renderCharacters, renderHP, renderStats, renderStatus, renderBuffs, renderActions } from './renderer.js';
import { log, clearLog } from './log.js';
import characters from '../data/characters.js';

export function initGame() {
  const pData = characters[2];
  const eData = characters[1];

  initState(pData, eData);

  renderCharacters();
  renderHP();
  renderStats();
  renderStatus();
  renderBuffs();
  renderActions(state.playerTurnSkills, () => {});
  clearLog();
  log(`¡Combate: ${state.player.name} vs ${state.enemy.name}!`);
  startTurn();
}

window.initGame = initGame;
initGame();
