/// <reference path="../src/models.js" />

import { createCharacter, createSkill } from '../src/models.js';

const characters = [
  createCharacter({
    name: "Sima",
    image: "assets/images/Sima la audaz.jpg",
    hp: 120,
    evasion: 10,
    role: "asesino",
    skills: [
      createSkill({ name: "Estocada",           type: "attack",  power: 28, precision: 85, aparicion: 70 }),
      createSkill({ name: "Corte grave",        type: "attack",  power: 18, precision: 85, aparicion: 70, herida: true }),
      createSkill({ name: "Golpe de escudo",    type: "attack",  power: 10, precision: 90, aparicion: 20,  stun: true  }),
      createSkill({ name: "Vendaje",            type: "cura",    power: 5, precision: 99, aparicion: 20   }),
      createSkill({ name: "Postura Defensiva",  type: "defense", power: 35, precision: 95, aparicion: 40   }),
      createSkill({ name: "Furia de batalla",   type: "buff",    target: "self",  stat: "attack",    value: 0.10,  precision: 99, aparicion: 50 }),
      createSkill({ name: "Proteccion Divina",  type: "buff",    target: "self",  stat: "defense",   value: 10,    precision: 99, aparicion: 50  }),
    ]
  }),
  createCharacter({
    name: "La druida",
    image: "assets/images/Druida.jpg",
    hp: 90,
    evasion: 7,
    role: "soporte",
    skills: [
      createSkill({ name: "Ataque compasivo",       type: "attack",  power: 12, precision: 80, aparicion: 10 }),
      createSkill({ name: "Medicina druidica",      type: "cura",    power: 35, precision: 95, aparicion: 70   }),
      createSkill({ name: "Magia curativa",         type: "cura",    power: 20, precision: 95, aparicion: 90   }),
      createSkill({ name: "Proteccion Divina",      type: "buff",    target: "self",  stat: "defense",   value: 10,    precision: 95, aparicion: 50  }),
    ]
  }),
  createCharacter({
    name: "Urbol",
    image: "assets/images/Urbol.jpg",
    hp: 150,
    evasion: 5,
    role: "tanque",
    skills: [
      createSkill({ name: "Debastador",           type: "attack",  power: 42, precision: 70, aparicion: 70 }),
      createSkill({ name: "Estocada penetrante",  type: "attack",  power: 25, precision: 80, aparicion: 70, herida: true }),
      createSkill({ name: "Puño directo",         type: "attack",  power: 15, precision: 90, aparicion: 20,  stun: true  }),
      createSkill({ name: "Postura Defensiva",    type: "defense", power: 35, precision: 95, aparicion: 20   }),
      createSkill({ name: "Rugido",               type: "buff",    target: "enemy",  stat: "attack",    value: -0.2,  precision: 95, aparicion: 10 }),
    ]
  }),
  createCharacter({
    name: "Sacerdotiza oscura",
    image: "assets/images/Sacerdotiza oscura.jpg",
    hp: 50,
    evasion: 8,
    role: "rango",
    skills: [
      createSkill({ name: "Ataque mental",      type: "attack",  power: 6,  precision: 75, aparicion: 10,}),
      createSkill({ name: "Vision de muerte",       type: "buff",    target: "enemy", stat: "attack",    value: -0.20, precision: 90, aparicion: 5 }),
      createSkill({ name: "Recubrimiento Calaverico",type: "buff",   target: "self",  stat: "defense",   value: 15,    precision: 95, aparicion: 7 }),
    ]
  }),
  createCharacter({
    name: 'Narada',
    image: 'assets/images/Narada.jpg',
    hp: 160,
    evasion: 2,
    role: "tanque",
    skills: [
      createSkill({ name: 'Corte demencial', type: 'attack',   power: 25,   precision: 80, aparicion: 30 }),
      createSkill({ name: 'Ataque fugaz',    type: 'attack',   power: 18,   precision: 90, aparicion: 90 }),
      createSkill({ name: 'Tajo',           type: 'attack',    power: 15,   precision: 85, aparicion: 50, herida: true }),
      createSkill({ name: "Rabia",          type: "buff",      target: "self", stat: "attack", value: 0.10,  precision: 95, aparicion: 50 }),
    ]
  }),
  createCharacter({
    name: "Akay",
    image: "assets/images/Akay.jpg",
    hp: 75,
    evasion: 10,
    role: "asesino",
    skills: [
      createSkill({ name: "Corte",        type: "attack",  power: 6,    precision: 80, aparicion: 70 }),
      createSkill({ name: "Puñalada",        type: "attack",  power: 10, precision: 90, aparicion: 20 }),
      createSkill({ name: "Concentracion",   type: "buff",    target: "self",  stat: "precision", value: 100,   precision: 90, aparicion: 50 }),
    ]
  }),
  createCharacter({
    name: "La bruja del paramo",
    image: "assets/images/La bruja del paramo.jpg",
    hp: 90,
    evasion: 8,
    role: "rango",
    skills: [
      createSkill({ name: "Ataque mental",      type: "attack",  power: 10,  precision: 75, aparicion: 10,}),
      createSkill({ name: "Vision de muerte",   type: "buff",    target: "enemy", stat: "attack",    value: -0.20,  precision: 90, aparicion: 5 }),
      createSkill({ name: "Espejismo",          type: "buff",   target: "enemy",  stat: "precision",  value: 0.5,   precision: 95, aparicion: 7 }),
    ]
  }),

];

export default characters;
