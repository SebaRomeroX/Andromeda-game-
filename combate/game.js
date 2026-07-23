const state = {
  player: null,
  enemy: null,
  playerDefense: 0,
  enemyDefense: 0,
  enemyChoice: null,
  playerTurnSkills: [],
  playerStunned: false,
  enemyStunned: false,
  playerWounded: false,
  enemyWounded: false,
  playerBuffs: [],
  enemyBuffs: [],
  gameOver: false,
  turnActive: false
};

const $ = id => document.getElementById(id);

function pickWeighted(items, count) {
  const pool = items.map(item => ({ item, weight: item.aparicion ?? 100 }));
  const result = [];
  for (let i = 0; i < Math.min(count, pool.length); i++) {
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

function applyBuff(targetKey, buffDef) {
  const list = targetKey === 'player' ? state.playerBuffs : state.enemyBuffs;

  const existing = list.find(b => b.id === buffDef.id);
  if (existing) {
    existing.turnsLeft = 4;
    return;
  }

  if (buffDef.stat === 'precision' || buffDef.stat === 'evasion') {
    for (let i = list.length - 1; i >= 0; i--) {
      if (list[i].stat === buffDef.stat) {
        list.splice(i, 1);
      }
    }
  }

  list.push({
    id: buffDef.id,
    name: buffDef.name,
    stat: buffDef.stat,
    value: buffDef.value,
    turnsLeft: 4,
    active: false
  });
}

function processBuffs() {
  ['player', 'enemy'].forEach(key => {
    const list = key === 'player' ? state.playerBuffs : state.enemyBuffs;
    for (let i = list.length - 1; i >= 0; i--) {
      const b = list[i];
      b.turnsLeft--;
      b.active = b.turnsLeft > 0;
      if (b.turnsLeft <= 0) {
        const name = key === 'player' ? state.player.name : state.enemy.name;
        log(`⌛ ${name}: ${b.name} terminó`);
        list.splice(i, 1);
      }
    }
  });
}

function getMultiplier(targetKey, stat) {
  const list = targetKey === 'player' ? state.playerBuffs : state.enemyBuffs;
  let sum = 0;
  list.forEach(b => {
    if (b.active && b.stat === stat) sum += b.value;
  });
  return 1 + sum;
}

function getFlatBuffSum(targetKey, stat) {
  const list = targetKey === 'player' ? state.playerBuffs : state.enemyBuffs;
  let sum = 0;
  list.forEach(b => {
    if (b.active && b.stat === stat) sum += b.value;
  });
  return sum;
}

function getPrecision(targetKey, basePrecision) {
  const list = targetKey === 'player' ? state.playerBuffs : state.enemyBuffs;
  const precBuff = list.find(b => b.active && b.stat === 'precision');

  if (!precBuff) return basePrecision;

  if (precBuff.value >= 1) return 100;

  return Math.round(basePrecision * Math.abs(precBuff.value));
}

function getEvasion(targetKey, baseEvasion) {
  const list = targetKey === 'player' ? state.playerBuffs : state.enemyBuffs;
  const evaBuff = list.find(b => b.active && b.stat === 'evasion');

  if (!evaBuff) return baseEvasion;

  if (evaBuff.value === 0) return 0;

  return Math.min(100, baseEvasion + evaBuff.value);
}

function handleImgError(img, name) {
  img.style.display = "none";
  const fallback = document.createElement("div");
  fallback.className = "img-fallback";
  fallback.textContent = name.charAt(0);
  img.parentNode.insertBefore(fallback, img.nextSibling);
}

function initGame() {
  const pData = characters[0];
  const eData = characters[1];

  state.player = { ...pData, currentHp: pData.hp };
  state.enemy = { ...eData, currentHp: eData.hp };
  state.playerDefense = 0;
  state.enemyDefense = 0;
  state.enemyChoice = null;
  state.playerTurnSkills = [];
  state.playerStunned = false;
  state.enemyStunned = false;
  state.playerWounded = false;
  state.enemyWounded = false;
  state.playerBuffs = [];
  state.enemyBuffs = [];
  state.gameOver = false;
  state.turnActive = false;

  renderCharacters();
  renderHP();
  renderStats();
  renderStatus();
  renderBuffs();
  renderActions();
  clearLog();
  log(`¡Combate: ${state.player.name} vs ${state.enemy.name}!`);
  startTurn();
}

function startTurn() {
  if (state.gameOver) return;

  state.playerDefense = 0;
  state.enemyDefense = 0;
  state.turnActive = true;

  processBuffs();
  renderBuffs();

  // Daño por herida al inicio del turno
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
    renderActions();
    return;
  }

  state.playerTurnSkills = pickWeighted(state.player.skills, 3);
  state.enemyChoice = pickWeighted(state.enemy.skills, 1)[0];
  const action = state.enemyChoice.type === "attack" ? "atq" : state.enemyChoice.type === "cura" ? "cura" : state.enemyChoice.type === "buff" ? "buff" : "def";
  const powerLabel = state.enemyChoice.type === "buff" ? state.enemyChoice.value : state.enemyChoice.power;
  log(`⚔️ ${state.enemy.name} se prepara para usar ${state.enemyChoice.name} (${action} ${powerLabel})`);
  renderStatus();
  renderActions();
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

function showRestart() {
  const div = $("restart-area");
  div.innerHTML = `<button id="restart-btn" onclick="initGame()">🔄 Reiniciar Combate</button>`;
}

function renderCharacters() {
  const pImg = $("player-img");
  const eImg = $("enemy-img");
  pImg.onerror = () => handleImgError(pImg, state.player.name);
  eImg.onerror = () => handleImgError(eImg, state.enemy.name);
  pImg.src = state.player.image;
  $("player-name").textContent = state.player.name;
  eImg.src = state.enemy.image;
  $("enemy-name").textContent = state.enemy.name;
}

function renderHP() {
  const pHp = state.player.currentHp;
  const pMax = state.player.hp;
  const eHp = state.enemy.currentHp;
  const eMax = state.enemy.hp;

  $("player-hp-fill").style.width = `${(pHp / pMax) * 100}%`;
  $("player-hp-text").textContent = `HP: ${pHp}/${pMax}`;
  $("enemy-hp-fill").style.width = `${(eHp / eMax) * 100}%`;
  $("enemy-hp-text").textContent = `HP: ${eHp}/${eMax}`;
}

function renderStats() {
  const pEva = getEvasion('player', state.player.evasion ?? 0);
  const eEva = getEvasion('enemy', state.enemy.evasion ?? 0);
  $("player-evasion").textContent = `Evasión: ${pEva}%`;
  $("enemy-evasion").textContent = `Evasión: ${eEva}%`;
}

function renderStatus() {
  function getStatusString(wounded, stunned) {
    let parts = [];
    if (stunned) parts.push("⚡");
    if (wounded) parts.push("🩸");
    return parts.length > 0 ? parts.join(" ") : "✅";
  }
  $("player-status").textContent =
    `Estado: ${getStatusString(state.playerWounded, state.playerStunned)}`;
  $("enemy-status").textContent =
    `Estado: ${getStatusString(state.enemyWounded, state.enemyStunned)}`;
}

function renderBuffs() {
  const emojis = { attack: '⚔️', defense: '🛡️', evasion: '💨', precision: '🎯' };
  ['player', 'enemy'].forEach(key => {
    const list = key === 'player' ? state.playerBuffs : state.enemyBuffs;
    const el = $(`${key}-buffs`);
    const active = list.filter(b => b.active);
    if (active.length === 0) {
      el.textContent = 'Buffs: —';
      return;
    }
    el.innerHTML = 'Buffs: ' + active.map(b => {
      const emoji = emojis[b.stat] || '⚔️';
      const cls = b.value > 0 ? 'buff-positive' : 'buff-negative';
      const sign = b.value > 0 ? '+' : '-';
      if (b.stat === 'defense') {
        return `<span class="${cls}">${emoji}${sign}${b.value} (${b.turnsLeft})</span>`;
      }
      if (b.stat === 'precision') {
        const displayVal = b.value >= 1 ? '100%' : '½';
        return `<span class="${cls}">${emoji}${displayVal} (${b.turnsLeft})</span>`;
      }
      if (b.stat === 'evasion') {
        const displayVal = b.value === 0 ? '0' : `+${b.value}`;
        return `<span class="${cls}">${emoji}${displayVal} (${b.turnsLeft})</span>`;
      }
      const pct = (Math.abs(b.value) * 100).toFixed(0);
      return `<span class="${cls}">${emoji}${sign}${pct}% (${b.turnsLeft})</span>`;
    }).join(' ');
  });
}

function renderActions() {
  const container = $("actions");
  container.innerHTML = "";
  state.playerTurnSkills.forEach((skill, i) => {
    const btn = document.createElement("button");
    btn.className = "skill-btn";
    let effects = "";
    if (skill.stun) effects += " ⚡";
    if (skill.herida) effects += " 🩸";
    let label;
    if (skill.type === "attack") {
      label = `${skill.name} (⚔️ atq ${skill.power} · ${skill.precision}% prec)${effects}`;
    } else if (skill.type === "cura") {
      label = `${skill.name} (💚 cura ${skill.power} · ${skill.precision}% prec)${effects}`;
    } else if (skill.type === "buff") {
      const emoji = skill.value > 0 ? '🔥' : '💀';
      const sign = skill.value > 0 ? '+' : '';
      if (skill.stat === 'defense') {
        label = `${skill.name} (${emoji} ${sign}${skill.value} ${skill.stat} · ${skill.precision}% prec)`;
      } else if (skill.stat === 'precision') {
        const displayVal = skill.value >= 1 ? '100%' : '½';
        label = `${skill.name} (${emoji} ${displayVal} · ${skill.precision}% prec)`;
      } else if (skill.stat === 'evasion') {
        if (skill.value === 0) {
          label = `${skill.name} (${emoji} evasión a 0 · ${skill.precision}% prec)`;
        } else {
          label = `${skill.name} (${emoji} +${skill.value} evasión · ${skill.precision}% prec)`;
        }
      } else {
        const pct = (Math.abs(skill.value) * 100).toFixed(0);
        label = `${skill.name} (${emoji} ${sign}${pct}% ${skill.stat} · ${skill.precision}% prec)`;
      }
    } else {
      label = `${skill.name} (🛡️ def ${skill.power} · ${skill.precision}% prec)${effects}`;
    }
    btn.textContent = label;
    btn.onclick = () => playerChoose(i);
    container.appendChild(btn);
  });
}

function log(msg) {
  const el = $("log");
  const p = document.createElement("p");
  p.textContent = msg;
  el.appendChild(p);
  el.scrollTop = el.scrollHeight;
}

function clearLog() {
  $("log").innerHTML = "";
}
