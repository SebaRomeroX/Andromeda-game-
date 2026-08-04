import { ROLE_BY_INDEX, getLevelStats } from './models.js';

let savedTeamHp = null;
let savedLevels = null;
let savedTeamSkills = null;

export function saveTeamState() {
  savedTeamHp = state.teams.A.members.map(m => m ? m.currentHp : null);
}

export function getSavedTeamHp() {
  return savedTeamHp;
}

export function saveTeamLevels() {
  savedLevels = state.teams.A.members.map(m => m ? m.level : null);
}

export function getSavedTeamLevels() {
  return savedLevels;
}

export function saveTeamSkills() {
  savedTeamSkills = state.teams.A.members.map(m => m ? m.skills.map(s => s.level ?? 1) : null);
}

export function getSavedTeamSkills() {
  return savedTeamSkills;
}

export function restoreTeamHp() {
  state.teams.A.members.forEach(m => {
    if (m) m.currentHp = m.hp;
  });
  saveTeamState();
}

export function clearSavedTeamHp() {
  savedTeamHp = null;
}

export function clearSavedTeamLevels() {
  savedLevels = null;
}

export function clearSavedTeamSkills() {
  savedTeamSkills = null;
}

export function clearSavedSlot(index) {
  if (savedTeamHp) savedTeamHp[index] = null;
  if (savedLevels) savedLevels[index] = null;
  if (savedTeamSkills) savedTeamSkills[index] = null;
}

function validateRoles(teamKey, data) {
  data.forEach((char, i) => {
    if (char && char.role !== ROLE_BY_INDEX[i]) {
      throw new Error(
        `${char.name} (${char.role}) no puede ir en la posición ${i + 1} (${ROLE_BY_INDEX[i]}) del equipo ${teamKey}`
      );
    }
  });
}

function createMember(charData, initialHp, level, skillLevels) {
  if (!charData) return null;
  const stats = getLevelStats({ ...charData, level: level ?? 1 });
  return {
    ...charData,
    level: level ?? 1,
    hp: stats.hp,
    evasion: stats.evasion,
    currentHp: initialHp != null ? Math.min(initialHp, stats.hp) : stats.hp,
    skills: charData.skills.map((s, i) => ({
      ...s,
      level: skillLevels ? (skillLevels[i] ?? 1) : (s.level ?? 1)
    })),
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
  validateRoles('A', teamAData);
  validateRoles('B', teamBData);

  state.teams.A.members = teamAData.map((charData, i) => {
    const saved = savedTeamHp ? savedTeamHp[i] : null;
    const savedLevel = savedLevels ? savedLevels[i] : null;
    const savedSkills = savedTeamSkills ? savedTeamSkills[i] : null;
    return createMember(charData, saved, savedLevel, savedSkills);
  });
  state.teams.B.members = teamBData.map(charData => createMember(charData));
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

export function resetTeam() {
  state.teams.A.members = [];
  state.teams.B.members = [];
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

let gameEndCallback = null;
export function setGameEndCallback(cb) { gameEndCallback = cb; }
export function getGameEndCallback() { return gameEndCallback; }

export default state;
