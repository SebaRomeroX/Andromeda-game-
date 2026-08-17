const root = document.documentElement;

function isMobile() {
  if (matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0) return true;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

function updateOrientationClass() {
  root.classList.toggle('portrait', matchMedia('(orientation: portrait)').matches);
}

const fsDoc = {
  get enabled() {
    return !!(document.fullscreenEnabled || document.webkitFullscreenEnabled);
  },
  get element() {
    return document.fullscreenElement || document.webkitFullscreenElement;
  },
  request() {
    const el = document.documentElement;
    if (el.requestFullscreen) return el.requestFullscreen();
    if (el.webkitRequestFullscreen) return el.webkitRequestFullscreen();
    return Promise.reject(new Error('Fullscreen API no soportado'));
  },
  exit() {
    if (document.exitFullscreen) return document.exitFullscreen();
    if (document.webkitExitFullscreen) return document.webkitExitFullscreen();
    return Promise.reject(new Error('Fullscreen API no soportado'));
  }
};

async function lockLandscape() {
  const orientation = screen.orientation || screen.webkitOrientation;
  if (!orientation || !orientation.lock) return;
  try {
    await orientation.lock('landscape');
  } catch (e) {
    // Best-effort: el fallback CSS (rotación) cubre cuando el lock no es posible.
  }
}

function isFullscreen() {
  return !!fsDoc.element;
}

function setFullscreenButtonState() {
  const btn = document.getElementById('fullscreen-btn');
  if (!btn) return;
  const active = isFullscreen();
  btn.classList.toggle('active', active);
  btn.textContent = active ? '✕' : '⛶';
  btn.title = active ? 'Salir de pantalla completa' : 'Pantalla completa';
}

async function enterFullscreen() {
  if (isFullscreen()) return;
  try {
    await fsDoc.request();
    await lockLandscape();
  } catch (e) {
    // Sin soporte o rechazado por el navegador: el layout se ajusta solo (dvh/dvw).
  }
}

async function exitFullscreen() {
  if (!isFullscreen()) return;
  try {
    await fsDoc.exit();
  } catch (e) {
    // Ignorar
  }
}

async function toggleFullscreen() {
  if (isFullscreen()) {
    await exitFullscreen();
  } else {
    await enterFullscreen();
  }
}

function onFullscreenChange() {
  setFullscreenButtonState();
}

function onFirstGesture(e) {
  if (e.type === 'keydown' && e.repeat) return;
  if (e.target && e.target.closest && e.target.closest('#fullscreen-btn')) return;
  enterFullscreen();
  document.removeEventListener('pointerdown', onFirstGesture);
  document.removeEventListener('keydown', onFirstGesture);
}

if (isMobile()) {
  root.classList.add('mobile');
  updateOrientationClass();
  window.addEventListener('orientationchange', updateOrientationClass);
  window.addEventListener('resize', updateOrientationClass);

  const btn = document.getElementById('fullscreen-btn');
  if (btn && fsDoc.enabled) {
    btn.hidden = false;
    btn.addEventListener('click', toggleFullscreen);
  }
  document.addEventListener('fullscreenchange', onFullscreenChange);
  document.addEventListener('webkitfullscreenchange', onFullscreenChange);

  document.addEventListener('pointerdown', onFirstGesture);
  document.addEventListener('keydown', onFirstGesture);
}
