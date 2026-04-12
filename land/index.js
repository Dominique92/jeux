// Définition du terrain
const dateDebut = Date.now(),
  timeMesure = false,
  argTaille = location.search.substring(1) || 10,
  nbCases = Math.round(window.innerWidth / argTaille / 2) * 2,
  debord = typeof argTaille === 'string' ? 0 : 0.35, // Débordement de la div contenant la couleur (nb cases de chaque côté)
  tailleCaseX = window.innerWidth / (nbCases - debord * 2 + 0.5),
  tailleCaseY = tailleCaseX * 0.866, // cos 30°
  shiftX = -debord * 2 * tailleCaseX, // Pixels
  shiftY = -debord * tailleCaseY, // Pixels

  // Contenu du terrain
  casesBord = {}, // Toutes les cases en dehors du tableau pointeront ici
  cases = [], // Valeurs associées à chaque case [x] [y]
  popupEl = document.getElementById('popup'),
  terrainEl = document.getElementById('terrain'), // DOM d'affichage de la couleur des cases
  draggingEl = document.getElementById('dragging'), // Lutins en cours de déplacement

  // Fonction aléatoire pour calculer les bosses du terrain
  //TODO générer en fonction d'une clé qui serait le nom du pays
  rnd = Array(12).fill().map(() => Date.now() * Math.random() % 1), // 0...1
  wave = (x /* 0...1 */ , graine /* 1,2,... */ ) =>
  Math.sin((x + rnd[graine * 2]) * 6.28) * rnd[graine * 2 + 1] / 2 + 0.5;

console.info(nbCases + '² = ' + nbCases * nbCases + ' cases de ' + tailleCaseX + 'px');

function xyAtPoint(px, py) {
  const y = Math.floor((py - shiftY) / tailleCaseY),
    x = Math.floor((px - shiftX) / tailleCaseX - y % 2 / 2);

  if (0 <= x && x < nbCases && 0 <= y && y < nbCases)
    return [x, y];
}

function caseAtXY(xy) {
  if (xy)
    return cases[xy[1]][xy[0]];
}

function terrainAtXY(xy) {
  if (xy)
    return terrainEl.children[xy[1]].children[xy[0]];
}

function proches(x, y) {
  return [
    cases[y][x],
    cases[y][x - 1],
    cases[y - 1][x + y % 2 - 1],
    cases[y - 1][x + y % 2],
    cases[y][x + 1],
    cases[y + 1][x + y % 2],
    cases[y + 1][x + y % 2 - 1],
  ];
}

// Initialise le DOM du terrain, regroupé par lignes
cases[-1] = Array(nbCases + 1).fill(casesBord);
cases[nbCases] = Array(nbCases + 1).fill(casesBord);
cases[-1][-1] = casesBord;

for (let y = 0; y < nbCases; y++) {
  terrainEl.insertAdjacentHTML('beforeend', '<div/>');
  cases[y] = [];
  cases[y][-1] = casesBord;
  cases[y][nbCases] = casesBord;

  for (let x = 0; x < nbCases; x++) {
    // Un DIV pour chaque case position: absolute
    terrainEl.lastChild.insertAdjacentHTML('beforeend', '<div>');
    Object.assign(terrainEl.lastChild.lastChild.style, {
      width: tailleCaseX * (1 + 2 * debord) + 'px', // Facteur de recouvrement
      top: (y * tailleCaseY + shiftY) + 'px', // Triangle équilatéral
      left: ((x + y % 2 / 2) * tailleCaseX + shiftX) + 'px', // En quiconce
    });
    terrainEl.lastChild.lastChild.id = x + ',' + y;

    // Valeurs initiales des cases du terrain / Entre 0 et 100
    cases[y][x] = {
      eau: 0,
      altitude: -30,
      directions: {},
    };

    // Ajout de 3 bosses
    for (let i = 0; i < 3; i++)
      cases[y][x].altitude += 100 * wave(1.2 * x / nbCases, 2 * i) * wave(y / nbCases, 2 * i + 1);
  }
}

// Affiche les cases du terrain
function affiche() {
  const debut = Date.now();

  for (let y = 0; y < nbCases; y++) {
    const ligneEl = terrainEl.children[y],
      caseLigneAv = cases[y - 1],
      caseLigne = cases[y],
      caseLigneAp = cases[y + 1],
      dxAp = y % 2,
      dxAv = dxAp - 1; // Quinconce

    for (let x = 0; x < nbCases; x++) {
      const c = cases[y][x];

      // Affiche la couleur de la case
      c.hsl = [
        20 + 0.4 * c.eau.borne(0, 100), // Marron (20°) à vert (60°)
        40, // Saturation
        30 + 0.3 * c.altitude.borne(0, 99), // Moyen à blanc
      ].join(' ');

      ligneEl.children[x].style.backgroundImage =
        'radial-gradient(hsl(' + c.hsl + ') 42%, transparent 80%)';

      // Calcul des directions
      ['altitude']
      .forEach((f) => {
        caseLigne[x].directions[f] = [
          caseLigne[x + 1][f] - caseLigne[x - 1][f],
          (caseLigneAv[x + dxAv][f] + caseLigneAv[x + dxAp][f] -
            caseLigneAp[x + dxAv][f] - caseLigneAp[x + dxAp][f]) / 2,
        ];
      });

      /* VISU VECTEURS POUR TEST
      const valeur = Math.round(caseLigne[x].directions.altitude.abs(), 10) / 2,
        rotation = Math.atan(caseLigne[x].directions.altitude[0] / caseLigne[x].directions.altitude[1]) +
        (caseLigne[x].directions.altitude[1] > 0 ? 4.71 : 1.57);

      ligneEl.children[x].innerHTML =
        '<div style="transform:rotate(' + rotation + 'rad);font-size:' +
        valeur + 'px" z-index=1000000>→</div>'; */
    }
  }
  if (timeMesure)
    console.info('affiche ' + (Date.now() - debut) + ' ms');
}
affiche(); // Une fois à l'init
//setInterval(affiche, 200);

// Vie
function vie() {
  const debut = Date.now();

  // Evolution des sprites
  Array.from(document.querySelectorAll('[draggable=true]'))
    .forEach((el) => {
      const rect = el.getBoundingClientRect(),
        c = caseAtXY(xyAtPoint(rect.x, rect.y));

      if (c) {
        el.style.top = rect.y - 5 * c.directions.altitude[1] + 'px';
        el.style.left = rect.x + 5 * c.directions.altitude[0] + 'px';
      }
    });

  // Evolution du terrain
  /*for (let y2 = 0; y2 < nbCases / 2; y2++) // Travail alterné pour éviter les artefacts
    for (let y = 2 * y2; y < 2 * y2 + 2; y++)
      for (let x2 = 0; x2 < nbCases / 2; x2++)
        for (let x = 2 * x2; x < 2 * x2 + 2; x++) */
  for (let y = 0; y < nbCases; y++)
    for (let x = 0; x < nbCases; x++) {
      const cp = proches(x, y),
        a = cp[0].altitude,
        e = cp[0].eau / cp.length;

      // Redistribution de l'eau aux cellules adjacentes
      if (e > 0) // S'il y a de l'eau dans la case
        for (let i = 1; i < cp.length; i++)
          if (a > cp[i].altitude) { // Si la cellule est plus haute
            const de = (a - cp[i].altitude) / 20 * e.borne(0, 10);

            cp[0].eau -= de;
            cp[i].eau += de;
          }

      // Pluie
      //TODO pluie aléatoire
      cp[0].eau += 1;
    }
  if (timeMesure)
    console.info('vie ' + (Date.now() - debut) + ' ms');

  affiche();
}
//vie();
//setInterval(vie, 200);

/***********
 * SPRITES *
 ***********/
function sprite(symbol) {
  const el = document.createElement('div');

  el.draggable = true;
  el.innerHTML = symbol;

  // Mouse actions
  el.ondragstart = (evt) => {
    //console.log('dragstart', evt); //DCMM
    evt.dataTransfer.origine = evt.target; //TODO evt.dataTransfer.setData()
    draggingEl.appendChild(evt.target);
  };
  el.ondragend = (evt) => {
    console.log('dragend', evt.dataTransfer.origine.getBoundingClientRect()); //DCMM
    document.body.appendChild(evt.target);
  };
  /*el.onmouseover = (evt) => {
    // Hold transition moves when hover
    //console.log('mouseover', evt); //DCMM
  };*/

  terrainEl.ondragover = (evt) => {
    //console.log('dragover', evt); //DCMM
    evt.preventDefault(); // Change drag cursor
  };

  return el;
}

function moveSprite(el, px, py) {
  const ct = terrainAtXY(xyAtPoint(px, py)) || draggingEl,
    rect = ct.getBoundingClientRect();

  ct.appendChild(el);
  el.style.top = (px - rect.x) + 'px';
  el.style.left = (py - rect.y) + 'px';
  affiche();

  return el;
}
moveSprite(sprite('A🧍‍♂'), 150, 150);


// Actions sur le terrain
document.addEventListener('click', (evt) => {
  const debut = Date.now(),
    xy = xyAtPoint(evt.x, evt.y),
    nbIter = 1;

  if (xy) {
    /*const cp = proches(...xy);
    affiche();*/
  } else
    for (let i = 0; i < nbIter; i++)
      vie();

  affiche();

  if (debut)
    console.info(nbIter + ' vies ' + (Date.now() - debut) + ' ms');
});

document.addEventListener('mousemove', (evt) => {
  const xy = xyAtPoint(evt.x, evt.y);

  popupEl.style.left = (evt.x + 10) + 'px';
  popupEl.style.top = (evt.y - 8) + 'px';
  popupEl.innerHTML = xy ?
    JSON.stringify({
      x: xy.join(', y:'),
      ...cases[xy[1]][xy[0]],
    })
    .replace(/,"([a-z])/gu, '<br/>$1')
    .replace(/^\{|"|\.[0-9]*|\}$/gu, '') :
    '';
});

console.log('index.js ' + (Date.now() - dateDebut) + ' ms');

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
 *   la première ayant abouti interrompt la liste
 */

/* 🚶‍♀️🚶‍♂️🚶‍➡️🚶‍♀️‍➡️🚶‍♂️‍➡️🚶🏻🚶🏿 https://fr.piliapp.com/emojis/person-walking/ 
🧍🚶🚶‍➡️🏃🧍‍♀️🚶‍♀️🚶‍♀️‍➡️👫🚶‍♂️🧍‍♂️🚶‍♂️‍➡️
https://en.wikipedia.org/wiki/Zero-width_joiner

https://emojipedia.org/search?q=woman%20walking
*/