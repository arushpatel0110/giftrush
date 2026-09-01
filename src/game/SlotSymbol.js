import * as PIXI from 'pixi.js';
import { GameConfig } from '../config/GameConfig.js';
import { AnimationUtils } from '../utils/AnimationUtils.js';
import { Spine } from 'pixi-spine';
import { SYMBOL_IDS } from '../config/SymbolConfig.js';

/**
 * Maps each symbol ID to its spine animation key in the AssetLoader spine data map.
 * Note: asset file names in symbol_spines don't match the symbol display names.
 *   glove → sym_mitten, cane → sym_stick, bread → sym_cookie, bonus → sym_elf
 */
const SYMBOL_SPINE_KEYS = {
  [SYMBOL_IDS.SEVEN]:       'sym_seven',
  [SYMBOL_IDS.STAR]:        'sym_star',
  [SYMBOL_IDS.BELL]:        'sym_bells',
  [SYMBOL_IDS.MITTEN]:      'sym_mitten',   // glove → mitten spine
  [SYMBOL_IDS.ORNAMENT]:    'sym_ball',
  [SYMBOL_IDS.GINGERBREAD]: 'sym_cookie',   // bread → cookie spine
  [SYMBOL_IDS.CANDY_CANE]:  'sym_stick',    // cane → stick spine
  [SYMBOL_IDS.SANTA_HAT]:   'sym_hat',
  [SYMBOL_IDS.BONUS]:       'sym_elf',      // bonus → elf spine
};

/**
 * SlotSymbol – A single symbol cell displayed inside a reel.
 * Wraps a PIXI.Sprite and provides highlight / win animations,
 * including a Spine animation overlay that plays on win paylines.
 */
export class SlotSymbol extends PIXI.Container {
  /**
   * @param {number}       symbolId
   * @param {PIXI.Texture} texture
   * @param {Function}     [getSpineData]  (key: string) => SpineData | null
   */
  constructor(symbolId, texture, getSpineData = null) {
    super();
    this._symbolId    = symbolId;
    this._sprite      = null;
    this._glowFilter  = null;
    this._highlighted = false;
    this._getSpineData = getSpineData;
    this._winSpine    = null;  // active Spine overlay instance

    this._buildSprite(texture);

    const S = GameConfig.SYMBOL_SIZE;
    this.eventMode = 'static';
    this.interactive = true;
    this.cursor = 'pointer';
    this.hitArea = new PIXI.Rectangle(0, 0, S, S);

    this.on('pointerdown', (e) => {
      e.stopPropagation();
      this.emit('symbolClick', this._symbolId);
    });
  }

  get symbolId()      { return this._symbolId; }
  get isHighlighted() { return this._highlighted; }

  /** Replace the symbol shown in this cell. */
  setSymbol(symbolId, texture) {
    this._symbolId = symbolId;
    this.stopWinAnimation(); // clean up any running spine from previous symbol
    if (this._sprite && texture) {
      this._sprite.texture = texture;
      this._sprite.visible = true;
      this._fitSprite(texture);
    }
    this.clearHighlight();
  }

  /** Control static sprite visibility. */
  setStaticVisible(visible) {
    if (this._sprite) {
      this._sprite.visible = visible;
    }
  }

  /** Flash the cell with the payline colour, then dim it. */
  async highlight(color) {
    this._highlighted = true;
    this._applyGlow(color);
    await AnimationUtils.bounce(this, 0.12, 350);
  }

  /** Return the cell to its normal appearance. */
  clearHighlight() {
    this._highlighted = false;
    this.filters = [];
  }

  /** Dim the cell (non-winning cells during win presentation). */
  dimCell() {
    this.alpha = 0.35;
  }

  /** Restore full opacity. */
  undim() {
    this.alpha = 1;
  }

  /**
   * Play the symbol's Spine win animation overlay.
   * Hides the static sprite and shows the Spine animation on top.
   * @param {string} [animName] Override animation name; defaults to 'animation'.
   * @param {boolean} [loop]   Whether to loop the animation. Default true.
   */
  playWinAnimation(animName = null, loop = true) {
    if (!this._getSpineData) return;

    // Clean up any existing win spine first
    this.stopWinAnimation();

    const spineKey = SYMBOL_SPINE_KEYS[this._symbolId];
    if (!spineKey) return;

    const spineData = this._getSpineData(spineKey);
    if (!spineData) return;

    try {
      const spine = new Spine(spineData);

      // Figure out a valid animation name from available animations
      const available = spine.spineData?.animations?.map(a => a.name) ?? [];
      const chosenAnim = animName && available.includes(animName)
        ? animName
        : (available[0] ?? 'animation');

      // Scale and center the Spine to fit within the symbol cell
      const S = GameConfig.SYMBOL_SIZE;
      // Use the skeleton bounding box if available, else fallback
      const skelW = spineData.width  || 200;
      const skelH = spineData.height || 200;
      const spineScale = Math.min(S / skelW, S / skelH) * 1.1;
      spine.scale.set(spineScale);

      // Center within the cell
      spine.x = S * 0.5;
      spine.y = S * 0.5 + (skelH * spineScale * 0.5);

      // Play animation
      spine.state.setAnimation(0, chosenAnim, loop);

      // Hide static sprite while spine plays
      this._sprite.visible = false;

      this.addChild(spine);
      this._winSpine = spine;
    } catch (err) {
      console.warn(`SlotSymbol: could not play win animation for symbol ${this._symbolId}:`, err);
    }
  }

  /**
   * Stop and remove the Spine win animation overlay, restoring the static sprite.
   */
  stopWinAnimation() {
    if (this._winSpine) {
      try {
        this._winSpine.destroy({ children: true });
      } catch (_) {}
      this._winSpine = null;
    }
    if (this._sprite) {
      this._sprite.visible = true;
    }
  }

  // ── Private ────────────────────────────────────────────────

  _buildSprite(texture) {
    this._sprite = new PIXI.Sprite(texture);
    this._sprite.eventMode = 'static';
    this._sprite.interactive = true;
    this._sprite.cursor = 'pointer';
    this._sprite.on('pointerdown', (e) => {
      e.stopPropagation();
      this.emit('symbolClick', this._symbolId);
    });
    this._fitSprite(texture);
    this.addChild(this._sprite);
  }

  _fitSprite(texture) {
    if (!texture || !texture.width) return;
    const S = GameConfig.SYMBOL_SIZE;
    const scale = Math.min(S / texture.width, S / texture.height);
    this._sprite.scale.set(scale);
    this._sprite.x = Math.round((S - this._sprite.width) / 2);
    this._sprite.y = Math.round((S - this._sprite.height) / 2);
  }

  /** Set vertical motion blur intensity during spin. */
  setMotionBlur(blurY) {
    if (blurY > 0.5) {
      if (!this._motionFilter) {
        this._motionFilter = new PIXI.BlurFilter();
        this._motionFilter.blurX = 0;
        this._motionFilter.quality = 1;
      }
      this._motionFilter.blurY = blurY;
      this.filters = [this._motionFilter];
    } else {
      if (!this._highlighted) {
        this.filters = [];
      }
    }
  }

  _applyGlow(color) {
    // Use a ColorMatrix to tint the whole container
    const cm = new PIXI.ColorMatrixFilter();
    this.filters = [cm];
    // Animate tint pulse
    let t = 0;
    const tick = () => {
      if (!this._highlighted) return;
      t += 0.08;
      const intensity = (Math.sin(t) * 0.5 + 0.5) * 0.4 + 0.6;
      cm.brightness(intensity, false);
      requestAnimationFrame(tick);
    };
    tick();
  }
}
