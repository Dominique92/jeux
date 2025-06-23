/*********************
 * Terrain : toute la fenêtre <body>
 * Figurine / fig = <div>unicode</div> rattaché au <body> déplaçable
 * Catéorie / cat : type de figurine
 * catSym = caractère(s) unicode représentant une figurine sur l'écran
 * catName = string : le nom de la categorie
 * data = tableau de valeurs associé à une figurine
 * Element / el = <div> tag affichant la figurine
 *
 * cases : tableau à 2 dimensions dont chaque case pointe sur 0 ou 1 figurine de la même catéorie max
 * zones : un tableau à 2 dimensions par catéorie de figurine représentant leur nombre dans chaque carré de n * n cases
 * xy = {x: caseX, y: caseY} : position de la figurine dans le tableau des cases
 * pix = {left: px, top: px} : position de la figurine en pixels
 *
 * Routine : fonction qui manipule les données du programme
 * Verbe : fonction à exécuter qui réalise une action sur une figurine
 * Scenario : liste d'actions ou de scenarii à exécuter dans l'ordre,
     la première ayant abouti interrompt la liste
 */

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
  giguemax = 2,
  rayonRechercheMax = 4,
  tailleZone = rayonRechercheMax + 1,
  recurrence = 1000, // ms
  nbMaxFig = 255; // Nombre maximum de figurines dans la femnêtre

let o = {},
  dragInfo = null,
  noIteration = 0,
  noIterationMax = 1000000, // Starts immediately
  timeoutID = null,
  cases = [],
  zones = [],
  dataSav = [];

// ROUTINES (functions)
function gigue() {
  return Math.random() * 2 * giguemax - giguemax;
}

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

function scenario(catSym) {
  const scn = o[catSym];

  // Le symbole doit avoir un senario
  if (typeof scn === 'undefined') {
    console.log('Symbole inconnu : ', catSym);
    return false;
  }
  return scn;
}


// Get / set cases[] & zones[] el
function caseEl(tableau, xy, catSym, el) {
  //if (trace) console.log('caseEl', ...arguments);

  // tableau = cases[] / zones[]
  // 7, 7 : returns the case contents []
  // 7, 7, 🌿 : return the html element of thois category
  // 7, 7, 🌿, el : fill the case
  // Il ne peut y avoir qu'un el de chaque catéorie dans une case

  if (typeof tableau[xy.x] === 'undefined')
    tableau[xy.x] = [];
  if (typeof tableau[xy.x][xy.y] === 'undefined')
    tableau[xy.x][xy.y] = [];

  // Array des el dans une case
  if (typeof catSym !== 'string' || !catSym)
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
  if (trace) console.log('rebuildCases');

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

function casesProches(xyCentre, distance, limite, catSyms, tableau) {
  //if (trace) console.log('casesProches', ...arguments);

  // el : Autour de el
  // distance = Rayon (nb cases) autour de el
  // limite = nombre de cases ramenées
  // catSyms = '🌱 🌾' : catégorie(s) de figurines recherchés (strings unicode separated by spaces)
  // catSyms = ' ▒ ▓' : recherche de case vide ou contenant un de ces symboles
  // tableau = undefined | cases | zones

  const catSym = (catSyms || '').split(' ')[0], // Premier symbole dans la liste
    listeProches = [];

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
          figCaseRech = Object.keys(caseEl(tableau || cases, XYrech)),
          filteredCaseRech = figCaseRech.filter(v => !catSyms.includes(v));

        if ((catSym === '' && !filteredCaseRech.length) || // Recherche case vide
          (catSym !== '' && figCaseRech.length)) // Recherche catégories
          listeProches.push([ // Préparation du retour
            ...delta,
            XYrech,
            caseEl(tableau || cases, XYrech, catSym),
            tableau === zones ? d * tailleZone : d, // Distance du centre
          ]);
      };
    });

  if (tableau === zones ||
    listeProches.length >= limite)
    return listeProches;

  return listeProches.concat(
    casesProches(
      xyzFromXY(xyCentre),
      distance / tailleZone,
      limite - listeProches.length,
      catSyms,
      zones)
  );
}

// VERBES : function(el, ...)
// return true : Succés

function bouger(el, pos, pos2) {
  if (trace) console.log('bouger', el.innerHTML, ...arguments);

  const xyElA = el.xy || {},
    xyA = {
      x: pos || xyElA.x, // caseX, caseY
      y: pos2 || xyElA.y,
      ...pos, // {x: caseX, y: caseY}
    },
    newPix = {
      ...pixFromXY(xyA),
      ...pos, // {left: ..px, top: ..px}
    },
    newXY = xyFromPix(newPix);

  // Ne peut bouger que vers une case où il n'y a que des objets autorisés
  //TODO BUG n'a pas les symboles autorisés
  /*//TODO ??? que des objets autorisés
  if (typeof pos !== 'undefined' &&
    catSym !== '') {
    const figCaseRech = Object.keys(caseEl(cases, newXY)),
      filteredCaseRech = figCaseRech.filter(v => !(catSyms + '▒▓⛲').includes(v)); //TODO symboles aotorisés

    if (filteredCaseRech.length)
      return false;
  }
  */

  if (el.parentNode &&
    (el.xy.x !== newXY.x || el.xy.y !== newXY.y)
  )
    // On part d'une position, bouge lentement
    window.setTimeout(() => { // Timeout ensures styles are applied before scrolling
      el.style.left = newPix.left + 'px';
      el.style.top = newPix.top + 'px';
    }, 50); //TODO BUG pourquoi faut-il attendre un peu ???
  else {
    // On y va direct
    el.style.left = newPix.left + 'px';
    el.style.top = newPix.top + 'px';
  }

  // On change l'el de case
  if (el.xy)
    delete caseEl(cases, el.xy)[el.innerHTML];

  caseEl(cases, newXY, el.innerHTML, el);

  return true;
}

function muer(el, catSym) {
  if (trace) console.log('muer', el.innerHTML, ...arguments);

  const scn = scenario(catSym);

  // Met à jour la catégorie dans l'el
  if (scn) {
    el.innerHTML = catSym;
    el.classList = scn[scn.length - 1].cat;
    el.data.age = 0; // L'âge repart à 0 si l'objet change de catégorie
  }
}

function creer(catSym, pos, pos2) {
  if (trace) console.log('creer', ...arguments);

  const el = document.createElement('div'),
    scn = scenario(catSym);

  // Données initiales du modèle
  el.noIteration = noIteration;
  if (scn) {
    el.data = {
      ...scn[scn.length - 1],
    };
    delete el.data.cat;
  }

  // Mouse actions
  el.draggable = true;
  /* eslint-disable-next-line no-use-before-define */
  el.ondragstart = dragstart;
  /* eslint-disable-next-line no-use-before-define */
  el.ondragend = dragend;
  /* eslint-disable-next-line no-use-before-define */
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

  muer(el, catSym);
  bouger(el, pos, pos2);
  document.body.appendChild(el);

  return el;
}

function supprimer(el) {
  if (trace) console.log('supprimer', el.innerHTML, ...arguments);

  delete caseEl(cases, el.xy)[el.innerHTML];
  el.remove();

  return true;
}

// Toutes les transformations de 0 ou 1 figurines en 0, 1, 2, ... figurines
// Change la position vers une case vide ou ne contenant que certaines catégories
function transformer(el, catSyms, pos, pos2) {
  if (trace) console.log('transformer', el.innerHTML, ...arguments);

  // el, ' ▒ ▓', (pix || xy || x, y) : déplace la figurine vers des cases vides ou autorisées
  // el, '💧' : transforme en cette catégorie
  // el, '🌾', (pix || xy || x, y) : transforme la figurine en cette catégorie et la déplace
  // el, '⛲ 💧 🧔👩' : transforme vers ⛲ et ajoute 💧 et 🧔👩

  const newCatSyms = catSyms.split(' '),
    catSym = newCatSyms.shift();

  muer(el, catSym);
  bouger(el, pos, pos2);

  // On crée les nouvelles figurines
  if (divEls.length < nbMaxFig) // S'il y a de la ressource
    newCatSyms.forEach(ncs => {
      creer(ncs, el.xy);
    });

  return el;
}

function errer(el) {
  if (trace) console.log('errer', el.innerHTML, el.noIteration, noIteration, [arguments]);

  const pp = casesProches(el.xy, 1, 1, ' ▒ ▓'); //TODO faire de cat autorisées un argument

  if (pp.length)
    return transformer(el, ' ▒ ▓', pp[0][4]); // errer
}

function rapprocher(el, catSym) { // Jusqu'à la même case
  if (trace) console.log('rapprocher', el.innerHTML, catSym, el.xy, el.noIteration, noIteration, [arguments]);

  const pp = casesProches(el.xy, tailleZone * tailleZone, 1, catSym);
  //TODO symboles autorisés

  if (pp.length) {
    const nouvelX = el.xy.x + pp[0][0],
      nouvelY = el.xy.y + pp[0][1];

    return transformer(el, // rapprocher
      el.innerHTML,
      nouvelX, nouvelY,
    ); // Accepte les cases contenant ce symbole
  }
}

function unir(el, catSym, catSymFinal) { // Dans la même case
  // 💧 : absorbe 💧
  // 💧, 🌽 : absorbe 💧 et se transforme en 🌽
  if (trace) console.log('unir', el.innerHTML, ...arguments);

  const trouveEl = caseEl(cases, el.xy, catSym);

  if (trouveEl) {
    for (const property in trouveEl.data) {
      // Récupérer les données de l'autre
      el.data[property] = ~~el.data[property] + trouveEl.data[property]
      el.data.age = 0;

      supprimer(trouveEl); // Le supprimer

      if (catSymFinal)
        return transformer(el, catSymFinal);
    }
  }
}

/* eslint-disable-next-line no-unused-vars */
function autogenerer(el, catSym, catSymFinal) { // Dans la même case
  if (trace) console.log('bouger', el.innerHTML, ...arguments);

}

// ACTIVATION (functions)
function iterer() {
  window.clearTimeout(timeoutID);

  if (noIteration < noIterationMax) {
    const debut = Date.now(),
      gameEls = [];

    noIteration++;
    if (trace) console.log('ITERER', noIteration, noIterationMax);

    // Fait un tableau avec les <div> existants
    for (const el of divEls)
      gameEls.push(el);

    // Exécution des actions
    gameEls.forEach(el => {
      if ( //TODO ??? el.noIteration < noIteration && // S'il n'a pas déjà été traité
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

        el.data.age = ~~el.data.age + 1;
        if (el.data.eau > 0)
          el.data.eau--;
        if (el.data.energie > 0)
          el.data.energie--;
      }
    });

    rebuildCases();

    if (window.location.search)
      statsEl.innerHTML = noIteration + ': ' +
      divEls.length + ' fig &nbsp; ' +
      (Date.now() - debut) + ' ms &nbsp; ' +
      Math.round((Date.now() - debut) / divEls.length * 10) / 10 + 'ms/obj';

    timeoutID = window.setTimeout(iterer, recurrence);
    //TODO BUG continue quand plantage en amont
  }
}

// RÉPONSES WINDOW / SOURIS / CLAVIER
window.onload = iterer;

function dragstart(evt) {
  if (trace) console.log('dragstart', evt);

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
    timeoutID = window.setTimeout(() => { // Pour avoir le temps que le drag copie l'imageAdd commentMore actions
      evt.target.remove();
    });

  helpEl.style.display = 'none';
}

document.ondragover = evt => {
  const el = document.elementFromPoint(evt.x, evt.y);

  if (el.tagName === 'HTML') // Il n'y a rien en dessous
    evt.preventDefault(); // Autorise drop
}

document.ondrop = evt => {
  if (trace) console.log('ondrop', evt);

  const px = {
    left: evt.x - dragInfo.offset.x,
    top: evt.y - dragInfo.offset.y,
  };

  if (dragInfo.tagName === 'LI')
    creer(dragInfo.el.innerHTML, px);
  else {
    bouger(dragInfo.el, px);
    document.body.appendChild(dragInfo.el);
  }

  dragInfo = null;
  rebuildCases();
};

function dragend(evt) {
  if (trace) console.log('dragend', evt);

  if (dragInfo && // Sauf si ça déjà terminé par ondrop
    document.elementFromPoint(evt.x, evt.y)) { // Sauf si c'est en dehors de la fenêtre
    bouger(dragInfo.el, dragInfo.bounds)
    document.body.appendChild(dragInfo.el);
  }
}

function loadWorld(datas) {
  // Vide le monde
  while (divEls.length)
    divEls[0].remove();

  // Ajoute les objets du json
  datas.forEach(d => {
    const el = creer(d[0], {
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
  // Cycle des humains 🧒👶
  '🧔': [
    [rapprocher, '👩'],
    //[unir, '👩', '🧔👩'],
    //...vivant,
    //[errer],
    {
      cat: 'Homme',
      eau: 50,
      energie: 50,
    },
  ],
  '👩': [
    [rapprocher, '🧔'],
    //[unir, '🧔', '🧔👩'],
    //...vivant,
    //[errer],
    {
      cat: 'Femme',
      eau: 50,
      energie: 50,
    },
  ],
  '🧔👩': [
    [transformer, '👫', d => d.age > 10],
    //...vivant,
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
    //[transformer, '💦', d => d.eau < 10],
    //[wwwWrapprocher, '🌱', 3],
    //[wwwWrapprocher, '🌾', 3],
    //[wwwWrapprocher, '🌽', 3],
    [errer], {
      cat: 'Eau',
      eau: 100,
    },
  ],
  '💦': [
    [rapprocher, '🌽'],
    [rapprocher, '🌾'],
    [rapprocher, '🌱'],
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
    [unir, '💧'],
    [unir, '💦'],
    //[transformer, '▒', d => d.eau <= 0],
    [transformer, '🌾', d => d.age > 10],
    {
      cat: 'Pousse',
    },
  ],
  '🌾': [
    [unir, '💧'],
    [unir, '💦'],
    //[transformer, '▒', d => d.eau <= 0],
    [transformer, '🌽', d => d.age > 10],
    {
      cat: 'Plante',
    },
  ],
  '🌽': [
    [unir, '💧'],
    [unir, '💦'],
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
  // 🥚🐣🐤🐥🐔🐓🦆🐀🐁🐇🐑🦊🐻🦋🐞🦉🦴

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
  /*
  ["🧱", 208, 112],
  ["🧱", 224, 112],
  ["▒", 240, 112],
  ["🧱", 208, 128],
  ["🧔", 224, 128],
  ["🧱", 240, 128],
  ["🧱", 208, 144],
  ["▓", 224, 144],
  ["🧱", 240, 144],
  */

  //['⛲', 120, 100],
  //['💧', 200, 160],
  //['🌽', 120, 100],
  //['❀', 120, 100],
  ['👩', 120, 200],
  ['🧔', 200, 300],
]);

/*Object.keys(o).forEach((catSym, i) => {
  creer(catSym, {
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

    if (noIteration < noIterationMax)
      iterer();
  };
}