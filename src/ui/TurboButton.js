import * as PIXI from 'pixi.js';
import { GameConfig } from '../config/GameConfig.js';
import { AnimationUtils } from '../utils/AnimationUtils.js';

/**
 * TurboButton – Toggles turbo (fast spin) mode.
 */
export class TurboButton extends PIXI.Container {
  constructor(onToggle) {
    super();
    this._onToggle = onToggle;
    this._active   = false;
    this._buildUI();
  }

  get active() { return this._active; }

  _buildUI() {
    this._bg = new PIXI.Graphics();
    this._draw();
    this.addChild(this._bg);

    const icon = new PIXI.Text('⚡', { fontSize: 18 });
    icon.anchor.set(0, 0.5); icon.x = 10; icon.y = 21;
    this.addChild(icon);

    this._lbl = new PIXI.Text('TURBO', {
      fontFamily: 'Outfit', fontSize: 12, fill: 0xFFCC00, fontWeight: '700', letterSpacing: 1,
    });
    this._lbl.anchor.set(0, 0.5); this._lbl.x = 34; this._lbl.y = 21;
    this.addChild(this._lbl);

    this.interactive = true; this.buttonMode = true; this.cursor = 'pointer';
    this.on('pointerdown', () => {
      this._active = !this._active;
      this._draw();
      AnimationUtils.bounce(this, 0.08, 150);
      this._onToggle?.(this._active);
    });
    this.on('pointerover', () => { this._bg.tint = 0xFFEE88; });
    this.on('pointerout',  () => { this._bg.tint = 0xFFFFFF; });
  }

  _draw() {
    this._bg.clear();
    const col = this._active ? 0x553300 : 0x221100;
    const brd = this._active ? 0xFFCC00 : 0x886600;
    this._bg.beginFill(col).lineStyle(1.5, brd, 0.9)
      .drawRoundedRect(0, 0, 90, 42, 8).endFill();
  }
}
