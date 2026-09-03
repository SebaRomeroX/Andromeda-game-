import state, { initState, saveTeamLevels, restoreTeamHp, clearSavedSlot } from './state.js';
import { getLevelStats, ROLE_BY_INDEX } from './models.js';
import { startSkillUpgrades } from './upgrades.js';
import { clearGame } from './save.js';
import characters from '../data/characters.js';

function buildTeamAData() {
  return (state.session.playerTeam ?? []).map(idx => idx >= 0 ? characters[idx] : null);
}

function showOverlay(message, buttonText, onClick) {
  const overlay = document.getElementById('camp-overlay');
  const msg = document.getElementById('camp-message');
  const btn = document.getElementById('camp-continue');
  const levelup = document.getElementById('camp-levelup');
  const title = document.getElementById('camp-title');
  msg.innerHTML = message;
  btn.textContent = buttonText;
  btn.onclick = () => { overlay.classList.add('hidden'); if (onClick) onClick(); };
  levelup.classList.add('hidden');
  title.textContent = '';
  overlay.classList.remove('hidden');
}

function showScreen(name) {
  document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
  const screen = document.getElementById(`screen-${name}`);
  if (screen) screen.classList.add('active');
}

// Muestra evento de campamento con su overlay
export function showCampEvent(event, advanceStageCb) {
  const overlay = document.getElementById('camp-overlay');
  const message = document.getElementById('camp-message');
  const button = document.getElementById('camp-continue');
  const levelupEl = document.getElementById('camp-levelup');
  const levelupImg = document.getElementById('camp-levelup-img');
  const levelupStats = document.getElementById('camp-levelup-stats');
  const titleEl = document.getElementById('camp-title');

  const teamAData = buildTeamAData();
  initState(teamAData, []);

  message.textContent = event.description;
  button.textContent = 'Descansar';
  levelupEl.classList.add('hidden');
  titleEl.textContent = '';
  overlay.classList.remove('hidden');

  button.onclick = () => {
    const leveledMembers = [];
    state.combat.teams.A.members.forEach(m => {
      if (m && m.currentHp > 0) {
        const oldLevel = m.level;
        const oldHp = m.hp;
        const oldEvasion = m.evasion;
        m.level++;
        const st = getLevelStats(m);
        m.hp = st.hp;
        m.evasion = st.evasion;
        leveledMembers.push({ member: m, oldLevel, oldHp, oldEvasion });
      }
    });
    saveTeamLevels();
    restoreTeamHp();

    if (leveledMembers.length === 0) {
      overlay.classList.add('hidden');
      advanceStageCb();
      return;
    }

    let idx = 0;

    function showLevelUp() {
      const { member, oldLevel, oldHp, oldEvasion } = leveledMembers[idx];
      message.textContent = '';
      titleEl.textContent = 'Personaje sube de nivel';
      levelupImg.src = member.image;
      levelupImg.alt = member.name;
      levelupStats.innerHTML = `
        <div class="stat-row">
          <span class="stat-label">Nivel:</span>
          <span class="stat-old">${oldLevel}</span>
          <span class="stat-arrow">\u2192</span>
          <span class="stat-new">${member.level}</span>
          <span class="stat-up">(+${member.level - oldLevel})</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Salud:</span>
          <span class="stat-old">${oldHp}</span>
          <span class="stat-arrow">\u2192</span>
          <span class="stat-new">${member.hp}</span>
          <span class="stat-up">(+${member.hp - oldHp})</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Evasion:</span>
          <span class="stat-old">${oldEvasion}</span>
          <span class="stat-arrow">\u2192</span>
          <span class="stat-new">${member.evasion}</span>
          <span class="stat-up">(+${member.evasion - oldEvasion})</span>
        </div>
      `;
      levelupEl.classList.remove('hidden');
      button.textContent = 'Continuar';
      button.onclick = () => {
        levelupEl.classList.add('hidden');
        startSkillUpgrades([member], () => {
          idx++;
          if (idx < leveledMembers.length) {
            showLevelUp();
          } else {
            overlay.classList.add('hidden');
            advanceStageCb();
          }
        });
      };
    }

    showLevelUp();
  };
}

// Muestra evento de reclutamiento
export function showRecruitEvent(event, advanceStageCb) {
  const char = characters[event.character];
  const slot = ROLE_BY_INDEX.indexOf(char.role);

  if (state.session.playerTeam[slot] !== -1) {
    showOverlay(`${char.name} quiere unirse, pero su puesto ya está ocupado.`, 'Continuar', () => {
      advanceStageCb();
    });
    return;
  }

  state.session.playerTeam[slot] = event.character;
  clearSavedSlot(slot);
  showOverlay(`✨ <strong>${char.name}</strong> se ha unido al grupo.`, 'Continuar', () => {
    advanceStageCb();
  });
}

// Muestra evento de dialogo (secuencia de lineas)
export function showDialogueEvent(event, advanceStageCb) {
  const lines = event.dialog ?? [];
  if (lines.length === 0) {
    advanceStageCb();
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
      advanceStageCb();
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

// Muestra evento de eleccion (botones de opcion)
export function showChoiceEvent(event, advanceStageCb) {
  const options = event.options ?? [];
  if (options.length === 0) {
    advanceStageCb();
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
      state.run.choices[event.id ?? event.title] = option.id;
      overlay.classList.add('hidden');
      advanceStageCb();
    };
    optionsEl.appendChild(btn);
  });

  overlay.classList.remove('hidden');
}

// Muestra ending
export function showEnding(event, selectedStory, resetRunStateCb) {
  clearGame(selectedStory.id);
  showScreen('map');

  const title = document.getElementById('map-title');
  title.textContent = selectedStory.title;

  const header = document.getElementById('map-header');
  header.textContent = 'Final';

  const eventsEl = document.getElementById('map-events');
  eventsEl.innerHTML = `
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
    state.session.selectedStory = null;
    resetRunStateCb();
    showScreen('menu');
  });
  menuArea.appendChild(menuBtn);
}
