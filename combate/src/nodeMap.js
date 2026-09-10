/**
 * nodeMap.js — Renderiza un grafo SVG del arbol de nodos de una historia.
 *
 * Muestra solo nodos de combate narrativo y reclutamiento como circulos
 * con iconos, conectados por lineas que muestran la ruta.
 * El nodo actual brilla en dorado, los completados se muestran en verde,
 * y las ramas no elegidas se atenuan.
 */

const ICONS = {
  enfrentamiento: '\u{1F608}',
  reclutamiento: '\u{1F91D}'
};

const COLORS = {
  fired: '#4a7a4a',
  current: '#c8a832',
  future: '#2a2a4a',
  unreachable: '#1e1e2e',
  lineFired: '#5a8a5a',
  lineCurrent: '#c8a832',
  lineDefault: '#3a3a5c'
};

/**
 * Posiciones manuales de los 34 nodos de Travesia de Sima.
 * Coordenadas en el sistema SVG (0,0 es arriba-izquierda).
 */
const NODE_POSITIONS = {
  'intro':                          { x: 400, y: 40 },
  'elegir-camino':                  { x: 400, y: 95 },

  // ── Rama bosque (izquierda) ──
  'bosque-intro':                   { x: 190, y: 155 },
  'dialogo-druida':                 { x: 155, y: 215 },
  'reclutamiento-druida':           { x: 130, y: 275 },
  'dialogo-akay':                   { x: 155, y: 335 },
  'primero-akay':                   { x: 190, y: 395 },
  'dialogo-urbol':                  { x: 230, y: 455 },
  'reclutamiento-urbol':            { x: 190, y: 515 },
  'dialogo-capitan-oscuro-bosque':  { x: 155, y: 575 },
  'sin-salida-bosque':              { x: 190, y: 635 },
  'dialogo-final-bosque':           { x: 230, y: 695 },
  'final-narada-bosque':            { x: 190, y: 755 },
  'conclusion-bosque':              { x: 190, y: 810 },

  // ── Rama directo (derecha) ──
  'elegir-camino-2':                { x: 590, y: 155 },

  // ── Sub-rama cueva ──
  'cueva-intro':                    { x: 500, y: 220 },
  'dialogo-aracnida':               { x: 470, y: 280 },
  'reclutamiento-aracnida':         { x: 450, y: 340 },
  'dialogo-bruja':                  { x: 475, y: 400 },
  'primero-la-bruja':               { x: 500, y: 460 },
  'dialogo-bruja-derrotada':        { x: 475, y: 520 },
  'dialogo-final-cueva':            { x: 500, y: 580 },
  'final-narada-cueva':             { x: 500, y: 640 },
  'conclusion-cueva':               { x: 500, y: 695 },

  // ── Sub-rama directo (piedrita) ──
  'piedrita':                       { x: 680, y: 220 },
  'reclutamiento-piedrita':         { x: 700, y: 280 },
  'dialogo-demonica':               { x: 680, y: 340 },
  'primero-demonica':               { x: 700, y: 400 },
  'dialogo-capitan-oscuro-directo': { x: 680, y: 460 },
  'sin-salida-directo':             { x: 700, y: 520 },
  'dialogo-narada-escape':          { x: 680, y: 580 },
  'dialogo-final-directo':          { x: 700, y: 640 },
  'final-narada-directo':           { x: 700, y: 700 },
  'conclusion-directo':             { x: 700, y: 755 }
};

const R = 18;

/**
 * Determina los IDs de nodos inalcanzables (rame no elegidas despues de una eleccion).
 */
function getUnreachableIds(storyNodes, choices) {
  const unreachable = new Set();

  function walkForward(nodeId, nodes, result) {
    if (!nodeId || result.has(nodeId)) return;
    const node = nodes[nodeId];
    if (!node) return;
    result.add(nodeId);
    if (node.next) walkForward(node.next, nodes, result);
    if (node.options) {
      for (const opt of node.options) {
        walkForward(opt.next, nodes, result);
      }
    }
  }

  for (const [id, node] of Object.entries(storyNodes)) {
    if (node.type !== 'eleccion' || !choices[id]) continue;
    for (const opt of node.options) {
      if (opt.id !== choices[id]) {
        walkForward(opt.next, storyNodes, unreachable);
      }
    }
  }

  return unreachable;
}

/**
 * Determina el estado de un nodo para efectos visuales.
 */
function getNodeState(nodeId, run) {
  if (run.fired.has(nodeId)) return 'fired';
  if (run.currentNodeId === nodeId) return 'current';
  return 'future';
}

function getStateColor(state) {
  return COLORS[state] || COLORS.future;
}

function getIcon(node) {
  if (node.final) return '\u2B50';
  return ICONS[node.type] || '\u2753';
}

function truncate(str, max) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max - 1) + '\u2026' : str;
}

/**
 * Determina si un nodo debe mostrarse en el mapa.
 * Solo muestra combate narrativo y reclutamiento.
 */
function isNodeVisible(node) {
  return (node.type === 'enfrentamiento' && node.narrativo)
      || node.type === 'reclutamiento';
}

/**
 * Encuentra el siguiente nodo visible siguiendo la cadena de next/options.
 * Salta nodos ocultos hasta encontrar uno visible.
 */
function findNextVisibleNode(currentId, storyNodes, visited = new Set()) {
  if (visited.has(currentId)) return null;
  visited.add(currentId);

  const node = storyNodes[currentId];
  if (!node) return null;

  if (node.options) {
    for (const opt of node.options) {
      const result = findNextVisibleNode(opt.next, storyNodes, new Set(visited));
      if (result) return result;
    }
  }

  if (node.next) {
    const nextNode = storyNodes[node.next];
    if (nextNode && isNodeVisible(nextNode)) {
      return node.next;
    }
    return findNextVisibleNode(node.next, storyNodes, visited);
  }

  return null;
}

/**
 * Encuentra el primer nodo visible desde un punto de inicio en una rama.
 * Se detiene si encuentra otro fork (eleccion) para no cruzar ramas.
 */
function findFirstVisibleInBranch(startId, storyNodes) {
  const visited = new Set();
  let current = startId;

  while (current && !visited.has(current)) {
    visited.add(current);
    const node = storyNodes[current];
    if (!node) return null;
    if (isNodeVisible(node)) return current;
    if (node.type === 'eleccion') return null;
    current = node.next;
  }

  return null;
}

/**
 * Funcion principal: renderiza el mapa de nodos SVG en un contenedor.
 *
 * @param {HTMLElement} container - Elemento DOM donde insertar el SVG
 * @param {Object} story - Objeto de la historia (con storyNodes)
 * @param {Object} run - Estado del run (fired, currentNodeId, choices)
 */
export function renderNodeMap(container, story, run) {
  const storyNodes = story.storyNodes;
  if (!storyNodes) return;

  const unreachable = getUnreachableIds(storyNodes, run.choices ?? {});

  // Construir conexiones: nodos visibles + forks/intro ocultos
  const visibleConnections = {};
  function addConnection(fromId, toId) {
    if (!visibleConnections[fromId]) visibleConnections[fromId] = [];
    visibleConnections[fromId].push(toId);
  }

  for (const [id, node] of Object.entries(storyNodes)) {
    if (!NODE_POSITIONS[id]) continue;

    if (isNodeVisible(node)) {
      const nextVisibleId = findNextVisibleNode(id, storyNodes);
      if (nextVisibleId) addConnection(id, nextVisibleId);
    } else if (node.options) {
      for (const opt of node.options) {
        const firstVisible = findFirstVisibleInBranch(opt.next, storyNodes);
        if (firstVisible) addConnection(id, firstVisible);
      }
    } else if (node.next) {
      const firstVisible = findFirstVisibleInBranch(node.next, storyNodes);
      if (firstVisible) addConnection(id, firstVisible);
    }
  }

  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 800 830');
  svg.setAttribute('xmlns', ns);

  // ── Definiciones (filtro de brillo) ──
  const defs = document.createElementNS(ns, 'defs');
  const filter = document.createElementNS(ns, 'filter');
  filter.setAttribute('id', 'currentGlow');
  filter.setAttribute('x', '-50%');
  filter.setAttribute('y', '-50%');
  filter.setAttribute('width', '200%');
  filter.setAttribute('height', '200%');

  const blur = document.createElementNS(ns, 'feGaussianBlur');
  blur.setAttribute('in', 'SourceGraphic');
  blur.setAttribute('stdDeviation', '6');
  blur.setAttribute('result', 'blur');

  const merge = document.createElementNS(ns, 'feMerge');
  const mn1 = document.createElementNS(ns, 'feMergeNode');
  mn1.setAttribute('in', 'blur');
  const mn2 = document.createElementNS(ns, 'feMergeNode');
  mn2.setAttribute('in', 'SourceGraphic');
  merge.appendChild(mn1);
  merge.appendChild(mn2);

  filter.appendChild(blur);
  filter.appendChild(merge);
  defs.appendChild(filter);
  svg.appendChild(defs);

  // ── Grupo de conexiones (detras de los nodos) ──
  const linesGroup = document.createElementNS(ns, 'g');
  svg.appendChild(linesGroup);

  // ── Dibujar conexiones entre nodos visibles ──
  for (const [id, targets] of Object.entries(visibleConnections)) {
    const from = NODE_POSITIONS[id];
    if (!from) continue;

    for (const targetId of targets) {
      const to = NODE_POSITIONS[targetId];
      if (!to) continue;

      const line = document.createElementNS(ns, 'line');
      line.setAttribute('x1', from.x);
      line.setAttribute('y1', from.y + R);
      line.setAttribute('x2', to.x);
      line.setAttribute('y2', to.y - R);

      let color = COLORS.lineDefault;
      if (unreachable.has(targetId)) {
        color = '#2a2a3a';
      } else if (id === (run.currentNodeId || '').toString() || targetId === run.currentNodeId) {
        color = COLORS.lineCurrent;
      } else if (run.fired.has(id) && run.fired.has(targetId)) {
        color = COLORS.lineFired;
      }

      line.setAttribute('stroke', color);
      line.setAttribute('stroke-width', '2');
      line.setAttribute('stroke-linecap', 'round');
      linesGroup.appendChild(line);
    }
  }

  // ── Grupo de nodos ──
  const nodesGroup = document.createElementNS(ns, 'g');
  svg.appendChild(nodesGroup);

  for (const [id, node] of Object.entries(storyNodes)) {
    if (!isNodeVisible(node)) continue;

    const pos = NODE_POSITIONS[id];
    if (!pos) continue;

    const state = unreachable.has(id) ? 'unreachable' : getNodeState(id, run);
    const fillColor = getStateColor(state);
    const icon = getIcon(node);

    // Circulo
    const circle = document.createElementNS(ns, 'circle');
    circle.setAttribute('cx', pos.x);
    circle.setAttribute('cy', pos.y);
    circle.setAttribute('r', R);
    circle.setAttribute('fill', fillColor);
    circle.setAttribute('stroke', state === 'current' ? '#f0d060' : '#5a5a7a');
    circle.setAttribute('stroke-width', state === 'current' ? '3' : '1.5');
    if (state === 'current') {
      circle.setAttribute('filter', 'url(#currentGlow)');
    }
    nodesGroup.appendChild(circle);

    // Icono
    const text = document.createElementNS(ns, 'text');
    text.setAttribute('x', pos.x);
    text.setAttribute('y', pos.y);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'central');
    text.setAttribute('font-size', '16');
    text.textContent = icon;
    nodesGroup.appendChild(text);

    // Label
    const label = document.createElementNS(ns, 'text');
    label.setAttribute('x', pos.x);
    label.setAttribute('y', pos.y + R + 14);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('font-size', '9');
    label.setAttribute('fill', state === 'unreachable' ? '#3a3a4a' : '#8a8a9a');
    label.setAttribute('font-family', 'sans-serif');
    label.textContent = truncate(node.title, 16);
    nodesGroup.appendChild(label);
  }

  container.innerHTML = '';
  container.appendChild(svg);
}
