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
  },
  boxSize = 16,
  gigue = () => Math.random() * 4 - 2;

let o = {},
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
function caseEl(x, y, el) {
  if (typeof cases[x] === 'undefined')
    cases[x] = [];

  if (typeof el === 'object')
    cases[x][y] = el;

  return cases[x][y];
}

function pointsProches(el, deep, limit, searched) {
  const xy = xyFromEl(el);

  let listeProches = [],
    dMin = 999999;

  if (xy) {
    // Randomize points order array
    for (let i = Math.random() * deltasProches.length; i > 0; i--)
      deltasProches.push(deltasProches.shift());

    for (let d = 1; d < Math.min(deep, 5) + 1 && listeProches.length < limit; d++) {
      /* eslint-disable-next-line no-loop-func */
      deltasProches.forEach(delta => {
        for (let i = 0; i < d && listeProches.length < limit; i++) {
          const nx = xy.x + d * delta[0] + i * delta[2],
            ny = xy.y + d * delta[1] + i * delta[3],
            elN = caseEl(nx, ny),
            pixel = pixelsFromXY(nx, ny);

          if (((!searched && !elN) || // Cases libres
              (!searched && elN && elN.innerHTML === '▒') || // Sable
              (searched && elN && elN.innerHTML === searched) // Objet trouvé
            ) &&
            0 <= pixel.left && pixel.left < window.innerWidth - boxSize &&
            0 <= pixel.top && pixel.top < window.innerHeight - boxSize
          )
            listeProches.push([...delta, nx, ny, elN]);
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
function communObjet(el, nomObjet, nx, ny, data, pixelDepart) {
  if (typeof el === 'object') {
    if (!caseEl(nx, ny) && typeof el === 'object') {
      const xyDebut = xyFromEl(el);

      // Register in the grid
      cases[nx][ny] = el;
      delete cases[xyDebut.x][xyDebut.y];

      // Update the data
      if (nomObjet)
        el.innerHTML = nomObjet;

      el.data = {
        ...el.data,
        ...data,
      };

      // Smoothly move the icon
      // Starting position
      if (typeof pixelDepart === 'object') {
        el.style.left = pixelDepart.left + 'px';
        el.style.top = pixelDepart.top + 'px';
      }

      // Destination position (after transition)
      setTimeout(() => { // Timeout ensures styles are applied before scrolling
        const positionPixels = pixelsFromXY(nx, ny);
        el.style.left = positionPixels.left + 'px';
        el.style.top = positionPixels.top + 'px';
      }, 0);

      el.noIteration = noIteration; // Pour éviter d'être relancé pendant cette itération

      return true;
    }
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

    return el; // Succes
  }
}

function supprimeObjet(el) {
  const xy = xyFromEl(el);

  if (xy) {
    el.remove(); //BEST smooth desaparence
    delete cases[xy.x][xy.y];
    return true; // Succes
  }
}

function deplaceObjet(el, nx, ny, pixelDepart) { // el vers nx, ny
  if (typeof el === 'object') {
    const nEl = caseEl(nx, ny);

    // S'il y avait du sable, prend le sable et sa place
    if (nEl && nEl.innerHTML === '▒') {
      supprimeObjet(nEl);
      el.data.sable++;
    }

    return communObjet(el, null, nx, ny, null, pixelDepart); // deplaceObjet
  }
}

// VERBES
function muer(el, nomObjet, age) { // Verbe
  if (nomObjet &&
    el.data.age > (age || 0)) {
    el.innerHTML = nomObjet;
    el.data.age = 0;

    return false;
  }
  return true;
}

function errer(el) { // Verbe
  const pp = pointsProches(el, 1, 1),
    xy = xyFromEl(el);

  if (xy && pp.length && el.data.energie > 0)
    return !deplaceObjet(el, xy.x + pp[0][0], xy.y + pp[0][1]);

  return true;
}

function rapprocher(el, nomObjet) { // Verbe
  const pp = pointsProches(el, 50, 1, nomObjet),
    xy = xyFromEl(el);

  if (pp.length && xy)
    return !deplaceObjet(el, xy.x + pp[0][0], xy.y + pp[0][1]);

  return true;
}

function absorber(el, nomObjet, nomObjetFinal) { // Verbe
  if (typeof el === 'object') {
    const pp = pointsProches(el, 1, 1, nomObjet);

    if (pp.length) {
      // Concatène les possessions
      el.data.eau += pp[0][6].data.eau;
      el.data.energie += pp[0][6].data.energie;
      el.data.sable += pp[0][6].data.sable;
      supprimeObjet(pp[0][6]);

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
      supprimeObjet(pp[0][6]);

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
      supprimeObjet(pp[0][6]);
      el.innerHTML = nomObjetFinal;
      el.data.amour = 0;
    }
    return false;
  }
  return true;
}}*/

function produire(el, probabilite, nomNouveau, nomRemplace) { // Verbe //TODO TESTER
  if (typeof el === 'object') {
    // Si nomRemplace undefined, dans une case vide
    const pp = pointsProches(el, 1, 1, nomRemplace);

    if (pp.length && Math.random() < probabilite) {
      const elN = caseEl(pp[0][0], pp[0][1]);

      if (nomRemplace && elN)
        elN.innerHTML = nomNouveau;
      else
        ajouteObjet(pp[0][0], pp[0][1], nomNouveau);

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

function developper(el, acteur) {
  if (typeof o[acteur] === 'object')
    return o[acteur].every(action =>
      action[0](el, ...action.slice(1)) // Stop when one action is completed
    );

  return true; // continue
}

function rebuidCases() {
  const divEls = document.getElementsByTagName('div');

  cases = [];
  zones = [];
  for (const el of divEls)
    if (!el.data.model && // Pas les modèles
      !el.hovered) // Pas si le curseur est au dessus
  {
    const car = el.innerHTML,
      xy = xyFromEl(el),
      zx = Math.round(xy.x / 4),
      zy = Math.round(xy.y / 4);

    // Population des cases
    caseEl(xy.x, xy.y, el);

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
      developper(el, el.innerHTML);
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
      supprimeObjet(evt.target);
  }
}

/* eslint-disable-next-line one-var */
let dragstartInfo = null;

function dragstart(evt) {
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

// Interdit les emplacements occupés
//TODO BUG le sable n'est pas interdit
document.ondragover = evt => {
  const xy = xyFromPixels(
    evt.x - dragstartInfo.offset.x,
    evt.y - dragstartInfo.offset.y,
  );

  if (!caseEl(xy.x, xy.y))
    evt.preventDefault();
};

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
    const elN = ajouteObjet(xy.x, xy.y, dragstartInfo.innerHTML);
    if (elN) {
      elN.style.left = left + 'px';
      elN.style.top = top + 'px';
    }
  } else {
    dragstartInfo.el.style.display = 'initial';
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
o = {
  animer: [
    [rapprocher, '💧'], //TODO si besoin
    [absorber, '💧'],
    [rapprocher, '🌽'],
    [absorber, '🌽'],
    [rapprocher, '🌿'],
    [absorber, '🌿'],
    [rapprocher, '🌱'],
    [absorber, '🌱'],
  ],
  '🧔': [
    [rapprocher, '👩'],
    [absorber, '👩', '💏'],
    [developper, 'animer'],
    [errer],
  ],
  '👩': [
    [rapprocher, '🧔'],
    [absorber, '🧔', '💏'],
    [developper, 'animer'],
    [errer],
  ],
  '💏': [
    [developper, 'animer'],
    [muer, '👫', 5],
    [errer],
  ],
  '👫': [
    [developper, 'animer'],
    [muer, '👪', 5],
    [errer],
  ],
  '👪': [
    [developper, 'animer'],
    //[muer, '▒', 15],  //TODO produite enfant
    [errer],
  ],
  '🧍': [
    [developper, 'animer'],
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
  const el = ajouteObjet(i, i * 2, nomSymbole, {
    model: true,
  });

  setTimeout(() => {
    el.style.left = '0';
    el.style.top = i * 2 * boxSize + 'px';
  }, 0);
});

// Tests
ajouteObjet(10, 8, '🧔');
ajouteObjet(25, 8, '👩');
/* eslint-disable-next-line no-constant-condition */
if (1) {
  ajouteObjet(14, 8, '👫🧍');
  ajouteObjet(16, 8, '🧔👩');
  ajouteObjet(14, 9, '▒');
  ajouteObjet(15, 9, '▒');
  ajouteObjet(13, 8, '▒');
  ajouteObjet(13, 7, '▒');
  ajouteObjet(14, 7, '▒');
  ajouteObjet(15, 8, '▒');

  Array.from('🧔👩💏👫👪🧍💀').forEach((nomSymbole, i) => {
    ajouteObjet(8 + i * 3, 12, nomSymbole);
  });
  Array.from('⛲💧🌱🌿🌽▒🧱🏠').forEach((nomSymbole, i) => {
    ajouteObjet(11 + i * 3, 17, nomSymbole);
  });
}