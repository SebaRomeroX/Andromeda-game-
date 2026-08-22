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
      // createSkill({ name: "EXCALIBUR",          type: "attack",  power: 1000, precision: 1000,  aparicion: 1000 }), // SKILL PARA AGIlizAR TESTEO DE JUEGO // NO ELIMINAR
      createSkill({ name: "Estocada",           type: "attack",  power: 20,   precision: 90,    aparicion: 70 }),
      createSkill({ name: "Corte grave",        type: "attack",  power: 14,   precision: 90,    aparicion: 70,  herida: true }),
      createSkill({ name: "Golpe de escudo",    type: "attack",  power: 8,    precision: 95,    aparicion: 20,  stun: true  }),
      createSkill({ name: "Vendaje",            type: "cura",    power: 4,    precision: 99,    aparicion: 20   }),
      createSkill({ name: "Postura Defensiva",  type: "defense", power: 25,   precision: 99,    aparicion: 40   }),
      createSkill({ name: "Furia de batalla",   type: "buff",    target: "self",  stat: "attack",    value: 0.10,  precision: 99, aparicion: 50 }),
      createSkill({ name: "Proteccion",         type: "buff",    target: "self",  stat: "defense",   value: 10,    precision: 99, aparicion: 50  }),
      // ESPECIALES
      createSkill({ name: "Lanze Potenciado",   type: "attack",  power: 100,   precision: 80,    aparicion: 5 }),
      createSkill({ name: "Salto brutal",       type: "attack",  power: 22,    precision: 99,    aparicion: 5,  stun: true }),
      createSkill({ name: "Proteccion Divina",  type: "buff",    target: "self",  stat: "defense",   value: 50,    precision: 99, aparicion: 5  }),
    ]
  }),
  createCharacter({
    name: "La druida",
    image: "assets/images/Druida.jpg",
    hp: 90,
    evasion: 7,
    role: "soporte",
    skills: [
      createSkill({ name: "Ataque compasivo",       type: "attack",  power: 6,   precision: 90,     aparicion: 10 }),
      createSkill({ name: "Medicina druidica",      type: "cura",    power: 8,    precision: 99,    aparicion: 70   }),
      createSkill({ name: "Hechizo de proteccion",  type: "buff",    target: "self",  stat: "defense",   value: 6,    precision: 99, aparicion: 50  }),
    ]
  }),
  createCharacter({
    name: "Urbol",
    image: "assets/images/Urbol.jpg",
    hp: 150,
    evasion: 5,
    role: "tanque",
    skills: [
      createSkill({ name: "Abatida",            type: "attack",  power: 10,   precision: 90,    aparicion: 70 }),
      createSkill({ name: "Postura Defensiva",  type: "defense", power: 18,   precision: 99,    aparicion: 20   }),
      createSkill({ name: "Rugido",             type: "buff",    target: "enemy",  stat: "attack",    value: -0.2,  precision: 99, aparicion: 10 }),
    ]
  }),
  createCharacter({
    name: "Sacerdotiza oscura",
    image: "assets/images/Sacerdotiza.jpg",
    hp: 50,
    evasion: 4,
    role: "soporte",
    skills: [
      createSkill({ name: "Ataque mental",            type: "attack",  power: 4,    precision: 75, aparicion: 10,}),
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
    evasion: 6,
    role: "asesino",
    skills: [
      createSkill({ name: "Corte",         type: "attack",  power: 10,        precision: 80,      aparicion: 70 }),
      createSkill({ name: "Puñalada",      type: "attack",  power: 14,        precision: 90,      aparicion: 20 }),
      createSkill({ name: "Concentracion", type: "buff",    target: "self",  stat: "precision",  value: 100,   precision: 90, aparicion: 50 }),
    ]
  }),
  createCharacter({
    name: "La bruja del paramo",
    image: "assets/images/Bruja.jpg",
    hp: 60,
    evasion: 4,
    role: "soporte",
    skills: [
      createSkill({ name: "Ataque mental",     type: "attack",  power: 12,   precision: 75,  aparicion: 10,}),
      createSkill({ name: "Vision de muerte",  type: "buff",    target: "enemy", stat: "attack",      value: -0.20,  precision: 90, aparicion: 5 }),
      createSkill({ name: "Espejismo",         type: "buff",    target: "enemy",  stat: "precision",  value: 0.8,    precision: 95, aparicion: 7 }),
    ]
  }),
  createCharacter({
    name: "Guerrero",
    image: "assets/images/axe.jpg",
    hp: 100,
    evasion: 2,
    role: "tanque",
    skills: [
      createSkill({ name: "Corte",            type: "attack",  power: 8,  precision: 85, aparicion: 60 }),
      createSkill({ name: "Golpe de escudo",  type: "attack",  power: 3,  precision: 90, aparicion: 20,  stun: true  }),
      createSkill({ name: "Proteccion",       type: "buff",    target: "self",  stat: "defense",   value: 4,    precision: 99, aparicion: 50  }),
    ]
  }),
  createCharacter({
    name: "Sabueso de Guerra",
    image: "assets/images/warhound.jpg",
    hp: 60,
    evasion: 6,
    role: "asesino",
    skills: [
      createSkill({ name: "Mordida",     type: "attack",  power: 16,  precision: 85, aparicion: 60 }),
      createSkill({ name: "Desgarrar",   type: "attack",  power: 12,  precision: 80, aparicion: 60, herida: true }),
    ]
  }),
  createCharacter({
    name: "Aracnida",
    image: "assets/images/aracnid.jpg",
    hp: 80,
    evasion: 7,
    role: "soporte",
    skills: [
      createSkill({ name: "Disparo aguijon",   type: "attack",  power: 2,   precision: 90,    aparicion: 50,  herida: true }),
      createSkill({ name: "Telaraña",          type: "attack",  power: 1,   precision: 95,    aparicion: 50,  stun: true }),
      createSkill({ name: "Vendaje aracnido",  type: "cura",    power: 4,   precision: 99,    aparicion: 50   }),
    ]
  }),
  createCharacter({
    name: "Lancero",
    image: "assets/images/spear.jpg",
    hp: 100,
    evasion: 2,
    role: "tanque",
    skills: [
      createSkill({ name: "Lanza",            type: "attack",  power: 4,  precision: 85, aparicion: 30, herida: true }),
      createSkill({ name: "Defensa",          type: "defense", power: 10, precision: 95, aparicion: 80   }),
    ]
  }),
  createCharacter({
    name: "Hamer",
    image: "assets/images/hamer.jpg",
    hp: 160,
    evasion: 2,
    role: "tanque",
    skills: [
      createSkill({ name: "Golpe cargado",  type: "attack",  power: 12,  precision: 85, aparicion: 30 }),
      createSkill({ name: "Reves",          type: "attack",  power: 4,   precision: 85, aparicion: 80 }),
      createSkill({ name: "Rabia",          type: "buff",    target: "self", stat: "attack", value: 0.10,   precision: 95, aparicion: 40 }),
    ]
  }),
  createCharacter({
    name: "Espadachin",
    image: "assets/images/sword.jpg",
    hp: 70,
    evasion: 6,
    role: "asesino",
    skills: [
      createSkill({ name: "Corte",         type: "attack",  power: 6,        precision: 80,      aparicion: 70 }),
      createSkill({ name: "Puñalada",      type: "attack",  power: 10,       precision: 90,      aparicion: 20 }),
      createSkill({ name: "Concentracion", type: "buff",    target: "self",  stat: "precision",  value: 100,   precision: 90, aparicion: 50 }),
    ]
  }),
  createCharacter({
    name: "Asesina",
    image: "assets/images/knives.jpg",
    hp: 50,
    evasion: 7,
    role: "asesino",
    skills: [
      createSkill({ name: "Corte",      type: "attack",  power: 4,        precision: 80,      aparicion: 70 }),
      createSkill({ name: "Puñalada",   type: "attack",  power: 6,        precision: 90,      aparicion: 20 , herida: true}),
      createSkill({ name: "Devilitar",  type: "buff",    target: "enemy", stat: "attack",      value: -0.10,  precision: 90, aparicion: 50 }),
    ]
  }),
  createCharacter({
    name: "Arquera",
    image: "assets/images/archer.jpg",
    hp: 50,
    evasion: 4,
    role: "rango",
    skills: [
      createSkill({ name: "Flecha",        type: "attack",  power: 4,    precision: 85, aparicion: 60,}),
      createSkill({ name: "Tiro certero",  type: "attack",  power: 5,    precision: 90, aparicion: 40,}),
      createSkill({ name: "Concentracion", type: "buff",    target: "self",  stat: "precision",  value: 100,   precision: 90, aparicion: 50 }),
    ]
  }),
  createCharacter({
    name: "Witch",
    image: "assets/images/witch.jpg",
    hp: 40,
    evasion: 3,
    role: "rango",
    skills: [
      createSkill({ name: "Ataque mental",    type: "attack",  power: 3,    precision: 85, aparicion: 50,}),
      createSkill({ name: "Fuego fatuo",      type: "attack",  power: 8,    precision: 85, aparicion: 30, herida: true}),
    ]
  }),
  createCharacter({
    name: "Capitan Oscuro",
    image: "assets/images/Guerrero.jpg",
    hp: 140,
    evasion: 2,
    role: "tanque",
    skills: [
      createSkill({ name: "Corte",            type: "attack",  power: 14,  precision: 85, aparicion: 60 }),
      createSkill({ name: "Golpe de escudo",  type: "attack",  power: 8,  precision: 90, aparicion: 20,  stun: true  }),
      createSkill({ name: "Proteccion",       type: "buff",    target: "self",  stat: "defense",   value: 4,    precision: 99, aparicion: 50  }),
    ]
  }),
  createCharacter({
    name: "Demonic",
    image: "assets/images/demonic.jpg",
    hp: 80,
    evasion: 6,
    role: "rango",
    skills: [
      createSkill({ name: "Lamarada",       type: "attack",  power: 12,    precision: 85, aparicion: 30, herida: true}),
      createSkill({ name: "Fuego abisal",   type: "attack",  power: 18,    precision: 85, aparicion: 30 }),
      createSkill({ name: "Devilitar",      type: "buff",    target: "enemy", stat: "attack",  value: -0.10,  precision: 90, aparicion: 50 })
    ]
  }),
];

export default characters;
