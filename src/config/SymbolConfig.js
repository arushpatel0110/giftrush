/**
 * SymbolConfig – Defines every symbol in the game.
 *
 * weight  : relative probability (higher = more common)
 * payout3 : win multiplier when 3-of-a-kind on a payline
 * isBonus : triggers the bonus-pick screen when 3 land
 * colors  : used by SymbolRenderer to draw the symbol procedurally
 */

export const SYMBOL_IDS = Object.freeze({
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

export const SymbolConfig = Object.freeze({
  [SYMBOL_IDS.SEVEN]: {
    id: SYMBOL_IDS.SEVEN,
    name: 'Seven',
    label: '7',
    weight: 2,
    payout3: 60,
    isBonus: false,
    bgColor: 0x1a0030,
    primary: 0xFF3333,
    accent: 0xFFD700,
    glow: 0xFF0000,
  },
  [SYMBOL_IDS.STAR]: {
    id: SYMBOL_IDS.STAR,
    name: 'Star',
    label: '★',
    weight: 4,
    payout3: 40,
    isBonus: false,
    bgColor: 0x0d1a00,
    primary: 0xFFD700,
    accent: 0xFFA500,
    glow: 0xFFFF00,
  },
  [SYMBOL_IDS.BELL]: {
    id: SYMBOL_IDS.BELL,
    name: 'Bell',
    label: '🔔',
    weight: 6,
    payout3: 8,
    isBonus: false,
    bgColor: 0x1a1200,
    primary: 0xFFCC00,
    accent: 0xFF8C00,
    glow: 0xFFD700,
  },
  [SYMBOL_IDS.MITTEN]: {
    id: SYMBOL_IDS.MITTEN,
    name: 'Mitten',
    label: '🧤',
    weight: 10,
    payout3: 1,
    isBonus: false,
    bgColor: 0x1a0005,
    primary: 0xFF5555,
    accent: 0xFFFFFF,
    glow: 0xFF4444,
  },
  [SYMBOL_IDS.ORNAMENT]: {
    id: SYMBOL_IDS.ORNAMENT,
    name: 'Ornament',
    label: '🎄',
    weight: 12,
    payout3: 4,
    isBonus: false,
    bgColor: 0x001a00,
    primary: 0xFF2200,
    accent: 0xFFD700,
    glow: 0xFF3300,
  },
  [SYMBOL_IDS.GINGERBREAD]: {
    id: SYMBOL_IDS.GINGERBREAD,
    name: 'Gingerbread',
    label: '🍪',
    weight: 14,
    payout3: 4,
    isBonus: false,
    bgColor: 0x1a0d00,
    primary: 0xC4813A,
    accent: 0xFFFFFF,
    glow: 0xD4924B,
  },
  [SYMBOL_IDS.CANDY_CANE]: {
    id: SYMBOL_IDS.CANDY_CANE,
    name: 'Candy Cane',
    label: '🍬',
    weight: 16,
    payout3: 4,
    isBonus: false,
    bgColor: 0x150015,
    primary: 0xFF4444,
    accent: 0xFFFFFF,
    glow: 0xFF6666,
  },
  [SYMBOL_IDS.SANTA_HAT]: {
    id: SYMBOL_IDS.SANTA_HAT,
    name: "Santa's Hat",
    label: '🎅',
    weight: 18,
    payout3: 4,
    isBonus: false,
    bgColor: 0x1a0000,
    primary: 0xCC0000,
    accent: 0xFFFFFF,
    glow: 0xFF0000,
  },
  [SYMBOL_IDS.BONUS]: {
    id: SYMBOL_IDS.BONUS,
    name: 'Bonus Elf',
    label: '🎁',
    weight: 8,
    payout3: 0,    // pays 0 direct; triggers gift-pick bonus
    isBonus: true,
    bgColor: 0x001a08,
    primary: 0x00CC55,
    accent: 0xFFD700,
    glow: 0x00FF88,
  },
});

/** Ordered array of all symbol IDs for iteration */
export const ALL_SYMBOL_IDS = Object.values(SYMBOL_IDS);

/** Weight array aligned with ALL_SYMBOL_IDS */
export const SYMBOL_WEIGHTS = ALL_SYMBOL_IDS.map(id => SymbolConfig[id].weight);
