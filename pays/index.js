/* global performance */

const nbCases = 20,
  tailleCaseX = 24,
  tailleCaseY = tailleCaseX * 0.866, // cos 30°
  intervalRefreshAllCases = 100, // ms
  cases = [],
  terrainEl = document.getElementById('terrain'),
  popupEl = document.getElementById('popup'),
  ludionEl = document.getElementById('ludion'),
  perfsEl = document.getElementById('perfs'),
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
  '.case-terrain {' +
  '  width:' + (tailleCaseX - 2) + 'px;' +
  '  height:' + (tailleCaseY - 2) + 'px;' +
  '}');

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

function xyRnd() {
  return [
    Math.floor(Math.random() * nbCases),
    Math.floor(Math.random() * nbCases),
  ];
}

// Initialisation du terrain
terrainEl.style.width = (nbCases * tailleCaseX) + 'px';
terrainEl.style.height = (nbCases * tailleCaseY) + 'px';

for (let cx = 0; cx < nbCases; cx++) {
  cases[cx] = [];
  for (let cy = 0; cy < nbCases; cy++) {
    const pos = pointAtXY([cx, cy]),
      el = document.createElement('div');
    el.classList.add('case-terrain');
    el.style.left = pos[0] + 'px';
    el.style.top = pos[1] + 'px';

    terrainEl.appendChild(el);
    cases[cx][cy] = {
      fond: el,
      alt: Math.random() * 256,
      eau: 128,
    };
  }
}


// Vie du terrain
let maxExecTime = 0,
  nbIterations = 0;
setInterval(() => {
  const startTime = performance.now();

  // On fait au hazard 50% des cases et des proches
  for (let i = 0; i < nbCases * nbCases * 3; i++) {
    const cx = normNoCase(Math.random() * nbCases), //Math.floor(Math.random() * nbCases),
      cy = normNoCase(Math.random() * nbCases), //Math.floor(Math.random() * nbCases),
      proche = normNoCase(Math.random() * 3), //Math.floor(Math.random() * 3),
      cxp = normNoCase(cx + proches[proche][0] + nbCases), //(cx+proches[proche][0]+nbCases)%nbCases,
      cyp = normNoCase(cx + proches[proche][1] + nbCases), //(cx+proches[proche][1]+nbCases)%nbCases,
      c = cases[cx][cy],
      cp = cases[cxp][cyp];

    c.fond.style.backgroundColor = 'rgb(128,128, ' + c.eau + ')';
  }

  // Mesures perfs
  maxExecTime = Math.max(maxExecTime, performance.now() - startTime);
  perfsEl.innerHTML = Math.ceil(maxExecTime) + ' ms, iter = ' + nbIterations++;
}, intervalRefreshAllCases);

// Actions
document.addEventListener('mousemove', (evt) => {
  // Case survolée
  const xy = xyAtPoint([evt.x, evt.y]),
    pxy = pointAtXY(xy);

  popupEl.style.left = (evt.x + 3) + 'px';
  popupEl.style.top = (evt.y + 3) + 'px';
  popupEl.innerHTML =
    JSON.stringify({
      x: xy.join(', y:'),
      ...cases[xy[1]][xy[0]],
    })
    .replace(/,"([a-z])/gu, '<br/>$1')
    .replace(/^\{|"|\.[0-9]*|\}$/gu, '');

  ludionEl.style.left = (pxy[0]) + 'px';
  ludionEl.style.top = (pxy[1]) + 'px';
});

document.addEventListener('keydown', () => {
  console.log('cycle'); //DCMM

  for (let c = 0; c < 1000; c++) {
    //console.log(xyRnd()); //DCMM
  }

});