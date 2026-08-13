const SAVE_VERSION = 1;
const SAVE_PREFIX = 'andromeda-progress:';

function keyFor(storyId) {
  return SAVE_PREFIX + storyId;
}

function storage() {
  try {
    return { ok: true, ls: window.localStorage };
  } catch (e) {
    console.warn('[guardado] almacenamiento local no disponible', e);
    return { ok: false, ls: null };
  }
}

export function saveGame(storyId, payload) {
  const { ok, ls } = storage();
  if (!ok) return false;
  const data = {
    version: SAVE_VERSION,
    storyId,
    playerTeam: payload.playerTeam,
    protagonistSlot: payload.protagonistSlot,
    run: {
      stage: payload.run.stage,
      enfrentamientos: payload.run.enfrentamientos,
      campamentos: payload.run.campamentos,
      fightsSinceCamp: payload.run.fightsSinceCamp,
      choices: payload.run.choices ?? {}
    },
    fired: Array.from(payload.run.fired ?? []),
    team: payload.team
  };
  try {
    ls.setItem(keyFor(storyId), JSON.stringify(data));
    return true;
  } catch (e) {
    console.warn('[guardado] no se pudo escribir la partida', e);
    return false;
  }
}

export function hasSave(storyId) {
  const { ok, ls } = storage();
  if (!ok) return false;
  try {
    return ls.getItem(keyFor(storyId)) != null;
  } catch (e) {
    return false;
  }
}

export function loadGame(storyId) {
  const { ok, ls } = storage();
  if (!ok) return null;
  let raw;
  try {
    raw = ls.getItem(keyFor(storyId));
  } catch (e) {
    return null;
  }
  if (raw == null) return null;
  try {
    const data = JSON.parse(raw);
    if (data.version !== SAVE_VERSION || data.storyId !== storyId) return null;
    if (!data.run) return null;
    return {
      playerTeam: Array.isArray(data.playerTeam) ? data.playerTeam : null,
      protagonistSlot: typeof data.protagonistSlot === 'number' ? data.protagonistSlot : 0,
      run: {
        stage: data.run.stage ?? 0,
        enfrentamientos: data.run.enfrentamientos ?? 0,
        campamentos: data.run.campamentos ?? 0,
        fightsSinceCamp: data.run.fightsSinceCamp ?? 0,
        choices: data.run.choices ?? {}
      },
      fired: Array.isArray(data.fired) ? new Set(data.fired) : new Set(),
      team: data.team ?? {}
    };
  } catch (e) {
    console.warn('[guardado] partida corrupta, se descarta', e);
    try { ls.removeItem(keyFor(storyId)); } catch (_) {}
    return null;
  }
}

export function clearGame(storyId) {
  const { ok, ls } = storage();
  if (!ok) return;
  try {
    ls.removeItem(keyFor(storyId));
  } catch (e) {}
}

export function debugSave() {
  const { ok, ls } = storage();
  const out = { ok, origin: location.origin, keys: [] };
  if (ok) {
    try {
      for (let i = 0; i < ls.length; i++) {
        const k = ls.key(i);
        out.keys.push({ key: k, value: ls.getItem(k) });
      }
    } catch (e) {
      out.readError = String(e);
    }
    try {
      ls.setItem('__andromeda_test__', '1');
      ls.removeItem('__andromeda_test__');
      out.write = true;
    } catch (e) {
      out.write = false;
      out.writeError = String(e);
    }
  }
  console.log('[guardado] debug:', out);
  return out;
}