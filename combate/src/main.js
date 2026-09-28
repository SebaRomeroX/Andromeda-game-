import state, { initState, setGameEndCallback, saveTeamState, restoreTeamHp, clearSavedTeamHp, clearSavedTeamLevels, clearSavedTeamSkills, clearSavedTeamLearnableSkills, clearSavedTeamLearnedSkills, saveTeamLevels, allDead, resetTeam, clearSavedSlot, exportTeamSave, importTeamSave, resetRunState, resetSessionState, activeEvent } from './state.js';
import { ROLE_BY_INDEX } from './models.js';
import { startTurn, onTargetClick } from './combat.js';
import { renderTeams, renderHP, renderStatus, renderBuffs, renderActions, clearTargets, renderTeamsHeader } from './renderer.js';
import { log, logHtml, clearLog, openLog, closeLog } from './log.js';
import { saveGame, loadGame, clearGame, debugSave } from './save.js';
import { getCharacter } from '../data/characters.js';
import stories from '../data/stories/index.js';
import { generateEnemyTeam } from './enemyGenerator.js';
import { pickNextEvent } from './eventGenerator.js';
import { expandEventSteps, expandOptionSteps } from './eventSteps.js';
import { validateStoryCast } from './storyValidation.js';
import { setupDevPanel } from './devTools.js';
import { isDev } from './env.js';
import { TEAMS } from './constants.js';
import { applyStepEffects, completeEvent as completeEventFlow, resolveVictory, getEventOrbs, grantOrbs, formatOrbTotalsHtml, formatOrbGainInlineHtml, emptyOrbs } from './gameFlow.js';
import { showCampEvent, showRecruitEvent, showInfiniteRecruitEvent, showRecruitOfferEvent, showRecruitJoinEvent, showDialogueEvent, showChoiceEvent, showPuzzleEvent, showEnding, showEndModal } from './eventHandlers.js';
import './mobile.js';
import { playChill, playCombat, stopMusic } from './music.js';
import { initPause, showPause } from './pause.js';
import { showToast } from './toast.js';

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

// `state.session.playerTeam` guarda NOMBRES (null = ranura vacia).
function buildTeamAData() {
  return (state.session.playerTeam ?? []).map(name => getCharacter(name));
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

// Todos los pasos del evento terminaron: efectos de nivel nodo (fired,
// flags, puntero next, stage), posible final de historia y vuelta al mapa.
// Ojo: no se puede renderizar el mapa antes (renderMap re-sortea
// state.session.currentEvent y pisaria el nodo en curso).
function completeEventStage() {
  state.session.currentStep = null;
  completeEventFlow(state.session.currentEvent);

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
    state.run.pendingRandomId = data.run.pendingRandomId ?? null;
    // pendingRecruit se guarda al aceptar la demanda de combate del
    // reclutamiento; sin restaurarlo la carga perdia al aspirante y
    // 'reclutamiento_final' no unia a nadie tras vencer.
    state.run.pendingRecruit = data.run.pendingRecruit ?? null;
    // Igual que pendingRecruit: se persiste pero se quedaba sin restaurar,
    // reiniciando la escalada de nivel de los enemigos en cada carga.
    state.run.peakEnemyLevel = data.run.peakEnemyLevel ?? 0;
    state.run.flags = data.run.flags ?? {};
    state.run.orbes = data.run.orbes ?? emptyOrbs();
    state.session.playerTeam = data.playerTeam;
    state.session.protagonistSlot = data.protagonistSlot;
    resetTeam();
    importTeamSave(data.team);
  } else {
    resetRunState();
    state.session.playerTeam = [...story.teamA];
    const protagonistChar = getCharacter(story.protagonist);
    state.session.protagonistSlot = story.noProtagonist || !protagonistChar
      ? -1
      : ROLE_BY_INDEX.indexOf(protagonistChar.role);
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
      const members = state.session.playerTeam.filter(name => name != null).length;
      header.innerHTML = `Ciclo ${cycle} · Equipo: ${members}/4 · Orbes: ${formatOrbTotalsHtml(state.run.orbes)}`;
    } else {
      header.innerHTML = `Etapa ${state.run.stage + 1} · Orbes: ${formatOrbTotalsHtml(state.run.orbes)}`;
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
        const charName = state.session.playerTeam[i];
        const slot = document.createElement('div');
        slot.style.cssText = 'border:1px solid #444;border-radius:6px;padding:0.4rem 0.6rem;text-align:center;font-size:0.75rem;min-width:80px;background:#1a1a2e;';
        if (charName != null) {
          const ch = getCharacter(charName);
          slot.innerHTML = `<div style="color:#aaa;font-size:0.6rem;text-transform:uppercase;">${roleNames[role]}</div><div style="font-weight:bold;">${ch?.name ?? charName}</div>`;
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

// Expande el evento en pasos (eventSteps.js) y los ejecuta en orden.
// Cada paso termina aplicando sus contadores (applyStepEffects) y
// encadenando el siguiente; cuando no quedan pasos se cierra el evento
// completo (completeEventStage).
function startCombat(event) {
  state.session.currentEvent = event;
  state.session.currentStep = null;
  // Cada intento de combate parte sin recompensa pendiente: si el anterior
  // se perdio (o quedo un residuo), la proxima victoria vuelve a tirar.
  state.session.pendingOrbReward = null;

  runSteps(expandEventSteps(event), 0);
}

function runSteps(steps, index) {
  if (index >= steps.length) {
    completeEventStage();
    return;
  }
  const step = steps[index];
  state.session.currentStep = step;
  // `onDone` recibe la opcion elegida (solo una eleccion la pasa): sus
  // `option.steps` se expanden con los derechos de cualquier paso
  // (herencia de reward del nodo) y se insertan detras de la eleccion,
  // antes de lo que quede en la cola. Sin rama: cola normal.
  runEventStep(step, (option) => {
    applyStepEffects(step);
    const branch = option?.steps?.length
      ? expandOptionSteps(option.steps, state.session.currentEvent)
      : [];
    runSteps([...branch, ...steps.slice(index + 1)], 0);
  });
}

// Ejecuta un paso con su handler correspondiente. `onDone` encadena el
// paso siguiente (en un evento de un solo paso es el cierre clasico).
function runEventStep(event, onDone) {
  if (event.type === 'campamento') {
    showCampEvent(event, onDone);
    return;
  }

  if (event.type === 'reclutamiento') {
    showRecruitEvent(event, onDone);
    return;
  }

  if (event.type === 'reclutamiento_infinite') {
    showInfiniteRecruitEvent(event, onDone);
    return;
  }

  if (event.type === 'reclutamiento_oferta') {
    showRecruitOfferEvent(event, onDone);
    return;
  }

  if (event.type === 'reclutamiento_final') {
    showRecruitJoinEvent(event, onDone);
    return;
  }

  if (event.type === 'dialogo') {
    showDialogueEvent(event, onDone);
    return;
  }

  if (event.type === 'eleccion') {
    // Dentro de una secuencia la eleccion es un paso, no el nodo: se le
    // inyecta el id del nodo (la clave de `choices` queda igual que en un
    // evento top-level) y se quita `option.next` (los punteros de grafo
    // no salen de una secuencia; la validacion avisa si se declaran).
    const node = state.session.currentEvent;
    const step = node?.type === 'secuencia' && node !== event
      ? {
          ...event,
          id: event.id ?? node.id,
          options: (event.options ?? []).map(({ next, ...o }) => o)
        }
      : event;
    showChoiceEvent(step, onDone);
    return;
  }

  if (event.type === 'acertijo') {
    showPuzzleEvent(event, onDone);
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
    teamBData = generated.team.map(g => {
      if (!g) return null;
      const char = getCharacter(g.name);
      return char ? { ...char, level: g.level } : null;
    });
  } else {
    teamBData = (event.enemyTeam ?? []).map(name => getCharacter(name));
  }

  setGameEndCallback(() => {
    if (allDead(TEAMS.B)) {
      handleVictory(onDone);
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
  clearLog();

  const aNames = teamAData.filter(Boolean).map(c => c.name).join(', ');
  const bNames = teamBData.filter(Boolean).map(c => c.name).join(', ');
  log(`⚔️ ¡Combate: EQUIPO A (${aNames}) vs EQUIPO B (${bNames})!`);

  startTurn();
}

// Victoria detectada en combate (modal de victoria ya confirmado).
// `onDone` encadena el paso siguiente de la secuencia (o el cierre del
// evento). Caminos de final (protagonista caido, todo el grupo muerto)
// no lo llaman: reinician o terminan la historia.
function handleVictory(onDone) {
  const { result, fallen, protagonistName } = resolveVictory();
  const story = state.session.selectedStory;

  if (result === 'protagonist_fallen' && !story.noProtagonist) {
    showEndModal({
      message: `💀 <strong>${protagonistName}</strong> ha caído en batalla.<br>La historia termina aquí.`,
      buttonText: 'Reintentar',
      onClick: () => startStory(story, { loadSave: false })
    });
    return;
  }

  saveTeamState();

  // ── Recompensa de orbes (mente/poder/cuerpo/riqueza) ──
  // La tirada ya se hizo al detectar la victoria (combat.js) y se muestra
  // en el modal; aqui solo se otorga (al pulsar Continuar) y se registra
  // en el log. Si no hubiera tirada guardada, se tira ahora (con el
  // reward del paso en curso, heredado de la secuencia si no el suyo).
  const gainedOrbs = state.session.pendingOrbReward ?? getEventOrbs(activeEvent());
  state.session.pendingOrbReward = null;
  grantOrbs(gainedOrbs);
  const gainText = formatOrbGainInlineHtml(gainedOrbs);
  if (gainText) logHtml(`${gainText} — Orbes ganados`);

  if (result === 'allies_fallen') {
    // Las bajas ya se mostraron en el modal de victoria; aqui solo se aplican
    fallen.forEach(i => {
      state.session.playerTeam[i] = null;
      clearSavedSlot(i);
    });

    const allGone = state.session.playerTeam.every(name => name == null);

    if (allGone) {
      state.session.selectedStory = null;
      resetRunState();
      stopMusic();
      renderMenu();
      showScreen('menu');
      return;
    }
  }

  onDone();
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
