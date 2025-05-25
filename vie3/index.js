const deltasProches = [
    [-1, 0, 0, -1],
    [1, 0, 0, 1],
    [0, 1, -1, -1],
    [0, -1, 1, 1],
    [1, 1, -1, 0],
    [-1, -1, 1, 0],
  ],
  boxSize = 16,
  boxes = [];

let iteration = 0,
  zones = [];

// 🧔 👩 👫 👪 🧍 💀 ⛲ 💧 🌱 🌿 🌽 ▒ 🧱 🏠 - 🦴 🚧 🌳 🌾 🐇 🐀 🥔 🧒 👶 👷

// HELPERS
function box(x, y, v) {
  if (typeof boxes[x] === 'undefined')
    boxes[x] = [];

  if (typeof v !== 'undefined')
    boxes[x][y] = v;

  return boxes[x][y];
}

// Traduit un caractère unicode en ascii décimal
function decHTML(el, ascii) {
  let out = '';

  for (const chr of el.innerHTML) {
    const code = chr.codePointAt(0);

    out += code >= 0x80 ? '&#' + code + ';' : chr;
  }
  return ascii ? out === ascii : out;
}

// Move el to the x/y position if it's free
function helperPoint(el, x, y, data) {

  if (typeof box(x, y) === 'undefined' &&
    typeof el === 'object') {
    // Register in the grid
    box(x, y, el);

    // Reposition the point
    el.style.left = (x + (data && data.model ? 0 : Math.random() / 4 - 0.125 - y / 2)) * boxSize + 'px';
    el.style.top = (y * 0.866 + (data && data.model ? 0 : Math.random() / 4 - 0.125)) * boxSize + 'px';
    el.data = {
      ...el.data,
      iteration: iteration,
      x: x,
      y: y,
      ...data,
    };

    return boxes[x][y];
  }
}

function addPoint(x, y, symbol, data) {
  const el = document.createElement('div');

  if (helperPoint(el, x, y, data)) {
    document.body.appendChild(el);
    el.innerHTML = symbol;
    el.draggable = true;
    /* eslint-disable-next-line no-use-before-define */
    //TODO el.ondragstart = dragstart;
    //return true;
  }
}

function vie(el, a, b, c) {
  console.log(el, a, b, c);
  //return true;
}

// Scénarios
/* eslint-disable-next-line one-var */
const o = {
  vivant: [
    [vie, '🌿', 1],
    [vie, '🌿', 2],
  ],
  '🧔': [
    [developper, 'vivant', 3],
    [vie, '🌿', 4],
  ],
  '👫': [
    [vie, '🌿', 5, {
      a: 0,
      b: '🐇',
      c: 2,
    }],
  ],
};

function developper(el, acteur) {
  if (typeof o[acteur] === 'object')
    return !o[acteur].every(action =>
      !action[0](el, ...action.slice(1)) // Stop when one action is completed
    );
}

function unJour() {
  const debut = Date.now(),
    statsEl = document.getElementById('stats');

  // Exécution des actions
  iteration++;
  boxes.forEach(ligne => {
    ligne.forEach(el => {
      if (!el.data.model && el.data.iteration < iteration)
        developper(el, el.innerHTML);
    });
  });

  /*
    // Reconstruction de la table des éloignés
    zones = [];
    boxes.forEach((col, noCol) => {
      col.forEach((ligne, noLigne) => {
        if (!ligne.data.model) {
          const noColRound = Math.round(noCol / 4),
            noLigneRound = Math.round(noLigne / 4),
            car = decHTML(ligne);

          if (typeof zones[car] === 'undefined')
            zones[car] = [];
          if (typeof zones[car][noColRound] === 'undefined')
            zones[car][noColRound] = [];
          if (typeof zones[car][noColRound][noLigneRound] === 'undefined')
            zones[car][noColRound][noLigneRound] = 0;
          zones[car][noColRound][noLigneRound]++;
        }
      });
    });
  */

  // Debug 
  boxes.forEach(col => {
    col.forEach(ligneEl => {
      ligneEl.setAttribute('title', JSON.stringify(ligneEl.data));
    });
  });

  statsEl.innerHTML = (Date.now() - debut) + ' ms';
}

// Actions récurrentes
document.addEventListener('keydown', unJour);
window.onload = unJour;

// Models
addPoint(0, 0, '🧔', {
  model: true,
});
addPoint(0, 2, '👩', {
  model: true,
});
addPoint(0, 4, '⛲', {
  model: true,
});
addPoint(0, 6, '🌽', {
  model: true,
});

// Tests
addPoint(11, 5, '🧔', {});
addPoint(13, 9, '👩', {});
addPoint(15, 5, '⛲', {});
addPoint(17, 9, '🌽', {});