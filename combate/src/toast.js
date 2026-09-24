// Badge flotante global (el mismo que "💾 Partida Guardada").
// Compartido entre main.js y combat.js para no crear imports circulares.

let toastTimer = null;

export function showToast(text, duration = 1500) {
  const toast = document.getElementById('save-toast');
  if (!toast) return;
  toast.textContent = text;
  toast.classList.add('show');
  toast.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
    toast.classList.add('hidden');
  }, duration);
}
