/* global errer, muer, rapprocher, supprimer, produire, unir */

// SCÉNARII
/*
const consommer = [wwwWrapprocher, wwwWabsorber];
  vivant = [
    [consommer, '💧', 'eau'],
    [consommer, '🌽', 'energie'],
    [consommer, '🌾', 'energie'],
    [consommer, '🌱', 'energie'],
  ];
*/

/* eslint-disable-next-line no-unused-vars */
const scenarii = {
  // Cycle des humains 🧒👶
  '🧔': [
    [muer, '💀', d => d.eau < 0],
    [unir, '💧💦', '🧔', ' ▒▓', d => d.eau < 200],
    [unir, '🌽', '🧔', ' ▒▓', d => d.energie < 20],
    [unir, '👩', '🧔👩'],
    [rapprocher, '👩', ' ▒▓'],
    //...vivant,
    [errer, ' ▒▓', d => d.energie > 0],
    {
      cat: 'Homme',
      eau: 100,
      energie: 50,
    },
  ],
  '👩': [
    [muer, '💀', d => d.eau < 0],
    [unir, '💧💦', '👩', ' ▒▓', d => d.eau < 200],
    [unir, '🌽', '👩', ' ▒▓', d => d.energie < 20],
    [unir, '🧔', '🧔👩'],
    [rapprocher, '🧔', ' ▒▓'],
    //...vivant,
    [errer, ' ▒▓', d => d.energie > 0],
    {
      cat: 'Femme',
      eau: 100,
      energie: 50,
    },
  ],
  '🧔👩': [
    [muer, '💀', d => d.eau < 0],
    [unir, '💧💦', '🧔👩', ' ▒▓', d => d.eau < 200],
    [unir, '🌽', '🧔👩', ' ▒▓', d => d.energie < 20],
    [muer, '👫', d => d.age > 10],
    //...vivant,
    [errer, ' ▒▓', d => d.energie > 0],
    {
      cat: 'Amoureux',
    },
  ],
  '👫': [
    [muer, '💀', d => d.eau < 0],
    [unir, '💧💦', '👫', ' ▒▓', d => d.eau < 200],
    [unir, '🌽', '👫', ' ▒▓', d => d.energie < 20],
    //...vivant,
    //[muer, '👪', d => d.age > 5],
    [errer, ' ▒▓', d => d.energie > 0],
    {
      cat: 'Couple',
    },
  ],
  //TODO TEST
  '🧍': [
    [unir, '💧💦', '🧍', ' ▒▓', d => d.eau < 200],
    [unir, '🌽', '🧍', ' ▒▓', d => d.energie < 20],
    //...vivant,
    [muer, '🧔', d => d.age > 10 && Math.random() < 0.5],
    [muer, '👩', d => d.age > 1],
    [errer, ' ▒▓'],
    {
      cat: 'Enfant',
    },
  ],
  '💀': [
    [muer, '▒', d => d.age > 10],
    {
      cat: 'Mort',
    },
  ],

  // Cycle de l'eau 🚣🚢🌊🐟🌧
  '⛲': // Scénario de la catégorie d'objet
    [ // Action élémentaire du scénario
      [produire, // Verbe à exécuter //TODO faire essaimer
        '💧', // Catégorie à produire
        //TODO ??? () => {}, // Fonction à exécuter aprés avoir appliqué la règle
        () => Math.random() < 0.2 // Test d'applicabilité de la règle
      ],
      { // Init des data quand on crée
        cat: 'Fontaine',
        eau: 1000000,
      },
    ],
  '💧': [
    [muer, '💦', d => d.eau < 10],
    [rapprocher, '🧔👩🌱🌾🌽'],
    [errer, ' ▒▓'], {
      cat: 'Eau',
      eau: 100,
    },
  ],
  '💦': [
    [rapprocher, '🌽'],
    [rapprocher, '🌾'],
    [rapprocher, '🌱'],
    [supprimer, d => d.eau <= 0],
    [errer, ' ▒▓'],
    {
      cat: 'Eau',
    },
  ],

  // Cycle des plantes
  // Fruits🥑🍆🌰🍇🍈🍉🍊🍋🍋‍🍌🍍🥭🍎🍏🍐🍑🍒🍓🥝🍅🥥💮🌸
  // 🥦🍄🥔🥕🌽🌶️🥒🥬🧄🧅🥜🎕🌻
  // Arbres 🌿🌳🍂🔥
  '❀': [
    [muer, '🌱', d => d.age > 10],
    //[wwwWrapprocher, '▒', 3],
    //[wwwWabsorber, '▒', '🌱'],
    [errer, ' ▒▓'], {
      cat: 'Graine',
    },
  ],
  '🌱': [
    [unir, '💧'],
    [unir, '💦'],
    [muer, '▒', d => d.eau <= 0],
    [muer, '🌾', d => d.age > 10],
    {
      cat: 'Pousse',
    },
  ],
  '🌾': [
    [unir, '💧'],
    [unir, '💦'],
    [muer, '▒', d => d.eau <= 0],
    [muer, '🌽', d => d.age > 10],
    {
      cat: 'Plante',
      eau: 100,
      energie: 50,
    },
  ],
  '🌽': [
    [unir, '💧'],
    [unir, '💦'],
    [muer, '▒', d => d.eau <= 0],
    [muer, '▓', d => d.eau > 100],
    [produire, '❀', () => Math.random() < 0.2], //TODO faire essaimer
    {
      cat: 'Mais',
      eau: 100,
      energie: 50,
    },
  ],

  // Cycle des surfaces
  '▒': [{
    cat: 'Terre',
  }],
  '▓': [{
    cat: 'Herbe',
  }],

  '👪': [
    //...vivant,
    //[muer, '👫', d => d.age > 10], //TODO produire enfant
    [errer, ' ▒▓'],
    {
      cat: 'Famille',
    },
  ],
  // Cycle des animaux
  // 🥚🐣🐤🐥🐔🐓🦆🐀🐁🐇🐑🦊🐻🦋🐞🦉🦴

  // Cycle des travaux 🚧👷
  '🧱': [{
    cat: 'Briques',
  }],
  '🏠': [
    //[wwwWrencontrer, '▒'],
    {
      cat: 'Maison',
    },
  ],
};