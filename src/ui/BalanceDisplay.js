import * as PIXI from 'pixi.js';
import { MathUtils } from '../utils/MathUtils.js';

/**
 * BalanceDisplay – Shows the player's balance ("Balance 1,000.00 FUN").
 */
export class BalanceDisplay extends PIXI.Container {
  constructor() {
    super();
    this._balance = 0;
    this._isPortrait = false;
    this._buildUI();
  }

  set balance(v) {
    this._balance = v;
    this._updateTextDisplay();
  }

  get balance() { return this._balance; }

  _buildUI() {
    // 1. Single-line text for Landscape mode (EXACT original landscape text)
    this._valueText = new PIXI.Text('Balance 0.00 FUN', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: 14,
      fill: 0xFFFFFF,
      fontWeight: '500',
    });
    this._valueText.anchor.set(0, 0.5);
    this._valueText.x = 0;
    this._valueText.y = 0;
    this.addChild(this._valueText);

    // 2. Separate label for Portrait mode
    this._lbl = new PIXI.Text('Balance', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: 13,
      fill: 0xCCCCCC,
      fontWeight: '500',
    });
    this._lbl.x = 0;
    this._lbl.y = -120;
    this._lbl.visible = false;
    this.addChild(this._lbl);

    // 3. Separate amount text for Portrait mode
    this._portraitAmtText = new PIXI.Text('0.00 FUN', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: 16,
      fill: 0xFFFFFF,
      fontWeight: 'bold',
    });
    this._portraitAmtText.x = 0;
    this._portraitAmtText.y = -100;
    this._portraitAmtText.visible = false;
    this.addChild(this._portraitAmtText);
  }

  _updateTextDisplay() {
    const formatted = `${MathUtils.formatMoney(this._balance)} FUN`;
    if (this._valueText) {
      this._valueText.text = `Balance ${formatted}`;
    }
    if (this._portraitAmtText) {
      this._portraitAmtText.text = formatted;
    }
  }

  updateLayout(isPortrait) {
    this._isPortrait = isPortrait;
    if (isPortrait) {
      // Portrait mode: show split label & amount at y = -105 and y = -78 with larger fonts
      if (this._lbl) {
        this._lbl.style.fontSize = 22;
        this._lbl.y = -132;
        this._lbl.visible = true;
      }
      if (this._portraitAmtText) {
        this._portraitAmtText.style.fontSize = 28;
        this._portraitAmtText.y = -105;
        this._portraitAmtText.visible = true;
      }
      if (this._valueText) this._valueText.visible = false;
    } else {
      // Landscape mode: EXACT original single-line display ("Balance 1,000.00 FUN")
      if (this._valueText) this._valueText.visible = true;
      if (this._lbl) this._lbl.visible = false;
      if (this._portraitAmtText) this._portraitAmtText.visible = false;
    }
  }
}
