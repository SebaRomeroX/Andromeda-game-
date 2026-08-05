const stories = [
  {
    id: 'travesia-sima',
    title: 'La Travesía de Sima la audaz',
    description: 'Acompaña a Sima y su equipo en una peligrosa travesía a través de tierras desconocidas.',
    sequential: true,
    protagonist: 0,
    allies: [1],
    genericEnemies: [3, 5, 6, 7],
    narrativeEnemies: [4],
    teamA: [-1, 0, -1, -1],
    campAfterFights: 3,
    expectedStages: 13,
    narrativeEvents: [
      {
        id: 'reclutamiento-druida',
        type: 'reclutamiento',
        title: 'Un encuentro oportuno',
        description: 'Una druida del bosque ofrece acompañarte en la travesía.',
        character: 1,
        conditions: { campamentos: 1 }
      },
      {
        id: 'sin-salida',
        type: 'enfrentamiento',
        narrativo: true,
        title: 'Sin salida',
        description: 'Una amenaza ineludible se cierne sobre ti.',
        enemyTeam: [4, -1, -1, -1],
        conditions: { campamentos: 2 }
      },
      {
        id: 'reclutamiento-urbol',
        type: 'reclutamiento',
        title: 'Un noble guerrero',
        description: 'Un poderoso caballero admira tu valor y se une a tu mision.',
        character: 2,
        conditions: { campamentos: 3 }
      },
      {
        id: 'final-narada',
        type: 'enfrentamiento',
        narrativo: true,
        final: true,
        title: 'Enfrentamiento final Narada',
        description: 'Narada bloquea el paso hacia el último santuario. Esta es la batalla definitiva.',
        enemyTeam: [4, -1, -1, -1],
        conditions: { campamentos: 4, enfrentamientos: 9, stage: 12 }
      }
    ]
  },
  {
    id: 'modo-libre',
    title: 'Modo libre para desarrollo',
    description: 'Se puede elegir el evento.',
    protagonist: 0,
    allies: [1],
    genericEnemies: [3, 5, 6, 7],
    narrativeEnemies: [4],
    teamA: [-1, 0, -1, -1],
    events: [
      {
        type: 'enfrentamiento',
        title: 'Emboscada en el paso',
        description: 'Te enfrentas a un grupo de merodeadores.'
      },
      {
        type: 'campamento',
        title: 'Campamento',
        description: 'Los personajes de tu equipo descansan y se recuperan de sus heridas de batalla.'
      },
      {
        type: 'reclutamiento',
        title: 'Un encuentro oportuno',
        description: 'Una druida del bosque ofrece acompañarte.',
        character: 1
      },
      {
        type: 'enfrentamiento',
        narrativo: true,
        title: 'Sin salida',
        description: 'Una amenaza ineludible se cierne sobre ti.',
        enemyTeam: [4, -1, -1, -1]
      },
    ]
  }
];

export default stories;
