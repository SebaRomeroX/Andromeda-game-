/**
 * @file Modelos de datos para personajes y habilidades
 * @description Define las estructuras de datos y funciones factory
 * para crear personajes y habilidades de forma consistente.
 * Al diseñar un personaje nuevo, consultá los @typedef como referencia
 * de los campos obligatorios y opcionales.
 */

/**
 * Tipo de habilidad
 * @typedef {"attack"|"cura"|"defense"|"buff"} SkillType
 */

/**
 * Objetivo de un buff
 * @typedef {"self"|"enemy"} BuffTarget
 */

/**
 * Estadística afectada por un buff
 * @typedef {"attack"|"defense"|"precision"|"evasion"} BuffStat
 */

/**
 * Rol del personaje — determina qué posición puede ocupar en el equipo
 * @typedef {"tanque"|"asesino"|"rango"|"soporte"} Role
 */

const ROLES = ['tanque', 'asesino', 'rango', 'soporte'];

export const ROLE_BY_INDEX = ROLES;

export const ATTACK_ROUTES = {
  tanque:  [[0, 1, 2, 3]],
  asesino: [[0, 2], [1, 3]],
  rango:   [[0, 1], [2], [3]],
  soporte: 'free'
};

/**
 * Habilidad (Skill) — estructura según tipo
 *
 * | Campo        | attack | cura | defense | buff |
 * |--------------|--------|------|---------|------|
 * | name         | ✅     | ✅   | ✅      | ✅   |
 * | type         | "attack"| "cura"| "defense"| "buff"|
 * | precision    | ✅     | ✅   | ✅      | ✅   |
 * | aparicion    | ✅     | ✅   | ✅      | ✅   |
 * | power        | ✅     | ✅   | ✅      | —    |
 * | stun         | ◻️     | —    | —       | —    |
 * | herida       | ◻️     | —    | —       | —    |
 * | target       | —      | —    | —       | ✅   |
 * | stat         | —      | —    | —       | ✅   |
 * | value        | —      | —    | —       | ✅   |
 *
 * ✅ = obligatorio, ◻️ = opcional, — = no aplica
 *
 * @typedef {Object} Skill
 * @property {string} name
 * @property {SkillType} type
 * @property {number} precision - Probabilidad de acierto (0-100)
 * @property {number} aparicion - Peso para selección aleatoria (mayor = más frecuente)
 * @property {number} [power] - Daño (attack), cura (cura), o defensa (defense)
 * @property {boolean} [stun] - Aturde al rival (solo attack)
 * @property {boolean} [herida] - Hiere al rival (solo attack)
 * @property {BuffTarget} [target] - Objetivo del buff (solo buff)
 * @property {BuffStat} [stat] - Estadística a modificar (solo buff)
 * @property {number} [value] - Magnitud del buff (solo buff)
 * @property {number} [level=1] - Nivel de la habilidad (mejorable en el campamento)
 */

/**
 * Personaje (Character)
 *
 * @typedef {Object} Character
 * @property {string} name
 * @property {string} image - Ruta a la imagen (ej: "gorlag.png")
 * @property {number} hp - Puntos de vida máximos
 * @property {number} evasion - Evasión base (0-100)
 * @property {Skill[]} skills - Habilidades del personaje
 * @property {Role} role - Rol que determina su posición en el equipo
 * @property {number} [level=1] - Nivel del personaje (sube en los campamentos)
 */

/**
 * Crea un objeto Skill con defaults y validación.
 *
 * @param {Object} opts
 * @param {string} opts.name
 * @param {SkillType} opts.type
 * @param {number} [opts.precision=80]
 * @param {number} [opts.aparicion=1]
 * @param {number} [opts.power]     - Requerido para attack/cura/defense
 * @param {boolean} [opts.stun]     - Solo attack
 * @param {boolean} [opts.herida]   - Solo attack
 * @param {BuffTarget} [opts.target] - Solo buff
 * @param {BuffStat} [opts.stat]    - Solo buff
 * @param {number} [opts.value]     - Solo buff
 * @param {number} [opts.level=1]   - Nivel de la habilidad
 * @returns {Skill}
 */
export function createSkill({ name, type, precision = 80, aparicion = 1, power, stun, herida, target, stat, value, level = 1 }) {
  if (!name) throw new Error('createSkill: name es requerido');
  if (!type) throw new Error('createSkill: type es requerido');

  const base = { name, type, precision, aparicion, level };

  switch (type) {
    case 'attack':
      return { ...base, power: power ?? 10, stun: !!stun, herida: !!herida };
    case 'cura':
      return { ...base, power: power ?? 10 };
    case 'defense':
      return { ...base, power: power ?? 10 };
    case 'buff':
      return { ...base, target: target ?? 'self', stat: stat ?? 'attack', value: value ?? 0 };
    default:
      throw new Error(`createSkill: tipo desconocido "${type}". Usá: attack, cura, defense, buff`);
  }
}

/**
 * Crea un objeto Character con defaults y validación.
 *
 * @param {Object} opts
 * @param {string} opts.name
 * @param {string} opts.image
 * @param {number} [opts.hp=100]
 * @param {number} [opts.evasion=5]
 * @param {Skill[]} [opts.skills=[]]
 * @param {Role} opts.role
 * @returns {Character}
 */
export function createCharacter({ name, image, hp = 100, evasion = 5, skills = [], role, level = 1 }) {
  if (!name) throw new Error('createCharacter: name es requerido');
  if (!image) throw new Error('createCharacter: image es requerido');
  if (!role || !ROLES.includes(role)) {
    throw new Error(`createCharacter: role debe ser uno de: ${ROLES.join(', ')}`);
  }

  return { name, image, hp, evasion, skills, role, level };
}

/**
 * Calcula los stats efectivos de un personaje según su nivel.
 *
 * @param {Character} char
 * @returns {{ hp: number, evasion: number }}
 */
const ROLE_LEVEL_SCALING = {
  tanque: { hp: 15, evasion: 0 },
  asesino: { hp: 8, evasion: 1 },
  rango: { hp: 7, evasion: 2 },
  soporte: { hp: 4, evasion: 1 }
};

export function getLevelStats(char) {
  const scale = ROLE_LEVEL_SCALING[char.role] ?? { hp: 0, evasion: 0 };
  const levels = Math.max(0, (char.level ?? 1) - 1);
  return {
    hp: char.hp + levels * scale.hp,
    evasion: char.evasion + levels * scale.evasion
  };
}

/**
 * Sube de nivel una habilidad.
 *
 * El escalado de los stats según el nivel se define en `getSkillScaledStats`.
 *
 * @param {Skill} skill
 * @returns {Skill}
 */
export function upgradeSkill(skill) {
  skill.level = (skill.level ?? 1) + 1;
  return skill;
}

/**
 * Retorna los stats efectivos de una habilidad según su nivel.
 *
 * Escalado actual: el power de attack/cura/defense aumenta +5 por cada nivel
 * por encima de 1. precision y value quedan iguales.
 *
 * @param {Skill} skill
 * @returns {{ power?: number, precision: number, value?: number, level: number }}
 */
export function getSkillScaledStats(skill) {
  const level = skill.level ?? 1;
  const hasPower = skill.type === 'attack' || skill.type === 'cura' || skill.type === 'defense';
  const power = hasPower ? skill.power + (level - 1) * 5 : skill.power;
  return {
    power,
    precision: skill.precision,
    value: skill.value,
    level
  };
}
