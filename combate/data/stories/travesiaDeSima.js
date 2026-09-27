const travesiaDeSima = {
  id: 'travesia-sima',
  title: 'La Travesia de Sima',
  description: 'Sima la audaz se adentra en tierras desconocidas en busca de un unico objetivo.',
  sequential: true,
  protagonist: 'Sima',
  allies: ['La druida', 'Urbol', 'Aracnida', 'Piedrita'],
  genericEnemies: ['Sacerdotiza oscura', 'Guerrero', 'Sabueso de Guerra', 'Lancero', 'Hamer', 'Espadachin', 'Asesina', 'Arquera', 'Witch'],
  narrativeEnemies: ['Narada', 'Akay', 'La bruja del paramo', 'Capitan Oscuro', 'Demonic'],
  teamA: [null, 'Sima', null, null],
  campAfterFights: 3,
  expectedStages: 21,

  // ─── NODO INICIAL ───────────────────────────────────────────────────
  storyNodes: {

    // ── Apertura ──
    'intro': {
      type: 'dialogo',
      narrativo: true,
      title: 'Humo y ceniza',
      description: 'El pueblo de Sima ya no existe.',
      dialog: [
        { text: 'Un humo gris se eleva de las ruinas de lo que un dia fue tu pueblo.' },
        { speaker: 'Sima', text: 'Aun puedo sentir el fuego y oir los gritos de los que no pudieron huir.' },
        { text: 'La legion oscura de Narada no dejo mas que desolacion.' },
        { speaker: 'Sima', text: 'Narada... no hay muro, ni montana, ni ejercito que te esconda de mi.' },
        { text: 'Con el corazon en un puno, Sima se pone en marcha. Desde hoy, su lanza solo apunta en una direccion.' }
      ],
      next: 'elegir-camino'
    },

    // ── Primer cruce: Bosque vs Directo ──
    'elegir-camino': {
      type: 'eleccion',
      narrativo: true,
      title: 'Eleccion de caminos',
      description: 'El sendero se divide en dos.',
      prompt: 'A la izquierda el sendero se desvia hacia el bosque, a la derecha el camino parece mas directo. Por que camino quieres ir?',
      options: [
        { id: 'bosque', label: 'Izquierda', next: 'bosque-intro' },
        { id: 'directo', label: 'Derecha', next: 'elegir-camino-2' }
      ],
      conditions: { campamentos: 1 }
    },

    // ══════════════════════════════════════════════════════════════════
    //  RAMA BOSQUE
    // ══════════════════════════════════════════════════════════════════

    'bosque-intro': {
      type: 'dialogo',
      narrativo: true,
      title: 'A traves del bosque',
      description: 'El camino serpentea entre los arboles.',
      dialog: [
        { text: 'El bosque se cierra sobre el camino, umbrio y susurrante.' },
        { speaker: 'Sima', text: 'No hay atajos en la venganza. Pero este bosque esconde algo... lo siento.' },
        { text: 'Entre la maleza, el crujir de ramas acompana cada paso. Sima continua, vigilante.' }
      ],
      conditions: { campamentos: 1 },
      next: 'dialogo-druida'
    },

    'dialogo-druida': {
      type: 'dialogo',
      narrativo: true,
      title: 'Entre los arboles',
      description: 'Algo se mueve entre las hojas.',
      dialog: [
        { text: 'Una figura sale a tu encuentro, se acerca, con lagrimas en el rostro.' },
        { speaker: 'La druida', text: 'Oh Sima ... ya me he enterado ... Como lo siento mi querida amiga.' },
        { speaker: 'Sima', text: '...' },
        { speaker: 'La druida', text: 'Se a donde te dirijes. Por favor, deja que te acompanie.' },
        { speaker: 'Sima', text: 'Seria pedirte demasiado, no puedo prometerte que volveras ... Pero necesito tu ayuda.' },
      ],
      conditions: { campamentos: 2 },
      next: 'reclutamiento-druida'
    },

    'reclutamiento-druida': {
      type: 'reclutamiento',
      title: 'Una amable compania',
      description: 'La druida del bosque cuidara tu espalda en esta travesia.',
      character: 'La druida',
      conditions: { campamentos: 2 },
      next: 'dialogo-akay'
    },

    'dialogo-akay': {
      type: 'dialogo',
      narrativo: true,
      title: 'Imprevistos',
      description: 'Por el linde del bosque el camino avanza.',
      dialog: [
        { text: 'El camino parece ir despejado.' },
        { text: 'Sin embargo, los obstaculos nunca faltan.' },
        { text: 'Emboscada !!!' },
        { text: 'Sima reacciona justo a tiempo para detener el ataque ...' },
        { speaker: 'Akay', text: 'Jajaja parece que un cachorro se a perdido.' },
        { speaker: 'Sima', text: 'Te conozco, alimaña rastrera. Eres una de las espadas de Narada' },
        { speaker: 'Akay', text: 'Ahhh asi que vas tras la comandante oscura.' },
        { speaker: 'Akay', text: 'Que bella forma de buscar tu propia destruccion jajaja.' },
        { speaker: 'Akay', text: 'Sin embargo no puedo permitirlo ...' },
        { text: 'Akay, la hoja certera de los oscuros, se avalanza hacia ti.' }
      ],
      conditions: { campamentos: 3 },
      next: 'primero-akay'
    },

    'primero-akay': {
      type: 'enfrentamiento',
      narrativo: true,
      title: 'La espada mas veloz',
      description: 'Una emboscada por parte de la hoja mas certera del ejercito oscuro.',
      enemyTeam: [null, 'Akay', 'Arquera', null],
      conditions: { campamentos: 3 },
      next: 'dialogo-urbol'
    },

    'dialogo-urbol': {
      type: 'dialogo',
      narrativo: true,
      title: 'Acero de pie',
      description: 'Un veterano caballero.',
      dialog: [
        { text: 'El camino se corta ante una mole de acero, un noble guerrero.' },
        { speaker: 'Urbol', text: 'Dicen que persigues a Narada. La gente baja la voz cuando pronuncia ese nombre.' },
        { speaker: 'Sima', text: 'No lo hago por capricho. Me impulsa la sangre derramada de mi pueblo.' },
        { speaker: 'Urbol', text: 'He visto a sus tropas borrar reinos enteros del mapa. Y me quede de brazos cruzados.' },
        { speaker: 'Urbol', text: 'Tu causa es justa y yo me debo a la justicia. Cuenta conmigo, capitana.' },
        { text: 'Sima asiente. Con companeros a su lado el camino parece menos duro.' }
      ],
      conditions: { campamentos: 4 },
      next: 'reclutamiento-urbol'
    },

    'reclutamiento-urbol': {
      type: 'reclutamiento',
      title: 'El gran Urbol',
      description: 'Un poderoso caballero se une a tu mision.',
      character: 'Urbol',
      conditions: { campamentos: 4 },
      next: 'dialogo-capitan-oscuro-bosque'
    },

    'dialogo-capitan-oscuro-bosque': {
      type: 'dialogo',
      narrativo: true,
      title: 'Ese humo solo indica una cosa ...',
      description: 'La ceniza flotando en el aire recuerda a Sima la noche que lo cambio todo.',
      dialog: [
        { text: 'Ceniza cae del cielo como nieve. Un aroma de madera quemada llena el aire.' },
        { speaker: 'Sima', text: 'Esta imagen... la conozco. Se que estas cerca.' },
        { text: 'Una sola figura se distingue entre rescoldo y ruinas.' },
        { speaker: 'Capitan Oscuro', text: 'No daras ni un paso mas hacia la comandante, aqui se acaba tu vano intento de venganza.' },
        { speaker: 'Sima', text: 'Eso lo veremos.' },
        { text: 'Sima avanza...' },
      ],
      conditions: { campamentos: 5 },
      next: 'sin-salida-bosque'
    },

    'sin-salida-bosque': {
      type: 'enfrentamiento',
      narrativo: true,
      title: 'Ruinas',
      description: 'Por fin el objetivo a la vista.',
      enemyTeam: ['Capitan Oscuro', 'Sabueso de Guerra', 'Arquera', 'Sacerdotiza oscura'],
      reward: { mind: 1, power: 1 },
      conditions: { campamentos: 5 },
      next: 'dialogo-final-bosque'
    },

    'dialogo-final-bosque': {
      type: 'dialogo',
      narrativo: true,
      title: 'La ultima llamarada',
      description: 'Un paso antes de la batalla definitiva.',
      dialog: [
        { text: 'El ultimo santuario se alza entre columnas partidas.' },
        { speaker: 'Sima', text: 'Tras esas puertas esta quien me lo arrebato todo.. Todo.' },
        { speaker: 'La druida', text: 'No todo, tus companeros estan a tu lado. No te fallaremos.' },
        { speaker: 'Urbol', text: 'La justicia no se proclama, se ejecuta.' },
        { speaker: 'Sima', text: 'Entonces vamos. Tenemos que acabar con una bestia.' },
        { text: 'Sima avanza, su lanza en la mano, el viento en su cabello, el recuerdo de su gente en el corazon y el enemigo frente a sus ojos.' },
      ],
      conditions: { campamentos: 5 },
      next: 'final-narada-bosque'
    },

    'final-narada-bosque': {
      type: 'enfrentamiento',
      narrativo: true,
      title: 'Enfrentamiento final',
      description: 'Entre los escombros del santuario, Narada te espera.',
      enemyTeam: ['Narada', 'Espadachin', 'Demonic', 'La bruja del paramo'],
      reward: { mind: 1, power: 1, body: 1 },
      conditions: { campamentos: 5 },
      next: 'conclusion-bosque'
    },

    'conclusion-bosque': {
      type: 'dialogo',
      narrativo: true,
      title: 'Epilogo',
      description: 'La venganza se ha consumado. La travesia de Sima llega a su fin.',
      dialog: [
        { text: 'El silencio desciende sobre el santuario. Narada toma su ultimo aliento entre las piedras.' },
        { speaker: 'Narada', text: 'T... todo... termina... en ceniza...' },
        { speaker: 'Sima', text: 'Puede ser. Pero tu fuego no volvera a quemar nada.' },
        { text: 'Sima clava su hoja en el suelo y alza la vista.' },
        { text: 'Su pueblo se perdio. Pero se ha cumplido su venganza, se ha hecho justicia.' }
      ],
      conditions: { campamentos: 5 },
      final: true
    },

    // ══════════════════════════════════════════════════════════════════
    //  RAMA DIRECTO → Segundo cruce: Cueva vs Directo
    // ══════════════════════════════════════════════════════════════════

    'elegir-camino-2': {
      type: 'eleccion',
      narrativo: true,
      title: 'Eleccion de caminos',
      description: 'El sendero se divide en dos.',
      prompt: 'El camino de la derecha se adentra en unas cuevas, por el camino de la izquierda se ve directo el destino. Por que camino quieres ir?',
      options: [
        { id: 'directo', label: 'Izquierda', next: 'piedrita' },
        { id: 'cueva', label: 'Derecha', next: 'cueva-intro' }
      ],
      conditions: { campamentos: 2 }
    },

    // ══════════════════════════════════════════════════════════════════
    //  RAMA CUEVA
    // ══════════════════════════════════════════════════════════════════

    'cueva-intro': {
      type: 'dialogo',
      narrativo: true,
      title: 'Las cavernas',
      description: 'Vas por la derecha y te adentras en unas cavernas.',
      dialog: [
        { text: 'La boca de unas cavernas se cierra sobre ti, oscuras y humedas.' },
        { speaker: 'Sima', text: 'La luz se pierde aqui. Este camino no me gusta.' },
        { text: 'El eco del agua gotea entre las piedras. Algo se agita en la oscuridad.' }
      ],
      next: 'dialogo-aracnida'
    },

    'dialogo-aracnida': {
      type: 'dialogo',
      narrativo: true,
      title: 'Atrapados',
      description: 'Te encuentras a un extraño ser.',
      dialog: [
        { text: 'En lo profundo de la caverna te encuentras a un ser aracnido atrapado.' },
        { speaker: 'Aracnida', text: 'Por favor ayudame. Los secuases de Narada nos atacaron.' },
        { speaker: 'Sima', text: 'Como se que puedo confiar en ti ?' },
        { speaker: 'Aracnida', text: 'Tambien eres su enemiga verdad ? Liberame y te ayudare a luchar contra ella.' },
        { speaker: 'Sima', text: 'Te advierto que no perdono la traicion ...' },
      ],
      next: 'reclutamiento-aracnida'
    },

    'reclutamiento-aracnida': {
      type: 'reclutamiento',
      title: 'Aliado inesperado',
      description: 'La aracnida promete ayudarte a cambio de su libertad.',
      character: 'Aracnida',
      next: 'dialogo-bruja'
    },

    'dialogo-bruja': {
      type: 'dialogo',
      narrativo: true,
      title: 'Aracnidos cautivos',
      description: 'Ayuda a los aracnidos.',
      dialog: [
        { text: 'En una amplia caberna, La bruja del paramo, quien mantiene cautivos a los aracnidos.' },
        { speaker: 'Aracnida', text: 'Libera a mi gente, maldita !' },
        { speaker: 'La bruja del paramo', text: 'Y porque haria tal cosa ?' },
        { text: 'La bruja los mira con una sonrisa burlona.' },
        { text: 'Tu companera aracnida pierde los nervios. Sima sujeta firme su escudo y da un paso al frente.' },
      ],
      conditions: { campamentos: 3 },
      next: 'primero-la-bruja'
    },

    'primero-la-bruja': {
      type: 'enfrentamiento',
      narrativo: true,
      title: 'La bruja del paramo',
      description: 'La bruja que mantiene cautivo a los aracnidos.',
      enemyTeam: [null, 'Espadachin', 'Arquera', 'La bruja del paramo'],
      conditions: { campamentos: 3 },
      next: 'dialogo-bruja-derrotada'
    },

    'dialogo-bruja-derrotada': {
      type: 'dialogo',
      narrativo: true,
      title: 'Liberacion',
      description: 'La bruja ha sido vencida.',
      dialog: [
        { text: 'Con la Bruja del paramo vencida, los aracnidos son libres.' },
        { speaker: 'Aracnida', text: 'Gracias por ayudarnos, buena suerte en tu viaje ...' },
        { text: 'Sima la mira seriamente.' },
        { speaker: 'Sima', text: 'Hicimos un trato ...' },
        { text: 'La aracnida agacha la cabeza.' },
        { speaker: 'Aracnida', text: 'Esta bien ... te seguire' },
      ],
      conditions: { campamentos: 3 },
      next: 'dialogo-final-cueva'
    },

    'dialogo-final-cueva': {
      type: 'dialogo',
      narrativo: true,
      title: 'La ultima llamarada',
      description: 'Un paso antes de la batalla definitiva.',
      dialog: [
        { text: 'El ultimo santuario se alza entre columnas partidas.' },
        { speaker: 'Sima', text: 'Tras esas puertas esta quien me lo arrebato todo.. Todo.' },
        { speaker: 'Aracnida', text: 'Yo te cubro la espalda Sima, no te fallare.' },
        { speaker: 'Sima', text: 'Entonces vamos. Tenemos que acabar con una bestia.' },
        { text: 'Sima avanza, su lanza en la mano, el viento en su cabello, el recuerdo de su gente en el corazon y el enemigo frente a sus ojos.' },
      ],
      conditions: { campamentos: 5 },
      next: 'final-narada-cueva'
    },

    'final-narada-cueva': {
      type: 'enfrentamiento',
      narrativo: true,
      title: 'Enfrentamiento final',
      description: 'Entre los escombros del santuario, Narada te espera.',
      enemyTeam: ['Narada', 'Akay', 'Demonic', 'Sacerdotiza oscura'],
      reward: { mind: 1, power: 1, body: 1 },
      conditions: { campamentos: 5 },
      next: 'conclusion-cueva'
    },

    'conclusion-cueva': {
      type: 'dialogo',
      narrativo: true,
      title: 'Epilogo',
      description: 'La venganza se ha consumado. La travesia de Sima llega a su fin.',
      dialog: [
        { text: 'El silencio desciende sobre el santuario. Narada toma su ultimo aliento entre las piedras.' },
        { speaker: 'Narada', text: 'T... todo... termina... en ceniza...' },
        { speaker: 'Sima', text: 'Puede ser. Pero tu fuego no volvera a quemar nada.' },
        { text: 'Sima clava su hoja en el suelo y alza la vista.' },
        { text: 'Su pueblo se perdio. Pero se ha cumplido su venganza, se ha hecho justicia.' }
      ],
      conditions: { campamentos: 5 },
      final: true
    },

    // ══════════════════════════════════════════════════════════════════
    //  RAMA DIRECTO (segundo cruce)
    // ══════════════════════════════════════════════════════════════════

    'piedrita': {
      type: 'dialogo',
      narrativo: true,
      title: 'En apuros',
      description: 'Tropas de Narada estan atacando a alguien.',
      dialog: [
        { text: 'A lo lejos vez a soldados oscuros atacando a una pequena figura.' },
        { text: 'Parece ser un nino, pero al acercarte te das cuenta que no es un nino como tal.' },
        { speaker: 'Piedrita', text: 'Prrrr rr Qrrr !!' },
        { text: 'Es una cria de golem, los saldados estan atormentandolo.' },
        { speaker: 'Sima', text: 'Sus despreciables vidas han llegado a su fin' },
      ],
      next: 'reclutamiento-piedrita'
    },

    'reclutamiento-piedrita': {
      type: 'reclutamiento',
      title: 'Pequeno en aprietos',
      description: 'Ayudas a una criatura que te necesita.',
      character: 'Piedrita',
      next: 'dialogo-demonica'
    },

    'dialogo-demonica': {
      type: 'dialogo',
      narrativo: true,
      title: 'Camino pedregozo',
      description: 'Mas directo, por bordes y penascos.',
      dialog: [
        { text: 'Avanzas varios kilometros casi sin contratiempos.' },
        { text: 'El camino se ensancha, al final del terraplen, una inquietante figura.' },
        { text: 'Se gira y se acerca flotando hacia ti.' },
        { speaker: 'Demonic', text: 'Dahal ba selak gotur malak !' },
        { speaker: 'Sima', text: 'No entiendo tus palabras, pero tampoco me interesan.' },
        { speaker: 'Sima', text: 'Eres otra de los subordinados de esa escoria y caeras como el resto de ellos.' },
        { text: 'Sima apunta su lanza hacia el enemigo, decision en su mirada.' },
      ],
      conditions: { campamentos: 3 },
      next: 'primero-demonica'
    },

    'primero-demonica': {
      type: 'enfrentamiento',
      narrativo: true,
      title: 'Demonica',
      description: 'La segunda bajo el mando de la legion oscura.',
      enemyTeam: [null, 'Asesina', 'Demonic', null],
      conditions: { campamentos: 3 },
      next: 'dialogo-capitan-oscuro-directo'
    },

    'dialogo-capitan-oscuro-directo': {
      type: 'dialogo',
      narrativo: true,
      title: 'Ese humo solo indica una cosa ...',
      description: 'La ceniza flotando en el aire recuerda a Sima la noche que lo cambio todo.',
      dialog: [
        { text: 'Ceniza cae del cielo como nieve. Un aroma de madera quemada llena el aire.' },
        { speaker: 'Sima', text: 'Esta imagen... la conozco. Se que estas cerca.' },
        { text: 'Una sola figura se distingue entre rescoldo y ruinas.' },
        { speaker: 'Narada', text: 'El fuego que borro tu aldea deberia haberte servido de leccion.' },
        { speaker: 'Sima', text: 'Asi fue, ahora la compartire contigo.' },
        { speaker: 'Narada', text: 'No tienes la fuerza para lograrlo, audaz. Ya no tienes nada.' },
        { text: 'Sima avanza... pero' },
        { text: 'Una figura se atraviesa en su camino' },
        { speaker: 'Capitan Oscuro', text: 'No daras ni un paso mas hacia la comandante, aqui se acaba tu vano intento de venganza.' },
      ],
      conditions: { campamentos: 4 },
      next: 'sin-salida-directo'
    },

    'sin-salida-directo': {
      type: 'enfrentamiento',
      narrativo: true,
      title: 'Ruinas',
      description: 'Por fin el objetivo a la vista.',
      enemyTeam: ['Capitan Oscuro', 'Sabueso de Guerra', null, null],
      reward: { mind: 1, power: 1 },
      conditions: { campamentos: 4 },
      next: 'dialogo-narada-escape'
    },

    'dialogo-narada-escape': {
      type: 'dialogo',
      narrativo: true,
      title: 'La sombra que huye',
      description: 'Narada se retira entre el humo.',
      dialog: [
        { text: 'Narada se aleja mientras sus tropas le cubren las espaldas.' },
        { speaker: 'Narada', text: 'Esto no termina aqui, hoja suelta. El fuego siempre vuelve.' },
        { speaker: 'Sima', text: 'Huye, entonces. La proxima vez no tendras a nadie que te salve de mi.' },
        { text: 'Observan la cobarde figura perderse.' }
      ],
      conditions: { campamentos: 4 },
      next: 'dialogo-final-directo'
    },

    'dialogo-final-directo': {
      type: 'dialogo',
      narrativo: true,
      title: 'La ultima llamarada',
      description: 'Un paso antes de la batalla definitiva.',
      dialog: [
        { text: 'El ultimo santuario se alza entre columnas partidas.' },
        { speaker: 'Sima', text: 'Tras esas puertas esta quien me lo arrebato todo.. Todo.' },
        { speaker: 'Piedrita', text: 'Grrr Gr.' },
        { speaker: 'Sima', text: 'Vamos. Tenemos que acabar con una bestia.' },
        { text: 'Sima avanza, su lanza en la mano, el viento en su cabello, el recuerdo de su gente en el corazon y el enemigo frente a sus ojos.' },
      ],
      conditions: { campamentos: 5 },
      next: 'final-narada-directo'
    },

    'final-narada-directo': {
      type: 'enfrentamiento',
      narrativo: true,
      title: 'Enfrentamiento final',
      description: 'Entre los escombros del santuario, Narada te espera.',
      enemyTeam: ['Narada', 'Akay', 'Arquera', 'La bruja del paramo'],
      reward: { mind: 1, power: 1, body: 1 },
      conditions: { campamentos: 5 },
      next: 'conclusion-directo'
    },

    'conclusion-directo': {
      type: 'dialogo',
      narrativo: true,
      title: 'Epilogo',
      description: 'La venganza se ha consumado. La travesia de Sima llega a su fin.',
      dialog: [
        { text: 'El silencio desciende sobre el santuario. Narada toma su ultimo aliento entre las piedras.' },
        { speaker: 'Narada', text: 'T... todo... termina... en ceniza...' },
        { speaker: 'Sima', text: 'Puede ser. Pero tu fuego no volvera a quemar nada.' },
        { text: 'Sima clava su hoja en el suelo y alza la vista.' },
        { text: 'Su pueblo se perdio. Pero se ha cumplido su venganza, se ha hecho justicia.' }
      ],
      conditions: { campamentos: 5 },
      final: true
    }
  }
};

export default travesiaDeSima;
