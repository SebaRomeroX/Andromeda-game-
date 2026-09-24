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
  needRecruit: true,
  fired: new Set(),
  choices: {},
  currentNodeId: null,
  flags: {},
  recruitOffer: null,
  peakEnemyLevel: 0,
  // Cuatro tipos de orbe: mente (azul), poder (rojo), cuerpo (verde),
  // riqueza (dorado). Solo la mente tiene uso por ahora (campamentos).
  orbes: { mind: 0, power: 0, body: 0, wealth: 0 }
};

// ── Estado de sesion (seleccionado al elegir historia) ──
const sessionState = {
  selectedStory: null,
  playerTeam: null,
  protagonistSlot: 0,
  currentEvent: null,
  // Recompensa de orbes tirada al detectar la victoria; se consume en
  // handleVictory() y se limpia al iniciar cada combate.
  pendingOrbReward: null
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
  runState.needRecruit = true;
  runState.fired.clear();
  runState.choices = {};
  runState.currentNodeId = null;
  runState.flags = {};
  runState.recruitOffer = null;
  runState.peakEnemyLevel = 0;
  runState.orbes = { mind: 0, power: 0, body: 0, wealth: 0 };
}

export function resetSessionState() {
  sessionState.selectedStory = null;
  sessionState.playerTeam = null;
  sessionState.protagonistSlot = 0;
  sessionState.currentEvent = null;
  sessionState.pendingOrbReward = null;
}

// ── Team save helpers ──
let savedTeamHp = null;
let savedLevels = null;
let savedTeamSkills = null;
let savedLearnableSkills = null;
let savedLearnedSkills = null;

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
  savedTeamSkills = combatState.teams.A.members.map(m => m ? m.skills.map(s => ({ level: s.level ?? 1, duration: s.duration })) : null);
}

export function getSavedTeamSkills() {
  return savedTeamSkills;
}

export function saveTeamLearnableSkills() {
  savedLearnableSkills = combatState.teams.A.members.map(m => {
    if (!m) return null;
    return (m.learnableSkills ?? []).map(s => ({ ...s }));
  });
}

export function saveTeamLearnedSkills() {
  savedLearnedSkills = combatState.teams.A.members.map(m => {
    if (!m) return null;
    const baseCount = m._baseSkillCount ?? m.skills.length;
    return m.skills.slice(baseCount).map(s => ({ ...s }));
  });
}

export function getSavedTeamLearnableSkills() {
  return savedLearnableSkills;
}

export function getSavedTeamLearnedSkills() {
  return savedLearnedSkills;
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

export function clearSavedTeamLearnableSkills() {
  savedLearnableSkills = null;
}

export function clearSavedTeamLearnedSkills() {
  savedLearnedSkills = null;
}

export function exportTeamSave() {
  return {
    hp: savedTeamHp,
    levels: savedLevels,
    skills: savedTeamSkills,
    learnableSkills: savedLearnableSkills,
    learnedSkills: savedLearnedSkills
  };
}

export function importTeamSave(data = {}) {
  savedTeamHp = Array.isArray(data.hp) ? data.hp : null;
  savedLevels = Array.isArray(data.levels) ? data.levels : null;
  savedTeamSkills = Array.isArray(data.skills) ? data.skills : null;
  savedLearnableSkills = Array.isArray(data.learnableSkills) ? data.learnableSkills : null;
  savedLearnedSkills = Array.isArray(data.learnedSkills) ? data.learnedSkills : null;
}

export function clearSavedSlot(index) {
  if (savedTeamHp) savedTeamHp[index] = null;
  if (savedLevels) savedLevels[index] = null;
  if (savedTeamSkills) savedTeamSkills[index] = null;
  if (savedLearnableSkills) savedLearnableSkills[index] = null;
  if (savedLearnedSkills) savedLearnedSkills[index] = null;
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

function createMember(charData, initialHp, level, skillLevels, savedLearnable, savedLearned) {
  if (!charData) return null;
  const finalLevel = level ?? charData.level ?? 1;
  const stats = getLevelStats({ ...charData, level: finalLevel });
  const learnableSkills = (savedLearnable ?? charData.learnableSkills ?? []).map(s => ({ ...s }));
  const baseSkills = charData.skills.map((s, i) => {
    const saved = skillLevels?.[i];
    const savedLevel = typeof saved === 'object' ? saved.level : (typeof saved === 'number' ? saved : null);
    const savedDuration = typeof saved === 'object' ? saved.duration : undefined;
    return {
      ...s,
      level: savedLevel ?? (s.level ?? 1),
      ...(savedDuration !== undefined ? { duration: savedDuration } : {})
    };
  });
  const learnedSkills = (savedLearned ?? []).map(s => ({ ...s }));
  return {
    ...charData,
    level: finalLevel,
    hp: stats.hp,
    evasion: stats.evasion,
    currentHp: initialHp != null ? Math.min(initialHp, stats.hp) : stats.hp,
    skills: [...baseSkills, ...learnedSkills],
    _baseSkillCount: baseSkills.length,
    learnableSkills,
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
    const savedLearnable = savedLearnableSkills ? savedLearnableSkills[i] : null;
    const savedLearned = savedLearnedSkills ? savedLearnedSkills[i] : null;
    return createMember(charData, saved, savedLevel, savedSkills, savedLearnable, savedLearned);
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
