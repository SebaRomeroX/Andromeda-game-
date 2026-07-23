const state = {
  player: null,
  enemy: null,
  playerDefense: 0,
  enemyDefense: 0,
  enemyChoice: null,
  playerTurnSkills: [],
  playerStunned: false,
  enemyStunned: false,
  playerWounded: false,
  enemyWounded: false,
  playerBuffs: [],
  enemyBuffs: [],
  gameOver: false,
  turnActive: false
};

export function initState(playerData, enemyData) {
  state.player = { ...playerData, currentHp: playerData.hp };
  state.enemy = { ...enemyData, currentHp: enemyData.hp };
  state.playerDefense = 0;
  state.enemyDefense = 0;
  state.enemyChoice = null;
  state.playerTurnSkills = [];
  state.playerStunned = false;
  state.enemyStunned = false;
  state.playerWounded = false;
  state.enemyWounded = false;
  state.playerBuffs = [];
  state.enemyBuffs = [];
  state.gameOver = false;
  state.turnActive = false;
}

export default state;
