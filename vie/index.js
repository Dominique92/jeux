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
    eau: 50,
    energie: 30,
    sable: 0,
    brique: 0,
  },
  boxSize = 16,
  gigue = () => Math.random() * 4 - 2;

let o = [],
  noIteration = 0,
  noIterationMax = 0,
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
//BEST Init data
//BEST Flag consommable
//BEST Consommer / chercher type de ressource + (quantité ?)

// ROUTINES
function pixelsFromXY(x, y) {
  return {
    left: (x - y / 2) * boxSize + gigue(),
    top: y * 0.866 * boxSize + gigue(),
  };
}

function xyFromPixels(left, top) {
  return {
    x: Math.round((left + top / 1.732) / boxSize),
    y: Math.round(top / 0.866 / boxSize),
  };
}

function xyFromEl(el) {
  if (typeof el === 'object') {
    const rect = el.getBoundingClientRect();

    return xyFromPixels(rect.left, rect.top);
  }
}

// Get or set case el
function caseEl(x, y, nomObjet, el) {
  // 7,7 : test case free
  // 7,7,🌿 : returns case
  // 7,7,🌿,el : fill the case

  if (typeof cases[x] === 'undefined')
    cases[x] = [];

  if (typeof cases[x][y] === 'undefined')
    cases[x][y] = [];

  if (typeof nomObjet === 'undefined')
    return cases[x][y];

  if (typeof el === 'object')
    cases[x][y][nomObjet] = el;

  return cases[x][y][nomObjet];
}

function deleteCase(el) {
  const xy = xyFromEl(el);
  delete caseEl(xy.x, xy.y)[el.innerHTML];
}

function pointsProches(el, deep, limit, searched) {
  // el : Autour de el
  // deep : Rayon (nb cases) autour de el
  // limit : nombre de points ramenés
  // searched : type d'objets 🌿 recherchés
  const xy = xyFromEl(el);

  let listeProches = [],
    dMin = 999999;

  if (xy) {
    // Randomize points order array
    for (let i = Math.random() * deltasProches.length; i > 0; i--)
      deltasProches.push(deltasProches.shift());

    // Recherche dans un rayon
    for (let d = 1; d < Math.min(deep, 5) + 1 && listeProches.length < limit; d++) {
      deltasProches.forEach(delta => {
        for (let i = 0; i < d && listeProches.length < limit; i++) {
          const nx = xy.x + d * delta[0] + i * delta[2],
            ny = xy.y + d * delta[1] + i * delta[3],
            pixelEln = pixelsFromXY(nx, ny),
            caseN = caseEl(nx, ny),
            elN = caseEl(nx, ny, searched);

          if (0 <= pixelEln.left && pixelEln.left < window.innerWidth - boxSize &&
            0 <= pixelEln.top && pixelEln.top < window.innerHeight - boxSize) {

            if ((!searched && !caseN) || // Cases libres
              (searched && elN)) // Le bon type d'objet
              listeProches.push([...delta, nx, ny]);
          }
        }
      });
    }

    // Recherche éloignés
    if (deep > 5 &&
      !listeProches.length &&
      typeof zones[searched] === 'object')
      zones[searched].forEach((col, noCol) => {
        col.forEach((ligne, noLigne) => {
          const deltaCol = noCol - Math.round(xy.x / 4),
            deltaLigne = noLigne - Math.round(xy.y / 4),
            dist = deltaCol * deltaCol + deltaLigne * deltaLigne;

          if (dMin > dist) {
            dMin = dist;
            listeProches = [
              [
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
}

// Move el to the x/y position if it's free
function deplacer(el, nx, ny, position, positionFinale, nomObjet, data) {
  const pos = position || pixelsFromXY(nx, ny);

  if (typeof nomObjet === 'string')
    el.innerHTML = nomObjet;

  if (!caseEl(nx, ny, el.innerHTML) && typeof el === 'object') {
    // Delete the previous location
    deleteCase(el);

    el.data = {
      ...el.data,
      ...data,
    };

    // Register in the grid at the new place
    if (nx && ny)
      caseEl(nx, ny, el.innerHTML, el)

    // Positionne dans la fenêtre
    el.style.left = pos.left + 'px';
    el.style.top = pos.top + 'px';
    el.style.display = 'initial';

    // Smoothly move the icon
    if (typeof positionFinale === 'object')
      setTimeout(() => { // Timeout ensures styles are applied before scrolling
        el.style.left = positionFinale.left + 'px';
        el.style.top = positionFinale.top + 'px';
      }, 0);

    el.noIteration = noIteration; // Pour éviter d'être relancé pendant cette itération
  }
}

function ajouter(x, y, symbol, data, position, positionFinale) {
  const el = document.createElement('div');

  deplacer(el, x, y, position, positionFinale, symbol, { // ajouter
    ...data,
    ...initData,
  });

  // Hold moves when hover
  el.onmouseover = () => {
    el.hovered = true;
    el.style.top = window.getComputedStyle(el).top;
    el.style.left = window.getComputedStyle(el).left;
  };
  el.onmouseout = () => {
    el.hovered = false;
  };

  // Mouse actions
  el.draggable = true;
  /* eslint-disable-next-line no-use-before-define */
  el.ondragstart = dragstart;
  /* eslint-disable-next-line no-use-before-define */
  el.onclick = clickOnDiv;

  document.body.appendChild(el);

  return el;
}

function supprimer(el) {
  const xy = xyFromEl(el);

  if (xy) {
    el.remove();
    deleteCase(el);
    return false;
  }
  return true;
}

function muer(el, nomObjet, age) {
  if (nomObjet &&
    el.data.age > (age || 0)) {
    el.innerHTML = nomObjet;
    el.data.age = 0;

    return false;
  }
  return true;
}

function errer(el) {
  const pp = pointsProches(el, 1, 1),
    xy = xyFromEl(el);

  if (xy && pp.length && el.data.energie > 0)
    return deplacer(el, xy.x + pp[0][0], xy.y + pp[0][1]);

  return true;
}

function rapprocher(el, nomObjet) {
  const pp = pointsProches(el, 50, 1, nomObjet),
    xy = xyFromEl(el);

  if (pp.length && xy)
    return deplacer(el, xy.x + pp[0][0], xy.y + pp[0][1]);

  return true;
}

function absorber(el, nomObjet, nomObjetFinal) {
  if (typeof el === 'object') {
    const pp = pointsProches(el, 1, 1, nomObjet);

    if (pp.length) {
      // Concatène les possessions
      el.data.eau += pp[0][6].data.eau;
      el.data.energie += pp[0][6].data.energie;
      el.data.sable += pp[0][6].data.sable;
      supprimer(pp[0][6]);

      if (nomObjetFinal) {
        el.innerHTML = nomObjetFinal;
        el.data.age = 0; // L'âge repart à 0 si l'objet change de type
      }

      return false;
    }
  }
  return true;
}

function consommer(el, typeObjet, typeRessource, quantiteRessource) { //TODO DELETE
  if (typeof el === 'object') {
    const pp = pointsProches(el, 1, 1, typeObjet);

    // Consomme
    if (el.data[typeRessource] < 20 &&
      typeof typeObjet !== 'undefined' &&
      pp.length) {
      el.data[typeRessource] += quantiteRessource;
      supprimer(pp[0][6]);

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
}

/*function WWWfusionner(el, nomObjet, nomObjetFinal) { //TODO DELETE : factoriser avec consommer / rapprocher ? //TODO TEST KO (manque rapprocher)
	if(typeof el === 'object'){
  const pl = pointsProches(el, 1, 1, nomObjet);

  if (pl.length) {
    if (typeof el.data.amour !== 'number')
      el.data.amour = 0;

    if (el.data.amour++ > 3) {
      supprimer(pp[0][6]);
      el.innerHTML = nomObjetFinal;
      el.data.amour = 0;
    }
    return false;
  }
  return true;
}}*/

function produire(el, probabilite, nomNouveau, nomRemplace) { //TODO TESTER
  if (typeof el === 'object') {
    // Si nomRemplace undefined, dans une case vide
    const pp = pointsProches(el, 1, 1, nomRemplace);

    if (pp.length && Math.random() < probabilite) {
      const elN = caseEl(pp[0][0], pp[0][1]);

      if (nomRemplace && elN)
        elN.innerHTML = nomNouveau;
      else
        ajouter(pp[0][0], pp[0][1], nomNouveau);

      return false;
    }
    return true;
  }
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

function rebuidCases() {
  const divEls = document.getElementsByTagName('div');

  cases = [];
  zones = [];
  for (const el of divEls)
    if (el.data && !el.data.model && // Pas les modèles
      !el.hovered) // Pas si le curseur est au dessus
  {
    const car = el.innerHTML,
      xy = xyFromEl(el),
      zx = Math.round(xy.x / 4),
      zy = Math.round(xy.y / 4);

    // Population des cases
    caseEl(xy.x, xy.y, car, el);

    // Population des zones
    if (typeof zones[car] === 'undefined')
      zones[car] = [];
    if (typeof zones[car][zx] === 'undefined')
      zones[car][zx] = [];
    if (typeof zones[car][zx][zy] === 'undefined')
      zones[car][zx][zy] = 0;
    zones[car][zx][zy]++;

    // Debug
    el.setAttribute('title', JSON.stringify(el.data).replace(/\{|"|\}/gu, '') || '-');
  }
}

function iterer() {
  if (noIteration < noIterationMax) {
    const debut = Date.now(),
      divEls = document.getElementsByTagName('div');

    // Exécution des actions
    noIteration++;
    for (const el of divEls)
      if (!el.data.model && // Pas les modèles
        !el.hovered && // Pas si le curseur est au dessus
        el.noIteration < noIteration) // Sauf s'il à déjà été traité à partir d'un autre
    {
      if (typeof o[el.innerHTML] === 'object')
        o[el.innerHTML].every(action =>
          action[0](el, ...action.slice(1)) // Stop when one action is completed & return false
        );
      el.data.age++;
      if (el.data.eau > 0) el.data.eau--;
      if (el.data.energie > 0) el.data.energie--;
    }

    rebuidCases();

    statsEl.innerHTML = noIteration + ': ' + (Date.now() - debut) + ' ms / ' + divEls.length + ' obj';
  }
}

// RÉPONSES SOURIS / CLAVIER
//TODO save/restaure

window.onload = rebuidCases;
self.setInterval(iterer, 1000);

function clickOnDiv(evt) {
  if (!evt.target.data.model) {
    if (o[evt.target.innerHTML] &&
      JSON.stringify(o[evt.target.innerHTML][0]).includes('animer'))
      errer(evt.target);
    else
      supprimer(evt.target);
  }
}

/* eslint-disable-next-line one-var */
let dragstartInfo = null;

function dragstart(evt) {
  rebuidCases();

  dragstartInfo = {
    el: evt.target,
    innerHTML: evt.target.innerHTML,
    style: {
      ...evt.target.style,
    },
    data: evt.target.data,
    offset: {
      x: evt.offsetX,
      y: evt.offsetY,
    },
  };

  if (!evt.target.data.model)
    // Efface temporairement l'icône de départ
    setTimeout(() => {
      evt.target.style.display = 'none';
    }, 0);

  helpEl.style.display = 'none';
}

document.ondragend = evt => { // Error
  dragstartInfo.el.style.display = 'initial';
  evt.preventDefault();
};

document.ondrop = evt => {
  const left = evt.x - dragstartInfo.offset.x,
    top = evt.y - dragstartInfo.offset.y,
    xy = xyFromPixels(left, top);

  rebuidCases();

  if (dragstartInfo.data.model) {
    // Création à partir du modèle
    const elN = ajouter(xy.x, xy.y, dragstartInfo.innerHTML);
    if (elN) {
      elN.style.left = left + 'px';
      elN.style.top = top + 'px';
    }
  } else {
    dragstartInfo.el.style.left = left + 'px';
    dragstartInfo.el.style.top = top + 'px';
  }

  evt.preventDefault();
};

document.onkeydown = evt => {
  if (evt.keyCode === 109) noIterationMax = 0;
  else if (evt.keyCode === 107) noIterationMax = 1000000;
  else if (evt.keyCode === 32) noIterationMax = noIteration < noIterationMax ? 0 : 1000000;
  else noIterationMax = noIteration + evt.keyCode % 48;
};

// SCÉNARIOS
//🧔👩👫👪🧍💀  ⛲💧 🌱🌿🌽 ▒🧱🏠  🦴🚧🌳🌾🐇🐀🥔🧒👶👷

/* eslint-disable-next-line one-var */
const vivant = [
  [rapprocher, '💧'], //TODO si besoin
  [absorber, '💧'],
  [rapprocher, '🌽'],
  [absorber, '🌽'],
  [rapprocher, '🌿'],
  [absorber, '🌿'],
  [rapprocher, '🌱'],
  [absorber, '🌱'],
];

o = {
  '🧔': [
    [rapprocher, '👩'],
    [absorber, '👩', '💏'],
    [absorber, '🌿'],
    ...vivant,
    [errer],
  ],
  '👩': [
    [rapprocher, '🧔'],
    [absorber, '🧔', '💏'],
    ...vivant,
    [errer],
  ],
  '💏': [
    ...vivant,
    [muer, '👫', 5],
    [errer],
  ],
  '👫': [
    ...vivant,
    [muer, '👪', 5],
    [errer],
  ],
  '👪': [
    ...vivant,
    [muer, '👫', 15],
    //TODO produire enfant
    [errer],
  ],
  '🧍': [
    ...vivant,
    //TODO muer 50% 🧔 50% 👩
    [errer],
  ],
  /* '👫🧍': [
    [errer],
  ],*/
  '💀': [
    [muer, '▒', 15],
  ],
  '⛲': [
    //[produire, 0.3, '💧'],
  ],
  '💧': [
    //BUG ![errer, 0.05],//TODO BUG laisse carc. //TODO smooth evanescence (transparency)
  ],
  '🌱': [
    [muer, '🌿', 15], //TODO Si eau
  ],
  '🌿': [
    [muer, '🌽', 15], //TODO Si eau
  ],
  '🌽': [
    //[produire, 0.3, '🌱', '💧'],
  ],
};

// INITIALISATIONS
// Modèles
Array.from('🧔👩⛲🌽').forEach((nomSymbole, i) => {
  ajouter(null, null, nomSymbole, {
    model: true,
  }, {
    left: 5,
    top: i * 2 * boxSize + 5,
  });
});

// Tests
ajouter(10, 8, '🧔');
ajouter(25, 8, '💧');
/* eslint-disable-next-line no-constant-condition */
if (1) {
  ajouter(14, 8, '👫🧍');
  ajouter(16, 8, '🧔👩');
  ajouter(14, 9, '▒');
  ajouter(15, 9, '▒');
  ajouter(13, 8, '▒');
  ajouter(13, 7, '▒');
  ajouter(14, 7, '▒');
  ajouter(15, 8, '▒');

  Array.from('🧔👩💏👫👪🧍💀').forEach((nomSymbole, i) => {
    ajouter(8 + i * 3, 12, nomSymbole);
  });
  Array.from('⛲💧🌱🌿🌽▒🧱🏠').forEach((nomSymbole, i) => {
    ajouter(11 + i * 3, 17, nomSymbole);
  });
}