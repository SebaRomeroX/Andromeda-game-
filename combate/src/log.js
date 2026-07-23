import { $ } from './renderer.js';

export function log(msg) {
  const el = $("log");
  const p = document.createElement("p");
  p.textContent = msg;
  el.appendChild(p);
  el.scrollTop = el.scrollHeight;
}

export function clearLog() {
  $("log").innerHTML = "";
}
