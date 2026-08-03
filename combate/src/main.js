import state, { initState, setGameEndCallback, saveTeamState, restoreTeamHp, clearSavedTeamHp, clearSavedTeamLevels, clearSavedTeamSkills, saveTeamLevels, allDead, resetTeam } from './state.js';
import { getLevelStats } from './models.js';
import { startTurn, onTargetClick } from './combat.js';
import { renderTeams, renderHP, renderStatus, renderBuffs, renderActions, clearTargets, renderTeamsHeader } from './renderer.js';
import { log, clearLog } from './log.js';
import { startSkillUpgrades } from './upgrades.js';
import characters from '../data/characters.js';
import stories from '../data/stories.js';

let selectedStory = null;
let currentStage = 0;

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
      currentStage = 0;
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

  const teamAData = selectedStory.teamA.map(idx => idx >= 0 ? characters[idx] : null);
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

  showScreen('combat');

  const teamAData = selectedStory.teamA.map(idx => idx >= 0 ? characters[idx] : null);
  const teamBData = event.enemyTeam.map(idx => characters[idx]);

  setGameEndCallback(() => {
    if (selectedStory.sequential) {
      if (allDead('B')) {
        currentStage++;
        saveTeamState();
        if (currentStage >= selectedStory.events.length) {
          showStoryComplete();
          return;
        }
      } else {
        currentStage = 0;
        clearSavedTeamHp();
      }
    } else {
      saveTeamState();
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
