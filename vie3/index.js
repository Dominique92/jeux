const statsEl = document.getElementById('stats'),
  helpEl = document.getElementById('help'),
  deltasProches = [
    [-1, 0, 0, -1],
    [1, 0, 0, 1],
    [0, 1, -1, -1],
    [0, -1, 1, 1],
    [1, 1, -1, 0],
    [-1, -1, 1, 0],
  ],
  initData = {
    age: 0,
    eau: 20,
    energie: 20,
    amour: 0,
  },
  boxSize = 16,
  cases = [];

let o = {},
  noIteration = 0,
  zones = [];

/*********************
 * Terrain : toute la fenêtre <body>
 * objet : <div>unicode</div> rattaché au <body> déplaçable
 * typeObjet : Le caractère unicode
 * cases : tableau à 2 dimensions dont chaque case pointe sur 0 ou 1 objet max
 * zones : un tableau à 2 dimensions par type d'objet représentant leur nombre dans chaque carré de n * n cases
 *
 * Routine : fonction qui manipule les données du programme
 * Verbe : fonction à exécuter qui réalise une action sur un objet
 * Scenario : liste d'actions ou de scenarios à exécuter dans l'ordre.
 *   La première ayant abouti interrompt la liste
 */

// ROUTINES
function caseEl(x, y) {
  if (typeof cases[x] === 'undefined')
    cases[x] = [];

  return cases[x][y];
}

function casePixels(x, y, gigue) {
  return [
    (x + (gigue ? 0 : Math.random() / 4 - 0.125 - y / 2)) * boxSize,
    (y * 0.866 + (gigue ? 0 : Math.random() / 4 - 0.125)) * boxSize,
  ];
}

// Move el to the x/y position if it's free
function commun(el, x, y, data, nomObjet, xDepart, yDepart) {
  const positionxDepart = casePixels(xDepart || x, yDepart || y, data && data.model),
    positionPixels = casePixels(x, y, data && data.model);

  if (typeof caseEl(x, y) === 'undefined' &&
    typeof el === 'object') {
    // Register in the grid
    cases[x][y] = el;

    // Update the data
    if (nomObjet)
      el.innerHTML = nomObjet;

    el.data = {
      ...el.data,
      x: x,
      y: y,
      ...data,
      noIteration: noIteration, // Pour éviter d'être relancé pendant cette itération
    };

    // Starting position
    el.style.left = positionxDepart[0] + 'px';
    el.style.top = positionxDepart[1] + 'px';

    // Timeout ensures styles are applied before scrolling
    if (typeof xDepart === 'number' && typeof yDepart === 'number')
      setTimeout(() => {
        // Destination position (after transition)
        el.style.left = positionPixels[0] + 'px';
        el.style.top = positionPixels[1] + 'px';
      }, 0);

    return cases[x][y];
  }
  return false;
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
            (!searched && eln && '▒' === eln.innerHTML) || // Sable
            (searched && eln && searched === eln.innerHTML) // Objet trouvé
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

function ajouterObjet(x, y, symbol, data) {
  const el = document.createElement('div'),
    newData = {
      ...data,
      ...initData,
    };

  if (commun(el, x, y, newData, symbol)) {
    document.body.appendChild(el);

    // Hold moves when hover
    el.onmouseover = () => {
      el.data.hovered = true;
      el.style.top = window.getComputedStyle(el).top;
      el.style.left = window.getComputedStyle(el).left;
    };
    el.onmouseout = () => {
      el.data.hovered = false;
    };

    // Mouse actions
    el.draggable = true;
    /* eslint-disable-next-line no-use-before-define */
    el.ondragstart = dragstart;
    /* eslint-disable-next-line no-use-before-define */
    el.onclick = click;
  }
}

function bougerObjet(x, y, nx, ny) {
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

function supprimerObjet(x, y) {
  if (caseEl(x, y)) {
    cases[x][y].remove(); //TODO smooth desaparence
    delete cases[x][y];
    return false;
  }
  return true;
}

// VERBES
function muer(el, nomObjet, age) {
  if (el.data.age > age)
    return !commun(el, el.data.x, el.data.y, nomObjet);

  return true;
}

function errer(el, fin) {
  const pl = pointsProches(el, 1, 1);

  // Evaporer
  if (typeof fin === 'number' &&
    Math.random() < fin) {
    return supprimerObjet(el.data.x, el.data.y)
  }

  // Mort
  if (typeof fin === 'string' &&
    (el.data.eau < 0 || el.data.energie < 0)
  ) {
    el.innerHTML = fin;

    return false;
  }

  // Erre
  if (pl.length)
    return bougerObjet(el.data.x, el.data.y, el.data.x + pl[0][2], el.data.y + pl[0][3]);

  return true;
}

function essaimer(el, probabilite, nomNouveau, nomRemplace) {
  // Si nomRemplace undefined, dans une case vide
  const pp = pointsProches(el, 1, 1, nomRemplace);

  if (pp.length && Math.random() < probabilite) {
    const elN = caseEl(pp[0][0], pp[0][1]);

    if (nomRemplace && elN)
      elN.innerHTML = nomNouveau;
    else
      ajouterObjet(pp[0][0], pp[0][1], nomNouveau);

    return false;
  }
  return true;
}

function rapprocher(el, nomObjet) { //TODO TEST
  const pm = pointsProches(el, 5, 1, nomObjet, true);

  if (pm.length)
    return bougerObjet(el.data.x, el.data.y, el.data.x + pm[0][2], el.data.y + pm[0][3]);

  return true;
}

function consommer(el, typeObjet, typeRessource, quantiteRessource) {
  const pl = pointsProches(el, 1, 1, typeObjet);

  // Consomme
  if (el.data[typeRessource] < 20 &&
    typeof typeObjet !== 'undefined' &&
    pl.length) {
    el.data[typeRessource] += quantiteRessource;
    supprimerObjet(pl[0][0], pl[0][1]);

    return false;
  }

  // Cherche
  if (el.data[typeRessource] < 10 &&
    typeof typeObjet !== 'undefined') {
    if (!rapprocher(el, typeObjet)) //TODO TEST

      return false;
  }
  return true;
}

function fusionner(el, nomObjet, nomFinal) { //TODO TEST KO (manque rapprocher)
  const pl = pointsProches(el, 1, 1, nomObjet);

  if (pl.length) {
    if (typeof el.data.amour !== 'number')
      el.data.amour = 0;

    if (el.data.amour++ > 3) {
      supprimerObjet(pl[0][0], pl[0][1]);
      el.innerHTML = nomFinal;
      el.data.amour = 0;
    }
    return false;
  }
  return true;
}

// Debug
/* eslint-disable-next-line no-unused-vars */
function tracer(el, t) {
  console.log('trace ' + t);
  return true;
}

/* eslint-disable-next-line no-unused-vars */
function stopper() {
  return false;
}

function developper(el, acteur) {
  if (typeof o[acteur] === 'object')
    return o[acteur].every(action =>
      action[0](el, ...action.slice(1)) // Stop when one action is completed
    );

  return true; // continue
}

function iterer() {
  const debut = Date.now();

  // Exécution des actions
  noIteration++;
  cases.forEach(col => {
    col.forEach(ligneEl => {
      if (!ligneEl.data.model && // Pas les modèles
        !ligneEl.data.hovered && // Pas si le curseur est au dessus
        ligneEl.data.noIteration < noIteration) { // Pas s'il a été traité à partir d'un autre objet pendant la même itération
        developper(ligneEl, ligneEl.innerHTML);

        // Tout le monde viellit
        ligneEl.data.age++;
        ligneEl.data.eau--;
        ligneEl.data.energie--;
        ligneEl.data.amour--;
      }
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
      const data = {
        ...ligneEl.data
      };
      delete data.x;
      delete data.y;
      delete data.noIteration;
      delete data.hovered;
      ligneEl.setAttribute('title', JSON.stringify(data).replace(/\{|"|\}/gu, '') || '-');
    });
  });

  statsEl.innerHTML = (Date.now() - debut) + ' ms';
}

// RÉPONSES SOURIS / CLAVIER
self.setInterval(iterer, 1000);
document.addEventListener('keydown', iterer);
//TODO save/restaure

function click(evt) {
  if (!evt.target.data.model) {
    if (JSON.stringify(o[evt.target.innerHTML][0]).includes('animer'))
      errer(evt.target);
    else
      supprimerObjet(evt.target.data.x, evt.target.data.y);
  }
}

function dragstart(evt) {
  evt.dataTransfer.setData('data', JSON.stringify(evt.target.data));
  evt.dataTransfer.setData('symbol', evt.target.innerHTML);
  helpEl.style.display = 'none';
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
    ajouterObjet(nx, ny, symbol);
  else
    bougerObjet(data.x, data.y, nx, ny);

  evt.preventDefault();
});

// SCÉNARIOS
//🧔👩👫👪🧍💀  ⛲💧 🌱🌿🌽 ▒🧱🏠  🦴🚧🌳🌾🐇🐀🥔🧒👶👷
o = {
  animer: [
    [consommer, '💧', 'eau', 10],
    [consommer, '🌽', 'energie', 20],
    [consommer, '🌿', 'energie', 10],
    [consommer, '🌱', 'energie', 5],
    [consommer, '🐇', 'energie', 50],
  ],
  '🧔': [
    [fusionner, '👩', '👫'], //TODO TEST
    [developper, 'animer'], //TODO TEST
    [errer, '💀'], //TODO TEST
  ],
  '👩': [
    [fusionner, '🧔', '👫'], //TODO TESTdata
    [developper, 'animer'], //TODO TEST
    [errer, '💀'], //TODO TEST
  ],
  '👫': [
    [developper, 'animer'], //TODO TEST
    [errer, '💀'], //TODO TEST
  ],
  '👪': [
    [developper, 'animer'], //TODO TEST
    [errer, '💀'], //TODO TEST
  ],
  '🧍': [
    [developper, 'animer'], //TODO TEST
    [errer, '💀'], //TODO TEST
  ],
  '💀': [
    [muer, '▒', 15], //TODO passer aussi au dessus du sable
  ],
  '⛲': [
    [essaimer, 0.3, '💧'],
  ],
  '💧': [
    [errer, 0.05], //TODO smooth evanescence (transparency)
  ],
  '🌽': [
    [essaimer, 0.3, '🌱', '💧'], //TODO BUG 💧 continue à se déplacer quand transformé en 🌱
  ],
  '🌱': [
    [muer, '🌿', 15], // Si eau
  ],
  '🌿': [
    [muer, '🌽', 15], // Si eau
  ],
};

// INITIALISATIONS
// Modèles
Array.from('🧔👩⛲🌽').forEach((nomSymbole, i) => {
  ajouterObjet(0, i * 2, nomSymbole, {
    model: true,
  });
});

// Tests
ajouterObjet(14, 8, '⛲');
ajouterObjet(14, 9, '▒');
ajouterObjet(15, 9, '▒');
ajouterObjet(13, 8, '▒');
ajouterObjet(13, 7, '▒');
ajouterObjet(14, 7, '▒');
ajouterObjet(15, 8, '▒');

/* eslint-disable-next-line no-constant-condition */
if (1) {
  Array.from('🧔👩👫👪🧍💀').forEach((nomSymbole, i) => {
    ajouterObjet(8 + i * 3, 12, nomSymbole);
  });
  Array.from('⛲💧🌱🌿🌽▒🧱🏠').forEach((nomSymbole, i) => {
    ajouterObjet(11 + i * 3, 17, nomSymbole);
  });
}