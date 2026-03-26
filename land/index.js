// Définition du terrain
const tailleMonde = 400,
  tailleCaseX = 16, // Pixels// 16
  tailleCaseY = tailleCaseX * 0.866, // cos 30°
  nbCasesX = Math.round(tailleMonde / tailleCaseX),
  nbCasesY = Math.round(tailleMonde / tailleCaseY / 2) * 2, // Pour être pair
  rnd = Array(12).fill().map(() => Date.now() * Math.random() % 1), // tableau de valeurs aléatoires
  //inTerrain = (xy) => 0 <= xy[0] && xy[0] < nbCasesX && 0 <= xy[1] && xy[1] < nbCasesY,
  cases = [], // Valeurs associées à chaque case [x] [y]
  terrainEl = document.getElementById('terrain'); // DOM d'affichage de la couleur des cases

// Fonction aléatoire pour calculer les bosses du terrain
function rndSin(marqueur, x, periode, min, max) {
  return Math.sin((x / periode + rnd[marqueur]) * 6.28) *
    rnd[marqueur + 1] *
    (max - min) +
    (max + min) / 2;
}

// Initialise le DOM du terrain, regroupé par lignes
for (let y = 0; y < nbCasesY; y++) {
  terrainEl.insertAdjacentHTML('beforeend', '<div/>');
  cases[y] = [];

  for (let x = 0; x < nbCasesX; x++) {
    // Un DIV pour chaque case position: absolute
    terrainEl.lastChild.insertAdjacentHTML('beforeend', '<div>');
    Object.assign(terrainEl.lastChild.lastChild.style, {
      width: tailleCaseX * 1.6 + 'px', // Facteur de recouvrement
      top: (tailleCaseY * y) + 'px', // Triangle équilatéral
      left: (tailleCaseX * (x + y % 2 / 2)) + 'px', // En quiconce
    });

    // Valeurs initiales des cases du terrain
    cases[y][x] = {
      eau: 10,
      verdure: 50,
      altitude: 0,
    };

    // Ajout de 3 bosses
    for (let i = 0; i < 3; i++)
      cases[y][x].altitude +=
      rndSin(4 * i, x, nbCasesX, 0, 9) *
      rndSin(4 * i + 2, y, nbCasesY, 0, 9);
  }
}

// Calcul de la couleur d'une case
function rgbCase(c) {
  return [255, 192, 128].time(c.altitude / 256)
    .plus([0, 64, 0].time(c.verdure / 256))
    .plus([0, 0, 128].time(c.eau / 256))
    .borne(0, 255);
}

// Colore les éléments du terrain
function affiche() {
  for (let x = 0; x < nbCasesX; x++)
    for (let y = 0; y < nbCasesY; y++) {
      const caseEl = terrainEl.children[y].children[x],
        rgb = rgbCase(cases[y][x]).join(',');

      caseEl.style.backgroundImage = 'radial-gradient(rgb(' + rgb + ') 42%, transparent 70%)';
    }
}
affiche();
//setInterval(affiche, 200);

document.addEventListener('click', (evt) => {
  const y = Math.floor(evt.clientY / tailleCaseY - 0.3),
    x = Math.floor(evt.clientX / tailleCaseX - 0.3 - y % 2 / 2);

  cases[y][x].altitude = (cases[y][x].altitude - 10).borne(0, 255);
  affiche();
});

// Vie
function vie100() {
  for (let x = 0; x < nbCasesX; x++)
    for (let y = 0; y < nbCasesY; y++) {
      cases[y][x].altitude = (cases[y][x].altitude + 50).borne(0, 255);
    }
}

function vie() {
  const x = parseInt(nbCasesX * Math.random(), 10),
    y = parseInt(nbCasesY * Math.random(), 10),
    centralEl = terrainEl.children[y].children[x];
  //  y2 = (y + 1) % 2, // On décale une ligne sur 2 pour simuler un pattern hexagonal
  //proches = xyProches(x, y);
  cases[y][x].altitude = (cases[y][x].altitude + 50).borne(0, 255);

  /*for (let d = 0; d < proches.length; d++)
    if (0 <= proches[d][0] && proches[d][0] < nbCasesX &&
      0 <= proches[d][1] && proches[d][1] < nbCasesY) {
      const procheEl = terrainEl.children[proches[d][1]].children[proches[d][0]];

      procheEl.innerHTML = '💧';
    }*/
  affiche();
}
//vie(); // Une première fois, pour tests
//setInterval(vie, 20);


///////// TEST //////////
console.log(nbCasesX); //DCMM

/*
const figEl = document.createElement('div');
figEl.innerHTML = '🧔';
const figEl2 = document.createElement('div');
figEl2.innerHTML = 'Z💧V🌽';

terrainEl.children[3].children[3].appendChild(figEl);
terrainEl.children[2].children[3].appendChild(figEl2);
*/

// Fonctions générales
//vMoy = (v1, v2) => v1.map((v, k) => (v + v2[k]) / 2),
//rgb = (v) => 'rgb(' + v.map(c => encadre(0, Math.round(c), 255)).join(',') + ')',
/*
  [...terrainEl.children].forEach((lineEl, y) => {
    [...lineEl.children].forEach((caseEl, x) => {
      caseEl.style.backgroundImage = 'radial-gradient(rgb(' + rgbCase(caseEl) + ') 45%, transparent 70%)';
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

//for (const [i, value] of myArray.entries()) {
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

/*rgbCase.map((a,b)=>{
  });*/

//caseEl.style.backgroundColor = 'red';

/*const    bkImg ='conic-gradient(from 30deg,' + [
           rgb(vMoy(rgbCellCentrale, [64, 128, 192])),
          rgb(vMoy(rgbCellCentrale, [64, 128, 192])),
          rgb(vMoy(rgbCellCentrale, [64, 192, 128])),
          rgb(vMoy(rgbCellCentrale, [128, 64, 192])),
          rgb(vMoy(rgbCellCentrale, [64, 128, 192])),
          rgb(vMoy(rgbCellCentrale, [192, 64, 128])),
          rgb(vMoy(rgbCellCentrale, [64, 128, 192])),
         ].join(',') + ')' ;*/

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
*/