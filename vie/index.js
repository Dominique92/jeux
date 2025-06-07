const statsEl = document.getElementById('stats'),
  helpEl = document.getElementById('help'),
  paradisEl = document.getElementById('paradis'),
  deltasProches = [ //BEST déplacer en biais
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
  dragstartInfo = null,
  noIteration = 0,
  noIterationMax = 0,
  cases = [],
  zones = [];

/*********************
 * Terrain : toute la fenêtre <body>
 * objet : <div>unicode</div> rattaché au <body> déplaçable
 * typeObjet : type d'objet (un caractère unicode)
 * cases : tableau à 2 dimensions dont chaque case pointe sur 0 ou 1 objet max
 * zones : un tableau à 2 dimensions par type d'objet représentant leur nombre dans chaque carré de n * n cases
 *
 * Routine : fonction qui manipule les données du programme
 * Verbe : fonction à exécuter qui réalise une action sur un objet
 * Scenario : liste d'actions ou de scenarios à exécuter dans l'ordre.
 *   La première ayant abouti interrompt la liste
 */

// ROUTINES (functions)
function pixelsFromXY(x, y) {
  return {
    left: (x - y / 2) * boxSize + gigue(),
    top: y * 0.866 * boxSize + gigue(),
  };
}

function xyFromPixels(position) {
  return {
    x: Math.round((position.left + position.top / 1.732) / boxSize),
    y: Math.round(position.top / 0.866 / boxSize),
  };
}

function xyFromEl(el) {
  return xyFromPixels(el.getBoundingClientRect());
}

// Get or set case el
function caseEl(x, y, symboleType, el) {
  // 7,7 : test case free
  // 7,7,🌿 : returns case
  // 7,7,🌿,el : fill the case

  if (typeof cases[x] === 'undefined') {
    if (el) cases[x] = [];
    else return [];
  }

  if (typeof cases[x][y] === 'undefined') {
    if (el) cases[x][y] = [];
    else return [];
  }

  // Liste des objets dans une case
  if (typeof symboleType === 'undefined')
    return cases[x][y];

  if (typeof el === 'object')
    cases[x][y][symboleType] = el;

  return [];
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
              listeProches.push([...delta, nx, ny, d]);
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
function muer(el, symboleType) { // 1 -> 1
  el.innerHTML = symboleType;
  if (o[symboleType]) {
    el.classList = o[symboleType][o[symboleType].length - 1].type;
    el.data.age = 0; // L'âge repart à 0 si l'objet change de type
  }

  return true; // Succés
}

// Move el to the x/y position if it's free
function deplacer(el, nx, ny, position) { // 1 -> 1
  if (!caseEl(nx, ny, el.innerHTML).length) {
    //TODO Remove the previous location from the cases

    // Register in the grid at the new place
    if (nx && ny)
      caseEl(nx, ny, el.innerHTML, el)


    if (position) { // On y va direct
      el.style.left = position.left + 'px';
      el.style.top = position.top + 'px';
    } else {
      // Smoothly move the icon
      setTimeout(() => { // Timeout ensures styles are applied before scrolling
        const positionCase = pixelsFromXY(nx, ny);

        el.style.left = positionCase.left + 'px';
        el.style.top = positionCase.top + 'px';
      }, 0);
    }

    el.noIteration = noIteration; // Pour éviter d'être relancé pendant cette itération

    document.body.appendChild(el); // Mets l'élément en visibilité si nécéssaire

    return true;
  }
}

function ajouter(x, y, symboleType, position) { // 0 -> 1
  const el = document.createElement('div'),
    elStyle = window.getComputedStyle(el);

  if (o[symboleType]) {
    el.data = {
      ...o[symboleType][o[symboleType].length - 1],
    };
    delete el.data.type;
  }

  muer(el, symboleType);
  deplacer(el, x, y, position); // De ajouter

  // Mouse actions
  /* eslint-disable-next-line no-use-before-define */
  el.ondragstart = dragstart;
  el.draggable = true;

  // Hold moves when hover
  el.onmouseover = () => {
    el.hovered = true;
    el.style.top = elStyle.top;
    el.style.left = elStyle.left;
  };
  el.onmouseout = () => {
    el.hovered = false;
  };

  document.body.appendChild(el);

  return el;
}

function supprimer(el) { // 1 -> 0
  el.remove();

  return true;
}

function errer(el) { // 1 -> 1
  const pp = pointsProches(el, 1, 1); //TODO aussi sur la terre

  if (pp.length) {
    const xy = xyFromEl(el),
      xn = xy.x + pp[0][0],
      yn = xy.y + pp[0][1];

    if (!Object.keys(caseEl(xn, yn)).length)
      return deplacer(el, xn, yn); // De errer
  }
}

function rapprocher(el, symboleType, distance) { // 1 -> 1 (jusqu'à la même case) //TODO TEST
  const pp = pointsProches(el, distance || 100, 1, symboleType);

  if (pp.length) {
    const xy = xyFromEl(el),
      //caseNel=caseEl(xn, yn),
      xn = xy.x + pp[0][0],
      yn = xy.y + pp[0][1];

    //TODO if(caseNel[symboleType ])	  
    //caseNel.noIteration = noIteration;// Pour éviter qu'il n'évolue lors de la même itération

    return deplacer(el, xn, yn); // De rapprocher
  }
}

function produire(el, nomNouveau) { // 1 -> 2 (dans la même case)
  const xy = xyFromEl(el),
    existe = caseEl(xy.x, xy.y, nomNouveau);

  if (!existe)
    return ajouter(xy.x, xy.y, nomNouveau);
}

function absorber(el, symboleType, symboleTypeFinal) { // 2 -> 1 (dans la même case)
  //console.log(...arguments); //TODO TEST absorber
  const xy = xyFromEl(el),
    trouveEl = caseEl(xy.x, xy.y, symboleType);

  if (trouveEl) {
    for (const property in trouveEl.data) {
      el.data[property] = ~~el.data[property] + trouveEl.data[property]
      el.data.age = 0;

      supprimer(trouveEl);

      if (symboleTypeFinal)
        return muer(el, symboleTypeFinal);
    }
  }
}

/* eslint-disable-next-line no-unused-vars */
function rencontrer( /*el, symboleTypeRencontre, nomsObjetsFinaux*/ ) { // 2 -> 2 (dans la même case) //TODO DEVELOPPER
  console.log(...arguments); //TODO TEST rencontrer
  //const nfo = nomsObjetsFinaux.split(' ');
}

// ACTIVATION (functions)
function rebuidCases() {
  const divEls = document.getElementsByTagName('div');

  cases = [];
  zones = [];
  for (const el of divEls)
    if (el.data && !el.isModel && // Pas les modèles
      !el.hovered) // Pas si le curseur est au dessus
  {
    const xy = xyFromEl(el),
      zx = Math.round(xy.x / 4),
      zy = Math.round(xy.y / 4),
      d = {};

    // Population des cases
    caseEl(xy.x, xy.y, el.innerHTML, el);

    // Population des zones
    if (typeof zones[el.innerHTML] === 'undefined')
      zones[el.innerHTML] = [];
    if (typeof zones[el.innerHTML][zx] === 'undefined')
      zones[el.innerHTML][zx] = [];
    if (typeof zones[el.innerHTML][zx][zy] === 'undefined')
      zones[el.innerHTML][zx][zy] = 0;
    zones[el.innerHTML][zx][zy]++;

    // Debug
    Object.keys(el.data).forEach(key => {
      if (el.data[key])
        d[key] = el.data[key];
    });

    el.setAttribute('title', (
      o[el.innerHTML][o[el.innerHTML].length - 1].type + ' ' +
      JSON.stringify(d).replace(/\{|"|\}/gu, '') +
      (window.location.search ? ' ' + xy.x + ',' + xy.y : '')
    ));
  }
}

function iterer() {
  if (noIteration++ < noIterationMax || !window.location.search) {
    const debut = Date.now(),
      divEls = document.getElementsByTagName('div');

    // Exécution des actions
    for (const el of divEls)
      if (el.data && !el.isModel && // Pas les modèles
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

          // Stop when one action is completed & return
          return !statusExec; // Continue si l'action à retourné false
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
//BEST save/restaure

window.onload = rebuidCases;
self.setInterval(iterer, 1000);

function dragstart(evt) {
  dragstartInfo = {
    el: evt.target,
    innerHTML: evt.target.innerHTML,
    style: { // Clone array
      ...evt.target.style,
    },
    data: evt.target.data,
    isModel: evt.target.isModel,
    offset: {
      x: evt.offsetX,
      y: evt.offsetY,
    },
  };

  if (!evt.target.isModel)
    // Efface temporairement l'icône de départ
    setTimeout(() => {
      paradisEl.appendChild(evt.target);
    }, 0);

  helpEl.style.display = 'none';
}

document.ondragover = evt => {
  evt.preventDefault(); // Autorise drop partout
};

document.ondrop = evt => {
  const position = {
      left: evt.x - dragstartInfo.offset.x,
      top: evt.y - dragstartInfo.offset.y,
    },
    xy = xyFromPixels(position);

  if (dragstartInfo.isModel)
    ajouter(xy.x, xy.y, dragstartInfo.innerHTML, position);
  else
    deplacer(dragstartInfo.el, xy.x, xy.y, position);

  dragstartInfo = null;
};

document.ondragend = evt => { // Drag out the window
  if (dragstartInfo && !evt.target.isModel)
    supprimer(evt.target);

  evt.preventDefault();
};

/* eslint-disable-next-line no-unused-vars */
function load() { //TODO
  console.log('load');
}
/* eslint-disable-next-line no-unused-vars */
function save() { //TODO
  console.log('save');
}

// Debug
if (window.location.search) {
  noIterationMax = 0;
  document.onkeydown = evt => {
    if (evt.keyCode === 109) noIterationMax = 0;
    else if (evt.keyCode === 107) noIterationMax = 1000000;
    else if (evt.keyCode === 32) noIterationMax = noIteration < noIterationMax ? 0 : 1000000;
    else noIterationMax = noIteration + evt.keyCode % 48;
    helpEl.style.display = 'none';
  };
}

// SCÉNARII
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
        () => {}, // Fonction à exécuter aprés avoir appliqué la règle la règle
        () => Math.random() < 0.3 // Test d'applicabilité de la règle
      ],
      { // Init des data quand on crée
        type: 'Fontaine',
      },
    ],
  '💧': [
    [muer, '💦', d => d.eau < 10],
    [rapprocher, '🌱', 3],
    [rapprocher, '🌿', 3],
    [rapprocher, '🌽', 3],
    [errer], {
      type: 'Eau',
      eau: 20, //TODO 100,
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
    [muer, '🌱', d => d.age > 10],
    [rapprocher, '▒', 3],
    [absorber, '▒', '🌱'],
    [errer], {
      type: 'Graine',
    },
  ],
  '🌱': [
    [absorber, '💧'],
    [absorber, '💦'],
    [muer, '▒', d => d.eau <= 0],
    [muer, '🌿', d => d.age > 20], {
      type: 'Pousse',
    },
  ],
  '🌿': [
    [absorber, '💧'],
    [absorber, '💦'],
    [muer, '▒', d => d.eau <= 0],
    [muer, '🌽', d => d.age > 20],
    {
      type: 'Plante',
    },
  ],
  '🌽': [
    [absorber, '💧'],
    [absorber, '💦'],
    [muer, '▒', d => d.eau <= 0],
    [muer, '▓', d => d.eau > 100],
    [produire, '❀', () => Math.random() < 0.2],
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
  const el = ajouter(0, 0, nomSymbole, {
    left: 8,
    top: i * 2 * boxSize + 37,
  });

  el.isModel = true;
});

// Tests
if (window.location.search) {
  ajouter(14, 5, '🧔');
  ajouter(14, 8, '👩');
  // ajouter(14, 10, '💀');
  ajouter(14, 5, '🌽');
  ajouter(14, 8, '⛲');
  Object.keys(o).forEach((nomSymbole, i) => {
    ajouter(10 + i, 8 + i % 3 * 4, nomSymbole);
  });
  Array.from('⛲💧🌱🌿🌽▒▓').forEach((nomSymbole, i) => {
    ajouter(12 + i * 3, 8, nomSymbole);
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
  /*
   */
}