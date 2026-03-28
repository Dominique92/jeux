/* eslint-disable no-extend-native, func-names */

Array.prototype.plus = function(operande) {
  return this.map((valeur, key) => valeur + operande[key]);
};

Array.prototype.time = function(multiplicateur) {
  return this.map((valeur) => valeur * multiplicateur);
};

Array.prototype.div = function(diviseur) {
  return this.map((valeur) => valeur / diviseur);
};

Array.prototype.abs = function() {
  return this.reduce((r, v) => r + Math.abs(v), 0);
};

Array.prototype.round = function() {
  return this.map((v) => Math.round(v));
};

Array.prototype.borne = function(min, max) {
  return this.map((valeur) => Math.max(min, Math.min(valeur, max)));
};

Number.prototype.borne = function(min, max) {
  return Math.max(min, Math.min(this, max));
};

Array.prototype.rgb = function() {
  return 'rgb(' + (this.borne(0, 255).round().join(',')) + ')';
};

// Fonction aléatoire pour calculer les bosses du terrain
const rnd = Array(12).fill().map(() => Date.now() * Math.random() % 1); // Tableau de valeurs aléatoires

function rndSin(marqueur, x, periode, min, max) {
  return Math.sin((x / periode + rnd[marqueur]) * 6.28) *
    rnd[marqueur + 1] *
    (max - min) +
    (max + min) / 2;
}

Array.prototype.waves = function(i, nbCases) {
  return rndSin(4 * i, this[0], nbCases, 0, 9) *
    rndSin(4 * i + 2, this[1], nbCases, 0, 9);
};