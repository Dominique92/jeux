// Définition du terrain
const dateLancement = Date.now(),
  tailleMonde = 600,
  tailleCaseX = 10, // Pixels// 16
  tailleCaseY = tailleCaseX * 0.866, // cos 30°
  nbCasesX = Math.round(tailleMonde / tailleCaseX),
  nbCasesY = Math.round(tailleMonde / tailleCaseY),
  rnd = Array(12).fill().map(() => Date.now() * Math.random() % 1), // tableau de valeurs aléatoires
  //inTerrain = (xy) => 0 <= xy[0] && xy[0] < nbCasesX && 0 <= xy[1] && xy[1] < nbCasesY,
  cases = [], // Valeurs associées à chaque case [x] [y]
  terrainEl = document.getElementById('terrain'); // DOM d'affichage de la couleur des cases

console.log(nbCasesX * nbCasesY + ' cellules'); //DCMM

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
      directions: [],
    };

    // Ajout de 3 bosses
    for (let i = 0; i < 3; i++)
      cases[y][x].altitude +=
      rndSin(4 * i, x, nbCasesX, 0, 9) *
      rndSin(4 * i + 2, y, nbCasesY, 0, 9);
  }
}
//console.log(cases); //DCMM

// Affiche les cases du terrain
function affiche() {
  const debut = Date.now();

  for (let y = 0; y < nbCasesY; y++) {
    const ligneEl = terrainEl.children[y],
      caseLigneAv = cases[y - 1],
      caseLigne = cases[y],
      caseLigneAp = cases[y + 1],
      dxAp = y % 2,
      dxAv = dxAp - 1; // Quinconce

    for (let x = 0; x < nbCasesX; x++) {
      const c = cases[y][x],
        couleur = ([255, 192, 128].time(c.altitude / 256))
        .plus([0, 64, 0].time(c.verdure / 256))
        .plus([0, 0, 128].time(c.eau / 256))
        .rgb();

      ligneEl.children[x].style.backgroundImage = 'radial-gradient(' + couleur + ' 42%, transparent 72%)';

      // Calcul des directions
      if (0 < x && x < (nbCasesX - 1) && 0 < y && y < (nbCasesY - 1)) {
        //TODO traiter les émanations hors terrain
        ['altitude']
        .forEach((f) => {
          caseLigne[x].directions[f] = [
            caseLigne[x + 1][f] - caseLigne[x - 1][f],
            (caseLigneAv[x + dxAv][f] + caseLigneAv[x + dxAp][f] -
              caseLigneAp[x + dxAv][f] - caseLigneAp[x + dxAp][f]) / 2,
          ];
        });

        /* VISU VECTEURS POUR TEST
        const mm = Math.round(caseLigne[x].directions.altitude.abs(), 10) / 2,
          rr = Math.atan(caseLigne[x].directions.altitude[0] / caseLigne[x].directions.altitude[1]) + 1.57;
        ligneEl.children[x].innerHTML =
          '<div style="transform:rotate(' + rr + 'rad);;font-size:' + mm + 'px" z-index=1000000>→</div>'; */
      }
    }
  }
  console.log('affiche ' + (Date.now() - debut) + ' ms'); //DCMM
}
affiche();
//setInterval(affiche, 200);

// Vie
//function vie() {}
//vie(); // Une première fois, pour tests
//setInterval(vie, 20);

document.addEventListener('click', (evt) => {
  const y = Math.floor(evt.clientY / tailleCaseY - 0.3),
    x = Math.floor(evt.clientX / tailleCaseX - 0.3 - y % 2 / 2);

  cases[y][x].altitude = (cases[y][x].altitude - 10).borne(0, 255);
  affiche();
});

console.log('Fin index.js ' + (Date.now() - dateLancement) + ' ms'); //DCMM

///////// TEST //////////
/*
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