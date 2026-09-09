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
    let effects = '';
    if (skill.stun) effects += '⚡';
    if (skill.herida) effects += '🩸';
    return `⚔️${effects ? ' ' + effects : ''} ${scaled.power}`;
  }
  if (skill.type === SKILL_TYPES.CURA) return `💚 ${scaled.power}`;
  if (skill.type === SKILL_TYPES.DEFENSE) return `🛡️ ${scaled.power}`;
  if (skill.type === SKILL_TYPES.BUFF) {
    const emoji = buffEmoji(skill.stat);
    const arrow = skill.value > 0 ? '↑' : skill.value < 0 ? '↓' : '—';
    let val = '';
    if (skill.stat === BUFF_STATS.DEFENSE) {
      val = `${skill.value > 0 ? '+' : ''}${skill.value}`;
    } else if (skill.stat === BUFF_STATS.EVASION) {
      val = skill.value === 0 ? '0' : `${skill.value > 0 ? '+' : ''}${skill.value}`;
    } else {
      const pct = (Math.abs(skill.value) * 100).toFixed(0);
      val = skill.value >= 1 ? '100%' : `${skill.value > 0 ? '+' : ''}${pct}%`;
    }
    return `✨ (${emoji} ${val} ${arrow})`;
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
    let text = `Inflige ${scaled.power} pts de daño`;
    text += `<br>${scaled.precision}% de posibilidad de exito`;
    const effects = [];
    if (skill.stun) effects.push('"stun" (dura un turno)');
    if (skill.herida) effects.push('"sangrado" (hasta ser curado)');
    if (effects.length) {
      text += `<br>Si impacta, causa efecto ${effects.join(' y ')}`;
    }
    return text;
  }
  if (skill.type === SKILL_TYPES.CURA) {
    let text = `Restaura ${scaled.power} pts de vida a un aliado`;
    text += `<br>${scaled.precision}% de exito`;
    text += '<br>Anula efecto "sangrado"';
    return text;
  }
  if (skill.type === SKILL_TYPES.DEFENSE) {
    return `Reduce el daño recibido en ${scaled.power} pts<br>Dura solo este turno`;
  }
  if (skill.type === SKILL_TYPES.BUFF) {
    const duration = skill.duration ?? 3;
    const precision = scaled.precision;
    if (skill.stat === BUFF_STATS.DEFENSE) {
      let text = '';
      if (skill.value > 0) {
        if (skill.target === 'self') {
          text = `Aumenta la propia defenza ${skill.value} pts`;
        } else {
          text = `Aumenta la defenza de un aliado ${skill.value} pts`;
        }
      } else {
        text = 'Reduce la defenza rival a la mitad';
      }
      text += `<br>Dura ${duration} turno${duration > 1 ? 's' : ''}`;
      text += `<br>${precision}% de exito`;
      return text;
    }
    if (skill.stat === BUFF_STATS.ATTACK) {
      const direction = skill.value > 0 ? 'Aumenta' : 'Reduce';
      const pct = (Math.abs(skill.value) * 100).toFixed(0);
      let text = '';
      if (skill.target === 'self') {
        text = `${direction} el ataque propio ${pct}%`;
      } else if (skill.target === 'enemy') {
        text = skill.scope === 'all'
          ? `${direction} el ataque de todo el equipo rival ${pct}%`
          : `${direction} el ataque rival ${pct}%`;
      } else if (skill.scope === 'all') {
        text = `${direction} el ataque de todo el equipo ${pct}%`;
      } else {
        text = `${direction} el ataque de un aliado ${pct}%`;
      }
      text += `<br>Dura ${duration} turno${duration > 1 ? 's' : ''}`;
      text += `<br>${precision}% de exito`;
      return text;
    }
    if (skill.stat === BUFF_STATS.PRECISION) {
      const direction = skill.value > 0 ? 'Aumenta' : 'Reduce';
      const pct = skill.value >= 1 ? 100 : (Math.abs(skill.value) * 100).toFixed(0);
      let text = '';
      if (skill.target === 'self') {
        text = `${direction} al ${pct}% la precision propia`;
      } else if (skill.target === 'enemy') {
        text = skill.scope === 'all'
          ? `${direction} al ${pct}% la precision de todo el equipo rival`
          : `${direction} al ${pct}% la precision rival`;
      } else if (skill.scope === 'all') {
        text = `${direction} al ${pct}% la precision de todo el equipo`;
      } else {
        text = `${direction} al ${pct}% la precision de un aliado`;
      }
      text += `<br>Dura ${duration} turno${duration > 1 ? 's' : ''}`;
      text += `<br>${precision}% de exito`;
      return text;
    }
    if (skill.stat === BUFF_STATS.EVASION) {
      const direction = skill.value > 0 ? 'Aumenta' : 'Reduce';
      const val = Math.abs(skill.value);
      let text = '';
      if (skill.target === 'self') {
        text = `${direction} la evasion propia ${val}%`;
      } else if (skill.target === 'enemy') {
        text = skill.scope === 'all'
          ? `Anula evasion de todo el equipo rival`
          : `Anula evasion rival`;
      } else if (skill.scope === 'all') {
        text = `${direction} la evasion de todo el equipo ${val}%`;
      } else {
        text = `${direction} la evasion de un aliado ${val}%`;
      }
      text += `<br>Dura ${duration} turno${duration > 1 ? 's' : ''}`;
      text += `<br>${precision}% de exito`;
      return text;
    }
    const statName = STAT_LABELS[skill.stat] ?? skill.stat;
    const direction = skill.value > 0 ? 'Aumenta' : 'Reduce';
    const targetText = skill.target === 'self' ? 'su'
      : skill.target === 'ally' ? 'el de un aliado'
      : 'el del enemigo';
    let text = `${direction} ${targetText} ${statName}`;
    if (skill.scope === 'all') text += ' (todos)';
    text += ` por ${duration} turnos.`;
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
