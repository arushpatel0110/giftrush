import * as PIXI from 'pixi.js';
import { AnimationUtils } from '../utils/AnimationUtils.js';

export class SettingsButton extends PIXI.Container {
  constructor(onClick, getUITexture) {
    super();
    this._onClick = onClick;
    this._getUITexture = getUITexture;
    this._isHovered = false;
    this._isPressed = false;
    this._disabled = false;
    this._isPortrait = false;
    this._buildUI();
    this.scale.set(0.6);
  }

  setEnabled(enabled) {
    this._disabled = !enabled;
    this.interactive = enabled;
    this.cursor = enabled ? 'pointer' : 'default';
    this._updateTexture();
  }

  updateLayout(isPortrait) {
    this._isPortrait = isPortrait;
    this.scale.set(isPortrait ? 1.0 : 0.6);
    this._updateTexture();
  }

  _buildUI() {
    this._texNormal = this._getUITexture ? this._getUITexture('setting_btn') : null;
    this._texClick  = this._getUITexture ? this._getUITexture('setting_click') : null;
    this._texHover  = this._getUITexture ? this._getUITexture('setting_hover') : null;

    if (this._texNormal && this._texNormal !== PIXI.Texture.WHITE) {
      this._sprite = new PIXI.Sprite(this._texNormal);
      this._sprite.anchor.set(0.5);
      this.addChild(this._sprite);
    } else {
      this._text = new PIXI.Text('⚙', { fontSize: 16, fill: 0xFFFFFF });
      this._text.anchor.set(0.5);
      this.addChild(this._text);
    }

    this.interactive = true;
    this.cursor = 'pointer';

    this.on('pointerdown', () => {
      this._isPressed = true;
      this._updateTexture();
      AnimationUtils.bounce(this, 0.1, 150);
      this._onClick?.();
    });

    this.on('pointerup', () => {
      this._isPressed = false;
      this._updateTexture();
    });

    this.on('pointerupoutside', () => {
      this._isPressed = false;
      this._updateTexture();
    });

    this.on('pointerover', () => {
      this._isHovered = true;
      this._updateTexture();
    });

    this.on('pointerout', () => {
      this._isHovered = false;
      this._isPressed = false;
      this._updateTexture();
    });
  }

  _updateTexture() {
    if (this._sprite) {
      if (this._isPortrait) {
        const texNormal = this._getUITexture ? this._getUITexture('settings_btn_portrait') : null;
        const texDisabled = this._getUITexture ? (this._getUITexture('settings_btn_portrait_disabled') || this._getUITexture('settings_btn_portrait')) : null;

        if (this._disabled || this._isPressed) {
          this._sprite.texture = texDisabled || this._texClick || this._texNormal;
        } else {
          this._sprite.texture = texNormal || this._texNormal;
        }
        this._sprite.width = 82;
        this._sprite.height = 82;
      } else {
        this._sprite.scale.set(1.0);
        if (this._disabled) {
          this._sprite.texture = this._texNormal;
        } else if (this._isPressed && this._texClick) {
          this._sprite.texture = this._texClick;
        } else if (this._isHovered && this._texHover) {
          this._sprite.texture = this._texHover;
        } else {
          this._sprite.texture = this._texNormal;
        }
      }
    }
  }
}
