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
 * @returns {Skill}
 */
export function createSkill({ name, type, precision = 80, aparicion = 1, power, stun, herida, target, stat, value }) {
  if (!name) throw new Error('createSkill: name es requerido');
  if (!type) throw new Error('createSkill: type es requerido');

  const base = { name, type, precision, aparicion };

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
 * @returns {Character}
 */
export function createCharacter({ name, image, hp = 100, evasion = 5, skills = [] }) {
  if (!name) throw new Error('createCharacter: name es requerido');
  if (!image) throw new Error('createCharacter: image es requerido');

  return { name, image, hp, evasion, skills };
}
