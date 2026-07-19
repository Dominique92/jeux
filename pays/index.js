/* global performance */

const nbCases = 20,
  tailleCaseX = 24,
  tailleCaseY = tailleCaseX * 0.866, // cos 30°
  intervalRefreshAllCases = 100, // ms
  cases = [],
  terrainEl = document.getElementById('terrain'),
  popupEl = document.getElementById('popup'),
  ludionEl = document.getElementById('ludion'),
  perfsEl = document.getElementById('perfs');

// CSS depending on constants
document.styleSheets[0].insertRule(
  '.case-terrain {' +
  '  width:' + (tailleCaseX - 2) + 'px;' +
  '  height:' + (tailleCaseY - 2) + 'px;' +
  '}', 0);

// Fonctions usuelles
function pointAtXY(xy) {
  return [
    (xy[0] + xy[1] / 2) % nbCases * tailleCaseX,
    xy[1] % nbCases * tailleCaseY,
  ];
}

function xyAtPoint(pxy) {
  const y = Math.floor(pxy[1] / tailleCaseY) % nbCases,
    x = Math.floor(pxy[0] / tailleCaseX - y / 2) % nbCases;
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
    };
  }
}

// Vie du terrain
let maxExecTime = 0;
setInterval(() => {
  const startTime = performance.now()

  // On fait au hazard 50% des cases
  for (let i = 0; i < nbCases * nbCases; i++) {
    const cx = Math.floor(Math.random() * nbCases),
      cy = Math.floor(Math.random() * nbCases),
      c = cases[cx][cy];

    c.fond.style.backgroundColor = 'rgb(133, ' + c.alt + ', 57)';
  }

  // Mesures perfs
  maxExecTime = Math.max(maxExecTime, performance.now() - startTime);
  perfsEl.innerHTML = Math.ceil(maxExecTime) + ' ms';
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