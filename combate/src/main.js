import state, { initState, setGameEndCallback, saveTeamState, restoreTeamHp, clearSavedTeamHp, clearSavedTeamLevels, clearSavedTeamSkills, saveTeamLevels, allDead, resetTeam, clearSavedSlot, exportTeamSave, importTeamSave } from './state.js';
import { getLevelStats, ROLE_BY_INDEX } from './models.js';
import { startTurn, onTargetClick } from './combat.js';
import { renderTeams, renderHP, renderStatus, renderBuffs, renderActions, clearTargets, renderTeamsHeader } from './renderer.js';
import { log, clearLog, openLog, closeLog } from './log.js';
import { startSkillUpgrades } from './upgrades.js';
import { saveGame, loadGame, clearGame, debugSave } from './save.js';
import characters from '../data/characters.js';
import stories from '../data/stories.js';
import { generateEnemyTeam } from './enemyGenerator.js';
import { pickNextEvent } from './eventGenerator.js';
import { setupDevPanel } from './devTools.js';
import './mobile.js';

let selectedStory = null;
let playerTeam = null;
let protagonistSlot = 0;
let currentEvent = null;

const run = {
  stage: 0,
  enfrentamientos: 0,
  campamentos: 0,
  fightsSinceCamp: 0,
  fired: new Set(),
  choices: {}
};

function resetRun() {
  run.stage = 0;
  run.enfrentamientos = 0;
  run.campamentos = 0;
  run.fightsSinceCamp = 0;
  run.fired.clear();
  run.choices = {};
  currentEvent = null;
}

function showOverlay(message, buttonText, onClick) {
  const overlay = document.getElementById('camp-overlay');
  const msg = document.getElementById('camp-message');
  const btn = document.getElementById('camp-continue');
  msg.innerHTML = message;
  btn.textContent = buttonText;
  btn.onclick = () => { overlay.classList.add('hidden'); if (onClick) onClick(); };
  overlay.classList.remove('hidden');
}

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

function persistProgress() {
  if (!selectedStory || !selectedStory.sequential) return;
  const ok = saveGame(selectedStory.id, {
    playerTeam,
    protagonistSlot,
    run,
    team: exportTeamSave()
  });
  console.log('[guardado] persistProgress ->', selectedStory.id, 'stage', run.stage, ok ? 'OK' : 'FALLO');
  if (!ok) {
    showToast('⚠️ No se pudo guardar (almacenamiento local)');
  } else if (run.stage > 0) {
    showToast('💾 Partida Guardada');
  }

  const badge = document.getElementById('map-save-badge');
  if (badge) {
    badge.textContent = `💾 Progreso guardado · Etapa ${run.stage + 1}`;
    badge.classList.remove('hidden');
  }
}

function buildTeamAData() {
  return (playerTeam ?? []).map(idx => idx >= 0 ? characters[idx] : null);
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
}

function renderMenu() {
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
      newBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (saved && !confirm('Empezar de nuevo borrará tu progreso actual. ¿Continuar?')) return;
        startStory(story, { loadSave: false });
      });
      actions.appendChild(newBtn);
    }
  });
}

function startStory(story, { loadSave }) {
  selectedStory = story;
  validateStoryCast(story);

  if (loadSave) {
    const data = loadGame(story.id);
    if (!data) {
      startStory(story, { loadSave: false });
      return;
    }
    run.stage = data.run.stage;
    run.enfrentamientos = data.run.enfrentamientos;
    run.campamentos = data.run.campamentos;
    run.fightsSinceCamp = data.run.fightsSinceCamp;
    run.fired = data.fired;
    run.choices = data.run.choices ?? {};
    playerTeam = data.playerTeam;
    protagonistSlot = data.protagonistSlot;
    resetTeam();
    importTeamSave(data.team);
  } else {
    resetRun();
    playerTeam = [...story.teamA];
    protagonistSlot = ROLE_BY_INDEX.indexOf(characters[story.protagonist ?? 0].role);
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

  const title = document.getElementById('map-title');
  title.textContent = selectedStory.title;

  const events = document.getElementById('map-events');
  events.innerHTML = '';

  if (selectedStory.sequential) {
    const header = document.getElementById('map-header');
    header.textContent = `Etapa ${run.stage + 1}`;

    currentEvent = pickNextEvent(selectedStory, run);
    const event = currentEvent;
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

    selectedStory.events.forEach(event => {
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
    selectedStory = null;
    resetRun();
    showScreen('menu');
  });
  menuArea.appendChild(menuBtn);

  persistProgress();
}

function showCampEvent(event) {
  const overlay = document.getElementById('camp-overlay');
  const message = document.getElementById('camp-message');
  const button = document.getElementById('camp-continue');

  const teamAData = buildTeamAData();
  initState(teamAData, []);

  message.textContent = event.description;
  button.textContent = 'Descansar';
  overlay.classList.remove('hidden');

  button.onclick = () => {
    const leveledNames = [];
    const leveledMembers = [];
    state.teams.A.members.forEach(m => {
      if (m && m.currentHp > 0) {
        m.level++;
        const st = getLevelStats(m);
        m.hp = st.hp;
        m.evasion = st.evasion;
        leveledNames.push({ name: m.name, level: m.level });
        leveledMembers.push(m);
      }
    });
    saveTeamLevels();
    restoreTeamHp();

    if (leveledNames.length > 0) {
      message.innerHTML = leveledNames
        .map(c => `✨ ${c.name} sube a nivel ${c.level}!`)
        .join('<br>')
        + '<br><br>Los supervivientes descansan y recuperan su vida.';
    } else {
      message.textContent = 'El equipo descansa y recupera su vida, pero nadie sube de nivel.';
    }

    button.textContent = 'Continuar';
    button.onclick = () => {
      const finishCamp = () => {
        overlay.classList.add('hidden');
        advanceStage();
      };
      startSkillUpgrades(leveledMembers, finishCamp);
    };
  };
}

function startCombat(event) {
  currentEvent = event;

  if (event.type === 'campamento') {
    showCampEvent(event);
    return;
  }

  if (event.type === 'reclutamiento') {
    showRecruitEvent(event);
    return;
  }

  if (event.type === 'dialogo') {
    showDialogueEvent(event);
    return;
  }

  if (event.type === 'eleccion') {
    showChoiceEvent(event);
    return;
  }

  showScreen('combat');

  const teamAData = buildTeamAData();

  let teamBData;
  if (event.type === 'enfrentamiento' && !event.narrativo) {
    const memberLevels = state.teams.A.members.filter(Boolean).map(m => m.level ?? 1);
    const playerMemberCount = teamAData.filter(Boolean).length;
    const playerAvgLevel = memberLevels.length > 0
      ? memberLevels.reduce((sum, l) => sum + l, 0) / memberLevels.length
      : 1;
    const generated = generateEnemyTeam({
      story: selectedStory,
      stage: run.stage,
      playerMemberCount,
      playerAvgLevel
    });
    teamBData = generated.map(g => g ? { ...characters[g.index], level: g.level } : null);
  } else {
    teamBData = (event.enemyTeam ?? []).map(idx => idx >= 0 ? characters[idx] : null);
  }

  setGameEndCallback(() => {
    if (allDead('B')) {
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

function showRecruitEvent(event) {
  const char = characters[event.character];
  const slot = ROLE_BY_INDEX.indexOf(char.role);

  if (playerTeam[slot] !== -1) {
    showOverlay(`${char.name} quiere unirse, pero su puesto ya está ocupado.`, 'Continuar', () => {
      advanceStage();
    });
    return;
  }

  playerTeam[slot] = event.character;
  clearSavedSlot(slot);
  showOverlay(`✨ <strong>${char.name}</strong> se ha unido al grupo.`, 'Continuar', () => {
    advanceStage();
  });
}

function showDialogueEvent(event) {
  const lines = event.dialog ?? [];
  if (lines.length === 0) {
    advanceStage();
    return;
  }

  const overlay = document.getElementById('dialog-overlay');
  const portrait = document.getElementById('dialog-portrait');
  const speaker = document.getElementById('dialog-speaker');
  const text = document.getElementById('dialog-text');

  let index = 0;

  function renderLine() {
    const line = lines[index];
    const isNarrator = line.speaker == null;
    overlay.classList.toggle('narrator', isNarrator);

    if (isNarrator) {
      portrait.removeAttribute('src');
      portrait.alt = '';
      speaker.textContent = '';
    } else {
      const char = characters[line.speaker];
      portrait.src = char?.image ?? '';
      portrait.alt = char?.name ?? '';
      speaker.textContent = char?.name ?? '';
    }
    text.textContent = line.text;
  }

  function advance() {
    index++;
    if (index >= lines.length) {
      overlay.onclick = null;
      document.removeEventListener('keydown', onKey);
      overlay.classList.add('hidden');
      advanceStage();
      return;
    }
    renderLine();
  }

  function onKey(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      advance();
    }
  }

  overlay.onclick = advance;
  document.addEventListener('keydown', onKey);
  renderLine();
  overlay.classList.remove('hidden');
}

function showChoiceEvent(event) {
  const options = event.options ?? [];
  if (options.length === 0) {
    advanceStage();
    return;
  }

  const overlay = document.getElementById('choice-overlay');
  const title = document.getElementById('choice-title');
  const prompt = document.getElementById('choice-prompt');
  const optionsEl = document.getElementById('choice-options');

  title.textContent = event.title ?? '';
  prompt.textContent = event.prompt ?? event.description ?? '¿Qué quieres hacer?';
  optionsEl.innerHTML = '';

  options.forEach(option => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = option.label;
    btn.onclick = () => {
      run.choices[event.id ?? event.title] = option.id;
      overlay.classList.add('hidden');
      advanceStage();
    };
    optionsEl.appendChild(btn);
  });

  overlay.classList.remove('hidden');
}

function advanceStage() {
  const event = currentEvent;
  const type = event?.type;

  if (type === 'campamento') {
    run.campamentos++;
    run.fightsSinceCamp = 0;
  } else if (type === 'enfrentamiento') {
    run.enfrentamientos++;
    run.fightsSinceCamp++;
  }

  if (event?.id) run.fired.add(event.id);
  run.stage++;

  if (event?.final) {
    showEnding(event);
    return;
  }

  showScreen('map');
  renderMap();
}

function handleVictory() {
  const fallen = [];
  state.teams.A.members.forEach((m, i) => {
    if (m && m.currentHp <= 0) fallen.push(i);
  });

  if (fallen.includes(protagonistSlot)) {
    const protagonistName = characters[selectedStory.protagonist ?? 0].name;
    showOverlay(`💀 <strong>${protagonistName}</strong> ha caído en batalla.<br>La historia termina aquí.`, 'Volver al Menú', () => {
      clearGame(selectedStory.id);
      selectedStory = null;
      resetRun();
      playerTeam = null;
      clearSavedTeamHp();
      clearSavedTeamLevels();
      clearSavedTeamSkills();
      renderMenu();
      showScreen('menu');
    });
    return;
  }

  saveTeamState();

  if (fallen.length > 0) {
    const names = fallen.map(i => characters[playerTeam[i]].name);
    showOverlay(
      names.map(n => `☠️ <strong>${n}</strong> ha caído en batalla.`).join('<br>'),
      'Continuar',
      () => {
        fallen.forEach(i => {
          playerTeam[i] = -1;
          clearSavedSlot(i);
        });
        advanceStage();
      }
    );
    return;
  }

  advanceStage();
}

function showEnding(event) {
  clearGame(selectedStory.id);
  showScreen('map');

  const title = document.getElementById('map-title');
  title.textContent = selectedStory.title;

  const header = document.getElementById('map-header');
  header.textContent = 'Final';

  const events = document.getElementById('map-events');
  events.innerHTML = `
    <div class="event-card">
      <div class="event-card-title">${event.title}</div>
      <div class="event-card-desc">${event.description}</div>
    </div>
    <p style="color:#ccc; text-align:center; padding:1rem;">La historia ha llegado a su fin.</p>
  `;

  const menuArea = document.getElementById('map-menu-area');
  menuArea.innerHTML = '';
  const menuBtn = document.createElement('button');
  menuBtn.className = 'map-menu-btn';
  menuBtn.textContent = 'Volver al Menú';
  menuBtn.addEventListener('click', () => {
    selectedStory = null;
    resetRun();
    showScreen('menu');
  });
  menuArea.appendChild(menuBtn);
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
