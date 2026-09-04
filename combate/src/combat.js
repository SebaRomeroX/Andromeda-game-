import state, { aliveMembers, allDead, getGameEndCallback } from './state.js';
import { SKILL_TYPES, TEAMS, TURN_PHASES, BUFF_STATS } from './constants.js';
import { applyBuff, processBuffs, getMultiplier, getFlatBuffSum, getPrecision, getEvasion } from './buffs.js';
import { renderHP, renderStatus, renderBuffs, renderActions, renderTargets, clearTargets, renderTeams, renderCurrentActor, renderActionIndicators, flashObjective, highlightSkill, clearSkillHighlight, showRestart, renderPendingActions, clearMemberAction, showCombatMessage } from './renderer.js';
import { log } from './log.js';
import { actionLabel, powerLabel } from './formatters.js';
import { pickWeighted, computeEffect, computeTargets, sortActions, planEnemyActions, skillNameToId } from './combatEngine.js';
import { playSound, stopMusic } from './music.js';

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

function enemySelectSkills() {
  if (state.combat.gameOver) return;

  state.combat.pendingActions = [];
  state.combat.turnPhase = TURN_PHASES.ENEMY_SELECT;
  log(`=== Equipo B elige sus skills ===`);

  const aliveA = aliveMembers(TEAMS.A);
  const aliveB = aliveMembers(TEAMS.B);

  const planned = planEnemyActions(state.combat.teams.B.members, aliveA, aliveB);

  for (let i = 0; i < state.combat.teams.B.members.length; i++) {
    const member = state.combat.teams.B.members[i];
    if (!member || member.currentHp <= 0) continue;
    if (state.combat.gameOver) return;

    if (member.stunned) {
      log(`💫 ${member.name} está aturdido y pierde su turno!`);
      continue;
    }

    const action = planned.find(a => a.actorIndex === i);
    if (!action) continue;

    log(`💀 ${action.label}`);

    state.combat.pendingActions.push({
      team: TEAMS.B,
      actorIndex: i,
      skill: action.skill,
      targetTeam: action.targetTeam,
      targetIdx: action.targetIdx
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
    stopMusic();
    setTimeout(() => playSound('defeat'), 300);
    showRestart(false, getGameEndCallback());
    return true;
  }
  if (allDead(TEAMS.B)) {
    state.combat.gameOver = true;
    log(`🏆 ¡El EQUIPO B ha sido derrotado! El EQUIPO A gana.`);
    stopMusic();
    setTimeout(() => playSound('achievement'), 300);
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

  const basePrecision = action.skill.precision ?? 100;
  const precision = getPrecision(action.team, action.actorIndex, basePrecision);
  const baseEvasion = target.evasion ?? 0;
  const evasion = getEvasion(action.targetTeam, action.targetIdx, baseEvasion);
  const atkMult = getMultiplier(action.team, action.actorIndex, BUFF_STATS.ATTACK);
  const defBuffs = getFlatBuffSum(action.targetTeam, action.targetIdx, BUFF_STATS.DEFENSE);

  const outcome = computeEffect(actor, target, action.skill, { precision, evasion, atkMult, defBuffs });

  if (outcome.type === "miss" || outcome.type === "evade") {
    if (outcome.type === "miss") {
      const typeEmojis = { [SKILL_TYPES.CURA]: '💚', [SKILL_TYPES.BUFF]: '💥', [SKILL_TYPES.DEFENSE]: '🛡️' };
      const emoji = typeEmojis[action.skill.type] ?? '💥';
      log(`${emoji} ${actor.name} usa ${action.skill.name}... ¡PERO FALLA!`);
    } else {
      log(`💥 ${actor.name} usa ${action.skill.name}... ¡${target.name} esquiva el ataque!`);
    }
    const msg = outcome.type === "miss" ? "¡Falla!" : "¡Esquiva!";
    const variant = outcome.type === "miss" ? "combat-msg-miss" : "combat-msg-evade";
    setTimeout(() => {
      showCombatMessage(action.targetTeam, action.targetIdx, msg, variant);
      playSound(outcome.type === "miss" ? 'error' : 'swoosh');
    }, 1500);
    setTimeout(() => resolveAction(index + 1, sorted), 2200);
    return;
  }

  const blocked = outcome.type === "attack" && outcome.finalDmg === 0;
  if (!blocked) {
    setTimeout(() => flashObjective(action.targetTeam, action.targetIdx, action.skill), 1500);
  } else {
    setTimeout(() => {
      showCombatMessage(action.targetTeam, action.targetIdx, "¡Defiende!", "combat-msg-defend");
      playSound('slam');
    }, 1500);
  }
  setTimeout(() => {
    const hpBefore = target.currentHp;
    applyEffect(action.team, action.actorIndex, action.targetTeam, action.targetIdx, action.skill, outcome);
    renderHP();
    renderStatus();
    renderBuffs();

    if (outcome.type === SKILL_TYPES.ATTACK && !blocked) {
      playSound('punch');
    } else if (outcome.type === SKILL_TYPES.CURA || outcome.type === SKILL_TYPES.BUFF) {
      playSound('spell');
    } else if (outcome.type === SKILL_TYPES.DEFENSE) {
      playSound('metal');
    }

    if (hpBefore > 0 && target.currentHp <= 0) {
      playSound('pain');
    }

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

  const sorted = sortActions(state.combat.pendingActions);
  state.combat.pendingActions = [];

  setTimeout(() => resolveAction(0, sorted), 400);
}

function playerSelectSkills() {
  if (state.combat.gameOver) return;

  const aliveA = aliveMembers(TEAMS.A);
  const aliveB = aliveMembers(TEAMS.B);

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
        renderTargets(computeTargets(skill, i, aliveA, aliveB));
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
        renderTargets(computeTargets(skill, i, aliveA, aliveB));
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
