import state, { initState, restoreTeamHp, clearSavedSlot } from './state.js';
import { ROLE_BY_INDEX } from './models.js';
import { startLevelUpPhase, startSkillUpgrades, startLearnPhase } from './upgrades.js';
import { clearGame } from './save.js';
import characters from '../data/characters.js';
import { stopMusic, playChill } from './music.js';

function buildTeamAData() {
  return (state.session.playerTeam ?? []).map(idx => idx >= 0 ? characters[idx] : null);
}

/**
 * Modal generico (#camp-overlay): titulo opcional + mensaje + un boton.
 * Lo usan victoria/derrota de combate, bajas de aliados y avisos de reclutamiento.
 */
export function showEndModal({ title = '', message, buttonText, onClick }) {
  const overlay = document.getElementById('camp-overlay');
  const msg = document.getElementById('camp-message');
  const btn = document.getElementById('camp-continue');
  const levelup = document.getElementById('camp-levelup');
  const titleEl = document.getElementById('camp-title');
  const staleRecruit = overlay.querySelector('.infinite-recruit-options');
  if (staleRecruit) staleRecruit.remove();
  titleEl.textContent = title;
  msg.innerHTML = message;
  btn.textContent = buttonText;
  btn.onclick = () => { overlay.classList.add('hidden'); if (onClick) onClick(); };
  levelup.classList.add('hidden');
  overlay.classList.remove('hidden');
}

function showOverlay(message, buttonText, onClick) {
  showEndModal({ message, buttonText, onClick });
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
  const titleEl = document.getElementById('camp-title');

  const existingRecruit = overlay.querySelector('.infinite-recruit-options');
  if (existingRecruit) existingRecruit.remove();

  const teamAData = buildTeamAData();
  initState(teamAData, []);

  message.innerHTML = event.description;
  button.textContent = 'Descansar';
  titleEl.textContent = '';
  overlay.classList.remove('hidden');

  button.onclick = () => {
    // Descansar cura a todo el equipo (gratuito). Los niveles ya no son
    // automáticos: se gastan en la fase de nivelación (orbes verdes).
    restoreTeamHp();

    const alive = state.combat.teams.A.members.filter(m => m && m.currentHp > 0);
    overlay.classList.add('hidden');

    if (alive.length === 0) {
      advanceStageCb();
      return;
    }

    // Tres fases del campamento, en orden:
    //  1) Nivelación (1 orbe verde por nivel)
    //  2) Mejora de habilidades (1 orbe rojo por mejora)
    //  3) Aprendizaje de habilidades nuevas (1 orbe azul por habilidad)
    // Cada fase se omite sin interfaz si no tienes su orbe o no hay
    // nada que hacer en ella.
    startLevelUpPhase(alive, () =>
      startSkillUpgrades(alive, () =>
        startLearnPhase(alive, advanceStageCb)));
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

// Muestra evento de reclutamiento para modo infinito (2 opciones)
export function showInfiniteRecruitEvent(event, advanceStageCb) {
  const offer = event.recruitOffer ?? state.run.recruitOffer;
  if (!offer || offer.length < 2) {
    advanceStageCb();
    return;
  }

  const overlay = document.getElementById('camp-overlay');
  const message = document.getElementById('camp-message');
  const button = document.getElementById('camp-continue');
  const levelup = document.getElementById('camp-levelup');
  const titleEl = document.getElementById('camp-title');

  titleEl.textContent = 'Reclutamiento';
  message.textContent = 'Elige a un nuevo miembro para tu equipo.';
  levelup.classList.add('hidden');
  button.style.display = 'none';

  const existingContent = overlay.querySelector('.infinite-recruit-options');
  if (existingContent) existingContent.remove();

  const optionsDiv = document.createElement('div');
  optionsDiv.className = 'infinite-recruit-options';
  optionsDiv.style.cssText = 'display:flex;gap:1rem;justify-content:center;margin-top:1rem;flex-wrap:wrap;';

  offer.forEach(charIdx => {
    const char = characters[charIdx];
    if (!char) return;

    const slot = document.createElement('div');
    slot.className = 'member-slot recruit-selectable';

    const roleLabel = document.createElement('div');
    roleLabel.className = 'recruit-role-label';
    roleLabel.textContent = char.role;

    const img = document.createElement('img');
    img.src = char.image;
    img.alt = char.name;
    img.onerror = () => { img.style.display = 'none'; };

    const info = document.createElement('div');
    info.className = 'member-info';

    const nameEl = document.createElement('div');
    nameEl.className = 'member-name';
    nameEl.textContent = char.name;

    info.appendChild(nameEl);

    const teamSlot = ROLE_BY_INDEX.indexOf(char.role);
    const occupied = state.session.playerTeam[teamSlot] !== -1;
    if (occupied) {
      const current = characters[state.session.playerTeam[teamSlot]];
      const replaceNote = document.createElement('div');
      replaceNote.style.cssText = 'font-size:0.65rem;color:#e74c3c;margin-top:2px;';
      replaceNote.textContent = `Reemplazará a ${current?.name ?? 'desconocido'}`;
      info.appendChild(replaceNote);
    }

    slot.append(roleLabel, img, info);

    slot.addEventListener('click', () => {
      state.session.playerTeam[teamSlot] = charIdx;
      clearSavedSlot(teamSlot);
      state.run.recruitOffer = null;
      button.style.display = '';
      optionsDiv.remove();
      overlay.classList.add('hidden');
      playChill();
      advanceStageCb();
    });

    optionsDiv.appendChild(slot);
  });

  const bothOccupied = offer.every(charIdx => {
    const char = characters[charIdx];
    const teamSlot = ROLE_BY_INDEX.indexOf(char.role);
    return state.session.playerTeam[teamSlot] !== -1;
  });

  if (bothOccupied) {
    const rejectBtn = document.createElement('button');
    rejectBtn.textContent = 'Rechazar';
    rejectBtn.style.cssText = 'margin-top:0.75rem;padding:0.5rem 1.5rem;font-size:0.9rem;background:#444;color:#ccc;border:1px solid #666;border-radius:8px;cursor:pointer;';
    rejectBtn.addEventListener('click', () => {
      state.run.recruitOffer = null;
      button.style.display = '';
      optionsDiv.remove();
      overlay.classList.add('hidden');
      playChill();
      advanceStageCb();
    });
    optionsDiv.appendChild(rejectBtn);
  }

  const content = overlay.querySelector('.overlay-content');
  content.insertBefore(optionsDiv, message);
  overlay.classList.remove('hidden');
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
      if (option.next) state.run.currentNodeId = option.next;
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
    <p style="color:#ccc; text-align:center; padding:1rem;">La historia ha llegado a su fin.</p>
  `;

  const menuArea = document.createElement('div');
  menuArea.id = 'map-menu-area';
  const menuBtn = document.createElement('button');
  menuBtn.className = 'map-menu-btn';
  menuBtn.textContent = 'Volver al Menú';
  menuBtn.addEventListener('click', () => {
    state.session.selectedStory = null;
    resetRunStateCb();
    stopMusic();
    showScreen('menu');
  });
  menuArea.appendChild(menuBtn);
  eventsEl.appendChild(menuArea);
}
