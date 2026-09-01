import * as PIXI from 'pixi.js';
import { Spine } from 'pixi-spine';
import { EventEmitter } from '../utils/EventEmitter.js';
import { GameConfig } from '../config/GameConfig.js';
import { Reel } from './Reel.js';
import { SlotSymbol } from './SlotSymbol.js';
import { RNGEngine } from './RNGEngine.js';
import { WinEvaluator } from './WinEvaluator.js';
import { PaylineManager } from './PaylineManager.js';
import { AnimationUtils } from '../utils/AnimationUtils.js';
import { ALL_SYMBOL_IDS, SYMBOL_WEIGHTS, SYMBOL_IDS, SymbolConfig } from '../config/SymbolConfig.js';
import { MathUtils } from '../utils/MathUtils.js';
import anticipationBgUrl from '../../assets/anticipation-bg.png_80_90.png';

/**
 * Maps each symbol ID to its spine animation key stored in AssetLoader.
 * Note: the asset file names in symbol_spines differ from the game's symbol names:
 *   glove → mitten, cane → stick, bread → cookie, bonus → elf
 */
const SYMBOL_SPINE_KEYS = {
  [SYMBOL_IDS.SEVEN]: 'sym_seven',
  [SYMBOL_IDS.STAR]: 'sym_star',
  [SYMBOL_IDS.BELL]: 'sym_bells',
  [SYMBOL_IDS.MITTEN]: 'sym_mitten',
  [SYMBOL_IDS.ORNAMENT]: 'sym_ball',
  [SYMBOL_IDS.GINGERBREAD]: 'sym_cookie',
  [SYMBOL_IDS.CANDY_CANE]: 'sym_stick',
  [SYMBOL_IDS.SANTA_HAT]: 'sym_hat',
  [SYMBOL_IDS.BONUS]: 'sym_elf',
};

/**
 * SlotMachine – Orchestrates all 3 reels, the RNG, win evaluation,
 * and payline presentation. Emits high-level game events consumed
 * by the GameScene and UIManager.
 *
 * Events:
 *   'spinStart'        ()
 *   'reelStopped'      (reelIndex)
 *   'spinComplete'     (result, winData)
 *   'bonusTriggered'   (result)
 */
export class SlotMachine extends EventEmitter {
  /**
   * @param {PIXI.Container}  parentContainer
   * @param {Function}        getTexture        (symbolId, blur) → PIXI.Texture
   * @param {Function}        [getUITexture]    (name) → PIXI.Texture
   * @param {Function}        [getSpineData]    (key) → SpineData | null
   */
  constructor(parentContainer, getTexture, getUITexture, getSpineData) {
    super();

    this._getTexture = getTexture;
    this._getUITexture = getUITexture;
    this._getSpineData = getSpineData ?? null;
    this._spinning = false;
    this._turbo = false;

    this._rng = new RNGEngine();
    this._evaluator = new WinEvaluator();

    /** @type {Reel[]} */
    this._reels = [];

    /** @type {SlotSymbol[][][]} [reel][row] visible symbol cells */
    this._symbolGrid = [];

    // ── Container ─────────────────────────────────────────
    this.container = new PIXI.Container();
    this.container.eventMode = 'static';
    this.container.x = GameConfig.GRID_X;
    this.container.y = GameConfig.GRID_Y;
    parentContainer.addChild(this.container);

    // ── Build reels ────────────────────────────────────────
    this._buildReels();

    // ── Payline manager ────────────────────────────────────
    this._paylines = new PaylineManager(
      parentContainer,
      this._symbolGrid,
      GameConfig.GRID_X,
      GameConfig.GRID_Y,
    );
    this._paylines.on('paylineShow', (text) => this.emit('paylineShow', text));

    // ── Background frame behind reels ─────────────────────
    this._buildBackground();

    // ── Ticker ────────────────────────────────────────────
    this._ticker = new PIXI.Ticker();
    this._ticker.add(this._onTick, this);
    this._ticker.start();

    this._winLoopActive = false;
    this._winLoopCounter = 0;
    this._winSpines = [];
  }

  get isSpinning() { return this._spinning; }
  get turbo() { return this._turbo; }
  set turbo(v) { this._turbo = v; }

  /** When true the next spin forces payline 1 (top row) to win. Auto-resets after one spin. */
  get forcePayline1() { return this._forcePayline1; }
  set forcePayline1(v) { this._forcePayline1 = v; }

  /** When true the next spin forces 2 paylines (top & middle rows) to win. Auto-resets after one spin. */
  get forceTwoPaylines() { return this._forceTwoPaylines; }
  set forceTwoPaylines(v) { this._forceTwoPaylines = v; }

  // ── Public API ─────────────────────────────────────────────

  /** Trigger a regular spin. */
  async spin(buyBonus = false, bet = 0.10) {
    if (this._spinning) return;
    this._spinning = true;
    // Stop any win animation loop from the previous spin before starting a new one
    this._stopWinLoop();
    this.emit('spinStart');

    // Generate outcome
    let result;
    if (GameConfig.FORCE_TEST_BONUS) {
      result = [
        [SYMBOL_IDS.SANTA_HAT, SYMBOL_IDS.BONUS, SYMBOL_IDS.GINGERBREAD],
        [SYMBOL_IDS.ORNAMENT, SYMBOL_IDS.BONUS, SYMBOL_IDS.MITTEN],
        [SYMBOL_IDS.CANDY_CANE, SYMBOL_IDS.BONUS, SYMBOL_IDS.BELL],
      ];
    } else if (this._forceTwoPaylines) {
      result = this._rng.generateTwoPaylinesWin();
      this._forceTwoPaylines = false; // auto-reset — fires once only
    } else if (this._forcePayline1) {
      result = this._rng.generatePayline1Win();
      this._forcePayline1 = false; // auto-reset — fires once only
    } else if (buyBonus) {
      result = this._rng.generateBonusTrigger();
    } else {
      result = this._rng.generateSpinResult();
    }

    // Start all reels spinning
    this._reels.forEach(r => r.startSpin(this._turbo));

    // Minimum initial spin duration before reel 1 starts decelerating
    const minSpinDuration = this._turbo ? 150 : 350;
    await AnimationUtils.wait(minSpinDuration);

    // Sequentially stop Reel 0 → Reel 1 → Reel 2
    let consecutiveBonusChain = 0;
    let anticipationSprite = null;

    for (let i = 0; i < this._reels.length; i++) {
      if (i === 2 && consecutiveBonusChain === 2 && !buyBonus) {
        anticipationSprite = this._showAnticipationBgOnReel(2);
        this.emit('anticipationStart');
        await AnimationUtils.wait(this._turbo ? 500 : 1300);
      }

      await this._reels[i].stopOn(result[i], 0);

      if (!buyBonus) {
        const bonusRow = result[i].findIndex(id => id === SYMBOL_IDS.BONUS || SymbolConfig[id]?.isBonus);

        if (i === 0) {
          if (bonusRow !== -1) {
            consecutiveBonusChain = 1;
            this._showSingleBonusOverlay(0, bonusRow);
          } else {
            consecutiveBonusChain = 0;
          }
        } else if (i === 1) {
          if (bonusRow !== -1 && consecutiveBonusChain === 1) {
            consecutiveBonusChain = 2;
            this._showSingleBonusOverlay(1, bonusRow);
          } else {
            if (consecutiveBonusChain > 0) {
              this._stopWinAnimations();
            }
            consecutiveBonusChain = 0;
          }
        } else if (i === 2) {
          if (bonusRow !== -1 && consecutiveBonusChain === 2) {
            consecutiveBonusChain = 3;
          } else {
            if (consecutiveBonusChain > 0) {
              this._stopWinAnimations();
            }
            consecutiveBonusChain = 0;
          }
        }
      }

      if (i < this._reels.length - 1) {
        const gap = this._turbo ? 40 : 100;
        await AnimationUtils.wait(gap);
      }
    }

    if (anticipationSprite) {
      this._removeAnticipationBg(anticipationSprite);
      this.emit('anticipationEnd');
    }

    // Evaluate with current bet
    const winData = this._evaluator.evaluate(result, bet);
    winData._rawResult = result;

    if (winData.bonusTriggered) {
      this._spinning = false;
      const bPositions = (winData.bonusPositions && winData.bonusPositions.length) ? winData.bonusPositions : [[0, 1], [1, 1], [2, 1]];
      await this.showBonusTriggerPresentation(bPositions);
      this.emit('bonusTriggered', result);
      return;
    }

    if (consecutiveBonusChain > 0) {
      this._stopWinAnimations();
    }

    if (winData.wins.length) {
      // Start continuous win loop (all together first, then 1-by-1, repeating endlessly)
      this._startWinLoop(winData.wins, winData.totalWin);
    }

    this._spinning = false;
    this.emit('spinComplete', result, winData);
  }

  /**
   * spinWithResult – Spin animation driven by a server-provided grid.
   * The server has already determined the outcome; we just animate it.
   *
   * @param {number[][]} grid    [reel][row] → symbolId  (from server)
   * @param {number}     bet     Current bet (for local win display)
   */
  async spinWithResult(grid, bet = 0.10) {
    if (this._spinning) return;
    this._spinning = true;
    this._stopWinLoop();
    this.emit('spinStart');

    // ── Sanitize grid: guarantee every value is a clean integer ──
    const cleanGrid = grid.map(reelCol =>
      Array.isArray(reelCol)
        ? reelCol.map(id => Math.round(Number(id)))
        : []
    );

    if (GameConfig.FORCE_TEST_BONUS) {
      cleanGrid[0][1] = SYMBOL_IDS.BONUS;
      cleanGrid[1][1] = SYMBOL_IDS.BONUS;
      cleanGrid[2][1] = SYMBOL_IDS.BONUS;
    }

    // Debug log — compare in browser console to verify server ↔ UI match
    console.log(
      '[SpinResult] Server grid (reel→rows):\n' +
      cleanGrid.map((col, r) => `  Reel ${r}: [${col.join(', ')}]`).join('\n')
    );

    // Start all reels spinning visually
    this._reels.forEach(r => r.startSpin(this._turbo));

    const minSpinDuration = this._turbo ? 150 : 350;
    await AnimationUtils.wait(minSpinDuration);

    // Stop each reel on the server-determined symbols (sanitized)
    let consecutiveBonusChain = 0;
    let anticipationSprite = null;

    for (let i = 0; i < this._reels.length; i++) {
      if (i === 2 && consecutiveBonusChain === 2) {
        anticipationSprite = this._showAnticipationBgOnReel(2);
        this.emit('anticipationStart');
        await AnimationUtils.wait(this._turbo ? 500 : 1300);
      }

      await this._reels[i].stopOn(cleanGrid[i], 0);

      const bonusRow = cleanGrid[i].findIndex(id => id === SYMBOL_IDS.BONUS || SymbolConfig[id]?.isBonus);

      if (i === 0) {
        if (bonusRow !== -1) {
          consecutiveBonusChain = 1;
          this._showSingleBonusOverlay(0, bonusRow);
        } else {
          consecutiveBonusChain = 0;
        }
      } else if (i === 1) {
        if (bonusRow !== -1 && consecutiveBonusChain === 1) {
          consecutiveBonusChain = 2;
          this._showSingleBonusOverlay(1, bonusRow);
        } else {
          if (consecutiveBonusChain > 0) {
            this._stopWinAnimations();
          }
          consecutiveBonusChain = 0;
        }
      } else if (i === 2) {
        if (bonusRow !== -1 && consecutiveBonusChain === 2) {
          consecutiveBonusChain = 3;
        } else {
          if (consecutiveBonusChain > 0) {
            this._stopWinAnimations();
          }
          consecutiveBonusChain = 0;
        }
      }

      if (i < this._reels.length - 1) {
        const gap = this._turbo ? 40 : 100;
        await AnimationUtils.wait(gap);
      }
    }

    if (anticipationSprite) {
      this._removeAnticipationBg(anticipationSprite);
      this.emit('anticipationEnd');
    }

    // Verify visible symbols after stop match the server grid
    const displayed = this._reels.map(r => r.visibleSymbols);
    const mismatches = [];
    cleanGrid.forEach((col, reel) => {
      col.forEach((id, row) => {
        if (displayed[reel]?.[row] !== id) {
          mismatches.push(`Reel${reel} Row${row}: server=${id} displayed=${displayed[reel]?.[row]}`);
        }
      });
    });
    if (mismatches.length) {
      console.warn('[SpinResult] ⚠ Symbol mismatch detected:\n  ' + mismatches.join('\n  '));
    } else {
      console.log('[SpinResult] ✓ All symbols match server result.');
    }

    // Evaluate locally just for win animations (server is authoritative for $)
    const winData = this._evaluator.evaluate(cleanGrid, bet);
    winData._rawResult = cleanGrid;

    if (winData.bonusTriggered) {
      this._spinning = false;
      const bPositions = (winData.bonusPositions && winData.bonusPositions.length) ? winData.bonusPositions : [[0, 1], [1, 1], [2, 1]];
      await this.showBonusTriggerPresentation(bPositions);
      this.emit('bonusTriggered', cleanGrid);
      return;
    }

    if (consecutiveBonusChain > 0) {
      this._stopWinAnimations();
    }

    if (winData.wins.length) {
      this._startWinLoop(winData.wins, winData.totalWin);
    }

    this._spinning = false;
    this.emit('spinComplete', cleanGrid, winData);
  }

  /**
   * Evaluate wins with the correct bet amount after spin is done.
   * Called by GameScene which owns the bet.
   */
  evaluateWithBet(result, bet) {
    return this._evaluator.evaluate(result, bet);
  }

  /**
   * Play the bonus trigger presentation:
   * Displays win-bg.png_80_80.webp glow behind each bonus position and plays the Spine elf animation.
   * @param {number[][]} positions [reel, row] pairs of bonus symbols
   */
  async showBonusTriggerPresentation(positions = [[0, 1], [1, 1], [2, 1]]) {
    this._stopWinAnimations();

    if (this._darkFrameG) {
      // Re-add _darkFrameG on top of reels so it covers non-winning symbols
      this.container.addChild(this._darkFrameG);
      this._darkFrameG.visible = true;
    }

    const activeKeys = new Set(positions.map(([r, row]) => `${r}_${row}`));
    if (this._paylines) {
      this._paylines.updateCellDimming(activeKeys);
    }

    const S = GameConfig.SYMBOL_SIZE;
    const G = GameConfig.REEL_GAP;
    const yOff = GameConfig.REEL_Y_OFFSET ?? 0;

    const winBgTex = this._getUITexture ? this._getUITexture('win_bg_symbol') : null;
    const hasWinBg = winBgTex && winBgTex !== PIXI.Texture.WHITE;

    positions.forEach(([reel, row]) => {
      const cell = this._symbolGrid[reel]?.[row];
      if (!cell) return;

      const cellX = GameConfig.getReelX ? GameConfig.getReelX(reel) : reel * (S + G);
      const cellY = row * S + yOff;
      const cx = cellX + S * 0.5;
      const cy = cellY + S * 0.5;

      // Hide static cell sprite while playing Spine animation
      cell.setStaticVisible(false);

      // 1. Win-bg glow sprite behind the bonus symbol
      if (hasWinBg) {
        const bg = new PIXI.Sprite(winBgTex);
        bg.anchor.set(0.5);
        bg.x = cx;
        bg.y = cy;
        bg.width = GameConfig.WIN_BG_WIDTH ?? (S * (GameConfig.WIN_BG_SIZE_MULTIPLIER ?? 1.45));
        bg.height = GameConfig.WIN_BG_HEIGHT ?? (S * (GameConfig.WIN_BG_SIZE_MULTIPLIER ?? 1.45));
        bg.zIndex = 30;
        this.container.addChild(bg);
        this._winSpines.push(bg);
      }

      // 2. Spine elf animation on top layer
      if (this._getSpineData) {
        const spineData = this._getSpineData('sym_elf');
        if (spineData) {
          try {
            const spine = new Spine(spineData);
            const skelW = spineData.width || S;
            const skelH = spineData.height || S;
            const scale = Math.min(S / skelW, S / skelH) * 1.05;
            spine.scale.set(scale);
            spine.x = cx;
            spine.y = cy;
            spine.zIndex = 40;

            const available = spineData.animations?.map(a => a.name) ?? [];
            const hasStop = available.includes('elf_stop');
            const hasTrigger = available.includes('elf_trigger');

            if (hasStop && hasTrigger) {
              // First play elf_stop 2 times, then play elf_trigger 1 time
              spine.state.setAnimation(0, 'elf_stop', false);
              spine.state.addAnimation(0, 'elf_stop', false, 0);
              spine.state.addAnimation(0, 'elf_trigger', false, 0);
            } else {
              const animName = available.find(n => n.includes('trigger') || n.includes('win') || n.includes('play')) || available[0] || 'animation';
              spine.state.setAnimation(0, animName, true);
            }

            this.container.addChild(spine);
            this._winSpines.push(spine);
          } catch (err) {
            console.warn('[SlotMachine] Could not play bonus elf spine:', err);
          }
        }
      }
    });

    await AnimationUtils.wait(3500);
  }

  /** Flash all bonus symbol cells with win-bg and Spine elf animation. */
  async flashBonusCells(positions = [[0, 1], [1, 1], [2, 1]]) {
    await this.showBonusTriggerPresentation(positions);
  }

  // ── Anticipation & Landed Bonus Overlays ───────────────────

  _showAnticipationBgOnReel(reelIndex) {
    let tex = this._getUITexture ? this._getUITexture('anticipation_bg') : null;
    if (!tex || tex === PIXI.Texture.WHITE) {
      tex = PIXI.Texture.from(anticipationBgUrl);
    }

    const S = GameConfig.SYMBOL_SIZE;
    const yOff = GameConfig.REEL_Y_OFFSET ?? 0;
    const reelX = GameConfig.getReelX ? GameConfig.getReelX(reelIndex) : reelIndex * (S + 130);
    const cx = reelX + S * 0.56;
    const cy = yOff + S * 1.5;

    const container = new PIXI.Container();

    const sprite = new PIXI.Sprite(tex);
    sprite.anchor.set(0.5);
    sprite.x = cx;
    sprite.y = cy;
    sprite.width = S * 1.75;
    sprite.height = S * 3.35;
    sprite.alpha = 1.0;
    container.addChild(sprite);

    // Add to container at index 1 (above background frame, right behind reel symbols)
    const insertIdx = Math.min(1, this.container.children.length);
    this.container.addChildAt(container, insertIdx);

    return container;
  }

  _removeAnticipationBg(sprite) {
    if (!sprite) return;
    if (sprite._pulseTicker) {
      this._ticker.remove(sprite._pulseTicker);
    }
    try {
      if (!sprite.destroyed) sprite.destroy({ children: true });
    } catch (_) { }
  }

  _showSingleBonusOverlay(reel, row) {
    const S = GameConfig.SYMBOL_SIZE;
    const G = GameConfig.REEL_GAP;
    const yOff = GameConfig.REEL_Y_OFFSET ?? 0;

    const cell = this._symbolGrid[reel]?.[row];
    if (!cell) return;

    const cellX = GameConfig.getReelX ? GameConfig.getReelX(reel) : reel * (S + G);
    const cellY = row * S + yOff;
    const cx = cellX + S * 0.5;
    const cy = cellY + S * 0.5;

    cell.setStaticVisible(false);

    // 1. Win-bg glow sprite behind the bonus symbol
    const winBgTex = this._getUITexture ? this._getUITexture('win_bg_symbol') : null;
    if (winBgTex && winBgTex !== PIXI.Texture.WHITE) {
      const bg = new PIXI.Sprite(winBgTex);
      bg.anchor.set(0.5);
      bg.x = cx;
      bg.y = cy;
      bg.width = GameConfig.WIN_BG_WIDTH ?? (S * 1.45);
      bg.height = GameConfig.WIN_BG_HEIGHT ?? (S * 1.45);
      this.container.addChild(bg);
      this._winSpines.push(bg);
    }

    // 2. Spine elf animation on top layer
    if (this._getSpineData) {
      const spineData = this._getSpineData('sym_elf');
      if (spineData) {
        try {
          const spine = new Spine(spineData);
          const skelW = spineData.width || S;
          const skelH = spineData.height || S;
          const scale = Math.min(S / skelW, S / skelH) * 1.05;
          spine.scale.set(scale);
          spine.x = cx;
          spine.y = cy;

          const available = spineData.animations?.map(a => a.name) ?? [];
          const animName = available.includes('elf_stop') ? 'elf_stop' : (available[0] || 'animation');
          spine.state.setAnimation(0, animName, true);

          this.container.addChild(spine);
          this._winSpines.push(spine);
        } catch (err) {
          console.warn('[SlotMachine] Could not play single bonus elf spine:', err);
        }
      }
    }
  }

  destroy() {
    this._ticker.destroy();
    this._stopWinLoop();
    this.container.destroy({ children: true });
  }

  // ── Multi-stage Win Presentation Loop ───────────────────────

  /**
   * Start the continuous multi-stage win presentation loop.
   * - Phase 1 (All Together): Show all winning paylines together with a single big total win badge in center.
   * - Phase 2 (One by One): Cycle through each winning payline individually with line badges.
   * - Continues looping until a new spin is initiated.
   * @param {WinEntry[]} wins
   * @param {number}     totalWin
   */
  async _startWinLoop(wins, totalWin = 0) {
    this._stopWinLoop();
    if (!wins || !wins.length) return;

    this._winLoopActive = true;
    const currentLoopId = ++this._winLoopCounter;

    const ALL_TOGETHER_MS = 2500;
    const ONE_BY_ONE_MS = GameConfig.WIN_FLASH_DURATION || 1500;

    const isMultiPayline = wins.length > 1;

    // ── Phase 1: ALL TOGETHER (First time only) ───────────────────
    this._showWinPresentationState(wins, isMultiPayline, totalWin);
    await AnimationUtils.wait(ALL_TOGETHER_MS);
    if (!this._winLoopActive || this._winLoopCounter !== currentLoopId) return;

    // ── Phase 2: ONE BY ONE (Loops continuously) ──────────────────
    while (this._winLoopActive && this._winLoopCounter === currentLoopId) {
      for (const win of wins) {
        this._showWinPresentationState([win], false, win.amount);
        await AnimationUtils.wait(ONE_BY_ONE_MS);
        if (!this._winLoopActive || this._winLoopCounter !== currentLoopId) break;
      }
    }
  }

  /**
   * Render the win presentation for a specific subset of winning paylines.
   * Displays win-bg.png_80_80.webp background glows, Spine win animations,
   * payline connector graphics, and updates cell dimming.
   * @param {WinEntry[]} winsToDisplay
   * @param {boolean}    isAllTogether
   * @param {number}     totalWinAmount
   */
  _showWinPresentationState(winsToDisplay, isAllTogether = false, totalWinAmount = 0) {
    this._stopWinAnimations();

    if (!winsToDisplay || !winsToDisplay.length) {
      this._paylines.clearAll();
      return;
    }

    const activeKeys = new Set();
    const activePositions = [];

    winsToDisplay.forEach(win => {
      win.positions.forEach(([reel, row]) => {
        const key = `${reel}_${row}`;
        if (!activeKeys.has(key)) {
          activeKeys.add(key);
          activePositions.push([reel, row]);
        }
      });
    });

    if (this._darkFrameG) {
      // Re-add _darkFrameG on top of reels so it covers non-winning symbols
      this.container.addChild(this._darkFrameG);
      this._darkFrameG.visible = true;
    }

    this._paylines.drawPaylines(winsToDisplay, this._getUITexture, isAllTogether, totalWinAmount);
    this._paylines.updateCellDimming(activeKeys);

    const S = GameConfig.SYMBOL_SIZE;
    const G = GameConfig.REEL_GAP;
    const yOff = GameConfig.REEL_Y_OFFSET ?? 0;

    const winBgTex = this._getUITexture ? this._getUITexture('win_bg_symbol') : null;
    const hasWinBg = winBgTex && winBgTex !== PIXI.Texture.WHITE;

    activePositions.forEach(([reel, row]) => {
      const cell = this._symbolGrid[reel]?.[row];
      if (!cell) return;

      const symbolId = cell.symbolId;
      const cellX = GameConfig.getReelX ? GameConfig.getReelX(reel) : reel * (S + G);
      const cellY = row * S + yOff;
      const cx = cellX + S * 0.5;
      const cy = cellY + S * 0.5;

      // Hide cell static sprite while playing win overlay animation
      cell.setStaticVisible(false);

      // ── 1. Win-bg glow sprite (on top of darkFrameG, behind winning symbol) ──
      if (hasWinBg) {
        const bg = new PIXI.Sprite(winBgTex);
        bg.anchor.set(0.5);
        bg.x = cx;
        bg.y = cy;
        bg.width = GameConfig.WIN_BG_WIDTH ?? (S * (GameConfig.WIN_BG_SIZE_MULTIPLIER ?? 1.45));
        bg.height = GameConfig.WIN_BG_HEIGHT ?? (S * (GameConfig.WIN_BG_SIZE_MULTIPLIER ?? 1.45));
        bg.zIndex = 30;
        this.container.addChild(bg);
        this._winSpines.push(bg);
      }

      // ── 2. Winning symbol animation / sprite (on top of win-bg) ─────────────────
      let spineCreated = false;
      if (this._getSpineData) {
        const spineKey = SYMBOL_SPINE_KEYS[symbolId];
        if (spineKey) {
          const spineData = this._getSpineData(spineKey);
          if (spineData) {
            try {
              const spine = new Spine(spineData);
              const skelW = spineData.width || S;
              const skelH = spineData.height || S;
              const scale = Math.min(S / skelW, S / skelH) * 1.05;
              spine.scale.set(scale);

              spine.x = cx;
              spine.y = cy;
              spine.zIndex = 40;

              const available = spineData.animations?.map(a => a.name) ?? [];
              const animName = available.find(n => n.includes('win') || n.includes('trigger') || n.includes('play')) || available[0] || 'animation';
              spine.state.setAnimation(0, animName, true);

              this.container.addChild(spine);
              this._winSpines.push(spine);
              spineCreated = true;
            } catch (err) {
              console.warn(`[SlotMachine] Could not play win spine for symbol ${symbolId}:`, err);
            }
          }
        }
      }

      // Fallback static sprite on top of win-bg if no Spine animation exists
      if (!spineCreated) {
        const symTex = cell._sprite ? cell._sprite.texture : null;
        if (symTex && symTex !== PIXI.Texture.WHITE) {
          const symSprite = new PIXI.Sprite(symTex);
          symSprite.anchor.set(0.5);
          symSprite.x = cx;
          symSprite.y = cy;
          const scale = Math.min(S / symTex.width, S / symTex.height);
          symSprite.scale.set(scale);
          symSprite.zIndex = 40;
          this.container.addChild(symSprite);
          this._winSpines.push(symSprite);
        }
      }
    });
  }

  /** Stop the win presentation loop and clean up all overlays. */
  _stopWinLoop() {
    this._winLoopActive = false;
    this._winLoopCounter++;
    this._stopWinAnimations();
    if (this._paylines) {
      this._paylines.clearAll();
    }
  }

  /** Remove all active win Spine overlays & win-bg sprites from the container. */
  _stopWinAnimations() {
    if (this._darkFrameG) {
      this._darkFrameG.visible = false;
    }

    if (this._winSpines && this._winSpines.length) {
      this._winSpines.forEach(s => {
        try {
          if (!s.destroyed) s.destroy({ children: true });
        } catch (_) { }
      });
      this._winSpines = [];
    }

    // Restore static sprite visibility on all symbol cells
    for (let r = 0; r < GameConfig.REELS; r++) {
      for (let row = 0; row < GameConfig.ROWS; row++) {
        this._symbolGrid[r]?.[row]?.setStaticVisible(true);
      }
    }
  }

  // ── Private ────────────────────────────────────────────────

  updateLayout(isPortrait = false) {
    this._isPortrait = isPortrait;
  }

  _buildReels() {
    const S = GameConfig.SYMBOL_SIZE;
    const G = GameConfig.REEL_GAP;

    for (let i = 0; i < GameConfig.REELS; i++) {
      const reel = new Reel(i, this._getTexture.bind(this));
      reel.on('symbolClick', (symbolId, reelIndex, rowIndex) => {
        if (!this._spinning) {
          const S = GameConfig.SYMBOL_SIZE;
          const G = GameConfig.REEL_GAP;
          const isPortrait = !!this._isPortrait;
          const gridX = GameConfig.getGridX ? GameConfig.getGridX(isPortrait) : (isPortrait ? 95 : 375);
          const gridY = GameConfig.getGridY ? GameConfig.getGridY(isPortrait) : (isPortrait ? 340 : 135);
          const targetX = gridX + (GameConfig.getReelX ? GameConfig.getReelX(reelIndex) : reelIndex * (S + G)) + S * 0.5;
          const targetY = gridY + (GameConfig.REEL_Y_OFFSET ?? 0) + rowIndex * S + S * 0.5;
          this.emit('symbolClick', symbolId, reelIndex, rowIndex, { x: targetX, y: targetY });
        }
      });
      reel.container.zIndex = 10;
      this._reels.push(reel);
      this.container.addChild(reel.container);

      this._symbolGrid[i] = [];

      for (let row = 0; row < GameConfig.ROWS; row++) {
        const randId = ALL_SYMBOL_IDS[MathUtils.weightedRandom(SYMBOL_WEIGHTS)];
        const sym = new SlotSymbol(
          randId,
          this._getTexture(randId, false),
          this._getSpineData
        );
        sym.on('symbolClick', (symbolId) => {
          if (!this._spinning) {
            this.emit('symbolClick', symbolId);
          }
        });
        sym.x = GameConfig.getReelX ? GameConfig.getReelX(i) : i * (S + G);
        sym.y = row * S + (GameConfig.REEL_Y_OFFSET ?? 0);
        this._symbolGrid[i][row] = sym;
      }

      reel.on('reelStopped', (idx, symbols) => {
        symbols.forEach((id, row) => {
          const cell = this._symbolGrid[idx][row];
          const tex = this._getTexture(id, false);
          cell.setSymbol(id, tex);  // setSymbol also calls stopWinAnimation
        });
        this.emit('reelStopped', idx, symbols);
      });
    }
  }

  _buildBackground() {
    this.container.sortableChildren = true;
    const S = GameConfig.SYMBOL_SIZE;
    const gridW = GameConfig.getReelX ? GameConfig.getReelX(2) + S : 515; // 515px
    const gridH = GameConfig.ROWS * S; // 390px

    const frameTex = this._getUITexture ? this._getUITexture('reels_frame') : null;
    if (frameTex && frameTex !== PIXI.Texture.WHITE) {
      const frameSprite = new PIXI.Sprite(frameTex);
      frameSprite.anchor.set(0.5);
      frameSprite.x = gridW / 2;
      frameSprite.y = gridH / 2;
      // Frame size tailored with slightly increased width
      frameSprite.width = 730;
      frameSprite.height = 540;
      frameSprite.zIndex = 0;
      this.container.addChild(frameSprite);

      // Top grass decoration overlay on top edge of the reel frame (decreased size)
      const grassTex = this._getUITexture ? this._getUITexture('top_grass') : null;
      if (grassTex && grassTex !== PIXI.Texture.WHITE) {
        const grassSprite = new PIXI.Sprite(grassTex);
        grassSprite.anchor.set(0.5, 0.5);
        grassSprite.x = gridW / 2;
        grassSprite.y = -35;
        grassSprite.width = 300;
        grassSprite.height = 90;
        grassSprite.zIndex = 50;
        this.container.addChild(grassSprite);
      }
    } else {
      const g = new PIXI.Graphics();
      g.beginFill(0x06001A, 0.4);
      g.drawRoundedRect(-25, -25, gridW + 50, gridH + 50, 16);
      g.endFill();
      g.zIndex = 0;
      this.container.addChild(g);
    }

    // Yellow glowing floating bugs near topgrass.webp moving upwards
    this._buildTopGrassLightningBugs(gridW);

    // ── Black semi-transparent reel overlay (BEHIND win-bg.png_80_80.webp and symbols) ──
    const yOff = GameConfig.REEL_Y_OFFSET ?? 0;
    const overW = GameConfig.DARK_OVERLAY_WIDTH ?? 640;
    const overH = GameConfig.DARK_OVERLAY_HEIGHT ?? 410;
    const overAlpha = GameConfig.DARK_OVERLAY_ALPHA ?? 0.40;
    const overRad = GameConfig.DARK_OVERLAY_RADIUS ?? 16;
    const overXOff = GameConfig.DARK_OVERLAY_X_OFFSET ?? -18;

    this._darkFrameG = new PIXI.Graphics();
    this._darkFrameG.beginFill(0x000000, overAlpha);
    this._darkFrameG.drawRoundedRect((gridW / 2) - (overW / 2) + overXOff, yOff + (gridH / 2) - (overH / 2), overW, overH, overRad);
    this._darkFrameG.endFill();
    this._darkFrameG.visible = false;
    this._darkFrameG.zIndex = 20;

    this.container.addChild(this._darkFrameG);
  }

  _buildTopGrassLightningBugs(gridW) {
    this._topBugsContainer = new PIXI.Container();
    this._topBugsContainer.zIndex = 60;
    try {
      const blur = new PIXI.filters.BlurFilter(1.5);
      this._topBugsContainer.filters = [blur];
    } catch (e) { }

    this.container.addChild(this._topBugsContainer);

    this._topBugs = [];
    const count = 11;
    const frameWidth = 680;

    for (let i = 0; i < count; i++) {
      const bug = new PIXI.Graphics();
      const r = 3.2 + Math.random() * 2.0;

      bug.beginFill(0xFFDD00, 1.0);
      bug.drawCircle(0, 0, r);
      bug.endFill();

      const startX = (gridW / 2) + (Math.random() - 0.5) * frameWidth;
      const startY = -35 + (Math.random() - 0.5) * 35;

      bug.x = startX;
      bug.y = startY;

      this._topBugsContainer.addChild(bug);

      this._topBugs.push({
        sprite: bug,
        baseX: startX,
        baseY: startY,
        vx: (Math.random() - 0.5) * 0.14, // Left / right drift
        vy: -0.05 - Math.random() * 0.10,  // Super slow upward drift
        phase: Math.random() * Math.PI * 2,
        speed: 0.004 + Math.random() * 0.006, // Gentle slow speed
        radiusX: 12 + Math.random() * 16,
        radiusY: 8 + Math.random() * 12,
        gridW: gridW,
        frameWidth: frameWidth,
      });
    }
  }

  _onTick(delta) {
    this._reels.forEach(r => r.update(delta));
    if (this._topBugs) {
      this._topBugs.forEach(b => {
        b.phase += b.speed;
        b.baseX += b.vx;
        b.baseY += b.vy;
        b.sprite.x = b.baseX + Math.sin(b.phase) * b.radiusX;
        b.sprite.y = b.baseY + Math.cos(b.phase * 0.7) * b.radiusY;
        b.sprite.alpha = 0.85 + 0.15 * Math.sin(b.phase * 1.5);

        // Respawn when drifted out of top area bounds
        if (b.baseY < -95 || Math.abs(b.baseX - (b.gridW / 2)) > 360) {
          b.baseX = (b.gridW / 2) + (Math.random() - 0.5) * b.frameWidth;
          b.baseY = -20 + (Math.random() - 0.5) * 30;
          b.sprite.x = b.baseX;
          b.sprite.y = b.baseY;
        }
      });
    }
  }
}
