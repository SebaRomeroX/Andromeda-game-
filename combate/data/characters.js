/// <reference path="../src/models.js" />

import { createCharacter, createSkill } from '../src/models.js';

const characters = [
  createCharacter({
    name: "Sima la audaz",
    image: "assets/images/Sima la audaz.jpg",
    hp: 120,
    evasion: 5,
    skills: [
      createSkill({ name: "Corte grave",           type: "attack",  power: 22, precision: 80, aparicion: 70, herida: true }),
      createSkill({ name: "Golpe de escudo",        type: "attack",  power: 10, precision: 90, aparicion: 8,  stun: true  }),
      createSkill({ name: "Plegaria",               type: "cura",    power: 15, precision: 95, aparicion: 4                   }),
      createSkill({ name: "Postura Defensiva",      type: "defense", power: 35, precision: 95, aparicion: 6                   }),
      createSkill({ name: "Furia de batalla",       type: "buff",    target: "self",  stat: "attack",    value: 0.10,  precision: 95, aparicion: 7 }),
      createSkill({ name: "Proteccion Divina",      type: "buff",    target: "self",  stat: "defense",   value: 10,    precision: 95, aparicion: 7  }),
      createSkill({ name: "Oración de Precisión",   type: "buff",    target: "self",  stat: "precision", value: 100,   precision: 90, aparicion: 5 }),
    ]
  }),
  createCharacter({
    name: "Sacerdotiza oscura",
    image: "assets/images/Sacerdotiza oscura.jpg",
    hp: 90,
    evasion: 8,
    skills: [
      createSkill({ name: "Drenar Vida",            type: "attack",  power: 20,  precision: 75, aparicion: 7,}),
      createSkill({ name: "Vision de muerte",       type: "buff",    target: "enemy", stat: "attack",    value: -0.20, precision: 90, aparicion: 5 }),
      createSkill({ name: "Recubrimiento Calaverico",type: "buff",   target: "self",  stat: "defense",   value: 15,    precision: 95, aparicion: 7 }),
    ]
  }),
  createCharacter({
    name: 'Narada',
    image: 'assets/images/Narada.jpg',
    hp: 140,
    evasion: 2,
    skills: [
      createSkill({ name: 'Corte demencial', type: 'attack',   power: 35,   precision: 60, aparicion: 30 }),
      createSkill({ name: 'Tajo',         type: 'attack',      power: 15,   precision: 70, aparicion: 90, herida: true }),
      createSkill({ name: "Rabia",       type: "buff",       target: "self", stat: "attack", value: 0.10,  precision: 95, aparicion: 50 }),
    ]
  })
];

export default characters;
