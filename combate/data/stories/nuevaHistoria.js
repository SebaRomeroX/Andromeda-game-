
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
  // y 'viajero' (20 de 70 = 28.6% de los eventos aleatorios). Los
  // demas nodos forman el sub-grafo de una entrada y se llega a ellos
  // eligiendo rama (o por `next`).
  randomEvents: {

    // ── Nodo de entrada: las dos pruebas ──
    'prueba': {
      chance: 50,
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
      enemyTeam: [-1, 5, 12, -1],
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
      chance: 20,
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
      enemyTeam: [-1, 7, 12, 13],
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
    }
  }
};

export default nuevaHistoria;
