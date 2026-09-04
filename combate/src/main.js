import state, { initState, setGameEndCallback, saveTeamState, restoreTeamHp, clearSavedTeamHp, clearSavedTeamLevels, clearSavedTeamSkills, saveTeamLevels, allDead, resetTeam, clearSavedSlot, exportTeamSave, importTeamSave, resetRunState, resetSessionState } from './state.js';
import { ROLE_BY_INDEX } from './models.js';
import { startTurn, onTargetClick } from './combat.js';
import { renderTeams, renderHP, renderStatus, renderBuffs, renderActions, clearTargets, renderTeamsHeader } from './renderer.js';
import { log, clearLog, openLog, closeLog } from './log.js';
import { saveGame, loadGame, clearGame, debugSave } from './save.js';
import characters from '../data/characters.js';
import stories from '../data/stories.js';
import { generateEnemyTeam } from './enemyGenerator.js';
import { pickNextEvent } from './eventGenerator.js';
import { setupDevPanel } from './devTools.js';
import { TEAMS } from './constants.js';
import { advanceStage as advanceStageFlow, resolveVictory } from './gameFlow.js';
import { showCampEvent, showRecruitEvent, showDialogueEvent, showChoiceEvent, showEnding } from './eventHandlers.js';
import './mobile.js';
import { playChill, playCombat, stopMusic, initMuteButton } from './music.js';
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

  (story.narrativeEvents ?? story.events ?? []).forEach((event, i) => {
    if (event.type === 'reclutamiento') {
      if (event.character != null && !allies.has(event.character)) {
        warn(`Evento ${i + 1}: ${characters[event.character]?.name ?? event.character} es reclutable pero no está en allies.`);
      }
      return;
    }

    if (event.type === 'eleccion') {
      if (!Array.isArray(event.options) || event.options.length === 0) {
        warn(`Evento ${i + 1}: es una elección pero no tiene opciones en "options".`);
      } else if (event.options.some(o => o.id == null)) {
        warn(`Evento ${i + 1}: todas las opciones deben tener un "id".`);
      }
      return;
    }

    if (event.type === 'dialogo') {
      if (!Array.isArray(event.dialog) || event.dialog.length === 0) {
        warn(`Evento ${i + 1}: es un diálogo pero no tiene líneas en "dialog".`);
      }
      (event.dialog ?? []).forEach((line, j) => {
        const sp = line.speaker;
        if (sp != null && (sp < 0 || sp >= characters.length)) {
          warn(`Evento ${i + 1}, línea ${j + 1}: speaker ${sp} no es un índice válido de characters.`);
        }
      });
      return;
    }

    if (event.type !== 'enfrentamiento' || !event.enemyTeam) return;

    const allowed = event.narrativo ? new Set([...generic, ...narrative]) : generic;
    event.enemyTeam.forEach(idx => {
      if (idx >= 0 && !allowed.has(idx)) {
        warn(`Evento ${i + 1}: ${characters[idx]?.name ?? idx} no debería aparecer en un enfrentamiento ${event.narrativo ? 'narrativo' : 'genérico'}.`);
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
    state.run.fired = data.fired;
    state.run.choices = data.run.choices ?? {};
    state.session.playerTeam = data.playerTeam;
    state.session.protagonistSlot = data.protagonistSlot;
    resetTeam();
    importTeamSave(data.team);
  } else {
    resetRunState();
    state.session.playerTeam = [...story.teamA];
    state.session.protagonistSlot = ROLE_BY_INDEX.indexOf(characters[story.protagonist ?? 0].role);
    resetTeam();
    clearSavedTeamHp();
    clearSavedTeamLevels();
    clearSavedTeamSkills();
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
    header.textContent = `Etapa ${state.run.stage + 1}`;

    state.session.currentEvent = pickNextEvent(state.session.selectedStory, state.run);
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

  const menuArea = document.getElementById('map-menu-area');
  menuArea.innerHTML = '';

  const menuBtn = document.createElement('button');
  menuBtn.className = 'map-menu-btn';
  menuBtn.textContent = 'Volver al Menú';
  menuBtn.addEventListener('click', () => {
    state.session.selectedStory = null;
    resetRunState();
    stopMusic();
    showScreen('menu');
  });
  menuArea.appendChild(menuBtn);

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
  if (event.type === 'enfrentamiento' && !event.narrativo) {
    const memberLevels = state.combat.teams.A.members.filter(Boolean).map(m => m.level ?? 1);
    const playerMemberCount = teamAData.filter(Boolean).length;
    const playerAvgLevel = memberLevels.length > 0
      ? memberLevels.reduce((sum, l) => sum + l, 0) / memberLevels.length
      : 1;
    const generated = generateEnemyTeam({
      story: state.session.selectedStory,
      stage: state.run.stage,
      playerMemberCount,
      playerAvgLevel
    });
    teamBData = generated.map(g => g ? { ...characters[g.index], level: g.level } : null);
  } else {
    teamBData = (event.enemyTeam ?? []).map(idx => idx >= 0 ? characters[idx] : null);
  }

  setGameEndCallback(() => {
    if (allDead(TEAMS.B)) {
      handleVictory();
      return;
    }
    clearSavedTeamHp();
    showScreen('map');
    renderMap();
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

  if (result === 'protagonist_fallen') {
    const overlay = document.getElementById('camp-overlay');
    const msg = document.getElementById('camp-message');
    const btn = document.getElementById('camp-continue');
    msg.innerHTML = `💀 <strong>${protagonistName}</strong> ha caído en batalla.<br>La historia termina aquí.`;
    btn.textContent = 'Volver al Menú';
    btn.onclick = () => {
      overlay.classList.add('hidden');
      clearGame(state.session.selectedStory.id);
      state.session.selectedStory = null;
      resetRunState();
      state.session.playerTeam = null;
      clearSavedTeamHp();
      clearSavedTeamLevels();
      clearSavedTeamSkills();
      renderMenu();
      showScreen('menu');
    };
    overlay.classList.remove('hidden');
    return;
  }

  saveTeamState();

  if (result === 'allies_fallen') {
    const overlay = document.getElementById('camp-overlay');
    const msg = document.getElementById('camp-message');
    const btn = document.getElementById('camp-continue');
    msg.innerHTML = names.map(n => `☠️ <strong>${n}</strong> ha caído en batalla.`).join('<br>');
    btn.textContent = 'Continuar';
    btn.onclick = () => {
      overlay.classList.add('hidden');
      fallen.forEach(i => {
        state.session.playerTeam[i] = -1;
        clearSavedSlot(i);
      });
      advanceStage();
    };
    overlay.classList.remove('hidden');
    return;
  }

  advanceStage();
}

window.__andromedaSaveDebug = debugSave;

setupDevPanel(stories, (story, payload) => {
  const ok = saveGame(story.id, payload);
  if (!ok) {
    showToast('⚠️ No se pudo guardar el salto (almacenamiento local)');
    return;
  }
  startStory(story, { loadSave: true });
});

renderMenu();
showScreen('menu');
initMuteButton();
initPause();
