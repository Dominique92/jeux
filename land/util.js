/* eslint-disable no-extend-native, func-names */

Array.prototype.plus = function(operande) {
  return this.map((valeur, key) => valeur + operande[key]);
};

Array.prototype.time = function(multiplicateur) {
  return this.map((valeur) => valeur * multiplicateur);
};

Array.prototype.borne = function(min, max) {
  return this.map((valeur) => Math.max(min, Math.min(valeur, max)));
};

Number.prototype.borne = function(min, max) {
  return Math.max(min, Math.min(this, max));
};

Array.prototype.abs = function() {
  return this.reduce((r, v) => r + Math.abs(v), 0);
};