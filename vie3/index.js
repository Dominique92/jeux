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
    boxes[x][y] = el;

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

// ROUTINES
function pointsProches(el, deep, limit, searched, extended) {
  let listeProches = [],
    dMin = 999999;

  // Randomize points order
  for (let i = Math.random() * 4; i > 0; i--)
    deltasProches.push(deltasProches.shift());

  for (let d = 1; d < deep + 1 && listeProches.length < limit; d++) {
    /* eslint-disable-next-line no-loop-func */
    deltasProches.forEach(delta => {
      for (let i = 0; i < d && listeProches.length < limit; i++) {
        const nx = el.data.x + d * delta[0] + i * delta[2],
          ny = el.data.y + d * delta[1] + i * delta[3],
          eln = box(nx, ny),
          pnx = (nx - ny / 2) * boxSize,
          pny = ny * 0.866 * boxSize;

        if (0 <= pnx && pnx < window.innerWidth - boxSize &&
          0 <= pny && pny < window.innerHeight - boxSize)
          if ((!searched && !eln) ||
            (searched && eln && decHTML(eln, searched)))
            listeProches.push([nx, ny, ...delta]);
      }
    });
  }

  // Recherche éloignés
  if (extended &&
    !listeProches.length &&
    typeof zones[searched] === 'object')
    zones[searched].forEach((col, noCol) => {
      col.forEach((ligne, noLigne) => {

        const deltaCol = noCol - Math.round(el.data.x / 4),
          deltaLigne = noLigne - Math.round(el.data.y / 4),
          dist = deltaCol * deltaCol + deltaLigne * deltaLigne;

        if (dMin > dist) {
          dMin = dist;
          listeProches = [
            [0, 0,
              Math.sign(deltaCol),
              Math.sign(deltaLigne),
              deltaCol,
              deltaLigne,
            ]
          ];
        }
      });
    });

  return listeProches;
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

function movePoint(x, y, nx, ny) {
  const el = box(x, y);

  if (el) {
    const nEl = helperPoint(el, nx, ny);

    if (nEl) {
      delete boxes[x][y];
      return true;
    }
  }
}

function deletePoint(x, y) {
  if (box(x, y)) {
    boxes[x][y].remove();
    delete boxes[x][y];
    return true;
  }
}

// Fonctions unitaires
function erre(el) {
  const pl = pointsProches(el, 1, 1);
  if (pl.length)
    return movePoint(el.data.x, el.data.y, el.data.x + pl[0][2], el.data.y + pl[0][3]);
}

function semme(el, nomObjet) {
  const pl = pointsProches(el, 1, 1);
  if (pl.length)
    addPoint(pl[0][0], pl[0][1], o[nomObjet]);
}

function rapproche(el, nomObjet) {
  const pm = pointsProches(el, 5, 1, o[nomObjet], true);

  if (pm.length)
    return movePoint(el.data.x, el.data.y, el.data.x + pm[0][2], el.data.y + pm[0][3]);
}

function consomme(el, element, force, fin, tempo) {
  const pl = pointsProches(el, 1, 1, o[element]);

  // Init
  if (typeof el.data[force] === 'undefined')
    el.data[force] = tempo || 30;

  // Consomme
  if (el.data[force] < 20 &&
    typeof element !== 'undefined' &&
    pl.length) {
    el.data[force] += 10; //TODO ERROR AJOUTE 10 à la MORT !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    deletePoint(pl[0][0], pl[0][1]);
    return true;
  }

  // Cherche
  if (el.data[force] < 10 &&
    typeof element !== 'undefined' &&
    rapproche(el, element)) {
    return true;
  }

  // Meurt
  if (el.data[force]-- < 0) { //TODO BUG consomme 3 fois si appelé 3 fois => utiliser intervalle
    return true;
  }
}

function fusionne(el, nomObjet, nomFinal) {
  const pl = pointsProches(el, 1, 1, o[nomObjet]);

  if (pl.length) {
    if (typeof el.data.amour !== 'number')
      el.data.amour = 0;

    if (el.data.amour++ > 3) {
      deletePoint(pl[0][0], pl[0][1]);
      el.innerHTML = o[nomFinal];
      el.data.amour = 0;
    }
    return true;
  }
}

function vie(el, a, b, c) {
  console.log(el, a, b, c);
  //return true;
}

// Scénarios
// 🧔 👩 👫 👪 🧍 💀 ⛲ 💧 🌱 🌿 🌽 ▒ 🧱 🏠 - 🦴 🚧 🌳 🌾 🐇 🐀 🥔 🧒 👶 👷

/* eslint-disable-next-line one-var */
const o = {
  vivant: [
    [consomme, '💧', 'eau', '💀', 10],
    [consomme, '🌽', 'force', '💀', 50],
    [consomme, '🌿', 'force', '💀', 20],
    [consomme, '🌱', 'force', '💀', 10],
    /*
  if (consomme(el, 'eau', 'eau', 'mort')) return true;
  if (consomme(el, 'mais', 'force', 'mort')) return true;
  if (consomme(el, 'plante', 'force', 'mort')) return true;
  if (consomme(el, 'pousse', 'force', 'mort')) return true;
*/
  ],
  '🧔': [
    [developper, 'vivant', 3],
    [erre],
  ],
  '👩': [
    [developper, 'vivant', 3],
    [erre],
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
  boxes.forEach(col => {
    col.forEach(ligneEl => {
      if (!ligneEl.data.model && ligneEl.data.iteration < iteration)
        developper(ligneEl, ligneEl.innerHTML);
    });
  });

  zones = [];
  boxes.forEach((col, noCol) => {
    col.forEach((ligneEl, noLigne) => {

      // Reconstruction de la table des éloignés
      if (!ligneEl.data.model) {
        const noColRound = Math.round(noCol / 4),
          noLigneRound = Math.round(noLigne / 4),
          car = decHTML(ligneEl);

        if (typeof zones[car] === 'undefined')
          zones[car] = [];
        if (typeof zones[car][noColRound] === 'undefined')
          zones[car][noColRound] = [];
        if (typeof zones[car][noColRound][noLigneRound] === 'undefined')
          zones[car][noColRound][noLigneRound] = 0;
        zones[car][noColRound][noLigneRound]++;
      }

      // Debug 
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