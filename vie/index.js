//TODO favicon

const tableEl = document.getElementsByTagName('table')[0],
  size = 9,
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
  },
  spares = {
    ...o,
    spares: 'SPARES',
    tree: '&#127795;',
    wheat: '&#127806;',
    rabbit: '&#128007;',
    rat: '&#128000;',
    young: '&#129490;',
    baby: '&#128118;',
    potato: '&#129364;',
  },
  size2 = Object.keys(spares).length,
  interval = 10000; // Intervale entre 2 actions, en millisecondes

function action() {
  /*DCMM*/
  console.log(99);
}

function dragstartHandler(evt) {
  evt.dataTransfer.setData('symbol', evt.target.innerHTML);
  evt.dataTransfer.setData('data', JSON.stringify(evt.target.data));
}

function dragoverHandler(evt) {
  evt.preventDefault();
}

function dropHandler(evt) {
  evt.preventDefault();

  const symbol = evt.dataTransfer.getData('symbol'),
    data = JSON.parse(evt.dataTransfer.getData('data'));

  if (evt.target.data.h && // Sauf la colonne de gauche
    evt.target.innerHTML === '&nbsp;') { // If empty
    evt.target.innerHTML = symbol;
    if (data.h) { // Sauf la colonne de gauche
      // Remove remote symbol & data
      tableEl.children[data.v].children[data.h].innerHTML = '&nbsp;';
      tableEl.children[data.v].children[data.h].data = {
        h: data.h,
        v: data.v
      };
    }
  }
}

// Build the table
for (let v = 0; v < size2; v++) {
  const pTr = document.createElement('tr');

  tableEl.appendChild(pTr);

  for (let h = 0; h < size; h++) {
    const tdEl = document.createElement('td');
    pTr.appendChild(tdEl);
    tdEl.innerHTML = h ? '&nbsp;' : Object.values(spares)[v] || '&nbsp;';
    tdEl.data = {
      h: h,
      v: v
    };

    if (h) {
      tdEl.ondrop = dropHandler;
      tdEl.ondragover = dragoverHandler;
    } else {}
    tdEl.draggable = true;
    tdEl.ondragstart = dragstartHandler;
  }
}

if (!localStorage.date)
  localStorage.date = Date.now();
let delta;
do {
  const locDate = parseFloat(localStorage.date);
  delta = Date.now() - locDate;
  localStorage.date = locDate + Math.max(1, 0.3 * delta);
} while (delta > interval);