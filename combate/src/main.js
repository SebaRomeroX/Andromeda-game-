import state, { initState, setGameEndCallback, saveTeamState, restoreTeamHp, clearSavedTeamHp, clearSavedTeamLevels, clearSavedTeamSkills, clearSavedTeamLearnableSkills, clearSavedTeamLearnedSkills, saveTeamLevels, allDead, resetTeam, clearSavedSlot, exportTeamSave, importTeamSave, resetRunState, resetSessionState } from './state.js';
import { ROLE_BY_INDEX } from './models.js';
import { startTurn, onTargetClick } from './combat.js';
import { renderTeams, renderHP, renderStatus, renderBuffs, renderActions, clearTargets, renderTeamsHeader } from './renderer.js';
import { log, clearLog, openLog, closeLog } from './log.js';
import { saveGame, loadGame, clearGame, debugSave } from './save.js';
import characters from '../data/characters.js';
import stories from '../data/stories/index.js';
import { generateEnemyTeam } from './enemyGenerator.js';
import { pickNextEvent } from './eventGenerator.js';
import { setupDevPanel } from './devTools.js';
import { isDev } from './env.js';
import { TEAMS } from './constants.js';
import { advanceStage as advanceStageFlow, resolveVictory } from './gameFlow.js';
import { showCampEvent, showRecruitEvent, showInfiniteRecruitEvent, showDialogueEvent, showChoiceEvent, showEnding } from './eventHandlers.js';
import './mobile.js';
import { playChill, playCombat, stopMusic } from './music.js';
import { initPause, showPause } from './pause.js';

let toastTimer = null;
function showToast(text) {
  const toast = document.getElementById('save-toast');
  if (!toast) return;
  toast.textContent = text;
  toast.classList.add('show');
  toast.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
    toast.classList.add('hidden');
  }, 1500);
}

function showConfirmModal(message) {
  return new Promise(resolve => {
    const overlay = document.getElementById('confirm-overlay');
    const msg = document.getElementById('confirm-message');
    const okBtn = document.getElementById('confirm-ok');
    const cancelBtn = document.getElementById('confirm-cancel');

    msg.textContent = message;

    function cleanup() {
      overlay.classList.add('hidden');
      okBtn.removeEventListener('click', onOk);
      cancelBtn.removeEventListener('click', onCancel);
      overlay.removeEventListener('click', onBackdrop);
      document.removeEventListener('keydown', onKey);
    }

    function onOk() { cleanup(); resolve(true); }
    function onCancel() { cleanup(); resolve(false); }
    function onBackdrop(e) { if (e.target === overlay) onCancel(); }
    function onKey(e) { if (e.key === 'Escape') onCancel(); }

    okBtn.addEventListener('click', onOk);
    cancelBtn.addEventListener('click', onCancel);
    overlay.addEventListener('click', onBackdrop);
    document.addEventListener('keydown', onKey);

    overlay.classList.remove('hidden');
  });
}

function persistProgress() {
  const sel = state.session.selectedStory;
  if (!sel || !sel.sequential) return;
  const ok = saveGame(sel.id, {
    playerTeam: state.session.playerTeam,
    protagonistSlot: state.session.protagonistSlot,
    run: state.run,
    team: exportTeamSave()
  });
  console.log('[guardado] persistProgress ->', sel.id, 'stage', state.run.stage, ok ? 'OK' : 'FALLO');
  if (!ok) {
    showToast('⚠️ No se pudo guardar (almacenamiento local)');
  } else if (state.run.stage > 0) {
    showToast('💾 Partida Guardada');
  }


}

function buildTeamAData() {
  return (state.session.playerTeam ?? []).map(idx => idx >= 0 ? characters[idx] : null);
}

function validateStoryCast(story) {
  const generic = new Set(story.genericEnemies ?? []);
  const narrative = new Set(story.narrativeEnemies ?? []);
  const allies = new Set(story.allies ?? []);

  const warn = (msg) => console.warn(`[historia "${story.title}"] ${msg}`);

  const eventList = story.storyNodes
    ? Object.values(story.storyNodes)
    : (story.narrativeEvents ?? story.events ?? []);

  eventList.forEach((event, i) => {
    if (event.type === 'reclutamiento') {
      if (event.character != null && !allies.has(event.character)) {
        warn(`Evento ${i + 1}: ${characters[event.character]?.name ?? event.character} es reclutable pero no esta en allies.`);
      }
      return;
    }

    if (event.type === 'eleccion') {
      if (!Array.isArray(event.options) || event.options.length === 0) {
        warn(`Evento ${i + 1}: es una eleccion pero no tiene opciones en "options".`);
      } else if (event.options.some(o => o.id == null)) {
        warn(`Evento ${i + 1}: todas las opciones deben tener un "id".`);
      }
      return;
    }

    if (event.type === 'dialogo') {
      if (!Array.isArray(event.dialog) || event.dialog.length === 0) {
        warn(`Evento ${i + 1}: es un dialogo pero no tiene lineas en "dialog".`);
      }
      (event.dialog ?? []).forEach((line, j) => {
        const sp = line.speaker;
        if (sp != null && (sp < 0 || sp >= characters.length)) {
          warn(`Evento ${i + 1}, linea ${j + 1}: speaker ${sp} no es un indice valido de characters.`);
        }
      });
      return;
    }

    if (event.reward != null && event.type !== 'enfrentamiento') {
      warn(`Evento ${i + 1}: tiene "reward" pero no es un enfrentamiento; se ignorará.`);
    }

    if (event.type !== 'enfrentamiento' || !event.enemyTeam) return;

    const allowed = event.narrativo ? new Set([...generic, ...narrative]) : generic;
    event.enemyTeam.forEach(idx => {
      if (idx >= 0 && !allowed.has(idx)) {
        warn(`Evento ${i + 1}: ${characters[idx]?.name ?? idx} no deberia aparecer en un enfrentamiento ${event.narrativo ? 'narrativo' : 'generico'}.`);
      }
    });
  });
}

document.getElementById('combat-area').addEventListener('click', (e) => {
  const slot = e.target.closest('.member-slot.targetable');
  if (slot) {
    onTargetClick(slot.dataset.team, parseInt(slot.dataset.index));
  }
});

document.getElementById('log-open-btn').addEventListener('click', openLog);
document.getElementById('global-pause-btn').addEventListener('click', showPause);
document.getElementById('log-close-btn').addEventListener('click', closeLog);
document.getElementById('log-overlay').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeLog();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeLog();
});

function showScreen(name) {
  document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
  const screen = document.getElementById(`screen-${name}`);
  if (screen) screen.classList.add('active');
  const pauseBtn = document.getElementById('global-pause-btn');
  if (pauseBtn) pauseBtn.hidden = (name === 'menu');
}

function advanceStage() {
  advanceStageFlow();

  if (state.session.currentEvent?.final) {
    showEnding(state.session.currentEvent, state.session.selectedStory, resetRunState);
    return;
  }

  showScreen('map');
  renderMap();
}

function renderMenu() {
  stopMusic();
  const list = document.getElementById('story-list');
  list.innerHTML = '';

  stories.forEach(story => {
    const card = document.createElement('div');
    card.className = 'story-card';
    card.innerHTML = `
      <div class="story-card-title">${story.title}</div>
      <div class="story-card-desc">${story.description}</div>
    `;
    list.appendChild(card);

    const saved = story.sequential ? loadGame(story.id) : null;
    const actions = document.createElement('div');
    actions.className = 'story-card-actions';
    card.appendChild(actions);

    if (saved) {
      card.addEventListener('click', () => startStory(story, { loadSave: true }));

      const resumeBtn = document.createElement('button');
      resumeBtn.className = 'story-card-resume';
      resumeBtn.textContent = `▶ Continuar · Etapa ${saved.run.stage + 1}`;
      resumeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        startStory(story, { loadSave: true });
      });
      actions.appendChild(resumeBtn);
    } else {
      card.addEventListener('click', () => startStory(story, { loadSave: false }));
    }

    if (story.sequential) {
      const newBtn = document.createElement('button');
      newBtn.className = 'story-card-new';
      newBtn.textContent = '⚔ Nueva partida';
      newBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (saved && !(await showConfirmModal('Empezar de nuevo borrará tu progreso actual. ¿Continuar?'))) return;
        startStory(story, { loadSave: false });
      });
      actions.appendChild(newBtn);
    }
  });
}

function startStory(story, { loadSave }) {
  state.session.selectedStory = story;
  validateStoryCast(story);

  if (loadSave) {
    const data = loadGame(story.id);
    if (!data) {
      startStory(story, { loadSave: false });
      return;
    }
    state.run.stage = data.run.stage;
    state.run.enfrentamientos = data.run.enfrentamientos;
    state.run.campamentos = data.run.campamentos;
    state.run.fightsSinceCamp = data.run.fightsSinceCamp;
    state.run.needRecruit = data.run.needRecruit ?? true;
    state.run.fired = data.fired;
    state.run.choices = data.run.choices ?? {};
    state.run.currentNodeId = data.run.currentNodeId ?? null;
    state.run.flags = data.run.flags ?? {};
    state.run.orbes = data.run.orbes ?? 0;
    state.session.playerTeam = data.playerTeam;
    state.session.protagonistSlot = data.protagonistSlot;
    resetTeam();
    importTeamSave(data.team);
  } else {
    resetRunState();
    state.session.playerTeam = [...story.teamA];
    state.session.protagonistSlot = story.noProtagonist
      ? -1
      : ROLE_BY_INDEX.indexOf(characters[story.protagonist ?? 0].role);
    resetTeam();
    clearSavedTeamHp();
    clearSavedTeamLevels();
    clearSavedTeamSkills();
    clearSavedTeamLearnableSkills();
    clearSavedTeamLearnedSkills();
    clearGame(story.id);
  }

  renderMap();
}

function renderMap() {
  showScreen('map');
  playChill();

  const title = document.getElementById('map-title');
  title.textContent = state.session.selectedStory.title;

  const events = document.getElementById('map-events');
  events.innerHTML = '';

  if (state.session.selectedStory.sequential) {
    const header = document.getElementById('map-header');
    const story = state.session.selectedStory;
    if (story.infiniteMode) {
      const cycle = state.run.campamentos + 1;
      const members = state.session.playerTeam.filter(idx => idx !== -1).length;
      header.textContent = `Ciclo ${cycle} · Equipo: ${members}/4 · 🔵 Orbes: ${state.run.orbes ?? 0}`;
    } else {
      header.textContent = `Etapa ${state.run.stage + 1} · 🔵 Orbes: ${state.run.orbes ?? 0}`;
    }

    state.session.currentEvent = pickNextEvent(state.session.selectedStory, state.run, state.session.playerTeam);
    const event = state.session.currentEvent;
    const card = document.createElement('div');
    card.className = 'event-card';
    card.innerHTML = `
      <div class="event-card-title">${event.title}</div>
      <div class="event-card-desc">${event.description}</div>
    `;
    card.addEventListener('click', () => {
      startCombat(event);
    });
    events.appendChild(card);

    if (story.infiniteMode) {
      const teamSummary = document.createElement('div');
      teamSummary.className = 'infinite-team-summary';
      teamSummary.style.cssText = 'display:flex;gap:0.5rem;justify-content:center;margin-top:1rem;flex-wrap:wrap;';
      const roleNames = { tanque: 'Tanque', asesino: 'Asesino', rango: 'Rango', soporte: 'Soporte' };
      const ROLE_BY = ['tanque', 'asesino', 'rango', 'soporte'];
      ROLE_BY.forEach((role, i) => {
        const charIdx = state.session.playerTeam[i];
        const slot = document.createElement('div');
        slot.style.cssText = 'border:1px solid #444;border-radius:6px;padding:0.4rem 0.6rem;text-align:center;font-size:0.75rem;min-width:80px;background:#1a1a2e;';
        if (charIdx !== -1) {
          const ch = characters[charIdx];
          slot.innerHTML = `<div style="color:#aaa;font-size:0.6rem;text-transform:uppercase;">${roleNames[role]}</div><div style="font-weight:bold;">${ch.name}</div>`;
        } else {
          slot.innerHTML = `<div style="color:#aaa;font-size:0.6rem;text-transform:uppercase;">${roleNames[role]}</div><div style="color:#666;">Vacío</div>`;
        }
        teamSummary.appendChild(slot);
      });
      events.appendChild(teamSummary);
    }
  } else {
    const header = document.getElementById('map-header');
    header.textContent = 'Elige un evento';

    state.session.selectedStory.events.forEach(event => {
      const card = document.createElement('div');
      card.className = 'event-card';
      card.innerHTML = `
        <div class="event-card-title">${event.title}</div>
        <div class="event-card-desc">${event.description}</div>
      `;
      card.addEventListener('click', () => {
        startCombat(event);
      });
      events.appendChild(card);
    });
  }

  persistProgress();
}

function startCombat(event) {
  state.session.currentEvent = event;

  if (event.type === 'campamento') {
    showCampEvent(event, advanceStage);
    return;
  }

  if (event.type === 'reclutamiento') {
    showRecruitEvent(event, advanceStage);
    return;
  }

  if (event.type === 'reclutamiento_infinite') {
    showInfiniteRecruitEvent(event, advanceStage);
    return;
  }

  if (event.type === 'dialogo') {
    showDialogueEvent(event, advanceStage);
    return;
  }

  if (event.type === 'eleccion') {
    showChoiceEvent(event, advanceStage);
    return;
  }

  showScreen('combat');
  playCombat();

  const teamAData = buildTeamAData();

  let teamBData;
  if (event.type === 'enfrentamiento') {
    const memberLevels = state.combat.teams.A.members.filter(Boolean).map(m => m.level ?? 1);
    const playerMemberCount = teamAData.filter(Boolean).length;
    const playerAvgLevel = memberLevels.length > 0
      ? memberLevels.reduce((sum, l) => sum + l, 0) / memberLevels.length
      : 1;
    const generated = generateEnemyTeam({
      story: state.session.selectedStory,
      playerMemberCount,
      playerAvgLevel,
      peakEnemyLevel: state.run.peakEnemyLevel,
      enemyTeamOverride: event.enemyTeam
    });
    state.run.peakEnemyLevel = generated.newPeakEnemyLevel;
    teamBData = generated.team.map((g, i) => {
      if (!g) return null;
      const idx = event.enemyTeam ? event.enemyTeam[i] : g.index;
      return { ...characters[idx], level: g.level };
    });
  } else {
    teamBData = (event.enemyTeam ?? []).map(idx => idx >= 0 ? characters[idx] : null);
  }

  setGameEndCallback(() => {
    if (allDead(TEAMS.B)) {
      handleVictory();
      return;
    }
    startStory(state.session.selectedStory, { loadSave: false });
  });

  initState(teamAData, teamBData);

  renderTeamsHeader();
  renderTeams();
  renderHP();
  renderStatus();
  renderBuffs();
  clearTargets();
  renderActions([], () => {});
  document.getElementById('restart-area').innerHTML = '';
  clearLog();

  const aNames = teamAData.filter(Boolean).map(c => c.name).join(', ');
  const bNames = teamBData.filter(Boolean).map(c => c.name).join(', ');
  log(`⚔️ ¡Combate: EQUIPO A (${aNames}) vs EQUIPO B (${bNames})!`);

  startTurn();
}

function handleVictory() {
  const { result, fallen, protagonistName, names } = resolveVictory();
  const story = state.session.selectedStory;

  if (result === 'protagonist_fallen' && !story.noProtagonist) {
    const overlay = document.getElementById('camp-overlay');
    const msg = document.getElementById('camp-message');
    const btn = document.getElementById('camp-continue');
    const titleEl = document.getElementById('camp-title');
    titleEl.textContent = '';
    const staleRecruit = overlay.querySelector('.infinite-recruit-options');
    if (staleRecruit) staleRecruit.remove();
    msg.innerHTML = `💀 <strong>${protagonistName}</strong> ha caído en batalla.<br>La historia termina aquí.`;
    btn.textContent = 'Reintentar';
    btn.onclick = () => {
      overlay.classList.add('hidden');
      startStory(story, { loadSave: false });
    };
    overlay.classList.remove('hidden');
    return;
  }

  saveTeamState();

  // ── Recompensa de orbes azules (mente) ──
  const reward = state.session.currentEvent?.reward;
  const gainedOrbs = typeof reward === 'number' ? reward : (reward?.orbs ?? 1);
  state.run.orbes = (state.run.orbes ?? 0) + gainedOrbs;
  const orbText = `🔵 +${gainedOrbs} ${gainedOrbs === 1 ? 'Orbe de la mente' : 'Orbes de la mente'}`;
  showToast(orbText);
  log(orbText);

  if (result === 'allies_fallen') {
    const overlay = document.getElementById('camp-overlay');
    const msg = document.getElementById('camp-message');
    const btn = document.getElementById('camp-continue');
    const titleEl = document.getElementById('camp-title');
    titleEl.textContent = '';
    const staleRecruit = overlay.querySelector('.infinite-recruit-options');
    if (staleRecruit) staleRecruit.remove();
    msg.innerHTML = names.map(n => `☠️ <strong>${n}</strong> ha caído en batalla.`).join('<br>') + `<br><span style="color:#5ea8ff;">${orbText}</span>`;

    fallen.forEach(i => {
      state.session.playerTeam[i] = -1;
      clearSavedSlot(i);
    });

    const allGone = state.session.playerTeam.every(idx => idx === -1);

    if (allGone) {
      btn.textContent = 'Volver al menú';
      btn.onclick = () => {
        overlay.classList.add('hidden');
        state.session.selectedStory = null;
        resetRunState();
        stopMusic();
        renderMenu();
        showScreen('menu');
      };
    } else {
      btn.textContent = 'Continuar';
      btn.onclick = () => {
        overlay.classList.add('hidden');
        advanceStage();
      };
    }

    overlay.classList.remove('hidden');
    return;
  }

  advanceStage();
}

if (isDev()) {
  window.__andromedaSaveDebug = debugSave;

  setupDevPanel(stories, (story, payload) => {
    const ok = saveGame(story.id, payload);
    if (!ok) {
      showToast('⚠️ No se pudo guardar el salto (almacenamiento local)');
      return;
    }
    startStory(story, { loadSave: true });
  });
} else {
  document.getElementById('dev-panel')?.remove();
}

renderMenu();
showScreen('menu');
initPause();

document.getElementById('pause-load-game').addEventListener('click', () => {
  document.getElementById('pause-overlay').classList.add('hidden');
  startStory(state.session.selectedStory, { loadSave: true });
});

document.getElementById('pause-back-menu').addEventListener('click', () => {
  document.getElementById('pause-overlay').classList.add('hidden');
  state.session.selectedStory = null;
  resetRunState();
  stopMusic();
  renderMenu();
  showScreen('menu');
});
