const SAVE_VERSION = 1;
const SAVE_PREFIX = 'andromeda-progress:';

function keyFor(storyId) {
  return SAVE_PREFIX + storyId;
}

export function saveGame(storyId, payload) {
  const data = {
    version: SAVE_VERSION,
    storyId,
    playerTeam: payload.playerTeam,
    protagonistSlot: payload.protagonistSlot,
    run: {
      stage: payload.run.stage,
      enfrentamientos: payload.run.enfrentamientos,
      campamentos: payload.run.campamentos,
      fightsSinceCamp: payload.run.fightsSinceCamp
    },
    fired: Array.from(payload.run.fired ?? []),
    team: payload.team
  };
  try {
    localStorage.setItem(keyFor(storyId), JSON.stringify(data));
    return true;
  } catch (e) {
    console.warn('[guardado] no se pudo escribir la partida', e);
    return false;
  }
}

export function hasSave(storyId) {
  return localStorage.getItem(keyFor(storyId)) != null;
}

export function loadGame(storyId) {
  const raw = localStorage.getItem(keyFor(storyId));
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
        fightsSinceCamp: data.run.fightsSinceCamp ?? 0
      },
      fired: Array.isArray(data.fired) ? new Set(data.fired) : new Set(),
      team: data.team ?? {}
    };
  } catch (e) {
    console.warn('[guardado] partida corrupta, se descarta', e);
    localStorage.removeItem(keyFor(storyId));
    return null;
  }
}

export function clearGame(storyId) {
  localStorage.removeItem(keyFor(storyId));
}
