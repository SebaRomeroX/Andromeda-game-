const modoLibre = {
  id: 'modo-libre',
  title: 'Modo libre para desarrollo',
  description: 'Se puede elegir el evento.',
  protagonist: 'Sima',
  allies: ['La druida', 'Urbol', 'Aracnida'],
  genericEnemies: ['Sacerdotiza oscura', 'Guerrero', 'Sabueso de Guerra', 'Lancero', 'Hamer', 'Espadachin', 'Asesina', 'Arquera', 'Witch'],
  narrativeEnemies: ['Narada', 'Akay', 'La bruja del paramo', 'Capitan Oscuro', 'Demonic'],
  teamA: [null, 'Xall', 'Veraldin', null],
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
        { speaker: 'Narada', text: 'El destino os espera, pero no estáis listos.' }
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
      character: 'La druida'
    },
    {
      type: 'reclutamiento',
      title: 'recluta tanque',
      description: 'Un caballero ofrece acompañarte.',
      character: 'Urbol'
    },
    {
      type: 'enfrentamiento',
      narrativo: true,
      title: 'Equipo full',
      description: '4 integrantes.',
      enemyTeam: ['Hamer', 'Asesina', 'Witch', 'Sacerdotiza oscura']
    },
    {
      type: 'enfrentamiento',
      narrativo: true,
      title: 'Final',
      description: 'Una amenaza ineludible se cierne sobre ti.',
      enemyTeam: ['Narada', 'Akay', 'Demonic', 'La bruja del paramo']
    },
  ]
};

export default modoLibre;
