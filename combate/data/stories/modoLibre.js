const modoLibre = {
  id: 'modo-libre',
  title: 'Modo libre para desarrollo',
  description: 'Se puede elegir el evento.',
  protagonist: 0,
  allies: [1,2,9],
  genericEnemies: [3, 7, 8, 10, 11, 12, 13, 14, 15],
  narrativeEnemies: [4, 5, 6, 16, 17],
  teamA: [-1, 19, 20, -1],
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
      enemyTeam: [4, 5, 17, 6]
    },
  ]
};

export default modoLibre;
