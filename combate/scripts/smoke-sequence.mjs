// Smoke end-to-end del motor de pasos, sin navegador (DOM simulado).
//
//   node combate/scripts/smoke-sequence.mjs
//
// Juega una pasada REAL del flujo completo usando los modulos del juego:
//   1) evento con `introDialog` (dialogo antes de la eleccion),
//   2) eleccion que ramifica a un `type: 'secuencia'`,
//   3) secuencia: combate (equipo enemigo vacio -> victoria automatica)
//      -> dialogo post-victoria -> cierre del evento (fired/flags/next),
//   4) secuencia cuyo paso es una eleccion con ramas inline
//      (`option.steps`): elige la rama sin combate, se ejecuta el
//      dialogo de la rama, se salta el combate y el nodo cierra una vez.
// Comprueba contadores, orbes, puntero del grafo y que la validacion de
// la historia no avisa. Sale con codigo 1 si algo falla.

const problems = [];
const fail = (msg) => problems.push(msg);
const assert = (cond, msg) => { if (!cond) fail(msg); };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ── DOM / entorno simulado ────────────────────────────────────────────
// Stub suficiente para importar main.js y ejecutar handlers: elementos
// por id persistentes, listeners + onclick, classList e innerHTML que
// limpia los hijos (igual que el DOM al asignar '').

const HIDDEN_IDS = [
  'log-overlay', 'camp-overlay', 'camp-levelup', 'confirm-overlay',
  'save-toast', 'upgrade-overlay', 'levelup-overlay', 'levelup-preview',
  'learn-overlay', 'mercader-overlay', 'dialog-overlay', 'choice-overlay',
  'pause-overlay', 'skill-popup'
];

function makeClassList(seed = []) {
  const set = new Set(seed);
  return {
    add: (...cs) => cs.forEach(c => set.add(c)),
    remove: (...cs) => cs.forEach(c => set.delete(c)),
    contains: (c) => set.has(c),
    toggle: (c, force) => {
      if (force === undefined) { set.has(c) ? set.delete(c) : set.add(c); }
      else { force ? set.add(c) : set.delete(c); }
    }
  };
}

function makeElement(tag = 'div', id = null, classes = []) {
  const listeners = {};
  const el = {
    tag,
    id,
    children: [],
    listeners,
    dataset: {},
    style: {},
    hidden: false,
    disabled: false,
    value: '',
    textContent: '',
    src: '',
    alt: '',
    title: '',
    scrollTop: 0,
    scrollHeight: 0,
    classList: makeClassList(classes),
    _innerHTML: '',
    get innerHTML() { return this._innerHTML; },
    set innerHTML(v) { this._innerHTML = String(v); this.children = []; },
    appendChild(child) { this.children.push(child); return child; },
    append(...items) { this.children.push(...items); },
    insertBefore(child) { this.children.push(child); return child; },
    removeChild(child) {
      const i = this.children.indexOf(child);
      if (i >= 0) this.children.splice(i, 1);
      return child;
    },
    remove() {},
    setAttribute() {},
    removeAttribute() {},
    getAttribute() { return null; },
    hasAttribute() { return false; },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    addEventListener(type, fn) { (listeners[type] ??= []).push(fn); },
    removeEventListener(type, fn) {
      listeners[type] = (listeners[type] ?? []).filter(f => f !== fn);
    },
    closest() { return null; },
    focus() {},
    click() { dispatchClick(el); }
  };
  return el;
}

function dispatchClick(el, extra = {}) {
  const ev = { target: el, type: 'click', stopPropagation() {}, preventDefault() {}, ...extra };
  for (const fn of [...(el.listeners?.click ?? [])]) fn(ev);
  if (typeof el.onclick === 'function') el.onclick(ev);
}

const byId = new Map();
const documentStub = {
  documentElement: makeElement('html'),
  getElementById(id) {
    if (!byId.has(id)) {
      byId.set(id, makeElement('div', id, HIDDEN_IDS.includes(id) ? ['hidden'] : []));
    }
    return byId.get(id);
  },
  createElement(tag) { return makeElement(tag); },
  querySelector() { return makeElement('div'); },
  querySelectorAll() { return []; },
  addEventListener() {},
  removeEventListener() {}
};

const store = new Map();
const localStorageStub = {
  getItem: k => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: k => store.delete(k),
  key: i => [...store.keys()][i],
  get length() { return store.size; }
};

// Algunos globals de Node (navigator) son getter-only: se redefinen.
const defineGlobal = (name, value) => {
  Object.defineProperty(globalThis, name, { value, configurable: true, writable: true });
};

defineGlobal('location', { hostname: 'localhost' });
defineGlobal('document', documentStub);
defineGlobal('window', {
  localStorage: localStorageStub,
  addEventListener() {},
  removeEventListener() {}
});
defineGlobal('localStorage', localStorageStub);
defineGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
defineGlobal('navigator', { userAgent: 'node', maxTouchPoints: 0 });
defineGlobal('screen', {});
defineGlobal('alert', () => {});
defineGlobal('confirm', () => true);
defineGlobal('Audio', class AudioStub {
  constructor(src) { this.src = src ?? ''; this.volume = 1; this.currentTime = 0; this.loop = false; this.preload = ''; }
  play() { return Promise.resolve(); }
  pause() {}
  addEventListener() {}
  removeEventListener() {}
  cloneNode() { return new AudioStub(this.src); }
});

// Cualquier aviso/es error durante la partida es un fallo del test
// (la validacion de la historia avisa por console.warn).
const origWarn = console.warn;
const origError = console.error;
console.warn = (...a) => fail(`console.warn: ${a.join(' ')}`);
console.error = (...a) => fail(`console.error: ${a.join(' ')}`);

// ── Arranque del juego + mutaciones de test ───────────────────────────
try {
  // main.js arranca el juego al importarse (renderMenu + initPause).
  await import('../src/main.js');
  const state = (await import('../src/state.js')).default;
  const stories = (await import('../data/stories/index.js')).default;

  const nh = stories.find(s => s.id === 'nueva-historia');
  assert(nh, 'no se encontro la historia nueva-historia');

  // Nodo de arranque determinista (bootstrap del grafo de historia) con
  // introDialog: el primer evento del mapa es SIEMPRE este.
  nh.storyNodes = {
    'smoke-intro': {
      type: 'eleccion',
      title: '[TEST] Intro',
      description: '[TEST] Nodo de arranque del smoke test.',
      prompt: '[TEST] ¿Avanzas?',
      introDialog: [{ text: '[TEST] Una linea de dialogo antes de elegir.' }],
      options: [{ id: 'avanzar', label: '[TEST] Avanzar', next: 'prueba-fuerza' }]
    }
  };

  // 'prueba-fuerza' como secuencia: combate (enemigos vacios -> victoria
  // automatica al arrancar el turno) + dialogo de cierre.
  nh.randomEvents['prueba-fuerza'] = {
    type: 'secuencia',
    narrativo: true,
    title: 'Prueba de Fuerza',
    description: '[TEST] Secuencia combate + dialogo.',
    steps: [
      { type: 'enfrentamiento', enemyTeam: [null, null, null, null], reward: { power: 1, body: 1 } },
      {
        type: 'dialogo',
        dialog: [
          { text: '[TEST] El combate termina.' },
          { text: '[TEST] Dialogo posterior a la victoria.' }
        ]
      }
    ],
    next: 'prueba-ramas'
  };

  // 'prueba-ramas': secuencia cuyo UNICO paso es una eleccion con ramas
  // inline (option.steps). El smoke elige la rama SIN combate para
  // comprobar que la rama se ejecuta, que el combate se salta y que el
  // nodo cierra una sola vez. (La rama CON combate la cubre la
  // validacion, seccion 9, con el viajero real.)
  nh.randomEvents['prueba-ramas'] = {
    type: 'secuencia',
    narrativo: true,
    title: 'Prueba de Ramas',
    description: '[TEST] Secuencia con eleccion y ramas inline.',
    reward: { mind: 1 },
    steps: [
      {
        type: 'eleccion',
        title: 'Prueba de Ramas',
        prompt: '[TEST] ¿Que rama tomas?',
        options: [
          {
            id: 'pasar',
            label: '[TEST] Pasar de largo',
            steps: [{ type: 'dialogo', dialog: [{ text: '[TEST] Rama sin combate.' }] }]
          },
          {
            id: 'pelear',
            label: '[TEST] Pelear',
            steps: [
              { type: 'enfrentamiento', enemyTeam: [null, null, null, null] },
              { type: 'dialogo', dialog: [{ text: '[TEST] Rama con combate.' }] }
            ]
          }
        ]
      }
    ],
    next: 'prueba-final'
  };

  // ── 1. Elegir historia ──
  const storyCard = documentStub.getElementById('story-list')
    .children.find(c => c.innerHTML.includes('En desarrollo'));
  assert(storyCard, 'no se encontro la tarjeta de la historia "En desarrollo"');
  if (storyCard) dispatchClick(storyCard);

  assert(state.session.selectedStory?.id === 'nueva-historia', 'startStory no selecciono la historia');
  assert(state.run.stage === 0, `stage inicial = ${state.run.stage} (esperaba 0)`);

  // ── 2. Primer evento: introDialog -> eleccion ──
  const mapEvents = () => documentStub.getElementById('map-events').children;
  const card1 = mapEvents().find(c => c.innerHTML.includes('[TEST] Intro'));
  assert(card1, 'no aparecio la tarjeta del evento de arranque');
  if (card1) dispatchClick(card1);

  const dialogOverlay = documentStub.getElementById('dialog-overlay');
  const choiceOverlay = documentStub.getElementById('choice-overlay');
  assert(!dialogOverlay.classList.contains('hidden'), 'el introDialog no se mostro antes de la eleccion');
  assert(choiceOverlay.classList.contains('hidden'), 'la eleccion se mostro antes del introDialog');

  // Una linea: un clic la cierra y encadena la eleccion.
  dispatchClick(dialogOverlay);
  assert(dialogOverlay.classList.contains('hidden'), 'el introDialog no se cerro');
  assert(!choiceOverlay.classList.contains('hidden'), 'la eleccion no se mostro tras el introDialog');

  const option = choiceOverlay && documentStub.getElementById('choice-options')
    .children.find(b => b.textContent.includes('[TEST] Avanzar'));
  assert(option, 'no se encontro la opcion de la eleccion');
  if (option) dispatchClick(option);

  assert(state.run.stage === 1, `tras la eleccion stage = ${state.run.stage} (esperaba 1)`);
  assert(state.run.fired.has('smoke-intro'), 'el evento de arranque no quedo marcado como fired');
  assert(state.run.choices['smoke-intro'] === 'avanzar', 'la eleccion no quedo registrada en choices');
  assert(state.run.currentNodeId === 'prueba-fuerza', `puntero = ${state.run.currentNodeId} (esperaba prueba-fuerza)`);

  const card2 = mapEvents().find(c => c.innerHTML.includes('Prueba de Fuerza'));
  assert(card2, 'no aparecio la tarjeta de la secuencia (prueba-fuerza)');
  if (card2) dispatchClick(card2);

  // ── 3. Secuencia: paso combate -> victoria automatica ──
  // checkGameOver programa el modal con 700ms de retardo.
  await sleep(1000);
  const campOverlay = documentStub.getElementById('camp-overlay');
  const campBtn = documentStub.getElementById('camp-continue');
  assert(!campOverlay.classList.contains('hidden'), 'el modal de victoria no aparecio');
  assert(typeof campBtn.onclick === 'function', 'el boton Continuar del modal no tiene handler');
  assert(state.session.currentStep?.type === 'enfrentamiento', 'el paso activo no es el combate');
  assert(state.run.stage === 1, `con el modal abierto stage = ${state.run.stage} (esperaba 1)`);

  dispatchClick(campBtn);

  // Tras Continuar: se otorgan los orbes y arranca el paso de dialogo.
  assert(state.run.orbes.power === 1 && state.run.orbes.body === 1,
    `orbes = ${JSON.stringify(state.run.orbes)} (esperaba power 1, body 1)`);
  assert(state.session.pendingOrbReward == null, 'pendingOrbReward no se consumo');
  assert(state.run.enfrentamientos === 1, `enfrentamientos = ${state.run.enfrentamientos} (esperaba 1)`);
  assert(state.run.stage === 1, `durante el dialogo posterior stage = ${state.run.stage} (esperaba 1)`);
  assert(state.run.currentNodeId === 'prueba-fuerza', 'el puntero avanzo antes de terminar la secuencia');
  assert(state.session.currentStep?.type === 'dialogo', 'el paso activo no es el dialogo posterior');
  assert(!dialogOverlay.classList.contains('hidden'), 'el dialogo posterior no se mostro');

  // ── 4. Dialogo posterior -> cierre del evento ──
  dispatchClick(dialogOverlay); // linea 1
  dispatchClick(dialogOverlay); // linea 2 -> cierra
  assert(dialogOverlay.classList.contains('hidden'), 'el dialogo posterior no se cerro');

  assert(state.run.stage === 2, `al cerrar la secuencia stage = ${state.run.stage} (esperaba 2)`);
  assert(state.run.fired.has('prueba-fuerza'), 'la secuencia no quedo marcada como fired');
  assert(state.run.flags['prueba-fuerza'] === true, 'la secuencia narrativa no dejo su flag');
  assert(state.run.currentNodeId === 'prueba-ramas', `puntero = ${state.run.currentNodeId} (esperaba prueba-ramas)`);
  assert(state.session.currentStep == null, 'currentStep no se limpio al cerrar el evento');
  assert(state.run.enfrentamientos === 1, `enfrentamientos finales = ${state.run.enfrentamientos} (esperaba 1)`);

  // ── 5. Secuencia con eleccion -> rama inline SIN combate ──
  const cardRamas = mapEvents().find(c => c.innerHTML.includes('Prueba de Ramas'));
  assert(cardRamas, 'no aparecio la tarjeta de la secuencia con ramas (prueba-ramas)');
  if (cardRamas) dispatchClick(cardRamas);

  // El UNICO paso es la eleccion: el modal aparece sin dialogo previo.
  assert(!choiceOverlay.classList.contains('hidden'), 'la eleccion de la rama no se mostro');
  assert(dialogOverlay.classList.contains('hidden'), 'mostro un dialogo antes de la eleccion');

  const optPasar = documentStub.getElementById('choice-options')
    .children.find(b => b.textContent.includes('[TEST] Pasar de largo'));
  assert(optPasar, 'no se encontro la opcion de la rama');
  if (optPasar) dispatchClick(optPasar);

  // La rama elegida se ejecuta justo detras: dialogo, sin combate.
  assert(!dialogOverlay.classList.contains('hidden'), 'el dialogo de la rama no se mostro');
  assert(state.session.currentStep?.type === 'dialogo', 'el paso activo no es el dialogo de la rama');
  assert(state.run.stage === 2, `con la rama abierta stage = ${state.run.stage} (esperaba 2)`);
  assert(state.run.currentNodeId === 'prueba-ramas', 'el puntero avanzo antes de terminar la rama');
  assert(state.run.enfrentamientos === 1, `enfrentamientos con la rama sin combate = ${state.run.enfrentamientos} (esperaba 1: el combate se salto)`);
  assert(state.run.choices['prueba-ramas'] === 'pasar',
    `choices[prueba-ramas] = ${state.run.choices['prueba-ramas']} (esperaba pasar)`);

  dispatchClick(dialogOverlay); // unica linea -> cierra la rama y el nodo

  assert(dialogOverlay.classList.contains('hidden'), 'el dialogo de la rama no se cerro');
  assert(state.run.stage === 3, `al cerrar la rama stage = ${state.run.stage} (esperaba 3)`);
  assert(state.run.fired.has('prueba-ramas'), 'la secuencia con ramas no quedo marcada como fired');
  assert(state.run.flags['prueba-ramas'] === true, 'la secuencia con ramas no dejo su flag');
  assert(state.run.currentNodeId === 'prueba-final', `puntero = ${state.run.currentNodeId} (esperaba prueba-final)`);
  assert(state.session.currentStep == null, 'currentStep no se limpio al cerrar la rama');
  assert(state.run.orbes.mind === 0, `orbes de mente = ${state.run.orbes.mind} (esperaba 0: sin combate no se tira el reward)`);
  assert(state.run.enfrentamientos === 1, `enfrentamientos tras la rama = ${state.run.enfrentamientos} (esperaba 1)`);

  const card3 = mapEvents().find(c => c.innerHTML.includes('Prueba superada'));
  assert(card3, 'no aparecio la tarjeta siguiente (prueba-final)');
} catch (e) {
  fail(`excepcion: ${e.stack ?? e.message}`);
} finally {
  console.warn = origWarn;
  console.error = origError;
}

if (problems.length) {
  console.error(`\n${problems.length} problema(s) en el smoke de secuencias:`);
  problems.forEach(p => console.error(' -', p));
  process.exit(1);
}
console.log('OK · smoke-sequence: introDialog -> eleccion -> secuencia (combate + dialogo) -> rama inline -> cierre.');
