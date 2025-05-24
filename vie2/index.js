//TODO favicon

const catalog = {
    homme: '&#129492;',
    femme: '&#128105;',
    mais: '&#127805;',
    fontaine: '&#9970;',
  },
  o = {
    ...catalog,
    pousse: '&#127793;',
    plante: '&#127807;',
    sable: '&#9618;',
    couple: '&#128107;',
    famille: '&#128106;',
    enfant: '&#129485;',
    mort: '&#128128;',
    os: '&#129460;',
    //amoureux: catalog.homme + catalog.femme,
    eau: '&#128167;',
    barriere: '&#128679;',
    brick: '&#129521;',
    route: '&#9945;',
    maison: '&#127968;',
    arbre: '&#127795;',
    riz: '&#127806;',
    lapin: '&#128007;',
    rat: '&#128000;',
    jeune: '&#129490;',
    bebe: '&#128118;',
    patate: '&#129364;',
  },
  deltasProches = [
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
// Traduit un caractère unicode en ascii décimal
function decHTML(el, ascii) {
  let out = '';

  for (const chr of el.innerHTML) {
    const code = chr.codePointAt(0);

    out += code >= 0x80 ? '&#' + code + ';' : chr;
  }
  return ascii ? out === ascii : out;
}

// GESTION DES POINTS
function box(x, y) {
  if (typeof boxes[x] === 'undefined')
    boxes[x] = [];

  return boxes[x][y];
}

// Move el to the x/y position if it's free
function helperPoint(el, x, y, data) {
  if (typeof box(x, y) === 'undefined' &&
    typeof el === 'object') {
    // Register in the grid
    boxes[x][y] = el;

    // Reposition the point
    el.style.left = (x - y / 2 + (data && data.model ? 0 : Math.random() / 4 - 0.125)) * boxSize + 'px';
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
    el.ondragstart = dragstart;
    return true;
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

// DÉPLACEMENTS
function dragstart(evt) {
  evt.dataTransfer.setData('data', JSON.stringify(evt.target.data));
  evt.dataTransfer.setData('symbol', evt.target.innerHTML);
}

document.addEventListener('dragover', evt => {
  // TODO ???
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

function consomme(el, element, force) {
  const pl = pointsProches(el, 1, 1, o[element]);

  // Init
  if (typeof el.data[force] !== 'number')
    el.data[force] = 30;

  // Consomme
  if (el.data[force] < 20)
    if (pl.length) {
      el.data[force] += 10;
      deletePoint(pl[0][0], pl[0][1]);
      return true;
    }

  // Cherche
  if (el.data[force] < 10 &&
    rapproche(el, element))
    return true;

  // Meurt
  if (el.data[force]-- < 0) {
    el.innerHTML = o.mort;
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

function journee(el, autre, fusion) {
  if (consomme(el, 'eau', 'eau')) return true;
  if (consomme(el, 'mais', 'force')) return true;
  if (consomme(el, 'plante', 'force')) return true;
  if (consomme(el, 'pousse', 'force')) return true;

  if (autre) {
    if (fusionne(el, autre, fusion)) return true;
    if (rapproche(el, autre)) return true;
  }
  erre(el);
}

//ACTIONS
/* eslint-disable-next-line one-var */
const actions = {
  fontaine: el => {
    semme(el, 'eau');
  },
  eau: el => {
    erre(el);
  },
  mais: el => {
    semme(el, 'pousse');
  },
  homme: el => {
    if (journee(el, 'femme', 'couple')) return;
  },
  femme: el => {
    if (journee(el, 'homme', 'couple')) return;
  },
  couple: el => {
    if (journee(el)) return;
  },
};

document.addEventListener('keydown', () => {
  const debut = Date.now(),
    statsEl = document.getElementById('stats');

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

  // Exécution des actions
  iteration++;
  boxes.forEach(ligne => {
    ligne.forEach(el => {
      if (!el.data.model && el.data.iteration < iteration) {
        const nomAction = Object.keys(o).find(k => o[k] === decHTML(el));

        if (typeof actions[nomAction] === 'function')
          actions[nomAction](el);
        // Debug 
        el.setAttribute('title', JSON.stringify(el.data));
      }
    });
  });

  statsEl.innerHTML = (Date.now() - debut) + ' ms';
});

// INIT CATALOG
Object.entries(o).forEach((pair, i) => {
  addPoint(1.5 * i, 0, pair[1], {
    model: true,
  });
})