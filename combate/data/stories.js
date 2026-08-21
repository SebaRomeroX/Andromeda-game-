const stories = [
  {
    id: 'travesia-sima',
    title: 'La Travesía de Sima',
    description: 'Sima la audaz se adentra en tierras desconocidas en busca de un unico objetivo.',
    sequential: true,
    protagonist: 0,
    allies: [1,2,9],
    genericEnemies: [3, 7, 8, 10, 11, 12, 13, 14, 15],
    narrativeEnemies: [4, 5, 6],
    teamA: [-1, 0, -1, -1],
    campAfterFights: 3,
    expectedStages: 21,
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
        id: 'camino-bosque',
        type: 'eleccion',
        narrativo: true,
        title: 'Elección de caminos',
        description: 'El sendero se divide en dos.',
        prompt: 'A la izquierda el sendero se desvia hacia el bosque, a la derecha el camino parece mas directo ¿Por qué camino quieres ir?',
        options: [
          { id: 'bosque', label: 'Izquierda' },
          { id: 'directo', label: 'Derecha' }
        ],
        conditions: { campamentos: 1 }
      },



      {
        id: 'dialogo-camino-bosque',
        type: 'dialogo',
        narrativo: true,
        title: 'A través del bosque',
        description: 'El camino serpentea entre los arboles.',
        dialog: [
          { text: 'El bosque se cierra sobre el camino, umbrío y susurrante.' },
          { speaker: 0, text: 'No hay atajos en la venganza. Pero este bosque esconde algo... lo siento.' },
          { text: 'Entre la maleza, el crujir de ramas acompaña cada paso. Sima continúa, vigilante.' }
        ],
        conditions: { eleccion: { 'camino-bosque': 'bosque' } }
      },
      {
        id: 'dialogo-druida',
        type: 'dialogo',
        narrativo: true,
        title: 'Entre los árboles',
        description: 'Algo se mueve entre las hojas.',
        dialog: [
          { text: 'Una figura sale a tu encuentro, se acerca, con lagrimas en el rostro.' },
          { speaker: 1, text: 'Oh Sima ... ya me he enterado ... Como lo siento mi querida amiga.' },
          { speaker: 0, text: '...' },
          { speaker: 1, text: 'Se a donde te dirijes. Por favor, deja que te acompañe.' },
          { speaker: 0, text: 'Sería pedirte demasiado, no puedo prometerte que volveras ... Pero necesito tu ayuda.' },
        ],
        conditions: { eleccion: { 'camino-bosque': 'bosque' } }
      },
      {
        id: 'reclutamiento-druida',
        type: 'reclutamiento',
        title: 'Una amable compañia',
        description: 'La druida del bosque cuidara tu espalda en esta travesía.',
        character: 1,
        conditions: { eleccion: { 'camino-bosque': 'bosque' } }
      },



      {
        id: 'primero-akay',
        type: 'enfrentamiento',
        narrativo: true,
        title: 'La espada mas veloz',
        description: 'Una emboscada por parte de la hoja mas certera del ejercito oscuro.',
        enemyTeam: [-1, 5, -1, -1],
        conditions: { eleccion: { 'camino-bosque': 'directo' } }
      },



      {
        id: 'camino-cueva',
        type: 'eleccion',
        narrativo: true,
        title: 'Elección de caminos',
        description: 'El sendero se divide en dos.',
        prompt: 'El camino de la derecha se adentra en unas cuevas, por el camino de la izquierda se ve directo el destino ¿Por qué camino quieres ir?',
        options: [
          { id: 'directo', label: 'Izquierda' },
          { id: 'cueva', label: 'Derecha' }
        ],
        conditions: { campamentos: 2, eleccion: { 'camino-bosque': 'directo' } }
      },



      {
        id: 'dialogo-cueva',
        type: 'dialogo',
        narrativo: true,
        title: 'Las cavernas',
        description: 'Vas por la derecha y te adentras en unas cavernas.',
        dialog: [
          { text: 'La boca de unas cavernas se cierra sobre ti, oscuras y húmedas.' },
          { speaker: 0, text: 'La luz se pierde aqui. Este camino no me gusta.' },
          { text: 'El eco del agua gotea entre las piedras. Algo se agita en la oscuridad.' }
        ],
        conditions: { eleccion: { 'camino-cueva': 'cueva' } }
      },
      {
        id: 'dialogo-aracnida',
        type: 'dialogo',
        narrativo: true,
        title: 'Atrapados',
        description: 'Te encuentras a un extraño ser.',
        dialog: [
          { text: 'En lo profundo de la caverna te encuentras a un ser aracnido atrapado.' },
          { speaker: 9, text: 'Por favor ayudame. Los secuases de Narada nos atacaron.' },
          { speaker: 0, text: 'Coso se que puedo confiar en ti ?' },
          { speaker: 9, text: 'Tambien eres su enemiga verdad ? Liberame y te ayudare a luchar contra ella.' },
          { speaker: 0, text: 'Te advierto que no perdono la traicion ...' },
        ],
        conditions: { eleccion: { 'camino-cueva': 'cueva' } }
      },
      {
        id: 'reclutamiento-aracnida',
        type: 'reclutamiento',
        title: 'Aliado inesperado',
        description: 'La aracnida promete ayudarte a cambio de su libertad.',
        character: 9,
        conditions: { eleccion: { 'camino-cueva': 'cueva' } }
      },
      {
        id: 'primero-la-bruja',
        type: 'enfrentamiento',
        narrativo: true,
        title: 'La bruja del paramo',
        description: 'La bruja que mantiene cautivo a los aracnidos.',
        enemyTeam: [-1, 8, -1, 6],
        conditions: { eleccion: { 'camino-cueva': 'cueva' } }
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
        conditions: { campamentos: 3 }
      },
      {
        id: 'sin-salida',
        type: 'enfrentamiento',
        narrativo: true,
        title: 'Ruinas',
        description: 'Por fin el objetivo a la vista.',
        enemyTeam: [4, 8, -1, -1],
        conditions: { campamentos: 3 }
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
          // { speaker: 1, text: 'Su ejército mengua, Sima. La próxima vez la encontraremos sin escapatoria.' },
          { text: 'Observan la cobarde figura perderse.' }
        ],
        conditions: { campamentos: 3 }
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
        conditions: { campamentos: 4 }
      },
      {
        id: 'reclutamiento-urbol',
        type: 'reclutamiento',
        title: 'El gran Urbol',
        description: 'Un poderoso caballero se une a tu misión.',
        character: 2,
        conditions: { campamentos: 4 }
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
          // { speaker: 1, text: 'No todo, tus compañeros estan a tu lado. No te fallaremos.' },
          { speaker: 2, text: 'La justicia no se proclama, se ejecuta.' },
          { speaker: 0, text: 'Entonces vamos. Tenemos que acabar con una bestia.' }
        ],
        conditions: { campamentos: 5 }
      },
      {
        id: 'final-narada',
        type: 'enfrentamiento',
        narrativo: true,
        title: 'Enfrentamiento final',
        description: 'Entre los escombros del santuario, Narada te espera.',
        enemyTeam: [4, 5, -1, 6],
        conditions: { campamentos: 5, eleccion: { 'camino-bosque': 'bosque' } }
      },
      {
        id: 'final-narada',
        type: 'enfrentamiento',
        narrativo: true,
        title: 'Enfrentamiento final',
        description: 'Entre los escombros del santuario, Narada te espera.',
        enemyTeam: [4, 8, -1, 6],
        conditions: { campamentos: 5, eleccion: { 'camino-cueva': 'directo' } }
      },
      {
        id: 'final-narada',
        type: 'enfrentamiento',
        narrativo: true,
        title: 'Enfrentamiento final',
        description: 'Entre los escombros del santuario, Narada te espera.',
        enemyTeam: [4, 8, -1, 3],
        conditions: { campamentos: 5, eleccion: { 'camino-cueva': 'cueva' } }
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
        conditions: { campamentos: 5 }
      }
    ]
  },






  {
    id: 'modo-libre',
    title: 'Modo libre para desarrollo',
    description: 'Se puede elegir el evento.',
    protagonist: 0,
    allies: [1],
    genericEnemies: [3, 7, 8, 10, 11, 12, 13, 14, 15],
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
        type: 'eleccion',
        narrativo: true,
        title: 'Un cruce de caminos',
        description: 'El sendero se divide en dos.',
        prompt: '¿Por qué camino quieres continuar?',
        options: [
          { id: 'izquierda', label: 'Izquierda' },
          { id: 'derecha', label: 'Derecha' }
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
        title: 'Equipo full',
        description: '4 integrantes.',
        enemyTeam: [11, 13, 15, 3]
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
