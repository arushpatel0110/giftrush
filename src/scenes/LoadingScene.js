import * as PIXI from 'pixi.js';
import { GameConfig } from '../config/GameConfig.js';
import { AnimationUtils } from '../utils/AnimationUtils.js';

/**
 * LoadingScene – Displayed while assets are generated.
 * Shows an animated progress bar with a festive theme.
 */
export class LoadingScene {
  constructor() {
    this.container = new PIXI.Container();
    this._buildUI();
  }

  start() { this.container.visible = true; }
  stop()  { this.container.visible = false; }

  /** Update progress bar 0–100. */
  setProgress(pct) {
    const w = Math.floor((pct / 100) * 400);
    this._bar.clear();
    this._bar.beginFill(0xFF0000);
    this._bar.drawRoundedRect(0, 0, w * 0.5, 10, 5);
    this._bar.endFill();
    this._bar.beginFill(0xFFD700);
    this._bar.drawRoundedRect(w * 0.5, 0, w * 0.5, 10, 5);
    this._bar.endFill();
    this._pctText.text = `${Math.floor(pct)}%`;
  }

  _buildUI() {
    const W = GameConfig.WIDTH;
    const H = GameConfig.HEIGHT;

    // Pure Black Background
    const bg = new PIXI.Graphics();
    bg.beginFill(0x000000).drawRect(0, 0, W, H).endFill();
    this.container.addChild(bg);

    // Stars
    for (let i = 0; i < 60; i++) {
      const s = new PIXI.Graphics();
      const r = 0.5 + Math.random() * 1.5;
      s.beginFill(0xFFFFFF, 0.3 + Math.random() * 0.5).drawCircle(0, 0, r).endFill();
      s.x = Math.random() * W; s.y = Math.random() * H * 0.7;
      this.container.addChild(s);
    }

    // Christmas trees (procedural)
    [-340, -140, 140, 340].forEach(ox => {
      const tree = this._makeTree(W / 2 + ox, H * 0.75);
      this.container.addChild(tree);
    });

    // Title
    const title = new PIXI.Text('🎄 GIFT RUSH 🎄', {
      fontFamily: 'Cinzel Decorative, Outfit, serif',
      fontSize: 52, fill: 0xFFD700,
      stroke: 0xFF0044, strokeThickness: 3,
      dropShadow: true, dropShadowColor: 0xFF0000,
      dropShadowBlur: 20, dropShadowDistance: 0,
    });
    title.anchor.set(0.5); title.x = W / 2; title.y = H * 0.28;
    this.container.addChild(title);

    const sub = new PIXI.Text('by BGaming', {
      fontFamily: 'Outfit', fontSize: 18, fill: 0xCCAADD, fontStyle: 'italic',
    });
    sub.anchor.set(0.5); sub.x = W / 2; sub.y = H * 0.28 + 56;
    this.container.addChild(sub);

    // Progress bar track
    const track = new PIXI.Graphics();
    track.beginFill(0x220033).lineStyle(1, 0x440055, 0.8)
      .drawRoundedRect(W / 2 - 200, H * 0.82, 400, 10, 5).endFill();
    this.container.addChild(track);

    // Progress bar fill
    this._bar = new PIXI.Graphics();
    this._bar.x = W / 2 - 200; this._bar.y = H * 0.82;
    this.container.addChild(this._bar);

    // Percentage text
    this._pctText = new PIXI.Text('0%', {
      fontFamily: 'Outfit', fontSize: 14, fill: 0xCCAADD, fontWeight: '600',
    });
    this._pctText.anchor.set(0.5); this._pctText.x = W / 2; this._pctText.y = H * 0.82 + 20;
    this.container.addChild(this._pctText);

    const loading = new PIXI.Text('Loading festive assets…', {
      fontFamily: 'Outfit', fontSize: 16, fill: 0x9977AA,
    });
    loading.anchor.set(0.5); loading.x = W / 2; loading.y = H * 0.82 - 22;
    this.container.addChild(loading);

    this.setProgress(0);
    this._animateTitle(title);
  }

  _makeTree(x, y) {
    const g = new PIXI.Graphics();
    // Trunk
    g.beginFill(0x8B4513).drawRect(x - 8, y, 16, 30).endFill();
    // Three tiers
    [[60, 0], [80, -40], [55, -80]].forEach(([w, dy]) => {
      g.beginFill(0x1a6620).drawPolygon([
        x, y + dy - w * 0.8, x - w / 2, y + dy, x + w / 2, y + dy
      ]).endFill();
    });
    // Star on top
    g.beginFill(0xFFD700).drawCircle(x, y - 80 - 46, 8).endFill();
    // Decorative lights
    [[0.2, 0.7], [0.6, 0.5], [0.8, 0.8], [0.4, 0.3]].forEach(([rx, ry]) => {
      const lx = x + (rx - 0.5) * 50;
      const ly = y - 20 + ry * -60;
      g.beginFill([0xFF0000, 0x00FF44, 0xFFD700, 0x0088FF][Math.floor(Math.random() * 4)])
        .drawCircle(lx, ly, 3).endFill();
    });
    return g;
  }

  _animateTitle(title) {
    let t = 0;
    const tick = () => {
      if (!this.container.parent && !this.container.visible) return;
      t += 0.02;
      title.scale.set(1 + Math.sin(t) * 0.02);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
}
