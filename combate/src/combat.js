import state from './state.js';
import { applyBuff, processBuffs, getMultiplier, getFlatBuffSum, getPrecision, getEvasion } from './buffs.js';
import { renderHP, renderStatus, renderBuffs, renderActions, showRestart } from './renderer.js';
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

function applyEffect(actor, target, skill, isPlayer) {
  const basePrecision = skill.precision ?? 100;
  const precision = getPrecision(isPlayer ? 'player' : 'enemy', basePrecision);
  const hit = Math.random() * 100 < precision;

  if (skill.type === "cura") {
    if (!hit) {
      log(`💚 ${actor.name} intenta ${skill.name}... ¡PERO FALLA!`);
      return;
    }
    const oldHp = actor.currentHp;
    actor.currentHp = Math.min(actor.currentHp + skill.power, actor.hp);
    const healed = actor.currentHp - oldHp;

    let msg = `💚 ${actor.name} usa ${skill.name}: +${healed} HP`;
    if (isPlayer && state.playerWounded) {
      state.playerWounded = false;
      msg += ` y sana su herida`;
    } else if (!isPlayer && state.enemyWounded) {
      state.enemyWounded = false;
      msg += ` y sana su herida`;
    }
    log(msg);
    renderHP();
    renderStatus();
    return;
  }

  if (skill.type === "buff") {
    if (!hit) {
      const prefix = isPlayer ? "💥" : "💢";
      log(`${prefix} ${actor.name} intenta ${skill.name}... ¡PERO FALLA!`);
      return;
    }
    const targetKey = skill.target === 'self'
      ? (isPlayer ? 'player' : 'enemy')
      : (isPlayer ? 'enemy' : 'player');
    applyBuff(targetKey, {
      id: skillNameToId(skill.name),
      name: skill.name,
      stat: skill.stat,
      value: skill.value
    });
    const targetName = targetKey === 'player' ? state.player.name : state.enemy.name;
    const sign = skill.value > 0 ? '+' : '-';
    const emoji = skill.value > 0 ? '🔥' : '💀';
    const verb = skill.value > 0 ? 'aumenta' : 'reduce';
    if (skill.stat === 'defense') {
      log(`${emoji} ${actor.name} usa ${skill.name}: ${verb} ${skill.stat} de ${targetName} en ${sign}${skill.value}`);
    } else if (skill.stat === 'precision') {
      if (skill.value >= 1) {
        log(`${emoji} ${actor.name} usa ${skill.name}: precision de ${targetName} aumentada al 100%`);
      } else {
        log(`${emoji} ${actor.name} usa ${skill.name}: precision de ${targetName} reducida a la mitad`);
      }
    } else if (skill.stat === 'evasion') {
      if (skill.value > 0) {
        log(`${emoji} ${actor.name} usa ${skill.name}: evasión de ${targetName} aumentada en +${skill.value}`);
      } else {
        log(`${emoji} ${actor.name} usa ${skill.name}: evasión de ${targetName} reducida a 0`);
      }
    } else {
      const pct = (Math.abs(skill.value) * 100).toFixed(0);
      log(`${emoji} ${actor.name} usa ${skill.name}: ${verb} ${skill.stat} de ${targetName} en ${sign}${pct}%`);
    }
    renderBuffs();
    renderStatus();
    return;
  }

  if (skill.type === "defense") {
    if (hit) {
      if (isPlayer) {
        state.playerDefense = skill.power;
      } else {
        state.enemyDefense = skill.power;
      }
      log(`🛡️ ${actor.name} usa ${skill.name}: defensa ${skill.power} activada`);
    } else {
      log(`🛡️ ${actor.name} intenta ${skill.name}... ¡PERO FALLA!`);
    }
    return;
  }

  if (!hit) {
    const prefix = isPlayer ? "💥" : "💢";
    log(`${prefix} ${actor.name} usa ${skill.name}... ¡PERO FALLA!`);
    return;
  }

  const targetKey = isPlayer ? 'enemy' : 'player';
  const baseEvasion = target.evasion ?? 0;
  const evasion = getEvasion(targetKey, baseEvasion);
  const targetStunned = isPlayer ? state.enemyStunned : state.playerStunned;
  if (!targetStunned && Math.random() * 100 < evasion) {
    const prefix = isPlayer ? "💥" : "💢";
    log(`${prefix} ${actor.name} usa ${skill.name}... ¡${target.name} esquiva el ataque!`);
    return;
  }

  const defSkill = isPlayer ? state.enemyDefense : state.playerDefense;
  const defBuffs = getFlatBuffSum(isPlayer ? 'enemy' : 'player', 'defense');
  const def = defSkill + defBuffs;
  const atkMult = getMultiplier(isPlayer ? "player" : "enemy", "attack");
  const rawDmg = Math.round(skill.power * atkMult);
  const finalDmg = Math.max(0, rawDmg - def);
  target.currentHp = Math.max(0, target.currentHp - finalDmg);

  const prefix = isPlayer ? "💥" : "💢";
  let defInfo = "";
  if (def > 0) {
    defInfo = ` (defensa rival: ${def}`;
    if (defBuffs > 0) defInfo += ` [buff: +${defBuffs}]`;
    defInfo += `)`;
  }
  const multInfo = atkMult !== 1 ? ` (x${atkMult.toFixed(2)} atq)` : "";
  log(`${prefix} ${actor.name} usa ${skill.name}: ${rawDmg} de ataque${multInfo}${defInfo} → ${finalDmg} de daño`);

  if (skill.stun && finalDmg > 0) {
    if (isPlayer) {
      state.enemyStunned = true;
    } else {
      state.playerStunned = true;
    }
    log(`⚡ ${actor.name} STUNEA a ${target.name}!`);
  }

  if (skill.herida && finalDmg > 0) {
    if (isPlayer) {
      state.enemyWounded = true;
    } else {
      state.playerWounded = true;
    }
    log(`🩸 ${actor.name} HIERE a ${target.name}!`);
  }
}

function playerChoose(index) {
  if (!state.turnActive || state.gameOver) return;

  const skill = state.playerTurnSkills[index];
  state.turnActive = false;
  document.querySelectorAll(".skill-btn").forEach(b => b.disabled = true);

  const skillLabel = skill.type === "attack" ? "atq" : skill.type === "cura" ? "cura" : skill.type === "buff" ? "buff" : "def";
  log(`🗡️ ${state.player.name} usa ${skill.name} (${skillLabel} ${skill.type === "buff" ? skill.value : skill.power})`);

  const enemyWasStunned = state.enemyStunned;

  if (skill.type === "cura") {
    applyEffect(state.player, state.enemy, skill, true);
  }
  if (state.enemyChoice && state.enemyChoice.type === "cura" && !state.enemyStunned) {
    applyEffect(state.enemy, state.player, state.enemyChoice, false);
  }

  if (skill.type === "buff") {
    applyEffect(state.player, state.enemy, skill, true);
  }
  if (state.enemyChoice && state.enemyChoice.type === "buff" && !state.enemyStunned) {
    applyEffect(state.enemy, state.player, state.enemyChoice, false);
  }

  if (skill.type === "defense") {
    applyEffect(state.player, state.enemy, skill, true);
  }
  if (state.enemyChoice && state.enemyChoice.type === "defense" && !state.enemyStunned) {
    applyEffect(state.enemy, state.player, state.enemyChoice, false);
  }

  if (skill.type === "attack") {
    applyEffect(state.player, state.enemy, skill, true);
  }
  if (state.enemyChoice && state.enemyChoice.type === "attack" && !state.enemyStunned) {
    applyEffect(state.enemy, state.player, state.enemyChoice, false);
  }

  if (enemyWasStunned && state.enemyStunned && !skill.stun) {
    state.enemyStunned = false;
  }

  renderHP();
  renderStatus();
  renderBuffs();
  checkGameOver();
}

function checkGameOver() {
  if (state.player.currentHp <= 0) {
    state.gameOver = true;
    log(`☠️ ¡${state.player.name} ha caído! ${state.enemy.name} gana.`);
    showRestart();
    return;
  }
  if (state.enemy.currentHp <= 0) {
    state.gameOver = true;
    log(`🏆 ¡${state.enemy.name} ha caído! ${state.player.name} gana.`);
    showRestart();
    return;
  }
  setTimeout(startTurn, 600);
}

function autoResolveTurn() {
  state.turnActive = false;
  state.enemyChoice = pickWeighted(state.enemy.skills, 1)[0];

  const action = state.enemyChoice.type === "attack" ? "atq" : state.enemyChoice.type === "cura" ? "cura" : state.enemyChoice.type === "buff" ? "buff" : "def";
  const powerLabel = state.enemyChoice.type === "buff" ? state.enemyChoice.value : state.enemyChoice.power;
  log(`💀 ${state.enemy.name} usa ${state.enemyChoice.name} (${action} ${powerLabel})`);

  if (state.enemyChoice.type === "cura") {
    applyEffect(state.enemy, state.player, state.enemyChoice, false);
  }
  if (state.enemyChoice.type === "buff") {
    applyEffect(state.enemy, state.player, state.enemyChoice, false);
  }
  if (state.enemyChoice.type === "defense") {
    applyEffect(state.enemy, state.player, state.enemyChoice, false);
  }
  if (state.enemyChoice.type === "attack") {
    applyEffect(state.enemy, state.player, state.enemyChoice, false);
  }

  state.playerStunned = false;
  renderHP();
  renderStatus();
  renderBuffs();
  checkGameOver();
}

export function startTurn() {
  if (state.gameOver) return;

  state.playerDefense = 0;
  state.enemyDefense = 0;
  state.turnActive = true;

  const expired = processBuffs();
  expired.forEach(e => {
    const name = e.target === 'player' ? state.player.name : state.enemy.name;
    log(`⌛ ${name}: ${e.buffName} terminó`);
  });
  renderBuffs();

  const pWounded = state.playerWounded;
  const eWounded = state.enemyWounded;
  if (pWounded) {
    state.player.currentHp = Math.max(0, state.player.currentHp - 2);
    log(`🩸 ${state.player.name} pierde 2 HP por su herida`);
  }
  if (eWounded) {
    state.enemy.currentHp = Math.max(0, state.enemy.currentHp - 2);
    log(`🩸 ${state.enemy.name} pierde 2 HP por su herida`);
  }
  if (pWounded || eWounded) {
    renderHP();
    renderStatus();
    if (state.player.currentHp <= 0) {
      state.gameOver = true;
      log(`☠️ ¡${state.player.name} ha caído! ${state.enemy.name} gana.`);
      showRestart();
      return;
    }
    if (state.enemy.currentHp <= 0) {
      state.gameOver = true;
      log(`🏆 ¡${state.enemy.name} ha caído! ${state.player.name} gana.`);
      showRestart();
      return;
    }
  }

  if (state.playerStunned) {
    log(`💫 ${state.player.name} está aturdido y pierde el turno!`);
    renderStatus();
    setTimeout(autoResolveTurn, 800);
    return;
  }

  if (state.enemyStunned) {
    state.enemyChoice = null;
    log(`💫 ${state.enemy.name} está aturdido y pierde el turno!`);
    state.playerTurnSkills = pickWeighted(state.player.skills, 3);
    renderStatus();
    renderActions(state.playerTurnSkills, (i) => playerChoose(i));
    return;
  }

  state.playerTurnSkills = pickWeighted(state.player.skills, 3);
  state.enemyChoice = pickWeighted(state.enemy.skills, 1)[0];
  const action = state.enemyChoice.type === "attack" ? "atq" : state.enemyChoice.type === "cura" ? "cura" : state.enemyChoice.type === "buff" ? "buff" : "def";
  const powerLabel = state.enemyChoice.type === "buff" ? state.enemyChoice.value : state.enemyChoice.power;
  log(`⚔️ ${state.enemy.name} se prepara para usar ${state.enemyChoice.name} (${action} ${powerLabel})`);
  renderStatus();
  renderActions(state.playerTurnSkills, (i) => playerChoose(i));
}
