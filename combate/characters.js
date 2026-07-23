const characters = [
  {
    name: "Paladin",
    image: "gorlag.png",
    hp: 120,
    evasion: 5,
    skills: [
      { name: "Corte grave", type: "attack", power: 22, precision: 8, aparicion: 70, herida: true },
      { name: "Golpe de escudo", type: "attack", power: 10, precision: 80, aparicion: 8, stun: true },
      { name: "Plegaria", type: "cura", power: 15, precision: 95, aparicion: 4 },
      { name: "Postura Defensiva", type: "defense", power: 15, precision: 95, aparicion: 6 },
      { name: "Furia de batalla", type: "buff", target: "self", stat: "attack", value: 0.10, precision: 95, aparicion: 70 },
      { name: "Intimidación", type: "buff", target: "enemy", stat: "attack", value: -0.10, precision: 90, aparicion: 5 },
      { name: "Proteccion Divina", type: "buff", target: "self", stat: "defense", value: 10, precision: 95, aparicion: 7 },
      { name: "Oración de Precisión", type: "buff", target: "self", stat: "precision", value: 100, precision: 90, aparicion: 50 }
    ]
  },
  {
    name: "Mortis, el Nigromante",
    image: "mortis.png",
    hp: 90,
    evasion: 8,
    skills: [
      { name: "Drenar Vida", type: "attack", power: 28, precision: 65, aparicion: 70, herida: true },
      { name: "Golpe de Baculo", type: "attack", power: 12, precision: 85, aparicion: 40, stun: true },
      { name: "Armadura de Hueso", type: "defense", power: 10, precision: 95, aparicion: 65 },
      { name: "Vision de muerte", type: "buff", target: "enemy", stat: "attack", value: -0.20, precision: 90, aparicion: 50 },
      { name: "Recubrimiento Calaverico", type: "buff", target: "self", stat: "defense", value: 15, precision: 95, aparicion: 70 },
      { name: "Maldición de Ceguera", type: "buff", target: "enemy", stat: "precision", value: -0.5, precision: 85, aparicion: 50 }
    ]
  }
];
