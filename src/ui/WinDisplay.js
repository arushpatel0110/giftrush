import * as PIXI from 'pixi.js';
import { MathUtils } from '../utils/MathUtils.js';
import { AnimationUtils } from '../utils/AnimationUtils.js';

/**
 * WinDisplay – Shows the current spin win amount with a count-up animation.
 */
export class WinDisplay extends PIXI.Container {
  constructor() {
    super();
    this._buildUI();
  }

  /** Animate counting up to `amount` from 0. */
  async showWin(amount) {
    this._winText.alpha = 1;
    this._label.text    = 'WIN';
    await AnimationUtils.countUp(0, amount, 900, v => {
      this._winText.text = `$${MathUtils.formatMoney(v)}`;
    });
    await AnimationUtils.bounce(this, 0.12, 350);
  }

  /** Reset to idle (no win). */
  reset() {
    this._winText.text  = '$0.00';
    this._label.text    = 'WIN';
  }

  _buildUI() {
    const lbl = new PIXI.Text('WIN', {
      fontFamily: 'Outfit', fontSize: 11, fill: 0xAA88BB,
      fontWeight: '600', letterSpacing: 2,
    });
    lbl.anchor.set(0.5, 1); lbl.x = 70; lbl.y = -4;
    this._label = lbl;
    this.addChild(lbl);

    const bg = new PIXI.Graphics();
    bg.beginFill(0x0A0020).lineStyle(1, 0x00AA44, 0.8)
      .drawRoundedRect(0, 0, 140, 34, 6).endFill();
    this.addChild(bg);

    this._winText = new PIXI.Text('$0.00', {
      fontFamily: 'Outfit', fontSize: 17, fill: 0x44FF88, fontWeight: '700',
    });
    this._winText.anchor.set(0.5); this._winText.x = 70; this._winText.y = 17;
    this.addChild(this._winText);
  }
}
