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

/* global scenarii */

const divEls = document.getElementsByTagName('div'), // Les figurines
  liEls = document.getElementsByTagName('li'), // Les modèles
  helpEl = document.getElementById('help'),
  statsEl = document.getElementById('stats'),
  trace = window.location.search.match(/trace/u),
  debugInit = window.location.search.match(/[0-9]+/u),
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
  nbMaxFig = 255, // Nombre maximum de figurines dans la femnêtre
  rayonRechercheMax = 4,
  tailleZone = rayonRechercheMax + 1,
  recurrence = 1000; // ms

let dragInfo = null,
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
  const scn = scenarii[catSym];

  // Le symbole doit avoir un senario
  if (typeof scn === 'undefined') {
    console.log('Symbole inconnu : ', catSym);
    return [];
  }
  return scn;
}


// Get / set cases[] & zones[] el
function caseEl(tableau, xy, catSym, el) {
  // tableau = cases[] / zones[]
  // 7, 7 : returns the case contents []
  // 7, 7, 🌿 : return the html element of thois category
  // 7, 7, 🌿, el : fill the case
  // Il ne peut y avoir qu'un el de chaque catéorie dans une case

  if (typeof catSym === 'undefined' &&
    (typeof tableau[xy.x] === 'undefined' || typeof tableau[xy.x][xy.y] === 'undefined'))
    return [];

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
  return tableau[xy.x][xy.y][catSym] || {};
}

function filtreCase(tableau, xy, catSyms) {
  const catSymsDefault = catSyms || ' ',
    caseRech = Object.keys(caseEl(tableau || cases, xy)),
    caseRechDefault = caseRech.length ? caseRech : [' '];

  return caseRechDefault.some(v => catSymsDefault.includes(v));
}

function casesProches(xyCentre, distance, limite, catSyms, tableau) {
  // el : Autour de el
  // distance = Rayon (nb cases) autour de el
  // limite = nombre de cases ramenées
  // catSyms = '🌱🌾' : symboles de catégories de figurines recherchés (x = case vide)
  // tableau = undefined | cases | zones
  if (trace) console.log('casesProches', ...arguments);

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
        const xyRech = {
          x: xyCentre.x + d * delta[0] + i * delta[2],
          y: xyCentre.y + d * delta[1] + i * delta[3],
        };

        if (filtreCase(tableau, xyRech, catSyms))
          listeProches.push([ // Préparation du retour
            ...delta,
            xyRech,
            tableau === zones ? d * tailleZone : d, // Distance du centre
          ]);
      }
    });

  if (tableau === zones ||
    distance < tailleZone ||
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

function rebuildCases() {
  if (trace) console.log('rebuildCases');

  cases = [];
  zones = [];
  dataSav = [];

  for (const el of divEls)
    if (el.data && !el.hovered) // Pas si le curseur est au dessus
  {
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
      scenarii[el.innerHTML].at(-1).cat + ' ' +
      JSON.stringify(filteredData).replace(/\{|"|\}/gu, '') +
      (window.location.search ?
        ' ' + el.xy.x + ',' + el.xy.y +
        ' ' + xyzFromXY(el.xy).x + ',' + xyzFromXY(el.xy).y +
        ' ' + el.style.left + ',' + el.style.top :
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

// VERBES : function(el, ...)
// return true : Succés

function supprimer(el, keep) { // Uniquement supprimer
  if (trace) console.log('supprimer', el.innerHTML, ...arguments);

  if (el.xy) {
    delete caseEl(cases, el.xy)[el.innerHTML];

    if (!keep)
      el.remove();

    return true;
  }
}

function deplacer(el, pos, pos2) { // Uniquement changer xy
  if (trace) console.log('deplacer', el.innerHTML, ...arguments);

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
    newXY = xyFromPix(newPix),
    arrivalEl = document.elementFromPoint(newPix.left, newPix.top);

  if (arrivalEl) { // Si on est dans la fenêtre
    if (el.parentNode && el.xy && newXY &&
      (el.xy.x !== newXY.x || el.xy.y !== newXY.y)
    )
      // On part d'une position, bouge lentement
      window.setTimeout(() => { // Timeout ensures styles are applied before scrolling
        el.style.left = newPix.left + 'px';
        el.style.top = newPix.top + 'px';
      });
    else {
      // On y va direct
      el.style.left = newPix.left + 'px';
      el.style.top = newPix.top + 'px';
    }

    // On change l'el de case
    supprimer(el, true);
    caseEl(cases, newXY, el.innerHTML, el);

    return true;
  }
}

function muer(el, catSym) { // Uniquement changer de catégorie
  if (trace) console.log('muer', el.innerHTML, ...arguments);
  //TODO opacity transition

  const scn = scenario(catSym);

  // Met à jour la catégorie dans l'el
  if (scn.length) {
    el.innerHTML = catSym;
    el.classList = scn.at(-1).cat;
    el.data.age = 0; // L'âge repart à 0 si l'objet change de catégorie
  }
}

function creer(catSym, pos, pos2) { // Uniquement créer une nouvella figurine
  if (trace) console.log('creer', ...arguments);

  const el = document.createElement('div'),
    scn = scenario(catSym);

  // Données initiales du modèle
  el.noIteration = noIteration;
  if (scn.length) {
    el.data = {
      ...scn.at(-1),
    };
    delete el.data.cat;
  }

  // Mouse actions
  el.draggable = true;
  /* eslint-disable-next-line no-use-before-define */
  el.ondragstart = dragstart;
  /* eslint-disable-next-line no-use-before-define */
  el.ondragend = dragend;
  el.ondblclick = evt => supprimer(evt.target);

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
  deplacer(el, pos, pos2);
  document.body.appendChild(el);

  return el;
}

/* eslint-disable-next-line no-unused-vars */
function errer(el, catSymsAuth) { // Uniquement déplacer
  if (trace) console.log('errer', el.innerHTML, ...arguments);

  const pp = casesProches(el.xy, 1, 1, catSymsAuth);

  if (pp.length)
    return deplacer(el, pp[0][4]); // errer
}

/* eslint-disable-next-line no-unused-vars */
function rapprocher(el, catSymsRech, catSymsAuth) { // Jusqu'à la colocalisation
  // catSymsRech = symboles recherchés vers qui aller
  // catSymsAuth = symboles autorisés pour le déplacement (commence par ' ')
  if (trace) console.log('rapprocher', el.innerHTML, ...arguments);

  const pp = casesProches(el.xy, tailleZone * tailleZone, 1, catSymsRech);

  if (pp.length) {
    const newXY = {
      x: el.xy.x + pp[0][0],
      y: el.xy.y + pp[0][1],
    };

    if (filtreCase(cases, newXY, catSymsRech + (catSymsAuth || ' ')))
      return deplacer(el, newXY);
  }
}

/* eslint-disable-next-line no-unused-vars */
function unir(el, catSym, catSymNew) { // Fusionne un une figurine de la catégorie présente dans la même case.
  if (trace) console.log('unir', el.innerHTML, ...arguments);

  const trouveEl = caseEl(cases, el.xy, catSym);

  if (trouveEl.innerHTML) {
    // Récupérer les données de l'autre
    for (const property in trouveEl.data)
      el.data[property] = ~~el.data[property] + trouveEl.data[property];

    el.data.age = 0;
    supprimer(trouveEl);
    muer(el, catSymNew);

    return true;
  }
}

/* eslint-disable-next-line no-unused-vars */
function produire(el, catSym) { // Crée un nouvel objet au même emplacement
  if (trace) console.log('produire', el.innerHTML, ...arguments);

  if (divEls.length < nbMaxFig) {
    const newData = scenario(catSym).at(-1);

    // Vérification des ressources
    for (const property in newData)
      if (typeof newData[property] === 'number' &&
        newData[property] > ~~el.data[property])
        return false;

    /* eslint-disable-next-line one-var */
    const newEl = creer(catSym, pixFromEl(el)); // Crée une nouvelle figurine

    // Prendre les ressources de la nouvelle figurine dans celle qui la produit
    for (const property in newEl.data)
      el.data[property] = ~~el.data[property] - newEl.data[property];

    el.data.age = 0;
    return newEl;
  }
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
      if (el.parentNode && // S'il est affichable
        el.data && !el.hovered) // Si le curseur n'est pas au dessus
      {
        if (typeof scenarii[el.innerHTML] === 'object')
          scenarii[el.innerHTML].slice(0, -1) // Enlève la structure d'initialisation à la fin
          .every(a => // Exécute chaque action tant qu'elle retourne false
            {
              // Condition to the last argument (function)
              const parametresAction = [...a],
                conditionFunction = parametresAction.at(-1);

              if (parametresAction.length > 1 && // S'il y a assez d'arguments
                typeof conditionFunction === 'function') // Si le dernier argument est une fonction
              {
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
      statsEl.innerHTML =
      noIteration + ': ' +
      divEls.length + ' fig &nbsp; ' +
      (Date.now() - debut) + ' ms &nbsp; ' +
      Math.round((Date.now() - debut) / divEls.length * 10) / 10 + 'ms/obj';

    timeoutID = window.setTimeout(iterer, recurrence);
    //TODO BUG continue quand plantage en amont
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

// RÉPONSES WINDOW / SOURIS / CLAVIER
window.onload = () => {
  // Initialisation des modèles
  [...liEls].forEach(el => {
    el.data = {
      ...scenarii[el.innerHTML].at(-1),
    };
    el.title = el.data.cat;
    delete el.data.cat;
  });

  iterer();
}

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

  if (el.tagName === 'BODY') // Il n'y a rien en dessous
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
    deplacer(dragInfo.el, px);
    document.body.appendChild(dragInfo.el);
  }

  dragInfo = null;
  rebuildCases();
};

function dragend(evt) {
  if (trace) console.log('dragend', evt);

  if (dragInfo && // Sauf si ça déjà terminé par ondrop
    document.elementFromPoint(evt.x, evt.y)) { // Sauf si c'est en dehors de la fenêtre
    deplacer(dragInfo.el, dragInfo.bounds)
    document.body.appendChild(dragInfo.el);
  }
}

/* eslint-disable-next-line no-unused-vars */
function load(evt) {
  const blob = evt.target.files[0],
    reader = new FileReader();
  //TODO BUG ne marche pas si charge 2 fois le même consécutivement
  //index.js:570: Failed to execute 'readAsText' parameter 1 is not of type 'Blob'.

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