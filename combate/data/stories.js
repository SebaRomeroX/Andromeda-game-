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
    events: [
      { type: 'enfrentamiento', title: 'Emboscada en el paso', description: 'Te enfrentas a un grupo de merodeadores.' },
      { type: 'enfrentamiento', title: 'Emboscada en el paso', description: 'Te enfrentas a un grupo de merodeadores.' },
      { type: 'enfrentamiento', title: 'Emboscada en el paso', description: 'Te enfrentas a un grupo de merodeadores.' },
      { type: 'campamento', title: 'Campamento', description: 'Los personajes de tu equipo descansan y se recuperan de sus heridas de batalla.' },
      { type: 'reclutamiento', title: 'Un encuentro oportuno', description: 'Una druida del bosque ofrece acompañarte en la travesía.', character: 1 },
      { type: 'enfrentamiento', title: 'Emboscada en el paso', description: 'Te enfrentas a un grupo de merodeadores.' },
      { type: 'enfrentamiento', title: 'Emboscada en el paso', description: 'Te enfrentas a un grupo de merodeadores.' },
      { type: 'enfrentamiento', title: 'Emboscada en el paso', description: 'Te enfrentas a un grupo de merodeadores.' },
      { type: 'campamento', title: 'Campamento', description: 'Los personajes de tu equipo descansan y se recuperan de sus heridas de batalla.' },
      { type: 'enfrentamiento', title: 'Emboscada en el paso', description: 'Te enfrentas a un grupo de merodeadores.' },
      { type: 'enfrentamiento', title: 'Emboscada en el paso', description: 'Te enfrentas a un grupo de merodeadores.' },
      { type: 'enfrentamiento', title: 'Emboscada en el paso', description: 'Te enfrentas a un grupo de merodeadores.' },
      { type: 'campamento', title: 'Campamento', description: 'Los personajes de tu equipo descansan y se recuperan de sus heridas de batalla.' },
      { type: 'enfrentamiento', narrativo: true, title: 'Sin salida', description: 'Una amenaza ineludible se cierne sobre ti.', enemyTeam: [4, -1, -1, -1] },
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
