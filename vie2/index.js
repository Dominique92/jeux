//TODO favicon

const catalog = {
    man: '&#129492;',
    woman: '&#128105;',
    corn: '&#127805;',
    fountain: '&#9970;',
  },
  o = {
    ...catalog,
    catalog: 'CATALOG',
    couple: '&#128107;',
    family: '&#128106;',
    child: '&#129485;',
    dead: '&#9760;',
    bone: '&#129460;',
    cowoman: catalog.man + catalog.woman,
    water: '&#128167;',
    pousse: '&#127793;',
    herb: '&#127807;',
    barrier: '&#128679;',
    brick: '&#129521;',
    sand: '&#9617;',
    lane: '&#9945;',
    house: '&#127968;',
  },
  spares = {
    //...o,
    spares: 'SPARES',
    tree: '&#127795;',
    wheat: '&#127806;',
    rabbit: '&#128007;',
    rat: '&#128000;',
    young: '&#129490;',
    baby: '&#128118;',
    potato: '&#129364;',
  },
  boxSize = 24,
  boxes = [];
let iteration = 0;

// Gestion des points
function box(x, y) {
  if (typeof boxes[x] === 'undefined')
    boxes[x] = [];

  return boxes[x][y];
}

// Move el to the x/y position if it's free
function helperPoint(el, x, y, data) {
  if (typeof box(x, y) === 'undefined' &&
    typeof el === 'object') {
    // Register in the grid
    boxes[x][y] = el;

    // Reposition the point
    el.style.left = (x - y / 2 + (data && data.model ? 0 : Math.random() / 4 - 0.125)) * boxSize + 'px';
    el.style.top = (y * 0.866 + (data && data.model ? 0 : Math.random() / 4 - 0.125)) * boxSize + 'px';
    el.data = {
      iteration: iteration,
      x: x,
      y: y,
      ...data
    };
    // Debug 
    el.setAttribute('title', [el.data.x, el.data.y, el.style.left, el.style.top].join(' '));

    return boxes[x][y];
  }
}

function addPoint(x, y, symbol, data) {
  const el = document.createElement('div');

  if (helperPoint(el, x, y, data)) {
    document.body.appendChild(el);
    el.innerHTML = symbol;
    el.draggable = true;
    el.ondragstart = dragstart;
  }
}

function movePoint(x, y, nx, ny) {
  const el = box(x, y);

  if (el) {
    const nEl = helperPoint(el, nx, ny);

    if (nEl)
      delete boxes[x][y];
  }
}

function deletePoint(x, y) {
  if (box(x, y)) {
    boxes[x][y].remove();
    delete boxes[x][y];
  }
}

// Init catalog
Object.entries(catalog).forEach((pair, i) => {
  addPoint(i, 0, pair[1], {
    model: true,
  });
})

// Déplacements
function dragstart(evt) {
  evt.dataTransfer.setData('data', JSON.stringify(evt.target.data));
  evt.dataTransfer.setData('symbol', evt.target.innerHTML);
}

const deltasProches = [
  [-1, 0, 0, -1],
  [1, 0, 0, 1],
  [0, 1, -1, -1],
  [0, -1, 1, 1],
  [1, 1, -1, 0],
  [-1, -1, 1, 0],
];

document.addEventListener('drop', evt => {
  const data = JSON.parse(evt.dataTransfer.getData('data')),
    symbol = evt.dataTransfer.getData('symbol'),
    nx = parseInt((evt.x + evt.y / 2) / boxSize),
    ny = parseInt(evt.y / 0.866 / boxSize);
  //TODO smooth end of move

  if (data.model)
    addPoint(nx, ny, symbol);
  else
    movePoint(data.x, data.y, nx, ny);

  evt.preventDefault();
});
document.addEventListener('dragover', evt => {
  evt.preventDefault();
});

document.addEventListener('dragend', evt => {
  //TODO better animation
  evt.preventDefault();
});

// Actions
function decHTML(el, ascii) {
  let out = '';
  for (const char of el.innerHTML) {
    const code = char.codePointAt(0);
    out += code >= 0x80 ? '&#' + code + ';' : char;
  }
  return ascii ? out === ascii : out;
}

function pointsProches(x, y, deep, limit, searched) {
  const p = [];

  // Randomize points order
  for (let i = Math.random() * 4; i > 0; i--)
    deltasProches.push(deltasProches.shift());

  for (d = 1; d < deep + 1 && p.length < limit; d++) {
    deltasProches.forEach(delta => {
      for (i = 0; i < d; i++) {
        const nx = x + d * delta[0] + i * delta[2],
          ny = y + d * delta[1] + i * delta[3],
          el = box(nx, ny),
          pnx = (nx - ny / 2) * boxSize,
          pny = ny * 0.866 * boxSize;

        if (0 < pnx && pnx < window.innerWidth &&
          0 < pny && pny < window.innerHeight)
          if ((!searched && !el) ||
            (searched && el && decHTML(el, searched)))
            p.push([nx, ny, ...delta]);
      }
    });
  }

  return p;
}

function action(el) {
  const pl = pointsProches(el.data.x, el.data.y, 1, 1);

  // Fontaine émet une goute
  if (pl.length && decHTML(el, o.fountain))
    addPoint(pl[0][0], pl[0][1], o.water);
  // Goutes se déplacent
  if (pl.length && decHTML(el, o.water))
    movePoint(el.data.x, el.data.y, el.data.x + pl[0][2], el.data.y + pl[0][3]);
  // Mais se déplacent
  if (pl.length && decHTML(el, o.corn))
    movePoint(el.data.x, el.data.y, el.data.x + pl[0][2], el.data.y + pl[0][3]);

  // Homme se rapproche
  const pm = pointsProches(el.data.x, el.data.y, 5, 1, o.woman);
  if (pm.length && decHTML(el, o.man))
    movePoint(el.data.x, el.data.y, el.data.x + pm[0][2], el.data.y + pm[0][3]);
}

// Actions
document.addEventListener('keydown', evt => {
  iteration++;
  boxes.forEach(ligne => {
    ligne.forEach(el => {
      if (!el.data.model && el.data.iteration < iteration) {
        action(el);
      }
    });
  });
});