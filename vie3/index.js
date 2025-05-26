const deltasProches = [
    [-1, 0, 0, -1],
    [1, 0, 0, 1],
    [0, 1, -1, -1],
    [0, -1, 1, 1],
    [1, 1, -1, 0],
    [-1, -1, 1, 0],
  ],
  boxSize = 16,
  cases = [];

let o = {},
  iteration = 0,
  zones = [];

/*********************
 * terrain : toute la fenêtre <body>
 * objet : <div>unicode</div> rattaché au <body> déplaçable
 * typeObjet : Le caractère unicode
 * cases : tableau à 2 dimensions dont chaque case pointe sur 0 ou 1 objet max
 * zones : un tableau à 2 dimensions par type d'objet représentant leur nombre dans chaque carré de n * n cases
 *
 * scenario : liste d'actions ou de scenarios à exécuter dans l'ordre.
 *   La première ayant abouti interrompt la liste
 * action : fonction à exécuter qui réalise une action sur un objet
 * routine : fonction qui manipule les données du programme
 */

// ROUTINES
function caseEl(x, y) {
  if (typeof cases[x] === 'undefined')
    cases[x] = [];

  return cases[x][y];
}

// Move el to the x/y position if it's free
function commun(el, x, y, data, dataInit) {

  if (typeof caseEl(x, y) === 'undefined' &&
    typeof el === 'object') {
    // Register in the grid
    cases[x][y] = el;

    // Reposition the point
    el.style.left = (x + (data && data.model ? 0 : Math.random() / 4 - 0.125 - y / 2)) * boxSize + 'px';
    el.style.top = (y * 0.866 + (data && data.model ? 0 : Math.random() / 4 - 0.125)) * boxSize + 'px';
    el.data = {
      ...dataInit,
      ...el.data,
      iteration: iteration,
      x: x,
      y: y,
      ...data,
    };

    return cases[x][y];
  }
}

function pointsProches(el, deep, limit, searched, extended) {
  let listeProches = [],
    dMin = 999999;

  // Randomize points order array
  for (let i = Math.random() * 4; i > 0; i--)
    deltasProches.push(deltasProches.shift());

  for (let d = 1; d < deep + 1 && listeProches.length < limit; d++) {
    /* eslint-disable-next-line no-loop-func */
    deltasProches.forEach(delta => {
      for (let i = 0; i < d && listeProches.length < limit; i++) {
        const nx = el.data.x + d * delta[0] + i * delta[2],
          ny = el.data.y + d * delta[1] + i * delta[3],
          eln = caseEl(nx, ny),
          pnx = (nx - ny / 2) * boxSize,
          pny = ny * 0.866 * boxSize;

        if (0 <= pnx && pnx < window.innerWidth - boxSize &&
          0 <= pny && pny < window.innerHeight - boxSize &&
          (
            (!searched && !eln) || // Cases libres
            (searched && eln && searched === eln.innerHTML) // objets identiques
          )
        )
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

  if (commun(el, x, y, data, o[symbol] ? o[symbol][1] : null)) {
    document.body.appendChild(el);
    el.innerHTML = symbol;
    el.draggable = true;
    /* eslint-disable-next-line no-use-before-define */
    el.ondragstart = dragstart;
  }
}

function movePoint(x, y, nx, ny) {
  const el = caseEl(x, y);

  if (el) {
    const nEl = commun(el, nx, ny);

    if (nEl) {
      delete cases[x][y];
      return false;
    }
  }
  return true;
}

function deletePoint(x, y) {
  //TODO TEST
  if (caseEl(x, y)) {
    cases[x][y].remove();
    delete cases[x][y];
    return true;
  }
}

// ACTIONS
function erre(el) {
  const pl = pointsProches(el, 1, 1);

  if (pl.length)
    return movePoint(el.data.x, el.data.y, el.data.x + pl[0][2], el.data.y + pl[0][3]);

  return true;
}

function semme(el, nomObjet) {
  const pl = pointsProches(el, 1, 1);

  if (pl.length && Math.random() < 0.3) {
    addPoint(pl[0][0], pl[0][1], nomObjet);
    return false;
  }
  return true;
}

function rapproche(el, nomObjet) {
  //TODO TEST
  const pm = pointsProches(el, 5, 1, nomObjet, true);

  if (pm.length)
    return movePoint(el.data.x, el.data.y, el.data.x + pm[0][2], el.data.y + pm[0][3]);

  return true;
}

function consomme(el, typeObjet, force, fin /*, tempo*/ ) {
  const pl = pointsProches(el, 1, 1, typeObjet);

  // Consomme
  if (el.data[force] < 20 &&
    typeof typeObjet !== 'undefined' &&
    pl.length) {
    el.data[force] += 10;
    deletePoint(pl[0][0], pl[0][1]);

    return false;
  }

  // Cherche
  if (el.data[force] < 10 &&
    typeof typeObjet !== 'undefined') {
    if (!rapproche(el, typeObjet))

      return false;
  }

  // Meurt
  if (el.data[force]-- < 0) { //TODO BUG consomme 3 fois si appelé 3 fois => utiliser intervalle
    el.innerHTML = fin;

    return false;
  }
  return true;
}

function fusionne(el, nomObjet, nomFinal) {
  //TODO TEST
  const pl = pointsProches(el, 1, 1, nomObjet);

  if (pl.length) {
    if (typeof el.data.amour !== 'number')
      el.data.amour = 0;

    if (el.data.amour++ > 3) {
      deletePoint(pl[0][0], pl[0][1]);
      el.innerHTML = nomFinal;
      el.data.amour = 0;
    }
    return false;
  }
  return true;
}

// Debug
/* eslint-disable-next-line no-unused-vars */
function trace(el, t) {
  console.log('trace ' + t);
  return true;
}

/* eslint-disable-next-line no-unused-vars */
function stop() {
  return false;
}

function developper(el, acteur) {
  if (typeof o[acteur] === 'object')
    return o[acteur][0].every(action =>
      action[0](el, ...action.slice(1)) // Stop when one action is completed
    );

  return true; // Return = continue (true / false)
}

// SCÉNARIOS
//🧔👩👫👪🧍💀 ⛲💧 🌱🌿🌽 ▒🧱🏠 🦴🚧🌳🌾🐇🐀🥔🧒👶👷
o = {
  vivant: [
    [
      [consomme, '💧', 'eau', '💀', 10],
      [consomme, '🌽', 'force', '💀', 50],
      [consomme, '🌿', 'force', '💀', 20],
      [consomme, '🌱', 'force', '💀', 10],
    ],
  ],
  '🧔': [
    [
      [developper, 'vivant'],
      //TODO absorbe 👩
      [erre],
    ], {
      eau: 20,
      force: 20,
    },
  ],
  '👩': [
    [
      [developper, 'vivant'],
      //TODO absorbe 🧔
      [erre],
    ], {
      eau: 20,
      force: 20,
    },
  ],
  '👫': [
    [
      [developper, 'vivant'],
      [erre],
    ],
  ],
  '💀': [
    [
      //TODO transforme ▒
    ],
  ],
  '⛲': [
    [
      [semme, '💧'],
    ],
  ],
  '💧': [
    [
      //TODO évaporer
      [erre],
    ],
  ],
  '🌽': [
    [
      [semme, '🌱'],
    ],
  ],
  '🌱': [
    [
      //TODO transforme 🌿
    ],
  ],
  '🌿': [
    [
      //TODO transforme 🌽
    ],
  ],
};

function unJour() {
  const debut = Date.now(),
    statsEl = document.getElementById('stats');

  // Exécution des actions
  iteration++;
  cases.forEach(col => {
    col.forEach(ligneEl => {
      if (!ligneEl.data.model && ligneEl.data.iteration < iteration)
        developper(ligneEl, ligneEl.innerHTML);
    });
  });

  zones = [];
  cases.forEach((col, noCol) => {
    col.forEach((ligneEl, noLigne) => {

      // Reconstruction de la table des éloignés
      if (!ligneEl.data.model) {
        const noColRound = Math.round(noCol / 4),
          noLigneRound = Math.round(noLigne / 4),
          car = ligneEl.innerHTML;

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

// INITIALISATIONS
//TODO help au début

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

// RÉPONSES SOURIS / CLAVIER
//TODO save/restaure

document.addEventListener('keydown', unJour);
window.onload = unJour;

function dragstart(evt) {
  evt.dataTransfer.setData('data', JSON.stringify(evt.target.data));
  evt.dataTransfer.setData('symbol', evt.target.innerHTML);
}

document.addEventListener('dragover', evt => {
  evt.preventDefault();
});

document.addEventListener('dragend', evt => {
  //TODO better animation
  evt.preventDefault();
});

document.addEventListener('drop', evt => {
  const data = JSON.parse(evt.dataTransfer.getData('data')),
    symbol = evt.dataTransfer.getData('symbol'),
    nx = parseInt((evt.x + evt.y / 2) / boxSize, 10),
    ny = parseInt(evt.y / 0.866 / boxSize, 10);
  //TODO smooth end of move

  if (data.model)
    addPoint(nx, ny, symbol);
  else
    movePoint(data.x, data.y, nx, ny);

  evt.preventDefault();
});

// TESTS
addPoint(13, 5, '⛲');
/*
addPoint(13, 14, '🧔');
addPoint(14, 14, '⛲');
addPoint(11, 5, '🧔');
addPoint(14, 5, '🌽');
addPoint(14, 7, '🌿');
addPoint(13, 14, '👩');
addPoint(14, 14, '💧');
addPoint(12, 14, '💧');
addPoint(22, 14, '🌽'); //addPoint(13, 13, '💧');
*/