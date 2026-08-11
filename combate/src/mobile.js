const root = document.documentElement;

function isMobile() {
  if (matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0) return true;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

function updateOrientationClass() {
  root.classList.toggle('portrait', matchMedia('(orientation: portrait)').matches);
}

async function requestLandscapeLock() {
  const doc = document;
  const hasFullscreen = doc.fullscreenEnabled || doc.webkitFullscreenEnabled;
  const reqFullscreen = doc.documentElement.requestFullscreen || doc.documentElement.webkitRequestFullscreen;
  const orientation = screen.orientation || screen.webkitOrientation;
  if (!hasFullscreen || !reqFullscreen || !orientation || !orientation.lock) return;

  try {
    if (!doc.fullscreenElement && !doc.webkitFullscreenElement) {
      await reqFullscreen.call(doc.documentElement);
    }
    await orientation.lock('landscape');
  } catch (e) {
    // El fallback CSS (rotación) se encarga cuando el lock no es posible.
  }
}

function onFirstGesture(e) {
  if (e.type === 'keydown' && e.repeat) return;
  requestLandscapeLock();
  document.removeEventListener('pointerdown', onFirstGesture);
  document.removeEventListener('keydown', onFirstGesture);
}

if (isMobile()) {
  root.classList.add('mobile');
  updateOrientationClass();
  window.addEventListener('orientationchange', updateOrientationClass);
  window.addEventListener('resize', updateOrientationClass);
  document.addEventListener('pointerdown', onFirstGesture);
  document.addEventListener('keydown', onFirstGesture);
}
