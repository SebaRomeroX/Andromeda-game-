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
 * @typedef {"self"|"ally"|"enemy"} BuffTarget
 */

/**
 * Alcance de un buff — determina cuántos objetivos afecta
 * @typedef {"one"|"all"} BuffScope
 */

/**
 * Estadística afectada por un buff
 * @typedef {"attack"|"defense"|"precision"|"evasion"} BuffStat
 */

/**
 * Rol del personaje — determina qué posición puede ocupar en el equipo
 * @typedef {"tanque"|"asesino"|"rango"|"soporte"} Role
 */

import { ROLES, SKILL_TYPES, BUFF_STATS } from './constants.js';

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
 * | scope        | —      | —    | —       | ◻️   |
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
 * @property {BuffScope} [scope="one"] - one = un objetivo, all = todos los válidos (solo buff)
 * @property {BuffStat} [stat] - Estadística a modificar (solo buff)
 * @property {number} [value] - Magnitud del buff (solo buff)
 * @property {number} [level=1] - Nivel de la habilidad (mejorable en el campamento)
 * @property {string} [description] - Descripción de la habilidad (para habilidades especiales)
 * @property {Function} [customEffect] - Función de efecto personalizado que reemplaza el cálculo por defecto
 */

/**
 * Guía de valores para skills de tipo buff (campo `value`)
 *
 * Stat              | Tipo      | value            | Efecto
 * ---------------   |-----------|------------------|----------------------------------------
 * attack (buff)     | porcentaje| 0.05 a 0.30      | +5% a +30% de daño (multiplicador)
 * attack (debuff)   | porcentaje| -0.05 a -0.20    | -5% a -20% de daño (multiplicador)
 * defense (buff)    | plano     | 3 a 15           | Puntos de defensa añadidos
 * defense (debuff)  | auto      | -1               | Reduce (defensa_skill + buff_defensa) a la mitad
 * precision (buff)  | especial  | 1                | Precisión = 100% (siempre acierta)
 * precision (debuff)| gradación | 0.05 a 0.5       | Reduce precisión: basePrecision * (1 - value)
 * evasion (buff)    | plano     | 5 a 20           | Puntos sumados a evasion base
 * evasion (debuff)  | especial  | 0                | Evasion = 0 (nunca esquiva)
 *
 * Notas:
 * - attack usa multiplicador: daño final = power * (1 + value)
 * - defense usa suma plana: defensa final = defensa_base + sum(buff_values)
 * - defense debuff auto-halve: si hay buff negativo de defense activo, la defensa
 *   total se reduce a la mitad: (defSkill + defBuffs) / 2
 * - precision debuff gradación: value 0.1 = -10%, value 0.5 = -50%
 * - precision y evasion son exclusivos (no apilan): solo queda el último buff del mismo stat
 */

/**
 * ## levelBonuses — Escalado personalizado por habilidad
 *
 * Cada habilidad puede definir `levelBonuses`, un objeto donde las claves
 * son los niveles (2, 3, 4...) y los valores son los cambios incrementales
 * que se acumulan al subir de nivel.
 *
 * Propiedades mejorables por tipo:
 *
 * | Tipo     | power | precision | stun | herida | value | duration | scope |
 * |----------|-------|-----------|------|--------|-------|----------|-------|
 * | attack   | ✅    | ✅        | ✅   | ✅     | —     | —        | —     |
 * | defense  | ✅    | —         | —    | —      | —     | —        | —     |
 * | cura     | ✅    | —         | —    | —      | —     | —        | —     |
 * | buff     | —     | —         | —    | —      | ✅    | ✅       | ✅    |
 *
 * Los bonuses se suman incrementalmente nivel a nivel.
 * Si una habilidad tiene levelBonuses, reemplaza el escalado por defecto (+5 power/nivel).
 *
 * Ejemplo attack — "Devastador":
 *   levelBonuses: {
 *     2: { power: 5 },        // +5 daño en nivel 2
 *     3: { power: 8 },        // +8 daño más en nivel 3 (total +13)
 *     4: { stun: true }       // gana efecto stun en nivel 4
 *   }
 *
 * Ejemplo buff — "Proteccion Divina":
 *   levelBonuses: {
 *     2: { value: 15 },       // +15 defensa en nivel 2
 *     3: { scope: 'all' },    // pasa a afectar a todo el equipo
 *     4: { duration: 8 }      // dura 8 turnos en nivel 4
 *   }
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
 * @property {Skill[]} learnableSkills - Habilidades que puede aprender en campamentos
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
 * @param {Object} [opts.levelBonuses] - Cambios incrementales por nivel (reemplaza escalado por defecto)
 * @param {string} [opts.description] - Descripción de la habilidad (para habilidades especiales)
 * @param {Function} [opts.customEffect] - Función de efecto personalizado (actor, target, skill, ctx) => outcome
 * @returns {Skill}
 */
export function createSkill({ name, type, precision = 80, aparicion = 1, power, stun, herida, target, scope, stat, value, duration = 3, level = 1, levelBonuses, description, customEffect }) {
  if (!name) throw new Error('createSkill: name es requerido');
  if (!type) throw new Error('createSkill: type es requerido');

  const base = { name, type, precision, aparicion, level };
  if (levelBonuses) base.levelBonuses = levelBonuses;
  if (description) base.description = description;
  if (customEffect) base.customEffect = customEffect;

  switch (type) {
    case SKILL_TYPES.ATTACK:
      return { ...base, power: power ?? 10, stun: !!stun, herida: !!herida };
    case SKILL_TYPES.CURA:
      return { ...base, power: power ?? 10 };
    case SKILL_TYPES.DEFENSE:
      return { ...base, power: power ?? 10 };
    case SKILL_TYPES.BUFF:
      return { ...base, target: target ?? 'self', scope: scope ?? 'one', stat: stat ?? BUFF_STATS.ATTACK, value: value ?? 0, duration: Math.min(10, Math.max(1, Math.round(duration))) };
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
export function createCharacter({ name, image, hp = 100, evasion = 5, skills = [], learnableSkills = [], role, level = 1 }) {
  if (!name) throw new Error('createCharacter: name es requerido');
  if (!image) throw new Error('createCharacter: image es requerido');
  if (!role || !ROLES.includes(role)) {
    throw new Error(`createCharacter: role debe ser uno de: ${ROLES.join(', ')}`);
  }

  return { name, image, hp, evasion, skills, learnableSkills, role, level };
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
 * Sube de nivel una habilidad (máximo nivel 4).
 *
 * El escalado de los stats según el nivel se define en `getSkillScaledStats`.
 * Si la habilidad tiene `levelBonuses`, esos cambios reemplazan el escalado por defecto.
 *
 * @param {Skill} skill
 * @returns {Skill}
 */
export function upgradeSkill(skill) {
  skill.level = Math.min(4, (skill.level ?? 1) + 1);
  if (skill.type === SKILL_TYPES.BUFF && !skill.levelBonuses) {
    skill.duration = Math.min(10, (skill.duration ?? 3) + 1);
  }
  return skill;
}

/**
 * Devuelve una copia de la habilidad tal como quedaría tras `upgradeSkill`,
 * sin mutar el original. Sirve para previsualizar la mejora en el menú
 * del campamento.
 *
 * @param {Skill} skill
 * @returns {Skill} copia con el siguiente nivel aplicado
 */
export function simulateUpgrade(skill) {
  const next = { ...skill, level: Math.min(4, (skill.level ?? 1) + 1) };
  if (next.type === SKILL_TYPES.BUFF && !next.levelBonuses) {
    next.duration = Math.min(10, (next.duration ?? 3) + 1);
  }
  return next;
}

/**
 * Retorna los stats efectivos de una habilidad según su nivel.
 *
 * Si la habilidad tiene `levelBonuses`, acumula los cambios incrementales
 * nivel a nivel. Si no, aplica el escalado por defecto:
 * attack/cura/defense → +5 power por nivel.
 *
 * @param {Skill} skill
 * @returns {{ power?: number, precision: number, value?: number, stun?: boolean, herida?: boolean, scope?: string, duration?: number, level: number }}
 */
export function getSkillScaledStats(skill) {
  const level = skill.level ?? 1;

  if (skill.levelBonuses && Object.keys(skill.levelBonuses).length > 0) {
    const result = {
      power: skill.power,
      precision: skill.precision,
      value: skill.value,
      stun: skill.stun,
      herida: skill.herida,
      scope: skill.scope,
      duration: skill.duration,
      level
    };

    for (let lv = 2; lv <= level; lv++) {
      const bonus = skill.levelBonuses[lv];
      if (!bonus) continue;
      result.power     = (result.power ?? 0) + (bonus.power ?? 0);
      result.precision = (result.precision ?? 0) + (bonus.precision ?? 0);
      result.value     = (result.value ?? 0) + (bonus.value ?? 0);
      if (bonus.stun !== undefined)     result.stun = bonus.stun;
      if (bonus.herida !== undefined)   result.herida = bonus.herida;
      if (bonus.scope !== undefined)    result.scope = bonus.scope;
      if (bonus.duration !== undefined) result.duration = bonus.duration;
    }

    return result;
  }

  const hasPower = skill.type === SKILL_TYPES.ATTACK || skill.type === SKILL_TYPES.CURA || skill.type === SKILL_TYPES.DEFENSE;
  const power = hasPower ? skill.power + (level - 1) * 5 : skill.power;
  return {
    power,
    precision: skill.precision,
    value: skill.value,
    duration: skill.duration,
    stun: skill.stun,
    herida: skill.herida,
    level
  };
}
