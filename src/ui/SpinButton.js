import * as PIXI from 'pixi.js';
import { AnimationUtils } from '../utils/AnimationUtils.js';

/**
 * SpinButton – Official Gift Rush spin button using image assets.
 * Uses spinbutton.png (normal), spindisable.png (disabled/spinning), and spinhover.png (hover).
 */
export class SpinButton extends PIXI.Container {
  /**
   * @param {Function} onSpin   Called when player initiates a spin
   * @param {Function} onStop   Called when player wants to force-stop
   * @param {Function} [getUITexture] (name) => PIXI.Texture
   */
  /**
   * @param {Function} onSpin   Called when player initiates a spin
   * @param {Function} onStop   Called when player wants to force-stop
   * @param {Function} [getUITexture] (name) => PIXI.Texture
   * @param {Function} [onHoldStart] Called when player holds button down
   * @param {Function} [onHoldEnd]   Called when player releases button
   */
  constructor(onSpin, onStop, getUITexture, onHoldStart, onHoldEnd) {
    super();

    this._onSpin = onSpin;
    this._onStop = onStop;
    this._getUITexture = getUITexture;
    this._onHoldStart = onHoldStart;
    this._onHoldEnd = onHoldEnd;
    this._state = 'idle';   // 'idle' | 'spinning'
    this._disabled = false;
    this._hovered = false;
    this._isHolding = false;
    this._holdTimer = null;
    this._isPortrait = false;
    this._isModalOpen = false;

    this._buildButton();
    this._setupInteraction();
    this.scale.set(0.5);
  }

  setSpinning(spinning) {
    this._state = spinning ? 'spinning' : 'idle';
    this._updateVisuals();
  }

  setEnabled(enabled) {
    this._disabled = !enabled;
    this.interactive = enabled;
    this.cursor = enabled ? 'pointer' : 'default';
    this._updateVisuals();
  }

  setModalOpenState(isOpen) {
    this._isModalOpen = isOpen;
    this._updateVisuals();
  }

  updateLayout(isPortrait, isModalOpen) {
    this._isPortrait = isPortrait;
    if (isModalOpen !== undefined) this._isModalOpen = isModalOpen;
    this.scale.set(isPortrait ? 0.68 : 0.5);
    this._updateVisuals();
  }

  _buildButton() {
    this._texNormal = this._getUITexture ? this._getUITexture('spin_btn') : null;
    this._texDisabled = this._getUITexture ? this._getUITexture('spin_btn_disabled') : null;
    this._texHover = this._getUITexture ? this._getUITexture('spin_btn_hover') : null;
    this._texBg = this._getUITexture ? this._getUITexture('spin_btn_bg') : null;

    if (this._texBg && this._texBg !== PIXI.Texture.WHITE) {
      this._bgSprite = new PIXI.Sprite(this._texBg);
      this._bgSprite.anchor.set(0.5);
      this._bgSprite.visible = false;
      this.addChildAt(this._bgSprite, 0);
    }

    if (this._texNormal && this._texNormal !== PIXI.Texture.WHITE) {
      this._sprite = new PIXI.Sprite(this._texNormal);
      this._sprite.anchor.set(0.5);
      this.addChild(this._sprite);
    } else {
      // Fallback graphics
      this._body = new PIXI.Graphics();
      this.addChild(this._body);
      this._icon = new PIXI.Text('↻', { fontFamily: 'Outfit, sans-serif', fontSize: 32, fill: 0xFFFFFF });
      this._icon.anchor.set(0.5);
      this.addChild(this._icon);
    }

    this._updateVisuals();
  }

  _updateVisuals() {
    if (this._bgSprite) {
      this._bgSprite.visible = !!(this._isPortrait && this._isModalOpen);
    }

    if (this._sprite) {
      if (this._isPortrait) {
        const texNormal = this._getUITexture ? this._getUITexture('spin_btn_portrait') : null;
        const texDisabled = this._getUITexture ? (this._getUITexture('spin_btn_portrait_disabled') || this._getUITexture('spin_btn_portrait')) : null;

        if (this._disabled || this._state === 'spinning') {
          this._sprite.texture = texDisabled || this._texDisabled || this._texNormal;
        } else {
          this._sprite.texture = texNormal || this._texNormal;
        }
      } else {
        if (this._disabled || this._state === 'spinning') {
          this._sprite.texture = this._texDisabled || this._texNormal;
        } else if (this._hovered) {
          this._sprite.texture = this._texHover || this._texNormal;
        } else {
          this._sprite.texture = this._texNormal;
        }
      }
    } else if (this._body) {
      this._body.clear();
      this._body.beginFill(this._disabled ? 0x555555 : (this._hovered ? 0x880011 : 0x5E000A));
      this._body.drawCircle(0, 0, 28);
      this._body.endFill();
    }
  }

  _setupInteraction() {
    this.interactive = true;
    this.cursor = 'pointer';
    this._hasHoldStarted = false;

    const startHold = () => {
      if (this._disabled) return;
      AnimationUtils.bounce(this, 0.1, 200);

      if (this._state === 'spinning') {
        this._onStop?.();
      } else {
        this._onSpin?.();
      }

      this._isHolding = true;
      this._hasHoldStarted = false;
      clearTimeout(this._holdTimer);

      // Only trigger hold spin after holding for 500ms
      this._holdTimer = setTimeout(() => {
        if (this._isHolding) {
          this._hasHoldStarted = true;
          this._onHoldStart?.();
        }
      }, 500);
    };

    const endHold = () => {
      clearTimeout(this._holdTimer);
      this._isHolding = false;

      if (this._hasHoldStarted) {
        this._hasHoldStarted = false;
        this._onHoldEnd?.();
      }
    };

    this.on('pointerdown', startHold);
    this.on('pointerup', endHold);
    this.on('pointerupoutside', endHold);
    this.on('pointercancel', endHold);

    this.on('pointerover', () => {
      if (!this._disabled && this._state !== 'spinning') {
        this._hovered = true;
        this._updateVisuals();
      }
    });
    this.on('pointerout', () => {
      this._hovered = false;
      endHold();
      this._updateVisuals();
    });
  }
}
