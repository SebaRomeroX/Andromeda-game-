/// <reference path="../src/models.js" />

import { createCharacter, createSkill } from '../src/models.js';

// createSkill({ name: "Estocada",           type: "attack",  power: 20,   precision: 90,    aparicion: 70 }),
// createSkill({ name: "Corte grave",        type: "attack",  power: 14,   precision: 90,    aparicion: 70,  herida: true }),
// createSkill({ name: "Golpe de escudo",    type: "attack",  power: 8,    precision: 95,    aparicion: 20,  stun: true   }),
// createSkill({ name: "Vendaje",            type: "cura",    power: 4,    precision: 99,    aparicion: 20   }),
// createSkill({ name: "Postura Defensiva",  type: "defense", power: 15,   precision: 99,    aparicion: 40   }),
// createSkill({ name: "Furia de batalla",   type: "buff",    target: "ally",  stat: "attack",    value: 0.10,  precision: 99, aparicion: 40 }),
// createSkill({ name: "Desmoralizar",       type: "buff",    target: "enemy", stat: "attack",    value: -0.20, precision: 99, aparicion: 50 }),
// createSkill({ name: "Proteccion",         type: "buff",    target: "ally",  stat: "defense",   value: 10,    precision: 99, aparicion: 50 }),
// createSkill({ name: "Romper defenza",     type: "buff",    target: "enemy", stat: "defense",   value: -1,    precision: 99, aparicion: 20 }),
// createSkill({ name: "Intimidacion",       type: "buff",    target: "enemy", stat: "precision", value: 0.9,   precision: 99, aparicion: 30 }),
// createSkill({ name: "Concentracion",      type: "buff",    target: "ally",  stat: "precision", value: 1,     precision: 99, aparicion: 30 }),
// createSkill({ name: "Pies ligeros",       type: "buff",    target: "ally",  stat: "evasion",   value: 20,   precision: 99, aparicion: 30 }),
// createSkill({ name: "Inmovilizar",        type: "buff",    target: "enemy", stat: "evasion",   value: 0,     precision: 99, aparicion: 30 }),

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
      createSkill({ name: "Golpe de escudo",    type: "attack",  power: 8,    precision: 95,    aparicion: 20,  stun: true   }),
      createSkill({ name: "Vendaje",            type: "cura",    power: 4,    precision: 99,    aparicion: 20   }),
      createSkill({ name: "Postura Defensiva",  type: "defense", power: 15,   precision: 99,    aparicion: 40   }),
      createSkill({ name: "Furia de batalla",   type: "buff",    target: "ally",  scope:'all',  duration:4,   stat: "attack",     value: 0.10,   precision: 99, aparicion: 40 }),
      createSkill({ name: "Proteccion",         type: "buff",    target: "self",  stat: "defense",   value: 10,    precision: 99, aparicion: 50  }),
      createSkill({ name: "Romper defenza",     type: "buff",    target: "enemy", stat: "defense",   value: -1,    precision: 99, aparicion: 20  }),
      // ESPECIALES
      createSkill({ name: "Lanze Potenciado",   type: "attack",  power: 70,    precision: 70,    aparicion: 5 }),
      createSkill({ name: "Salto brutal",       type: "attack",  power: 22,    precision: 99,    aparicion: 5,  stun: true }),
      createSkill({ name: "Proteccion Divina",  type: "buff",    target: "ally",  stat: "defense",   value: 20,    precision: 99, aparicion: 5  }),
    ],
    learnableSkills: [
      createSkill({ name: "Pies ligeros",       type: "buff",    target: "self",  stat: "evasion",    value: 20,     precision: 99, aparicion: 30 }),
      createSkill({ name: "Furia",              type: "buff",    target: "self",  stat: "attack",     value: 0.15,   duration: 5,  precision: 99, aparicion: 40 }),
      createSkill({ name: "Corte demencial",    type: "attack",  power: 30,      precision: 80,      aparicion: 10 }),
    ]
  }),
  createCharacter({
    name: "La druida",
    image: "assets/images/Druida.jpg",
    hp: 80,
    evasion: 5,
    role: "soporte",
    skills: [
      createSkill({ name: "Bolpe de baculo",        type: "attack",  power: 6,   precision: 90,    aparicion: 50  }),
      createSkill({ name: "Medicina druidica",      type: "cura",    power: 8,   precision: 99,    aparicion: 50  }),
      createSkill({ name: "Magia curativa",         type: "cura",    power: 4,   precision: 99,    aparicion: 70  }),
      createSkill({ name: "Disminucion",            type: "buff",    target: "enemy", stat: "attack",    value: -0.2,  precision: 99, aparicion: 30 }),
      createSkill({ name: "Confundir",              type: "buff",    target: "enemy", stat: "precision", value: 0.10,  scope:'all',   precision: 99, aparicion: 30 }),
      createSkill({ name: "Hechizo de proteccion",  type: "buff",    target: "ally",  stat: "defense",   value: 6,     precision: 99, aparicion: 30 }),
      createSkill({ name: "Viento a favor",         type: "buff",    target: "ally",  duration:5,   stat: "evasion",   value: 20,     precision: 99, aparicion: 30 }),
    ],
    learnableSkills: [
      createSkill({ name: "Naturaleza",       type: "cura",    power: 12,   precision: 99,    aparicion: 50 }),
      createSkill({ name: "Enredaderas",      type: "buff",    target: "enemy",  stat: "evasion",   value: 0,      duration: 6,  precision: 99, aparicion: 30 }),
    ]
  }),
  createCharacter({
    name: "Urbol",
    image: "assets/images/Urbol.jpg",
    hp: 170,
    evasion: 3,
    role: "tanque",
    skills: [
      createSkill({ name: "Abatida",            type: "attack",  power: 10,  precision: 90,    aparicion: 70 }),
      createSkill({ name: "Corte",              type: "attack",  power: 6,   precision: 90,    aparicion: 70 }),
      createSkill({ name: "Postura Defensiva",  type: "defense", power: 15,  precision: 99,    aparicion: 40   }),
      createSkill({ name: "Rugido",             type: "buff",    target: "enemy",  stat: "attack",    value: -0.2,  precision: 99, aparicion: 20 }),
      createSkill({ name: "Cubrir",             type: "buff",    target: "ally",   stat: "defense",   value: 6,     precision: 99, aparicion: 50 }),
      createSkill({ name: "Intimidacion",       type: "buff",    target: "enemy",  stat: "precision", value: 0.3,   precision: 99, aparicion: 30 }),
    ],
    learnableSkills: [
      createSkill({ name: "Golpe de escudo",    type: "attack",  power: 8,    precision: 90,    aparicion: 20,  stun: true }),
      createSkill({ name: "Proteccion",         type: "buff",    target: "self",  stat: "defense",   value: 15,    precision: 99, aparicion: 40 }),
    ]
  }),
  createCharacter({
    name: "Sacerdotiza oscura",
    image: "assets/images/Sacerdotiza.jpg",
    hp: 50,
    evasion: 4,
    role: "soporte",
    skills: [
      createSkill({ name: "Ataque mental",            type: "attack",  power: 5,        precision: 75,     aparicion: 50, }),
      createSkill({ name: "Vision de muerte",         type: "buff",    target: "enemy", stat: "attack",    value: -0.10,  precision: 90, aparicion: 50 }),
      createSkill({ name: "Recubrimiento Calaverico", type: "buff",    target: "ally",  stat: "defense",   value: 5,      precision: 95, aparicion: 70 }),
      createSkill({ name: "Auxilio",                  type: "cura",    power: 4,        precision: 99,     aparicion: 70  }),
    ],
    learnableSkills: [
      createSkill({ name: "Drenaje",           type: "cura",    power: 6,    precision: 95,    aparicion: 50 }),
      createSkill({ name: "Desmoralizar",      type: "buff",    target: "enemy", stat: "attack",    value: -0.20,  precision: 90, aparicion: 30 }),
    ]
  }),
  createCharacter({
    name: 'Narada',
    image: 'assets/images/Narada.jpg',
    hp: 160,
    evasion: 2,
    role: "tanque",
    skills: [
      createSkill({ name: 'Corte demencial', type: 'attack',  power: 35,   precision: 85,      aparicion: 10 }),
      createSkill({ name: 'Ataque fugaz',    type: 'attack',  power: 18,   precision: 90,      aparicion: 70 }),
      createSkill({ name: 'Tajo',            type: 'attack',  power: 15,   precision: 85,      aparicion: 50, herida: true  }),
      createSkill({ name: "Rabia",           type: "buff",    target: "self", stat: "attack",  value: 0.10,   duration:6,   precision: 95, aparicion: 50 }),
      createSkill({ name: "Proteccion",      type: "buff",    target: "self", stat: "defense", value: 10,     duration:4,   precision: 99, aparicion: 50  }),
    ],
    learnableSkills: [
      createSkill({ name: "Grito de guerra",  type: "buff",    target: "ally",  scope:'all',  duration: 4,  stat: "attack",  value: 0.10,   precision: 99, aparicion: 40 }),
      createSkill({ name: "Postura Defensiva", type: "defense", power: 18,   precision: 99,    aparicion: 40 }),
    ]
  }),
  createCharacter({
    name: "Akay",
    image: "assets/images/Akay.jpg",
    hp: 100,
    evasion: 8,
    role: "asesino",
    skills: [
      createSkill({ name: "Sangrante",     type: "attack",  power: 12,       precision: 85,      aparicion: 40, herida: true }),
      createSkill({ name: "Corte",         type: "attack",  power: 15,       precision: 85,      aparicion: 70  }),
      createSkill({ name: "Puñalada",      type: "attack",  power: 24,       precision: 90,      aparicion: 20  }),
      createSkill({ name: "Concentracion", type: "buff",    target: "self",  stat: "precision",  value: 100,    precision: 90, aparicion: 50 }),
      createSkill({ name: "Furia",         type: "buff",    target: "self",  stat: "attack",     value: 0.10,   precision: 99, aparicion: 40 }),
      createSkill({ name: "Pies ligeros",  type: "buff",    target: "self",  stat: "evasion",    value: 20,     precision: 99, aparicion: 30 }),
    ],
    learnableSkills: [
      createSkill({ name: "Corte grave",   type: "attack",  power: 18,   precision: 85,    aparicion: 70,  herida: true }),
      createSkill({ name: "Golpe certero", type: "attack",  power: 28,   precision: 80,    aparicion: 10 }),
    ]
  }),
  createCharacter({
    name: "La bruja del paramo",
    image: "assets/images/Bruja.jpg",
    hp: 100,
    evasion: 4,
    role: "soporte",
    skills: [
      createSkill({ name: "Ataque mental",      type: "attack",  power: 15,       precision: 75,     aparicion: 50 }),
      createSkill({ name: "Vision de muerte",   type: "buff",    target: "enemy", stat: "attack",    value: -0.20,  precision: 90, aparicion: 30 }),
      createSkill({ name: "Defenza Calaverica", type: "buff",    target: "ally",  stat: "defense",   value: 5,      precision: 95, aparicion: 30 }),
      createSkill({ name: "Espejismo",          type: "buff",    target: "enemy", stat: "precision", value: 0.2,    precision: 95, aparicion: 30 }),
      createSkill({ name: "Saña",               type: "buff",    target: "ally",  stat: "attack",    value: 0.10,   precision: 99, aparicion: 40 }),
    ],
    learnableSkills: [
      createSkill({ name: "Magia oscura",      type: "attack",  power: 20,   precision: 80,    aparicion: 30 }),
      createSkill({ name: "Curacion negra",    type: "cura",    power: 10,   precision: 95,    aparicion: 40 }),
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
      createSkill({ name: "Golpe de escudo",  type: "attack",  power: 4,  precision: 90, aparicion: 20,  stun: true }),
      createSkill({ name: "Proteccion",       type: "buff",    target: "ally",  stat: "defense",   value: 4,        precision: 99, aparicion: 40  }),
    ],
    learnableSkills: [
      createSkill({ name: "Rugido",           type: "buff",    target: "enemy",  stat: "attack",    value: -0.15,  precision: 99, aparicion: 30 }),
      createSkill({ name: "Abatida",          type: "attack",  power: 12,  precision: 85,    aparicion: 60 }),
    ]
  }),
  createCharacter({
    name: "Sabueso de Guerra",
    image: "assets/images/warhound.jpg",
    hp: 60,
    evasion: 12,
    role: "asesino",
    skills: [
      createSkill({ name: "Mordida",     type: "attack",  power: 16,  precision: 85, aparicion: 60  }),
      createSkill({ name: "Desgarrar",   type: "attack",  power: 12,  precision: 80, aparicion: 60, herida: true }),
      createSkill({ name: "Rabia",       type: "buff",    target: "self",  stat: "attack",     value: 0.10,   precision: 99, aparicion: 40 }),
      createSkill({ name: "Velocidad",   type: "buff",    target: "self",  stat: "evasion",    value: 20,     precision: 99, aparicion: 30 }),
    ],
    learnableSkills: [
      createSkill({ name: "Aullido",         type: "buff",    target: "ally",  scope:'all',  duration: 4,  stat: "attack",  value: 0.05,   precision: 99, aparicion: 40 }),
      createSkill({ name: "Mordida furiosa", type: "attack",  power: 22,  precision: 80,    aparicion: 30, stun: true }),
    ]
  }),
  createCharacter({
    name: "Aracnida",
    image: "assets/images/aracnid.jpg",
    hp: 80,
    evasion: 7,
    role: "soporte",
    skills: [
      createSkill({ name: "Disparo aguijon",    type: "attack",  power: 8,   precision: 90,    aparicion: 80 }),
      createSkill({ name: "Picadura venonosa",  type: "attack",  power: 4,   precision: 90,    aparicion: 50,  herida: true }),
      createSkill({ name: "Bomba de telaraña",  type: "attack",  power: 4,   precision: 95,    aparicion: 40,  stun: true }),
      createSkill({ name: "Vendaje aracnido",   type: "cura",    power: 4,   precision: 99,    aparicion: 50   }),
      createSkill({ name: "Veneno",             type: "buff",    target: "ally",   scope:'all',    duration:4,   stat: "attack",   value: 0.10,   precision: 99, aparicion: 40 }),
      createSkill({ name: "Telarañas",          type: "buff",    target: "enemy",  duration:5,     scope:'all',  stat: "evasion",  value: 0,      precision: 99, aparicion: 30 }),      
    ],
    learnableSkills: [
      createSkill({ name: "Colmillo afilado",  type: "attack",  power: 14,   precision: 85,    aparicion: 50,  herida: true }),
      createSkill({ name: "Telas",             type: "buff",    target: "enemy",  stat: "evasion",   value: 0,      duration: 7,  precision: 99, aparicion: 30 }),
    ]
  }),
  createCharacter({
    name: "Lancero",
    image: "assets/images/spear.jpg",
    hp: 100,
    evasion: 2,
    role: "tanque",
    skills: [
      createSkill({ name: "Lanza",            type: "attack",  power: 7,  precision: 85, aparicion: 40,  herida: true }),
      createSkill({ name: "Defensa",          type: "defense", power: 10, precision: 95, aparicion: 60   }),
    ],
    learnableSkills: [
      createSkill({ name: "Lanza potenciada", type: "attack",  power: 14,  precision: 80,    aparicion: 30,  herida: true }),
      createSkill({ name: "Cubrir",           type: "buff",    target: "ally",  stat: "defense",   value: 8,     precision: 99, aparicion: 50 }),
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
      createSkill({ name: "Reves",          type: "attack",  power: 7,   precision: 85, aparicion: 80 }),
      createSkill({ name: "Intimidacion",   type: "buff",    target: "enemy", stat: "attack", value: -0.15,    precision: 99, aparicion: 30 }),
    ],
    learnableSkills: [
      createSkill({ name: "Golpe demoledor", type: "attack",  power: 18,  precision: 75,    aparicion: 20,  stun: true }),
      createSkill({ name: "Fortaleza",       type: "buff",    target: "self",  stat: "defense",   value: 15,    duration: 5,  precision: 99, aparicion: 40 }),
    ]
  }),
  createCharacter({
    name: "Espadachin",
    image: "assets/images/sword.jpg",
    hp: 70,
    evasion: 6,
    role: "asesino",
    skills: [
      createSkill({ name: "Corte",         type: "attack",  power: 7,        precision: 80,      aparicion: 70 }),
      createSkill({ name: "Puñalada",      type: "attack",  power: 13,       precision: 90,      apparicion: 30 }),
      createSkill({ name: "Concentracion", type: "buff",    target: "self",  stat: "precision",  value: 100,   precision: 90, aparicion: 40 }),
    ],
    learnableSkills: [
      createSkill({ name: "Tajo preciso",  type: "attack",  power: 18,   precision: 85,    aparicion: 30 }),
      createSkill({ name: "Rapiña",        type: "buff",    target: "self",  stat: "attack",   value: 0.15,  duration: 5,  precision: 99, aparicion: 40 }),
    ]
  }),
  createCharacter({
    name: "Asesina",
    image: "assets/images/knives.jpg",
    hp: 50,
    evasion: 7,
    role: "asesino",
    skills: [
      createSkill({ name: "Corte",      type: "attack",  power: 7,        precision: 80,      aparicion: 70 }),
      createSkill({ name: "Puñalada",   type: "attack",  power: 10,       precision: 90,      apparicion: 30 , herida: true   }),
      createSkill({ name: "Devilitar",  type: "buff",    target: "enemy", stat: "attack",     value: -0.10,   precision: 90, aparicion: 30 }),
    ],
    learnableSkills: [
      createSkill({ name: "Danza de cuchillos", type: "attack",  power: 14,   precision: 80,    aparicion: 40,  herida: true }),
      createSkill({ name: "Sombra",             type: "buff",    target: "self",  stat: "evasion",   value: 25,    precision: 99, aparicion: 30 }),
    ]
  }),
  createCharacter({
    name: "Arquera",
    image: "assets/images/archer.jpg",
    hp: 50,
    evasion: 4,
    role: "rango",
    skills: [
      createSkill({ name: "Flecha",        type: "attack",  power: 9,    precision: 85, aparicion: 60, }),
      createSkill({ name: "Tiro certero",  type: "attack",  power: 13,   precision: 90, aparicion: 40, }),
      createSkill({ name: "Concentracion", type: "buff",    target: "self",  stat: "precision",  value: 100,   precision: 90, aparicion: 30 }),
    ],
    learnableSkills: [
      createSkill({ name: "Flecha explosiva", type: "attack",  power: 18,   precision: 80,    aparicion: 20 }),
      createSkill({ name: "Pies ligeros",     type: "buff",    target: "self",  stat: "evasion",   value: 20,    precision: 99, aparicion: 30 }),
    ]
  }),
  createCharacter({
    name: "Witch",
    image: "assets/images/witch.jpg",
    hp: 40,
    evasion: 3,
    role: "rango",
    skills: [
      createSkill({ name: "Ataque mental",    type: "attack",  power: 8,    precision: 85, aparicion: 50, }),
      createSkill({ name: "Fuego fatuo",      type: "attack",  power: 15,   precision: 85, aparicion: 30, herida: true}),
    ],
    learnableSkills: [
      createSkill({ name: "Llamarada",        type: "attack",  power: 20,   precision: 80,    aparicion: 20 }),
      createSkill({ name: "Concentracion",    type: "buff",    target: "self",  stat: "precision",  value: 100,   precision: 90, aparicion: 40 }),
    ]
  }),
  createCharacter({
    name: "Capitan Oscuro",
    image: "assets/images/Guerrero.jpg",
    hp: 180,
    evasion: 2,
    role: "tanque",
    skills: [
      createSkill({ name: "Corte",            type: "attack",  power: 16,  precision: 85, aparicion: 60 }),
      createSkill({ name: "Golpe de escudo",  type: "attack",  power: 10,  precision: 90, aparicion: 20,  stun: true  }),
      createSkill({ name: "Proteccion",       type: "buff",    target: "self",  stat: "defense",   value: 4,    precision: 99, aparicion: 50  }),
      createSkill({ name: "Intimidar",        type: "buff",    target: "enemy", stat: "attack",    value: -0.10,    precision: 90, aparicion: 30 }),
    ],
    learnableSkills: [
      createSkill({ name: "Comando",          type: "buff",    target: "ally",  scope:'all',  duration: 4,  stat: "attack",  value: 0.08,   precision: 99, aparicion: 40 }),
      createSkill({ name: "Corte devastador", type: "attack",  power: 25,  precision: 75,    aparicion: 10 }),
    ]
  }),
  createCharacter({
    name: "Demonic",
    image: "assets/images/demonic.jpg",
    hp: 100,
    evasion: 6,
    role: "rango",
    skills: [
      createSkill({ name: "Lamarada",       type: "attack",  power: 12,    precision: 85, aparicion: 30, herida: true}),
      createSkill({ name: "Fuego abisal",   type: "attack",  power: 18,    precision: 85, aparicion: 30 }),
      createSkill({ name: "Devilitar",      type: "buff",    target: "enemy", stat: "attack",  value: -0.10,    precision: 90, aparicion: 50  }),
      createSkill({ name: "Intensidad",     type: "buff",    target: "self",  duration:4,      stat: "attack",  value: 0.10,   precision: 99, aparicion: 40 }),
    ],
    learnableSkills: [
      createSkill({ name: "Inferno",        type: "attack",  power: 25,    precision: 75,    aparicion: 10 }),
      createSkill({ name: "Corazón oscuro", type: "buff",    target: "self",  duration: 5,  stat: "attack",  value: 0.15,   precision: 99, aparicion: 30 }),
    ]
  }),
  createCharacter({
    name: "Piedrita",
    image: "assets/images/piedrita.jpg",
    hp: 150,
    evasion: 1,
    role: "tanque",
    skills: [
      createSkill({ name: "Manotazo",         type: "attack",  power: 20,  precision: 85,    aparicion: 20   }),
      createSkill({ name: "Cabezazo",         type: "attack",  power: 16,  stun:true,        precision: 85,  apparicion: 20   }),
      createSkill({ name: "Ser una piedra",   type: "defense", power: 22,  precision: 99,    aparicion: 40   }),
      createSkill({ name: "Como roca",        type: "buff",    target: "ally",   stat: "defense",  value: 12,       precision: 99, apparicion: 50  }),
      createSkill({ name: "Pisar pie",        type: "buff",    target: "enemy",  duration:7,       stat: "evasion", value: 0,      precision: 99, apparicion: 20 }),
    ],
    learnableSkills: [
      createSkill({ name: "Terremoto",        type: "attack",  power: 12,  precision: 80,    aparicion: 30,  stun: true }),
      createSkill({ name: "Coraza",           type: "buff",    target: "self",  stat: "defense",   value: 20,    precision: 99, aparicion: 40 }),
    ]
  }),
  createCharacter({
    name: "Xall",
    image: "assets/images/xall.jpg",
    hp: 100,
    evasion: 5,
    role: "asesino",
    skills: [
      createSkill({ name: "Estocada",    type: "attack",  power: 12,       precision: 90,     aparicion: 70   }),
      createSkill({ name: "Proteccion",  type: "buff",    target: "ally",  stat: "defense",   value: 7,       precision: 99, apparicion: 70  }),
      createSkill({ name: "Bomba humo",  type: "buff",    target: "enemy", stat: "precision", value: 0.9,     precision: 99, apparicion: 70 }),
      createSkill({ name: "Derribar",    type: "attack",  power: 22,       precision: 90,     aparicion: 30,  stun: true }),
    ],
    learnableSkills: [
      createSkill({ name: "Contraataque", type: "attack",  power: 16,   precision: 85,    aparicion: 40 }),
      createSkill({ name: "Pies ligeros", type: "buff",    target: "self",  stat: "evasion",   value: 20,    precision: 99, aparicion: 30 }),
    ]
  }),
  createCharacter({
    name: "Veraldin",
    image: "assets/images/veraldin.jpg",
    hp: 70,
    evasion: 7,
    role: "rango",
    skills: [
      createSkill({ name: "Lamarada",      type: "attack",  power: 12,   precision: 90, aparicion: 70, herida: true}),
      createSkill({ name: "Fuego abisal",  type: "attack",  power: 15,   precision: 90, apparicion: 70  }),
      createSkill({ name: "Panacea",       type: "cura",    power: 4,    precision: 99, apparicion: 70  }),
      createSkill({ name: "Intensidad",    type: "buff",    target: "self",  stat: "attack",  value: 0.10,   precision: 99, apparicion: 30 }),
    ],
    learnableSkills: [
      createSkill({ name: "Llama eterna",    type: "attack",  power: 20,   precision: 85,    aparicion: 20 }),
      createSkill({ name: "Magia curativa",  type: "cura",    power: 8,    precision: 99,    aparicion: 50 }),
    ]
  }),
];

export default characters;
