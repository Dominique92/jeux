const helpEl = document.getElementById('help'),
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
    eau: 50,
    energie: 30,
    sable: 0,
  },
  boxSize = 16;

let o = {},
  noIteration = 0,
  cases = [],
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
function pixelsFromXY(x, y, gigue) {
  return {
    left: (x + (gigue ? Math.random() / 4 - 0.125 - y / 2 : 0)) * boxSize,
    top: (y * 0.866 + (gigue ? Math.random() / 4 - 0.125 : 0)) * boxSize,
  };
}

function xyFromPixels(x, y) {
  return {
    x: parseInt((x + y / 2) / boxSize, 10),
    y: parseInt(y / 0.866 / boxSize, 10),
  };
}

function caseEl(a, b) { // || [x,y] || {x:x,y:y} || {x:x,y:y}, el
  const x = a[0] || a.x || a,
    y = a[0] || a.y || b;

  if (typeof cases[x] === 'undefined')
    cases[x] = [];

  if (typeof b === 'object')
    cases[x][y] = b;

  return cases[x][y];
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
          elN = caseEl(nx, ny),
          pixel = pixelsFromXY(nx, ny);

        if (((!searched && !elN) || // Cases libres
            (!searched && elN && elN.innerHTML === '▒') || // Sable //TODO KO
            (searched && elN && elN.innerHTML === searched) // Objet trouvé
          ) &&
          0 <= pixel.left && pixel.left < window.innerWidth - boxSize &&
          0 <= pixel.top && pixel.top < window.innerHeight - boxSize
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

// Move el to the x/y position if it's free
function communObjet(el, nomObjet, nx, ny, data, xDepart, yDepart) {
  //TODO ??? pouvoir arriver dans la même case (et absorber à la fin)
  if (!caseEl(nx, ny) && typeof el === 'object') {
    // Register in the grid
    cases[nx][ny] = el;

    // Update the data
    if (nomObjet)
      el.innerHTML = nomObjet;

    el.data = {
      ...el.data,
      x: nx,
      y: ny,
      ...data,
      noIteration: noIteration, // Pour éviter d'être relancé pendant cette itération
    };

    // Starting position
    if (typeof xDepart === 'number' && typeof yDepart === 'number') {
      const positionxDepart = pixelsFromXY(xDepart || nx, yDepart || ny);
      el.style.left = positionxDepart.left + 'px';
      el.style.top = positionxDepart.top + 'px';
    }

    // Timeout ensures styles are applied before scrolling
    setTimeout(() => {
      // Destination position (after transition)
      const positionPixels = pixelsFromXY(nx, ny, !(data && data.model));
      el.style.left = positionPixels.left + 'px';
      el.style.top = positionPixels.top + 'px';
    }, 0);

    return cases[nx][ny];
  }
}

function ajouteObjet(x, y, symbol, data) {
  const el = document.createElement('div');

  if (communObjet(el, symbol, x, y, { // ajouteObjet
      ...data,
      ...initData,
    })) {
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

    return true; // Succes
  }
}

function supprimeObjet(x, y) {
  if (caseEl(x, y)) {
    cases[x][y].remove(); //TODO smooth desaparence
    delete cases[x][y];
    return true; // Succes
  }
}

function deplaceObjet(x, y, nx, ny) { // De x, y vers nx, ny
  const el = caseEl(x, y),
    nEl = caseEl(nx, ny);

  if (nEl && nEl.innerHTML === '▒') {
    supprimeObjet(nx, ny);
    el.data.sable++;
  }

  if (communObjet(el, null, nx, ny)) { // deplaceObjet
    delete cases[x][y];
    return true; // Succes
  }
}

// VERBES
function muer(el, nomObjet, age) {
  if (nomObjet &&
    el.data.age > (age || 0)) {
    el.innerHTML = nomObjet;
    el.data.age = 0;

    return false;
  }
  return true;
}

function errer(el, /*fin*/ ) {
  const pl = pointsProches(el, 1, 1);

  /*if (fin && el.data.eau <= 0)//TODO dans consommer
    return muer(el, fin);*/

  // Erre
  if (pl.length && el.data.energie > 0)
    return !deplaceObjet(el.data.x, el.data.y, el.data.x + pl[0][2], el.data.y + pl[0][3]);

  return true;
}

function rapprocher(el, nomObjet) { //TODO BUG blocage position -30°
  const pm = pointsProches(el, 5, 1, nomObjet, true);

  if (pm.length &&
    deplaceObjet(el.data.x, el.data.y, el.data.x + pm[0][2], el.data.y + pm[0][3]))
    return false;

  return true;
}

function absorber(el, nomObjet, nomObjetFinal) {
  const pp = pointsProches(el, 1, 1, nomObjet);

  //TODO absorber quand déjà dans la même case
  if (pp.length) {
    el.innerHTML = nomObjetFinal;
    supprimeObjet(pp[0][0], pp[0][1]);
  }
  return true;
}

function consommer(el, typeObjet, typeRessource, quantiteRessource) { //TODO DELETE
  const pl = pointsProches(el, 1, 1, typeObjet);

  // Consomme
  if (el.data[typeRessource] < 20 &&
    typeof typeObjet !== 'undefined' &&
    pl.length) {
    el.data[typeRessource] += quantiteRessource;
    supprimeObjet(pl[0][0], pl[0][1]);

    return false;
  }

  //TODO -> rapprocher
  /*/ Cherche
  if (el.data[typeRessource] < 10 &&
    typeof typeObjet !== 'undefined') {
    if (!rapprocher(el, typeObjet)) //TODO TEST

      return false;
  }*/

  return true;
}

/*function WWWfusionner(el, nomObjet, nomObjetFinal) { //TODO DELETEb : factoriser avec consommer / rapprocher ? //TODO TEST KO (manque rapprocher)
  const pl = pointsProches(el, 1, 1, nomObjet);

  if (pl.length) {
    if (typeof el.data.amour !== 'number')
      el.data.amour = 0;

    if (el.data.amour++ > 3) {
      supprimeObjet(pl[0][0], pl[0][1]);
      el.innerHTML = nomObjetFinal;
      el.data.amour = 0;
    }
    return false;
  }
  return true;
}*/

function produire(el, probabilite, nomNouveau, nomRemplace) { //TODO TEST
  // Si nomRemplace undefined, dans une case vide
  const pp = pointsProches(el, 1, 1, nomRemplace);

  if (pp.length && Math.random() < probabilite) {
    const elN = caseEl(pp[0]);

    if (nomRemplace && elN)
      elN.innerHTML = nomNouveau;
    else
      ajouteObjet(pp[0][0], pp[0][1], nomNouveau);

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
  const debut = Date.now(),
    divEls = document.getElementsByTagName('div');

  // Reconstruction des tables
  cases = [];
  zones = [];
  for (const el of divEls)
    if (!el.data.model && // Pas les modèles
      !el.data.hovered) // Pas si le curseur est au dessus
  {
    const car = el.innerHTML,
      roundX = Math.round(el.data.x / 4),
      roundY = Math.round(el.data.y / 4);

    // Population des cases
    caseEl(el.data, el);

    // Population des zones
    if (typeof zones[car] === 'undefined')
      zones[car] = [];
    if (typeof zones[car][roundX] === 'undefined')
      zones[car][roundX] = [];
    if (typeof zones[car][roundX][roundY] === 'undefined')
      zones[car][roundX][roundY] = 0;
    zones[car][roundX][roundY]++;
  }

  // Exécution des actions
  noIteration++;
  for (const el of divEls)
    if (!el.data.model && // Pas les modèles
      !el.data.hovered && // Pas si le curseur est au dessus
      el.data.noIteration < noIteration) // Sauf s'il à déjà été traité à partir d'un autre
  {
    developper(el, el.innerHTML);
    el.data.age++;
    if (el.data.eau) el.data.eau--;
    if (el.data.energie) el.data.energie--;
  }

  // Debug
  for (const el of divEls) {
    const data = {
      ...el.data
    };
    delete data.x;
    delete data.y;
    delete data.noIteration;
    delete data.hovered;
    el.setAttribute('title', JSON.stringify(data).replace(/\{|"|\}/gu, '') || '-');
  }

  console.log(noIteration + ': ' + (Date.now() - debut) + ' ms / ' + divEls.length + ' obj');
}

// RÉPONSES SOURIS / CLAVIER
//TODO save/restaure

/* eslint-disable-next-line one-var */
const timer = self.setInterval(iterer, 1000);

document.addEventListener('keydown', evt => {
  if (evt.key === 's')
    self.clearInterval(timer);
});

function click(evt) {
  if (!evt.target.data.model) {
    if (JSON.stringify(o[evt.target.innerHTML][0]).includes('animer'))
      errer(evt.target);
    else
      supprimeObjet(evt.target.data.x, evt.target.data.y);
  }
}

function dragstart(evt) {
  //const vvv = pixelsFromXY(evt );
  //console.log(vvv);

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
    xy = xyFromPixels(evt.x, evt.y);
  //TODO smooth end of move

  if (data.model)
    ajouteObjet(xy.x, xy.y, symbol);
  else
    deplaceObjet(data.x, data.y, xy.x, xy.y);

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
    [rapprocher, '👩'],
    [absorber, '👩', '💏'],
    //  [developper, 'animer'], 
    [errer, '💀'],
  ],
  '👩': [
    [rapprocher, '🧔'],
    [absorber, '🧔', '💏'],
    //[developper, 'animer'], 
    [errer, '💀'],
  ],
  '👫': [
    [developper, 'animer'],
    [errer, '💀'],
  ],
  '👪': [
    [developper, 'animer'],
    [errer, '💀'],
  ],
  '🧍': [
    [developper, 'animer'],
    [errer, '💀'],
  ],
  '👫🧍': [
    [errer, '💀'],
  ],
  '💀': [
    [muer, '▒', 15], //TODO passer aussi au dessus du sable
  ],
  '⛲': [
    [produire, 0.3, '💧'],
  ],
  '💧': [
    //BUG ![errer, 0.05], //TODO smooth evanescence (transparency)
  ],
  '🌽': [
    [produire, 0.3, '🌱', '💧'], //TODO BUG 💧 continue à se déplacer quand transformé en 🌱
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
  ajouteObjet(0, i * 2, nomSymbole, {
    model: true,
  });
});

// Tests
/*
ajouteObjet(14, 8, '🧔');
ajouteObjet(22, 8, '👩');
//ajouteObjet(14, 8, '👫🧍');
//ajouteObjet(16, 8, '🧔👩');
ajouteObjet(14, 9, '▒');
ajouteObjet(15, 9, '▒');
ajouteObjet(13, 8, '▒');
ajouteObjet(13, 7, '▒');
ajouteObjet(14, 7, '▒');
ajouteObjet(15, 8, '▒');
 */

/* eslint-disable-next-line no-constant-condition */
if (1) {
  Array.from('🧔👩💏👫👪🧍💀').forEach((nomSymbole, i) => {
    ajouteObjet(8 + i * 3, 12, nomSymbole);
  });
  Array.from('⛲💧🌱🌿🌽▒🧱🏠').forEach((nomSymbole, i) => {
    ajouteObjet(11 + i * 3, 17, nomSymbole);
  });
}