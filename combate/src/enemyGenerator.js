import characters from '../data/characters.js';

const ROLE_SLOT = { tanque: 0, asesino: 1, rango: 2, soporte: 3 };

export const FORMATIONS = [
  { roles: ['tanque'] },
  { roles: ['asesino'] },
  { roles: ['rango'] },
  { roles: ['soporte'] },
  { roles: ['tanque', 'asesino'] },
  { roles: ['tanque', 'rango'] },
  { roles: ['tanque', 'soporte'] },
  { roles: ['asesino', 'rango'] },
  { roles: ['asesino', 'soporte'] },
  { roles: ['rango', 'soporte'] },
  { roles: ['tanque', 'asesino', 'rango'] },
  { roles: ['tanque', 'asesino', 'soporte'] },
  { roles: ['tanque', 'rango', 'soporte'] },
  { roles: ['asesino', 'rango', 'soporte'] },
  { roles: ['tanque', 'asesino', 'rango', 'soporte'] },
];

const SCALING = {
  enemyOverrunProgress: 0.5,
  minLevelRatio: 0.8,
  maxLevelRatio: 1.05,
  infiniteStageBonus: 0.05
};

const MAX_TEAM = 4;

function buildRolePools(story) {
  const pools = {};
  (story.genericEnemies ?? []).forEach(idx => {
    const role = characters[idx]?.role;
    if (role && ROLE_SLOT[role] != null) {
      (pools[role] ??= []).push(idx);
    }
  });
  return pools;
}

function computeTargetSize(playerMemberCount, progress, campamentos, infiniteMode) {
  if (infiniteMode) {
    return Math.min(MAX_TEAM, Math.max(1, 1 + Math.max(0, (campamentos ?? 0) - 1)));
  }
  const overrun = progress >= SCALING.enemyOverrunProgress ? 1 : 0;
  return Math.min(MAX_TEAM, Math.max(1, playerMemberCount + overrun));
}

function computeEnemyLevel(playerAvgLevel, progress, stage, infiniteMode) {
  const ratio = SCALING.minLevelRatio + (SCALING.maxLevelRatio - SCALING.minLevelRatio) * progress;
  let level = Math.max(1, Math.round(playerAvgLevel * ratio));

  if (infiniteMode) {
    const stageBonus = 1 + (stage * SCALING.infiniteStageBonus);
    level = Math.max(1, Math.round(level * stageBonus));
  }

  return level;
}

function pickFormation(candidates, targetSize) {
  let matching = candidates.filter(f => f.roles.length === targetSize);
  if (matching.length === 0) {
    const smaller = candidates.filter(f => f.roles.length <= targetSize);
    const maxLen = smaller.length ? Math.max(...smaller.map(f => f.roles.length)) : 0;
    matching = smaller.filter(f => f.roles.length === maxLen);
  }
  if (matching.length === 0) return null;
  return matching[Math.floor(Math.random() * matching.length)];
}

export function generateEnemyTeam({ story, stage, playerMemberCount, playerAvgLevel, campamentos }) {
  const totalEvents = story.expectedStages ?? (story.events?.length ?? 1);
  const progress = Math.min(1, totalEvents > 0 ? stage / totalEvents : 1);

  const rolePools = buildRolePools(story);
  const candidates = FORMATIONS.filter(f => f.roles.every(r => rolePools[r]?.length > 0));
  const formation = pickFormation(candidates, computeTargetSize(playerMemberCount, progress, campamentos, story.infiniteMode));
  if (!formation) return [null, null, null, null];

  const level = computeEnemyLevel(playerAvgLevel, progress, stage, story.infiniteMode);
  const team = [null, null, null, null];
  formation.roles.forEach(role => {
    const pool = rolePools[role];
    team[ROLE_SLOT[role]] = { index: pool[Math.floor(Math.random() * pool.length)], level };
  });
  return team;
}