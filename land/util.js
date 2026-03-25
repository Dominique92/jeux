/* eslint-disable-next-line no-unused-vars */
const encadre = (min, val, max) => Math.max(min, Math.min(val, max));

/* eslint-disable-next-line no-extend-native, func-names */
Array.prototype.plus = function(operande) {
  return this.map((v, k) => v + operande[k]);
};

/* eslint-disable-next-line no-extend-native, func-names */
Array.prototype.time = function(multiplicateur) {
  return this.map((v) => v * multiplicateur);
};