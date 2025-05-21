//TODO favicon

const divEls = document.getElementsByTagName('div'),
  catalog = {
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
    none: '&nbsp;',
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
  boxSize = 10;

function commonPoint(x, y, el) {
  if (typeof boxes[x] === 'undefined')
    boxes[x] = [];

  if (typeof boxes[x][y] === 'undefined' &&
    typeof el === 'object') {
    boxes[x][y] = el;
    el.style.left = x * boxSize + 'px';
    el.style.top = y * boxSize + 'px';
    return true;
  }
}

function addPoint(x, y, symbol, data) {
  const el = document.createElement('div');

  if (commonPoint(x, y, el)) {
    document.body.appendChild(el);
    el.innerHTML = symbol;
    el.data = data;
  }
}

function movePoint(x, y, nx, ny) {
  if (commonPoint(nx, ny, boxes[x][y]))
    delete boxes[x][y];
}

function deletePoint(x, y) {
  if (typeof boxes[x] !== 'undefined' &&
    typeof boxes[x][y] === 'object') {
    boxes[x][y].remove();
    delete boxes[x][y];
  }
}

addPoint(10, 5, o.water, {
  toto: 10
});
/*DCMM*/
console.log(boxes);

function action() {
  deletePoint(15, 10);
  movePoint(10, 5, 15, 10);
  /*DCMM*/
  console.log(boxes);
}