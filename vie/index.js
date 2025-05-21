//TODO favicon

const tableEl = document.getElementsByTagName('table')[0],
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
  sizeH = 12,
  sizeV = Object.keys(o).length,
  influence = 5, // Nb searched chars around a position
  interval = 10000; // Intervale entre 2 actions, en millisecondes //TODO

function decHTML(el) {
  let out = '';
  for (const char of el.innerHTML) {
    const code = char.codePointAt(0);
    out += code >= 0x80 ? '&#' + code + ';' : char;
  }
  return out;
}

function proches(v, h, deep, searched, cross) {
  const found = [];

  for (let d = 1; d <= deep && found.length <= influence; d++)
    for (let vc = v - d; vc <= v + d; vc++)
      for (let hc = h - d; hc <= h + d; hc++)
        if (0 <= vc && vc < sizeV && 0 <= hc && hc < sizeH &&
          (vc === v - d || vc === v + d || hc === h - d || hc === h + d) &&
          (!cross || (vc !== v && hc !== h))) {
          const elClose = tableEl.children[vc].children[hc];

          if (searched.includes(decHTML(elClose)))
            found.push(elClose);
        }
  return found;
}

function move(elOrigin, elDestination) {
  if (elDestination.data.h && // Sauf dans la colonne de gauche
    decHTML(elDestination) === o.none) { // If empty
    elDestination.innerHTML = elOrigin.innerHTML;

    // Remove remote symbol & data
    if (elOrigin.data.h) { // Sauf la colonne de gauche
      elOrigin.innerHTML = o.none;
      elOrigin.data = {
        v: elOrigin.data.v,
        h: elOrigin.data.h,
      };
    }
  }
}

function dragstartHandler(evt) {
  evt.dataTransfer.setData('data', JSON.stringify(evt.target.data));
}

function dragoverHandler(evt) {
  //TODO grab cursor
  evt.preventDefault();
}

function dropHandler(evt) {
  const data = JSON.parse(evt.dataTransfer.getData('data')),
    elOrigin = tableEl.children[data.v].children[data.h];

  move(elOrigin, evt.target);

  evt.preventDefault();
}

function action() {
  for (let v = 0; v < sizeV; v++)
    for (let h = 0; h < sizeH; h++) {
      const el = tableEl.children[v].children[h];
      // All boxes populated
      if (el.data.h && decHTML(el) !== o.none) {
        switch (decHTML(el)) {
          case o.fountain:
            proches(v, h, 1, [o.none], true).forEach(elC => {
              elC.innerHTML = o.water;
            });
            break;
          case o.water: //TODO BUG prend les nouvelles valeurs de l'eau
            const p = proches(v, h, 1, [o.none]);
            /*DCMM*/
            console.log(p);
            break;
        }
      }
    }
}

// Build the table
//TODO data en localstorage
for (let v = 0; v < sizeV; v++) {
  const pTr = document.createElement('tr');

  tableEl.appendChild(pTr);

  for (let h = 0; h < sizeH; h++) {
    const tdEl = document.createElement('td');
    pTr.appendChild(tdEl);
    tdEl.innerHTML = h ? o.none : Object.values(o)[v] || o.none;
    tdEl.data = {
      v: v,
      h: h,
    };

    if (h) {
      tdEl.ondrop = dropHandler;
      tdEl.ondragover = dragoverHandler;
    } else {}
    tdEl.draggable = true;
    tdEl.ondragstart = dragstartHandler;
  }
}

tableEl.insertAdjacentHTML('afterend', Object.values(spares).join(' '));

/*//TODO metronome
if (!localStorage.date)
  localStorage.date = Date.now();
let delta;
do {
  const locDate = parseFloat(localStorage.date);
  delta = Date.now() - locDate;
  localStorage.date = locDate + Math.max(1, 0.3 * delta);
} while (delta > interval);
*/