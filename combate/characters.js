const characters = [
  {
    name: "Gorlag, el Bárbaro",
    image: "gorlag.png",
    hp: 120,
    evasion: 5,
    skills: [
      { name: "Hacha fugaz", type: "attack", power: 15, precision: 85, aparicion: 90 },
      { name: "Debastador", type: "attack", power: 30, precision: 65, aparicion: 30 },
      { name: "Hachazo", type: "attack", power: 22, precision: 80, aparicion: 70, herida: true },
      { name: "Golpe de escudo", type: "attack", power: 6, precision: 80, aparicion: 85, stun: true },
      { name: "Postura Defensiva", type: "defense", power: 12, precision: 95, aparicion: 65 }
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
      { name: "Armadura de Hueso", type: "defense", power: 10, precision: 95, aparicion: 65 }
    ]
  }
];
