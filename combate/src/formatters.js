import { getSkillScaledStats, simulateUpgrade } from './models.js';
import { SKILL_TYPES, BUFF_STATS } from './constants.js';
import { getMultiplier, getPrecision } from './buffs.js';

/**
 * Resuelve los valores mostrables de una habilidad, aplicando los buffs
 * activos del personaje que la usa si se provee un contexto.
 *
 * - power: solo las habilidades de ataque se multiplican por el buff de ataque
 *   (igual que en combatEngine.computeEffect).
 * - precision: aplica a todos los tipos (igual que en combat.resolveAction).
 *
 * @param {Object} skill
 * @param {{teamKey: string, memberIndex: number}} [actorCtx] - contexto del actor
 * @returns {{scaled: Object, power: number|string, precision: number,
 *            powerClass: string, precisionClass: string}}
 */
export function resolveSkillDisplay(skill, actorCtx) {
  const scaled = getSkillScaledStats(skill);
  const result = {
    scaled,
    power: scaled.power,
    precision: scaled.precision,
    powerClass: '',
    precisionClass: ''
  };
  if (!actorCtx || actorCtx.teamKey == null || actorCtx.memberIndex == null) return result;
  const { teamKey, memberIndex } = actorCtx;

  if (skill.type === SKILL_TYPES.ATTACK && !skill.customEffect && scaled.power != null) {
    const atkMult = getMultiplier(teamKey, memberIndex, BUFF_STATS.ATTACK);
    const current = Math.round(scaled.power * atkMult);
    if (current !== scaled.power) {
      result.power = current;
      result.powerClass = current > scaled.power ? 'stat-up' : 'stat-down';
    }
  }

  if (scaled.precision != null) {
    const current = getPrecision(teamKey, memberIndex, scaled.precision);
    if (current !== scaled.precision) {
      result.precision = current;
      result.precisionClass = current > scaled.precision ? 'stat-up' : 'stat-down';
    }
  }

  return result;
}

function wrapStat(value, cls) {
  return cls ? `<span class="${cls}">${value}</span>` : `${value}`;
}

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

export function formatAction(skill, actorCtx) {
  const { scaled, power, powerClass } = resolveSkillDisplay(skill, actorCtx);
  if (skill.type === SKILL_TYPES.ATTACK) {
    const icon = scaled.stun ? '⚡' : '🗡️';
    return skill.customEffect ? `${icon} (variable)` : `${icon} (${wrapStat(power, powerClass)})`;
  }
  if (skill.type === SKILL_TYPES.CURA) return `💚 (${wrapStat(power, powerClass)})`;
  if (skill.type === SKILL_TYPES.DEFENSE) return `🛡️ (${wrapStat(power, powerClass)})`;
  if (skill.type === SKILL_TYPES.BUFF) {
    const sign = skill.value > 0 ? '+' : '-';
    return `✨ (${buffEmoji(skill.stat)}${sign})`;
  }
  return '';
}

export function formatSkillStats(skill, actorCtx) {
  const { scaled, power, powerClass } = resolveSkillDisplay(skill, actorCtx);
  if (skill.type === SKILL_TYPES.ATTACK) {
    let effects = '';
    if (scaled.stun) effects += '⚡';
    if (scaled.herida) effects += '🩸';
    const powerText = skill.customEffect ? 'variable' : wrapStat(power, powerClass);
    return `⚔️${effects ? ' ' + effects : ''} ${powerText}`;
  }
  if (skill.type === SKILL_TYPES.CURA) return `💚 ${wrapStat(power, powerClass)}`;
  if (skill.type === SKILL_TYPES.DEFENSE) return `🛡️ ${wrapStat(power, powerClass)}`;
  if (skill.type === SKILL_TYPES.BUFF) {
    const emoji = buffEmoji(skill.stat);
    const isDebuff = skill.target === 'enemy';
    const arrow = isDebuff ? '↓' : skill.value > 0 ? '↑' : '—';
    let val = '';
    if (skill.stat === BUFF_STATS.DEFENSE) {
      val = skill.value < 0 ? '½' : `${skill.value}`;
    } else if (skill.stat === BUFF_STATS.PRECISION || skill.stat === BUFF_STATS.EVASION) {
      val = '';
    } else {
      const pct = (Math.abs(skill.value) * 100).toFixed(0);
      val = skill.value >= 1 ? '100%' : `${pct}%`;
    }
    return `✨ (${emoji} ${val} ${arrow} · ${skill.duration ?? 3}t)`;
  }
  return '';
}

export function powerLabel(skill) {
  if (skill.type === SKILL_TYPES.BUFF) return skill.value;
  if (skill.customEffect) return 'variable';
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

export function describeSkill(skill, actorCtx) {
  if (skill.description) return skill.description;

  const { scaled, power, precision, powerClass, precisionClass } = resolveSkillDisplay(skill, actorCtx);
  if (skill.type === SKILL_TYPES.ATTACK) {
    let text = `Inflige ${wrapStat(power, powerClass)} pts de daño`;
    text += `<br>${wrapStat(precision, precisionClass)}% de posibilidad de exito`;
    const effects = [];
    if (scaled.stun) effects.push('"stun" (dura un turno)');
    if (scaled.herida) effects.push('"sangrado" (hasta ser curado)');
    if (effects.length) {
      text += `<br>Si impacta, causa efecto ${effects.join(' y ')}`;
    }
    return text;
  }
  if (skill.type === SKILL_TYPES.CURA) {
    let text = `Restaura ${wrapStat(power, powerClass)} pts de vida a un aliado`;
    text += `<br>${wrapStat(precision, precisionClass)}% de exito`;
    text += '<br>Anula efecto "sangrado"';
    return text;
  }
  if (skill.type === SKILL_TYPES.DEFENSE) {
    return `Reduce el daño recibido en ${wrapStat(power, powerClass)} pts<br>Dura solo este turno`;
  }
  if (skill.type === SKILL_TYPES.BUFF) {
    const duration = skill.duration ?? 3;
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
      text += `<br>${wrapStat(precision, precisionClass)}% de exito`;
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
      text += `<br>${wrapStat(precision, precisionClass)}% de exito`;
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
      text += `<br>${wrapStat(precision, precisionClass)}% de exito`;
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
      text += `<br>${wrapStat(precision, precisionClass)}% de exito`;
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

/**
 * Texto compacto de un valor de buff para la vista previa de mejora.
 *
 * @param {Object} skill
 * @param {number} value
 * @returns {string}
 */
function buffValueText(skill, value) {
  const sign = value < 0 ? '-' : '+';
  const abs = Math.abs(value);
  if (skill.stat === BUFF_STATS.DEFENSE) return value < 0 ? '½' : `+${value}`;
  if (skill.stat === BUFF_STATS.EVASION) return value === 0 ? '0' : `${sign}${abs}`;
  return abs >= 1 ? `${sign}100%` : `${sign}${Math.round(abs * 100)}%`;
}

/**
 * Describe la mejora que aplicaría el siguiente nivel de una habilidad,
 * mostrando solo los valores que cambian. Ej: `daño 15 → 20 · duración 3 → 4t`.
 * Devuelve cadena vacía si no hay cambios.
 *
 * @param {Object} skill
 * @returns {string} HTML compacto (sin prefijo)
 */
export function describeUpgrade(skill) {
  const current = getSkillScaledStats(skill);
  const next = getSkillScaledStats(simulateUpgrade(skill));
  const parts = [];

  const powerWord = skill.type === SKILL_TYPES.ATTACK ? 'daño'
    : skill.type === SKILL_TYPES.CURA ? 'cura'
    : skill.type === SKILL_TYPES.DEFENSE ? 'defensa'
    : null;

  if (powerWord && !skill.customEffect && current.power !== next.power) {
    parts.push(`${powerWord} ${current.power} → ${next.power}`);
  }
  if (current.precision !== next.precision) {
    parts.push(`precisión ${current.precision} → ${next.precision}`);
  }
  if (skill.type === SKILL_TYPES.BUFF) {
    if (current.value !== next.value) {
      const label = skill.stat === BUFF_STATS.DEFENSE ? 'defensa' : 'valor';
      parts.push(`${label} ${buffValueText(skill, current.value)} → ${buffValueText(skill, next.value)}`);
    }
    if ((current.duration ?? 3) !== (next.duration ?? 3)) {
      parts.push(`duración ${current.duration ?? 3} → ${next.duration ?? 3}t`);
    }
    if (current.scope && next.scope && current.scope !== next.scope) {
      const word = v => (v === 'all' ? 'todos' : 'uno');
      parts.push(`alcance: ${word(current.scope)} → ${word(next.scope)}`);
    }
  }
  if (current.stun !== next.stun) parts.push(next.stun ? 'gana ⚡' : 'pierde ⚡');
  if (current.herida !== next.herida) parts.push(next.herida ? 'gana 🩸' : 'pierde 🩸');

  return parts.join(' · ');
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
