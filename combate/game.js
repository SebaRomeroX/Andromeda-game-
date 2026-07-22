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
  state.gameOver = false;
  state.turnActive = false;

  renderCharacters();
  renderHP();
  renderStats();
  renderStatus();
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
    autoResolveTurn();
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
  const action = state.enemyChoice.type === "attack" ? "atq" : "def";
  log(`⚔️ ${state.enemy.name} se prepara para usar ${state.enemyChoice.name} (${action} ${state.enemyChoice.power})`);
  renderStatus();
  renderActions();
}

function applyEffect(actor, target, skill, isPlayer) {
  const precision = skill.precision ?? 100;
  const hit = Math.random() * 100 < precision;

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

  const evasion = target.evasion ?? 0;
  const targetStunned = isPlayer ? state.enemyStunned : state.playerStunned;
  if (!targetStunned && Math.random() * 100 < evasion) {
    const prefix = isPlayer ? "💥" : "💢";
    log(`${prefix} ${actor.name} usa ${skill.name}... ¡${target.name} esquiva el ataque!`);
    return;
  }

  const def = isPlayer ? state.enemyDefense : state.playerDefense;
  const rawDmg = skill.power;
  const finalDmg = Math.max(0, rawDmg - def);
  target.currentHp = Math.max(0, target.currentHp - finalDmg);

  const prefix = isPlayer ? "💥" : "💢";
  const defInfo = def > 0 ? ` (defensa rival: ${def})` : "";
  log(`${prefix} ${actor.name} usa ${skill.name}: ${rawDmg} de ataque${defInfo} → ${finalDmg} de daño`);

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

  log(`🗡️ ${state.player.name} usa ${skill.name} (${skill.type === "attack" ? "atq " + skill.power : "def " + skill.power})`);

  const enemyWasStunned = state.enemyStunned;

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

  const action = state.enemyChoice.type === "attack" ? "atq" : "def";
  log(`💀 ${state.enemy.name} usa ${state.enemyChoice.name} (${action} ${state.enemyChoice.power})`);

  if (state.enemyChoice.type === "defense") {
    applyEffect(state.enemy, state.player, state.enemyChoice, false);
  }
  if (state.enemyChoice.type === "attack") {
    applyEffect(state.enemy, state.player, state.enemyChoice, false);
  }

  state.playerStunned = false;
  renderHP();
  renderStatus();
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
  $("player-evasion").textContent = `Evasión: ${state.player.evasion ?? 0}%`;
  $("enemy-evasion").textContent = `Evasión: ${state.enemy.evasion ?? 0}%`;
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

function renderActions() {
  const container = $("actions");
  container.innerHTML = "";
  state.playerTurnSkills.forEach((skill, i) => {
    const btn = document.createElement("button");
    btn.className = "skill-btn";
    let effects = "";
    if (skill.stun) effects += " ⚡";
    if (skill.herida) effects += " 🩸";
    const label = skill.type === "attack"
      ? `${skill.name} (⚔️ atq ${skill.power} · ${skill.precision}% prec)${effects}`
      : `${skill.name} (🛡️ def ${skill.power} · ${skill.precision}% prec)${effects}`;
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
