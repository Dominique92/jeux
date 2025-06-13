const statsEl = document.getElementById('stats'),
  liEls = document.getElementsByTagName('li'),
  helpEl = document.getElementById('help'),
  deltasProches = [ // [<centre -> départ du côté>, <direction du parcours du côté>]
    [-1, 0, 0, -1],
    [1, 0, 0, 1],
    [0, 1, -1, -1],
    [0, -1, 1, 1],
    [1, 1, -1, 0],
    [-1, -1, 1, 0],
  ],
  boxSize = 16,
  gigue = () => Math.random() * 4 - 2,
  trace = false;

let o = {},
  dragstartInfo = null,
  noIteration = 0,
  noIterationMax = 0,
  cases = [],
  zones = [],
  dataSav = [];

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
function xyFromPixels(pixels) {
  return {
    x: Math.round((pixels.left + pixels.top / 1.732) / boxSize),
    y: Math.round(pixels.top / 0.866 / boxSize),
  };
}

function pixelsFromXY(xy) {
  return {
    left: (xy.x - xy.y / 2) * boxSize + gigue(),
    top: xy.y * 0.866 * boxSize + gigue(),
  };
}

function pixelsFromEl(el) {
  return {
    left: el.getBoundingClientRect().left,
    top: el.getBoundingClientRect().top,
  };
}

// Get or set case el
function caseEl(xy, symboleType, el) {
  //TODO voir vocabulaire symbole, type, objet
  // 7,7 : returns the case contents []
  // 7,7,🌿 : returns the html element
  // 7,7,🌿,el : fill the case
  // Il ne peut y avoir qu'un el de chaque type dans une case

  if (typeof xy === 'undefined')
    return [];

  // Colonne vide
  if (typeof cases[xy.x] === 'undefined') {
    if (el)
      cases[xy.x] = [];
    else
      return [];
  }

  // Ligne vide
  if (typeof cases[xy.x][xy.y] === 'undefined') {
    if (el)
      cases[xy.x][xy.y] = [];
    else
      return [];
  }

  // array des el dans une case
  if (typeof symboleType === 'undefined')
    return cases[xy.x][xy.y];

  // Mets l'el dans la case
  if (typeof el === 'object') {
    cases[xy.x][xy.y][symboleType] = el;
    el.xy = xy;
  }

  // L'el d'une case pour un type
  return cases[xy.x][xy.y][symboleType];
}

function rebuildCases() {
  const divEls = document.getElementsByTagName('div');

  cases = [];
  zones = [];
  dataSav = [];

  for (const el of divEls)
    if (el.data && !el.hovered) // Pas si le curseur est au dessus
  {
    const zx = Math.round(el.xy.x / 4),
      zy = Math.round(el.xy.y / 4),
      d = {};

    // Population des cases
    caseEl(el.xy, el.innerHTML, el);

    // Population des zones
    if (typeof zones[el.innerHTML] === 'undefined')
      zones[el.innerHTML] = [];
    if (typeof zones[el.innerHTML][zx] === 'undefined')
      zones[el.innerHTML][zx] = [];
    if (typeof zones[el.innerHTML][zx][zy] === 'undefined')
      zones[el.innerHTML][zx][zy] = 0;
    zones[el.innerHTML][zx][zy]++;

    // Data to be saved in a file
    dataSav.push({
      type: el.innerHTML,
      left: Math.round(el.getBoundingClientRect().left),
      top: Math.round(el.getBoundingClientRect().top),
      data: el.data,
    });

    // Debug
    Object.keys(el.data).forEach(key => {
      if (el.data[key])
        d[key] = el.data[key];
    });

    el.title =
      o[el.innerHTML][o[el.innerHTML].length - 1].type + ' ' +
      JSON.stringify(d).replace(/\{|"|\}/gu, '') +
      (window.location.search ? ' ' + el.xy.x + ',' + el.xy.y : '');
  }
}

function casesProches(el, distance, limite, symboleTypeRecherche) {
  // el : Autour de el
  // distance : Rayon (nb cases) autour de el
  // limite : nombre de cases ramenées
  // symboleTypeRecherche : type d'objets 🌿 recherchés (string unicode)

  let listeProches = [],
    dMin = 999999;

  if (el.xy) {
    // Randomize search order
    for (let i = Math.random() * deltasProches.length; i > 0; i--)
      deltasProches.push(deltasProches.shift());

    // Recherche dans un rayon
    for (let d = 1; d < Math.min(~~distance, 5) + 1 && listeProches.length < limite; d++) {
      deltasProches.forEach(delta => {
        for (let i = 0;
          (i < d) && (listeProches.length < limite); i++) {
          const nouvelXY = {
              x: el.xy.x + d * delta[0] + i * delta[2],
              y: el.xy.y + d * delta[1] + i * delta[3],
            },
            pixelEln = pixelsFromXY(nouvelXY),
            nouvellesCases = caseEl(nouvelXY),
            nbObjetsNouvelleCase = Object.keys(nouvellesCases).length;

          if (0 <= pixelEln.left && pixelEln.left < window.innerWidth - boxSize &&
            0 <= pixelEln.top && pixelEln.top < window.innerHeight - boxSize
          ) {
            if (symboleTypeRecherche) { // On cherche un caractère
              if (nbObjetsNouvelleCase)
                listeProches.push([...delta, nouvelXY, nouvellesCases[symboleTypeRecherche], d]);
            } else if (!nbObjetsNouvelleCase) { // On cherche une case vide
              listeProches.push([...delta, nouvelXY]);
            }
          }
        }
      });
    }

    // Recherche éloignés
    if (!listeProches.length &&
      ~~distance > 5 &&
      typeof zones[symboleTypeRecherche] === 'object'
    )
      zones[symboleTypeRecherche].forEach((col, noCol) => {
        //TODO recherche concentrique et pas à partir de en haut à gauche
        col.forEach((ligne, noLigne) => {
          const deltaCol = noCol - Math.round(el.xy.x / 4),
            deltaLigne = noLigne - Math.round(el.xy.y / 4),
            dist = deltaCol * deltaCol + deltaLigne * deltaLigne;

          if (dMin > dist && (deltaCol || deltaLigne)) {
            dMin = dist;
            listeProches = [
              [
                Math.sign(deltaCol),
                Math.sign(deltaLigne),
              ]
            ];
          }
        });
      });

    return listeProches;
  }
}

// VERBES (functions)
// return true : Succés

// Déplacer el à la position x/y si elle est libre
function deplacer(el, a, b, typeAccept) {
  if (trace) console.log('deplacer', el.innerHTML, el.noIteration, noIteration, arguments); //TODO trace
  // La seule fonction habilitée à ajouter / enlever un el dans le body et dans cases[][]
  // el tout seul : supprime
  // typeAccept = '👩💧💦' : autorise à aller dans une case où il y a déjà ce type

  const newPx = {
      ...pixelsFromXY({
        x: a, // caseX, caseY
        y: b,
        ...a, // {x: caseX, y: caseY}
      }),
      ...a, // {left: px, top: px}
    },
    newXY = xyFromPixels(newPx),
    tas = '▒▓' + (typeAccept || '');

  // Ne peut bouger que dans les cases où il y a que des objets autorisés
  if (Object.keys(caseEl(newXY)).filter(
      symbol => !tas.includes(symbol)
    ).length)
    return false;

  // On supprime l'el de la case de départ
  delete caseEl(el.xy)[el.innerHTML];

  if (typeof a === 'undefined') {
    el.remove();
    return true;
  }

  // On met l'el dans la case d'arrivée
  caseEl(newXY, el.innerHTML, el);

  if (el.parentNode) // On part d'une position, bouge lentement
    setTimeout(() => { // Timeout ensures styles are applied before scrolling
      el.style.left = newPx.left + 'px';
      el.style.top = newPx.top + 'px';
    }, 50); //TODO il faut attendre un peu ???
  else { // On y va direct
    el.style.left = newPx.left + 'px';
    el.style.top = newPx.top + 'px';
  }

  document.body.appendChild(el);
  return true;
}

//TODO DELETE -> placer ce code ailleurs
function muer(el, nouveauSymbole) { // 1 -> 1
  if (trace) console.log('muer', el.innerHTML, el.noIteration, noIteration, arguments); //TODO trace

  // Retire de la case actuelle
  if (el.innerHTML)
    delete caseEl(el.xy)[el.innerHTML];

  caseEl(el.xy, nouveauSymbole, el);
  el.innerHTML = nouveauSymbole;
  el.classList = o[nouveauSymbole][o[nouveauSymbole].length - 1].type;
  el.data.age = 0; // L'âge repart à 0 si l'objet change de type

  return true;
}

function ajouter(symboleType, a, b, typeAccept) { // 0 -> 1
  if (trace) console.log('ajouter', arguments); //TODO trace

  const el = document.createElement('div');

  // Données initiales du modèle
  el.noIteration = noIteration;
  el.data = {
    ...o[symboleType][o[symboleType].length - 1],
  };
  delete el.data.type;

  muer(el, symboleType);
  deplacer(el, a, b, typeAccept); // ajouter

  // Mouse actions
  /* eslint-disable-next-line no-use-before-define */
  el.ondragstart = dragstart;
  el.draggable = true;
  el.ondblclick = evt => deplacer(evt.target); // supprimer

  // Hold moves when hover
  el.onmouseover = () => {
    el.hovered = true;
    el.style.top = window.getComputedStyle(el).top;
    el.style.left = window.getComputedStyle(el).left;
  };
  el.onmouseout = () => {
    el.hovered = false;
  };

  return el;
}

////////////TODO END TEST OK
// Transformer un type en un autre
function transformer(el, nouveauSymbole, symbolesCrees /*,action*/ ) { // 1 -> 1
  if (trace) console.log('transformer', el.innerHTML, el.noIteration, noIteration, arguments); //TODO trace
  // el : supprimer
  // el, '💧' : muer
  // el, '⛲', '💧 🧔👩' : symboles des objets à produire
  // el, '⛲', '', action : action à exécuter à la fin

  const scs = (symbolesCrees || '').split(' '); // Séparés par un espace

  if (!nouveauSymbole) //TODO TEST
    return deplacer(el); // supprimer

  // Remplace le type actuel
  if (el.innerHTML !== nouveauSymbole)
    muer(el, nouveauSymbole);

  if (symbolesCrees)
    scs.forEach(sym => {
      ajouter(sym, pixelsFromEl(el), null, el.innerHTML);
    });

  //TODO action

  return true;
}

function errer(el) { // 1 -> 1
  if (trace) console.log('errer', el.innerHTML, el.noIteration, noIteration, arguments); //TODO trace

  const pp = casesProches(el, 1, 1);

  if (pp.length)
    return deplacer(el, pp[0][4]); // errer
}

function rapprocher(el, symboleType, distance) { // 1 -> 1 (jusqu'à la même case)
  if (trace) console.log('rapprocher', el.innerHTML, el.noIteration, noIteration, arguments); //TODO trace

  const pp = casesProches(el, distance || 100, 1, symboleType);

  if (pp.length) {
    const nouvelX = el.xy.x + pp[0][0],
      nouvelY = el.xy.y + pp[0][1];

    if (typeof pp[0][5] === 'object' && // On a retourné un el
      ~~pp[0][6] === 1 // Seulement à 1 case de distance
    )
      pp[0][5].noIteration = noIteration; // On bloque l'évolution de la cible

    return deplacer(el, // rapprocher
      nouvelX, nouvelY,
      symboleType); // Accepte les cases contenant ce symbole
  }
}

function absorber(el, symboleType, symboleTypeFinal) { // 2 -> 1 (dans la même case)
  if (trace) console.log('absorber', el.innerHTML, el.noIteration, noIteration, arguments); //TODO trace

  const trouveEl = caseEl(el.xy, symboleType);

  if (trouveEl) {
    for (const property in trouveEl.data) {
      el.data[property] = ~~el.data[property] + trouveEl.data[property]
      el.data.age = 0;

      deplacer(trouveEl); //supprimer

      if (symboleTypeFinal)
        return muer(el, symboleTypeFinal);
    }
  }
}

function produire(el, symboleTypeNouveau) { // 1 -> 2 (dans la même case)
  if (trace) console.log('produire', el.innerHTML, el.noIteration, noIteration, arguments); //TODO trace

  if (!caseEl(el.xy, symboleTypeNouveau))
    return ajouter(symboleTypeNouveau, el.xy, null, el.innerHTML);
}

function rencontrer(el, symboleTypeRencontre, symbolObjetsFinaux) { // 2 -> 2 (dans la même case)
  if (trace) console.log('rencontrer', el.innerHTML, el.noIteration, noIteration, arguments); //TODO DEVELOPPER TEST rencontrer
  const nfo = symbolObjetsFinaux.split(' '); // Séparés par un espace
  console.log(nfo); //TODO trace
}

// ACTIVATION (functions)
function iterer() {
  if (noIteration < noIterationMax || !window.location.search) {
    const debut = Date.now(),
      divEls = document.getElementsByTagName('div'),
      gameEls = [];

    noIteration++;
    rebuildCases();

    for (const el of divEls)
      gameEls.push(el);

    // Exécution des actions
    gameEls.forEach(el => {
      if (el.noIteration < noIteration && // S'il n'a pas déjà été traité
        el.parentNode && // S'il est affichable
        el.data && !el.hovered // Si le curseur n'est pas au dessus
      ) {
        if (typeof o[el.innerHTML] === 'object')
          o[el.innerHTML].slice(0, -1) // Enlève la structure d'initialisation à la fin
          .every(action => // Exécute chaque action tant qu'elle retourne false
            {
              // Condition to the last argument (function)
              const conditionFunction = action[action.length - 1],
                executionFunction = action[action.length - 2];

              if (action.length > 1 && // S'il y a assez d'arguments
                typeof conditionFunction === 'function' && // Si le dernier est une fonction
                !conditionFunction(el.data) // Le test d'elligibilté est négatif
              )
                return true; // On n'exécute pas l'action et on passe à la suivante

              // Execute l'action
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
        el.noIteration = noIteration; // Marque déjà traité
        el.data.age = ~~el.data.age + 1;
        if (el.data.eau > 0)
          el.data.eau--;
        if (el.data.energie > 0)
          el.data.energie--;
      }
    });

    rebuildCases();

    statsEl.innerHTML = noIteration + ': ' + (Date.now() - debut) + ' ms / ' + divEls.length + ' obj';
  }
}

// RÉPONSES SOURIS / CLAVIER
self.setInterval(iterer, 1000);
window.onload = () => {
  const arg = window.location.search.match(/[0-9]+/u);

  if (arg)
    noIterationMax = arg[0];

  iterer();
};

function dragend(evt) {
  //TODO BUG ne marche pas en dehors de la fenêtre
  if (dragstartInfo) {
    // Start from the en drag cursor position
    dragstartInfo.el.style.left = evt.x + 'px';
    dragstartInfo.el.style.top = evt.y + 'px';
    document.body.appendChild(dragstartInfo.el);

    // Then, move slowly to the initial position
    deplacer(dragstartInfo.el, dragstartInfo.bounds);
  }
}

function dragstart(evt) {
  dragstartInfo = {
    el: evt.target,
    innerHTML: evt.target.innerHTML,
    tagName: evt.target.tagName,
    style: { // Clone array
      ...evt.target.style,
    },
    bounds: pixelsFromEl(evt.target),
    data: evt.target.data,
    offset: { // Offset of the mouse over the symbol
      x: evt.offsetX,
      y: evt.offsetY,
    },
  };

  evt.target.ondragend = dragend;

  if (evt.target.tagName === 'DIV') // Sauf modèle
    // Efface temporairement l'icône de départ
    setTimeout(() => { // Pour avoir le temps que le drag copie l'image
      evt.target.remove();
    }, 0);

  helpEl.style.display = 'none';
}

document.ondragover = evt => {
  const divEls = document.getElementsByTagName('div'),
    px = {
      left: evt.x - dragstartInfo.offset.x,
      top: evt.y - dragstartInfo.offset.y,
    };

  // Vérifie s'il y a un element à cet endroit
  for (const el of divEls) {
    const bounds = el.getBoundingClientRect();

    if (
      px.left > bounds.x + bounds.width * 7 / 18 - 31 &&
      px.left < bounds.x + bounds.width * 7 / 6 - 7 &&
      px.top > bounds.y - 20 &&
      px.top < bounds.y + 20
    )
      return;
  }

  evt.preventDefault(); // Autorise drop
};

document.ondrop = evt => {
  const pixels = {
    left: evt.x - dragstartInfo.offset.x,
    top: evt.y - dragstartInfo.offset.y,
  };

  if (dragstartInfo.tagName === 'DIV') { // Sauf modèle
    deplacer(dragstartInfo.el, pixels);
    dragstartInfo.el.style.display = 'initial';
  } else // Modèle
    ajouter(dragstartInfo.innerHTML, pixels);

  dragstartInfo = null;
  rebuildCases();
};

function loadWorld(datas) {
  // Vide le monde
  for (let divEls = document.getElementsByTagName('div'); divEls.length; divEls = document.getElementsByTagName('div'))
    divEls[0].remove();

  // Ajoute les objets du json
  datas.forEach(d => {
    const dataCompil = {
        type: d[0],
        x: d[1],
        y: d[2],
        ...d,
      },
      el = ajouter(dataCompil.type, dataCompil);

    if (d.data)
      el.data = dataCompil.data;
  });

  rebuildCases();
}

/* eslint-disable-next-line no-unused-vars */
function load(evt) {
  const blob = evt.target.files[0],
    reader = new FileReader();

  reader.readAsText(blob);
  reader.onload = () =>
    loadWorld(JSON.parse(reader.result));

  helpEl.style.display = 'none';
}

/* eslint-disable-next-line no-unused-vars, one-var */
const save = async () => {
  const json = JSON.stringify(dataSav).replaceAll('},{', '},\n{'),
    handle = await window.showSaveFilePicker({
      types: [{
        description: 'Sauvegarde jeu de la vie',
        accept: {
          'application/vie': ['.vie']
        },
      }, ],
    }),
    writer = await handle.createWritable();

  await writer.write(new Blob([json]));
  await writer.close();
}

// SCÉNARII
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
    [transformer, '💦'],
    //[muer, '💦', d => d.eau < 10],
    [rapprocher, '🌱', 3],
    [rapprocher, '🌿', 3],
    [rapprocher, '🌽', 3],
    [errer], {
      type: 'Eau',
      eau: 20, //TODO 100,
    },
  ],
  '💦': [
    [transformer, d => d.eau <= 0],
    [errer],
    {
      type: 'Eau',
    },
  ],
  //////////////////////////TODO
  // Cycle des plantes
  // 🥑🍆🌰🍇🍈🍉🍊🍋🍋‍🍌🍍🥭🍎🍏🍐🍑🍒🍓🥝🍅🥥💮🌸
  // 🌳🥦🍄🥔🥕🌽🌶️🥒🥬🧄🧅🥜🎕🌾
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
  }],
  '▓': [{
    type: 'Herbe',
  }],
  // Cycle des humains
  // 🧒👶👷
  '🧔': [
    [rapprocher, '👩'],
    //[absorber, '👩', '💏'],
    [rencontrer, '👩', '🏠'],
    //...vivant,
    [errer],
    {
      type: 'Homme',
      eau: 50,
      energie: 50,
    },
  ],
  '👩': [
    [rapprocher, '🧔'],
    [rencontrer, '🧔', '🏠'],
    //    [absorber, '🧔', '💏'],
    //    [absorber, '🧔', '💏'],
    //...vivant,
    [errer],
    {
      type: 'Femme',
      eau: 50,
      energie: 50,
    },
  ],
  '🧔👩': [
    //...vivant,
    [muer, '👫', 5],
    //[errer],
    {
      type: 'Dating',
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
  // Cycle des travaux
  // 🚧🔥
  '🧱': [{
    type: 'Briques',
  }],
  '🏠': [{
    type: 'Maison',
  }],
  // Cycle des animaux
  // 🐇🐀🦊🦴
};

// INITIALISATIONS
// Modèles
[...liEls].forEach(el => {
  el.data = {
    ...o[el.innerHTML][o[el.innerHTML].length - 1],
  };
  el.title = el.data.type;
  delete el.data.type;
});

// TESTS
loadWorld([
  ["💧", 16, 12],
]);

/*
  ["⛲", 16, 12],
  ["🧔", 14, 14],
  ["👩", 17, 14],

  ["🧔", 14, 8],
  ["🧱", 14, 9],
  ["▒", 15, 9],
  ["🧱", 13, 8],
  ["🧱", 13, 7],
  ["🧱", 14, 7],
  ["🧱", 15, 8],

  ["⛲", 14, 8],
  ["▒", 16, 8],
  ["🏠", 14, 8],
  ["💀", 14, 10],
  ["🌽", 14, 5],

  ["🧔👩", 20, 28],
  ["🌽", 36, 28],
 */

Object.keys(o).forEach((symboleType, i) => {
  ajouter(symboleType, 10 + i, 8 + i % 3 * 4);
});

rebuildCases();

// Debug
if (window.location.search) {
  helpEl.style.display = 'none';
  noIterationMax = 0;
  document.onkeydown = evt => {
    if (evt.keyCode === 109)
      noIterationMax = 0;
    else if (evt.keyCode === 107)
      noIterationMax = 1000000;
    else if (evt.keyCode === 32)
      noIterationMax = noIteration < noIterationMax ? 0 : 1000000;
    else
      noIterationMax = noIteration + evt.keyCode % 48;
  };
}