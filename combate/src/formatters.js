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
  const prec = `${scaled.precision}% prec`;
  if (skill.type === SKILL_TYPES.ATTACK) return `⚔️ ${scaled.power} · ${prec}`;
  if (skill.type === SKILL_TYPES.CURA) return `💚 ${scaled.power} · ${prec}`;
  if (skill.type === SKILL_TYPES.DEFENSE) return `🛡️ ${scaled.power} · ${prec}`;
  if (skill.type === SKILL_TYPES.BUFF) {
    const emoji = buffEmoji(skill.stat);
    const sign = skill.value > 0 ? '+' : '';
    if (skill.stat === BUFF_STATS.DEFENSE) return `${emoji} ${sign}${skill.value} · ${prec}`;
    if (skill.stat === BUFF_STATS.PRECISION) {
      const displayVal = skill.value >= 1 ? '100%' : '↓';
      return `${emoji} ${displayVal} · ${prec}`;
    }
    if (skill.stat === BUFF_STATS.EVASION) {
      const displayVal = skill.value === 0 ? '0' : `${sign}${skill.value}`;
      return `${emoji} ${displayVal} · ${prec}`;
    }
    const pct = (Math.abs(skill.value) * 100).toFixed(0);
    return `${emoji} ${sign}${pct}% · ${prec}`;
  }
  return prec;
}

export function powerLabel(skill) {
  if (skill.type === SKILL_TYPES.BUFF) return skill.value;
  return getSkillScaledStats(skill).power;
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
