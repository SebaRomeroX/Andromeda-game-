/**
 * @file Fases del campamento: mercader, nivelación, mejora y aprendizaje
 * @description Tras descansar (curación gratuita), el campamento encadena
 * cuatro fases. Las tres ultimas comparten la misma logica: rejilla de
 * seleccion de miembros y, al elegir uno, la vista correspondiente con
 * Confirmar/Cancelar. Cada una cuesta 1 orbe por accion y admite como
 * maximo 1 accion por personaje por campamento:
 *  - Mercader: 1 orbe dorado (riqueza) canjeado por 1 orbe de otro tipo;
 *    se puede canjear tantas veces como orbes dorados se tengan.
 *  - Nivelación: 1 orbe verde (cuerpo) por nivel de personaje.
 *  - Mejora de habilidades: 1 orbe rojo (poder) por mejora.
 *  - Aprendizaje: 1 orbe azul (mente) por habilidad nueva; se ofrecen 3
 *    habilidades al azar del personaje elegido.
 *
 * Cada fase se omite sin mostrar interfaz si no tienes el orbe que
 * cuesta o si no hay nada que hacer en ella (sin niveles, mejoras ni
 * habilidades aprendibles): solo se muestran las fases en las que
 * puedes actuar.
 */

import { upgradeSkill, getNextLevelStats } from './models.js';
import state, { saveTeamSkills, saveTeamLearnableSkills, saveTeamLearnedSkills, saveTeamLevels, restoreTeamHp } from './state.js';
import { formatSkillStats, describeSkill, describeUpgrade, skillTypeLabel } from './formatters.js';
import { orbDotHtml, ORB_META } from './gameFlow.js';

// Punto con brillo del orbe de la mente (azul): aprendizaje.
const MIND_DOT = orbDotHtml(ORB_META.find(m => m.key === 'mind').color);
// Punto con brillo del orbe de poder (rojo): mejoras de habilidad.
const POWER_DOT = orbDotHtml(ORB_META.find(m => m.key === 'power').color);
// Punto con brillo del orbe de cuerpo (verde): subidas de nivel.
const BODY_DOT = orbDotHtml(ORB_META.find(m => m.key === 'body').color);
// Punto con brillo del orbe de riqueza (dorado): canje del mercader.
const WEALTH_DOT = orbDotHtml(ORB_META.find(m => m.key === 'wealth').color);

// Coste de cada accion del campamento (1 orbe por nivel/mejora/aprendizaje)
const ORB_COST = 1;

// Canje del mercader: cada orbe dorado rinde 1 orbe del tipo elegido.
const EXCHANGE_RATE = 1;

// ── Mercader overlay ──
const mercOverlay = () => document.getElementById('mercader-overlay');
const mercTitle = () => document.getElementById('mercader-title');
const mercGrid = () => document.getElementById('mercader-grid');
const mercConfirm = () => document.getElementById('mercader-confirm');
const mercSkip = () => document.getElementById('mercader-skip');

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

// ── Level-up overlay ──
const lvlOverlay = () => document.getElementById('levelup-overlay');
const lvlTitle = () => document.getElementById('levelup-title');
const lvlGrid = () => document.getElementById('levelup-grid');
const lvlPreview = () => document.getElementById('levelup-preview');
const lvlPreviewImg = () => document.getElementById('levelup-preview-img');
const lvlPreviewStats = () => document.getElementById('levelup-preview-stats');
const lvlConfirm = () => document.getElementById('levelup-confirm');
const lvlSkip = () => document.getElementById('levelup-skip');

// ── Learn overlay ──
const learnOverlay = () => document.getElementById('learn-overlay');
const learnTitle = () => document.getElementById('learn-title');
const learnGrid = () => document.getElementById('learn-grid');
const learnConfirm = () => document.getElementById('learn-confirm');
const learnSkip = () => document.getElementById('learn-skip');

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
 * Fase de mercader del campamento (la primera de las cuatro): canjeas
 * orbes dorados (riqueza) por orbes de otro tipo. No involucra
 * personajes, solo la bolsa de orbes.
 *
 * Estados:
 *  - A: 0 orbes dorados → la fase se omite sin mostrar interfaz
 *  - B: rejilla con un boton por cada otro tipo de orbe (mente, poder,
 *       cuerpo); elegir uno activa Confirmar. Confirmar gasta 1 orbe
 *       dorado y otorga 1 del tipo elegido; si aun quedan orbes
 *       dorados se vuelve a la rejilla, si no la fase termina.
 *       "Omitir" termina la fase en cualquier momento.
 *
 * @param {Function} onComplete - Se llama al terminar la fase
 */
export function startMercaderPhase(onComplete) {
  // Los otros tipos de orbe: todos menos el dorado (la moneda de cambio)
  const purchasable = ORB_META.filter(m => m.key !== 'wealth');
  let selectedIndex = null;

  const finish = () => {
    mercOverlay().classList.add('hidden');
    onComplete();
  };

  // Estado A: sin orbes dorados (riqueza) → la fase se omite sin
  // mostrar interfaz y se encadena directamente con la siguiente
  if ((state.run.orbes?.wealth ?? 0) < ORB_COST) {
    finish();
    return;
  }

  // Estado B: rejilla con un boton por cada tipo de orbe canjeable
  function showOrbGrid() {
    const orbes = state.run.orbes?.wealth ?? 0;

    // Sin orbes dorados: termina la fase
    if (orbes < ORB_COST) {
      finish();
      return;
    }

    selectedIndex = null;
    mercTitle().innerHTML = `Puedes canjear tus orbes dorados por otra cosa · ${WEALTH_DOT}Orbes: ${orbes}`;
    mercGrid().innerHTML = '';
    mercConfirm().style.display = '';
    mercConfirm().textContent = 'Confirmar';
    mercConfirm().disabled = true;
    mercSkip().textContent = 'Omitir';
    mercSkip().onclick = finish;

    const render = () => {
      mercGrid().querySelectorAll('.skill-btn').forEach((btn, i) => {
        btn.classList.toggle('selected', i === selectedIndex);
      });
      mercConfirm().disabled = selectedIndex === null;
    };

    purchasable.forEach((meta, i) => {
      const btn = document.createElement('button');
      btn.className = 'skill-btn';
      const n = EXCHANGE_RATE;
      btn.innerHTML = `${orbDotHtml(meta.color)}${n} ${n === 1 ? 'orbe' : 'orbes'} de ${meta.label}`;
      btn.onclick = () => {
        if (selectedIndex === i) {
          selectedIndex = null;
        } else {
          selectedIndex = i;
        }
        render();
      };
      mercGrid().appendChild(btn);
    });

    mercConfirm().onclick = () => {
      if (selectedIndex === null) return;
      if ((state.run.orbes?.wealth ?? 0) < ORB_COST) return;
      const target = purchasable[selectedIndex].key;
      state.run.orbes = {
        ...state.run.orbes,
        wealth: (state.run.orbes?.wealth ?? 0) - ORB_COST,
        [target]: (state.run.orbes?.[target] ?? 0) + EXCHANGE_RATE
      };
      // Vuelve a la rejilla (o termina si ya no queda oro)
      showOrbGrid();
    };

    mercOverlay().classList.remove('hidden');
    render();
  }

  showOrbGrid();
}

/**
 * Fase unica de nivelación del campamento (la segunda de las cuatro).
 * Cuesta 1 orbe verde (cuerpo) por nivel y cada personaje puede subir
 * como maximo 1 nivel por campamento.
 *
 * Estados:
 *  - A: no hay supervivientes vivos → termina la fase
 *  - B: 0 orbes de cuerpo (verdes) → la fase se omite sin mostrar nada
 *  - C: rejilla de miembros (elegibles clicables, resto deshabilitados)
 *       → al elegir, vista de comparación de stats (Nivel/Salud/Evasion
 *       de la antigua a la nueva) con Confirmar/Cancelar.
 *       Bloqueo estricto: elegir a un miembro lo fija para el resto del
 *       campamento aunque se cancele o no suba de nivel (solo confirmar
 *       gasta el orbe).
 *
 * Tras confirmar, si quedan orbes y miembros elegibles se vuelve a la
 * rejilla; si no, la fase termina. "Omitir" termina la fase en cualquier
 * momento desde la rejilla.
 *
 * @param {Object[]} members - Supervivientes vivos al descansar
 * @param {Function} onComplete - Se llama al terminar la fase
 */
export function startLevelUpPhase(members, onComplete) {
  const picked = new Set();

  const finish = () => {
    lvlOverlay().classList.add('hidden');
    onComplete();
  };

  // Estado A: no hay supervivientes vivos que puedan subir de nivel
  if (members.length === 0) {
    finish();
    return;
  }

  // Estado B: sin orbes de cuerpo (verdes) → la fase se omite sin
  // mostrar interfaz y se encadena directamente con la siguiente
  if ((state.run.orbes?.body ?? 0) < ORB_COST) {
    finish();
    return;
  }

  // Estado C: rejilla de selección de miembros
  function showMemberGrid() {
    const orbes = state.run.orbes?.body ?? 0;
    const eligible = (m) => !picked.has(m);

    // Sin orbes o sin elegibles: termina la fase
    if (orbes < ORB_COST || !members.some(eligible)) {
      finish();
      return;
    }

    lvlTitle().innerHTML = `Puedes usar orbes verdes para subir de nivel a tus personajes · ${BODY_DOT}Orbes: ${orbes}`;
    lvlGrid().classList.remove('hidden');
    lvlGrid().innerHTML = '';
    lvlPreview().classList.add('hidden');
    lvlConfirm().style.display = 'none';
    lvlSkip().textContent = 'Omitir';
    lvlSkip().onclick = finish;

    members.forEach((member) => {
      const canPick = eligible(member);
      const card = document.createElement('button');
      card.className = 'learn-member-card';
      card.disabled = !canPick;
      card.innerHTML = `
        <img src="${member.image ?? ''}" alt="${member.name}">
        <div class="learn-member-name">${member.name}</div>
      `;
      if (canPick) card.onclick = () => showPreview(member);
      lvlGrid().appendChild(card);
    });

    lvlOverlay().classList.remove('hidden');
  }

  // Vista de comparación: lo que gana el miembro al subir de nivel.
  // Bloqueo estricto: al elegir al miembro queda fijado para el resto
  // del campamento, da igual si finalmente sube de nivel o cancela.
  function showPreview(member) {
    picked.add(member);
    const oldLevel = member.level;
    const oldHp = member.hp;
    const oldEvasion = member.evasion;
    const next = getNextLevelStats(member);

    lvlGrid().classList.add('hidden');
    lvlPreview().classList.remove('hidden');
    lvlTitle().textContent = `${member.name} sube de nivel`;
    lvlPreviewImg().src = member.image ?? '';
    lvlPreviewImg().alt = member.name;
    lvlPreviewStats().innerHTML = `
      <div class="stat-row">
        <span class="stat-label">Nivel:</span>
        <span class="stat-old">${oldLevel}</span>
        <span class="stat-arrow">→</span>
        <span class="stat-new">${oldLevel + 1}</span>
        <span class="stat-up">(+1)</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Salud:</span>
        <span class="stat-old">${oldHp}</span>
        <span class="stat-arrow">→</span>
        <span class="stat-new">${next.hp}</span>
        <span class="stat-up">(+${next.hp - oldHp})</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Evasion:</span>
        <span class="stat-old">${oldEvasion}</span>
        <span class="stat-arrow">→</span>
        <span class="stat-new">${next.evasion}</span>
        <span class="stat-up">(+${next.evasion - oldEvasion})</span>
      </div>
    `;
    lvlConfirm().style.display = '';
    lvlConfirm().textContent = 'Confirmar';
    lvlConfirm().disabled = false;
    lvlSkip().textContent = 'Cancelar';
    lvlSkip().onclick = showMemberGrid;

    lvlConfirm().onclick = () => {
      if ((state.run.orbes?.body ?? 0) < ORB_COST) return;
      state.run.orbes = { ...state.run.orbes, body: (state.run.orbes?.body ?? 0) - ORB_COST };
      member.level = oldLevel + 1;
      member.hp = next.hp;
      member.evasion = next.evasion;
      saveTeamLevels();
      // Sube la vida máxima del miembro al nuevo valor
      restoreTeamHp();
      // Vuelve a la rejilla (o termina si ya no queda nada que hacer)
      showMemberGrid();
    };

    lvlOverlay().classList.remove('hidden');
  }

  showMemberGrid();
}

/**
 * Fase unica de aprendizaje del campamento (una vez, tras las mejoras).
 *
 * Estados:
 *  - A: 0 orbes de la mente → la fase se omite sin mostrar interfaz
 *  - B: ningun miembro con habilidades aprendibles → la fase se omite
 *       sin mostrar interfaz
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

  // Estado A: sin orbes de la mente → la fase se omite sin mostrar
  // interfaz y se encadena directamente con la siguiente
  if ((state.run.orbes?.mind ?? 0) < ORB_COST) {
    finish();
    return;
  }

  // Estado B: el equipo no tiene habilidades que aprender → se omite
  if (!members.some(hasLearnable)) {
    finish();
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
 *  - A: 0 orbes de poder (rojos) → la fase se omite sin mostrar interfaz
 *  - B: ningun miembro con habilidades mejorables (todas a Lv4)
 *       → la fase se omite sin mostrar interfaz
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

  // Estado A: sin orbes de poder (rojos) → la fase se omite sin mostrar
  // interfaz y se encadena directamente con la siguiente
  if ((state.run.orbes?.power ?? 0) < ORB_COST) {
    finish();
    return;
  }

  // Estado B: el equipo no tiene habilidades que mejorar → se omite
  if (!members.some(hasUpgradeable)) {
    finish();
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
