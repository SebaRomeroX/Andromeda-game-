/// <reference path="../src/models.js" />

import { createCharacter, createSkill } from '../src/models.js';

const characters = [
  createCharacter({
    name: "Paladin",
    image: "assets/images/gorlag.png",
    hp: 120,
    evasion: 5,
    skills: [
      createSkill({ name: "Corte grave",           type: "attack",  power: 22, precision: 80, aparicion: 70, herida: true }),
      createSkill({ name: "Golpe de escudo",        type: "attack",  power: 10, precision: 80, aparicion: 8,  stun: true  }),
      createSkill({ name: "Plegaria",               type: "cura",    power: 15, precision: 95, aparicion: 4                   }),
      createSkill({ name: "Postura Defensiva",      type: "defense", power: 15, precision: 95, aparicion: 6                   }),
      createSkill({ name: "Furia de batalla",       type: "buff",    target: "self",  stat: "attack",    value: 0.10,  precision: 95, aparicion: 70 }),
      createSkill({ name: "Intimidación",           type: "buff",    target: "enemy", stat: "attack",    value: -0.10, precision: 90, aparicion: 5  }),
      createSkill({ name: "Proteccion Divina",      type: "buff",    target: "self",  stat: "defense",   value: 10,    precision: 95, aparicion: 7  }),
      createSkill({ name: "Oración de Precisión",   type: "buff",    target: "self",  stat: "precision", value: 100,   precision: 90, aparicion: 50 }),
      createSkill({ name: "Viento Veloz",           type: "buff",    target: "self",  stat: "evasion",   value: 50,    precision: 90, aparicion: 500}),
    ]
  }),
  createCharacter({
    name: "Mortis, el Nigromante",
    image: "assets/images/mortis.png",
    hp: 90,
    evasion: 8,
    skills: [
      createSkill({ name: "Drenar Vida",            type: "attack",  power: 2,  precision: 65, aparicion: 70, herida: true }),
      createSkill({ name: "Golpe de Baculo",        type: "attack",  power: 12, precision: 85, aparicion: 4,  stun: true  }),
      createSkill({ name: "Armadura de Hueso",      type: "defense", power: 10, precision: 95, aparicion: 6                   }),
      createSkill({ name: "Vision de muerte",       type: "buff",    target: "enemy", stat: "attack",    value: -0.20, precision: 90, aparicion: 5 }),
      createSkill({ name: "Recubrimiento Calaverico",type: "buff",   target: "self",  stat: "defense",   value: 15,    precision: 95, aparicion: 7 }),
      createSkill({ name: "Maldición de Ceguera",   type: "buff",    target: "enemy", stat: "precision", value: -0.5,  precision: 85, aparicion: 5 }),
      createSkill({ name: "Pesadilla Abrumadora",   type: "buff",    target: "enemy", stat: "evasion",   value: 0,     precision: 85, aparicion: 2 }),
    ]
  }),
  createCharacter({
    name: 'Agrima',
    image: 'assets/images/gorlag.png',
    hp: 200,
    evasion: 2,
    skills: [
      createSkill({ name: 'Corte demencial', type: 'attack',   power: 55,   precision: 80, aparicion: 30 }),
      createSkill({ name: 'Tajo',         type: 'attack',      power: 35,   precision: 80, aparicion: 90 }),
      createSkill({ name: 'Perforante', type: 'attack',        power: 15,   precision: 90, aparicion: 20, herida: true }),
      createSkill({ name: "Rabia",       type: "buff",       target: "self", stat: "attack", value: 0.10,  precision: 95, aparicion: 50 }),
    ]
  })
];

export default characters;
