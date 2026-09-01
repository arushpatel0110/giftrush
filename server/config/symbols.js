/**
 * symbols.js – Server-side symbol definitions.
 * Mirrors the frontend SymbolConfig so all game logic lives on the server.
 */

const SYMBOL_IDS = Object.freeze({
  SEVEN: 0,
  STAR: 1,
  BELL: 2,
  MITTEN: 3,
  ORNAMENT: 4,
  GINGERBREAD: 5,
  CANDY_CANE: 6,
  SANTA_HAT: 7,
  BONUS: 8,
});

const SYMBOL_CONFIG = Object.freeze({
  [SYMBOL_IDS.SEVEN]: { id: SYMBOL_IDS.SEVEN, name: 'Seven', label: '7', weight: 2, payout3: 60, isBonus: false },
  [SYMBOL_IDS.STAR]: { id: SYMBOL_IDS.STAR, name: 'Star', label: '★', weight: 4, payout3: 40, isBonus: false },
  [SYMBOL_IDS.BELL]: { id: SYMBOL_IDS.BELL, name: 'Bell', label: '🔔', weight: 6, payout3: 8, isBonus: false },
  [SYMBOL_IDS.MITTEN]: { id: SYMBOL_IDS.MITTEN, name: 'Mitten', label: '🧤', weight: 10, payout3: 1, isBonus: false },
  [SYMBOL_IDS.ORNAMENT]: { id: SYMBOL_IDS.ORNAMENT, name: 'Ornament', label: '🎄', weight: 12, payout3: 4, isBonus: false },
  [SYMBOL_IDS.GINGERBREAD]: { id: SYMBOL_IDS.GINGERBREAD, name: 'Gingerbread', label: '🍪', weight: 14, payout3: 4, isBonus: false },
  [SYMBOL_IDS.CANDY_CANE]: { id: SYMBOL_IDS.CANDY_CANE, name: 'Candy Cane', label: '🍬', weight: 16, payout3: 4, isBonus: false },
  [SYMBOL_IDS.SANTA_HAT]: { id: SYMBOL_IDS.SANTA_HAT, name: "Santa's Hat", label: '🎅', weight: 18, payout3: 4, isBonus: false },
  [SYMBOL_IDS.BONUS]: { id: SYMBOL_IDS.BONUS, name: 'Bonus Elf', label: '🎁', weight: 8, payout3: 0, isBonus: true },
});

const ALL_SYMBOL_IDS = Object.values(SYMBOL_IDS);
const SYMBOL_WEIGHTS = ALL_SYMBOL_IDS.map(id => SYMBOL_CONFIG[id].weight);

module.exports = { SYMBOL_IDS, SYMBOL_CONFIG, ALL_SYMBOL_IDS, SYMBOL_WEIGHTS };
