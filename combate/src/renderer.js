import state from './state.js';
import { SKILL_TYPES, BUFF_STATS } from './constants.js';
import { formatAction, formatSkillStats, formatBuffHtml } from './formatters.js';

export const $ = id => document.getElementById(id);

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

      const overlay = document.createElement("div");
      overlay.className = "member-flash-overlay";

      slot.append(img, overlay, info);
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

  const overlay = document.createElement("div");
  overlay.className = "member-flash-overlay";

  slot.append(img, overlay, info);

  return slot;
}

function getStatusString(member) {
  let parts = [];
  if (member.stunned) parts.push("⚡");
  if (member.wounded) parts.push("🩸");
  if (member.defense > 0) parts.push(`🛡️${member.defense}`);
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

const DIAMOND_POS = ['cell-front', 'cell-bottom', 'cell-top', 'cell-back'];

export function renderTeams() {
  ['A', 'B'].forEach(teamKey => {
    const container = $(`team-${teamKey}-grid`);
    if (!container) return;
    container.innerHTML = "";
    [0, 1, 2, 3].forEach(i => {
      const cell = renderMemberCell(teamKey, i);
      cell.classList.add(DIAMOND_POS[i]);
      container.appendChild(cell);
    });
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
  ['A', 'B'].forEach(teamKey => {
    state.teams[teamKey].members.forEach((member, i) => {
      const el = $(`buffs-${teamKey}-${i}`);
      if (!el || !member) return;
      const active = member.buffs.filter(b => b.active);
      if (active.length === 0) {
        el.textContent = '';
        return;
      }
      el.innerHTML = active.map(b => formatBuffHtml(b)).join(' ');
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
  document.querySelectorAll('.member-slot.glow-green, .member-slot.glow-red, .member-slot.objective')
    .forEach(el => el.classList.remove('glow-green', 'glow-red', 'objective'));

  const cls = actorTeam === 'A' ? 'glow-green' : 'glow-red';

  const actorSlot = document.querySelector(
    `.member-slot[data-team="${actorTeam}"][data-index="${actorIndex}"]`
  );
  if (actorSlot && !actorSlot.classList.contains('dead')) {
    actorSlot.classList.add(cls);
    actorSlot.classList.add('acting');
  }

  const targetSlot = document.querySelector(
    `.member-slot[data-team="${targetTeam}"][data-index="${targetIndex}"]`
  );
  if (targetSlot && !targetSlot.classList.contains('dead')) {
    targetSlot.classList.add(cls);
    targetSlot.classList.add('objective');
  }
}

function isDebuff(skill) {
  if (skill.type !== SKILL_TYPES.BUFF) return false;
  if (skill.value < 0) return true;
  if (skill.stat === BUFF_STATS.PRECISION && skill.value < 1) return true;
  if (skill.stat === BUFF_STATS.EVASION && skill.value === 0) return true;
  return false;
}

export function flashObjective(targetTeam, targetIndex, skill) {
  const beneficial = skill.type === SKILL_TYPES.DEFENSE || skill.type === SKILL_TYPES.CURA || (skill.type === SKILL_TYPES.BUFF && !isDebuff(skill));
  const cls = beneficial ? 'objective-flash-green' : 'objective-flash-red';

  document.querySelectorAll('.member-slot.objective-flash-green, .member-slot.objective-flash-red')
    .forEach(el => el.classList.remove('objective-flash-green', 'objective-flash-red'));

  const slot = document.querySelector(
    `.member-slot[data-team="${targetTeam}"][data-index="${targetIndex}"]`
  );
  if (!slot) return;

  slot.classList.add(cls);
  setTimeout(() => slot.classList.remove(cls), 900);
}

export function showCombatMessage(team, index, text, variant) {
  const slot = document.querySelector(
    `.member-slot[data-team="${team}"][data-index="${index}"]`
  );
  if (!slot) return;
  const el = document.createElement("div");
  el.className = `combat-message ${variant || ""}`.trim();
  el.textContent = text;
  slot.appendChild(el);
  setTimeout(() => el.remove(), 700);
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
  skills.forEach((skill, i) => {
    const btn = document.createElement("button");
    btn.className = "skill-btn";

    let effectsLine = "";
    if (skill.stun) effectsLine += "⚡";
    if (skill.herida) effectsLine += " 🩸";

    let html = `<div class="skill-name">${skill.name}</div>`;
    html += `<div class="skill-stats">${formatSkillStats(skill)}</div>`;
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
