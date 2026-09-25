
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
  // (20), 'viajero' (30), 'dama' (20) y 'escolta' (20) -> total 90:
  // viajero 33.3%, las otras 22.2% cada una de los eventos aleatorios.
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
      enemyTeam: [-1, 7, 11, -1],
      next: 'escolta-combate-3'
    },

    'escolta-combate-3': {
      type: 'enfrentamiento',
      narrativo: true,
      title: 'Escolta de caravana',
      description: 'La emboscada se cierra sobre el camino.',
      enemyTeam: [-1, 10, 13, -1],
      next: 'escolta-combate-4'
    },

    'escolta-combate-4': {
      type: 'enfrentamiento',
      narrativo: true,
      title: 'Escolta de caravana',
      description: 'Los jefes de la banda cargan por ultima vez.',
      enemyTeam: [7, 12, 13, -1],
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
        { text: '—Lo tenemos todo contigo, andariego. Sin ti no hubieramos llegado.' },
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
      enemyTeam: [7, 11, 13, -1],
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
    }
  }
};

export default nuevaHistoria;
