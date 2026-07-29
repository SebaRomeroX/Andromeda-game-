import state, { initState, setGameEndCallback } from './state.js';
import { startTurn, onTargetClick } from './combat.js';
import { renderTeams, renderHP, renderStatus, renderBuffs, renderActions, clearTargets, renderTeamsHeader } from './renderer.js';
import { log, clearLog } from './log.js';
import characters from '../data/characters.js';
import stories from '../data/stories.js';

let selectedStory = null;

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
      renderMap();
    });
    list.appendChild(card);
  });
}

function renderMap() {
  showScreen('map');

  const title = document.getElementById('map-title');
  title.textContent = selectedStory.title;

  const header = document.getElementById('map-header');
  header.textContent = 'Elige un evento';

  const events = document.getElementById('map-events');
  events.innerHTML = '';

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

  const menuArea = document.getElementById('map-menu-area');
  menuArea.innerHTML = '';
  const menuBtn = document.createElement('button');
  menuBtn.className = 'map-menu-btn';
  menuBtn.textContent = 'Volver al Menú';
  menuBtn.addEventListener('click', () => {
    selectedStory = null;
    showScreen('menu');
  });
  menuArea.appendChild(menuBtn);
}

function startCombat(event) {
  showScreen('combat');

  const teamAData = selectedStory.teamA.map(idx => idx >= 0 ? characters[idx] : null);
  const teamBData = event.enemyTeam.map(idx => characters[idx]);

  setGameEndCallback(() => {
    showScreen('map');
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

renderMenu();
showScreen('menu');
