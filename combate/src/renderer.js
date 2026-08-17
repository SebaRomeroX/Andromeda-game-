import state from './state.js';
import { getSkillScaledStats } from './models.js';

export const $ = id => document.getElementById(id);

const BUFF_EMOJIS = { attack: '⚔️', defense: '🛡️', evasion: '🏃', precision: '🎯' };

function formatAction(skill) {
  const scaled = getSkillScaledStats(skill);
  if (skill.type === "attack") {
    const icon = skill.stun ? "⚡" : "🗡️";
    return `${icon} (${scaled.power})`;
  }
  if (skill.type === "cura") return `💚 (${scaled.power})`;
  if (skill.type === "defense") return `🛡️ (${scaled.power})`;
  if (skill.type === "buff") {
    const sign = skill.value > 0 ? '+' : '-';
    return `✨ (${BUFF_EMOJIS[skill.stat] ?? '⚔️'}${sign})`;
  }
  return "";
}

export function renderPendingActions() {
  document.querySelectorAll('.member-action').forEach(el => { el.textContent = ""; });
  state.pendingActions.forEach(a => {
    const el = $(`action-${a.team}-${a.actorIndex}`);
    if (el) el.textContent = formatAction(a.skill);
  });
}

export function clearMemberAction(team, index) {
  const el = $(`action-${team}-${index}`);
  if (el) el.textContent = "";
}

export function handleImgError(img, name) {
  img.style.display = "none";
  const fallback = document.createElement("div");
  fallback.className = "img-fallback";
  fallback.textContent = name.charAt(0);
  img.parentNode.insertBefore(fallback, img.nextSibling);
}

function renderMemberSlot(teamKey, index) {
  const slot = document.createElement("div");
  slot.className = "member-slot";
  slot.dataset.team = teamKey;
  slot.dataset.index = index;

  const member = state.teams[teamKey].members[index];

  if (!member || member.currentHp <= 0) {
    if (!member) {
      slot.classList.add("empty");
      slot.innerHTML = `<div class="empty-slot">—</div>`;
    } else {
      const img = document.createElement("img");
      img.src = member.image;
      img.alt = member.name;
      img.onerror = () => handleImgError(img, member.name);

      const nameEl = document.createElement("div");
      nameEl.className = "member-name";
      nameEl.textContent = `${member.name} · Nv${member.level ?? 1}`;

      const hpBar = document.createElement("div");
      hpBar.className = "hp-bar";
      hpBar.innerHTML = `<div class="hp-fill" style="width:0%"></div><span class="hp-text">HP: 0/${member.hp}</span>`;

      const statusEl = document.createElement("div");
      statusEl.className = "member-status";
      statusEl.textContent = "💀";

      const info = document.createElement("div");
      info.className = "member-info";
      info.append(nameEl, hpBar, statusEl);

      slot.append(img, info);
      slot.classList.add("dead");
    }
    return slot;
  }

  const img = document.createElement("img");
  img.src = member.image;
  img.alt = member.name;
  img.onerror = () => handleImgError(img, member.name);

  const nameEl = document.createElement("div");
  nameEl.className = "member-name";
  nameEl.textContent = `${member.name} · Nv${member.level ?? 1}`;

  const hpBar = document.createElement("div");
  hpBar.className = "hp-bar";
  const fill = document.createElement("div");
  fill.className = "hp-fill";
  fill.id = `hp-fill-${teamKey}-${index}`;
  fill.style.width = `${(member.currentHp / member.hp) * 100}%`;
  const text = document.createElement("span");
  text.className = "hp-text";
  text.id = `hp-text-${teamKey}-${index}`;
  text.textContent = `HP: ${member.currentHp}/${member.hp}`;
  hpBar.append(fill, text);

  const statusEl = document.createElement("div");
  statusEl.className = "member-status";
  statusEl.id = `status-${teamKey}-${index}`;
  statusEl.textContent = getStatusString(member);

  const buffsEl = document.createElement("div");
  buffsEl.className = "member-buffs";
  buffsEl.id = `buffs-${teamKey}-${index}`;

  const statusLine = document.createElement("div");
  statusLine.className = "member-status-line";
  statusLine.append(statusEl, buffsEl);

  const info = document.createElement("div");
  info.className = "member-info";
  info.append(nameEl, hpBar, statusLine);

  slot.append(img, info);

  return slot;
}

function getStatusString(member) {
  let parts = [];
  if (member.stunned) parts.push("⚡");
  if (member.wounded) parts.push("🩸");
  return parts.join(" ");
}

function renderMemberCell(teamKey, index) {
  const cell = document.createElement("div");
  cell.className = "member-cell";

  const actionEl = document.createElement("div");
  actionEl.className = "member-action";
  actionEl.id = `action-${teamKey}-${index}`;

  cell.append(actionEl, renderMemberSlot(teamKey, index));
  return cell;
}

export function renderTeams() {
  const mobile = document.documentElement.classList.contains('mobile');
  ['A', 'B'].forEach(teamKey => {
    const container = $(`team-${teamKey}-grid`);
    if (!container) return;
    container.innerHTML = "";
    const order = mobile
      ? (teamKey === 'A' ? [3, 2, 1, 0] : [0, 1, 2, 3])
      : (teamKey === 'A' ? [2, 0, 3, 1] : [0, 2, 1, 3]);
    order.forEach(i => container.appendChild(renderMemberCell(teamKey, i)));
  });
}

export function renderHP() {
  ['A', 'B'].forEach(teamKey => {
    state.teams[teamKey].members.forEach((member, i) => {
      if (!member) return;
      const fill = $(`hp-fill-${teamKey}-${i}`);
      const text = $(`hp-text-${teamKey}-${i}`);
      if (fill) fill.style.width = `${(member.currentHp / member.hp) * 100}%`;
      if (text) text.textContent = `HP: ${member.currentHp}/${member.hp}`;
    });
  });
}

export function renderStatus() {
  ['A', 'B'].forEach(teamKey => {
    state.teams[teamKey].members.forEach((member, i) => {
      const el = $(`status-${teamKey}-${i}`);
      if (!el || !member) return;
      if (member.currentHp <= 0) {
        el.textContent = "💀";
      } else {
        el.textContent = getStatusString(member);
      }
      const slot = el.closest?.('.member-slot');
      if (slot) {
        if (member.currentHp <= 0) {
          slot.classList.add('dead');
        } else {
          slot.classList.remove('dead');
        }
      }
    });
  });
}

export function renderBuffs() {
  const emojis = { attack: '⚔️', defense: '🛡️', evasion: '🏃', precision: '🎯' };
  ['A', 'B'].forEach(teamKey => {
    state.teams[teamKey].members.forEach((member, i) => {
      const el = $(`buffs-${teamKey}-${i}`);
      if (!el || !member) return;
      const active = member.buffs.filter(b => b.active);
      if (active.length === 0) {
        el.textContent = '';
        return;
      }
      el.innerHTML = active.map(b => {
        const emoji = emojis[b.stat] || '⚔️';
        const cls = b.value > 0 ? 'buff-positive' : 'buff-negative';
        const sign = b.value > 0 ? '+' : '-';
        if (b.stat === 'defense') {
          return `<span class="${cls}">${emoji}${sign}${b.value} (${b.turnsLeft})</span>`;
        }
        if (b.stat === 'precision') {
          const displayVal = b.value >= 1 ? '100%' : '↓';
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
  });
}

export function renderTeamsHeader() {
  ['A', 'B'].forEach(teamKey => {
    const label = $(`team-${teamKey}-name`);
    if (label) {
      label.textContent = `EQUIPO ${teamKey}`;
    }
  });
}

export function renderCurrentActor() {
  document.querySelectorAll('.member-slot.active').forEach(el => el.classList.remove('active'));
  const i = state.actingMemberIndex;
  if (state.currentTeam === 'A' && state.teams.A.members[i]) {
    const slot = document.querySelector(`.member-slot[data-team="A"][data-index="${i}"]`);
    if (slot && !slot.classList.contains('dead')) slot.classList.add('active');
  }
}

export function renderTargets(targets) {
  document.querySelectorAll('.member-slot.targetable').forEach(el => el.classList.remove('targetable'));
  targets.forEach(t => {
    const slot = document.querySelector(`.member-slot[data-team="${t.team}"][data-index="${t.index}"]`);
    if (slot) slot.classList.add('targetable');
  });
}

export function clearTargets() {
  document.querySelectorAll('.member-slot.targetable').forEach(el => el.classList.remove('targetable'));
}

export function renderActionIndicators(actorTeam, actorIndex, targetTeam, targetIndex) {
  document.querySelectorAll('.member-slot.glow-green, .member-slot.glow-red')
    .forEach(el => el.classList.remove('glow-green', 'glow-red'));

  const cls = actorTeam === 'A' ? 'glow-green' : 'glow-red';

  const actorSlot = document.querySelector(
    `.member-slot[data-team="${actorTeam}"][data-index="${actorIndex}"]`
  );
  if (actorSlot && !actorSlot.classList.contains('dead')) actorSlot.classList.add(cls);

  const targetSlot = document.querySelector(
    `.member-slot[data-team="${targetTeam}"][data-index="${targetIndex}"]`
  );
  if (targetSlot && !targetSlot.classList.contains('dead')) targetSlot.classList.add(cls);
}

export function highlightSkill(index) {
  document.querySelectorAll('.skill-btn').forEach((btn, i) => {
    btn.classList.toggle('selected', i === index);
  });
}

export function clearSkillHighlight() {
  document.querySelectorAll('.skill-btn.selected').forEach(el => el.classList.remove('selected'));
}

export function renderActions(skills, onChoose) {
  const container = $("actions");
  container.innerHTML = "";
  const emojis = { attack: '⚔️', defense: '🛡️', evasion: '🏃', precision: '🎯' };
  skills.forEach((skill, i) => {
    const btn = document.createElement("button");
    btn.className = "skill-btn";

    let statsLine = "";
    const scaled = getSkillScaledStats(skill);
    if (skill.type === "attack") {
      statsLine = `⚔️ ${scaled.power} · ${scaled.precision}% prec`;
    } else if (skill.type === "cura") {
      statsLine = `💚 ${scaled.power} · ${scaled.precision}% prec`;
    } else if (skill.type === "defense") {
      statsLine = `🛡️ ${scaled.power} · ${scaled.precision}% prec`;
    } else if (skill.type === "buff") {
      const emoji = emojis[skill.stat] || '⚔️';
      const sign = skill.value > 0 ? '+' : '';
      if (skill.stat === 'defense') {
        statsLine = `${emoji} ${sign}${skill.value} · ${scaled.precision}% prec`;
      } else if (skill.stat === 'precision') {
        const displayVal = skill.value >= 1 ? '100%' : '↓';
        statsLine = `${emoji} ${displayVal} · ${scaled.precision}% prec`;
      } else if (skill.stat === 'evasion') {
        const displayVal = skill.value === 0 ? '0' : `${sign}${skill.value}`;
        statsLine = `${emoji} ${displayVal} · ${scaled.precision}% prec`;
      } else {
        const pct = (Math.abs(skill.value) * 100).toFixed(0);
        statsLine = `${emoji} ${sign}${pct}% · ${scaled.precision}% prec`;
      }
    }

    let effectsLine = "";
    if (skill.stun) effectsLine += "⚡";
    if (skill.herida) effectsLine += " 🩸";

    let html = `<div class="skill-name">${skill.name}</div>`;
    html += `<div class="skill-stats">${statsLine}</div>`;
    if (effectsLine) {
      html += `<div class="skill-effects">${effectsLine}</div>`;
    }

    btn.innerHTML = html;
    btn.onclick = () => onChoose(i);
    container.appendChild(btn);
  });
}

export function showRestart(won, onEnd) {
  const div = $("restart-area");
  const text = won ? 'Continuar' : 'Reintentar';
  div.innerHTML = `<button id="restart-btn">${text}</button>`;
  document.getElementById('restart-btn').onclick = () => {
    if (onEnd) onEnd();
  };
}
