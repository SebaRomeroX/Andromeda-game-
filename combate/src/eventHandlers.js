import state, { initState, restoreTeamHp, clearSavedSlot } from './state.js';
import { ROLE_BY_INDEX } from './models.js';
import { startMercaderPhase, startLevelUpPhase, startSkillUpgrades, startLearnPhase } from './upgrades.js';
import { clearGame } from './save.js';
import characters from '../data/characters.js';
import { stopMusic, playChill } from './music.js';
import { getEventOrbs, grantOrbs, formatOrbGainHtml } from './gameFlow.js';
import { logHtml } from './log.js';
import { eligibleRecruitPool } from './eventGenerator.js';

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

    // Cuatro fases del campamento, en orden:
    //  0) Mercader (1 orbe dorado por 1 orbe de otro tipo)
    //  1) Nivelación (1 orbe verde por nivel)
    //  2) Mejora de habilidades (1 orbe rojo por mejora)
    //  3) Aprendizaje de habilidades nuevas (1 orbe azul por habilidad)
    // Cada fase se omite sin interfaz si no tienes su orbe o no hay
    // nada que hacer en ella.
    startMercaderPhase(() =>
      startLevelUpPhase(alive, () =>
        startSkillUpgrades(alive, () =>
          startLearnPhase(alive, advanceStageCb))));
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

/** Tarjeta de aspirante para los eventos de reclutamiento (modo infinito
 * y oferta del camino). `note` agrega la linea de aviso de reemplazo y
 * `onClick` el handler de la tarjeta. Devuelve null si el indice no existe. */
function buildRecruitCard(charIdx, { note = null, onClick } = {}) {
  const char = characters[charIdx];
  if (!char) return null;

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

  if (note != null) {
    const noteEl = document.createElement('div');
    noteEl.style.cssText = 'font-size:0.65rem;color:#e74c3c;margin-top:2px;';
    noteEl.textContent = note;
    info.appendChild(noteEl);
  }

  slot.appendChild(roleLabel);
  slot.appendChild(img);
  slot.appendChild(info);

  if (onClick) slot.addEventListener('click', onClick);
  return slot;
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

    const teamSlot = ROLE_BY_INDEX.indexOf(char.role);
    const occupied = state.session.playerTeam[teamSlot] !== -1;
    const note = occupied
      ? `Reemplazará a ${characters[state.session.playerTeam[teamSlot]]?.name ?? 'desconocido'}`
      : null;

    const card = buildRecruitCard(charIdx, {
      note,
      onClick: () => {
        state.session.playerTeam[teamSlot] = charIdx;
        clearSavedSlot(teamSlot);
        state.run.recruitOffer = null;
        button.style.display = '';
        optionsDiv.remove();
        overlay.classList.add('hidden');
        playChill();
        advanceStageCb();
      }
    });
    if (card) optionsDiv.appendChild(card);
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

// ── Reclutamiento en el camino ('reclutamiento_oferta') ──
// Dos aspirantes al azar con la ranura de su rol libre (eligibleRecruitPool,
// el sorteo descarta la entrada si hay menos de 2). El jugador elige uno o
// sigue de largo; al elegir, el aspirante pide una demanda al azar
// (riqueza / combate / prueba de confianza) y SIEMPRE se puede rechazar y
// marcharse sin consecuencias. Union inline en riqueza y preguntas; el
// combate encadena a `event.branches[0]` y cierra 'reclutamiento_final'.

/** Une al aspirante a la ranura de su rol (definitivo). Devuelve el
 * mensaje del resultado; jamas sobrescribe una ranura ocupada. */
function joinRecruit(charIdx) {
  const char = characters[charIdx];
  if (!char) return { ok: false, message: 'El aspirante ya no esta en el camino.' };
  const slot = ROLE_BY_INDEX.indexOf(char.role);
  if (slot < 0 || state.session.playerTeam[slot] !== -1) {
    return { ok: false, message: `${char.name} quiere unirse, pero su puesto ya esta ocupado.` };
  }
  state.session.playerTeam[slot] = charIdx;
  clearSavedSlot(slot);
  playChill();
  return { ok: true, char, message: `✨ <strong>${char.name}</strong> se ha unido al grupo.` };
}

export function showRecruitOfferEvent(event, advanceStageCb, rng = Math.random) {
  const pool = eligibleRecruitPool(state.session.selectedStory, state.session.playerTeam);
  if (pool.length < 2) {
    // Defensa: el sorteo no deberia elegir la entrada en este estado.
    advanceStageCb();
    return;
  }

  // Dos candidatos distintos: el segundo usa un mapeo biyectivo que
  // salta al indice del primero (un rng constante no puede trabarse).
  const first = Math.min(pool.length - 1, Math.max(0, Math.floor(rng() * pool.length)));
  let skip = Math.min(pool.length - 2, Math.max(0, Math.floor(rng() * (pool.length - 1))));
  if (skip >= first) skip += 1;
  const picks = [pool[first], pool[skip]];

  const overlay = document.getElementById('camp-overlay');
  const message = document.getElementById('camp-message');
  const button = document.getElementById('camp-continue');
  const levelup = document.getElementById('camp-levelup');
  const titleEl = document.getElementById('camp-title');

  const stale = overlay.querySelector('.infinite-recruit-options');
  if (stale) stale.remove();

  titleEl.textContent = event.title ?? 'Reclutamiento';
  message.textContent = event.prompt ?? event.description ?? '';
  levelup.classList.add('hidden');
  button.style.display = 'none';

  const optionsDiv = document.createElement('div');
  optionsDiv.className = 'infinite-recruit-options';
  optionsDiv.style.cssText = 'display:flex;gap:1rem;justify-content:center;margin-top:1rem;flex-wrap:wrap;';

  const closeOffer = () => {
    button.style.display = '';
    optionsDiv.remove();
    overlay.classList.add('hidden');
  };

  picks.forEach(charIdx => {
    const card = buildRecruitCard(charIdx, {
      onClick: () => {
        closeOffer();
        state.run.pendingRecruit = { charIdx };
        showRecruitDemand(event, charIdx, advanceStageCb, rng);
      }
    });
    if (card) optionsDiv.appendChild(card);
  });

  const rejectBtn = document.createElement('button');
  rejectBtn.textContent = 'Seguir de largo';
  rejectBtn.style.cssText = 'margin-top:0.75rem;padding:0.5rem 1.5rem;font-size:0.9rem;background:#444;color:#ccc;border:1px solid #666;border-radius:8px;cursor:pointer;';
  rejectBtn.addEventListener('click', () => {
    closeOffer();
    state.run.pendingRecruit = null;
    showEndModal({
      message: event.refuseText ?? 'Sigues tu camino solo.',
      buttonText: 'Continuar',
      onClick: () => advanceStageCb()
    });
  });
  optionsDiv.appendChild(rejectBtn);

  const content = overlay.querySelector('.overlay-content');
  content.insertBefore(optionsDiv, message);
  overlay.classList.remove('hidden');
}

/** Pantalla de demanda del aspirante elegido: texto + aceptar / rechazar
 * (rechazar siempre esta disponible y cierra el evento sin union). */
function showRecruitDemand(event, charIdx, advanceStageCb, rng) {
  const char = characters[charIdx];
  const kinds = ['wealth', 'combat', 'questions'];
  const kind = kinds[Math.min(kinds.length - 1, Math.max(0, Math.floor(rng() * kinds.length)))];
  const demand = event.demands?.[kind] ?? {};
  state.run.choices[event.id ?? event.title] = kind;

  const overlay = document.getElementById('choice-overlay');
  const title = document.getElementById('choice-title');
  const prompt = document.getElementById('choice-prompt');
  const optionsEl = document.getElementById('choice-options');

  function finish(message) {
    state.run.pendingRecruit = null;
    overlay.classList.add('hidden');
    showEndModal({ message, buttonText: 'Continuar', onClick: () => advanceStageCb() });
  }

  function renderDemand(onAccept) {
    title.textContent = event.title ?? 'Reclutamiento';
    prompt.textContent = demand.text ?? `${char?.name ?? 'El aspirante'} te pide algo para unirse a tu grupo.`;
    optionsEl.innerHTML = '';

    const acceptBtn = document.createElement('button');
    acceptBtn.className = 'choice-btn';
    acceptBtn.textContent = demand.accept ?? 'Aceptar';
    if (kind === 'wealth' && (state.run.orbes?.wealth ?? 0) < 1) {
      // Sin orbes de riqueza no se puede pagar: solo queda rechazar.
      acceptBtn.disabled = true;
    } else {
      acceptBtn.onclick = onAccept;
    }

    const refuseBtn = document.createElement('button');
    refuseBtn.className = 'choice-btn';
    refuseBtn.textContent = demand.refuse ?? 'Rechazar y seguir de camino';
    refuseBtn.onclick = () => finish(event.refuseText ?? 'Sigues tu camino solo.');

    optionsEl.appendChild(acceptBtn);
    optionsEl.appendChild(refuseBtn);
    overlay.classList.remove('hidden');
  }

  if (kind === 'wealth') {
    renderDemand(() => {
      state.run.orbes = { ...state.run.orbes, wealth: (state.run.orbes?.wealth ?? 0) - 1 };
      finish(joinRecruit(charIdx).message);
    });
    return;
  }

  if (kind === 'combat') {
    renderDemand(() => {
      const fightId = event.branches?.[0];
      if (fightId == null) {
        console.warn('[reclutamiento] falta "branches" con el nodo de combate; se cierra la oferta.');
        finish(event.refuseText ?? 'Sigues tu camino solo.');
        return;
      }
      // pendingRecruit se conserva: 'reclutamiento_final' une al vencer.
      overlay.classList.add('hidden');
      state.run.currentNodeId = fightId;
      advanceStageCb();
    });
    return;
  }

  renderDemand(() => startTrustTrial());

  function startTrustTrial() {
    const pool = Array.isArray(event.questions) ? event.questions : [];
    if (pool.length < 3) {
      console.warn('[reclutamiento] la prueba de confianza necesita al menos 3 "questions"; se cierra la oferta.');
      finish(event.failText ?? 'La prueba no puede celebrarse.');
      return;
    }

    // Fisher-Yates con rng acotado a [0, i]: un rng constante no puede
    // trabar el sorteo de las 3 preguntas distintas.
    const order = pool.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.min(i, Math.max(0, Math.floor(rng() * (i + 1))));
      [order[i], order[j]] = [order[j], order[i]];
    }
    const picked = order.slice(0, 3).map(i => pool[i]);

    const misses = [];
    let correct = 0;

    const ask = (n) => {
      const q = picked[n];
      const options = q?.options ?? [];
      if (q?.question == null || options.length === 0) {
        console.warn('[reclutamiento] pregunta de confianza mal formada; se cierra la oferta.');
        finish(event.failText ?? 'La prueba se interrumpe.');
        return;
      }
      title.textContent = `${event.title ?? 'Prueba de confianza'} (${n + 1}/3)`;
      prompt.textContent = q.question;
      optionsEl.innerHTML = '';
      options.forEach(option => {
        const btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.textContent = option.label;
        btn.onclick = () => {
          if (option.id === q.answer) {
            correct++;
          } else {
            misses.push({
              question: q.question,
              answer: options.find(o => o.id === q.answer)?.label ?? '???'
            });
          }
          if (n + 1 < 3) ask(n + 1);
          else verdict();
        };
        optionsEl.appendChild(btn);
      });
    };

    const verdict = () => {
      if (correct === picked.length) {
        finish(joinRecruit(charIdx).message);
        return;
      }
      const list = misses.map(m => `• ${m.question} → <strong>${m.answer}</strong>`).join('<br>');
      finish(`${event.failText ?? 'La prueba ha fallado.'}<br><br><strong>Fallaste:</strong><br>${list}`);
    };

    ask(0);
  }
}

// 'reclutamiento_final': cierra la rama de combate de la oferta uniendo al
// aspirante elegido (pendingRecruit). Sin pendiente (p.ej. carga de una
// partida antigua) avanza sin union.
export function showRecruitJoinEvent(event, advanceStageCb) {
  const pending = state.run.pendingRecruit;
  if (pending?.charIdx == null) {
    console.warn('[reclutamiento] "reclutamiento_final" sin pendingRecruit; se omite la union.');
    advanceStageCb();
    return;
  }
  const join = joinRecruit(pending.charIdx);
  state.run.pendingRecruit = null;
  const message = join.ok
    ? [event.description, join.message].filter(Boolean).join('<br><br>')
    : join.message;
  showEndModal({ title: event.title ?? '', message, buttonText: 'Continuar', onClick: () => advanceStageCb() });
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

// Muestra evento de acertijo: pregunta + opciones de respuesta (una sola
// correcta, identificada por `answer` = id de la opcion). Dos formas:
//   - clasica: `question`/`options`/`answer` en el propio nodo;
//   - pool: `questions` = lista de { question, options, answer,
//     explanation? } de la que se elige una al azar al renderizar
//     (`rng` inyectable, por defecto Math.random).
// El premio solo se otorga si se acierta a la primera; un fallo cierra
// el evento sin recompensa (one shot, sin reintentos) y, si la pregunta
// trae `explanation`, el sabio explica el por que en el modal. Ambos
// casos avanzan de etapa.
export function showPuzzleEvent(event, advanceStageCb, rng = Math.random) {
  const pooled = Array.isArray(event.questions) && event.questions.length > 0;
  const q = pooled
    ? event.questions[Math.min(event.questions.length - 1, Math.max(0, Math.floor(rng() * event.questions.length)))]
    : { question: event.question, options: event.options ?? [], answer: event.answer, explanation: event.explanation };
  const options = q?.options ?? [];

  if (q?.question == null || options.length === 0) {
    advanceStageCb();
    return;
  }

  const overlay = document.getElementById('choice-overlay');
  const title = document.getElementById('choice-title');
  const prompt = document.getElementById('choice-prompt');
  const optionsEl = document.getElementById('choice-options');

  const answerLabel = options.find(o => o.id === q.answer)?.label ?? '???';

  function finish(message) {
    overlay.classList.add('hidden');
    showEndModal({ message, buttonText: 'Continuar', onClick: () => advanceStageCb() });
  }

  title.textContent = event.title ?? 'Acertijo';
  prompt.textContent = q.question;
  optionsEl.innerHTML = '';

  options.forEach(option => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = option.label;
    btn.onclick = () => {
      if (option.id === q.answer) {
        const gained = getEventOrbs(event, rng);
        grantOrbs(gained);
        const gainText = formatOrbGainHtml(gained);
        logHtml(`${gainText} — Recompensa del acertijo`);
        finish(`<strong>Bien dicho, ten, llevate esto. Espero que le saquen provecho</strong><br><br><strong>Recompensa:</strong><br>${gainText}`);
      } else {
        // El sabio explica el por que (si la pregunta lo trae); si no, solo
        // revela la respuesta. Sin 'Incorrecto' ni 'No hay recompensa'.
        finish(q.explanation ?? `La respuesta correcta era: <strong>${answerLabel}</strong>.`);
      }
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
