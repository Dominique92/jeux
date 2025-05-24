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
    couple: '&#128107;',
    famille: '&#128106;',
    enfant: '&#129485;',
    mort: '&#128128;',
    os: '&#129460;',
    //amoureux: catalog.homme + catalog.femme,
    eau: '&#128167;',
    barriere: '&#128679;',
    brick: '&#129521;',
    sable: '&#9617;',
    route: '&#9945;',
    maison: '&#127968;',
  },
  spares = {
    //...o,
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
  boxes = [],
  actions = [];

let iteration = 0,
  zones = [];

// Helpers
// Traduit un caractère unicode en ascii décimal
function decHTML(el, ascii) {
  let out = '';
  for (const char of el.innerHTML) {
    const code = char.codePointAt(0);
    out += code >= 0x80 ? '&#' + code + ';' : char;
  }
  return ascii ? out === ascii : out;
}

// Gestion des points
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
      iteration: iteration,
      x: x,
      y: y,
      ...data
    };
    // Debug 
    el.setAttribute('title', [el.data.x, el.data.y, el.style.left, el.style.top].join(' '));

    return boxes[x][y];
  }
}

function addPoint(x, y, symbol, data) {
  const el = document.createElement('div');

  if (helperPoint(el, x, y, data)) {
    document.body.appendChild(el);
    el.innerHTML = symbol;
    el.draggable = true;
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

// Init catalog
Object.entries(o).forEach((pair, i) => {
  addPoint(1.5 * i, 0, pair[1], {
    model: true,
  });
})

// Déplacements
function dragstart(evt) {
  evt.dataTransfer.setData('data', JSON.stringify(evt.target.data));
  evt.dataTransfer.setData('symbol', evt.target.innerHTML);
}

document.addEventListener('drop', evt => {
  const data = JSON.parse(evt.dataTransfer.getData('data')),
    symbol = evt.dataTransfer.getData('symbol'),
    nx = parseInt((evt.x + evt.y / 2) / boxSize),
    ny = parseInt(evt.y / 0.866 / boxSize);
  //TODO smooth end of move

  if (data.model)
    addPoint(nx, ny, symbol);
  else
    movePoint(data.x, data.y, nx, ny);

  evt.preventDefault();
});
document.addEventListener('dragover', evt => {
  evt.preventDefault();
});

document.addEventListener('dragend', evt => {
  //TODO better animation
  evt.preventDefault();
});

// Actions
function pointsProches(el, deep, limit, searched) {
  let listeProches = [],
    dMin = 999999;

  // Randomize points order
  for (let i = Math.random() * 4; i > 0; i--)
    deltasProches.push(deltasProches.shift());

  for (d = 1; d < deep + 1 && listeProches.length < limit; d++) {
    deltasProches.forEach(delta => {
      for (i = 0; i < d && listeProches.length < limit; i++) {
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
  if (!listeProches.length &&
    typeof zones[searched] === 'object')
    zones[searched].forEach((col, noCol) => {
      col.forEach((ligne, noLigne) => {

        const deltaCol = noCol - Math.round(el.data.x / 5),
          deltaLigne = noLigne - Math.round(el.data.y / 5),
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

//TODO DELETE
/*
 const p = pointsProches(el, 1, 1);
  if (p.length && decHTML(el, o.fontaine))
    addPoint(p[0][0], p[0][1], o.eau);
     p.forEach(xy => {
      addPoint(xy[0], xy[1], o.fontaine);
    });
*/

function erre(el) {
  const pl = pointsProches(el, 1, 1);
  if (pl.length)
    return movePoint(el.data.x, el.data.y, el.data.x + pl[0][2], el.data.y + pl[0][3]);
}

function semme(el, nom) {
  const pl = pointsProches(el, 1, 1);
  if (pl.length)
    addPoint(pl[0][0], pl[0][1], o[nom]);
}

function rapproche(el, nom) {
  const pm = pointsProches(el, 6, 1, o[nom]);

  if (pm.length)
    return movePoint(el.data.x, el.data.y, el.data.x + pm[0][2], el.data.y + pm[0][3]);
}

actions['mais'] = el => {
  semme(el, 'pousse');
};

actions['fontaine'] = el => {
  semme(el, 'eau');
};

actions['eau'] = el => {
  erre(el);
};

actions['homme'] = el => {
  rapproche(el, 'femme');
};
actions['femme'] = el => {
  rapproche(el, 'homme');
};

// Actions
document.addEventListener('keydown', evt => {
  // Reconstruction de la table des éloignés
  zones = [];
  boxes.forEach((col, noCol) => {
    col.forEach((ligne, noLigne) => {
      if (!ligne.data.model) {
        const noColRound = Math.round(noCol / 5),
          noLigneRound = Math.round(noLigne / 5),
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
      }
    });
  });
});