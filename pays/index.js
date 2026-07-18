const nbCases = 20,
  tailleCaseX = 24,
  tailleCaseY = tailleCaseX * 0.866, // cos 30°
  cases = [],
  terrainEl = document.getElementById('terrain'),
  popupEl = document.getElementById('popup'),
  ludionEl = document.getElementById('ludion');

terrainEl.style.width = (nbCases * tailleCaseX) + 'px';
terrainEl.style.height = (nbCases * tailleCaseY) + 'px';

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
    console.log(xyRnd()); //DCMM
  }

});

// TEST

for (let cx = 0; cx < nbCases; cx++) {
  cases[cx] = [];
  for (let cy = 0; cy < nbCases; cy++) {
    const pos = pointAtXY([cx, cy]),
      el = document.createElement('div');
    terrainEl.appendChild(el);
    cases[cx][cy] = {
      fond: el,
    };

    el.classList.add('case-terrain');
    el.style.left = pos[0] + 'px';
    el.style.top = pos[1] + 'px';
    el.style.backgroundColor = 'rgb(133, 83, 57)';

  }
}

//<div id="25,9" style="width: 17px; top: 74.909px; left: 248px; background-image: radial-gradient(rgb(133, 83, 57) 42%, transparent 80%);"></div>

cases[3][3] = {
  a: 1,
  b: 2,
  c: 3
};