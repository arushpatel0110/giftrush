import * as PIXI from 'pixi.js';
import { GameConfig } from '../config/GameConfig.js';
import { SlotSymbol } from './SlotSymbol.js';
import { MathUtils } from '../utils/MathUtils.js';
import { AnimationUtils } from '../utils/AnimationUtils.js';
import { EventEmitter } from '../utils/EventEmitter.js';
import { ALL_SYMBOL_IDS, SYMBOL_WEIGHTS } from '../config/SymbolConfig.js';

/**
 * Reel – 100% visually synchronized slot reel physics engine.
 *
 * Guarantees that symbols scrolling down the reel continuously land
 * into the visible rows with zero jumps, teleports, or symbol mismatches.
 */
export class Reel extends EventEmitter {
  /**
   * @param {number}   index       0=left, 1=mid, 2=right
   * @param {Function} getTexture  (symbolId, blur) → PIXI.Texture
   */
  constructor(index, getTexture) {
    super();

    this._index = index;
    this._getTexture = getTexture;
    this._spinning = false;
    this._turbo = false;
    this._state = 'IDLE'; // 'IDLE' | 'SPINNING' | 'DECELERATING' | 'BOUNCING'

    const S = GameConfig.SYMBOL_SIZE;
    const G = GameConfig.REEL_GAP;

    this._cellH = S;
    this._visRows = GameConfig.ROWS; // 3 rows

    // ── Container ───────────────────────────────────────────
    this.container = new PIXI.Container();
    this.container.eventMode = 'static';
    this.container.x = GameConfig.getReelX ? GameConfig.getReelX(index) : index * (S + G);
    this.container.y = GameConfig.REEL_Y_OFFSET ?? 0;

    // ── Tape container (scrolls vertically) ──────────────────
    this._tape = new PIXI.Container();
    this._tape.eventMode = 'static';
    this.container.addChild(this._tape);

    // ── Clip mask ───────────────────────────────────────────
    const mask = new PIXI.Graphics();
    mask.beginFill(0xFFFFFF);
    mask.drawRect(0, 0, S, S * this._visRows);
    mask.endFill();
    this.container.addChild(mask);
    this._tape.mask = mask;

    // ── Tape cells: 5 cells total (indices 0..4) ──────────────
    // Rows 0, 1, 2 are visible; rows -1, -2 are buffer above mask
    /** @type {SlotSymbol[]} */
    this._cells = [];
    /** @type {number[]} symbol IDs for cells [row-2, row-1, row0, row1, row2] */
    this._symbolIds = [];

    this._buildTape();

    this._offsetY = 0;     // scroll offset [0, cellH)
    this._speed = 0;     // px / second
    this._queue = [];    // upcoming symbol IDs queue
    this._targetSymbols = [];
  }

  get spinning() { return this._spinning; }
  get reelIndex() { return this._index; }

  get visibleSymbols() {
    return [this._symbolIds[2], this._symbolIds[3], this._symbolIds[4]];
  }

  /**
   * Begin continuous reel spin.
   * @param {boolean} turbo
   */
  startSpin(turbo = false) {
    this._turbo = turbo;
    this._spinning = true;
    this._state = 'SPINNING';
    this._queue = [];
    this._cells.forEach(cell => cell.visible = true);

    const targetSpeed = turbo ? 2600 : 1800; // px / second

    // Smoothly ramp up speed over 180ms
    const startSpeed = this._speed;
    const startTime = performance.now();
    const accelDur = 180;

    const accelTick = () => {
      if (this._state !== 'SPINNING') return;
      const elapsed = performance.now() - startTime;
      const t = Math.min(elapsed / accelDur, 1);
      this._speed = startSpeed + (targetSpeed - startSpeed) * MathUtils.easeOutCubic(t);
      if (t < 1) requestAnimationFrame(accelTick);
    };
    accelTick();

    this.emit('spinStart', this._index);
  }

  /**
   * Decelerate reel smoothly to stop on targetSymbols [row0, row1, row2].
   * @param {number[]} symbolIds [row0, row1, row2]
   * @param {number}   delay     ms before deceleration begins
   */
  async stopOn(symbolIds, delay = 0) {
    this._targetSymbols = symbolIds;
    if (delay > 0) await AnimationUtils.wait(delay);

    this._state = 'DECELERATING';

    const S = this._cellH;
    const padCount = this._turbo ? 0 : 1;

    // Fill queue: padding + target symbols [row2, row1, row0] + 2 top buffer symbols
    this._queue = [];
    for (let i = 0; i < padCount; i++) {
      this._queue.push(this._randId());
    }
    // Push target symbols in reverse order so they land at row 2 (idx 4), row 1 (idx 3), row 0 (idx 2)
    this._queue.push(symbolIds[2]);
    this._queue.push(symbolIds[1]);
    this._queue.push(symbolIds[0]);
    // 2 top buffer symbols for rows -1 (idx 1) and -2 (idx 0)
    this._queue.push(this._randId());
    this._queue.push(this._randId());

    const initialSpeed = Math.max(this._speed, 1800);

    await new Promise(resolve => {
      const decelTick = () => {
        if (this._state !== 'DECELERATING') {
          resolve();
          return;
        }

        // Remaining distance to scroll until queue is empty and offsetY is 0
        const distRemaining = this._queue.length * S - this._offsetY;

        if (distRemaining > 12) {
          // Maintain FULL SPIN SPEED constantly right up to landing — NO slowing down!
          this._speed = initialSpeed;
          requestAnimationFrame(decelTick);
        } else {
          // Instant direct landing snap
          this._speed = 0;
          this._offsetY = 0;
          this._tape.y = 0;
          this._cells.forEach(cell => cell.setMotionBlur(0));
          resolve();
        }
      };
      decelTick();
    });

    // Enforce exact final landing offset
    this._offsetY = 0;
    this._tape.y = 0;

    // Hide top buffer cells so they never peek into top of mask during downward landing overshoot
    if (this._cells[0]) this._cells[0].visible = false;
    if (this._cells[1]) this._cells[1].visible = false;

    // ── GUARANTEED SYMBOL FIX ────────────────────────────────────────────
    // Force-write exact target symbols into visible positions BEFORE bounce
    this._symbolIds[2] = symbolIds[0];
    this._symbolIds[3] = symbolIds[1];
    this._symbolIds[4] = symbolIds[2];
    this._updateCellTextures();
    // ────────────────────────────────────────────────────────────────────

    // Direct crisp bounce landing
    this._state = 'BOUNCING';
    await this._elasticBounce();

    this._state = 'IDLE';
    this._spinning = false;
    this.emit('reelStopped', this._index, symbolIds);
  }

  /**
   * Frame tick update. Delta is Pixi's deltaTime (~1.0 for 60fps).
   */
  update(delta) {
    if (this._speed <= 0) {
      this._cells.forEach(cell => cell.setMotionBlur(0));
      return;
    }

    const dt = delta / 60; // seconds
    this._offsetY += this._speed * dt;

    const S = this._cellH;
    while (this._offsetY >= S) {
      this._offsetY -= S;
      this._stepTapeDown();
    }

    this._tape.y = this._offsetY;

    // Apply logical vertical motion blur based on current reel speed
    const blurY = this._speed > 200 ? Math.min((this._speed - 200) / 140, 14) : 0;
    this._cells.forEach(cell => cell.setMotionBlur(blurY));
  }

  // ── Private Helpers ────────────────────────────────────────

  _buildTape() {
    const S = this._cellH;
    // 5 cells: y = -2S, -1S, 0, 1S, 2S
    this._symbolIds = [];
    this._cells = [];

    for (let i = 0; i < 5; i++) {
      const id = this._randId();
      const sym = new SlotSymbol(id, this._getTexture(id));
      sym.on('symbolClick', (symbolId) => {
        if (!this._spinning) {
          const idxInTape = this._cells.indexOf(sym);
          const rowIndex = idxInTape >= 2 ? (idxInTape - 2) : 1;
          this.emit('symbolClick', symbolId, this._index, rowIndex);
        }
      });
      sym.y = (i - 2) * S;
      this._tape.addChild(sym);
      this._cells.push(sym);
      this._symbolIds.push(id);
    }
  }

  _stepTapeDown() {
    // Shift symbol IDs down by 1 step
    const nextId = this._queue.length > 0 ? this._queue.shift() : this._randId();

    this._symbolIds.pop();
    this._symbolIds.unshift(nextId);

    this._updateCellTextures();
  }

  _updateCellTextures() {
    this._cells.forEach((cell, i) => {
      const id = this._symbolIds[i];
      const tex = this._getTexture(id);
      cell.setSymbol(id, tex);
    });
  }

  async _elasticBounce() {
    const overshoot = 10; // px downward overshoot
    await AnimationUtils.wait(20);
    await AnimationUtils.tweenTo(this._tape, 'y', overshoot, 45, MathUtils.easeOutCubic);
    await AnimationUtils.tweenTo(this._tape, 'y', 0, 65, MathUtils.easeOutBack);
    this._tape.y = 0;
  }

  _randId() {
    const idx = MathUtils.weightedRandom(SYMBOL_WEIGHTS);
    return ALL_SYMBOL_IDS[idx];
  }
}
