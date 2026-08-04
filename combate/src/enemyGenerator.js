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
  maxLevelRatio: 1.05
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

function computeTargetSize(playerMemberCount, progress) {
  const overrun = progress >= SCALING.enemyOverrunProgress ? 1 : 0;
  return Math.min(MAX_TEAM, Math.max(1, playerMemberCount + overrun));
}

function computeEnemyLevel(playerAvgLevel, progress) {
  const ratio = SCALING.minLevelRatio + (SCALING.maxLevelRatio - SCALING.minLevelRatio) * progress;
  return Math.max(1, Math.round(playerAvgLevel * ratio));
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

export function generateEnemyTeam({ story, stage, playerMemberCount, playerAvgLevel }) {
  const totalEvents = story.events.length;
  const progress = totalEvents > 0 ? stage / totalEvents : 1;

  const rolePools = buildRolePools(story);
  const candidates = FORMATIONS.filter(f => f.roles.every(r => rolePools[r]?.length > 0));
  const formation = pickFormation(candidates, computeTargetSize(playerMemberCount, progress));
  if (!formation) return [null, null, null, null];

  const level = computeEnemyLevel(playerAvgLevel, progress);
  const team = [null, null, null, null];
  formation.roles.forEach(role => {
    const pool = rolePools[role];
    team[ROLE_SLOT[role]] = { index: pool[Math.floor(Math.random() * pool.length)], level };
  });
  return team;
}