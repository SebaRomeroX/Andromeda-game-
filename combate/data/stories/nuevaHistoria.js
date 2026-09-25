
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


  storyNodes: {

    // ── Nodo inicial: las dos pruebas ──
    'prueba': {
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
    }
  }
};

export default nuevaHistoria;
