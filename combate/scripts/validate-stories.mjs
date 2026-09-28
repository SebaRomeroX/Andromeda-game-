// Verificacion de datos y del motor, sin navegador.
//
//   node combate/scripts/validate-stories.mjs
//
// Comprueba:
//   1) Nombres de personaje unicos (el nombre es la clave del registro).
//   2) Cada historia pasa validateStoryCast sin ningun aviso (referencias
//      desconocidas, indices numericos legados, cast mal declarado...).
//   3) La simulacion deterministica de etapas (devTools.listStages) y el
//      payload de salto (buildJumpPayload) corren sin excepciones y solo
//      manejan NOMBRES en playerTeam.
//   4) generateEnemyTeam arma equipos por nombre, con y sin plantilla.
//   5) La migracion de guardados v1 (indices) -> v2 (nombres) funciona.
//
// Sale con codigo 1 si algo falla.

const problems = [];
const fail = (msg) => problems.push(msg);

// stories/index.js llama a isDev() (usa `location`) al importarse.
globalThis.location = { hostname: 'localhost' };

const { default: characters, getCharacter } = await import('../data/characters.js');
const { default: stories } = await import('../data/stories/index.js');
const { validateStoryCast } = await import('../src/storyValidation.js');
const { generateEnemyTeam } = await import('../src/enemyGenerator.js');
const { listStages, buildJumpPayload, applyEvent } = await import('../src/devTools.js');

// ── 1) Nombres unicos ──
const seen = new Set();
characters.forEach(c => {
  if (seen.has(c.name)) fail(`personaje duplicado: "${c.name}"`);
  seen.add(c.name);
});

// ── 2) validateStoryCast sin avisos ──
const origWarn = console.warn;
console.warn = (...args) => fail(args.join(' '));
stories.forEach(story => validateStoryCast(story));
console.warn = origWarn;

// ── 3) Simulacion de etapas + payload de salto ──
const isNameTeam = (team, label) => {
  if (!Array.isArray(team)) { fail(`${label}: playerTeam no es un array`); return; }
  team.forEach((v, i) => {
    if (v != null && typeof v !== 'string') fail(`${label}: playerTeam[${i}] = ${JSON.stringify(v)} (deberia ser nombre o null)`);
    if (typeof v === 'string' && !getCharacter(v)) fail(`${label}: playerTeam[${i}] desconoce a "${v}"`);
  });
};

stories.forEach(story => {
  if (!story.sequential) return;
  let stages;
  try {
    stages = listStages(story);
  } catch (e) {
    fail(`${story.id}: listStages lanzo ${e.message}`);
    return;
  }
  if (stages.length === 0) fail(`${story.id}: no produjo etapas`);
  stages.forEach(({ stage }) => {
    try {
      const { payload } = buildJumpPayload(story, stage);
      isNameTeam(payload.playerTeam, `${story.id} etapa ${stage}`);
      payload.team.hp.forEach((hp, i) => {
        if (hp == null !== (payload.playerTeam[i] == null)) {
          fail(`${story.id} etapa ${stage}: hp[${i}] no coincide con la ranura`);
        }
      });
    } catch (e) {
      fail(`${story.id}: buildJumpPayload(${stage}) lanzo ${e.message}`);
    }
  });
});

// ── 4) Generacion de equipos enemigos ──
stories.forEach(story => {
  try {
    const generic = generateEnemyTeam({ story, playerMemberCount: 3, playerAvgLevel: 2, peakEnemyLevel: 0 });
    generic.team.forEach((g, i) => {
      if (g && !getCharacter(g.name)) fail(`${story.id}: equipo generado[${i}] desconoce a "${g.name}"`);
    });
    const override = story.storyNodes
      ? Object.values(story.storyNodes).find(n => n.enemyTeam)?.enemyTeam ?? null
      : null;
    if (override) {
      const fixed = generateEnemyTeam({
        story, playerMemberCount: 4, playerAvgLevel: 1, peakEnemyLevel: 0, enemyTeamOverride: override
      });
      fixed.team.forEach((g, i) => {
        if (g && override[i] !== g.name) fail(`${story.id}: plantilla[${i}] esperaba ${override[i]}, salio ${g.name}`);
      });
      const filled = fixed.team.filter(Boolean).length;
      if (filled !== override.filter(v => v != null).length) {
        fail(`${story.id}: la plantilla no rellena exactamente las ranuras ocupadas`);
      }
    }
  } catch (e) {
    fail(`${story.id}: generateEnemyTeam lanzo ${e.message}`);
  }
});

// ── 5) Migracion de guardado v1 -> v2 ──
const store = new Map();
globalThis.window = {
  localStorage: {
    getItem: k => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: k => store.delete(k),
    key: i => [...store.keys()][i],
    get length() { return store.size; }
  }
};
const { saveGame, loadGame } = await import('../src/save.js');

store.set('andromeda-progress:travesia-sima', JSON.stringify({
  version: 1,
  storyId: 'travesia-sima',
  playerTeam: [null, 0, 9, -1],
  protagonistSlot: 1,
  run: { stage: 3, pendingRecruit: { charIdx: 5 } },
  fired: [],
  team: { hp: [null, 100, 80, null] }
}));

const migrated = loadGame('travesia-sima');
if (!migrated) {
  fail('migracion: loadGame rechazo un guardado v1');
} else {
  const expected = [null, 'Sima', 'Aracnida', null];
  if (JSON.stringify(migrated.playerTeam) !== JSON.stringify(expected)) {
    fail(`migracion: playerTeam ${JSON.stringify(migrated.playerTeam)} != ${JSON.stringify(expected)}`);
  }
  if (migrated.run.pendingRecruit?.charName !== 'Akay') {
    fail(`migracion: pendingRecruit = ${JSON.stringify(migrated.run.pendingRecruit)}`);
  }
}

const saved = saveGame('travesia-sima', {
  playerTeam: ['Sima', null, 'Aracnida', null],
  protagonistSlot: 1,
  run: { stage: 1, fired: new Set(), orbes: { mind: 1 } },
  team: { hp: [90, null, 70, null] }
});
const roundtrip = saved && loadGame('travesia-sima');
if (!roundtrip) fail('guardado v2 no se pudo guardar/cargar');
else if (JSON.stringify(roundtrip.playerTeam) !== JSON.stringify(['Sima', null, 'Aracnida', null])) {
  fail(`guardado v2: playerTeam ${JSON.stringify(roundtrip.playerTeam)}`);
}

// ── 6) Expansion de pasos (introDialog/outroDialog / secuencia) ──
const { expandEventSteps } = await import('../src/eventSteps.js');

stories.forEach(story => {
  const pools = [
    ['storyNodes', story.storyNodes],
    ['randomEvents', story.randomEvents],
    ['narrativeEvents', story.narrativeEvents],
    ['events', story.events]
  ].filter(([, pool]) => pool != null);

  pools.forEach(([poolName, pool]) => {
    const entries = Array.isArray(pool)
      ? pool.map((ev, i) => [String(i + 1), ev])
      : Object.entries(pool);
    entries.forEach(([id, ev]) => {
      const where = `${story.id}/${poolName}:${id}`;
      let steps;
      try {
        steps = expandEventSteps(ev);
      } catch (e) {
        fail(`${where}: expandEventSteps lanzo ${e.message}`);
        return;
      }
      if (!Array.isArray(steps) || steps.length === 0) {
        fail(`${where}: la expansion no produjo ningun paso`);
        return;
      }
      steps.forEach((s, i) => {
        if (!s || typeof s.type !== 'string') fail(`${where}: paso ${i + 1} sin "type"`);
      });
      // Invariante de paridad: un evento simple (sin intro/outro y que no
      // es secuencia) se expande a [el propio evento], mismo objeto.
      const isSimple = ev.type !== 'secuencia' && ev.introDialog == null && ev.outroDialog == null;
      if (isSimple && (steps.length !== 1 || steps[0] !== ev)) {
        fail(`${where}: un evento simple debe expandirse a [el propio evento]`);
      }
      // Una secuencia nunca pierde pasos (p. ej. por anidar otra).
      if (ev.type === 'secuencia' && steps.length < (ev.steps?.length ?? 1)) {
        fail(`${where}: la secuencia perdio pasos al expandirse`);
      }
    });
  });
});

// ── 7) Efectos por paso + cierre de evento (paridad con el flujo real) ──
const { default: state, resetRunState } = await import('../src/state.js');
const { applyStepEffects, completeEvent } = await import('../src/gameFlow.js');

const paritySetup = (event) => {
  resetRunState();
  state.session.selectedStory = { id: 'test-paridad' };
  state.session.currentEvent = event;
  state.run.currentNodeId = 'n1';
};

// Secuencia: los contadores salen de los PASOS; fired/flags/next del nodo.
paritySetup({ id: 'n1', type: 'secuencia', narrativo: true, next: 'n2' });
applyStepEffects({ type: 'enfrentamiento' });
applyStepEffects({ type: 'dialogo' });
completeEvent(state.session.currentEvent);
if (state.run.enfrentamientos !== 1) fail(`paridad: enfrentamientos = ${state.run.enfrentamientos} (esperaba 1)`);
if (state.run.fightsSinceCamp !== 1) fail(`paridad: fightsSinceCamp = ${state.run.fightsSinceCamp} (esperaba 1)`);
if (!state.run.fired.has('n1')) fail('paridad: la secuencia no marco fired');
if (state.run.flags.n1 !== true) fail('paridad: la secuencia narrativa no dejo flag');
if (state.run.currentNodeId !== 'n2') fail('paridad: la secuencia no aplico next');
if (state.run.stage !== 1) fail(`paridad: stage = ${state.run.stage} (esperaba 1)`);

// Evento simple: mismo comportamiento que el advanceStage antiguo.
paritySetup({ id: 'n1', type: 'enfrentamiento', next: 'n2' });
applyStepEffects(state.session.currentEvent);
completeEvent(state.session.currentEvent);
if (state.run.enfrentamientos !== 1) fail(`paridad simple: enfrentamientos = ${state.run.enfrentamientos} (esperaba 1)`);
if (!state.run.fired.has('n1')) fail('paridad simple: no marco fired');
if (state.run.currentNodeId !== 'n2') fail('paridad simple: no aplico next');
if (state.run.stage !== 1) fail(`paridad simple: stage = ${state.run.stage} (esperaba 1)`);

// Campamento: resetea fightsSinceCamp y suma campamentos.
paritySetup({ id: 'n1', type: 'campamento', next: 'n2' });
state.run.fightsSinceCamp = 3;
applyStepEffects(state.session.currentEvent);
completeEvent(state.session.currentEvent);
if (state.run.campamentos !== 1 || state.run.fightsSinceCamp !== 0) {
  fail(`paridad campamento: campamentos=${state.run.campamentos} fightsSinceCamp=${state.run.fightsSinceCamp}`);
}

// ── 8) Simulacion (devTools) de una secuencia real de las historias ──
// applyEvent debe aplicar los efectos de CADA paso (combate -> contadores
// y recompensa; dialogo -> nada) y los de nivel nodo una sola vez.
{
  const nh = stories.find(s => s.id === 'nueva-historia');
  const asalto = nh?.randomEvents?.['escolta-asalto'];
  if (asalto?.type !== 'secuencia') {
    fail('simulacion: nueva-historia ya no tiene la secuencia de ejemplo "escolta-asalto"');
  } else {
    const run = {
      stage: 0, enfrentamientos: 0, campamentos: 0, fightsSinceCamp: 0,
      fired: new Set(), choices: {}, currentNodeId: null, flags: {},
      orbes: { mind: 0, power: 0, body: 0, wealth: 0 }, pendingRandomId: 'pin'
    };
    applyEvent({ ...asalto, id: 'escolta-asalto' }, run, [...nh.teamA], {});
    if (run.enfrentamientos !== 1) fail(`simulacion: enfrentamientos = ${run.enfrentamientos} (esperaba 1)`);
    if (run.fightsSinceCamp !== 1) fail(`simulacion: fightsSinceCamp = ${run.fightsSinceCamp} (esperaba 1)`);
    if (run.orbes.wealth !== 2) fail(`simulacion: orbes de riqueza = ${run.orbes.wealth} (esperaba 2 del reward del paso)`);
    if (!run.fired.has('escolta-asalto')) fail('simulacion: la secuencia no marco fired');
    if (run.flags['escolta-asalto'] !== true) fail('simulacion: la secuencia narrativa no dejo flag');
    if (run.pendingRandomId !== null) fail('simulacion: no se limpio el pin del evento aleatorio');
  }
}

// ── 9) Viajero: eleccion con ramas inline (option.steps) ──
// Simula las DOS ramas del nodo real: "ayudar" debe ejecutar el combate
// con el reward HEREDADO de la secuencia; "ignorar", solo el dialogo.
{
  const nh = stories.find(s => s.id === 'nueva-historia');
  const viajero = nh?.randomEvents?.['viajero'];
  if (viajero?.type !== 'secuencia') {
    fail('ramas: nueva-historia ya no tiene "viajero" como secuencia con option.steps');
  } else {
    const steps = expandEventSteps(viajero);
    if (steps.length !== 1 || steps[0]?.type !== 'eleccion') {
      fail(`ramas: viajero se expandio a ${steps.length} pasos (esperaba solo la eleccion)`);
    }

    const newRun = () => ({
      stage: 0, enfrentamientos: 0, campamentos: 0, fightsSinceCamp: 0,
      fired: new Set(), choices: {}, currentNodeId: null, flags: {},
      orbes: { mind: 0, power: 0, body: 0, wealth: 0 }, pendingRandomId: 'pin'
    });

    // Ayudar: combate dentro de la rama, con el reward del nodo heredado.
    const runA = newRun();
    applyEvent({ ...viajero, id: 'viajero' }, runA, [...(nh.teamA ?? [])], { viajero: 'ayudar' });
    if (runA.enfrentamientos !== 1) fail(`ramas(ayudar): enfrentamientos = ${runA.enfrentamientos} (esperaba 1)`);
    if (runA.fightsSinceCamp !== 1) fail(`ramas(ayudar): fightsSinceCamp = ${runA.fightsSinceCamp} (esperaba 1)`);
    if (runA.orbes.wealth !== 1) fail(`ramas(ayudar): orbes de riqueza = ${runA.orbes.wealth} (esperaba 1 heredada del reward de la secuencia)`);
    if (!runA.fired.has('viajero')) fail('ramas(ayudar): no marco fired');
    if (runA.flags.viajero !== true) fail('ramas(ayudar): la secuencia narrativa no dejo flag');
    if (runA.choices.viajero !== 'ayudar') fail(`ramas(ayudar): choices[viajero] = ${runA.choices.viajero} (esperaba ayudar)`);
    if (runA.pendingRandomId !== null) fail('ramas(ayudar): no se limpio el pin del evento aleatorio');

    // Ignorar: solo dialogo -> ni combate ni orbes.
    const runB = newRun();
    applyEvent({ ...viajero, id: 'viajero' }, runB, [...(nh.teamA ?? [])], { viajero: 'ignorar' });
    if (runB.enfrentamientos !== 0) fail(`ramas(ignorar): enfrentamientos = ${runB.enfrentamientos} (esperaba 0)`);
    if (runB.orbes.wealth !== 0) fail(`ramas(ignorar): orbes = ${JSON.stringify(runB.orbes)} (esperaba 0)`);
    if (!runB.fired.has('viajero')) fail('ramas(ignorar): no marco fired');
    if (runB.flags.viajero !== true) fail('ramas(ignorar): la secuencia narrativa no dejo flag');
    if (runB.choices.viajero !== 'ignorar') fail(`ramas(ignorar): choices[viajero] = ${runB.choices.viajero} (esperaba ignorar)`);
    if (runB.pendingRandomId !== null) fail('ramas(ignorar): no se limpio el pin del evento aleatorio');
  }
}

// ── Resultado ──
if (problems.length) {
  console.error(`\n${problems.length} problema(s):`);
  problems.forEach(p => console.error(' -', p));
  process.exit(1);
}
console.log(`OK · ${stories.length} historias, ${characters.length} personajes, sin avisos.`);
