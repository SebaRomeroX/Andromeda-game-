import state from './state.js';
import { getEvasion } from './buffs.js';

export const $ = id => document.getElementById(id);

export function handleImgError(img, name) {
  img.style.display = "none";
  const fallback = document.createElement("div");
  fallback.className = "img-fallback";
  fallback.textContent = name.charAt(0);
  img.parentNode.insertBefore(fallback, img.nextSibling);
}

export function renderCharacters() {
  const pImg = $("player-img");
  const eImg = $("enemy-img");
  pImg.onerror = () => handleImgError(pImg, state.player.name);
  eImg.onerror = () => handleImgError(eImg, state.enemy.name);
  pImg.src = state.player.image;
  $("player-name").textContent = state.player.name;
  eImg.src = state.enemy.image;
  $("enemy-name").textContent = state.enemy.name;
}

export function renderHP() {
  const pHp = state.player.currentHp;
  const pMax = state.player.hp;
  const eHp = state.enemy.currentHp;
  const eMax = state.enemy.hp;

  $("player-hp-fill").style.width = `${(pHp / pMax) * 100}%`;
  $("player-hp-text").textContent = `HP: ${pHp}/${pMax}`;
  $("enemy-hp-fill").style.width = `${(eHp / eMax) * 100}%`;
  $("enemy-hp-text").textContent = `HP: ${eHp}/${eMax}`;
}

export function renderStats() {
  const pEva = getEvasion('player', state.player.evasion ?? 0);
  const eEva = getEvasion('enemy', state.enemy.evasion ?? 0);
  $("player-evasion").textContent = `Evasión: ${pEva}%`;
  $("enemy-evasion").textContent = `Evasión: ${eEva}%`;
}

export function renderStatus() {
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

export function renderBuffs() {
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

export function renderActions(skills, onChoose) {
  const container = $("actions");
  container.innerHTML = "";
  skills.forEach((skill, i) => {
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
    btn.onclick = () => onChoose(i);
    container.appendChild(btn);
  });
}

export function showRestart() {
  const div = $("restart-area");
  div.innerHTML = `<button id="restart-btn" onclick="initGame()">🔄 Reiniciar Combate</button>`;
}
