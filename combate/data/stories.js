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
    expectedStages: 19,
    narrativeEvents: [
      {
        id: 'introduccion',
        type: 'dialogo',
        narrativo: true,
        title: 'Cenizas',
        description: 'El pueblo de Sima ya no existe.',
        dialog: [
          { text: 'Un humo gris se eleva de las ruinas de lo que un día fue tu pueblo.' },
          { speaker: 0, text: 'Aún puedo sentir el fuego y oír los gritos de los que no pudieron huir.' },
          { text: 'Fue Narada quien ordenó la masacre. Sus tropas no dejaron piedra sobre piedra.' },
          { speaker: 0, text: 'Narada... no hay muro, ni montaña, ni reino donde puedas esconderte de mí.' },
          { text: 'Con el corazón en cenizas, Sima se pone en marcha. Desde hoy, su hoja tiene un solo propósito.' }
        ]
      },
      {
        id: 'dialogo-bosque',
        type: 'dialogo',
        narrativo: true,
        title: 'Entre los árboles',
        description: 'El sendero se adentra en un bosque espeso y húmedo.',
        dialog: [
          { text: 'El sendero se adentra en un bosque espeso y húmedo.' },
          { speaker: 0, text: 'Aquí huele a musgo, a vida. En el pueblo ya solo quedaba el olor a humo.' },
          { speaker: 0, text: 'Ni siquiera me queda un lugar que llamar hogar. Solo una promesa que cumplir.' },
          { text: 'Algo se mueve entre la maleza. Una silueta verde observa a los viajeros con calma.' }
        ],
        conditions: { campamentos: 1 }
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
        id: 'dialogo-narada-previo',
        type: 'dialogo',
        narrativo: true,
        title: 'El humo de tu casa',
        description: 'La ceniza recuerda a Sima la noche que lo cambió todo.',
        dialog: [
          { text: 'La ceniza cae del cielo como nieve. Un aroma de madera quemada llena el aire.' },
          { speaker: 0, text: 'Este humo... lo conozco. Es el de la noche en que desapareció todo.' },
          { text: 'Las cortinas de niebla se apartan y Narada surge rodeado de sus tropas.' },
          { speaker: 4, text: 'El fuego que borró tu aldea debería haberte servido de lección.' },
          { speaker: 0, text: 'Me enseñó el camino, al contrario. Directo hasta ti.' },
          { speaker: 4, text: 'La venganza apaga a los vivos, audaz. Ya no tienes nada que amar.' },
          { text: 'Sima desenvaina. El viento se agita, como si las voces de su pueblo la acompañaran.' }
        ],
        conditions: { campamentos: 2 }
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
        id: 'dialogo-narada-escape',
        type: 'dialogo',
        narrativo: true,
        title: 'La sombra que huye',
        description: 'Herido, Narada se retira entre el humo.',
        dialog: [
          { text: 'Herido y tambaleante, Narada retrocede mientras sus tropas levantan un muro de ceniza.' },
          { speaker: 4, text: 'Esto no termina aquí, hoja suelta. El fuego siempre vuelve.' },
          { speaker: 0, text: 'Huye, entonces. La próxima vez no tendrás a nadie que te cubra la espalda.' },
          { speaker: 1, text: 'Su ejército mengua, Sima. La próxima vez lo encontrarás solitario y sin embargo.' },
          { text: 'El equipo observa la sombra perderse en el humo. Lo saben: es la última victoria de un cobarde.' }
        ],
        conditions: { campamentos: 2 }
      },
      {
        id: 'dialogo-urbol',
        type: 'dialogo',
        narrativo: true,
        title: 'Acero que se une',
        description: 'Un veterano ofrece su acero a la causa.',
        dialog: [
          { text: 'El camino se corta ante una mole de acero: un guerrero con un hacha al hombro.' },
          { speaker: 2, text: 'Dicen que persigues a Narada. La gente baja la voz cuando pronuncia ese nombre.' },
          { speaker: 0, text: 'No lo persigo por orgullo. Lo escribió la sangre de mi pueblo.' },
          { speaker: 2, text: 'He visto a sus tropas borrar caminos enteros del mapa. Y me quedé de brazos cruzados.' },
          { speaker: 2, text: 'Tu causa es justa y mi acero está harto de ocio. Cuenta conmigo, capitana.' },
          { text: 'Sima asiente. Por primera vez desde la ceniza, su camino pesa un poco menos.' }
        ],
        conditions: { campamentos: 3 }
      },
      {
        id: 'reclutamiento-urbol',
        type: 'reclutamiento',
        title: 'Un noble guerrero',
        description: 'Un poderoso caballero se une a tu misión.',
        character: 2,
        conditions: { campamentos: 3 }
      },
      {
        id: 'dialogo-final',
        type: 'dialogo',
        narrativo: true,
        title: 'La vela que se apaga',
        description: 'El último paso antes de la batalla definitiva.',
        dialog: [
          { text: 'El último santuario se alza entre columnas partidas, envuelto en el viento.' },
          { speaker: 0, text: 'Tras esas puertas está quien lo me arrancó todo. Todo.' },
          { speaker: 1, text: 'No llegaste sola. Esta travesía la hicimos juntos, y así será aquí.' },
          { speaker: 2, text: 'La justicia no se proclama, se ejecuta. Deja que el acero hable por ti.' },
          { speaker: 0, text: 'Entonces entren. Que la vela de Narada se apague esta noche.' }
        ],
        conditions: { campamentos: 4, enfrentamientos: 9 }
      },
      {
        id: 'final-narada',
        type: 'enfrentamiento',
        narrativo: true,
        title: 'Enfrentamiento final Narada',
        description: 'Narada bloquea el paso hacia el último santuario. Esta es la batalla definitiva.',
        enemyTeam: [4, 5, 7, -1],
        conditions: { campamentos: 4, enfrentamientos: 9, stage: 12 }
      },
      {
        id: 'conclusion',
        type: 'dialogo',
        narrativo: true,
        final: true,
        title: 'Epílogo',
        description: 'La venganza se ha consumado. La historia de Sima llega a su fin.',
        dialog: [
          { text: 'El silencio desciende sobre el santuario. Narada toma su último aliento entre las piedras.' },
          { speaker: 4, text: 'Tr... todo... los pueblos... terminan... en ceniza...' },
          { speaker: 0, text: 'Puede ser. Pero ningún fuego volverá a llevarse lo que guardo.' },
          { text: 'Sima clava su hoja como recuerdo y alza la vista. Entre los escombros, un brote se abre paso.' },
          { text: 'Su pueblo nunca volverá a ser lo que era. Pero la ceniza ya no arde: comienza algo nuevo.' }
        ],
        conditions: { campamentos: 4, enfrentamientos: 9, stage: 13 }
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
