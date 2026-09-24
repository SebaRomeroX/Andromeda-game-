import { $ } from './renderer.js';

export function log(msg) {
  const el = $("log");
  const p = document.createElement("p");
  p.textContent = msg;
  el.appendChild(p);
  el.scrollTop = el.scrollHeight;
}

// Igual que log() pero interpreta msg como HTML (lineas de recompensa
// de orbes, que llevan puntos de color con estilos). Solo para cadenas
// generadas por el propio juego, nunca entrada del usuario.
export function logHtml(msg) {
  const el = $("log");
  const p = document.createElement("p");
  p.innerHTML = msg;
  el.appendChild(p);
  el.scrollTop = el.scrollHeight;
}

export function clearLog() {
  $("log").innerHTML = "";
}

export function openLog() {
  const overlay = $("log-overlay");
  if (!overlay) return;
  overlay.classList.remove("hidden");
  const el = $("log");
  if (el) el.scrollTop = el.scrollHeight;
}

export function closeLog() {
  const overlay = $("log-overlay");
  if (overlay) overlay.classList.add("hidden");
}
