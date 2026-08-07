/**
 * @file Mejora de habilidades en el campamento
 * @description Tras sanar y subir de nivel, cada superviviente de equipo A
 * mejora una de sus habilidades. El menú reusa el comportamiento de selección
 * del combate: click selecciona; click sobre la misma deselecciona; click sobre
 * otra cambia la selección. Luego se confirma con un botón.
 */

import { upgradeSkill, getSkillScaledStats } from './models.js';
import { saveTeamSkills } from './state.js';

const overlay = () => document.getElementById('upgrade-overlay');
const title = () => document.getElementById('upgrade-title');
const grid = () => document.getElementById('upgrade-grid');
const confirmBtn = () => document.getElementById('upgrade-confirm');

function skillStatsLine(skill) {
  const scaled = getSkillScaledStats(skill);
  const emojis = { attack: '⚔️', defense: '🛡️', evasion: '🏃', precision: '🎯' };
  const prec = `${scaled.precision}% prec`;
  if (skill.type === 'attack') return `⚔️ ${scaled.power} · ${prec}`;
  if (skill.type === 'cura') return `💚 ${scaled.power} · ${prec}`;
  if (skill.type === 'defense') return `🛡️ ${scaled.power} · ${prec}`;
  if (skill.type === 'buff') {
    const emoji = emojis[skill.stat] || '⚔️';
    const sign = skill.value > 0 ? '+' : '';
    if (skill.stat === 'defense') return `${emoji} ${sign}${skill.value} · ${prec}`;
    if (skill.stat === 'precision') return `${emoji} ${skill.value >= 1 ? '100%' : '↓'} · ${prec}`;
    if (skill.stat === 'evasion') return `${emoji} ${skill.value} · ${prec}`;
    return `${emoji} ${sign}${(Math.abs(skill.value) * 100).toFixed(0)}% · ${prec}`;
  }
  return prec;
}

function showUpgradeFor(member, onDone) {
  title().textContent = `Elige una habilidad de ${member.name} para mejorarla`;
  grid().innerHTML = '';
  confirmBtn().disabled = true;
  confirmBtn().textContent = 'Confirmar';

  let selectedIndex = null;

  const render = () => {
    grid().querySelectorAll('.skill-btn').forEach((btn, i) => {
      btn.classList.toggle('selected', i === selectedIndex);
    });
    confirmBtn().disabled = selectedIndex === null;
  };

  const upgradeable = member.skills.filter(s => s.type !== 'buff');
  upgradeable.forEach((skill, i) => {
    const btn = document.createElement('button');
    btn.className = 'skill-btn';
    btn.innerHTML = `
      <div class="skill-name">${skill.name} · Lv${skill.level ?? 1}</div>
      <div class="skill-stats">${skillStatsLine(skill)}</div>
    `;
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

/**
 * Muestra el menú de mejora para cada superviviente, en orden.
 *
 * @param {Object[]} members - Supervivientes de equipo A (miembros con skills)
 * @param {Function} onComplete - Se llama cuando todos terminaron
 */
export function startSkillUpgrades(members, onComplete) {
  const queue = members.slice();

  function next() {
    const member = queue.shift();
    if (!member) {
      saveTeamSkills();
      onComplete();
      return;
    }
    showUpgradeFor(member, next);
  }

  next();
}