import state, { isDead, isAlive, aliveMembers, allDead } from './state.js';
import { applyBuff, processBuffs, getMultiplier, getFlatBuffSum, getPrecision, getEvasion } from './buffs.js';
import { renderHP, renderStatus, renderBuffs, renderActions, renderTargets, clearTargets, renderTeams, renderCurrentActor, showRestart } from './renderer.js';
import { log } from './log.js';

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

function applyEffect(actorTeam, actorIndex, targetTeam, targetIndex, skill) {
  const actor = state.teams[actorTeam].members[actorIndex];
  const target = state.teams[targetTeam].members[targetIndex];
  if (!actor || !target) return;

  const basePrecision = skill.precision ?? 100;
  const precision = getPrecision(actorTeam, actorIndex, basePrecision);
  const hit = Math.random() * 100 < precision;

  if (skill.type === "cura") {
    if (!hit) {
      log(`💚 ${actor.name} intenta ${skill.name}... ¡PERO FALLA!`);
      return;
    }
    const oldHp = target.currentHp;
    target.currentHp = Math.min(target.currentHp + skill.power, target.hp);
    const healed = target.currentHp - oldHp;
    let msg = `💚 ${actor.name} usa ${skill.name} en ${target.name}: +${healed} HP`;
    if (target.wounded) {
      target.wounded = false;
      msg += ` y sana su herida`;
    }
    log(msg);
    renderHP();
    renderStatus();
    return;
  }

  if (skill.type === "buff") {
    if (!hit) {
      log(`💥 ${actor.name} intenta ${skill.name}... ¡PERO FALLA!`);
      return;
    }
    applyBuff(targetTeam, targetIndex, {
      id: skillNameToId(skill.name),
      name: skill.name,
      stat: skill.stat,
      value: skill.value
    });
    const sign = skill.value > 0 ? '+' : '-';
    const emoji = skill.value > 0 ? '🔥' : '💀';
    const verb = skill.value > 0 ? 'aumenta' : 'reduce';
    if (skill.stat === 'defense') {
      log(`${emoji} ${actor.name} usa ${skill.name} en ${target.name}: ${verb} defensa en ${sign}${skill.value}`);
    } else if (skill.stat === 'precision') {
      if (skill.value >= 1) {
        log(`${emoji} ${actor.name} usa ${skill.name} en ${target.name}: precision aumentada al 100%`);
      } else {
        log(`${emoji} ${actor.name} usa ${skill.name} en ${target.name}: precision reducida a la mitad`);
      }
    } else if (skill.stat === 'evasion') {
      if (skill.value > 0) {
        log(`${emoji} ${actor.name} usa ${skill.name} en ${target.name}: evasión aumentada en +${skill.value}`);
      } else {
        log(`${emoji} ${actor.name} usa ${skill.name} en ${target.name}: evasión reducida a 0`);
      }
    } else {
      const pct = (Math.abs(skill.value) * 100).toFixed(0);
      log(`${emoji} ${actor.name} usa ${skill.name} en ${target.name}: ${verb} ${skill.stat} en ${sign}${pct}%`);
    }
    renderBuffs();
    renderStatus();
    return;
  }

  if (skill.type === "defense") {
    if (hit) {
      actor.defense = skill.power;
      log(`🛡️ ${actor.name} usa ${skill.name}: defensa ${skill.power} activada`);
    } else {
      log(`🛡️ ${actor.name} intenta ${skill.name}... ¡PERO FALLA!`);
    }
    return;
  }

  if (!hit) {
    log(`💥 ${actor.name} usa ${skill.name}... ¡PERO FALLA!`);
    return;
  }

  const baseEvasion = target.evasion ?? 0;
  const evasion = getEvasion(targetTeam, targetIndex, baseEvasion);
  if (!target.stunned && Math.random() * 100 < evasion) {
    log(`💥 ${actor.name} usa ${skill.name}... ¡${target.name} esquiva el ataque!`);
    return;
  }

  const defSkill = target.defense;
  const defBuffs = getFlatBuffSum(targetTeam, targetIndex, 'defense');
  const def = defSkill + defBuffs;
  const atkMult = getMultiplier(actorTeam, actorIndex, "attack");
  const rawDmg = Math.round(skill.power * atkMult);
  const finalDmg = Math.max(0, rawDmg - def);
  target.currentHp = Math.max(0, target.currentHp - finalDmg);

  let defInfo = "";
  if (def > 0) {
    defInfo = ` (defensa rival: ${def}`;
    if (defBuffs > 0) defInfo += ` [buff: +${defBuffs}]`;
    defInfo += `)`;
  }
  const multInfo = atkMult !== 1 ? ` (x${atkMult.toFixed(2)} atq)` : "";
  log(`💥 ${actor.name} usa ${skill.name} en ${target.name}: ${rawDmg} de ataque${multInfo}${defInfo} → ${finalDmg} de daño`);

  if (skill.stun && finalDmg > 0) {
    target.stunned = true;
    log(`⚡ ${actor.name} STUNEA a ${target.name}!`);
  }

  if (skill.herida && finalDmg > 0) {
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
  if (state.gameOver) return;

  state.pendingActions = [];
  state.turnPhase = 'enemy_select';
  log(`=== Equipo B elige sus skills ===`);

  for (let i = 0; i < state.teams.B.members.length; i++) {
    const member = state.teams.B.members[i];
    if (!member || member.currentHp <= 0) continue;
    if (state.gameOver) return;

    if (member.stunned) {
      log(`💫 ${member.name} está aturdido y pierde su turno!`);
      member.stunned = false;
      renderStatus();
      continue;
    }

    const skill = pickWeighted(member.skills, 1)[0];
    if (!skill) continue;

    let targetTeam, targetIdx;
    switch (skill.type) {
      case 'attack':
        targetTeam = 'A';
        targetIdx = pickRandomTarget('B', 'A');
        break;
      case 'cura':
        targetTeam = 'B';
        targetIdx = pickRandomTarget('B', 'B');
        break;
      case 'buff':
        if (skill.target === 'enemy') {
          targetTeam = 'A';
          targetIdx = pickRandomTarget('B', 'A');
        } else {
          targetTeam = 'B';
          targetIdx = pickRandomTarget('B', 'B');
        }
        break;
      default:
        targetTeam = 'B';
        targetIdx = i;
        break;
    }

    if (targetIdx === null) continue;

    const actionLabel = skill.type === "attack" ? "atq" : skill.type === "cura" ? "cura" : skill.type === "buff" ? "buff" : "def";
    const powerLabel = skill.type === "buff" ? skill.value : skill.power;
    log(`💀 ${member.name} prepara ${skill.name} (${actionLabel} ${powerLabel})`);

    state.pendingActions.push({
      team: 'B',
      actorIndex: i,
      skill,
      targetTeam,
      targetIdx
    });
  }

  setTimeout(() => {
    log(`=== Equipo A elige sus skills ===`);
    state.actingMemberIndex = 0;
    state.selectedSkill = null;
    state.turnPhase = 'idle';
    playerSelectSkills();
  }, 600);
}

function checkGameOver() {
  if (allDead('A')) {
    state.gameOver = true;
    log(`☠️ ¡El EQUIPO A ha sido derrotado! El EQUIPO B gana.`);
    showRestart();
    return true;
  }
  if (allDead('B')) {
    state.gameOver = true;
    log(`🏆 ¡El EQUIPO B ha sido derrotado! El EQUIPO A gana.`);
    showRestart();
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

function resolveTurn() {
  state.turnPhase = 'resolving';
  renderActions([], () => {});
  log(`=== Resolución ===`);

  const priority = ['buff', 'cura', 'defense', 'attack'];
  const teamOrder = { A: 0, B: 1 };

  const sorted = [...state.pendingActions].sort((a, b) => {
    const typeDiff = priority.indexOf(a.skill.type) - priority.indexOf(b.skill.type);
    if (typeDiff !== 0) return typeDiff;
    return teamOrder[a.team] - teamOrder[b.team];
  });

  state.pendingActions = [];

  for (const action of sorted) {
    if (state.gameOver) return;

    const actor = state.teams[action.team].members[action.actorIndex];
    if (!actor || actor.currentHp <= 0) continue;

    const target = state.teams[action.targetTeam].members[action.targetIdx];
    if (!target || target.currentHp <= 0) {
      log(`⚠️ ${actor.name} no puede ejecutar ${action.skill.name}: el objetivo ya no está disponible`);
      continue;
    }

    applyEffect(action.team, action.actorIndex, action.targetTeam, action.targetIdx, action.skill);
    renderHP();
    renderStatus();
    renderBuffs();
    clearTargets();
    if (checkGameOver()) return;
  }

  state.turnPhase = 'idle';
  endRound();
}

function playerSelectSkills() {
  if (state.gameOver) return;

  for (let i = state.actingMemberIndex; i < state.teams.A.members.length; i++) {
    const member = state.teams.A.members[i];
    if (!member || member.currentHp <= 0) continue;

    state.actingMemberIndex = i;

    if (member.stunned) {
      log(`💫 ${member.name} está aturdido y pierde su turno!`);
      member.stunned = false;
      renderStatus();
      continue;
    }

    renderCurrentActor();
    const skills = pickWeighted(member.skills, 3);
    state.turnPhase = 'select_skill';
    renderActions(skills, (skillIdx) => {
      if (state.turnPhase !== 'select_skill') return;
      const skill = skills[skillIdx];
      state.selectedSkill = skill;
      state.turnPhase = 'select_target';

      if (skill.type === 'defense') {
        const actionLabel = "def";
        log(`🛡️ ${member.name} prepara ${skill.name} (${actionLabel} ${skill.power})`);
        state.pendingActions.push({
          team: 'A',
          actorIndex: i,
          skill,
          targetTeam: 'A',
          targetIdx: i
        });
        state.actingMemberIndex = i + 1;
        state.selectedSkill = null;
        state.turnPhase = 'idle';
        clearTargets();
        playerSelectSkills();
        return;
      }

      let validTargets = [];
      if (skill.type === 'attack') {
        validTargets = aliveMembers('B').map(t => ({ team: 'B', index: t.index }));
      } else if (skill.type === 'cura') {
        validTargets = aliveMembers('A').map(t => ({ team: 'A', index: t.index }));
      } else if (skill.type === 'buff') {
        if (skill.target === 'enemy') {
          validTargets = aliveMembers('B').map(t => ({ team: 'B', index: t.index }));
        } else {
          validTargets = aliveMembers('A').map(t => ({ team: 'A', index: t.index }));
        }
      }

      renderTargets(validTargets);
    });
    return;
  }

  resolveTurn();
}

export function startTurn() {
  if (state.gameOver) return;

  ['A', 'B'].forEach(teamKey => {
    state.teams[teamKey].members.forEach(m => { if (m) m.defense = 0; });
  });
  state.turnActive = true;

  const expired = processBuffs();
  expired.forEach(e => {
    const name = state.teams[e.teamKey].members[e.memberIndex]?.name ?? '?';
    log(`⌛ ${name}: ${e.buffName} terminó`);
  });
  renderBuffs();

  ['A', 'B'].forEach(teamKey => {
    state.teams[teamKey].members.forEach(m => {
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
  if (state.turnPhase !== 'select_target' || !state.selectedSkill) return;

  const skill = state.selectedSkill;

  if (skill.type === 'attack' && team !== 'B') return;
  if (skill.type === 'cura' && team !== 'A') return;
  if (skill.type === 'buff' && skill.target === 'enemy' && team !== 'B') return;
  if (skill.type === 'buff' && skill.target !== 'enemy' && team !== 'A') return;

  const target = state.teams[team].members[index];
  if (!target || target.currentHp <= 0) return;

  const actor = state.teams.A.members[state.actingMemberIndex];
  const skillLabel = skill.type === "attack" ? "atq" : skill.type === "cura" ? "cura" : skill.type === "buff" ? "buff" : "def";
  const powerLabel = skill.type === "buff" ? skill.value : skill.power;
  log(`🗡️ ${actor.name} prepara ${skill.name} (${skillLabel} ${powerLabel}) en ${target.name}`);

  state.pendingActions.push({
    team: 'A',
    actorIndex: state.actingMemberIndex,
    skill,
    targetTeam: team,
    targetIdx: index
  });

  state.actingMemberIndex = state.actingMemberIndex + 1;
  state.selectedSkill = null;
  state.turnPhase = 'idle';
  clearTargets();
  playerSelectSkills();
}
