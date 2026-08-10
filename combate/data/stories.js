const stories = [
  {
    id: 'travesia-sima',
    title: 'La Travesía de Sima',
    description: 'Sima la audaz se adentra en tierras desconocidas en busca de un unico objetivo.',
    sequential: true,
    protagonist: 0,
    allies: [1,2],
    genericEnemies: [3, 5, 6, 7, 8],
    narrativeEnemies: [4],
    teamA: [-1, 0, -1, -1],
    campAfterFights: 3,
    expectedStages: 19,
    narrativeEvents: [
      {
        id: 'introduccion',
        type: 'dialogo',
        narrativo: true,
        title: 'Humo y ceniza',
        description: 'El pueblo de Sima ya no existe.',
        dialog: [
          { text: 'Un humo gris se eleva de las ruinas de lo que un día fue tu pueblo.' },
          { speaker: 0, text: 'Aún puedo sentir el fuego y oír los gritos de los que no pudieron huir.' },
          { text: 'La legion oscura de Narada no dejó mas que desolación.' },
          { speaker: 0, text: 'Narada... no hay muro, ni montaña, ni ejercito que te esconda de mí.' },
          { text: 'Con el corazón en un puño, Sima se pone en marcha. Desde hoy, su lanza solo apunta en una direccion.' }
        ]
      },
      {
        id: 'dialogo-bosque',
        type: 'dialogo',
        narrativo: true,
        title: 'Entre los árboles',
        description: 'El sendero se adentra en un bosque espeso y húmedo.',
        dialog: [
          { text: 'El camino empieza a desdibujarse entre los arboles.' },
          { text: 'Algo se mueve entre la maleza. Una figura se acerca, con lagrimas en el rostro.' },
          { speaker: 1, text: 'Oh Sima ... ya me he enterado ... Como lo siento mi querida amiga.' },
          { speaker: 0, text: '...' },
          { speaker: 1, text: 'Se a donde te dirijes. Por favor, deja que te acompañe.' },
          { speaker: 0, text: 'Sería pedirte demasiado, no puedo prometerte que volveras ... Pero necesito tu ayuda.' },
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
        title: 'Ese humo solo indica una cosa ...',
        description: 'La ceniza flotando en el aire recuerda a Sima la noche que lo cambió todo.',
        dialog: [
          { text: 'Ceniza cae del cielo como nieve. Un aroma de madera quemada llena el aire.' },
          { speaker: 0, text: 'Esta imagen... la conozco. Se que estas cerca.' },
          { text: 'Una sola figura se distingue entre rescoldo y ruinas.' },
          { speaker: 4, text: 'El fuego que borró tu aldea debería haberte servido de lección.' },
          { speaker: 0, text: 'Asi fue, ahora la compartire contigo.' },
          { speaker: 4, text: 'No tienes la fuerza para lograrlo, audaz. Ya no tienes nada.' },
          { text: 'Sima avanza, su lanza en la mano, el viento en su cabello, el recuerdo de su gente en el corazon y el enemigo en sus ojos.' }
        ],
        conditions: { campamentos: 2 }
      },
      {
        id: 'sin-salida',
        type: 'enfrentamiento',
        narrativo: true,
        title: 'Ruinas',
        description: 'Por fin el objetivo a la vista.',
        enemyTeam: [4, 8, -1, -1],
        conditions: { campamentos: 2 }
      },
      {
        id: 'dialogo-narada-escape',
        type: 'dialogo',
        narrativo: true,
        title: 'La sombra que huye',
        description: 'Narada se retira entre el humo.',
        dialog: [
          { text: 'Herida y tambaleante, Narada retrocede mientras sus tropas le cubren las espaldas.' },
          { speaker: 4, text: 'Esto no termina aquí, hoja suelta. El fuego siempre vuelve.' },
          { speaker: 0, text: 'Huye, entonces. La próxima vez no tendrás a nadie que te salve de mi.' },
          { speaker: 1, text: 'Su ejército mengua, Sima. La próxima vez la encontraremos sin escapatoria.' },
          { text: 'Observan la cobarde figura perderse.' }
        ],
        conditions: { campamentos: 2 }
      },
      {
        id: 'dialogo-urbol',
        type: 'dialogo',
        narrativo: true,
        title: 'Acero de pie',
        description: 'Un veterano caballero.',
        dialog: [
          { text: 'El camino se corta ante una mole de acero, un noble guerrero.' },
          { speaker: 2, text: 'Dicen que persigues a Narada. La gente baja la voz cuando pronuncia ese nombre.' },
          { speaker: 0, text: 'No lo hago por capricho. Me impulsa la sangre derramada de mi pueblo.' },
          { speaker: 2, text: 'He visto a sus tropas borrar reinos enteros del mapa. Y me quedé de brazos cruzados.' },
          { speaker: 2, text: 'Tu causa es justa y yo me debo a la justicia. Cuenta conmigo, capitana.' },
          { text: 'Sima asiente. Con compañeros a su lado el camino parece menos duro.' }
        ],
        conditions: { campamentos: 3 }
      },
      {
        id: 'reclutamiento-urbol',
        type: 'reclutamiento',
        title: 'El gran Urbol',
        description: 'Un poderoso caballero se une a tu misión.',
        character: 2,
        conditions: { campamentos: 3 }
      },
      {
        id: 'dialogo-final',
        type: 'dialogo',
        narrativo: true,
        title: 'La ultima llamarada',
        description: 'Un paso antes de la batalla definitiva.',
        dialog: [
          { text: 'El último santuario se alza entre columnas partidas.' },
          { speaker: 0, text: 'Tras esas puertas está quien me lo arrebató todo.. Todo.' },
          { speaker: 1, text: 'No todo, tus compañeros estan a tu lado. No te fallaremos.' },
          { speaker: 2, text: 'La justicia no se proclama, se ejecuta.' },
          { speaker: 0, text: 'Entonces vamos. Tenemos que acabar con una bestia.' }
        ],
        conditions: { campamentos: 4, enfrentamientos: 9 }
      },
      {
        id: 'final-narada',
        type: 'enfrentamiento',
        narrativo: true,
        title: 'Enfrentamiento final',
        description: 'Entre los escombros del santuario, Narada te espera.',
        enemyTeam: [4, 5, 6, -1],
        conditions: { campamentos: 4, enfrentamientos: 9, stage: 12 }
      },
      {
        id: 'conclusion',
        type: 'dialogo',
        narrativo: true,
        final: true,
        title: 'Epílogo',
        description: 'La venganza se ha consumado. La travesia de Sima llega a su fin.',
        dialog: [
          { text: 'El silencio desciende sobre el santuario. Narada toma su último aliento entre las piedras.' },
          { speaker: 4, text: 'T... todo... termina... en ceniza...' },
          { speaker: 0, text: 'Puede ser. Pero tu fuego no volvera a quemar nada.' },
          { text: 'Sima clava su hoja en el suelo y alza la vista.' },
          { text: 'Su pueblo se perdió. Pero se ha cumplido su venganza, se ha hecho justicia.' }
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
