function createMember(charData) {
  return {
    ...charData,
    currentHp: charData.hp,
    defense: 0,
    stunned: false,
    wounded: false,
    buffs: []
  };
}

const state = {
  teams: {
    A: { members: [] },
    B: { members: [] }
  },
  currentTeam: 'A',
  actingMemberIndex: 0,
  turnPhase: 'idle',
  selectedSkill: null,
  pendingActions: [],
  gameOver: false,
  turnActive: false
};

export function initState(teamAData, teamBData) {
  state.teams.A.members = teamAData.map(createMember);
  state.teams.B.members = teamBData.map(createMember);
  while (state.teams.A.members.length < 4) state.teams.A.members.push(null);
  while (state.teams.B.members.length < 4) state.teams.B.members.push(null);
  state.currentTeam = 'A';
  state.actingMemberIndex = 0;
  state.turnPhase = 'idle';
  state.selectedSkill = null;
  state.pendingActions = [];
  state.gameOver = false;
  state.turnActive = false;
}

export function isDead(teamKey, index) {
  const m = state.teams[teamKey].members[index];
  return !m || m.currentHp <= 0;
}

export function isAlive(teamKey, index) {
  return !isDead(teamKey, index);
}

export function aliveMembers(teamKey) {
  return state.teams[teamKey].members
    .map((m, i) => ({ member: m, index: i }))
    .filter(({ member }) => member && member.currentHp > 0);
}

export function allDead(teamKey) {
  return state.teams[teamKey].members.every(m => !m || m.currentHp <= 0);
}

export default state;
