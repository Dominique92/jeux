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
  boxes = [],
  boxSize = 24;

// Gestion des points
function box(x, y) {
  if (typeof boxes[x] === 'undefined')
    boxes[x] = [];

  return boxes[x][y];
}

// Move el to the x/y position if it's free
function helperPoint(el, x, y) {
  if (typeof box(x, y) === 'undefined' &&
    typeof el === 'object') {
    // Register in the grid
    boxes[x][y] = el;

    // Reposition the point
    el.style.left = (x - y / 2) * boxSize + 'px';
    el.style.top = y * 0.866 * boxSize + 'px';
    el.data = {
      x: x,
      y: y,
    };
    el.setAttribute('title', [el.data.x, el.data.y, el.style.left, el.style.top].join(' '));

    return boxes[x][y];
  }
}

function addPoint(x, y, symbol, data) {
  const el = document.createElement('div');

  if (helperPoint(el, x, y)) {
    document.body.appendChild(el);
    el.innerHTML = symbol;
    el.data = {
      ...el.data,
      ...data
    };
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

const sommetsProches = [
  [-1, 0, 0, -1],
  [-1, -1, 1, 0],
  [0, -1, 1, 1],
  [1, 0, 0, 1],
  [1, 1, -1, 0],
  [0, 1, -1, -1],
];

// Actions
function decHTML(el) {
  let out = '';
  for (const char of el.innerHTML) {
    const code = char.codePointAt(0);
    out += code >= 0x80 ? '&#' + code + ';' : char;
  }
  return out;
}

function proches(x, y, deep, searched) {
  const p = [];

  for (d = 1; d < deep + 1; d++) {
    sommetsProches.forEach(delta => {
      for (i = 0; i < d; i++) {
        const nx = x + d * delta[0] + i * delta[2],
          ny = y + d * delta[1] + i * delta[3],
          el = box(nx, ny);

        if (!el && !searched)
          p.push([nx, ny]);

        if (el && decHTML(el) === searched)
          p.push(el);
      }
    });
  }

  return p;
}

function action(el) {
  const p = proches(el.data.x, el.data.y, 2);

  p.forEach(xy => {
    addPoint(xy[0], xy[1], o.man);
  });
}

document.addEventListener('drop', evt => {
  const data = JSON.parse(evt.dataTransfer.getData('data')),
    symbol = evt.dataTransfer.getData('symbol'),
    nx = parseInt((evt.x + evt.y / 2) / boxSize),
    ny = parseInt(evt.y / boxSize / 0.866);
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
document.addEventListener('keydown', evt => {
  boxes.forEach(ligne => {
    ligne.forEach(el => {
      if (!el.data.model) {
        // Action
        action(el);
      }
    });
  });
});