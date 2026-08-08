const stories = [
  {
    id: 'travesia-sima',
    title: 'La Travesía de Sima la audaz',
    description: 'Acompaña a Sima y su equipo en una peligrosa travesía a través de tierras desconocidas.',
    sequential: true,
    protagonist: 0,
    allies: [1,2],
    genericEnemies: [3, 5, 6, 7],
    narrativeEnemies: [4],
    teamA: [-1, 0, -1, -1],
    campAfterFights: 3,
    expectedStages: 13,
    narrativeEvents: [
      {
        id: 'introduccion',
        type: 'dialogo',
        narrativo: true,
        title: 'La llamada del norte',
        description: 'El viento trae un mensaje desde tierras lejanas.',
        dialog: [
          { text: 'El sol se oculta tras las montañas cuando una voz recorre la llanura.' },
          { speaker: 0, text: '¿Habéis oído eso? Algo nos llama hacia el norte.' },
          { text: 'Una sombra gigante cruza el horizonte. La travesía comienza.' }
        ]
      },
      {
        id: 'presagio-final',
        type: 'dialogo',
        narrativo: true,
        title: 'Las puertas del santuario',
        description: 'Ante el último santuario, una figura te corta el paso.',
        dialog: [
          { text: 'El último santuario se alza imponente. Una silueta lo bloquea.' },
          { speaker: 4, text: 'No deberías haber llegado hasta aquí. El camino se acaba.' },
          { speaker: 0, text: 'Quizá, pero no volveré atrás.' }
        ],
        conditions: { campamentos: 4, enfrentamientos: 9 }
      },
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
        enemyTeam: [4, 5, 7, -1],
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
        type: 'dialogo',
        narrativo: true,
        title: 'Una voz en la llanura',
        description: 'El viento murmura entre las rocas.',
        dialog: [
          { text: 'El silencio se abre paso entre el polvo del camino.' },
          { speaker: 4, text: 'El destino os espera, pero no estáis listos.' }
        ]
      },
      {
        type: 'reclutamiento',
        title: 'recluta druida',
        description: 'Una druida del bosque ofrece acompañarte.',
        character: 1
      },
      {
        type: 'reclutamiento',
        title: 'recluta tanque',
        description: 'Un caballero ofrece acompañarte.',
        character: 2
      },
      {
        type: 'enfrentamiento',
        narrativo: true,
        title: 'Narada sola',
        description: 'Una amenaza ineludible se cierne sobre ti.',
        enemyTeam: [4, -1, -1, -1]
      },
      {
        type: 'enfrentamiento',
        narrativo: true,
        title: 'Final',
        description: 'Una amenaza ineludible se cierne sobre ti.',
        enemyTeam: [4, 5, 6, -1]
      },
    ]
  }
];

export default stories;
