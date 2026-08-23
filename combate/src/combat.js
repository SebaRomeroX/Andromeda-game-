import state, { isDead, isAlive, aliveMembers, allDead, getGameEndCallback } from './state.js';
import { ATTACK_ROUTES, ROLE_BY_INDEX, getSkillScaledStats } from './models.js';
import { SKILL_TYPES, TEAMS, TURN_PHASES, BUFF_STATS } from './constants.js';
import { applyBuff, processBuffs, getMultiplier, getFlatBuffSum, getPrecision, getEvasion } from './buffs.js';
import { renderHP, renderStatus, renderBuffs, renderActions, renderTargets, clearTargets, renderTeams, renderCurrentActor, renderActionIndicators, flashObjective, highlightSkill, clearSkillHighlight, showRestart, renderPendingActions, clearMemberAction, showCombatMessage } from './renderer.js';
import { log } from './log.js';
import { actionLabel, powerLabel } from './formatters.js';

function pickWeighted(items, count) {
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

function skillNameToId(name) {
  return name.toLowerCase()
    .replace(/[á]/g, 'a').replace(/[é]/g, 'e').replace(/[í]/g, 'i')
    .replace(/[ó]/g, 'o').replace(/[ú]/g, 'u')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

function computeEffect(actorTeam, actorIndex, targetTeam, targetIndex, skill) {
  const actor = state.combat.teams[actorTeam].members[actorIndex];
  const target = state.combat.teams[targetTeam].members[targetIndex];
  if (!actor || !target) return null;

  const basePrecision = skill.precision ?? 100;
  const precision = getPrecision(actorTeam, actorIndex, basePrecision);
  const hit = Math.random() * 100 < precision;
  const scaled = getSkillScaledStats(skill);

  if (skill.type === SKILL_TYPES.CURA) {
    if (!hit) {
      log(`💚 ${actor.name} intenta ${skill.name}... ¡PERO FALLA!`);
      return { type: "miss" };
    }
    return {
      type: SKILL_TYPES.CURA,
      heal: Math.min(target.currentHp + scaled.power, target.hp) - target.currentHp
    };
  }

  if (skill.type === SKILL_TYPES.BUFF) {
    if (!hit) {
      log(`💥 ${actor.name} intenta ${skill.name}... ¡PERO FALLA!`);
      return { type: "miss" };
    }
    return { type: SKILL_TYPES.BUFF };
  }

  if (skill.type === SKILL_TYPES.DEFENSE) {
    if (!hit) {
      log(`🛡️ ${actor.name} intenta ${skill.name}... ¡PERO FALLA!`);
      return { type: "miss" };
    }
    return { type: SKILL_TYPES.DEFENSE, power: scaled.power };
  }

  if (!hit) {
    log(`💥 ${actor.name} usa ${skill.name}... ¡PERO FALLA!`);
    return { type: "miss" };
  }

  const baseEvasion = target.evasion ?? 0;
  const evasion = getEvasion(targetTeam, targetIndex, baseEvasion);
  if (!target.stunned && Math.random() * 100 < evasion) {
    log(`💥 ${actor.name} usa ${skill.name}... ¡${target.name} esquiva el ataque!`);
    return { type: "evade" };
  }

  const defSkill = target.defense;
  const defBuffs = getFlatBuffSum(targetTeam, targetIndex, BUFF_STATS.DEFENSE);
  const def = defSkill + defBuffs;
  const atkMult = getMultiplier(actorTeam, actorIndex, BUFF_STATS.ATTACK);
  const rawDmg = Math.round(scaled.power * atkMult);
  const finalDmg = Math.max(0, rawDmg - def);

  return {
    type: SKILL_TYPES.ATTACK,
    rawDmg,
    finalDmg,
    def,
    defBuffs,
    atkMult,
    stun: skill.stun && finalDmg > 0,
    wound: skill.herida && finalDmg > 0
  };
}

function applyEffect(actorTeam, actorIndex, targetTeam, targetIndex, skill, outcome) {
  const actor = state.combat.teams[actorTeam].members[actorIndex];
  const target = state.combat.teams[targetTeam].members[targetIndex];
  if (!actor || !target) return;

  if (outcome.type === SKILL_TYPES.CURA) {
    const oldHp = target.currentHp;
    target.currentHp = Math.min(target.currentHp + outcome.heal, target.hp);
    const healed = target.currentHp - oldHp;
    let msg = `💚 ${actor.name} usa ${skill.name} en ${target.name}: +${healed} HP`;
    if (target.wounded) {
      target.wounded = false;
      msg += ` y sana su herida`;
    }
    log(msg);
    return;
  }

  if (outcome.type === SKILL_TYPES.BUFF) {
    applyBuff(targetTeam, targetIndex, {
      id: skillNameToId(skill.name),
      name: skill.name,
      stat: skill.stat,
      value: skill.value
    });
    const sign = skill.value > 0 ? '+' : '-';
    const emoji = skill.value > 0 ? '🔥' : '💀';
    const verb = skill.value > 0 ? 'aumenta' : 'reduce';
    if (skill.stat === BUFF_STATS.DEFENSE) {
      log(`${emoji} ${actor.name} usa ${skill.name} en ${target.name}: ${verb} defensa en ${sign}${skill.value}`);
    } else if (skill.stat === BUFF_STATS.PRECISION) {
      if (skill.value >= 1) {
        log(`${emoji} ${actor.name} usa ${skill.name} en ${target.name}: precision aumentada al 100%`);
      } else {
        log(`${emoji} ${actor.name} usa ${skill.name} en ${target.name}: precision reducida`);
      }
    } else if (skill.stat === BUFF_STATS.EVASION) {
      if (skill.value > 0) {
        log(`${emoji} ${actor.name} usa ${skill.name} en ${target.name}: evasión aumentada en +${skill.value}`);
      } else {
        log(`${emoji} ${actor.name} usa ${skill.name} en ${target.name}: evasión reducida a 0`);
      }
    } else {
      const pct = (Math.abs(skill.value) * 100).toFixed(0);
      log(`${emoji} ${actor.name} usa ${skill.name} en ${target.name}: ${verb} ${skill.stat} en ${sign}${pct}%`);
    }
    return;
  }

  if (outcome.type === SKILL_TYPES.DEFENSE) {
    actor.defense = outcome.power;
    log(`🛡️ ${actor.name} usa ${skill.name}: defensa ${outcome.power} activada`);
    return;
  }

  target.currentHp = Math.max(0, target.currentHp - outcome.finalDmg);

  let defInfo = "";
  if (outcome.def > 0) {
    defInfo = ` (defensa rival: ${outcome.def}`;
    if (outcome.defBuffs > 0) defInfo += ` [buff: +${outcome.defBuffs}]`;
    defInfo += `)`;
  }
  const multInfo = outcome.atkMult !== 1 ? ` (x${outcome.atkMult.toFixed(2)} atq)` : "";
  log(`💥 ${actor.name} usa ${skill.name} en ${target.name}: ${outcome.rawDmg} de ataque${multInfo}${defInfo} → ${outcome.finalDmg} de daño`);

  if (outcome.stun) {
    target.stunned = true;
    target.stunTurns = 2;
    log(`⚡ ${actor.name} STUNEA a ${target.name}!`);
  }

  if (outcome.wound) {
    target.wounded = true;
    log(`🩸 ${actor.name} HIERE a ${target.name}!`);
  }
}

function pickRandomTarget(sourceTeam, targetTeam) {
  const targets = aliveMembers(targetTeam);
  if (targets.length === 0) return null;
  return targets[Math.floor(Math.random() * targets.length)].index;
}

function enemySelectSkills() {
  if (state.combat.gameOver) return;

  state.combat.pendingActions = [];
  state.combat.turnPhase = TURN_PHASES.ENEMY_SELECT;
  log(`=== Equipo B elige sus skills ===`);

  for (let i = 0; i < state.combat.teams.B.members.length; i++) {
    const member = state.combat.teams.B.members[i];
    if (!member || member.currentHp <= 0) continue;
    if (state.combat.gameOver) return;

    if (member.stunned) {
      log(`💫 ${member.name} está aturdido y pierde su turno!`);
      continue;
    }

    const skill = pickWeighted(member.skills, 1)[0];
    if (!skill) continue;

    let targetTeam, targetIdx;
    switch (skill.type) {
      case SKILL_TYPES.ATTACK:
        targetTeam = TEAMS.A;
        const atkTargets = getAttackTargets(i, TEAMS.A);
        if (atkTargets.length === 0) continue;
        targetIdx = atkTargets[Math.floor(Math.random() * atkTargets.length)].index;
        break;
      case SKILL_TYPES.CURA:
        targetTeam = TEAMS.B;
        targetIdx = pickRandomTarget(TEAMS.B, TEAMS.B);
        break;
      case SKILL_TYPES.BUFF:
        if (skill.target === 'enemy') {
          targetTeam = TEAMS.A;
          targetIdx = pickRandomTarget(TEAMS.B, TEAMS.A);
        } else {
          targetTeam = TEAMS.B;
          targetIdx = pickRandomTarget(TEAMS.B, TEAMS.B);
        }
        break;
      default:
        targetTeam = TEAMS.B;
        targetIdx = i;
        break;
    }

    if (targetIdx === null) continue;

    log(`💀 ${member.name} prepara ${skill.name} (${actionLabel(skill.type)} ${powerLabel(skill)})`);

    state.combat.pendingActions.push({
      team: TEAMS.B,
      actorIndex: i,
      skill,
      targetTeam,
      targetIdx
    });
  }

  renderPendingActions();

  setTimeout(() => {
    log(`=== Equipo A elige sus skills ===`);
    state.combat.actingMemberIndex = 0;
    state.combat.selectedSkill = null;
    state.combat.turnPhase = TURN_PHASES.IDLE;
    playerSelectSkills();
  }, 600);
}

function checkGameOver() {
  if (allDead(TEAMS.A)) {
    state.combat.gameOver = true;
    log(`☠️ ¡El EQUIPO A ha sido derrotado! El EQUIPO B gana.`);
    showRestart(false, getGameEndCallback());
    return true;
  }
  if (allDead(TEAMS.B)) {
    state.combat.gameOver = true;
    log(`🏆 ¡El EQUIPO B ha sido derrotado! El EQUIPO A gana.`);
    showRestart(true, getGameEndCallback());
    return true;
  }
  return false;
}

function endRound() {
  renderTeams();
  renderHP();
  renderStatus();
  renderBuffs();
  if (checkGameOver()) return;
  setTimeout(startTurn, 600);
}

function resolveAction(index, sorted) {
  if (state.combat.gameOver || index >= sorted.length) {
    if (index > 0) clearMemberAction(sorted[index - 1].team, sorted[index - 1].actorIndex);
    state.combat.turnPhase = TURN_PHASES.IDLE;
    endRound();
    return;
  }

  if (index > 0) clearMemberAction(sorted[index - 1].team, sorted[index - 1].actorIndex);

  clearTargets();
  document.querySelectorAll('.member-slot.active, .member-slot.glow-green, .member-slot.glow-red, .member-slot.acting, .member-slot.objective, .member-slot.objective-flash-green, .member-slot.objective-flash-red')
    .forEach(el => el.classList.remove('active', 'glow-green', 'glow-red', 'acting', 'objective', 'objective-flash-green', 'objective-flash-red'));

  const action = sorted[index];
  const actor = state.combat.teams[action.team].members[action.actorIndex];
  if (!actor || actor.currentHp <= 0 || actor.stunned) {
    clearMemberAction(action.team, action.actorIndex);
    if (actor?.stunned) {
      log(`💫 ${actor.name} está aturdido y no puede ejecutar ${action.skill.name}!`);
      renderStatus();
    }
    setTimeout(() => resolveAction(index + 1, sorted), 400);
    return;
  }

  const target = state.combat.teams[action.targetTeam].members[action.targetIdx];
  if (!target || target.currentHp <= 0) {
    clearMemberAction(action.team, action.actorIndex);
    log(`⚠️ ${actor.name} no puede ejecutar ${action.skill.name}: el objetivo ya no está disponible`);
    setTimeout(() => resolveAction(index + 1, sorted), 400);
    return;
  }

  renderActionIndicators(action.team, action.actorIndex, action.targetTeam, action.targetIdx);
  const outcome = computeEffect(action.team, action.actorIndex, action.targetTeam, action.targetIdx, action.skill);

  if (outcome.type === "miss" || outcome.type === "evade") {
    const msg = outcome.type === "miss" ? "¡Falla!" : "¡Esquiva!";
    const variant = outcome.type === "miss" ? "combat-msg-miss" : "combat-msg-evade";
    setTimeout(() => showCombatMessage(action.targetTeam, action.targetIdx, msg, variant), 1500);
    setTimeout(() => resolveAction(index + 1, sorted), 2200);
    return;
  }

  const blocked = outcome.type === "attack" && outcome.finalDmg === 0;
  if (!blocked) {
    setTimeout(() => flashObjective(action.targetTeam, action.targetIdx, action.skill), 1500);
  } else {
    setTimeout(() => showCombatMessage(action.targetTeam, action.targetIdx, "¡Defiende!", "combat-msg-defend"), 1500);
  }
  setTimeout(() => {
    applyEffect(action.team, action.actorIndex, action.targetTeam, action.targetIdx, action.skill, outcome);
    renderHP();
    renderStatus();
    renderBuffs();
    if (checkGameOver()) {
      clearMemberAction(action.team, action.actorIndex);
      return;
    }
    setTimeout(() => resolveAction(index + 1, sorted), 500);
  }, 1700);
}

function resolveTurn() {
  state.combat.turnPhase = TURN_PHASES.RESOLVING;
  renderActions([], () => {});
  log(`=== Resolución ===`);

  const priority = [SKILL_TYPES.BUFF, SKILL_TYPES.CURA, SKILL_TYPES.DEFENSE, SKILL_TYPES.ATTACK];
  const teamOrder = { [TEAMS.A]: 0, [TEAMS.B]: 1 };

  const sorted = [...state.combat.pendingActions].sort((a, b) => {
    const typeDiff = priority.indexOf(a.skill.type) - priority.indexOf(b.skill.type);
    if (typeDiff !== 0) return typeDiff;
    return teamOrder[a.team] - teamOrder[b.team];
  });

  state.combat.pendingActions = [];

  setTimeout(() => resolveAction(0, sorted), 400);
}

function getAttackTargets(actorIndex, targetTeam) {
  const role = ROLE_BY_INDEX[actorIndex];
  const routes = ATTACK_ROUTES[role];

  if (routes === 'free') {
    return aliveMembers(targetTeam).map(t => ({ team: targetTeam, index: t.index }));
  }

  const targets = [];
  const seen = new Set();

  for (const route of routes) {
    for (const pos of route) {
      if (isAlive(targetTeam, pos)) {
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

function computeTargets(skill, actorIndex) {
  if (skill.type === SKILL_TYPES.ATTACK) {
    return getAttackTargets(actorIndex, TEAMS.B);
  }
  if (skill.type === SKILL_TYPES.CURA) {
    return aliveMembers(TEAMS.A).map(t => ({ team: TEAMS.A, index: t.index }));
  }
  if (skill.type === SKILL_TYPES.BUFF) {
    if (skill.target === 'enemy') {
      return aliveMembers(TEAMS.B).map(t => ({ team: TEAMS.B, index: t.index }));
    }
    return aliveMembers(TEAMS.A).map(t => ({ team: TEAMS.A, index: t.index }));
  }
  if (skill.type === SKILL_TYPES.DEFENSE) {
    return [{ team: TEAMS.A, index: actorIndex }];
  }
  return [];
}

function playerSelectSkills() {
  if (state.combat.gameOver) return;

  for (let i = state.combat.actingMemberIndex; i < state.combat.teams.A.members.length; i++) {
    const member = state.combat.teams.A.members[i];
    if (!member || member.currentHp <= 0) continue;

    state.combat.actingMemberIndex = i;

    if (member.stunned) {
      log(`💫 ${member.name} está aturdido y pierde su turno!`);
      continue;
    }

    renderCurrentActor();
    const skills = pickWeighted(member.skills, 3);
    state.combat.selectedSkill = null;
    state.combat.turnPhase = TURN_PHASES.SELECT_SKILL;
    clearSkillHighlight();
    renderActions(skills, (skillIdx) => {
      const skill = skills[skillIdx];

      if (state.combat.turnPhase === TURN_PHASES.SELECT_SKILL) {
        state.combat.selectedSkill = skill;
        highlightSkill(skillIdx);
        state.combat.turnPhase = TURN_PHASES.SELECT_TARGET;
        renderTargets(computeTargets(skill, i));
        return;
      }

      if (state.combat.turnPhase === TURN_PHASES.SELECT_TARGET) {
        if (state.combat.selectedSkill === skill) {
          state.combat.selectedSkill = null;
          state.combat.turnPhase = TURN_PHASES.SELECT_SKILL;
          clearSkillHighlight();
          clearTargets();
          return;
        }

        state.combat.selectedSkill = skill;
        highlightSkill(skillIdx);
        renderTargets(computeTargets(skill, i));
        return;
      }
    });
    return;
  }

  resolveTurn();
}

export function startTurn() {
  if (state.combat.gameOver) return;

  [TEAMS.A, TEAMS.B].forEach(teamKey => {
    state.combat.teams[teamKey].members.forEach(m => { if (m) m.defense = 0; });
  });
  state.combat.turnActive = true;

  [TEAMS.A, TEAMS.B].forEach(teamKey => {
    state.combat.teams[teamKey].members.forEach(m => {
      if (!m || !m.stunned) return;
      m.stunTurns = (m.stunTurns ?? 2) - 1;
      if (m.stunTurns <= 0) m.stunned = false;
    });
  });

  const expired = processBuffs();
  expired.forEach(e => {
    const name = state.combat.teams[e.teamKey].members[e.memberIndex]?.name ?? '?';
    log(`⌛ ${name}: ${e.buffName} terminó`);
  });
  renderBuffs();

  [TEAMS.A, TEAMS.B].forEach(teamKey => {
    state.combat.teams[teamKey].members.forEach(m => {
      if (!m || m.currentHp <= 0) return;
      if (m.wounded) {
        m.currentHp = Math.max(0, m.currentHp - 2);
        log(`🩸 ${m.name} pierde 2 HP por su herida`);
      }
    });
  });

  renderHP();
  renderStatus();

  if (checkGameOver()) return;

  renderActions([], () => {});
  enemySelectSkills();
}

export function onTargetClick(team, index) {
  if (state.combat.turnPhase !== TURN_PHASES.SELECT_TARGET || !state.combat.selectedSkill) return;

  const skill = state.combat.selectedSkill;

  if (skill.type === SKILL_TYPES.ATTACK && team !== TEAMS.B) return;
  if (skill.type === SKILL_TYPES.CURA && team !== TEAMS.A) return;
  if (skill.type === SKILL_TYPES.DEFENSE && (team !== TEAMS.A || index !== state.combat.actingMemberIndex)) return;
  if (skill.type === SKILL_TYPES.BUFF && skill.target === 'enemy' && team !== TEAMS.B) return;
  if (skill.type === SKILL_TYPES.BUFF && skill.target !== 'enemy' && team !== TEAMS.A) return;

  const target = state.combat.teams[team].members[index];
  if (!target || target.currentHp <= 0) return;

  const actor = state.combat.teams.A.members[state.combat.actingMemberIndex];
  log(`🗡️ ${actor.name} prepara ${skill.name} (${actionLabel(skill.type)} ${powerLabel(skill)}) en ${target.name}`);

  state.combat.pendingActions.push({
    team: TEAMS.A,
    actorIndex: state.combat.actingMemberIndex,
    skill,
    targetTeam: team,
    targetIdx: index
  });
  renderPendingActions();

  state.combat.actingMemberIndex = state.combat.actingMemberIndex + 1;
  state.combat.selectedSkill = null;
  state.combat.turnPhase = TURN_PHASES.IDLE;
  clearTargets();
  clearSkillHighlight();
  playerSelectSkills();
}
