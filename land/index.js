// Génère des clés aléatoires pour calculer les bosses du terrain
const rnd = Array(12).fill().map(() => Date.now() * Math.random() % 1);

function rndSin(marqueur, x, periode, min, max) {
  return Math.sin((x / periode + rnd[marqueur]) * 6.28) *
    rnd[marqueur + 1] *
    (max - min) +
    (max + min) / 2;
}

// Définition du terrain
/* eslint-disable-next-line one-var */
const tailleCase = 16,
  nbCasesX = 20,
  nbCasesY = nbCasesX * 1.4,
  //inTerrain = (xy) => 0 <= xy[0] && xy[0] < nbCasesX && 0 <= xy[1] && xy[1] < nbCasesY,
  cases = [], // Valeurs associées à chaque case
  terrainEl = document.getElementById('terrain'); // DOM d'affichage de la couleur des cases

// Initialise le DOM du terrain
for (let x = 0; x < nbCasesX; x++) {
  // Regroupé par colonnes
  terrainEl.insertAdjacentHTML('beforeend', '<div/>');
  cases[x] = [];

  // Initialisation du terrain
  for (let y = 0; y < nbCasesY; y++) {
    // Un DIV pour chaque case position: absolute
    terrainEl.lastChild.insertAdjacentHTML('beforeend', '<div>');
    Object.assign(terrainEl.lastChild.lastChild.style, {
      width: tailleCase * 1.6 + 'px', // Facteur de recouvrement
      top: (tailleCase * 0.866 * x) + 'px', // Triangle équilatéral
      left: (tailleCase * (y + x % 2 / 2)) + 'px', // En quiconce
    });

    // Valeurs initiales des cases du terrain
    cases[x][y] = {
      eau: 10,
      verdure: 50,
      altitude: 0,
    };

    // Ajout de 3 bosses
    for (let i = 0; i < 3; i++)
      cases[x][y].altitude +=
      rndSin(4 * i, x, nbCasesX, 0, 9) *
      rndSin(4 * i + 2, y, nbCasesY, 0, 9);
  }
}

// Calcul de la couleur d'une case
function rgbCase(c) {
  return [
    c.altitude,
    c.altitude * 0.7 + c.verdure * 0.3,
    c.altitude * 0.5 + c.eau * 0.5,
  ];
}

// Colore les éléments du terrain
function affiche() {
  for (let x = 0; x < nbCasesX; x++)
    for (let y = 0; y < nbCasesY; y++) {
      const caseEl = terrainEl.children[x].children[y],
        rgb = rgbCase(cases[x][y])
        .map(v => Math.max(0, Math.min(v, 255)))
        .join(',');

      caseEl.style.backgroundImage = 'radial-gradient(rgb(' + rgb + ') 42%, transparent 70%)';
    }
}
affiche();


//const tailleCase= terrainEl.firstChild.firstChild.clientWidth;
//console.log(tailleCase);//DCMM

// Fonctions générales
//const encadre = (min, val, max) => Math.max(min, Math.min(val, max));
//vMoy = (v1, v2) => v1.map((v, k) => (v + v2[k]) / 2),
//rgb = (v) => 'rgb(' + v.map(c => encadre(0, Math.round(c), 255)).join(',') + ')',
/*
  [...terrainEl.children].forEach((lineEl, y) => {
    [...lineEl.children].forEach((caseEl, x) => {
      caseEl.style.backgroundImage = 'radial-gradient(rgb(' + rgbCase(caseEl) + ') 45%, transparent 70%)';
console.log(rgbCase(caseEl) );//DCMM
    });
  });
}
*/

/*
function cellElFromXY(xy) {
  if (inTerrain(xy))
    return terrainEl.children[xy[1]].children[xy[0]];
};

function prochesEls(xy) {
  const x = xy[0],
    y = xy[1],
    y2 = (y + 1) % 2; // On décale une ligne sur 2 pour simuler un pattern hexagonal

  return [
      [x - y2, y - 1],
      [x + 1 - y2, y - 1],
      [x + 1, y],
      [x + 1 - y2, y + 1],
      [x - y2, y + 1],
      [x - 1, y],
    ].filter(inTerrain)
    .map(cellElFromXY);
}
*/

/* es lint-disable-next-line no-extend-native, func-names
Array.prototype.caseEl = function() {
  if (0 <= this[0] && this[0] < nbCasesX && 0 <= this[1] && this[1] < nbCasesY)
    return terrainEl.children[this[1]].children[this[0]];
}; */

//console.log(cellElFromXY([1, 1])); //DCMM
//console.log(prochesEls ([0,0]) );//DCMM
//TODO for (const [i, value] of myArray.entries()) {
//for (const [i, obj] of enumerate(myArray)) {
//for (const [y, lineEl]  of [...terrainEl.children])
//for (const [x, caseEl]   of Array.from(lineEl.children))    {
/* }
    for (let x = 0; x < nbCasesX; x++)
    for (let y = 0; y < nbCasesY; y++) {
      const caseEl = terrainEl.children[y].children[x],
  const      WWWrgbCell = [
          caseEl.altitude,
          caseEl.altitude * 0.7 + caseEl.verdure * 0.3,
          caseEl.altitude * 0.5 + caseEl.eau * 0.5,
        ].map(v => encadre(0, v, 255));*/


//const      rgbCellCentrale = rgbCase(caseEl);

/*  [
       caseEl.altitude,
       caseEl.altitude * 0.7 + caseEl.verdure * 0.3,
       caseEl.altitude * 0.5 + caseEl.eau * 0.5,
     ].map(v => encadre(0, v, 255));*/
//        .join(',');
//console.log(arguments);//DCMM

/*rgbCase.map((a,b)=>{
console.log([a,b]);//DCMM
  });*/

//console.log(caseEl.style);//DCMM
//caseEl.style.backgroundColor = 'red';

/*const    bkImg ='conic-gradient(from 30deg,' + [
           rgb(vMoy(rgbCellCentrale, [64, 128, 196])),
          rgb(vMoy(rgbCellCentrale, [64, 128, 196])),
          rgb(vMoy(rgbCellCentrale, [64, 196, 128])),
          rgb(vMoy(rgbCellCentrale, [128, 64, 196])),
          rgb(vMoy(rgbCellCentrale, [64, 128, 196])),
          rgb(vMoy(rgbCellCentrale, [196, 64, 128])),
          rgb(vMoy(rgbCellCentrale, [64, 128, 196])),
         ].join(',') + ')' ;*/
//console.log(bkImg); //DCMM

/*
    conic-gradient(from 30deg at rgb(39,77,104),rgb(39,77,104),rgb(39,111,70),
    rgb(71,45,104),rgb(39,77,104),rgb(105,45,70),rgb(39,77,104))
    
      //const titi = xyProches(x, y);
      //const toto = 'conic-gradient(from 30deg' + [].join(',') + ')';


      if (0)
        caseEl.style.backgroundImage = //'radial-gradient(rgb(' + rgb + ') 45%, transparent 70%)';
        //   'radial-gradient(rgba(' + rgb + ',1) 20%,  rgba(' + rgb + ',0) 60%),'+
        //'conic-gradient(from red 30deg, yellow 90deg, green 150deg, yellow 210deg, red 270deg, yellow 330deg, blue  )';
        ;
      // 'conic-gradient(from 45deg, blue, red)';
 */
// console.log(caseEl.style.backgroundImage); //DCMM

//////////////////////  FIN  //////////////////////
// Vie
function vie() {
  const x = parseInt(nbCasesX * Math.random(), 10),
    y = parseInt(nbCasesY * Math.random(), 10),
    centralEl = terrainEl.children[y].children[x],
    //  y2 = (y + 1) % 2, // On décale une ligne sur 2 pour simuler un pattern hexagonal
    proches = xyProches(x, y);

  //console.log(centralEl.altitude); //DCMM

  for (let d = 0; d < proches.length; d++)
    if (0 <= proches[d][0] && proches[d][0] < nbCasesX &&
      0 <= proches[d][1] && proches[d][1] < nbCasesY) {
      const procheEl = terrainEl.children[proches[d][1]].children[proches[d][0]];

      console.log(procheEl.altitude); //DCMM

      procheEl.innerHTML = '💧';
    }
  affiche();
}
//vie(); // Une première fois, pour tests


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

/*
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
  rayonRechercheMax = 3,
  tailleZone = rayonRechercheMax + 1,
  recurrence = 1000, // ms
  t0 = Date.now();

let dragInfo = null,
  noIteration = 0,
  noIterationMax = 1000000, // Starts immediately
  timeoutID = null,
  cases = [],
  zones = [],
  dataSav = [];
*/

// ROUTINES (functions)
/*
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

function setCase(xy, catSym, el, tableau) {
  // xy, '🌿', el : fill the case
  // xy, '🌿', <false> : delete the case
  // tableau = cases[] / zones[]
  // Il ne peut y avoir qu'un el de chaque catéorie dans une case
  if (trace) console.log('setCase', ...arguments);

  const tab = tableau ?? cases;

  if (!tab[xy.x])
    tab[xy.x] = [];

  if (!tab[xy.x][xy.y])
    tab[xy.x][xy.y] = [];

  // set/unset the cases
  if (el instanceof HTMLElement)
    tab[xy.x][xy.y][catSym] = el;
  else
    delete tab[xy.x][xy.y][catSym];

  // set/unset the zones
  if (tab === cases)
    setCase(xyzFromXY(xy), catSym, el, zones);
}

function caseEl(xy, catSyms, tableau) {
  // xy, '🌿🌳🍂' : return the els in the case matching the pattern
  // if the case is empty & the pattern includes ' ' : return []
  // if none, return false
  if (trace) console.log('caseEl', ...arguments);

  const tab = tableau ?? cases,
    c = tab[xy.x] ? (tab[xy.x][xy.y] ?? []) : [],
    r = [];

  Object.keys(c).forEach(k => {
    if (catSyms.includes(k))
      r.push(c[k]);
  });

  if (r.length || ( // Found
      !Object.keys(c).length && catSyms.includes(' ') // Empty requested & found
    ))
    return r;
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
    deltasProches.forEach(proches => {
      // On parcours le côté
      for (let i = 0; i < d && listeProches.length < limite; i++) {
        const xyRech = {
          x: xyCentre.x + d * proches[0] + i * proches[2],
          y: xyCentre.y + d * proches[1] + i * proches[3],
        };

        if (caseEl(xyRech, catSyms, tableau))
          listeProches.push([ // Préparation du retour
            ...proches,
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
    setCase(el.xy, el.innerHTML, el);

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
// return true : Succes

function supprimer(el) { // Uniquement supprimer
  if (trace) console.log('supprimer', el.innerHTML, ...arguments);

  if (el.xy) {
    setCase(el.xy, el.innerHTML, false);
    el.remove();

    return true;
  }
}

function deplacer(el, pos, pos2) { // Uniquement changer xy
  if (trace) console.log('deplacer', el.innerHTML, ...arguments);

  const xyElA = el.xy ?? {},
    xyA = {
      x: pos ?? xyElA.x, // caseX, caseY
      y: pos2 ?? xyElA.y,
      ...pos, // {x: caseX, y: caseY}
    },
    newPix = {
      ...pixFromXY(xyA),
      ...pos, // {left: ..px, top: ..px}
    },
    newXY = xyFromPix(newPix),
    parentEl = document.elementFromPoint(newPix.left, newPix.top);

  if (parentEl) { // Si on est dans la fenêtre
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
    if (el.xy)
      setCase(el.xy, el.innerHTML, el);
    el.xy = newXY;
    setCase(newXY, el.innerHTML, el);

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
  if (scn.length) {
    el.data = { // Enum to clone the values
      ...scn.at(-1),
    };
    delete el.data.cat;
  }

  // Mouse actions
  el.draggable = true;
  / * eslint-disable-next-line no-use-before-define * /
  el.ondragstart = dragstart;
  / * eslint-disable-next-line no-use-before-define * /
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

/ * eslint-disable-next-line no-unused-vars * /
function errer(el, catSymsAuth) { // Uniquement déplacer
  if (trace) console.log('errer', el.innerHTML, ...arguments);

  const pp = casesProches(el.xy, 1, 1, catSymsAuth);

  if (pp.length)
    return deplacer(el, pp[0][4]); // errer
}

function produire(el, catSym) { // Crée un nouvel objet au même emplacement
  if (trace) console.log('produire', el.innerHTML, ...arguments);

  if (divEls.length < nbMaxFig) {
    const newData = scenario(catSym).at(-1);

    // Vérification des ressources
    for (const property in newData)
      if (typeof newData[property] === 'number' &&
        newData[property] > ~~el.data[property])
        return false;

    / * eslint-disable-next-line one-var * /
    const newEl = creer(catSym, pixFromEl(el)); // Crée une nouvelle figurine

    // Prendre les ressources de la nouvelle figurine dans celle qui la produit
    for (const property in newEl.data)
      el.data[property] = ~~el.data[property] - newEl.data[property];

    el.data.age = 0;
    return newEl;
  }
}

function rapprocher(el, catSymsRech, catSymsAuth) { // Jusqu'à la colocalisation
  // catSymsRech = symboles recherchés vers qui aller
  // catSymsAuth = symboles autorisés pour le déplacement (commence par ' ')
  if (trace) console.log('rapprocher', el.innerHTML, ...arguments);

  if (caseEl(el.xy, catSymsRech))
    return false; // Il y en dèjà sur la même case

  const pp = casesProches(el.xy, tailleZone * tailleZone, 1, catSymsRech);

  if (pp.length) {
    const newXY = {
      x: el.xy.x + pp[0][0],
      y: el.xy.y + pp[0][1],
    };

    if (caseEl(newXY, catSymsRech + catSymsAuth))
      return deplacer(el, newXY);
  }
}

function unir(el, catSymsRech, catSymsReplace) {
  // Fusionne deux figurines dans la même case.
  if (trace) console.log('unir', el.innerHTML, ...arguments);

  const catSymsNew = (catSymsReplace ?? el.innerHTML).split(' '),
    trouveEls = caseEl(el.xy, catSymsRech);

  if (trouveEls && trouveEls.length) {
    // Récupérer les données de l'autre
    for (const property in trouveEls[0].data)
      el.data[property] = ~~el.data[property] + trouveEls[0].data[property];

    el.data.age = 0;
    supprimer(trouveEls[0]);
    muer(el, catSymsNew.shift());

    // Crée les nouveaux objets au même emplacement
    catSymsNew.forEach(cs => produire(el, cs));

    return true;
  }
}

/ * eslint-disable-next-line no-unused-vars * /
function reunir(el, catSymsRech, catSymsReplace, catSymsAuth) {
  if (unir(el, catSymsRech, catSymsReplace, catSymsAuth))
    return true;

  return rapprocher(el, catSymsRech, catSymsAuth);
}

// ACTIVATION (functions)
function iterer() {
  window.clearTimeout(timeoutID);

  if (noIteration < noIterationMax) {
    if (trace) console.log('iterer');

    const debut = Date.now(),
      gameEls = [];

    noIteration++;
    if (trace);
    console.log('ITERER', debut - t0, noIteration, noIterationMax);

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
              /* //TODO const executionFunction = parametresAction[parametresAction.length - 2];
              if (statusExec &&
                parametresAction.length > 2 &&
                typeof executionFunction === 'function'
              ) {
                //parametresAction.pop();
                executionFunction(el.data);
              }* /

            });

        el.data.age = ~~el.data.age + 1;
        el.data.eau = ~~el.data.eau - 1;
        el.data.energie = ~~el.data.energie - 1;
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
  if (trace) console.log('loadWorld', ...arguments);

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

/ * eslint-disable-next-line no-unused-vars * /
function load(evt) {
  if (trace) console.log('load', evt);

  const blob = evt.target.files[0],
    reader = new FileReader();
  //TODO BUG ne marche pas si charge 2 fois le même consécutivement
  //index.js:570: Failed to execute 'readAsText' parameter 1 is not of type 'Blob'.

  reader.readAsText(blob);
  reader.onload = () =>
    loadWorld(JSON.parse(reader.result));

  helpEl.style.display = 'none';
}

/ * eslint-disable-next-line no-unused-vars, one-var * /
const save = async () => {
  if (trace) console.log('save');

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

    iterer();
  };
}
*/