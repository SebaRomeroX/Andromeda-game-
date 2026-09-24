/**
 * @file Mejora y aprendizaje de habilidades en el campamento
 * @description Tras sanar y subir de nivel, cada superviviente de equipo A
 * mejora una de sus habilidades (gratis). El aprendizaje de habilidades
 * nuevas (1 orbe azul c/u) ocurre una unica vez por campamento, en una fase
 * final con rejilla de seleccion de miembros: se elige personaje, se elige
 * entre 3 habilidades al azar y se confirma o cancela. Cada personaje
 * aprende como maximo 1 habilidad por campamento.
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

const hasLearnable = (m) => (m.learnableSkills?.length ?? 0) > 0;

/**
 * Fase unica de aprendizaje del campamento (una vez, tras las mejoras).
 *
 * Estados:
 *  - A: ningun miembro con habilidades aprendibles
 *       → "Tu equipo no tiene habilidades que aprender"
 *  - B: hay habilidades pero 0 orbes → "No tienes orbes disponibles"
 *  - C: rejilla de miembros (elegibles clicables, resto deshabilitados)
 *       → al elegir, picking de 3 habilidades con Confirmar/Cancelar
 *
 * Tras confirmar, si quedan orbes y miembros elegibles se vuelve a la
 * rejilla; si no, la fase termina. "Omitir" termina la fase en cualquier
 * momento desde la rejilla.
 *
 * @param {Object[]} members - Supervivientes vivos que subieron de nivel
 * @param {Function} onComplete - Se llama al terminar la fase
 */
export function startLearnPhase(members, onComplete) {
  const picked = new Set();

  const finish = () => {
    learnOverlay().classList.add('hidden');
    onComplete();
  };

  const showMessage = (text, buttonText, onClick) => {
    learnGrid().innerHTML = '';
    learnTitle().textContent = text;
    learnConfirm().style.display = 'none';
    learnSkip().textContent = buttonText;
    learnSkip().onclick = onClick;
    learnOverlay().classList.remove('hidden');
  };

  // Estado A: el equipo no tiene habilidades que aprender
  if (!members.some(hasLearnable)) {
    showMessage('Tu equipo no tiene habilidades que aprender', 'Continuar', finish);
    return;
  }

  // Estado B: sin orbes disponibles
  if ((state.run.orbes ?? 0) < ORB_COST) {
    showMessage('No tienes orbes disponibles', 'Continuar', finish);
    return;
  }

  // Estado C: rejilla de selección de miembros
  function showMemberGrid() {
    const orbes = state.run.orbes ?? 0;
    const eligible = (m) => hasLearnable(m) && !picked.has(m);

    // Sin orbes o sin elegibles: termina la fase
    if (orbes < ORB_COST || !members.some(eligible)) {
      finish();
      return;
    }

    learnTitle().textContent = `Puedes usar orbes azules para que uno de tus personajes aprenda una nueva habilidad · 🔵 Orbes: ${orbes}`;
    learnGrid().innerHTML = '';
    learnConfirm().style.display = 'none';
    learnSkip().textContent = 'Omitir';
    learnSkip().onclick = finish;

    members.forEach((member) => {
      const canPick = eligible(member);
      const card = document.createElement('button');
      card.className = 'learn-member-card';
      card.disabled = !canPick;
      card.innerHTML = `
        <img src="${member.image ?? ''}" alt="${member.name}">
        <div class="learn-member-name">${member.name}</div>
      `;
      if (canPick) card.onclick = () => showSkillPick(member);
      learnGrid().appendChild(card);
    });

    learnOverlay().classList.remove('hidden');
  }

  // Vista de picking: 3 habilidades al azar del miembro elegido
  function showSkillPick(member) {
    const pool = member.learnableSkills;
    if (!pool || pool.length === 0) {
      showMemberGrid();
      return;
    }

    const options = pickRandom(pool, 3);
    learnGrid().innerHTML = '';
    learnTitle().textContent = `${member.name} aprende una nueva habilidad · 🔵 Orbes: ${state.run.orbes ?? 0}`;
    learnConfirm().style.display = '';
    learnConfirm().textContent = 'Confirmar';
    learnConfirm().disabled = true;
    learnSkip().textContent = 'Cancelar';
    learnSkip().onclick = showMemberGrid;

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

    learnConfirm().onclick = () => {
      if (selectedIndex === null) return;
      const chosen = options[selectedIndex];
      state.run.orbes = (state.run.orbes ?? 0) - ORB_COST;
      member.skills.push({ ...chosen, level: 1 });
      const poolIdx = pool.findIndex((s) => s.name === chosen.name);
      if (poolIdx !== -1) pool.splice(poolIdx, 1);
      picked.add(member);
      saveTeamSkills();
      saveTeamLearnableSkills();
      saveTeamLearnedSkills();
      // Vuelve a la rejilla (o termina si ya no queda nada que hacer)
      showMemberGrid();
    };

    learnOverlay().classList.remove('hidden');
    render();
  }

  showMemberGrid();
}

/**
 * Muestra el menú de mejora (gratuita) para cada superviviente, en orden.
 * El aprendizaje de habilidades nuevas ocurre después, en la fase única
 * gestionada por startLearnPhase.
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
    showUpgradeFor(member, next);
  }

  next();
}
