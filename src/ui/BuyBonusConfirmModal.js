import * as PIXI from 'pixi.js';
import { GameConfig } from '../config/GameConfig.js';
import { AnimationUtils } from '../utils/AnimationUtils.js';

/**
 * BuyBonusConfirmModal – Confirmation popup before purchasing the Buy Bonus feature.
 * Matches BGaming Gift Rush visual style with pink wreath frame, backdrop glow, and Yes/No buttons.
 */
export class BuyBonusConfirmModal extends PIXI.Container {
  /**
   * @param {object} options
   *   onConfirm  - callback when user clicks "Yes"
   *   onCancel   - callback when user clicks "No" or closes overlay
   *   getTexture - asset loader callback
   */
  constructor(options = {}) {
    super();
    this._onConfirm = options.onConfirm;
    this._onCancel = options.onCancel;
    this._onShow = options.onShow;
    this._onClose = options.onClose;
    this._getTexture = options.getTexture;

    this.visible = false;
    this.zIndex = 9990;
    this._buildUI();
  }

  updateLayout(isPortrait = false) {
    const W = isPortrait ? GameConfig.PORTRAIT_WIDTH : GameConfig.WIDTH;
    const H = isPortrait ? GameConfig.PORTRAIT_HEIGHT : GameConfig.HEIGHT;
    if (this._popupContainer) {
      this._popupContainer.x = W / 2;
      this._popupContainer.y = H / 2;
    }
    if (this._overlay) {
      this._overlay.clear();
      this._overlay.beginFill(0x000000, 0.75);
      this._overlay.drawRect(-W * 3, -H * 3, W * 7, H * 7);
      this._overlay.endFill();
    }
  }

  show(cost) {
    if (this._costText) {
      const numCost = typeof cost === 'number' ? cost : 0;
      this._costText.text = `${numCost.toFixed(2)} FUN`;
    }

    // Increment generation so any in-flight hide() promise becomes stale.
    this._showGen = (this._showGen || 0) + 1;

    this._justOpened = true;
    setTimeout(() => { this._justOpened = false; }, 150);

    this.visible = true;
    this._popupContainer.scale.set(1);
    this._popupContainer.alpha = 1;
    AnimationUtils.bounce(this._popupContainer, 0.06, 300);
    this._onShow?.();
  }

  hide() {
    // If already hidden, do nothing – prevents stale async timers from double-hide.
    if (!this.visible) return;
    const gen = this._showGen || 0;
    this._onClose?.();
    AnimationUtils.fadeTo(this._popupContainer, 0, 200).then(() => {
      // Only apply if no show() was called after this hide() started.
      if ((this._showGen || 0) === gen) {
        this.visible = false;
        this._popupContainer.alpha = 1;
      }
    });
  }

  _buildUI() {
    const W = GameConfig.WIDTH;
    const H = GameConfig.HEIGHT;

    // ── 1. Full Screen Semi-transparent Dark Backdrop Overlay ────
    const overlay = new PIXI.Graphics();
    overlay.beginFill(0x000000, 0.75);
    overlay.drawRect(-W * 2, -H * 2, W * 5, H * 5);
    overlay.endFill();
    overlay.interactive = true;
    overlay.buttonMode = false;
    const interceptNo = (e) => {
      e.stopPropagation();
      if (this._justOpened) return;
      this._handleNo();
    };
    overlay.on('pointerdown', interceptNo);
    overlay.on('pointerup', (e) => e.stopPropagation());
    overlay.on('click', (e) => e.stopPropagation());
    overlay.on('tap', (e) => e.stopPropagation());
    this._overlay = overlay;
    this.addChild(overlay);

    // ── 2. Popup Center Container ────────────────────────────────
    this._popupContainer = new PIXI.Container();
    this._popupContainer.x = W / 2;
    this._popupContainer.y = H / 2;
    this.addChild(this._popupContainer);

    // ── 2a. Background Radial Blue Aura Glow ──────────────────────
    const auraGlow = new PIXI.Graphics();
    auraGlow.beginFill(0x0088FF, 0.5);
    auraGlow.drawEllipse(0, 0, 240, 170);
    auraGlow.endFill();
    try {
      auraGlow.filters = [new PIXI.filters.BlurFilter(32)];
      auraGlow.blendMode = PIXI.BLEND_MODES.ADD;
    } catch (e) {}
    this._popupContainer.addChild(auraGlow);

    const bgGlowTex = this._getTexture ? this._getTexture('bg_buy_bonus_confirm_popup') : null;
    if (bgGlowTex && bgGlowTex !== PIXI.Texture.WHITE) {
      const bgGlow = new PIXI.Sprite(bgGlowTex);
      bgGlow.anchor.set(0.5);
      bgGlow.scale.set(5.45);
      this._popupContainer.addChild(bgGlow);
    }

    // ── 2b. Main Pink Wreath Frame ────────────────────────────────
    const popupTex = this._getTexture ? this._getTexture('buy_bonus_confirm_popup') : null;
    if (popupTex && popupTex !== PIXI.Texture.WHITE) {
      const popupBg = new PIXI.Sprite(popupTex);
      popupBg.anchor.set(0.5);
      popupBg.scale.set(0.65);
      this._popupContainer.addChild(popupBg);
    } else {
      // Fallback procedural frame if asset is missing
      const frame = new PIXI.Graphics();
      frame.beginFill(0xE6007E).lineStyle(6, 0x00CC44)
        .drawRoundedRect(-170, -120, 340, 240, 24).endFill();
      this._popupContainer.addChild(frame);
    }

    // ── 2c. Blue Glow Bugs Particle Overlay around Popup ───────────
    this._buildBlueGlowBugs();

    // ── 3. Content Text Elements ──────────────────────────────────
    const titleStyle = {
      fontFamily: 'Magnolia Script, Magnolia-Script, cursive',
      fontSize: 54,
      fill: '#FFEA00', // Pure yellow
      fontWeight: 'normal',
      align: 'center',
      padding: 20,
      dropShadow: true,
      dropShadowColor: '#330000',
      dropShadowBlur: 4,
      dropShadowDistance: 2,
    };

    const buyText = new PIXI.Text('Buy', titleStyle);
    buyText.anchor.set(0.5);
    buyText.y = -146;
    this._popupContainer.addChild(buyText);

    const bonusText = new PIXI.Text('Bonus Game', titleStyle);
    bonusText.anchor.set(0.5);
    bonusText.y = -82;
    this._popupContainer.addChild(bonusText);

    // Cost Value Text
    this._costText = new PIXI.Text('0.00 FUN', {
      fontFamily: 'Magnolia Script, Magnolia-Script, cursive',
      fontSize: 36,
      fill: '#FFFFFF', // Pure white
      fontWeight: 'normal',
      align: 'center',
      padding: 20,
      dropShadow: true,
      dropShadowColor: '#000000',
      dropShadowBlur: 4,
      dropShadowDistance: 2,
    });
    this._costText.anchor.set(0.5);
    this._costText.y = -5; // Increased gap from Bonus Game text
    this._popupContainer.addChild(this._costText);

    // ── 4. Action Buttons (No / Yes) ──────────────────────────────
    const buttonY = 95; // Shifted down

    // ── 4a. "No" Button ──────────────────────────────────────────
    const noTex = this._getTexture ? this._getTexture('no_buy_bonus') : null;
    const noHovTex = this._getTexture ? this._getTexture('no_buy_bonus_hover') : null;

    const noContainer = new PIXI.Container();
    noContainer.x = -118; // Moved farther left
    noContainer.y = buttonY;
    noContainer.interactive = true;
    noContainer.buttonMode = true;

    let noSprite = null;
    if (noTex && noTex !== PIXI.Texture.WHITE) {
      noSprite = new PIXI.Sprite(noTex);
      noSprite.anchor.set(0.5);
      noSprite.scale.set(0.58);
      noContainer.addChild(noSprite);
    } else {
      const btnG = new PIXI.Graphics();
      btnG.beginFill(0xFF1A3D).lineStyle(3, 0xFFEA00)
        .drawRoundedRect(-50, -18, 100, 36, 18).endFill();
      noContainer.addChild(btnG);
    }

    const noText = new PIXI.Text('No', {
      fontFamily: 'Magnolia Script, Magnolia-Script, cursive',
      fontSize: 28, // Increased size
      fill: '#FFFFFF',
      fontWeight: 'normal',
      dropShadow: true,
      dropShadowColor: '#880000',
      dropShadowBlur: 3,
      dropShadowDistance: 1,
    });
    noText.anchor.set(0.5);
    noContainer.addChild(noText);

    noContainer.on('pointerover', () => {
      noContainer.scale.set(1.08);
      if (noSprite && noHovTex && noHovTex !== PIXI.Texture.WHITE) noSprite.texture = noHovTex;
    });
    noContainer.on('pointerout', () => {
      noContainer.scale.set(1.0);
      if (noSprite && noTex && noTex !== PIXI.Texture.WHITE) noSprite.texture = noTex;
    });
    noContainer.on('pointerdown', (e) => {
      e.stopPropagation();
      this._handleNo();
    });

    this._popupContainer.addChild(noContainer);

    // ── 4b. "Yes" Button ─────────────────────────────────────────
    const yesTex = this._getTexture ? this._getTexture('yes_buy_bonus') : null;
    const yesHovTex = this._getTexture ? this._getTexture('yes_buy_bonus_hover') : null;

    const yesContainer = new PIXI.Container();
    yesContainer.x = 118; // Moved farther right
    yesContainer.y = buttonY;
    yesContainer.interactive = true;
    yesContainer.buttonMode = true;

    let yesSprite = null;
    if (yesTex && yesTex !== PIXI.Texture.WHITE) {
      yesSprite = new PIXI.Sprite(yesTex);
      yesSprite.anchor.set(0.5);
      yesSprite.scale.set(0.58);
      yesContainer.addChild(yesSprite);
    } else {
      const btnG = new PIXI.Graphics();
      btnG.beginFill(0x00CC33).lineStyle(3, 0xFFEA00)
        .drawRoundedRect(-50, -18, 100, 36, 18).endFill();
      yesContainer.addChild(btnG);
    }

    const yesText = new PIXI.Text('Yes', {
      fontFamily: 'Magnolia Script, Magnolia-Script, cursive',
      fontSize: 28, // Increased size
      fill: '#FFFFFF',
      fontWeight: 'normal',
      dropShadow: true,
      dropShadowColor: '#005500',
      dropShadowBlur: 3,
      dropShadowDistance: 1,
    });
    yesText.anchor.set(0.5);
    yesContainer.addChild(yesText);

    yesContainer.on('pointerover', () => {
      yesContainer.scale.set(1.08);
      if (yesSprite && yesHovTex && yesHovTex !== PIXI.Texture.WHITE) yesSprite.texture = yesHovTex;
    });
    yesContainer.on('pointerout', () => {
      yesContainer.scale.set(1.0);
      if (yesSprite && yesTex && yesTex !== PIXI.Texture.WHITE) yesSprite.texture = yesTex;
    });
    yesContainer.on('pointerdown', (e) => {
      e.stopPropagation();
      this._handleYes();
    });

    this._popupContainer.addChild(yesContainer);
  }

  _handleNo() {
    this.hide();
    this._onCancel?.();
  }

  _handleYes() {
    this.hide();
    this._onConfirm?.();
  }

  _buildBlueGlowBugs() {
    this._blueBugsContainer = new PIXI.Container();

    // Add particle container ON TOP of bgGlow and popupBg so bugs are fully visible across background
    this._popupContainer.addChild(this._blueBugsContainer);

    const blueTex = this._getTexture ? this._getTexture('blue_glow_bug') : null;
    this._blueBugs = [];
    const count = 55; // Optimized particle count for 60 FPS performance without lag

    for (let i = 0; i < count; i++) {
      let bug;
      if (blueTex && blueTex !== PIXI.Texture.WHITE) {
        bug = new PIXI.Sprite(blueTex);
        bug.anchor.set(0.5);
        bug.tint = 0x00E5FF; // Bright glowing cyan-blue tint
      } else {
        bug = new PIXI.Graphics();
        const r = 2.5 + Math.random() * 3.5;
        bug.beginFill(0x00E5FF, 1.0);
        bug.drawCircle(0, 0, r);
        bug.endFill();
      }

      try {
        bug.blendMode = PIXI.BLEND_MODES.ADD; // Luminous additive glow bloom
      } catch (e) {}

      // Distribute particles outward around border perimeter ring (Rx ~ 320, Ry ~ 220), keeping middle clear
      const angle = Math.random() * Math.PI * 2;
      const distRatio = 0.84 + Math.random() * 0.42; // Outward perimeter distribution
      const startX = Math.cos(angle) * (320 * distRatio);
      const startY = Math.sin(angle) * (220 * distRatio);

      const baseScale = 0.32 + Math.random() * 0.40;
      bug.scale.set(baseScale);
      bug.x = startX;
      bug.y = startY;

      this._blueBugsContainer.addChild(bug);

      this._blueBugs.push({
        sprite: bug,
        angle: angle,
        distRatio: distRatio,
        baseScale: baseScale,
        baseX: startX,
        baseY: startY,
        vx: (Math.random() - 0.5) * 0.45, // Dynamic faster horizontal speed
        vy: (Math.random() - 0.5) * 0.45, // Dynamic faster vertical speed
        phase: Math.random() * Math.PI * 2,
        speed: 0.016 + Math.random() * 0.020, // Faster smooth floating motion
        radiusX: 14 + Math.random() * 18,
        radiusY: 10 + Math.random() * 14,
      });
    }

    this._bugsTickHandler = () => {
      if (!this.visible || !this._blueBugs) return;
      this._blueBugs.forEach(b => {
        b.phase += b.speed;
        b.baseX += b.vx;
        b.baseY += b.vy;

        b.sprite.x = b.baseX + Math.sin(b.phase) * b.radiusX;
        b.sprite.y = b.baseY + Math.cos(b.phase * 0.8) * b.radiusY;

        // Smooth glowing pulse & scale animation
        const pulse = Math.sin(b.phase * 1.8);
        b.sprite.alpha = 0.75 + 0.25 * pulse;
        const scaleMod = b.baseScale * (1 + 0.20 * pulse);
        b.sprite.scale.set(scaleMod);

        // Respawn if drifted into middle or too far past outer border
        const dist = Math.hypot(b.baseX / 320, b.baseY / 220);
        if (dist > 1.35 || dist < 0.72) {
          const newAngle = Math.random() * Math.PI * 2;
          const newRatio = 0.84 + Math.random() * 0.42;
          b.baseX = Math.cos(newAngle) * (320 * newRatio);
          b.baseY = Math.sin(newAngle) * (220 * newRatio);
          b.sprite.x = b.baseX;
          b.sprite.y = b.baseY;
        }
      });
    };
    PIXI.Ticker.shared.add(this._bugsTickHandler);
  }

  destroy(options) {
    if (this._bugsTickHandler) {
      PIXI.Ticker.shared.remove(this._bugsTickHandler);
      this._bugsTickHandler = null;
    }
    super.destroy(options);
  }
}
