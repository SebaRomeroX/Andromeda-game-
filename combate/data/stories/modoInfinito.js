// Pool fijo por nombre (mismos 19 personajes de siempre): Xall y Veraldin
// quedan fuera a proposito.
const ALL_CHARACTERS = [
  'Sima', 'La druida', 'Urbol', 'Sacerdotiza oscura', 'Narada', 'Akay',
  'La bruja del paramo', 'Guerrero', 'Sabueso de Guerra', 'Aracnida',
  'Lancero', 'Hamer', 'Espadachin', 'Asesina', 'Arquera', 'Witch',
  'Capitan Oscuro', 'Demonic', 'Piedrita'
];

const modoInfinito = {
  id: 'modo-infinito',
  title: 'Modo Infinito',
  description: 'Recluta, lucha y sobrevive en un ciclo eterno. Sin narrativa, sin final.',
  sequential: true,
  noProtagonist: true,
  infiniteMode: true,
  allies: ALL_CHARACTERS,
  genericEnemies: ALL_CHARACTERS,
  teamA: [null, null, null, null],
  campAfterFights: 3,
  storyNodes: {}
};

export default modoInfinito;
