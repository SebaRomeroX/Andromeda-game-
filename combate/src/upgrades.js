/**
 * @file Mejora y aprendizaje de habilidades en el campamento
 * @description Tras sanar y subir de nivel, cada superviviente de equipo A
 * mejora una de sus habilidades (gratis) y puede aprender una nueva
 * pagando 1 orbe azul (mente), u omitir. Se ofrecen 3 opciones al azar y
 * cada personaje puede aprender como maximo 1 habilidad por campamento.
 */

import { upgradeSkill } from './models.js';
import state, { saveTeamSkills, saveTeamLearnableSkills, saveTeamLearnedSkills } from './state.js';
import { formatSkillStats, describeSkill, describeUpgrade, skillTypeLabel } from './formatters.js';

// ── Upgrade overlay ──
const overlay = () => document.getElementById('upgrade-overlay');
const title = () => document.getElementById('upgrade-title');
const grid = () => document.getElementById('upgrade-grid');
const confirmBtn = () => document.getElementById('upgrade-confirm');

/**
 * HTML de una tarjeta de habilidad (compartida entre los menús de
 * mejora y aprendizaje del campamento).
 *
 * @param {Object} skill
 * @param {{ levelLabel?: boolean, preview?: boolean }} [opts]
 *   - levelLabel: muestra ` · LvX` junto al nombre
 *   - preview: añade la línea con los cambios del siguiente nivel
 * @returns {string}
 */
function skillCardHtml(skill, { levelLabel = false, preview = false } = {}) {
  const name = levelLabel ? `${skill.name} · Lv${skill.level ?? 1}` : skill.name;
  const previewLine = preview ? describeUpgrade(skill) : '';
  return `
    <div class="skill-popup-header">
      <span class="skill-popup-name">${name}</span>
      <span class="skill-popup-type">${skillTypeLabel(skill.type)}</span>
    </div>
    <div class="skill-popup-stats">${formatSkillStats(skill)}</div>
    <div class="skill-popup-desc">${describeSkill(skill)}</div>
    ${previewLine ? `<div class="skill-upgrade-preview">${previewLine}</div>` : ''}
  `;
}

function showUpgradeFor(member, onDone) {
  title().textContent = `Elige una habilidad de ${member.name} para mejorarla`;
  grid().innerHTML = '';
  confirmBtn().disabled = true;
  confirmBtn().textContent = 'Confirmar';

  let selectedIndex = null;

  const render = () => {
    grid().querySelectorAll('.skill-btn').forEach((btn) => {
      btn.classList.toggle('selected', Number(btn.dataset.skillIndex) === selectedIndex);
    });
    confirmBtn().disabled = selectedIndex === null;
  };

  const upgradeable = member.skills
    .map((skill, i) => ({ skill, i }))
    .filter(({ skill }) => (skill.level ?? 1) < 4);

  if (upgradeable.length === 0) {
    overlay().classList.add('hidden');
    onDone();
    return;
  }

  upgradeable.forEach(({ skill, i }) => {
    const btn = document.createElement('button');
    btn.className = 'skill-btn';
    btn.dataset.skillIndex = i;
    btn.innerHTML = skillCardHtml(skill, { levelLabel: true, preview: true });
    btn.onclick = () => {
      if (selectedIndex === null) {
        selectedIndex = i;
      } else if (selectedIndex === i) {
        selectedIndex = null;
      } else {
        selectedIndex = i;
      }
      render();
    };
    grid().appendChild(btn);
  });

  overlay().classList.remove('hidden');

  confirmBtn().onclick = () => {
    if (selectedIndex === null) return;
    upgradeSkill(member.skills[selectedIndex]);
    overlay().classList.add('hidden');
    onDone();
  };

  render();
}

// ── Learn overlay ──
const learnOverlay = () => document.getElementById('learn-overlay');
const learnTitle = () => document.getElementById('learn-title');
const learnGrid = () => document.getElementById('learn-grid');
const learnConfirm = () => document.getElementById('learn-confirm');
const learnSkip = () => document.getElementById('learn-skip');

const ORB_COST = 1;

function pickRandom(array, count) {
  const copy = array.slice();
  const result = [];
  const n = Math.min(count, copy.length);
  for (let i = 0; i < n; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    result.push(copy.splice(idx, 1)[0]);
  }
  return result;
}

function showLearnFor(member, onDone) {
  const pool = member.learnableSkills;
  if (!pool || pool.length === 0) {
    onDone();
    return;
  }

  const orbes = state.run.orbes ?? 0;
  learnGrid().innerHTML = '';
  learnConfirm().disabled = true;
  learnConfirm().textContent = 'Confirmar';
  learnSkip().textContent = 'Omitir';

  // Sin orbes disponibles: solo se puede pasar
  if (orbes < ORB_COST) {
    learnTitle().textContent = 'No tienes orbes disponibles';
    learnConfirm().style.display = 'none';
    learnSkip().textContent = 'Continuar';
    learnSkip().onclick = () => {
      learnOverlay().classList.add('hidden');
      onDone();
    };
    learnOverlay().classList.remove('hidden');
    return;
  }

  const options = pickRandom(pool, 3);
  learnTitle().textContent = `${member.name} aprende una nueva habilidad · 🔵 Orbes: ${orbes}`;

  let selectedIndex = null;

  const render = () => {
    learnGrid().querySelectorAll('.skill-btn').forEach((btn, i) => {
      btn.classList.toggle('selected', i === selectedIndex);
    });
    learnConfirm().disabled = selectedIndex === null;
  };

  options.forEach((skill, i) => {
    const btn = document.createElement('button');
    btn.className = 'skill-btn';
    btn.innerHTML = skillCardHtml(skill);
    btn.onclick = () => {
      if (selectedIndex === null) {
        selectedIndex = i;
      } else if (selectedIndex === i) {
        selectedIndex = null;
      } else {
        selectedIndex = i;
      }
      render();
    };
    learnGrid().appendChild(btn);
  });

  learnConfirm().style.display = '';
  learnSkip().onclick = () => {
    learnOverlay().classList.add('hidden');
    onDone();
  };

  learnOverlay().classList.remove('hidden');

  learnConfirm().onclick = () => {
    if (selectedIndex === null) return;
    const chosen = options[selectedIndex];
    state.run.orbes = (state.run.orbes ?? 0) - ORB_COST;
    member.skills.push({ ...chosen, level: 1 });
    const poolIdx = pool.findIndex(s => s.name === chosen.name);
    if (poolIdx !== -1) pool.splice(poolIdx, 1);
    learnOverlay().classList.add('hidden');
    onDone();
  };

  render();
}

/**
 * Muestra el menú de mejora para cada superviviente, en orden.
 * Después de mejorar, si tiene habilidades aprendibles, ofrece aprender una.
 *
 * @param {Object[]} members - Supervivientes de equipo A
 * @param {Function} onComplete - Se llama cuando todos terminaron
 */
export function startSkillUpgrades(members, onComplete) {
  const queue = members.slice();

  function next() {
    const member = queue.shift();
    if (!member) {
      saveTeamSkills();
      saveTeamLearnableSkills();
      saveTeamLearnedSkills();
      onComplete();
      return;
    }
    showUpgradeFor(member, () => {
      showLearnFor(member, next);
    });
  }

  next();
}
