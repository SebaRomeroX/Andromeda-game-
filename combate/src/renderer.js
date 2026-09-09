import state from './state.js';
import { SKILL_TYPES, BUFF_STATS } from './constants.js';
import { formatAction, formatSkillStats, formatBuffHtml, describeSkill, skillTypeLabel } from './formatters.js';

export const $ = id => document.getElementById(id);

export function renderPendingActions() {
  document.querySelectorAll('.member-action').forEach(el => { el.textContent = ""; });
  state.combat.pendingActions.forEach(a => {
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

  const member = state.combat.teams[teamKey].members[index];

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
    state.combat.teams[teamKey].members.forEach((member, i) => {
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
    state.combat.teams[teamKey].members.forEach((member, i) => {
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
    state.combat.teams[teamKey].members.forEach((member, i) => {
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
  const i = state.combat.actingMemberIndex;
  if (state.combat.currentTeam === 'A' && state.combat.teams.A.members[i]) {
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

const popupEl = () => document.getElementById('skill-popup');
let hideTimer = null;
let popupVisible = false;
let touchActive = false;

function positionPopup(x, y) {
  const el = popupEl();
  if (!el) return;
  el.classList.remove('hidden');
  const pad = 12;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const rect = el.getBoundingClientRect();
  let left = x + pad;
  let top = y - rect.height - pad;
  if (left + rect.width > vw - pad) left = x - rect.width - pad;
  if (top < pad) top = y + pad;
  if (left < pad) left = pad;
  el.style.left = `${left}px`;
  el.style.top = `${top}px`;
}

function positionPopupAbove(skillEl) {
  const el = popupEl();
  if (!el) return;
  el.classList.remove('hidden');
  const pad = 8;
  const btnRect = skillEl.getBoundingClientRect();
  const popupRect = el.getBoundingClientRect();
  let left = btnRect.left + (btnRect.width - popupRect.width) / 2;
  let top = btnRect.top - popupRect.height - pad;
  if (left < pad) left = pad;
  if (left + popupRect.width > window.innerWidth - pad) {
    left = window.innerWidth - popupRect.width - pad;
  }
  if (top < pad) top = btnRect.bottom + pad;
  el.style.left = `${left}px`;
  el.style.top = `${top}px`;
}

function setPopupContent(skill) {
  const el = popupEl();
  if (!el) return;
  clearTimeout(hideTimer);
  const statsLine = formatSkillStats(skill);
  const typeBadge = skillTypeLabel(skill.type);
  const desc = describeSkill(skill);
  el.innerHTML = `
    <div class="skill-popup-header">
      <span class="skill-popup-name">${skill.name}</span>
      <span class="skill-popup-type">${typeBadge}</span>
    </div>
    <div class="skill-popup-stats">${statsLine}</div>
    <div class="skill-popup-desc">${desc}</div>
  `;
  popupVisible = true;
}

function showSkillPopup(skill, x, y) {
  setPopupContent(skill);
  requestAnimationFrame(() => positionPopup(x, y));
}

function hideSkillPopup() {
  hideTimer = setTimeout(() => {
    const el = popupEl();
    if (el) el.classList.add('hidden');
    popupVisible = false;
  }, 200);
}

function cancelHide() {
  clearTimeout(hideTimer);
}

export function renderActions(skills, onChoose) {
  const container = $("actions");
  container.innerHTML = "";
  const isDesktop = !document.documentElement.classList.contains('mobile');
  skills.forEach((skill, i) => {
    const btn = document.createElement("button");
    btn.className = "skill-btn";

    if (isDesktop) {
      const typeBadge = skillTypeLabel(skill.type);
      const statsLine = formatSkillStats(skill);
      const desc = describeSkill(skill);
      btn.innerHTML = `
        <div class="skill-popup-header">
          <span class="skill-popup-name">${skill.name}</span>
          <span class="skill-popup-type">${typeBadge}</span>
        </div>
        <div class="skill-popup-stats">${statsLine}</div>
        <div class="skill-popup-desc">${desc}</div>
      `;
    } else {
      let html = `<div class="skill-name">${skill.name}</div>`;
      html += `<div class="skill-stats">${formatSkillStats(skill)}</div>`;
      btn.innerHTML = html;
    }

    btn.onclick = () => onChoose(i);

    if (!isDesktop) {
      btn.addEventListener('mouseenter', (e) => {
        if (touchActive) return;
        showSkillPopup(skill, e.clientX, e.clientY);
      });
      btn.addEventListener('mousemove', (e) => {
        if (touchActive) return;
        if (popupVisible) positionPopup(e.clientX, e.clientY);
      });
      btn.addEventListener('mouseleave', () => hideSkillPopup());

      btn.addEventListener('touchstart', () => {
        touchActive = true;
        clearTimeout(hideTimer);
        setPopupContent(skill);
        requestAnimationFrame(() => positionPopupAbove(btn));
      }, { passive: true });
      btn.addEventListener('touchend', () => {
        touchActive = false;
        hideSkillPopup();
      });
      btn.addEventListener('touchcancel', () => {
        touchActive = false;
        hideSkillPopup();
      });
    }

    container.appendChild(btn);
  });
}

document.addEventListener('mouseenter', (e) => {
  if (popupVisible && !e.target.closest('.skill-btn') && !e.target.closest('.skill-popup')) {
    hideSkillPopup();
  }
}, true);

document.addEventListener('touchstart', (e) => {
  if (popupVisible && !e.target.closest('.skill-btn') && !e.target.closest('.skill-popup')) {
    clearTimeout(hideTimer);
    const el = popupEl();
    if (el) el.classList.add('hidden');
    popupVisible = false;
  }
  touchActive = true;
}, { passive: true });

const popup = popupEl();
if (popup) {
  popup.addEventListener('mouseenter', cancelHide);
  popup.addEventListener('mouseleave', () => hideSkillPopup());
}

export function showRestart(won, onEnd) {
  const div = $("restart-area");
  const text = won ? 'Continuar' : 'Reintentar';
  div.innerHTML = `<button id="restart-btn">${text}</button>`;
  document.getElementById('restart-btn').onclick = () => {
    if (onEnd) onEnd();
  };
}
