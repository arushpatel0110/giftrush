/**
 * paylines.js – Server-side payline definitions.
 * 5 fixed paylines on a 3×3 grid.
 * Each position: [reelIndex, rowIndex]
 *   reelIndex : 0=left  1=middle  2=right
 *   rowIndex  : 0=top   1=middle  2=bottom
 */

const PAYLINES = Object.freeze([
  {
    id:        1,
    name:      'Top Row',
    positions: [[0, 0], [1, 0], [2, 0]],
    color:     0xFF4444,
    colorHex:  '#FF4444',
  },
  {
    id:        2,
    name:      'Middle Row',
    positions: [[0, 1], [1, 1], [2, 1]],
    color:     0x44FF88,
    colorHex:  '#44FF88',
  },
  {
    id:        3,
    name:      'Bottom Row',
    positions: [[0, 2], [1, 2], [2, 2]],
    color:     0x4488FF,
    colorHex:  '#4488FF',
  },
  {
    id:        4,
    name:      'Diagonal ↘',
    positions: [[0, 0], [1, 1], [2, 2]],
    color:     0xFFDD00,
    colorHex:  '#FFDD00',
  },
  {
    id:        5,
    name:      'Diagonal ↗',
    positions: [[0, 2], [1, 1], [2, 0]],
    color:     0xFF44FF,
    colorHex:  '#FF44FF',
  },
]);

module.exports = { PAYLINES };
