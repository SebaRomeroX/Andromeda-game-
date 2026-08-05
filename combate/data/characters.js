/// <reference path="../src/models.js" />

import { createCharacter, createSkill } from '../src/models.js';

const characters = [
  createCharacter({
    name: "Sima",
    image: "assets/images/Sima.jpg",
    hp: 120,
    evasion: 10,
    role: "asesino",
    skills: [
      createSkill({ name: "EXCALIBUR",          type: "attack",  power: 1000, precision: 1000,  aparicion: 1000 }), // SKILL PARA AGIlizAR TESTEO DE JUEGO // NO ELIMINAR
      createSkill({ name: "Estocada",           type: "attack",  power: 28,   precision: 85,    aparicion: 70 }),
      createSkill({ name: "Corte grave",        type: "attack",  power: 18,   precision: 85,    aparicion: 70,  herida: true }),
      createSkill({ name: "Golpe de escudo",    type: "attack",  power: 10,   precision: 90,    aparicion: 20,  stun: true  }),
      createSkill({ name: "Vendaje",            type: "cura",    power: 5,    precision: 99,    aparicion: 20   }),
      createSkill({ name: "Postura Defensiva",  type: "defense", power: 35,   precision: 95,    aparicion: 40   }),
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
      createSkill({ name: "Ataque compasivo",    type: "attack",  power: 10,   precision: 80,     aparicion: 10 }),
      createSkill({ name: "Medicina druidica",   type: "cura",    power: 5,    precision: 95,     aparicion: 70   }),
      createSkill({ name: "Magia curativa",      type: "cura",    power: 10,   precision: 95,     aparicion: 90   }),
      createSkill({ name: "Proteccion Divina",   type: "buff",    target: "self",  stat: "defense",   value: 10,    precision: 95, aparicion: 50  }),
    ]
  }),
  createCharacter({
    name: "Urbol",
    image: "assets/images/Urbol.jpg",
    hp: 150,
    evasion: 5,
    role: "tanque",
    skills: [
      createSkill({ name: "Debastador",           type: "attack",  power: 42,   precision: 70,    aparicion: 70 }),
      createSkill({ name: "Estocada penetrante",  type: "attack",  power: 25,   precision: 80,    aparicion: 70,  herida: true }),
      createSkill({ name: "Puño directo",         type: "attack",  power: 15,   precision: 90,    aparicion: 20,  stun: true  }),
      createSkill({ name: "Postura Defensiva",    type: "defense", power: 35,   precision: 95,    aparicion: 20   }),
      createSkill({ name: "Rugido",               type: "buff",    target: "enemy",  stat: "attack",    value: -0.2,  precision: 95, aparicion: 10 }),
    ]
  }),
  createCharacter({
    name: "Sacerdotiza oscura",
    image: "assets/images/Sacerdotiza.jpg",
    hp: 50,
    evasion: 8,
    role: "rango",
    skills: [
      createSkill({ name: "Ataque mental",            type: "attack",  power: 5,    precision: 75, aparicion: 10,}),
      createSkill({ name: "Vision de muerte",         type: "buff",    target: "enemy", stat: "attack",    value: -0.10, precision: 90, aparicion: 5 }),
      createSkill({ name: "Recubrimiento Calaverico", type: "buff",    target: "self",  stat: "defense",   value: 5,     precision: 95, aparicion: 7 }),
    ]
  }),
  createCharacter({
    name: 'Narada',
    image: 'assets/images/Narada.jpg',
    hp: 200,
    evasion: 2,
    role: "tanque",
    skills: [
      createSkill({ name: 'Corte demencial', type: 'attack',   power: 25,   precision: 80,     aparicion: 30 }),
      createSkill({ name: 'Ataque fugaz',    type: 'attack',   power: 18,   precision: 90,     aparicion: 90 }),
      createSkill({ name: 'Tajo',            type: 'attack',   power: 15,   precision: 85,     aparicion: 50, herida: true }),
      createSkill({ name: "Rabia",           type: "buff",     target: "self", stat: "attack", value: 0.10,   precision: 95, aparicion: 50 }),
    ]
  }),
  createCharacter({
    name: "Akay",
    image: "assets/images/Akay.jpg",
    hp: 70,
    evasion: 10,
    role: "asesino",
    skills: [
      createSkill({ name: "Corte",         type: "attack",  power: 5,        precision: 80,      aparicion: 70 }),
      createSkill({ name: "Puñalada",      type: "attack",  power: 8,        precision: 90,      aparicion: 20 }),
      createSkill({ name: "Concentracion", type: "buff",    target: "self",  stat: "precision",  value: 100,   precision: 90, aparicion: 50 }),
    ]
  }),
  createCharacter({
    name: "La bruja del paramo",
    image: "assets/images/Bruja.jpg",
    hp: 60,
    evasion: 8,
    role: "rango",
    skills: [
      createSkill({ name: "Ataque mental",     type: "attack",  power: 10,   precision: 75,  aparicion: 10,}),
      createSkill({ name: "Vision de muerte",  type: "buff",    target: "enemy", stat: "attack",      value: -0.20,  precision: 90, aparicion: 5 }),
      createSkill({ name: "Espejismo",         type: "buff",    target: "enemy",  stat: "precision",  value: 0.5,    precision: 95, aparicion: 7 }),
    ]
  }),
  createCharacter({
    name: "Guerrero",
    image: "assets/images/Guerrero.jpg",
    hp: 100,
    evasion: 5,
    role: "tanque",
    skills: [
      createSkill({ name: "Lanza",            type: "attack",  power: 8,  precision: 85, aparicion: 60 }),
      createSkill({ name: "Golpe de escudo",  type: "attack",  power: 5,  precision: 90, aparicion: 20,  stun: true  }),
      createSkill({ name: "Defensa",          type: "defense", power: 15, precision: 95, aparicion: 80   }),
    ]
  }),

];

export default characters;
