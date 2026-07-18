const nbCases = 20,
  tailleCaseX = 24,
  tailleCaseY = tailleCaseX * 0.866, // cos 30°
  cases = [],
  terrainEl = document.getElementById('terrain'),
  popupEl = document.getElementById('popup');

for (let c = 0; c < nbCases; c++)
  cases[c] = new Array(nbCases);

terrainEl.style.width = (nbCases * tailleCaseX) + 'px';
terrainEl.style.height = (nbCases * tailleCaseY) + 'px';

function xyAtPoint(px, py) {
  const y = Math.floor(py / tailleCaseY) % nbCases,
    x = Math.floor(px / tailleCaseX + y / 2) % nbCases;
  return [x, y];
}

document.addEventListener('mousemove', (evt) => {
  // Case survolée
  const xy = xyAtPoint(evt.x, evt.y);

  popupEl.style.left = (evt.x + 3) + 'px';
  popupEl.style.top = (evt.y + 3) + 'px';
  popupEl.innerHTML =
    JSON.stringify({
      x: xy.join(', y:'),
      ...cases[xy[1]][xy[0]],
    })
    .replace(/,"([a-z])/gu, '<br/>$1')
    .replace(/^\{|"|\.[0-9]*|\}$/gu, '');
});

// TEST
cases[3][3] = {
  a: 1,
  b: 2,
  c: 3
};