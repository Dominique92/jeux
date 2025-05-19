const inputEls = document.getElementsByTagName('input'),
  pEls = document.getElementsByTagName('p'),
  divEl = document.getElementsByTagName('div')[0],
  spanEls = document.getElementsByTagName('span'),
  sPars = location.search.match(/s=([0-9]+)/u) || [null, 4],
  size = parseInt(sPars[1], 10),
  size1 = size + 1,
  dPars = location.search.match(/d=([0-9]+)/u) || [null, 50];

let currentColor = 0,
  ended = false;

// Install as Progressive Web Application
/*
if ("serviceWorker" in navigator)
  navigator.serviceWorker.register("service-worker.js")
  .catch(error => console.log(error));
*/

//TODO passer paramètres en # (comp.PWA)
//TODO film gagné
//TODO lint css & html
//TODO max taille suivant fenêtre

// Initialise input fields with parameters
inputEls[0].value = sPars[1];
inputEls[1].value = dPars[1];

// Display sliders result
function nbMirrors() {
  return Math.min(size * size, Math.ceil(inputEls[1].value / 50 * size));
}

function displayInputs() {
  pEls[0].innerHTML = 'Taille : ' + inputEls[0].value + ' * ' + inputEls[0].value;
  pEls[1].innerHTML = nbMirrors() + ' miroir' + (nbMirrors() > 1 ? 's' : '');
}

// DISPLAY GAME
function displayBoxes() {
  displayInputs();

  // Clear all boxes if all mirrors are found
  if (!ended) {
    let nbmk = 0;

    ended = true;
    Array.from(spanEls).forEach(el => {
      if (el.x % size1 && el.y % size1) {
        if (el.mark !== el.mirror && el.mark !== 3)
          ended = false;
        if (el.mark === 1 || el.mark === 2)
          nbmk++;
      }
    });

    if (nbmk)
      pEls[1].innerHTML += ' / ' + nbmk + ' marqué' + (nbmk > 1 ? 's' : '');
  }

  // Display boxes
  Array.from(spanEls).forEach(el => {
    if (el.mark === 3) {
      // Open boxes
      el.style.backgroundPositionX = -(el.mirror ? 5 + el.mirror : el.laserV) * 32 + 'px';
      el.style.backgroundPositionY = -(el.mirror ? 3 : el.laserH) * 32 + 'px';
    } else if (ended && !el.mirror) {
      // Central boxes / open
      el.style.backgroundPositionX = -el.laserV * 32 + 'px';
      el.style.backgroundPositionY = -el.laserH * 32 + 'px';
    } else if (ended) {
      // Central boxes / ended
      el.style.backgroundPositionX = -(5 + el.mirror) * 32 + 'px';
      el.style.backgroundPositionY = -el.mark * 32 + 'px';
    } else {
      // Central boxes / game
      el.style.backgroundPositionX = '-128px';
      el.style.backgroundPositionY = -el.mark * 32 + 'px';
    }
  });
}

// ACTIONS
function setColorAndPropagate(x, y, dx, dy) {
  if (0 <= x && x <= size1 && 0 <= y && y <= size1) {
    const el = divEl.children[y].children[x];

    if (el.mirror === 1)
      setColorAndPropagate(x - dy, y - dx, -dy, -dx);
    else if (el.mirror === 2)
      setColorAndPropagate(x + dy, y + dx, dy, dx);
    else {
      // Set the laser in the box
      if (dx) el.laserH = currentColor;
      if (dy) el.laserV = currentColor;
      setColorAndPropagate(x + dx, y + dy, dx, dy);
    }
  }
}

function clickLight(evt) {
  currentColor = currentColor % 3 + 1;

  // Erase all laser same currentColor
  Array.from(spanEls).forEach(el => {
    if (el.laserH === currentColor)
      el.laserH = 0;
    if (el.laserV === currentColor)
      el.laserV = 0;
  });

  // Add laser & propagate
  if (evt.target.x === 0)
    setColorAndPropagate(0, evt.target.y, 1, 0);
  if (evt.target.x === size1)
    setColorAndPropagate(size1, evt.target.y, -1, 0);
  if (evt.target.y === 0)
    setColorAndPropagate(evt.target.x, 0, 0, 1);
  if (evt.target.y === size1)
    setColorAndPropagate(evt.target.x, size1, 0, -1);

  displayBoxes();
}

function clickBox(evt) {
  if (evt.ctrlKey || evt.shiftKey || evt.type === 'dblclick') {
    // Open clicked box
    evt.target.mark = 3;

    // Crash if there is a mirror
    if (evt.target.mirror)
      ended = true;
  }
  // Switch marks
  else if (evt.target.mark < 3)
    evt.target.mark = ++evt.target.mark % 3;

  displayBoxes();
}

// INIT
// Build the table
for (let v = 0; v < size + 2; v++) {
  const pEl = document.createElement('p');

  divEl.appendChild(pEl);

  for (let h = 0; h < size + 2; h++) {
    const spanEl = document.createElement('span');
    pEl.appendChild(spanEl);
    spanEl.innerHTML = '&nbsp;';
    spanEl.x = h;
    spanEl.y = v;
    spanEl.mirror = 0; // 0:none 1:\ 2:/ 3:open
    spanEl.mark = 0;
    spanEl.laserH = 0; // 0=none 1=red 2=blue 3=yellow
    spanEl.laserV = 0;

    // Side boxes
    if (v % size1 === 0 ^ h % size1 === 0) {
      spanEl.innerHTML = '&#10036;';
      spanEl.onclick = clickLight;
      spanEl.mark = 3;
    }
    // Central boxes
    if (v % size1 && h % size1) {
      spanEl.onclick = clickBox;
      spanEl.ondblclick = clickBox;
    }
  }
}

// Populates the mirrors
for (let nbm = 0; nbm < nbMirrors();) {
  // Add 1 mirror
  divEl
    .children[Math.floor(Math.random() * size) + 1]
    .children[Math.floor(Math.random() * size) + 1]
    .mirror =
    Math.floor(Math.random() * 2) + 1;

  // Count the mirrors
  nbm = 0;
  Array.from(spanEls).forEach(el => {
    if (el.mirror)
      nbm++;
  });
}

displayBoxes();