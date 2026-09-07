import { getSkillScaledStats } from './models.js';
import { SKILL_TYPES, BUFF_STATS } from './constants.js';

const BUFF_EMOJI_MAP = {
  [BUFF_STATS.ATTACK]: '⚔️',
  [BUFF_STATS.DEFENSE]: '🛡️',
  [BUFF_STATS.EVASION]: '🏃',
  [BUFF_STATS.PRECISION]: '🎯',
};

export function actionLabel(skillType) {
  if (skillType === SKILL_TYPES.ATTACK) return 'atq';
  if (skillType === SKILL_TYPES.CURA) return 'cura';
  if (skillType === SKILL_TYPES.BUFF) return 'buff';
  return 'def';
}

export function buffEmoji(stat) {
  return BUFF_EMOJI_MAP[stat] ?? '⚔️';
}

export function formatAction(skill) {
  const scaled = getSkillScaledStats(skill);
  if (skill.type === SKILL_TYPES.ATTACK) {
    const icon = skill.stun ? '⚡' : '🗡️';
    return `${icon} (${scaled.power})`;
  }
  if (skill.type === SKILL_TYPES.CURA) return `💚 (${scaled.power})`;
  if (skill.type === SKILL_TYPES.DEFENSE) return `🛡️ (${scaled.power})`;
  if (skill.type === SKILL_TYPES.BUFF) {
    const sign = skill.value > 0 ? '+' : '-';
    return `✨ (${buffEmoji(skill.stat)}${sign})`;
  }
  return '';
}

export function formatSkillStats(skill) {
  const scaled = getSkillScaledStats(skill);
  if (skill.type === SKILL_TYPES.ATTACK) {
    let icon = '⚔️';
    if (skill.stun && skill.herida) icon = '⚡🩸';
    else if (skill.stun) icon = '⚡';
    else if (skill.herida) icon = '🩸';
    return `${icon} ${scaled.power}`;
  }
  if (skill.type === SKILL_TYPES.CURA) return `💚 ${scaled.power}`;
  if (skill.type === SKILL_TYPES.DEFENSE) return `🛡️ ${scaled.power}`;
  if (skill.type === SKILL_TYPES.BUFF) {
    const emoji = buffEmoji(skill.stat);
    const arrow = skill.value > 0 ? '↑' : skill.value < 0 ? '↓' : '—';
    return `✨ (${emoji} ${arrow})`;
  }
  return '';
}

export function powerLabel(skill) {
  if (skill.type === SKILL_TYPES.BUFF) return skill.value;
  return getSkillScaledStats(skill).power;
}

const STAT_LABELS = {
  [BUFF_STATS.ATTACK]: 'ataque',
  [BUFF_STATS.DEFENSE]: 'defensa',
  [BUFF_STATS.EVASION]: 'evasión',
  [BUFF_STATS.PRECISION]: 'precisión',
};

const TYPE_LABELS = {
  [SKILL_TYPES.ATTACK]: 'Atq',
  [SKILL_TYPES.CURA]: 'Cura',
  [SKILL_TYPES.DEFENSE]: 'Def',
  [SKILL_TYPES.BUFF]: 'Buff',
};

export function skillTypeLabel(type) {
  return TYPE_LABELS[type] ?? type;
}

export function describeSkill(skill) {
  const scaled = getSkillScaledStats(skill);
  if (skill.type === SKILL_TYPES.ATTACK) {
    let text = `Inflige ${scaled.power} de daño con ${scaled.precision}% de precisión.`;
    if (skill.stun && skill.herida) {
      text += ' Puede aturdir y causar sangrado.';
    } else if (skill.stun) {
      text += ' Puede aturdir al objetivo.';
    } else if (skill.herida) {
      text += ' Causa sangrado.';
    }
    return text;
  }
  if (skill.type === SKILL_TYPES.CURA) {
    return `Cura ${scaled.power} HP con ${scaled.precision}% de precisión.`;
  }
  if (skill.type === SKILL_TYPES.DEFENSE) {
    return `Reduce el daño recibido en ${scaled.power} puntos.`;
  }
  if (skill.type === SKILL_TYPES.BUFF) {
    const statName = STAT_LABELS[skill.stat] ?? skill.stat;
    const direction = skill.value > 0 ? 'Aumenta' : 'Reduce';
    const targetText = skill.target === 'self' ? 'su'
      : skill.target === 'ally' ? 'el de un aliado'
      : 'el del enemigo';
    let text = `${direction} ${targetText} ${statName}`;
    if (skill.scope === 'all') text += ' (todos)';
    text += ` por ${skill.duration ?? 3} turnos.`;
    return text;
  }
  return '';
}

export function formatBuffHtml(buff) {
  const emoji = buffEmoji(buff.stat);
  const cls = buff.value > 0 ? 'buff-positive' : 'buff-negative';
  const sign = buff.value > 0 ? '+' : '-';
  if (buff.stat === BUFF_STATS.DEFENSE) {
    return `<span class="${cls}">${emoji}${sign}${buff.value} (${buff.turnsLeft})</span>`;
  }
  if (buff.stat === BUFF_STATS.PRECISION) {
    const displayVal = buff.value >= 1 ? '100%' : '↓';
    return `<span class="${cls}">${emoji}${displayVal} (${buff.turnsLeft})</span>`;
  }
  if (buff.stat === BUFF_STATS.EVASION) {
    const displayVal = buff.value === 0 ? '0' : `+${buff.value}`;
    return `<span class="${cls}">${emoji}${displayVal} (${buff.turnsLeft})</span>`;
  }
  const pct = (Math.abs(buff.value) * 100).toFixed(0);
  return `<span class="${cls}">${emoji}${sign}${pct}% (${buff.turnsLeft})</span>`;
}
