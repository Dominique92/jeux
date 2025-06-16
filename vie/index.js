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
  rayonRechercheMax = 3,
  tailleZone = rayonRechercheMax + 1,
  gigue = () => Math.random() * 4 - 2,
  trace = window.location.search.match(/trace/u);

let o = {},
  dragInfo = null,
  noIteration = 0,
  noIterationMax = 0,
  cases = [], // 0 : cases, 1 : zones (pavé de 4)
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
 * cases[0] : tableau à 2 dimensions dont chaque case pointe sur 0 ou 1 figurine de la même catéorie max
 * cases[1] : un tableau à 2 dimensions par catéorie de figurine représentant leur nombre dans chaque carré de n * n cases
 * xy : position de la figurine dans le tableau des cases (x, y)
 * px : position de la figurine en pixels (left, top)
 *
 * Routine : fonction qui manipule les données du programme
 * Verbe : fonction à exécuter qui réalise une action sur une figurine
 * Scenario : liste d'actions ou de scenarios à exécuter dans l'ordre,
     la première ayant abouti interrompt la liste
 */

// ROUTINES (functions)
function xyFromPx(px) {
  return {
    x: Math.round((px.left + px.top / 1.732) / boxSize),
    y: Math.round(px.top / 0.866 / boxSize),
  };
}

function pxFromXY(xy) {
  return {
    left: (xy.x - xy.y / 2) * boxSize + gigue(),
    top: xy.y * 0.866 * boxSize + gigue(),
  };
}

function pxFromEl(el) {
  return {
    left: el.getBoundingClientRect().left,
    top: el.getBoundingClientRect().top,
  };
}

// Get / set case el
function caseEl(xy, catSym, el) {
  // 7,7 : returns the case contents []
  // 7,7,🌿 : returns the html element
  // 7,7,🌿,el : fill the case
  // Il ne peut y avoir qu'un el de chaque catéorie dans une case

  const xyZ = {
    x: Math.round(xy.x / tailleZone),
    y: Math.round(xy.y / tailleZone),
  };

  if (typeof xy === 'undefined')
    return [];

  // Zone vide
  for (let z = 0; z < 2; z++)
    if (typeof cases[z] === 'undefined')
      cases[z] = [];

  // Colonne vide
  if (typeof cases[0][xy.x] === 'undefined') {
    if (el) // Si élément à placer
      cases[0][xy.x] = [];
    else
      return [];
  }
  if (el && typeof cases[1][xyZ.x] === 'undefined')
    cases[1][xyZ.x] = [];

  // Ligne vide
  if (typeof cases[0][xy.x][xy.y] === 'undefined') {
    if (el)
      cases[0][xy.x][xy.y] = [];
    else
      return [];
  }
  if (el && typeof cases[1][xyZ.x][xyZ.y] === 'undefined')
    cases[1][xyZ.x][xyZ.y] = [];

  // array des el dans une case
  if (typeof catSym === 'undefined')
    return cases[0][xy.x][xy.y];

  // Mets l'el dans la case et la zone
  if (typeof el === 'object') {
    cases[0][xy.x][xy.y][catSym] = el;
    cases[1][xyZ.x][xyZ.y][catSym] = true;
    el.xy = xy;
  }

  // L'el d'une case pour une catéorie
  return cases[0][xy.x][xy.y][catSym];
}

function rebuildCases() {
  const divEls = document.getElementsByTagName('div');

  cases = [];
  dataSav = [];

  for (const el of divEls)
    if (el.data && !el.hovered) // Pas si le curseur est au dessus
  {
    const filteredData = Object.fromEntries(
      Object.entries(el.data)
      .filter(v => v[1])
    );

    // Population des cases
    caseEl(el.xy, el.innerHTML, el);

    // Figurines title
    el.title =
      o[el.innerHTML][o[el.innerHTML].length - 1].cat + ' ' +
      JSON.stringify(filteredData).replace(/\{|"|\}/gu, '') +
      (window.location.search ? ' ' + el.xy.x + ',' + el.xy.y : '');

    // Data to be saved in a file
    dataSav.push([
      el.innerHTML,
      Math.round(el.getBoundingClientRect().left),
      Math.round(el.getBoundingClientRect().top),
      filteredData,
    ]);
  }
}

function casesProches(el, distance, limite, catSym) {
  // el : Autour de el
  // distance : Rayon (nb cases) autour de el
  // limite : nombre de cases ramenées
  // catSym : catégorie de figurines 🌿 recherchés (string unicode)

  const listeProches = [];

  // Randomize search order
  for (let i = Math.random() * deltasProches.length; i > 0; i--)
    deltasProches.push(deltasProches.shift());

  if (el.xy)
    // cases / zones
    for (let z = 0; z < 2; z++) //TODO TEST distance > rayonRechercheMax
      // Recherche dans un rayon donné
      for (let d = 1; d < Math.min(distance, rayonRechercheMax) + 1 && listeProches.length < limite; d++)
        // Pour chacune des 6 directions
        deltasProches.forEach(delta => {
          // On parcours le côté
          for (let i = 0; i < d && listeProches.length < limite; i++) {
            const tz = z ? tailleZone : 1, // Zones / Cases
              XYrech = {
                x: Math.round(el.xy.x / tz) + d * delta[0] + i * delta[2],
                y: Math.round(el.xy.y / tz) + d * delta[1] + i * delta[3],
              },
              nbFigCaseRech = Object.keys(caseEl(XYrech)).length;

            if ((catSym && nbFigCaseRech) || // On cherche et trouve un symbole de la catégotie
              (!catSym && !nbFigCaseRech)) // On cherche une case vide
              listeProches.push([
                ...delta,
                XYrech,
                z ? null : caseEl(XYrech, catSym),
              ]);
          };
        });

  return listeProches;
}

// VERBES : function(el, ...)
// return true : Succés

// Toutes les transformations de 0 ou 1 figurines en 0, 1, 2, ...
function transformer(elA, ncsA, pos, pos2) {
  // null, '💧', (px || xy || x,y) : crée la figurine
  // el tout seul : supprime la figurine
  // el, '<même sym>', (px || xy || x,y) : déplace la figurine
  // el, '💧' : transforme en cette catégorie
  // el, '⛲ 💧 🧔👩' : transforme vers ⛲ et ajoute 💧 et 🧔👩

  let el = elA;

  const newCatSyms = (typeof ncsA === 'string' ? ncsA : el.innerHTML)
    .split(' '), // Séparés par un espace
    catSym = newCatSyms.shift(),
    newPx = {
      ...pxFromXY({
        x: pos, // caseX, caseY
        y: pos2,
        ...pos || el.xy, // {x: caseX, y: caseY}
      }),
      ...pos, // {left: px, top: px}
    },
    newXY = xyFromPx(newPx);

  if (trace) console.log('transformer', arguments, noIteration, catSym, newPx, newXY, newCatSyms); //DCM trace

  if (el === null) { // On créee une nouvelle figurine
    el = document.createElement('div');

    // Données initiales du modèle
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

    // Hold moves when hover
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
      delete caseEl(el.xy)[el.innerHTML];

    // Supprime et c'est tout
    if (typeof ncsA !== 'string') {
      el.remove();
      return true;
    }
  }

  // Re-positionne la figurine
  caseEl(newXY, catSym, el); // On la re-met dans la case

  if (el.parentNode) // On part d'une position, bouge lentement
    setTimeout(() => { // Timeout ensures styles are applied before scrolling
      el.style.left = newPx.left + 'px';
      el.style.top = newPx.top + 'px';
    }, 50); //TODO il faut attendre un peu ???
  else { // On y va direct
    el.style.left = newPx.left + 'px';
    el.style.top = newPx.top + 'px';
  }

  // Re-affiche la figurine dans la fenêtre
  document.body.appendChild(el);

  // Met à jour la catégorie dans l'el
  if (catSym !== el.innerHTML) {
    el.innerHTML = catSym;
    el.classList = o[catSym][o[catSym].length - 1].cat;
    el.data.age = 0; // L'âge repart à 0 si l'objet change de catégorie
  }

  // On crée les nouvelles figurines
  newCatSyms.forEach(cs => {
    transformer(null, cs, el.xy);
  });

  return true;
}

// Déplacer el à la position x/y si elle est libre
function wwwWdeplacer(el, a, b, acceptCatSyms) {
  // La seule fonction habilitée à wwwWajouter / enlever un el dans le body et dans cases[][]
  // el tout seul : supprime
  // acceptCatSyms = '👩💧💦' : autorise à aller dans une case où il y a déjà cette catégorie
  if (trace) console.log('wwwWdeplacer', el.innerHTML, el.noIteration, noIteration, arguments); //DCM trace

  const newPx = {
      ...pxFromXY({
        x: a, // caseX, caseY
        y: b,
        ...a, // {x: caseX, y: caseY}
      }),
      ...a, // {left: px, top: px}
    },
    newXY = xyFromPx(newPx),
    tas = '▒▓' + (acceptCatSyms || '');

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
function wwwWmuer(el, newCatSym) { // 1 -> 1
  if (trace) console.log('wwwWmuer', el.innerHTML, el.noIteration, noIteration, arguments); //DCM trace

  // Retire de la case actuelle
  if (el.innerHTML)
    delete caseEl(el.xy)[el.innerHTML];

  caseEl(el.xy, newCatSym, el);
  el.innerHTML = newCatSym;
  el.classList = o[newCatSym][o[newCatSym].length - 1].cat;
  el.data.age = 0; // L'âge repart à 0 si l'objet change de catégorie

  return true;
}

function errer(el) { // 1 -> 1
  if (trace) console.log('errer', el.innerHTML, el.noIteration, noIteration, arguments); //DCM trace

  const pp = casesProches(el, 1, 1);

  if (pp.length)
    return transformer(el, el.innerHTML, pp[0][4]); // errer
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
              /* eslint-disable-next-line one-var */
              const statusExec = parametresAction[0](el, ...parametresAction.slice(1));

              /*//TODO const executionFunction = parametresAction[parametresAction.length - 2];
              if (statusExec &&
                parametresAction.length > 2 &&
                typeof executionFunction === 'function'
              ) {
                //parametresAction.pop();
                executionFunction(el.data);
              }*/

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

    if (window.location.search)
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

function dragstart(evt) {
  if (trace) console.log('dragstart', evt); //DCM trace

  dragInfo = {
    el: evt.target,
    innerHTML: evt.target.innerHTML,
    tagName: evt.target.tagName,
    style: { // Clone array
      ...evt.target.style,
    },
    bounds: pxFromEl(evt.target),
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
  if (trace) console.log('ondrop', evt); //DCM trace

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
  if (dragInfo) {
    if (trace) console.log('dragend', evt); //DCM trace

    // Start from the end drag cursor position
    dragInfo.el.style.left = evt.x + 'px';
    dragInfo.el.style.top = evt.y + 'px';
    document.body.appendChild(dragInfo.el);
    // Then, move slowly to the initial position
    transformer(dragInfo.el, dragInfo.el.innerHTML, dragInfo.bounds)
  }
}

function loadWorld(datas) {
  // Vide le monde
  for (let divEls = document.getElementsByTagName('div'); divEls.length; divEls = document.getElementsByTagName('div'))
    divEls[0].remove();

  // Ajoute les objets du json
  datas.forEach(d => {
    const el = transformer(null, d[0], {
      left: d[1],
      top: d[2]
    });

    if (d.data)
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
    [consommer, '🌿', 'energie'],
    [consommer, '🌱', 'energie'],
  ];
*/

o = {
  // Cycle de l'eau
  '⛲': // Scénario de la catégorie d'objet
    [ // Action élémentaire du scénario
      [transformer, // Verbe à exécuter
        '⛲ 💧', // Symboles pour remplacer et créer
        //TODO ??? () => {}, // Fonction à exécuter aprés avoir appliqué la règle la règle
        () => Math.random() < 0.2 // Test d'applicabilité de la règle
      ],
      //TODO BUG déplace un peu ⛲ la premi-re fois qu'on produit 💧
      { // Init des data quand on crée
        cat: 'Fontaine',
      },
    ],
  '💧': [
    //[wwwTransformer, '💦 ❀ 🧔👩'],
    //[transformer, '💦', d => d.eau < 10],
    //[transformer, '💦'],
    //[wwwWrapprocher, '🌱', 3],
    //[wwwWrapprocher, '🌿', 3],
    //[wwwWrapprocher, '🌽', 3],
    [errer], {
      cat: 'Eau',
      eau: 20, //TODO 100,
    },
  ],
  ////////////TODO TEST
  '💦': [
    //[wwwTransformer, d => d.eau <= 100],
    [errer],
    {
      cat: 'Eau',
    },
  ],
  // Cycle des plantes
  // 🥑🍆🌰🍇🍈🍉🍊🍋🍋‍🍌🍍🥭🍎🍏🍐🍑🍒🍓🥝🍅🥥💮🌸
  // 🌳🥦🍄🥔🥕🌽🌶️🥒🥬🧄🧅🥜🎕🌾
  '❀': [
    //[wwwWmuer, '🌱', d => d.age > 10],
    //[wwwWrapprocher, '▒', 3],
    //[wwwWabsorber, '▒', '🌱'],
    [errer], {
      cat: 'Graine',
    },
  ],
  '🌱': [
    //[wwwWabsorber, '💧'],
    //[wwwWabsorber, '💦'],
    //[wwwWmuer, '▒', d => d.eau <= 0],
    //[wwwWmuer, '🌿', d => d.age > 20],
    {
      cat: 'Pousse',
    },
  ],
  '🌿': [
    //[wwwWabsorber, '💧'],
    //[wwwWabsorber, '💦'],
    //[wwwWmuer, '▒', d => d.eau <= 0],
    //[wwwWmuer, '🌽', d => d.age > 20],
    {
      cat: 'Plante',
    },
  ],
  '🌽': [
    //[wwwWabsorber, '💧'],
    //[wwwWabsorber, '💦'],
    //[wwwWmuer, '▒', d => d.eau <= 0],
    //[wwwWmuer, '▓', d => d.eau > 100],
    //[wwwWproduire, '❀', () => Math.random() < 0.2],
    {
      cat: 'Mais',
    },
  ],
  '▒': [{
    cat: 'Terre',
  }],
  '▓': [{
    cat: 'Herbe',
  }],
  // Cycle des humains
  // 🧒👶👷
  '🧔': [
    //[wwwWrapprocher, '👩'],
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
    //[wwwWrapprocher, '🧔'],
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
    //[wwwWmuer, '👫', 5],
    //[errer],
    {
      cat: 'Dating',
    },
  ],
  '💏': [
    //...vivant,
    //[wwwWmuer, '👫', 5],
    [errer],
    {
      cat: 'Amoureux',
    },
  ],
  '👫': [
    //...vivant,
    //[wwwWmuer, '👪', 5],
    [errer],
    {
      cat: 'Couple',
    },
  ],
  '👪': [
    //...vivant,
    //[wwwWmuer, '👫', 15],
    //TODO wwwWproduire enfant
    [errer],
    {
      cat: 'Famille',
    },
  ],
  '🧍': [
    //...vivant,
    //TODO wwwWmuer 50% 🧔 50% 👩
    [errer],
    {
      cat: 'Enfant',
    },
  ],
  '💀': [
    //[wwwWmuer, '▒', 15],
    {
      cat: 'Mort',
    },
  ],
  // Cycle des travaux
  // 🚧🔥
  '🧱': [{
    cat: 'Briques',
  }],
  '🏠': [
    //[wwwWrencontrer, '▒'],
    {
      cat: 'Maison',
    },
  ],
  // Cycle des animaux
  // 🐇🐀🦊🦴
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
  ["💧", 160, 160],
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

Object.keys(o).forEach((catSym, i) => {
  transformer(null, catSym, {
    left: 70 + Math.floor(i / 4) * 70,
    top: 70 + i % 4 * 70
  });
});
 */

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