import * as PIXI from 'pixi.js';
import { AnimationUtils } from '../utils/AnimationUtils.js';

export class MuteButton extends PIXI.Container {
  constructor(onToggle, getUITexture) {
    super();
    this._onToggle = onToggle;
    this._getUITexture = getUITexture;
    this._muted = false;
    this._buildUI();
  }

  _buildUI() {
    this._texOn = this._getUITexture ? this._getUITexture('sound_on') : null;
    this._texOff = this._getUITexture ? this._getUITexture('sound_off') : null;

    if (this._texOn && this._texOn !== PIXI.Texture.WHITE) {
      this._sprite = new PIXI.Sprite(this._texOn);
      this._sprite.anchor.set(0.5);
      this.addChild(this._sprite);
    } else {
      this._icon = new PIXI.Text('🔊', { fontSize: 20 });
      this._icon.anchor.set(0.5);
      this.addChild(this._icon);
    }

    this.interactive = true;
    this.cursor = 'pointer';
    this.on('pointerdown', () => {
      this._muted = !this._muted;
      this._updateTexture();
      AnimationUtils.bounce(this, 0.1, 150);
      this._onToggle?.(this._muted);
    });
  }

  _updateTexture() {
    if (this._sprite) {
      this._sprite.texture = this._muted ? (this._texOff || this._texOn) : this._texOn;
    } else if (this._icon) {
      this._icon.text = this._muted ? '🔇' : '🔊';
    }
  }
}
