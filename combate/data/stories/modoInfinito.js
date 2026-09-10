const ALL_CHARACTERS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

const modoInfinito = {
  id: 'modo-infinito',
  title: 'Modo Infinito',
  description: 'Recluta, lucha y sobrevive en un ciclo eterno. Sin narrativa, sin final.',
  sequential: true,
  noProtagonist: true,
  infiniteMode: true,
  allies: ALL_CHARACTERS,
  genericEnemies: ALL_CHARACTERS,
  teamA: [-1, -1, -1, -1],
  campAfterFights: 3,
  storyNodes: {}
};

export default modoInfinito;
