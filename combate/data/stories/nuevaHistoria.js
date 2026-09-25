
const nuevaHistoria = {
  id: 'nueva-historia',
  title: 'En desarrollo',
  description: 'Historia actualmente incompleta',
  sequential: true,
  noProtagonist: true,
  allies: [19, 20],
  genericEnemies: [3, 7, 8, 10, 11, 12, 13, 14, 15],
  // Akay (5) solo combate en la Prueba de Fuerza; no es generico.
  narrativeEnemies: [5],
  teamA: [-1, 19, 20, -1],
  campAfterFights: 3,

  // ── Eventos aleatorios ──
  // Sorteo 1: al no haber nodo de historia pendiente, con esta
  // probabilidad ocurre un evento aleatorio en vez de combate generico.
  randomEventChance: 0.3,

  storyNodes: {},

  // Sorteo 2: entre las entradas elegibles se sortea ponderado por
  // `chance` (peso relativo; mas alto = mas comun). Entradas: 'prueba'
  // (20), 'viajero' (30), 'dama' (20), 'escolta' (20), 'maestro' (10) y
  // 'reclutas' (10) -> total 110: viajero 27.3%, 'prueba'/'dama'/
  // 'escolta' 18.2% y 'maestro'/'reclutas' 9.1% de los eventos aleatorios
  // ('reclutas' solo sortea con al menos 2 aspirantes de rol libre).
  // Los demas nodos forman el sub-grafo de una entrada y se llega a
  // ellos eligiendo rama (o por `next`).
  randomEvents: {

    // ── Nodo de entrada: las dos pruebas ──
    'prueba': {
      chance: 20,
      type: 'eleccion',
      narrativo: true,
      title: 'Prueba',
      description: 'Dos senderos marcan tu paso.',
      prompt: 'Ante ti se alza el arco de la prueba. ¿Que camino quieres recorrer?',
      options: [
        { id: 'fuerza', label: 'Prueba de Fuerza', next: 'prueba-fuerza' },
        { id: 'astucia', label: 'Prueba de Astucia', next: 'prueba-astucia' }
      ]
    },

    // ── Rama fuerza: combate contra Akay (mas un escolta generico) ──
    'prueba-fuerza': {
      type: 'enfrentamiento',
      narrativo: true,
      title: 'Prueba de Fuerza',
      description: 'Akay, la hoja certera, bloquea el paso con una escolta.',
      enemyTeam: [-1, 5, 15, -1],
      reward: { power: 1, body: 1 },
      next: 'prueba-final'
    },

    // ── Rama astucia: acertijo (recompensa solo al acertar a la primera) ──
    'prueba-astucia': {
      type: 'acertijo',
      narrativo: true,
      title: 'Prueba de Astucia',
      description: 'Una adivinanza decide tu paso.',
      question: 'Tengo ciudades, pero no casas. Tengo montanas, pero no arboles. Tengo agua, pero no peces. ¿Que soy?',
      options: [
        { id: 'rio', label: 'Un rio' },
        { id: 'mapa', label: 'Un mapa' },
        { id: 'viento', label: 'El viento' }
      ],
      answer: 'mapa',
      reward: { wealth: 1 },
      next: 'prueba-final'
    },

    // ── Convergencia: tras la prueba la partida sigue con contenido generico ──
    'prueba-final': {
      type: 'dialogo',
      narrativo: true,
      title: 'Prueba superada',
      description: 'El arco queda a tu espalda.',
      dialog: [
        { text: 'La prueba queda superada. El arco se cierra tras de ti.' },
        { text: 'Quien la supera sigue su camino, y el camino no perdona.' }
      ]
    },



    // ── Evento aleatorio: viajero atacado por bandidos (repeatable) ──
    'viajero': {
      chance: 30,
      repeatable: true,
      type: 'eleccion',
      narrativo: true,
      title: 'Viajero en apuros',
      description: 'Un grupo de bandidos ha cercado a un viajero.',
      prompt: 'Bandidos cercan a un viajero desvalido entre el polvo del camino. ¿Que haces?',
      options: [
        { id: 'ayudar', label: 'Ayudar al viajero', next: 'viajero-combate' },
        { id: 'ignorar', label: 'Seguir de largo', next: 'viajero-ignorado' }
      ]
    },

    // ── Rama ayudar: combate contra los bandidos; el viajero paga ──
    'viajero-combate': {
      type: 'enfrentamiento',
      narrativo: true,
      title: 'Viajero en apuros',
      description: 'Tres bandidos se abalanzan sobre ti.',
      enemyTeam: [7, 12, 14, -1],
      reward: { wealth: 1 },
      next: 'viajero-final'
    },

    // ── Rama ayudar: agradecimiento (terminal) ──
    'viajero-final': {
      type: 'dialogo',
      narrativo: true,
      title: 'Viajero agradecido',
      description: 'El viajero sobrevive gracias a ti.',
      dialog: [
        { text: 'El viajero recobra el aliento y te mira con los ojos muy abiertos.' },
        { text: '—Te debo la vida, andariego. Llevate esto; poco puedo darte, pero es sincero.' }
      ]
    },

    // ── Rama ignorar: nada ocurre (terminal) ──
    'viajero-ignorado': {
      type: 'dialogo',
      narrativo: true,
      title: 'Siguiendo de largo',
      description: 'No te implican en lo que no es tuyo.',
      dialog: [
        { text: 'Pasas de largo. Detras de ti, los gritos se apagan poco a poco.' },
        { text: 'No todo lo que ocurre en el camino es cosa tuya.' }
      ]
    },

    // ── Evento aleatorio: dama afligida -> trampa de bandidos (repeatable) ──
    'dama': {
      chance: 20,
      repeatable: true,
      type: 'eleccion',
      narrativo: true,
      title: 'Dama afligida',
      description: 'Una dama suplica tu ayuda junto al bosque.',
      prompt: 'Una dama, con los ojos hinchados, te dice que su hermana pequeña se ha perdido en el bosque. ¿Que haces?',
      options: [
        { id: 'ayudar', label: 'Ayudar a la dama', next: 'dama-combate' },
        { id: 'ignorar', label: 'No meterte', next: 'dama-ignorado' }
      ]
    },

    // ── Rama ayudar: el bosque es una trampa; los bandidos emboscan ──
    'dama-combate': {
      type: 'enfrentamiento',
      narrativo: true,
      title: 'Dama afligida',
      description: 'La senda se cierra a tu espalda: la hermana perdida era cebo.',
      enemyTeam: [11, 13, 14, -1],
      reward: { mind: 1, power: 1, wealth: 1 },
      next: 'dama-final'
    },

    // ── Rama ayudar: la trampa queda al descubierto (terminal) ──
    'dama-final': {
      type: 'dialogo',
      narrativo: true,
      title: 'Trampa del bosque',
      description: 'No hubo hermana perdida: solo cebo.',
      dialog: [
        { text: 'Cuando el ultimo bandido cae, buscas a la dama entre los arboles. No esta.' },
        { text: 'Nunca hubo hermana perdida: el bosque solo tenia cebo y sombra.' }
      ]
    },

    // ── Rama no meterte: nada ocurre (terminal) ──
    'dama-ignorado': {
      type: 'dialogo',
      narrativo: true,
      title: 'No es tu asunto',
      description: 'Su problema no es el tuyo.',
      dialog: [
        { text: 'Le niegas la ayuda con un gesto y sigues tu camino.' },
        { text: 'Detras de ti, la dama te observa en silencio hasta que te pierdes entre el polvo.' }
      ]
    },

    // ── Evento aleatorio: escolta de caravana (repeatable) ──
    'escolta': {
      chance: 20,
      repeatable: true,
      type: 'eleccion',
      narrativo: true,
      title: 'Escolta de caravana',
      description: 'Una caravana pide proteccion en el camino.',
      prompt: 'Un grupo de viajeros te sale al paso con su caravana y te pide que los protejas hasta la siguiente ciudad. ¿Que haces?',
      options: [
        { id: 'ayudar', label: 'Proteger la caravana', next: 'escolta-combate-1' },
        { id: 'rechazar', label: 'Rechazar', next: 'escolta-encuentro' }
      ]
    },

    // ── Rama ayudar: cuatro combates en la ruta; sin recompensa propia
    //    (cada victoria tira la recompensa por defecto, como un combate
    //    generico); la caravana paga recien en el cuarto ──
    'escolta-combate-1': {
      type: 'enfrentamiento',
      narrativo: true,
      title: 'Escolta de caravana',
      description: 'Una vanguardia de bandidos corta el paso a la columna.',
      enemyTeam: [-1, 12, 14, -1],
      next: 'escolta-combate-2'
    },

    'escolta-combate-2': {
      type: 'enfrentamiento',
      narrativo: true,
      title: 'Escolta de caravana',
      description: 'Una segunda oleada embiste los carros.',
      enemyTeam: [10, -1, -1, 3],
      next: 'escolta-combate-3'
    },

    'escolta-combate-3': {
      type: 'enfrentamiento',
      narrativo: true,
      title: 'Escolta de caravana',
      description: 'La emboscada se cierra sobre el camino.',
      enemyTeam: [7, -1, 14, -1],
      next: 'escolta-combate-4'
    },

    'escolta-combate-4': {
      type: 'enfrentamiento',
      narrativo: true,
      title: 'Escolta de caravana',
      description: 'Los jefes de la banda cargan por ultima vez.',
      enemyTeam: [11, 13, 15, -1],
      reward: { wealth: 2 },
      next: 'escolta-final'
    },

    // ── Rama ayudar: la caravana llega entera y te paga (terminal) ──
    'escolta-final': {
      type: 'dialogo',
      narrativo: true,
      title: 'Caravana a salvo',
      description: 'La caravana llega a su destino sin perdidas.',
      dialog: [
        { text: '—Te debemos mucho, andariego. Sin ti no hubieramos llegado.' },
        { text: 'Descargan las mercancias en la ciudad y tu cobras el pago acordado.' }
      ]
    },

    // ── Rama rechazar: mas adelante la caravana ya fue asaltada ──
    'escolta-encuentro': {
      type: 'dialogo',
      narrativo: true,
      title: 'Caravana asaltada',
      description: 'Los viajeros que rechazaste yacen muertos en el camino.',
      dialog: [
        { text: 'Mas adelante la senda te devuelve a la caravana: carros volcados, guardias caidos, nadie con vida.' },
        { text: 'Entonces, entre los arboles, te reconocen los que lo hicieron.' }
      ],
      next: 'escolta-asalto'
    },

    // ── Rama rechazar: los asaltantes te emboscan; el botin es tuyo ──
    'escolta-asalto': {
      type: 'enfrentamiento',
      narrativo: true,
      title: 'Escolta de caravana',
      description: 'Los asaltantes no piensan dejar testigos.',
      enemyTeam: [7, 8, 14, 3],
      reward: { wealth: 2 },
      next: 'escolta-asalto-final'
    },

    'escolta-asalto-final': {
      type: 'dialogo',
      narrativo: true,
      title: 'El botin recuperado',
      description: 'Recuperas lo que se llevaron los bandidos.',
      dialog: [
        { text: 'Cuando el ultimo asaltante cae, revisas sus alforjas.' },
        { text: 'Alli esta el oro de la caravana. Les pertenecia; ahora es tuyo.' }
      ]
    },

    // ── Evento aleatorio: el Maestro del camino (repeatable) ──
    // Pregunta sabia al azar de `questions` (una por reencuentro). Acertar
    // otorga 1 orbe de un tipo al azar (mente/poder/cuerpo, sin riqueza);
    // fallar no da recompensa pero el sabio explica su `explanation`.
    'maestro': {
      chance: 10,
      repeatable: true,
      type: 'acertijo',
      narrativo: true,
      title: 'Maestro',
      description: 'Un sabio del camino te hace una pregunta.',
      questions: [
        {
          question: 'Un sabio debe estar seguro de lo que dice?',
          options: [
            { id: 'seguro', label: 'Siempre' },
            { id: 'dudar', label: 'Un sabio debe dudar de todo' }
          ],
          answer: 'dudar',
          explanation: 'Quien se atreve a dudar sigue buscando la verdad; el que se aferra a lo que dice deja de aprender.'
        },
        {
          question: 'Un sabio habla poco porque...',
          options: [
            { id: 'ocultan', label: 'Las palabras de mas ocultan la verdad' },
            { id: 'nadie', label: 'No encuentra quien lo escuche' }
          ],
          answer: 'ocultan',
          explanation: 'Las palabras de mas tapan lo que quieren decir; el que habla poco, cuando habla, vale oro.'
        },
        {
          question: 'Conocer a los demas es ser listo. Conocerte a ti mismo es...',
          options: [
            { id: 'sabiduria', label: 'Sabiduria' },
            { id: 'suerte', label: 'Suerte' }
          ],
          answer: 'sabiduria',
          explanation: 'Ver los defectos ajenos es facil; mirar los propios es el principio de toda sabiduria.'
        },
        {
          question: 'Los mejores viaje comienzan con...',
          options: [
            { id: 'paso', label: 'Un solo paso' },
            { id: 'mapa', label: 'Un buen mapa' }
          ],
          answer: 'paso',
          explanation: 'Ni el mejor plan vale nada si no lo ejecutas; el primer paso es el unico que te hara avanzar.'
        },
        {
          question: 'Si te pierdes en el mar te guias de...',
          options: [
            { id: 'luna', label: 'La luna' },
            { id: 'estrellas', label: 'Las estrellas' }
          ],
          answer: 'estrellas',
          explanation: 'Las estrellas son fijas y marcan el norte; la luna va cambiando y solo presta luz.'
        },
        {
          question: 'La luna no tiene luz propia. La suya es...',
          options: [
            { id: 'reflejo', label: 'Reflejo de la del sol' },
            { id: 'fuego', label: 'Un fuego frio' }
          ],
          answer: 'reflejo',
          explanation: 'La luna es una piedra fria que no alumbra por si sola; toma prestada la luz del sol que da en ella.'
        },
        {
          question: 'Cada estrella que ves de noche es...',
          options: [
            { id: 'otro-sol', label: 'Otro sol muy lejano' },
            { id: 'lampara', label: 'Una lampara encendida en el cielo' }
          ],
          answer: 'otro-sol',
          explanation: 'La estrella es un sol como el nuestro, tan lejos que su fuego nos llega como un punto de luz.'
        },
        {
          question: 'El sol sale cada dia porque...',
          options: [
            { id: 'tierra', label: 'La Tierra gira sobre si misma' },
            { id: 'orbita', label: 'El sol da vueltas alrededor de la Tierra' }
          ],
          answer: 'tierra',
          explanation: 'Es la Tierra la que gira sobre si misma; mientras gira, cada lugar recibe la luz del sol por su vez.'
        },
        {
          question: 'El agua es mas blanda que la piedra, y aun asi...',
          options: [
            { id: 'desgasta', label: 'Desgasta la roca' },
            { id: 'aparta', label: 'Se aparta ante ella' }
          ],
          answer: 'desgasta',
          explanation: 'El agua cede ante todo y por eso lo atraviesa todo; la piedra resiste y con el tiempo se quiebra.'
        },
        {
          question: 'Para el sabio, la hoja que cae no es el fin, sino...',
          options: [
            { id: 'cambio', label: 'El cambio que viene' },
            { id: 'desgracia', label: 'Una desgracia' }
          ],
          answer: 'cambio',
          explanation: 'La hoja cae para que la raiz descanse y el arbol vuelva a verdecer; temer el cambio es temer la vida.'
        }
      ],
      reward: { randomType: ['mind', 'power', 'body'] },
      next: 'maestro-final'
    },

    // ── Terminal: el sabio sigue su camino (gap antes del re-sorteo) ──
    'maestro-final': {
      type: 'dialogo',
      narrativo: true,
      title: 'El sabio sigue su camino',
      description: 'La leccion termina y el sabio se despide.',
      dialog: [
        { text: 'El sabio recoge su baston y retoma la senda sin mirar atras.' },
        { text: '—Preguntate bien, andariego. El camino ensena a quien sabe escuchar.' }
      ]
    },

    // ── Evento aleatorio: dos viajeros piden unirse (repeatable) ──
    // Dos aspirantes al azar de `genericEnemies` con la ranura de su rol
    // libre (la entrada no sortea si hay menos de 2). Al elegir uno, pide
    // una demanda al azar: 1 orbe de riqueza, derrotar a sus enemigos o
    // 3 preguntas de confianza (3/3 para unirse). Rechazar la demanda (o
    // seguir de largo) cierra el evento sin union. El combate se encadena
    // por `branches` (el handler fija el puntero, no hay `next` visible).
    'reclutas': {
      chance: 10,
      repeatable: true,
      type: 'reclutamiento_oferta',
      narrativo: true,
      title: 'Viajeros sin banda',
      description: 'Dos desconocidos del camino te piden unirse a tu grupo.',
      prompt: 'Dos viajeros sin banda se acercan a tu fuego. ¿Quieres que uno de ellos se una a tu grupo?',
      branches: ['reclutas-combate'],
      refuseText: '—Como quieras. El desconocido asiente y retoma la senda sin mirar atras.',
      failText: '—No confio en ti. La prueba termina aqui y cada uno sigue su camino.',
      demands: {
        wealth: {
          text: '—El camino es duro y yo ando sin nada. Dame 1 orbe de riqueza y te servire con lealtad.',
          accept: 'Pagar 1 orbe de riqueza',
          refuse: 'Marcharse sin el'
        },
        combat: {
          text: '—Hay enemigos que me persiguen. Si los derrotas a mi lado, juro unirme a tus filas.',
          accept: 'Aceptar y luchar',
          refuse: 'Rechazar y seguir de camino'
        },
        questions: {
          text: '—No me bastan las palabras. Responde mis tres preguntas de confianza y unire a tu grupo.',
          accept: 'Aceptar la prueba',
          refuse: 'Rechazar y seguir de camino'
        }
      },
      questions: [
        {
          question: 'El grupo hambriento encuentra un campamento abandonado con comida. ¿Que haces?',
          options: [
            { id: 'repartir', label: 'Repartirla por igual' },
            { id: 'esconder', label: 'Esconderla para mi' }
          ],
          answer: 'repartir'
        },
        {
          question: 'Un compañero te cuenta un secreto del grupo y otro te lo pregunta. ¿Que respondes?',
          options: [
            { id: 'callar', label: 'No es mio que contar' },
            { id: 'contar', label: 'Contarselo todo' }
          ],
          answer: 'callar'
        },
        {
          question: 'Te toca velar la retaguardia mientras el grupo duerme. ¿Que haces?',
          options: [
            { id: 'velar', label: 'Me mantengo despierto' },
            { id: 'dormir', label: 'Duermo; alguien vigilara' }
          ],
          answer: 'velar'
        },
        {
          question: 'Encuentas una moneda de oro en el camino y nadie la ha visto. ¿Que haces?',
          options: [
            { id: 'grupo', label: 'La guardo para el grupo' },
            { id: 'yo', label: 'La guardo para mi' }
          ],
          answer: 'grupo'
        },
        {
          question: 'Un enemigo derrotado te pide agua y tu grupo no lo ve. ¿Que haces?',
          options: [
            { id: 'agua', label: 'Le doy de beber' },
            { id: 'dejar', label: 'Lo dejo donde esta' }
          ],
          answer: 'agua'
        },
        {
          question: 'Tu racion cae al suelo y el grupo no se ha dado cuenta. ¿Que haces?',
          options: [
            { id: 'avisar', label: 'Aviso y la compartimos' },
            { id: 'comer', label: 'Me la como sin decir nada' }
          ],
          answer: 'avisar'
        }
      ]
    },

    // ── Rama combate: los enemigos del aspirante; al vencer se une ──
    'reclutas-combate': {
      type: 'enfrentamiento',
      narrativo: true,
      title: 'Los enemigos del aspirante',
      description: 'Los enemigos del aspirante te cortan el paso en el camino.',
      enemyTeam: [10, 12, 14, -1],
      next: 'reclutas-exito'
    },

    // ── Rama combate: el aspirante se une al grupo (terminal) ──
    'reclutas-exito': {
      type: 'reclutamiento_final',
      narrativo: true,
      title: 'Un nuevo rostro en el grupo',
      description: 'Los enemigos caen y el aspirante reconoce tu valor.'
    }
  }
};

export default nuevaHistoria;
