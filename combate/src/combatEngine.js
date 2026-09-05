import { SKILL_TYPES, TEAMS } from './constants.js';
import { ATTACK_ROUTES, ROLE_BY_INDEX, getSkillScaledStats } from './models.js';
import { actionLabel, powerLabel } from './formatters.js';

export function skillNameToId(name) {
  return name.toLowerCase()
    .replace(/[á]/g, 'a').replace(/[é]/g, 'e').replace(/[í]/g, 'i')
    .replace(/[ó]/g, 'o').replace(/[ú]/g, 'u')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

export function pickWeighted(items, count) {
  const pool = items.map(item => ({ item, weight: item.aparicion ?? 100 }));
  const result = [];
  for (let i = 0; i < count && pool.length > 0; i++) {
    const total = pool.reduce((s, p) => s + p.weight, 0);
    let r = Math.random() * total;
    for (let j = 0; j < pool.length; j++) {
      r -= pool[j].weight;
      if (r <= 0) {
        result.push(pool[j].item);
        pool.splice(j, 1);
        break;
      }
    }
  }
  return result;
}

export function computeEffect(actor, target, skill, { precision, evasion, atkMult, defBuffs, hasDefDebuff }) {
  if (!actor || !target) return null;

  const basePrecision = skill.precision ?? 100;
  const hit = Math.random() * 100 < (precision ?? basePrecision);
  const scaled = getSkillScaledStats(skill);

  if (skill.type === SKILL_TYPES.CURA) {
    if (!hit) return { type: "miss" };
    return {
      type: SKILL_TYPES.CURA,
      heal: Math.min(target.currentHp + scaled.power, target.hp) - target.currentHp
    };
  }

  if (skill.type === SKILL_TYPES.BUFF) {
    if (!hit) return { type: "miss" };
    return { type: SKILL_TYPES.BUFF };
  }

  if (skill.type === SKILL_TYPES.DEFENSE) {
    if (!hit) return { type: "miss" };
    return { type: SKILL_TYPES.DEFENSE, power: scaled.power };
  }

  if (!hit) return { type: "miss" };

  const baseEvasion = target.evasion ?? 0;
  const effectiveEvasion = evasion ?? baseEvasion;
  if (!target.stunned && Math.random() * 100 < effectiveEvasion) {
    return { type: "evade" };
  }

  const defSkill = target.defense;
  const defBuffsVal = defBuffs ?? 0;
  const def = hasDefDebuff ? Math.round((defSkill + defBuffsVal) / 2) : defSkill + defBuffsVal;
  const rawDmg = Math.round(scaled.power * (atkMult ?? 1));
  const finalDmg = Math.max(0, rawDmg - def);

  return {
    type: SKILL_TYPES.ATTACK,
    rawDmg,
    finalDmg,
    def,
    defBuffs: defBuffs ?? 0,
    atkMult: atkMult ?? 1,
    stun: skill.stun && finalDmg > 0,
    wound: skill.herida && finalDmg > 0
  };
}

export function getAttackTargets(actorIndex, targetTeam, aliveIndices) {
  const role = ROLE_BY_INDEX[actorIndex];
  const routes = ATTACK_ROUTES[role];

  if (routes === 'free') {
    return aliveIndices.map(i => ({ team: targetTeam, index: i }));
  }

  const targets = [];
  const seen = new Set();

  for (const route of routes) {
    for (const pos of route) {
      if (aliveIndices.includes(pos)) {
        if (!seen.has(pos)) {
          seen.add(pos);
          targets.push({ team: targetTeam, index: pos });
        }
        break;
      }
    }
  }

  return targets;
}

export function computeTargets(skill, actorIndex, aliveA, aliveB) {
  if (skill.type === SKILL_TYPES.ATTACK) {
    return getAttackTargets(actorIndex, TEAMS.B, aliveB.map(t => t.index));
  }
  if (skill.type === SKILL_TYPES.CURA) {
    return aliveA.map(t => ({ team: TEAMS.A, index: t.index }));
  }
  if (skill.type === SKILL_TYPES.BUFF) {
    if (skill.target === 'self') {
      return [{ team: TEAMS.A, index: actorIndex }];
    }
    if (skill.target === 'enemy') {
      return getAttackTargets(actorIndex, TEAMS.B, aliveB.map(t => t.index));
    }
    return aliveA.map(t => ({ team: TEAMS.A, index: t.index }));
  }
  if (skill.type === SKILL_TYPES.DEFENSE) {
    return [{ team: TEAMS.A, index: actorIndex }];
  }
  return [];
}

export function sortActions(pendingActions) {
  const priority = [SKILL_TYPES.BUFF, SKILL_TYPES.CURA, SKILL_TYPES.DEFENSE, SKILL_TYPES.ATTACK];
  const teamOrder = { [TEAMS.A]: 0, [TEAMS.B]: 1 };

  return [...pendingActions].sort((a, b) => {
    const typeDiff = priority.indexOf(a.skill.type) - priority.indexOf(b.skill.type);
    if (typeDiff !== 0) return typeDiff;
    return teamOrder[a.team] - teamOrder[b.team];
  });
}

export function planEnemyActions(members, aliveA, aliveB) {
  const actions = [];

  for (let i = 0; i < members.length; i++) {
    const member = members[i];
    if (!member || member.currentHp <= 0) continue;
    if (member.stunned) continue;

    const skill = pickWeighted(member.skills, 1)[0];
    if (!skill) continue;

    let targetTeam, targetIdx;
    switch (skill.type) {
      case SKILL_TYPES.ATTACK: {
        targetTeam = TEAMS.A;
        const atkTargets = getAttackTargets(i, TEAMS.A, aliveA.map(t => t.index));
        if (atkTargets.length === 0) continue;
        targetIdx = atkTargets[Math.floor(Math.random() * atkTargets.length)].index;
        break;
      }
      case SKILL_TYPES.CURA: {
        targetTeam = TEAMS.B;
        if (aliveB.length === 0) continue;
        targetIdx = aliveB[Math.floor(Math.random() * aliveB.length)].index;
        break;
      }
      case SKILL_TYPES.BUFF: {
        if (skill.scope === 'all') {
          let targets;
          if (skill.target === 'self') {
            targets = [{ team: TEAMS.B, index: i }];
          } else if (skill.target === 'enemy') {
            targets = getAttackTargets(i, TEAMS.A, aliveA.map(t => t.index));
          } else {
            targets = aliveB.map(t => ({ team: TEAMS.B, index: t.index }));
          }
          if (targets.length === 0) continue;
          targets.forEach(t => {
            actions.push({
              actorIndex: i,
              skill,
              targetTeam: t.team,
              targetIdx: t.index,
              label: `${member.name} prepara ${skill.name} (${actionLabel(skill.type)} ${powerLabel(skill)})`
            });
          });
          continue;
        }
        if (skill.target === 'self') {
          targetTeam = TEAMS.B;
          targetIdx = i;
        } else if (skill.target === 'enemy') {
          targetTeam = TEAMS.A;
          const atkTargets = getAttackTargets(i, TEAMS.A, aliveA.map(t => t.index));
          if (atkTargets.length === 0) continue;
          targetIdx = atkTargets[Math.floor(Math.random() * atkTargets.length)].index;
        } else {
          targetTeam = TEAMS.B;
          if (aliveB.length === 0) continue;
          targetIdx = aliveB[Math.floor(Math.random() * aliveB.length)].index;
        }
        break;
      }
      default: {
        targetTeam = TEAMS.B;
        targetIdx = i;
        break;
      }
    }

    if (targetIdx === null || targetIdx === undefined) continue;

    actions.push({
      actorIndex: i,
      skill,
      targetTeam,
      targetIdx,
      label: `${member.name} prepara ${skill.name} (${actionLabel(skill.type)} ${powerLabel(skill)})`
    });
  }

  return actions;
}
