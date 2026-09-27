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
const { listStages, buildJumpPayload } = await import('../src/devTools.js');

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

// ── Resultado ──
if (problems.length) {
  console.error(`\n${problems.length} problema(s):`);
  problems.forEach(p => console.error(' -', p));
  process.exit(1);
}
console.log(`OK · ${stories.length} historias, ${characters.length} personajes, sin avisos.`);
