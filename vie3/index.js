const statsEl = document.getElementById('stats'),
  deltasProches = [
    [-1, 0, 0, -1],
    [1, 0, 0, 1],
    [0, 1, -1, -1],
    [0, -1, 1, 1],
    [1, 1, -1, 0],
    [-1, -1, 1, 0],
  ],
  boxSize = 16,
  boxes = [];

let iteration = 0,
  zones = [];

// 🧔 👩 👫 👪 🧍 💀 ⛲ 💧 🌱 🌿 🌽 ▒ 🧱 🏠 - 🦴 🚧 🌳 🌾 🐇 🐀 🥔 🧒 👶 👷

// HELPERS
function box(x, y, v) {
  if (typeof boxes[x] === 'undefined')
    boxes[x] = [];

  if (typeof v !== 'undefined')
    boxes[x][y] = v;

  return boxes[x][y];
}

// Traduit un caractère unicode en ascii décimal
function decHTML(el, ascii) {
  let out = '';

  for (const chr of el.innerHTML) {
    const code = chr.codePointAt(0);

    out += code >= 0x80 ? '&#' + code + ';' : chr;
  }
  return ascii ? out === ascii : out;
}

// Move el to the x/y position if it's free
function helperPoint(el, x, y, data) {
  if (typeof box(x, y) === 'undefined' &&
    typeof el === 'object') {
    // Register in the grid
    box(x, y, el);

    // Reposition the point
    el.style.left = (x - y / 2 + (data && data.model ? 0 : Math.random() / 4 - 0.125)) * boxSize + 'px';
    el.style.top = (y * 0.866 + (data && data.model ? 0 : Math.random() / 4 - 0.125)) * boxSize + 'px';
    el.data = {
      ...el.data,
      iteration: iteration,
      x: x,
      y: y,
      ...data,
    };

    return boxes[x][y];
  }
}

function addPoint(x, y, symbol, data) {
  const el = document.createElement('div');

  if (helperPoint(el, x, y, data)) {
    document.body.appendChild(el);
    el.innerHTML = symbol;
    el.draggable = true;
    /* eslint-disable-next-line no-use-before-define */
    //el.ondragstart = dragstart;
    return true;
  }
}

function vie(el, a, b, c) {
  /*DCMM*/
  console.log(el, a, b, c);
}

// Scénarios
const o = {
  '🧔': [vie, '🌿', 3, {
    a: 0,
    b: '🐇',
    c: 2,
  }],
};

const args = o['🧔'].slice(1);
o['🧔'][0](statsEl, ...args);



// Add models
addPoint(0, 0, '🧔', {
  model: true,
});
addPoint(0, 1, '👩', {
  model: true,
});
addPoint(0, 2, '⛲', {
  model: true,
});
addPoint(0, 3, '🌽', {
  model: true,
});