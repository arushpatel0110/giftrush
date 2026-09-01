import * as PIXI from 'pixi.js';
import { AnimationUtils } from '../utils/AnimationUtils.js';

/**
 * AutoplayPanel – Gift Rush autoplay button using image assets.
 * Uses autospinbutton.png (normal), autospinhover.png (hover), and autospindisable.png (disabled).
 */
export class AutoplayPanel extends PIXI.Container {
  /**
   * @param {Function} onStart  (count) → void
   * @param {Function} onStop   () → void
   * @param {Function} [getUITexture] (name) => PIXI.Texture
   * @param {Function} [onOpenSettings] () => void
   */
  constructor(onStart, onStop, getUITexture, onOpenSettings) {
    super();
    this._onStart = onStart;
    this._onStop = onStop;
    this._getUITexture = getUITexture;
    this._onOpenSettings = onOpenSettings;
    this._active = false;
    this._disabled = false;
    this._hovered = false;
    this._remaining = 0;
    this._isPortrait = false;

    this._buildUI();
    this.scale.set(0.5);
  }

  updateLayout(isPortrait) {
    this._isPortrait = isPortrait;
    this.scale.set(isPortrait ? 1.0 : 0.5);
    this._updateState();
  }

  get isActive() { return this._active; }

  startAutoplay(count) {
    this._active = true;
    this._remaining = count;
    this._updateState();
  }

  decrementSpins() {
    if (!this._active) return;
    if (this._remaining >= 9999) {
      if (this._countText) this._countText.text = '∞';
      return;
    }
    this._remaining = Math.max(0, this._remaining - 1);
    if (this._countText) this._countText.text = `${this._remaining}`;
    if (this._remaining === 0) this._stopAutoplay();
  }

  stopAutoplay(notify = true) {
    this._active = false;
    this._remaining = 0;
    this._updateState();
    if (notify) this._onStop?.();
  }

  _stopAutoplay() {
    this.stopAutoplay(true);
  }

  setEnabled(enabled) {
    this._disabled = !enabled;
    this.interactive = enabled;
    this.cursor = enabled ? 'pointer' : 'default';
    this._updateState();
  }

  _buildUI() {
    this._texNormal = this._getUITexture ? this._getUITexture('auto_spin_btn') : null;
    this._texDisabled = this._getUITexture ? this._getUITexture('auto_spin_disabled') : null;
    this._texHover = this._getUITexture ? this._getUITexture('auto_spin_hover') : null;
    this._texStopNormal = this._getUITexture ? this._getUITexture('auto_spin_stop_btn') : null;
    this._texStopHover = this._getUITexture ? this._getUITexture('auto_spin_stop_hover') : null;

    if (this._texNormal && this._texNormal !== PIXI.Texture.WHITE) {
      this._sprite = new PIXI.Sprite(this._texNormal);
      this._sprite.anchor.set(0.5);
      this.addChild(this._sprite);

      // Remaining spins text overlay when autoplaying
      this._countText = new PIXI.Text('', {
        fontFamily: 'Outfit, sans-serif',
        fontSize: 32,
        fill: 0xFFFFFF,
        fontWeight: 'bold',
        stroke: 0x000000,
        strokeThickness: 4,
      });
      this._countText.anchor.set(0.5);
      this._countText.y = -35; // Positioned at y = -35
      this.addChild(this._countText);
    } else {
      // Fallback graphics
      this._radius = 22;
      this._body = new PIXI.Graphics();
      this._body.beginFill(0x5E000A);
      this._body.drawCircle(0, 0, this._radius);
      this._body.endFill();
      this.addChild(this._body);

      this._countText = new PIXI.Text('A', {
        fontFamily: 'Outfit, sans-serif',
        fontSize: 24,
        fill: 0xFFFFFF,
        fontWeight: 'bold',
      });
      this._countText.anchor.set(0.5);
      this._countText.y = -35;
      this.addChild(this._countText);
    }

    this.interactive = true;
    this.cursor = 'pointer';

    this.on('pointerdown', (e) => {
      e.stopPropagation();
      if (this._disabled) return;
      AnimationUtils.bounce(this, 0.08, 150);
      if (this._active) {
        this._stopAutoplay();
      } else if (this._onOpenSettings) {
        this._onOpenSettings();
      } else {
        this._onStart?.(10);
      }
    });

    this.on('pointerover', () => {
      if (!this._disabled) {
        this._hovered = true;
        this._updateState();
      }
    });
    this.on('pointerout', () => {
      this._hovered = false;
      this._updateState();
    });

    this._updateState();
  }

  _updateState() {
    const isInfinity = this._remaining >= 9999;

    if (this._sprite) {
      if (this._isPortrait) {
        const texNormal = this._getUITexture ? this._getUITexture('auto_spin_btn_portrait') : null;
        const texDisabled = this._getUITexture ? (this._getUITexture('auto_spin_btn_portrait_disabled') || this._getUITexture('auto_spin_btn_portrait')) : null;

        if (this._disabled) {
          this._sprite.texture = texDisabled || this._texDisabled || this._texNormal;
        } else if (this._active) {
          this._sprite.texture = this._hovered
            ? (this._texStopHover || this._texStopNormal || this._texHover || this._texNormal)
            : (this._texStopNormal || this._texNormal);
        } else {
          this._sprite.texture = texNormal || this._texNormal;
        }
        this._sprite.width = 82;
        this._sprite.height = 82;
      } else {
        this._sprite.scale.set(1.0);
        if (this._disabled) {
          this._sprite.texture = this._texDisabled || this._texNormal;
        } else if (this._active) {
          this._sprite.texture = this._hovered
            ? (this._texStopHover || this._texStopNormal || this._texHover || this._texNormal)
            : (this._texStopNormal || this._texNormal);
        } else if (this._hovered) {
          this._sprite.texture = this._texHover || this._texNormal;
        } else {
          this._sprite.texture = this._texNormal;
        }
      }

      if (this._active && this._remaining > 0) {
        this._countText.text = isInfinity ? '∞' : `${this._remaining}`;
        this._countText.style.fontSize = isInfinity ? 56 : 32;
      } else {
        this._countText.text = '';
      }
    } else if (this._body) {
      this._body.clear();
      this._body.beginFill(this._disabled ? 0x555555 : (this._active ? 0x990011 : 0x5E000A));
      this._body.drawCircle(0, 0, 22);
      this._body.endFill();

      this._countText.text = this._active ? (isInfinity ? '∞' : `${this._remaining}`) : 'A';
      this._countText.style.fontSize = this._active && isInfinity ? 48 : 24;
    }
  }
}
