/* global performance */

const nbCases = 10,
  tailleCaseX = 24,
  tailleCaseY = tailleCaseX * 0.866, // cos 30°
  intervalRefreshAllCases = 100, // ms
  cases = [],
  els = {},
  proches = [
    [0, -1],
    [1, 0],
    [-1, 1],
    [1, -1],
    [0, 1],
    [-1, 0],
  ];

// CSS depending on constants
document.styleSheets[0].insertRule(
  '#terrain div {' +
  '  width:' + (tailleCaseX - 2) + 'px;' +
  '  height:' + (tailleCaseY - 2) + 'px;' +
  '}');

// Get ref to divs having an id
Array.from(document.getElementsByTagName('div'))
  .forEach((el) => {
    if (el.id)
      els[el.id] = el;
  });

// Fonctions usuelles
function normNoCase(x) {
  return Math.floor(x + nbCases) % nbCases;
}

function pointAtXY(xy) {
  return [
    (xy[0] + xy[1] / 2) % nbCases * tailleCaseX,
    xy[1] % nbCases * tailleCaseY,
  ];
}

function xyAtPoint(pxy) {
  const y = normNoCase(pxy[1] / tailleCaseY),
    x = normNoCase(pxy[0] / tailleCaseX - y / 2);
  return [x, y];
}

// Initialisation du terrain
els.terrain.style.width = (nbCases * tailleCaseX) + 'px';
els.terrain.style.height = (nbCases * tailleCaseY) + 'px';

for (let cx = 0; cx < nbCases; cx++) {
  cases[cx] = [];
  for (let cy = 0; cy < nbCases; cy++) {
    const pos = pointAtXY([cx, cy]),
      caseEl = document.createElement('div');

    caseEl.style.left = pos[0] + 'px';
    caseEl.style.top = pos[1] + 'px';

    els.terrain.appendChild(caseEl);
    cases[cx][cy] = {
      fond: caseEl,
      alt: Math.random() * 256,
      eau: 128,
      lapin: 0,
    };
  }
}

// Evolutions
function vieCase(el) {
  el.fond.style.backgroundColor = 'rgb(' + 0 + ',0,' + el.lapin + ')';
}

function vieVoisinage(el1, el2) {
  const tot = el1.lapin + el2.lapin;
  el2.lapin = el2.lapin * .998 + tot / 1000;
  el1.lapin = el1.lapin * .998 + tot / 1000;

  el1.eau += el1.alt / 100;
  el2.eau -= el1.alt / 100;
}

// Création ludion
function createLudion(pxy, type) {
  const luEl = document.createElement('span');
  luEl.innerHTML = type;
  luEl.style.left = pxy[0] + 'px';
  luEl.style.top = pxy[1] + 'px';
  luEl.naissance = Date.now();
  els.ludions.appendChild(luEl);
}

function vieLudion(el) {
  if ((Date.now() - el.naissance) > 2000)
    el.innerHTML = '💦';
}

cases[3][3].lapin = 255; //DCMM phéromone

// Vie du terrain
let maxExecTime = 0,
  nbIterations = 0;

setInterval(() => {
  const startTime = performance.now(),
    ludionEls = Array.from(els.ludions.children);

  // On fait au hazard autant de casse et de voisinages qu'il y en a
  for (let i = 0; i < nbCases * nbCases * 3; i++) {
    const cx = normNoCase(Math.random() * nbCases),
      cy = normNoCase(Math.random() * nbCases),
      proche = normNoCase(Math.random() * 3),
      cxp = normNoCase(cx + proches[proche][0]),
      cyp = normNoCase(cy + proches[proche][1]),
      c = cases[cx][cy],
      cp = cases[cxp][cyp];

    if (!proche) vieCase(c); // Il y a moins de cases que de voisinages
    vieVoisinage(c, cp);
  }

  // On fait au hazard autant de ludions qu'il y en a
  for (let l = 0; l < ludionEls.length; l++)
    vieLudion(ludionEls[
      Math.floor(Math.random() * els.ludions.children.length)
    ]);

  // Mesures perfs
  maxExecTime = Math.max(maxExecTime, performance.now() - startTime);
  els.perfs.innerHTML = Math.ceil(maxExecTime) + ' ms, iter = ' + nbIterations++;
}, intervalRefreshAllCases);

// Actions
document.addEventListener('mousemove', (evt) => {
  // Case survolée
  const xy = xyAtPoint([evt.x, evt.y]),
    pxy = pointAtXY(xy);

  els.popup.style.left = (evt.x + 3) + 'px';
  els.popup.style.top = (evt.y + 3) + 'px';
  els.popup.innerHTML =
    JSON.stringify({
      x: xy.join(', y:'),
      ...cases[xy[1]][xy[0]],
    })
    .replace(/,"([a-z])/gu, '<br/>$1')
    //.replace(/\.[0-9]*$/gu, '')
    .replace(/\{|"|\}/gu, '');

  els.ludions.style.left = (pxy[0]) + 'px';
  els.ludions.style.top = (pxy[1]) + 'px';
});

// TEST
for (let i = 0; i < 100; i++)
  createLudion([
    Math.random() * nbCases * tailleCaseX,
    Math.random() * nbCases * tailleCaseY,
  ], '💧');