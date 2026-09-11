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

function computeTargetSize(playerMemberCount) {
  return Math.min(MAX_TEAM, Math.max(1, playerMemberCount));
}

function computeEnemyLevel(playerAvgLevel, playerMemberCount, enemyMemberCount, peakEnemyLevel) {
  let level = Math.ceil(playerAvgLevel);
  const memberDiff = playerMemberCount - enemyMemberCount;
  level += memberDiff;
  level = Math.max(1, level);
  level = Math.max(peakEnemyLevel ?? 0, level);
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

export function generateEnemyTeam({ story, playerMemberCount, playerAvgLevel, peakEnemyLevel, enemyTeamOverride }) {
  const enemyMemberCount = enemyTeamOverride
    ? enemyTeamOverride.filter(idx => idx >= 0).length
    : computeTargetSize(playerMemberCount);

  const level = computeEnemyLevel(playerAvgLevel, playerMemberCount, enemyMemberCount, peakEnemyLevel);

  if (enemyTeamOverride) {
    const team = [null, null, null, null];
    enemyTeamOverride.forEach((idx, i) => {
      if (idx >= 0) team[i] = { index: idx, level };
    });
    const newPeakEnemyLevel = Math.max(peakEnemyLevel ?? 0, level);
    return { team, newPeakEnemyLevel };
  }

  const rolePools = buildRolePools(story);
  const candidates = FORMATIONS.filter(f => f.roles.every(r => rolePools[r]?.length > 0));
  const formation = pickFormation(candidates, enemyMemberCount);
  if (!formation) return { team: [null, null, null, null], newPeakEnemyLevel: peakEnemyLevel ?? 0 };

  const team = [null, null, null, null];
  formation.roles.forEach(role => {
    const pool = rolePools[role];
    team[ROLE_SLOT[role]] = { index: pool[Math.floor(Math.random() * pool.length)], level };
  });
  const newPeakEnemyLevel = Math.max(peakEnemyLevel ?? 0, level);
  return { team, newPeakEnemyLevel };
}