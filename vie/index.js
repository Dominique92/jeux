const statsEl = document.getElementById('stats'),
  helpEl = document.getElementById('help'),
  paradisEl = document.getElementById('paradis'),
  deltasProches = [
    [-1, 0, 0, -1],
    [1, 0, 0, 1],
    [0, 1, -1, -1],
    [0, -1, 1, 1],
    [1, 1, -1, 0],
    [-1, -1, 1, 0],
  ],
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

// ROUTINES (functions)
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
  const rect = el.getBoundingClientRect();

  return xyFromPixels(rect.left, rect.top);
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

  // Liste des objets dans une case
  if (typeof nomObjet === 'undefined')
    return cases[x][y];

  if (typeof el === 'object')
    cases[x][y][nomObjet] = el;

  return cases[x][y][nomObjet];
}

function deleteCase(el) {
  const xy = xyFromEl(el);

  delete caseEl(xy.x, xy.y, el.innerHTML);
}

function pointsProches(el, distance, limite, searched) {
  // el : Autour de el
  // distance : Rayon (nb cases) autour de el
  // limite : nombre de points ramenés
  // searched : type d'objets 🌿 recherchés
  const xy = xyFromEl(el);

  let listeProches = [],
    dMin = 999999;

  if (xy) {
    // Randomize points order array
    for (let i = Math.random() * deltasProches.length; i > 0; i--)
      deltasProches.push(deltasProches.shift());

    // Recherche dans un rayon
    for (let d = 1; d < Math.min(~~distance, 5) + 1 && listeProches.length < limite; d++) {
      deltasProches.forEach(delta => {
        for (let i = 0; i < d && listeProches.length < limite; i++) {
          const nx = xy.x + d * delta[0] + i * delta[2],
            ny = xy.y + d * delta[1] + i * delta[3],
            pixelEln = pixelsFromXY(nx, ny),
            nbCasesN = Object.keys(caseEl(nx, ny)).length,

            elN = caseEl(nx, ny, searched);

          if (0 <= pixelEln.left && pixelEln.left < window.innerWidth - boxSize &&
            0 <= pixelEln.top && pixelEln.top < window.innerHeight - boxSize) {

            if ((!searched && !nbCasesN) || // Cases libres
              (searched && elN)) // Le bon type d'objet
              listeProches.push([...delta, nx, ny]);
          }
        }
      });
    }

    // Recherche éloignés
    if (distance && distance > 5 &&
      !listeProches.length &&
      typeof zones[searched] === 'object')
      zones[searched].forEach((col, noCol) => {
        col.forEach((ligne, noLigne) => {
          const deltaCol = noCol - Math.round(xy.x / 4),
            deltaLigne = noLigne - Math.round(xy.y / 4),
            dist = deltaCol * deltaCol + deltaLigne * deltaLigne;

          if (dMin > dist && (deltaCol || deltaLigne)) {
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
    if (listeProches)

      return listeProches;
  }
}

// VERBES (functions)
// Transformer un type en un autre
function muer(el, nomObjet) { // 1 -> 1
  el.innerHTML = nomObjet;
  el.classList = o[nomObjet][o[nomObjet].length - 1].type;
  el.data.age = 0; // L'âge repart à 0 si l'objet change de type //TODO paramètre

  return false;
}

// Move el to the x/y position if it's free
function deplacer(el, nx, ny, position, positionFinale, nomObjet, data) { // 1 -> 1
  const pos = position || pixelsFromXY(nx, ny);

  if (!caseEl(nx, ny, el.innerHTML)) {
    // Delete the previous location
    deleteCase(el);

    el.data = {
      ...el.data,
      ...data,
    };

    if (typeof nomObjet === 'string')
      muer(el, nomObjet);

    // Register in the grid at the new place
    if (nx && ny)
      caseEl(nx, ny, el.innerHTML, el)

    // Positionne dans la fenêtre
    el.style.left = pos.left + 'px';
    el.style.top = pos.top + 'px';

    // Smoothly move the icon
    if (typeof positionFinale === 'object')
      setTimeout(() => { // Timeout ensures styles are applied before scrolling
        el.style.left = positionFinale.left + 'px';
        el.style.top = positionFinale.top + 'px';
      }, 0);

    el.noIteration = noIteration; // Pour éviter d'être relancé pendant cette itération
  }
}

function ajouter(x, y, symboleType, data, position, positionFinale) { // 0 -> 1
  const el = document.createElement('div'),
    newData = {
      ...data,
      ...o[symboleType][o[symboleType].length - 1],
    };

  delete newData.type;
  deplacer(el, x, y, position, positionFinale, symboleType, newData); // ajouter

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

function supprimer(el) { // 1 -> 0
  el.remove();
  deleteCase(el);
}

function errer(el) { // 1 -> 1
  const pp = pointsProches(el, 1, 1); //TODO aussi sur la terre

  if (pp.length) {
    const xy = xyFromEl(el),
      xn = xy.x + pp[0][0], //TODO en biais
      yn = xy.y + pp[0][1];

    if (pp.length &&
      !Object.keys(caseEl(xn, yn)).length)
      return deplacer(el, xn, yn);
  }
  return true;
}

function rapprocher(el, nomObjet, distance) { // 1 -> 1 (jusqu'à la même case)
  const pp = pointsProches(el, distance || 100, 1, nomObjet),
    xy = xyFromEl(el);

  if (xy && pp.length)
    return deplacer(el, xy.x + pp[0][0], xy.y + pp[0][1]); //TODO en biais

  return true;
}

function produire(el, nomNouveau) { // 1 -> 2 (dans la même case)
  const xy = xyFromEl(el),
    existe = caseEl(xy.x, xy.y, nomNouveau);

  if (!existe) {
    ajouter(xy.x, xy.y, nomNouveau);
    return false;
  }

  return true;
}

function absorber(el, nomObjet, nomObjetFinal) { // 2 -> 1 (dans la même case)
  //console.log(...arguments); //TODO TEST
  const xy = xyFromEl(el),
    trouveEl = caseEl(xy.x, xy.y, nomObjet);

  if (trouveEl) {
    // Concatène les possessions
    el.data.eau = ~~el.data.eau + 1;
    el.data.energie = ~~el.data.energie + 1;
    el.data.sable = ~~el.data.sable + 1;
    supprimer(trouveEl);

    if (nomObjetFinal)
      muer(el, nomObjetFinal);

    return false;
  }
  return true;
}

/* eslint-disable-next-line no-unused-vars */
function rencontrer( /*el, nomObjetRencontre, nomsObjetsFinaux*/ ) { // 2 -> 2 (dans la même case) //TODO DEVELOPPER
  console.log(...arguments); //TODO TEST
  //const nfo = nomsObjetsFinaux.split(' ');
}

// ACTIVATION (functions)
function rebuidCases() {
  const divEls = document.getElementsByTagName('div');

  cases = [];
  zones = [];
  for (const el of divEls)
    if (el.data && !el.data.model && // Pas les modèles
      !el.hovered) // Pas si le curseur est au dessus
  {
    const symboleType = el.innerHTML,
      nomType = o[symboleType][o[symboleType].length - 1].type,
      xy = xyFromEl(el),
      zx = Math.round(xy.x / 4),
      zy = Math.round(xy.y / 4),
      d = {};

    // Population des cases
    caseEl(xy.x, xy.y, symboleType, el);

    // Population des zones
    if (typeof zones[symboleType] === 'undefined')
      zones[symboleType] = [];
    if (typeof zones[symboleType][zx] === 'undefined')
      zones[symboleType][zx] = [];
    if (typeof zones[symboleType][zx][zy] === 'undefined')
      zones[symboleType][zx][zy] = 0;
    zones[symboleType][zx][zy]++;

    // Debug
    Object.keys(el.data).forEach(key => {
      if (el.data[key])
        d[key] = el.data[key];
    });

    el.setAttribute('title', (
      nomType + ' ' +
      JSON.stringify(d).replace(/\{|"|\}/gu, '') +
      (Object.keys(d).length ? ',' : '') +
      'pos:' + xy.x + ',' + xy.y
    ));
  }
}

function iterer() {
  if (noIteration < noIterationMax) {
    const debut = Date.now(),
      divEls = document.getElementsByTagName('div');

    // Exécution des actions
    noIteration++;
    for (const el of divEls)
      if (el.data && !el.data.model && // Pas les modèles
        !el.hovered && // Pas si le curseur est au dessus
        el.noIteration < noIteration) // Sauf s'il à déjà été traité à partir d'un autre
    {
      if (typeof o[el.innerHTML] === 'object')
        o[el.innerHTML].slice(0, -1).every(action => {
          // Condition to the last argument (function)
          const conditionFunction = action[action.length - 1],
            executionFunction = action[action.length - 2];

          if (action.length > 1 && // S'il y a assez d'arguments
            typeof conditionFunction === 'function' && // Si le dernier est une fonction
            !conditionFunction(el.data) // Et que le test est négatif
          )
            return true; // On n'exécute pas l'action et on passe au suivant

          // Execute action
          /* eslint-disable-next-line one-var */
          const statusExec = action[0](el, ...action.slice(1));

          if (statusExec &&
            action.length > 2 &&
            typeof executionFunction === 'function'
          )
            executionFunction(el.data);

          // Stop when one action is completed & return false
          return statusExec;
        });
      el.data.age = ~~el.data.age + 1;

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
      JSON.stringify(o[evt.target.innerHTML][0] || []).includes('animer'))
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
      paradisEl.appendChild(evt.target);
    }, 0);

  helpEl.style.display = 'none';
}

document.ondragover = evt => {
  // Autorise drop partout
  evt.preventDefault();
};

document.ondragend = evt => { // Drag error
  document.body.appendChild(evt.target);

  evt.preventDefault();
};

document.ondrop = evt => {
  const left = evt.x - dragstartInfo.offset.x,
    top = evt.y - dragstartInfo.offset.y,
    xy = xyFromPixels(left, top);

  if (dragstartInfo.data.model) {
    // Création à partir du modèle
    const elN = ajouter(xy.x, xy.y, dragstartInfo.innerHTML);
    if (elN) {
      document.body.appendChild(elN);
      elN.style.left = left + 'px';
      elN.style.top = top + 'px';
    }
  } else {
    document.body.appendChild(dragstartInfo.el);
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
//🧔👩👫👪🧍💀  ⛲💧 🌱🌿🌽▓ ▒🧱🏠  🦴🚧🌳🌾🐇🐀🥔🧒👶👷🔥💦
//🍄🥑🍆🥔🥕🌽🌶️🥒🥬🥦🧄🧅🥜🌰🍄‍🍇🍈🍉🍊🍋🍋‍🍌🍍🥭🍎🍏🍐🍑🍒🍓🥝🍅🥥🎕💮🌸❀
/*
const consommer = [rapprocher, absorber];
  vivant = [
    [consommer, '💧', 'eau'],
    [consommer, '🌽', 'energie'],
    [consommer, '🌿', 'energie'],
    [consommer, '🌱', 'energie'],
  ];
*/

o = {
  // Cycle de l'eau
  '⛲': // Scénario du type d'objet
    [ // Action élémentaire du scénario
      [produire, // Verbe à exécuter
        '💧', // Argument
        () => { // Fonction à exécuter aprés avoir appliqué la règle la règle
          console.log('Coucou'); //TODO
        },
        () => Math.random() < 0.3 // Test d'applicabilité de la règle
      ],
      { // Init des data quand on crée
        type: 'Fontaine',
      },
    ],
  '💧': [
    [muer, '💦', d => d.eau < 10],
    [rapprocher, '❀', 3],
    [rapprocher, '🌱', 3],
    [rapprocher, '🌿', 3],
    [rapprocher, '🌽', 3],
    [errer], {
      type: 'Eau',
      eau: 100,
    },
  ],
  '💦': [
    [supprimer, d => d.eau <= 0],
    [errer],
    {
      type: 'Eau',
    },
  ],
  //////////////////////////TODO
  // Cycle des plantes
  '❀': [
    //[muer, '▒', d => d.eau <= 0], //TODO sauf si déjà de la terre
    //[muer, '🌱', d => d.age > 10],
    [rapprocher, '💧', 3],
    [absorber, '💧', '🌱'],
    [rapprocher, '▒', 3],
    [absorber, '▒', '🌱'],
    [supprimer, d => d.age > 10],
    [errer],
    {
      type: 'Graine',
      eau: 40,
    },
  ],
  '🌱': [
    [absorber, '💧'],
    [absorber, '💦'],
    [muer, '▒', d => d.eau <= 0], //TODO sauf si déjà de la terre
    [muer, '🌿', d => d.age > 20],
    {
      type: 'Pousse',
    },
  ],
  '🌿': [
    [absorber, '💧'],
    [absorber, '💦'],
    [muer, '▒', d => d.eau <= 0], //TODO sauf si déjà de la terre
    [muer, '🌽', d => d.age > 20],
    {
      type: 'Plante',
    },
  ],
  '🌽': [
    [absorber, '💧'],
    [absorber, '💦'],
    [muer, '▒', d => d.eau <= 0], //TODO sauf si déjà de la terre
    [produire, '❀', () => Math.random() < 0.3],
    {
      type: 'Mais',
    },
  ],
  '▒': [{
    type: 'Terre',
  }, ],
  '▓': [{
    type: 'Herbe',
  }, ],
  // Cycle des humains
  '🧔': [
    [rapprocher, '👩'],
    [absorber, '👩', '💏'],
    //...vivant,
    [errer],
    {
      type: 'Homme',
    },
  ],
  '👩': [
    [rapprocher, '🧔'],
    [absorber, '🧔', '💏'],
    //...vivant,
    [errer],
    {
      type: 'Femme',
    },
  ],
  '💏': [
    //...vivant,
    [muer, '👫', 5],
    [errer],
    {
      type: 'Amoureux',
    },
  ],
  '👫': [
    //...vivant,
    [muer, '👪', 5],
    [errer],
    {
      type: 'Couple',
    },
  ],
  '👪': [
    //...vivant,
    [muer, '👫', 15],
    //TODO produire enfant
    [errer],
    {
      type: 'Famille',
    },
  ],
  '🧍': [
    //...vivant,
    //TODO muer 50% 🧔 50% 👩
    [errer],
    {
      type: 'Enfant',
    },
  ],
  '💀': [
    [muer, '▒', 15],
    {
      type: 'Mort',
    },
  ],
  '🧱': [{
    type: 'Briques',
  }, ],
  '🏠': [{
    type: 'Maison',
  }, ],
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
ajouter(14, 8, '⛲');
/*
  Array.from('⛲💧🌱🌿🌽▒▓').forEach((nomSymbole, i) => {
    ajouter(12 + i * 3, 8, nomSymbole);
  });
Object.keys(o).forEach((nomSymbole, i) => {
  ajouter(10 + i, 8 + i % 3 * 4, nomSymbole);
});
ajouter(14, 8, '🌽');
ajouter(22, 8, '⛲');
ajouter(18, 16, '⛲');
ajouter(26, 16, '🌽');
 
  ajouter(14, 8, '⛲');
  ajouter(14, 9, '🧱');
  ajouter(15, 9, '🧱');
  ajouter(13, 8, '🧱');
  ajouter(13, 7, '🧱');
  ajouter(14, 7, '🧱');
  ajouter(15, 8, '🧱');

  Array.from('🧔👩💏👫👪🧍💀').forEach((nomSymbole, i) => {
    ajouter(8 + i * 3, 12, nomSymbole);
  });
*/