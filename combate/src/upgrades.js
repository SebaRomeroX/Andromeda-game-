/**
 * @file Mejora y aprendizaje de habilidades en el campamento
 * @description Tras sanar y subir de nivel, cada superviviente de equipo A
 * puede mejorar una de sus habilidades (1 orbe rojo por mejora). Ambas
 * fases comparten la misma logica: rejilla de seleccion de miembros y,
 * al elegir uno, la vista de habilidades con Confirmar/Cancelar.
 *
 * El aprendizaje de habilidades nuevas (1 orbe azul c/u) ocurre en una
 * fase final con rejilla de seleccion de miembros: se elige personaje, se
 * elige entre 3 habilidades al azar y se confirma o cancela. Cada
 * personaje aprende como maximo 1 habilidad por campamento. Lo mismo
 * aplica a las mejoras: maximo 1 mejora por personaje por campamento.
 */

import { upgradeSkill } from './models.js';
import state, { saveTeamSkills, saveTeamLearnableSkills, saveTeamLearnedSkills } from './state.js';
import { formatSkillStats, describeSkill, describeUpgrade, skillTypeLabel } from './formatters.js';
import { orbDotHtml, ORB_META } from './gameFlow.js';

// Punto con brillo del orbe de la mente, para los titulos del campamento.
const MIND_DOT = orbDotHtml(ORB_META.find(m => m.key === 'mind').color);
// Punto con brillo del orbe de poder (rojo), para las mejoras de habilidad.
const POWER_DOT = orbDotHtml(ORB_META.find(m => m.key === 'power').color);

// ── Upgrade overlay ──
const overlay = () => document.getElementById('upgrade-overlay');
const title = () => document.getElementById('upgrade-title');
const grid = () => document.getElementById('upgrade-grid');
const confirmBtn = () => document.getElementById('upgrade-confirm');
const skipBtn = () => document.getElementById('upgrade-skip');

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
 *       → al elegir, picking de 3 habilidades con Confirmar/Cancelar.
 *       Bloqueo estricto: elegir a un miembro lo fija para el resto del
 *       campamento aunque se cancele o no aprenda nada.
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

  // Estado B: sin orbes de la mente disponibles
  if ((state.run.orbes?.mind ?? 0) < ORB_COST) {
    showMessage('No tienes orbes disponibles', 'Continuar', finish);
    return;
  }

  // Estado C: rejilla de selección de miembros
  function showMemberGrid() {
    const orbes = state.run.orbes?.mind ?? 0;
    const eligible = (m) => hasLearnable(m) && !picked.has(m);

    // Sin orbes o sin elegibles: termina la fase
    if (orbes < ORB_COST || !members.some(eligible)) {
      finish();
      return;
    }

    learnTitle().innerHTML = `Puedes usar orbes azules para que uno de tus personajes aprenda una nueva habilidad · ${MIND_DOT}Orbes: ${orbes}`;
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

  // Vista de picking: 3 habilidades al azar del miembro elegido.
  // Bloqueo estricto: al elegir al miembro queda fijado para el resto
  // del campamento, da igual si finalmente aprende o cancela.
  function showSkillPick(member) {
    picked.add(member);
    const pool = member.learnableSkills;
    if (!pool || pool.length === 0) {
      showMemberGrid();
      return;
    }

    const options = pickRandom(pool, 3);
    learnGrid().innerHTML = '';
    learnTitle().innerHTML = `${member.name} aprende una nueva habilidad · ${MIND_DOT}Orbes: ${state.run.orbes?.mind ?? 0}`;
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
      state.run.orbes = { ...state.run.orbes, mind: (state.run.orbes?.mind ?? 0) - ORB_COST };
      member.skills.push({ ...chosen, level: 1 });
      const poolIdx = pool.findIndex((s) => s.name === chosen.name);
      if (poolIdx !== -1) pool.splice(poolIdx, 1);
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
 * Fase unica de mejora de habilidades del campamento (una vez, antes de
 * la fase de aprendizaje). Cuesta 1 orbe rojo (poder) por mejora y cada
 * personaje puede mejorar como maximo 1 habilidad por campamento.
 *
 * Estados:
 *  - A: ningun miembro con habilidades mejorables (todas a Lv4)
 *       → "Tu equipo no tiene habilidades que mejorar"
 *  - B: hay habilidades pero 0 orbes de poder → "No tienes orbes disponibles"
 *  - C: rejilla de miembros (elegibles clicables, resto deshabilitados)
 *       → al elegir, vista con TODAS las habilidades mejorables del
 *       miembro (nivel + previsualizacion del siguiente nivel) y
 *       Confirmar/Cancelar. Bloqueo estricto: elegir a un miembro lo
 *       fija para el resto del campamento aunque se cancele o no
 *       mejore nada.
 *
 * Tras confirmar, si quedan orbes y miembros elegibles se vuelve a la
 * rejilla; si no, la fase termina. "Omitir" termina la fase en cualquier
 * momento desde la rejilla.
 *
 * @param {Object[]} members - Supervivientes vivos que subieron de nivel
 * @param {Function} onComplete - Se llama al terminar la fase
 */
export function startSkillUpgrades(members, onComplete) {
  const picked = new Set();
  const hasUpgradeable = (m) => m.skills.some(s => (s.level ?? 1) < 4);

  const finish = () => {
    overlay().classList.add('hidden');
    onComplete();
  };

  const showMessage = (text, buttonText, onClick) => {
    grid().innerHTML = '';
    title().textContent = text;
    confirmBtn().style.display = 'none';
    skipBtn().textContent = buttonText;
    skipBtn().onclick = onClick;
    overlay().classList.remove('hidden');
  };

  // Estado A: el equipo no tiene habilidades que mejorar
  if (!members.some(hasUpgradeable)) {
    showMessage('Tu equipo no tiene habilidades que mejorar', 'Continuar', finish);
    return;
  }

  // Estado B: sin orbes de poder (rojos) disponibles
  if ((state.run.orbes?.power ?? 0) < ORB_COST) {
    showMessage('No tienes orbes disponibles', 'Continuar', finish);
    return;
  }

  // Estado C: rejilla de selección de miembros
  function showMemberGrid() {
    const orbes = state.run.orbes?.power ?? 0;
    const eligible = (m) => hasUpgradeable(m) && !picked.has(m);

    // Sin orbes o sin elegibles: termina la fase
    if (orbes < ORB_COST || !members.some(eligible)) {
      finish();
      return;
    }

    title().innerHTML = `Puedes usar orbes rojos para que uno de tus personajes mejore una habilidad · ${POWER_DOT}Orbes: ${orbes}`;
    grid().innerHTML = '';
    confirmBtn().style.display = 'none';
    skipBtn().textContent = 'Omitir';
    skipBtn().onclick = finish;

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
      grid().appendChild(card);
    });

    overlay().classList.remove('hidden');
  }

  // Vista de mejora: TODAS las habilidades del miembro por debajo de Lv4,
  // con su nivel y la previsualizacion del siguiente nivel.
  // Bloqueo estricto: al elegir al miembro queda fijado para el resto
  // del campamento, da igual si finalmente mejora o cancela.
  function showSkillPick(member) {
    picked.add(member);
    const upgradeable = member.skills
      .map((skill, i) => ({ skill, i }))
      .filter(({ skill }) => (skill.level ?? 1) < 4);

    if (upgradeable.length === 0) {
      showMemberGrid();
      return;
    }

    grid().innerHTML = '';
    title().innerHTML = `${member.name} mejora una habilidad · ${POWER_DOT}Orbes: ${state.run.orbes?.power ?? 0}`;
    confirmBtn().style.display = '';
    confirmBtn().textContent = 'Confirmar';
    confirmBtn().disabled = true;
    skipBtn().textContent = 'Cancelar';
    skipBtn().onclick = showMemberGrid;

    let selectedIndex = null;

    const render = () => {
      grid().querySelectorAll('.skill-btn').forEach((btn) => {
        btn.classList.toggle('selected', Number(btn.dataset.skillIndex) === selectedIndex);
      });
      confirmBtn().disabled = selectedIndex === null;
    };

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

    confirmBtn().onclick = () => {
      if (selectedIndex === null) return;
      if ((state.run.orbes?.power ?? 0) < ORB_COST) return;
      state.run.orbes = { ...state.run.orbes, power: (state.run.orbes?.power ?? 0) - ORB_COST };
      upgradeSkill(member.skills[selectedIndex]);
      saveTeamSkills();
      // Vuelve a la rejilla (o termina si ya no queda nada que hacer)
      showMemberGrid();
    };

    overlay().classList.remove('hidden');
    render();
  }

  showMemberGrid();
}
