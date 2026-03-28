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
  /* eslint-disable-next-line no-multi-assign */
  cases[y] = cases[-1] = cases[nbCasesY] = [];

  for (let x = 0; x < nbCasesX; x++) {
    // Un DIV pour chaque case position: absolute
    terrainEl.lastChild.insertAdjacentHTML('beforeend', '<div>');
    Object.assign(terrainEl.lastChild.lastChild.style, {
      width: tailleCaseX * 1.6 + 'px', // Facteur de recouvrement
      //height: tailleCaseY   * 1.6   + 'px', // Facteur de recouvrement
      top: (tailleCaseY * y) + 'px', // Triangle équilatéral
      left: (tailleCaseX * (x + y % 2 / 2)) + 'px', // En quiconce
    });

    // Valeurs initiales des cases du terrain
    cases[y][x] = {
      eau: 10,
      verdure: 50,
      altitude: 0,
      directions: [],
      //couleur: [],
    };

    // Ajout de 3 bosses
    for (let i = 0; i < 3; i++)
      cases[y][x].altitude +=
      rndSin(4 * i, x, nbCasesX, 0, 9) *
      rndSin(4 * i + 2, y, nbCasesY, 0, 9);
  }
}

// Calcul de la couleur d'une case
/*
function rgbCase(c) {//TODO DELETE
  return [255, 192, 128].time(c.altitude / 256)
    .plus([0, 64, 0].time(c.verdure / 256))
    .plus([0, 0, 128].time(c.eau / 256))
    .borne(0, 255)
    .round()
    .join(',');
}

function calculCouleur() {
  for (let y = 0; y < nbCasesY; y++)     
    for (let x = 0; x < nbCasesX; x++) 
    cases[y][x].couleur=rgbCase(cases[y][x]) ;
 }
*/

// Calcule la couleur des éléments du terrain
function calculCouleur() {
  for (let y = 0; y < nbCasesY; y++) {
    for (let x = 0; x < nbCasesX; x++) {
      const c = cases[y][x],
        wwwwcv = [255 * Math.random(), 255 * Math.random(), 255 * Math.random()], //DCMM
        cv = ([255, 192, 128].time(c.altitude / 256))
        .plus([0, 64, 0].time(c.verdure / 256))
        .plus([0, 0, 128].time(c.eau / 256)),
        cc = cv.rgb();

      c.couleur = {
        v: cv, // Forme vectorielle pour calculs
        m: cc,
        g: cc,
        hg: cc,
        hd: cc, // Formes string pour affichage
      };

      if (x) {
        c.couleur.g = c.couleur.v.plus(cases[y][x - 1].couleur.v).div(2).rgb();
        if (y) {
          c.couleur.hg = c.couleur.v.plus(cases[y - 1][x - y % 2].couleur.v).div(2).rgb();
          c.couleur.hd = c.couleur.v.plus(cases[y - 1][x - 1 + y % 2].couleur.v).div(2).rgb();
        }
      }
      //( cases[y][x-1]  .couleur.m  +  cases[y][x].couleur.m)/2  ;        
      //cases[y][x].couleur.g=( cases[y][x-1]  .couleur.m  +  cases[y][x].couleur.m)/2  ;        
      //c.couleur.hg=( cases[y-1][x-y % 2]  .couleur.m+c.couleur.m)/2  ;     
      //c.couleur.hd=( cases[y-1][x-1+y % 2]  .couleur.m+c.couleur.m)/2  ;     
    }
    cases[y][-1] = cases[y][0];
    cases[y][nbCasesX] = cases[y][nbCasesX - 1];
  }
  for (let x = 0; x < nbCasesX; x++) {
    cases[-1][x] = cases[0][x];
    cases[nbCasesY][x] = cases[nbCasesY - 1][x];
  }
}
//console.log(cases); //DCMM

// Colore les éléments du terrain
function affiche() {
  const debut = Date.now();

  calculCouleur();

  for (let y = 0; y < nbCasesY; y++) {
    const ligneEl = terrainEl.children[y],
      caseLigneAv = cases[y - 1],
      caseLigne = cases[y],
      caseLigneAp = cases[y + 1],
      dxAp = y % 2,
      dxAv = dxAp - 1; // Quinconce

    for (let x = 0; x < nbCasesX; x++) {
      //const c0=' red ';//+caseLigne[x].couleur.hd,
      const c0 = caseLigne[x + 1].couleur.g; //' grey ';caseLigneAv[x+dxAp].couleur.hd;

      const ccc = 'radial-gradient(' + caseLigne[x].couleur.m + ' 42%, transparent 72%)';
      /*',conic-gradient(' + c0 + '30deg,' +
          //OKcaseLigne[x + 1].couleur.g + '90deg,' +
          //OKcaseLigne[x].couleur.g + '270deg,'+ 
          c0 + '90deg,' +
          caseLigne[x + 1].couleur.g + '150deg,' +
          caseLigne[x].couleur.g + '210deg,' +
          caseLigne[x].couleur.g + '270deg,' +
          c0+ '330deg,' +
          c0 + ')';*/
      //console.log(ccc); //DCMM
      ligneEl.children[x].style.backgroundImage = ccc;

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

        /* TEST
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
*/

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