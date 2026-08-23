import { ROLE_BY_INDEX, getLevelStats } from './models.js';
import { TEAMS, TURN_PHASES } from './constants.js';

// ── Estado de combate (se resetea por pelea) ──
const combatState = {
  teams: {
    A: { members: [] },
    B: { members: [] }
  },
  currentTeam: TEAMS.A,
  actingMemberIndex: 0,
  turnPhase: TURN_PHASES.IDLE,
  selectedSkill: null,
  pendingActions: [],
  gameOver: false,
  turnActive: false
};

// ── Estado de run (persiste entre peleas) ──
const runState = {
  stage: 0,
  enfrentamientos: 0,
  campamentos: 0,
  fightsSinceCamp: 0,
  fired: new Set(),
  choices: {}
};

// ── Estado de sesion (seleccionado al elegir historia) ──
const sessionState = {
  selectedStory: null,
  playerTeam: null,
  protagonistSlot: 0,
  currentEvent: null
};

export default { combat: combatState, run: runState, session: sessionState };

// ── Reset functions ──
export function resetCombatState() {
  combatState.teams.A.members = [];
  combatState.teams.B.members = [];
  combatState.currentTeam = TEAMS.A;
  combatState.actingMemberIndex = 0;
  combatState.turnPhase = TURN_PHASES.IDLE;
  combatState.selectedSkill = null;
  combatState.pendingActions = [];
  combatState.gameOver = false;
  combatState.turnActive = false;
}

export function resetRunState() {
  runState.stage = 0;
  runState.enfrentamientos = 0;
  runState.campamentos = 0;
  runState.fightsSinceCamp = 0;
  runState.fired.clear();
  runState.choices = {};
}

export function resetSessionState() {
  sessionState.selectedStory = null;
  sessionState.playerTeam = null;
  sessionState.protagonistSlot = 0;
  sessionState.currentEvent = null;
}

// ── Team save helpers ──
let savedTeamHp = null;
let savedLevels = null;
let savedTeamSkills = null;

export function saveTeamState() {
  savedTeamHp = combatState.teams.A.members.map(m => m ? m.currentHp : null);
}

export function getSavedTeamHp() {
  return savedTeamHp;
}

export function saveTeamLevels() {
  savedLevels = combatState.teams.A.members.map(m => m ? m.level : null);
}

export function getSavedTeamLevels() {
  return savedLevels;
}

export function saveTeamSkills() {
  savedTeamSkills = combatState.teams.A.members.map(m => m ? m.skills.map(s => s.level ?? 1) : null);
}

export function getSavedTeamSkills() {
  return savedTeamSkills;
}

export function restoreTeamHp() {
  combatState.teams.A.members.forEach(m => {
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

export function exportTeamSave() {
  return {
    hp: savedTeamHp,
    levels: savedLevels,
    skills: savedTeamSkills
  };
}

export function importTeamSave(data = {}) {
  savedTeamHp = Array.isArray(data.hp) ? data.hp : null;
  savedLevels = Array.isArray(data.levels) ? data.levels : null;
  savedTeamSkills = Array.isArray(data.skills) ? data.skills : null;
}

export function clearSavedSlot(index) {
  if (savedTeamHp) savedTeamHp[index] = null;
  if (savedLevels) savedLevels[index] = null;
  if (savedTeamSkills) savedTeamSkills[index] = null;
}

// ── Init / helpers ──
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
  const finalLevel = level ?? charData.level ?? 1;
  const stats = getLevelStats({ ...charData, level: finalLevel });
  return {
    ...charData,
    level: finalLevel,
    hp: stats.hp,
    evasion: stats.evasion,
    currentHp: initialHp != null ? Math.min(initialHp, stats.hp) : stats.hp,
    skills: charData.skills.map((s, i) => ({
      ...s,
      level: skillLevels ? (skillLevels[i] ?? 1) : (s.level ?? 1)
    })),
    defense: 0,
    stunned: false,
    stunTurns: 0,
    wounded: false,
    buffs: []
  };
}

export function initState(teamAData, teamBData) {
  validateRoles('A', teamAData);
  validateRoles('B', teamBData);

  combatState.teams.A.members = teamAData.map((charData, i) => {
    const saved = savedTeamHp ? savedTeamHp[i] : null;
    const savedLevel = savedLevels ? savedLevels[i] : null;
    const savedSkills = savedTeamSkills ? savedTeamSkills[i] : null;
    return createMember(charData, saved, savedLevel, savedSkills);
  });
  combatState.teams.B.members = teamBData.map(charData => createMember(charData));
  while (combatState.teams.A.members.length < 4) combatState.teams.A.members.push(null);
  while (combatState.teams.B.members.length < 4) combatState.teams.B.members.push(null);
  combatState.currentTeam = TEAMS.A;
  combatState.actingMemberIndex = 0;
  combatState.turnPhase = TURN_PHASES.IDLE;
  combatState.selectedSkill = null;
  combatState.pendingActions = [];
  combatState.gameOver = false;
  combatState.turnActive = false;
}

export function resetTeam() {
  combatState.teams.A.members = [];
  combatState.teams.B.members = [];
  combatState.actingMemberIndex = 0;
  combatState.turnPhase = TURN_PHASES.IDLE;
  combatState.selectedSkill = null;
  combatState.pendingActions = [];
  combatState.gameOver = false;
  combatState.turnActive = false;
}

export function isDead(teamKey, index) {
  const m = combatState.teams[teamKey].members[index];
  return !m || m.currentHp <= 0;
}

export function isAlive(teamKey, index) {
  return !isDead(teamKey, index);
}

export function aliveMembers(teamKey) {
  return combatState.teams[teamKey].members
    .map((m, i) => ({ member: m, index: i }))
    .filter(({ member }) => member && member.currentHp > 0);
}

export function allDead(teamKey) {
  return combatState.teams[teamKey].members.every(m => !m || m.currentHp <= 0);
}

let gameEndCallback = null;
export function setGameEndCallback(cb) { gameEndCallback = cb; }
export function getGameEndCallback() { return gameEndCallback; }
