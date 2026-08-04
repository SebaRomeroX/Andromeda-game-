import state, { initState, setGameEndCallback, saveTeamState, restoreTeamHp, clearSavedTeamHp, clearSavedTeamLevels, clearSavedTeamSkills, saveTeamLevels, allDead, resetTeam, clearSavedSlot } from './state.js';
import { getLevelStats, ROLE_BY_INDEX } from './models.js';
import { startTurn, onTargetClick } from './combat.js';
import { renderTeams, renderHP, renderStatus, renderBuffs, renderActions, clearTargets, renderTeamsHeader } from './renderer.js';
import { log, clearLog } from './log.js';
import { startSkillUpgrades } from './upgrades.js';
import characters from '../data/characters.js';
import stories from '../data/stories.js';
import { generateEnemyTeam } from './enemyGenerator.js';

let selectedStory = null;
let currentStage = 0;
let playerTeam = null;
let protagonistSlot = 0;

function showOverlay(message, buttonText, onClick) {
  const overlay = document.getElementById('camp-overlay');
  const msg = document.getElementById('camp-message');
  const btn = document.getElementById('camp-continue');
  msg.innerHTML = message;
  btn.textContent = buttonText;
  btn.onclick = () => { overlay.classList.add('hidden'); if (onClick) onClick(); };
  overlay.classList.remove('hidden');
}

function buildTeamAData() {
  return (playerTeam ?? []).map(idx => idx >= 0 ? characters[idx] : null);
}

function validateStoryCast(story) {
  const generic = new Set(story.genericEnemies ?? []);
  const narrative = new Set(story.narrativeEnemies ?? []);
  const allies = new Set(story.allies ?? []);

  const warn = (msg) => console.warn(`[historia "${story.title}"] ${msg}`);

  story.events.forEach((event, i) => {
    if (event.type === 'reclutamiento') {
      if (event.character != null && !allies.has(event.character)) {
        warn(`Evento ${i + 1}: ${characters[event.character]?.name ?? event.character} es reclutable pero no está en allies.`);
      }
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
    card.addEventListener('click', () => {
      selectedStory = story;
      validateStoryCast(story);
      currentStage = 0;
      playerTeam = [...story.teamA];
      protagonistSlot = ROLE_BY_INDEX.indexOf(characters[story.protagonist ?? 0].role);
      resetTeam();
      clearSavedTeamHp();
      clearSavedTeamLevels();
      clearSavedTeamSkills();
      renderMap();
    });
    list.appendChild(card);
  });
}

function renderMap() {
  showScreen('map');

  const title = document.getElementById('map-title');
  title.textContent = selectedStory.title;

  const events = document.getElementById('map-events');
  events.innerHTML = '';

  if (selectedStory.sequential) {
    const header = document.getElementById('map-header');
    header.textContent = `Paso ${currentStage + 1} de ${selectedStory.events.length}`;

    const event = selectedStory.events[currentStage];
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
    currentStage = 0;
    showScreen('menu');
  });
  menuArea.appendChild(menuBtn);
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
        if (selectedStory.sequential) {
          currentStage++;
          if (currentStage >= selectedStory.events.length) {
            showStoryComplete();
          } else {
            renderMap();
          }
        }
      };
      startSkillUpgrades(leveledMembers, finishCamp);
    };
  };
}

function startCombat(event) {
  if (event.type === 'campamento') {
    showCampEvent(event);
    return;
  }

  if (event.type === 'reclutamiento') {
    showRecruitEvent(event);
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
      stage: currentStage,
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
    if (selectedStory.sequential) {
      currentStage = 0;
      clearSavedTeamHp();
    }
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

function advanceStage() {
  if (selectedStory.sequential) {
    currentStage++;
    if (currentStage >= selectedStory.events.length) {
      showStoryComplete();
      return;
    }
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
      selectedStory = null;
      currentStage = 0;
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

function showStoryComplete() {
  showScreen('map');

  const title = document.getElementById('map-title');
  title.textContent = selectedStory.title;

  const header = document.getElementById('map-header');
  header.textContent = '¡Historia completada!';

  const events = document.getElementById('map-events');
  events.innerHTML = '<p style="color:#ccc; text-align:center; padding:2rem;">Has superado todos los desafíos de la travesía.</p>';

  const menuArea = document.getElementById('map-menu-area');
  menuArea.innerHTML = '';
  const menuBtn = document.createElement('button');
  menuBtn.className = 'map-menu-btn';
  menuBtn.textContent = 'Volver al Menú';
  menuBtn.addEventListener('click', () => {
    selectedStory = null;
    currentStage = 0;
    showScreen('menu');
  });
  menuArea.appendChild(menuBtn);
}

renderMenu();
showScreen('menu');
