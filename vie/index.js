const trace = window.location.search.match(/trace/u),
  debugInit = window.location.search.match(/[0-9]+/u),
  divEls = document.getElementsByTagName('div'),
  statsEl = document.getElementById('stats'),
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
  tailleFigure = 16,
  rayonRechercheMax = 4,
  tailleZone = rayonRechercheMax + 1,
  gigue = () => Math.random() * 4 - 2,
  recurrence = 1000, // ms
  dureeMaxIteration = 100; // ms

let o = {},
  dragInfo = null,
  noIteration = 0,
  noIterationMax = 1000000, // Starts immediately
  dureeIteration = 0,
  cases = [],
  zones = [],
  dataSav = [];

/*********************
 * Terrain : toute la fenêtre <body>
 * Figurine / fig : <div>unicode</div> rattaché au <body> déplaçable
 * Catéorie / cat : type de figurine
 * catSym : caractère(s) unicode représentant une figurine sur l'écran
 * catName : string le nom de la categorie
 * data : tableau de valeurs associé à une figurine
 * Element / el : <div> tag affichant la figurine
 *
 * cases : tableau à 2 dimensions dont chaque case pointe sur 0 ou 1 figurine de la même catéorie max
 * zones : un tableau à 2 dimensions par catéorie de figurine représentant leur nombre dans chaque carré de n * n cases
 * xy : position de la figurine dans le tableau des cases (x, y)
 * pix : position de la figurine en pixels (left, top)
 *
 * Routine : fonction qui manipule les données du programme
 * Verbe : fonction à exécuter qui réalise une action sur une figurine
 * Scenario : liste d'actions ou de scenarios à exécuter dans l'ordre,
     la première ayant abouti interrompt la liste
 */

// ROUTINES (functions)
function xyFromPix(pix) {
  return {
    x: Math.round((pix.left + pix.top / 1.732) / tailleFigure),
    y: Math.round(pix.top / 0.866 / tailleFigure),
  };
}

function pixFromXY(xy) {
  return {
    left: (xy.x - xy.y / 2) * tailleFigure + gigue(),
    top: xy.y * 0.866 * tailleFigure + gigue(),
  };
}

function pixFromEl(el) {
  return {
    left: el.getBoundingClientRect().left,
    top: el.getBoundingClientRect().top,
  };
}

function xyzFromXY(xy) {
  return {
    x: Math.round(xy.x / tailleZone),
    y: Math.round(xy.y / tailleZone),
  };
}

// Get / set case el
function caseEl(tableau, xy, catSym, el) {
  // tableau : cases[] / zones[]
  // 7,7 : returns the case contents []
  // 7,7,🌿 : return the html element
  // 7,7,🌿,el : fill the case
  // Il ne peut y avoir qu'un el de chaque catéorie dans une case

  if (typeof tableau[xy.x] === 'undefined')
    tableau[xy.x] = [];
  if (typeof tableau[xy.x][xy.y] === 'undefined')
    tableau[xy.x][xy.y] = [];

  // Array des el dans une case
  if (typeof catSym !== 'string')
    return tableau[xy.x][xy.y];

  // Met l'el dans la case et la tableau
  if (typeof el === 'object') {
    tableau[xy.x][xy.y][catSym] = el;
    if (tableau === cases)
      el.xy = xy;
  }

  // L'el d'une case pour une catéorie
  return tableau[xy.x][xy.y][catSym];
}

function rebuildCases() {
  cases = [];
  zones = [];
  dataSav = [];

  for (const el of divEls)
    if (el.data && !el.hovered) { // Pas si le curseur est au dessus
      // Uniquement les données de valeur # 0
      const filteredData = Object.fromEntries(
        Object.entries(el.data)
        .filter(v => v[1])
      );

      // Population des cases
      caseEl(cases, el.xy, el.innerHTML, el);
      caseEl(zones, xyzFromXY(el.xy), el.innerHTML, el);

      // Figurines title
      el.title =
        o[el.innerHTML][o[el.innerHTML].length - 1].cat + ' ' +
        JSON.stringify(filteredData).replace(/\{|"|\}/gu, '') +
        (window.location.search ?
          ' ' + el.xy.x + ',' + el.xy.y +
          ' ' + xyzFromXY(el.xy).x + ',' + xyzFromXY(el.xy).y :
          '');

      // Data to be saved in a file
      dataSav.push([
        el.innerHTML,
        Math.round(el.getBoundingClientRect().left),
        Math.round(el.getBoundingClientRect().top),
        filteredData,
      ]);
    }
}

function casesProches(xyCentre, distance, limite, catSym, tableau) {
  if (trace) console.log('casesProches', ...arguments); //TEST trace

  // el : Autour de el
  // distance : Rayon (nb cases) autour de el
  // limite : nombre de cases ramenées
  // catSym : catégorie de figurines 🌿 recherchés (string unicode)
  // catSym = undefined : recherche de case vide

  const listeProches = [];

  // Randomize search order
  for (let i = Math.random() * deltasProches.length; i > 0; i--)
    deltasProches.push(deltasProches.shift());

  // Recherche dans un rayon donné
  for (let d = 1; d <= Math.min(distance, rayonRechercheMax); d++)
    // Pour chacune des 6 directions
    deltasProches.forEach(delta => {
      // On parcours le côté
      for (let i = 0; i < d && listeProches.length < limite; i++) {
        const XYrech = {
            x: xyCentre.x + d * delta[0] + i * delta[2],
            y: xyCentre.y + d * delta[1] + i * delta[3],
          },
          nbFigCaseRech = Object.keys(caseEl(tableau || cases, XYrech)).length;

        if ((catSym && nbFigCaseRech) || // On cherche et trouve un symbole de la catégotie
          (!catSym && !nbFigCaseRech)) // On cherche une case vide
          listeProches.push([
            ...delta,
            XYrech,
            caseEl(tableau || cases, XYrech, catSym),
          ]);
      };
    });

  if (typeof tableau === 'undefined' &&
    listeProches.length < limite)
    return listeProches.concat(casesProches(
      xyzFromXY(xyCentre),
      distance / tailleZone,
      limite - listeProches.length,
      catSym,
      zones));

  return listeProches;
}

// VERBES : function(el, ...)
// return true : Succés

// Toutes les transformations de 0 ou 1 figurines en 0, 1, 2, ... figurines
// Change la position
function transformer(elA, ncsA, pos, pos2) {
  // null, '💧', (pix || xy || x,y) : crée la figurine
  // el tout seul : supprime la figurine
  // el, '<même sym>', (pix || xy || x,y) : déplace la figurine
  // el, '💧' : transforme en cette catégorie
  // el, '⛲ 💧 🧔👩' : transforme vers ⛲ et ajoute 💧 et 🧔👩

  let el = elA || {};

  const newCatSyms = (typeof ncsA === 'string' ? ncsA : el.innerHTML)
    .split(' '), // Séparés par un espace
    catSym = newCatSyms.shift(),
    newPix = {
      ...pixFromXY({
        x: pos, // caseX, caseY
        y: pos2,
        ...pos || el.xy, // {x: caseX, y: caseY}
      }),
      ...pos, // {left: ..px, top: ..px}
    },
    newXY = xyFromPix(newPix);

  if (trace) console.log('transformer', el.innerHTML, catSym, newPix, newXY, newCatSyms, noIteration, [arguments]); //TEST trace

  if (typeof el.innerHTML === 'undefined') { // On créee une nouvelle figurine
    el = document.createElement('div');

    // Données initiales du modèle
    //TODO gérer erreur symbole inexistant
    el.noIteration = noIteration;
    el.data = {
      ...o[catSym][o[catSym].length - 1],
    };
    delete el.data.cat;

    // Mouse actions
    el.draggable = true;
    /* eslint-disable-next-line no-use-before-define */
    el.ondragstart = dragstart;
    /* eslint-disable-next-line no-use-before-define */
    el.ondragend = dragend;
    el.ondblclick = evt => transformer(evt.target); // supprimer

    // Hold transition moves when hover
    el.onmouseover = () => {
      el.hovered = true;
      el.style.top = window.getComputedStyle(el).top;
      el.style.left = window.getComputedStyle(el).left;
    };
    el.onmouseout = () => {
      el.hovered = false;
    };
  } else {
    // On retire l'el de la case de départ
    if (el.xy)
      delete caseEl(cases, el.xy)[el.innerHTML];

    // Supprime et c'est tout
    if (typeof ncsA !== 'string') {
      el.remove();
      return el;
    }
  }

  if (catSym !== el.innerHTML) { // Si on change de symbole
    // Met à jour la catégorie dans l'el
    el.innerHTML = catSym;
    el.classList = o[catSym][o[catSym].length - 1].cat;
    el.data.age = 0; // L'âge repart à 0 si l'objet change de catégorie
  }

  if (!newCatSyms.length) { // Pour ne pas faire bouger la gigue sur une production
    if (el.parentNode)
      // On part d'une position, bouge lentement
      setTimeout(() => { // Timeout ensures styles are applied before scrolling
        el.style.left = newPix.left + 'px';
        el.style.top = newPix.top + 'px';
      }, 50); //TODO pourquoi faut-il attendre un peu ???
    else {
      // On y va direct
      el.style.left = newPix.left + 'px';
      el.style.top = newPix.top + 'px';
    }
  }

  // Re-affiche la figurine dans la fenêtre
  document.body.appendChild(el);
  caseEl(cases, newXY, catSym, el);

  // On crée les nouvelles figurines
  if (dureeIteration < dureeMaxIteration) // S'il y a de la ressource
    newCatSyms.forEach(cs => {
      transformer(null, cs, el.xy);
    });

  return el;
}

function errer(el) {
  if (trace) console.log('errer', el.innerHTML, el.noIteration, noIteration, [arguments]); //TEST trace

  const pp = casesProches(el.xy, 1, 1);

  if (pp.length)
    return transformer(el, el.innerHTML, pp[0][4]); // errer
}

function rapprocher(el, symboleType) { // Jusqu'à la même case
  if (trace) console.log('rapprocher', el.innerHTML, el.noIteration, noIteration, [arguments]); //TEST trace

  const pp = casesProches(el.xy, 10, 1, symboleType);

  if (pp.length) {
    const nouvelX = el.xy.x + pp[0][0],
      nouvelY = el.xy.y + pp[0][1];

    /*//TODO Seulement à 1 case de distance
        if (typeof pp[0][5] === 'object' && // On a retourné un el
          ~~pp[0][6] === 1 // Seulement à 1 case de distance
        )
          pp[0][5].noIteration = noIteration; // On bloque l'évolution de la cible
    */

    return transformer(el, // rapprocher
      el.innerHTML,
      nouvelX, nouvelY,
    ); // Accepte les cases contenant ce symbole
  }
}

/* eslint-disable-next-line no-unused-vars */
function unir(el, symboleType, symboleTypeFinal) { // Dans la même case
  if (trace) console.log('unir', el.innerHTML, el.noIteration, noIteration, [arguments]); //TEST trace

  /*
  const trouveEl = caseEl(cases,el.xy, symboleType);

  if (trouveEl) {
    for (const property in trouveEl.data) {
      el.data[property] = ~~el.data[property] + trouveEl.data[property]
      el.data.age = 0;

      deplacer(trouveEl); //supprimer

      if (symboleTypeFinal)
        return muer(el, symboleTypeFinal);
    }
  }
  */
}

/* eslint-disable-next-line no-unused-vars */
function autogenerer(el, symboleType, symboleTypeFinal) { // Dans la même case
}

// ACTIVATION (functions)
function iterer() {
  if (noIteration < noIterationMax) {
    const debut = Date.now(),
      gameEls = [];

    noIteration++;

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
          .every(a => // Exécute chaque action tant qu'elle retourne false
            {
              // Condition to the last argument (function)
              const parametresAction = [...a],
                conditionFunction = parametresAction[parametresAction.length - 1];

              if (parametresAction.length > 1 && // S'il y a assez d'arguments
                typeof conditionFunction === 'function') { // Si le dernier argument est une fonction
                parametresAction.pop();

                if (!conditionFunction(el.data)) // Le test d'elligibilté est négatif
                  return true; // On n'exécute pas l'action et on passe à la suivante
              }

              // Execute l'action
              // Stop when one action is completed & return
              return !parametresAction[0](el, ...parametresAction.slice(1));

              // Continue si l'action à retourné false
              /*//TODO const executionFunction = parametresAction[parametresAction.length - 2];
              if (statusExec &&
                parametresAction.length > 2 &&
                typeof executionFunction === 'function'
              ) {
                //parametresAction.pop();
                executionFunction(el.data);
              }*/

            });

        //TODO DELETE ??? el.noIteration = noIteration; // Marque déjà traité
        el.data.age = ~~el.data.age + 1;
        if (el.data.eau > 0)
          el.data.eau--;
        if (el.data.energie > 0)
          el.data.energie--;
      }
    });

    rebuildCases();
    dureeIteration = Date.now() - debut;

    if (window.location.search)
      statsEl.innerHTML = noIteration + ': ' +
      divEls.length + ' fig &nbsp; a=' +
      dureeIteration + ' ms &nbsp; ' +
      Math.round(dureeIteration / divEls.length * 10) / 10 + 'ms/obj';
  }
}

// RÉPONSES SOURIS / CLAVIER
function dragstart(evt) {
  if (trace) console.log('dragstart', evt); //TEST trace

  dragInfo = {
    el: evt.target,
    innerHTML: evt.target.innerHTML,
    tagName: evt.target.tagName,
    style: { // Clone array
      ...evt.target.style,
    },
    bounds: pixFromEl(evt.target),
    data: evt.target.data,
    offset: { // Offset of the mouse over the symbol
      x: evt.offsetX,
      y: evt.offsetY,
    },
  };

  if (evt.target.tagName === 'DIV') // Sauf modèle
    // Efface temporairement l'icône de départ
    setTimeout(() => { // Pour avoir le temps que le drag copie l'image
      evt.target.remove();
    }, 0);

  helpEl.style.display = 'none';
}

document.ondragover = evt => {
  const el = document.elementFromPoint(evt.x, evt.y);

  if (el.tagName === 'HTML') // Il n'y a rien en dessous
    evt.preventDefault(); // Autorise drop
}

document.ondrop = evt => {
  if (trace) console.log('ondrop', evt); //TEST trace

  transformer(
    dragInfo.tagName === 'LI' ? null : dragInfo.el,
    dragInfo.el.innerHTML, {
      left: evt.x - dragInfo.offset.x,
      top: evt.y - dragInfo.offset.y,
    });

  dragInfo = null;
  rebuildCases();
};

function dragend(evt) {
  if (dragInfo && // Sauf si ça déjà terminé par ondrop
    document.elementFromPoint(evt.x, evt.y)) { // Sauf si c'est en dehors de la fenêtre
    // Start from the end drag cursor position
    dragInfo.el.style.left = (evt.x - dragInfo.offset.x) + 'px';
    dragInfo.el.style.top = (evt.y - dragInfo.offset.y) + 'px';
    document.body.appendChild(dragInfo.el);
    // Then, move slowly to the initial position
    transformer(dragInfo.el, dragInfo.el.innerHTML, dragInfo.bounds)
  }
}

function loadWorld(datas) {
  // Vide le monde
  while (divEls.length)
    divEls[0].remove();

  // Ajoute les objets du json
  datas.forEach(d => {
    const el = transformer(null, d[0], {
      left: d[1],
      top: d[2],
    });

    if (el && d.data)
      el.data = d[4];
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
  const handle = await window.showSaveFilePicker({
      types: [{
        description: 'Sauvegarde jeu de la vie',
        accept: {
          'application/vie': ['.vie']
        },
      }, ],
    }),
    writer = await handle.createWritable();

  await writer.write(new Blob([
    JSON.stringify(dataSav)
    .replace(/\],\[/gu, '],\n[')
    .replace(/,\{\}/gu, '')
  ]));

  await writer.close();
}

self.setInterval(iterer, recurrence);

// SCÉNARII
/*
const consommer = [wwwWrapprocher, wwwWabsorber];
  vivant = [
    [consommer, '💧', 'eau'],
    [consommer, '🌽', 'energie'],
    [consommer, '🌾', 'energie'],
    [consommer, '🌱', 'energie'],
  ];
*/

o = {
  // Cycle de l'eau 🚣🚢🌊🐟🌧
  '⛲': // Scénario de la catégorie d'objet
    [ // Action élémentaire du scénario
      [transformer, // Verbe à exécuter
        '⛲ 💧', // Symboles pour remplacer et créer
        //TODO ??? () => {}, // Fonction à exécuter aprés avoir appliqué la règle
        //() => Math.random() < 0.2 // Test d'applicabilité de la règle
      ],
      { // Init des data quand on crée
        cat: 'Fontaine',
      },
    ],
  '💧': [
    [transformer, '💦', d => d.eau < 10],
    //[wwwWrapprocher, '🌱', 3],
    //[wwwWrapprocher, '🌾', 3],
    //[wwwWrapprocher, '🌽', 3],
    [errer], {
      cat: 'Eau',
      eau: 100,
    },
  ],
  '💦': [
    [transformer, d => d.eau <= 0],
    [errer],
    {
      cat: 'Eau',
    },
  ],
  ////////////TODO TEST
  // Cycle des plantes
  // Fruits🥑🍆🌰🍇🍈🍉🍊🍋🍋‍🍌🍍🥭🍎🍏🍐🍑🍒🍓🥝🍅🥥💮🌸
  // 🥦🍄🥔🥕🌽🌶️🥒🥬🧄🧅🥜🎕🌻
  // Arbres 🌿🌳🍂🔥
  '❀': [
    [transformer, '🌱', d => d.age > 10],
    //[wwwWrapprocher, '▒', 3],
    //[wwwWabsorber, '▒', '🌱'],
    [errer], {
      cat: 'Graine',
    },
  ],
  '🌱': [
    //[wwwWabsorber, '💧'],
    //[wwwWabsorber, '💦'],
    //[transformer, '▒', d => d.eau <= 0],
    [transformer, '🌾', d => d.age > 10],
    {
      cat: 'Pousse',
    },
  ],
  '🌾': [
    //[wwwWabsorber, '💧'],
    //[wwwWabsorber, '💦'],
    //[transformer, '▒', d => d.eau <= 0],
    [transformer, '🌽', d => d.age > 10],
    {
      cat: 'Plante',
    },
  ],
  '🌽': [
    //[wwwWabsorber, '💧'],
    //[wwwWabsorber, '💦'],
    //[transformer, '▒', d => d.eau <= 0],
    //[transformer, '▓', d => d.eau > 100],
    [transformer, '🌽 ❀', () => Math.random() < 0.2],
    {
      cat: 'Mais',
    },
  ],
  // Cycle des surfaces
  '▒': [{
    cat: 'Terre',
  }],
  '▓': [{
    cat: 'Herbe',
  }],
  // Cycle des humains 🧒👶
  '🧔': [
    [rapprocher, '👩'],
    //[wwwWabsorber, '👩', '💏'],
    //[wwwWrencontrer, '👩', '🏠'],
    //...vivant,
    [errer],
    {
      cat: 'Homme',
      eau: 50,
      energie: 50,
    },
  ],
  '👩': [
    [rapprocher, '🧔'],
    //[wwwWrencontrer, '🧔', '🏠'],
    //[wwwWabsorber, '🧔', '💏'],
    //[wwwWabsorber, '🧔', '💏'],
    //...vivant,
    [errer],
    {
      cat: 'Femme',
      eau: 50,
      energie: 50,
    },
  ],
  '🧔👩': [
    //...vivant,
    //[transformer, '👫', 5],
    //[errer],
    {
      cat: 'Dating',
    },
  ],
  '💏': [
    //...vivant,
    //[transformer, '👫', 5],
    [errer],
    {
      cat: 'Amoureux',
    },
  ],
  '👫': [
    //...vivant,
    //[transformer, '👪', 5],
    [errer],
    {
      cat: 'Couple',
    },
  ],
  '👪': [
    //...vivant,
    //[transformer, '👫', 15],
    //TODO wwwWproduire enfant
    [errer],
    {
      cat: 'Famille',
    },
  ],
  '🧍': [
    //...vivant,
    //TODO transformer 50% 🧔 50% 👩
    [errer],
    {
      cat: 'Enfant',
    },
  ],
  '💀': [
    //[transformer, '▒', 15],
    {
      cat: 'Mort',
    },
  ],
  // Cycle des animaux
  // 🐇🥚🐣🐤🐥🐔🐓🦆🐀🐁🦊🐑🐻🦋🐞🦉🦴

  // Cycle des travaux 🚧👷
  '🧱': [{
    cat: 'Briques',
  }],
  '🏠': [
    //[wwwWrencontrer, '▒'],
    {
      cat: 'Maison',
    },
  ],
};

// INITIALISATIONS
// Modèles
[...liEls].forEach(el => {
  el.data = {
    ...o[el.innerHTML][o[el.innerHTML].length - 1],
  };
  el.title = el.data.cat;
  delete el.data.cat;
});

// TESTS
loadWorld([
  //['⛲', 120, 100],
  //['💧', 200, 160],
  //['🌽', 120, 100],
  //['❀', 120, 100],
  ['👩', 120, 200],
  ['🧔', 200, 300],
]);

/*Object.keys(o).forEach((catSym, i) => {
  transformer(null, catSym, {
    left: 70 + Math.floor(i / 4) * 70,
    top: 70 + i % 4 * 70
  });
});*/

// Debug
if (window.location.search) {
  helpEl.style.display = 'none';
  statsEl.style.display = 'block';

  noIterationMax = debugInit ? parseInt(debugInit[0], 10) : 0; // Debug avec quelques iterations au début

  document.onkeydown = evt => {
    if (96 < evt.keyCode && evt.keyCode < 106) // Keypad numérique 1 à 9
      noIterationMax = noIteration + evt.keyCode % 48; // Relance n itérations
    else if (evt.keyCode === 32) // Espace
      noIterationMax = noIteration < noIterationMax ? 0 : 1000000; // Toggle 
    else // Autre touche
      noIterationMax = 0; // Arrêt
  };
}