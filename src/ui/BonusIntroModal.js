import * as PIXI from 'pixi.js';
import { Spine } from 'pixi-spine';
import { GameConfig } from '../config/GameConfig.js';
import { AnimationUtils } from '../utils/AnimationUtils.js';

/**
 * BonusIntroModal – Popup presented when a Bonus Game is won.
 * Plays the Spine animation `bonus_game_pop_up` with `popup-open` & `popup-close`
 * and displays stylized cursive text matching Gift Rush visual theme.
 */
export class BonusIntroModal extends PIXI.Container {
  /**
   * @param {object} options
   *   getSpineData - callback to retrieve cached Spine data
   *   getTexture   - callback to retrieve cached UI textures
   */
  constructor(options = {}) {
    super();
    this._getSpineData = options.getSpineData;
    this._getTexture = options.getTexture;

    this.visible = false;
    this.zIndex = 9995;
    this._resolveContinue = null;
    this._pulseTicker = null;

    this._buildUI();
  }

  updateLayout(isPortrait = false) {
    const W = isPortrait ? GameConfig.PORTRAIT_WIDTH : GameConfig.WIDTH;
    const H = isPortrait ? GameConfig.PORTRAIT_HEIGHT : GameConfig.HEIGHT;
    if (this._popupContainer) {
      this._popupContainer.x = W / 2;
      this._popupContainer.y = H / 2;
    }
    if (this._backdrop) {
      this._backdrop.clear();
      this._backdrop.beginFill(0x000000, 0.75);
      this._backdrop.drawRect(-W * 3, -H * 3, W * 7, H * 7);
      this._backdrop.endFill();
    }
  }

  /**
   * Shows the popup, plays `popup-open`, and returns a Promise that resolves when the user clicks continue.
   * @returns {Promise<void>}
   */
  /**
   * Shows the popup, plays `popup-open`, and returns a Promise that resolves when the user clicks continue.
   * @returns {Promise<void>}
   */
  show() {
    return new Promise((resolve) => {
      this._resolveContinue = resolve;
      this.visible = true;
      this.alpha = 1;

      // Hide bgshine sprite & blue glow bugs container initially so they only appear after animation completes
      if (this._bgShineSprite) {
        this._bgShineSprite.visible = false;
        this._bgShineSprite.alpha = 0;
      }
      if (this._blueBugsContainer) {
        this._blueBugsContainer.visible = false;
        this._blueBugsContainer.alpha = 0;
      }

      const showShine = () => {
        if (this._bgShineSprite && this.visible) {
          this._bgShineSprite.visible = true;
          AnimationUtils.fadeTo(this._bgShineSprite, 0.85, 300);
        }
        if (this._blueBugsContainer && this.visible) {
          this._blueBugsContainer.visible = true;
          AnimationUtils.fadeTo(this._blueBugsContainer, 1.0, 300);
        }
      };

      if (this._spine && this._spine.state) {
        try {
          this._spine.state.clearListeners();
          this._spine.state.setAnimation(0, 'popup-open', false);
          this._spine.state.timeScale = 1.2;
          
          // Listen for completion of popup-open animation
          this._spine.state.addListener({
            complete: (entry) => {
              if (entry && entry.animation && entry.animation.name === 'popup-open') {
                showShine();
              }
            }
          });
          
          // Fallback timer in case completion listener doesn't trigger
          setTimeout(() => {
            if (this.visible && this._bgShineSprite && !this._bgShineSprite.visible) {
              showShine();
            }
          }, 450);
        } catch (err) {
          console.warn('Error playing Spine popup-open animation:', err);
          showShine();
        }
      } else {
        showShine();
      }

      this._startPulse();
    });
  }

  _handleContinue() {
    if (!this.visible) return;
    this._stopPulse();

    if (this._bgShineSprite) {
      AnimationUtils.fadeTo(this._bgShineSprite, 0, 180);
    }
    if (this._blueBugsContainer) {
      AnimationUtils.fadeTo(this._blueBugsContainer, 0, 180);
    }

    const finish = () => {
      this.visible = false;
      if (this._resolveContinue) {
        const resolve = this._resolveContinue;
        this._resolveContinue = null;
        resolve();
      }
    };

    if (this._spine && this._spine.state) {
      try {
        this._spine.state.clearListeners();
        this._spine.state.setAnimation(0, 'popup-close', false);
        this._spine.state.timeScale = 1.4;
        this._spine.state.addListener({
          complete: (entry) => {
            if (entry && entry.animation && entry.animation.name === 'popup-close') {
              finish();
            }
          }
        });
        // Fallback timer in case Spine listener misses event
        setTimeout(finish, 400);
      } catch (err) {
        console.warn('Error playing Spine popup-close animation:', err);
        finish();
      }
    } else {
      finish();
    }
  }

  _startPulse() {
    this._stopPulse();
    let time = 0;
    this._pulseTicker = (delta) => {
      time += 0.05 * delta;
      if (this._clickPrompt) {
        const scaleVal = 1 + Math.sin(time * 3) * 0.06;
        this._clickPrompt.scale.set(scaleVal);
        this._clickPrompt.alpha = 0.85 + Math.sin(time * 3) * 0.15;
      }
    };
    PIXI.Ticker.shared.add(this._pulseTicker);
  }

  _stopPulse() {
    if (this._pulseTicker) {
      PIXI.Ticker.shared.remove(this._pulseTicker);
      this._pulseTicker = null;
    }
  }

  _buildUI() {
    const W = GameConfig.WIDTH;
    const H = GameConfig.HEIGHT;

    // ── 1. Fullscreen Dark Backdrop ─────────────────────────────
    const backdrop = new PIXI.Graphics();
    backdrop.beginFill(0x000000, 0.75);
    backdrop.drawRect(-W * 2, -H * 2, W * 5, H * 5);
    backdrop.endFill();
    backdrop.interactive = true;
    backdrop.buttonMode = true;
    backdrop.cursor = 'pointer';
    const intercept = (e) => {
      e.stopPropagation();
      this._handleContinue();
    };
    backdrop.on('pointerdown', intercept);
    backdrop.on('pointerup', (e) => e.stopPropagation());
    backdrop.on('click', (e) => e.stopPropagation());
    backdrop.on('tap', (e) => e.stopPropagation());
    this._backdrop = backdrop;
    this.addChild(backdrop);

    // ── 2. Popup Content Container ───────────────────────────────
    this._popupContainer = new PIXI.Container();
    this._popupContainer.sortableChildren = true;
    this._popupContainer.x = W / 2;
    this._popupContainer.y = H / 2;
    this.addChild(this._popupContainer);

    const content = this._popupContainer;

    // ── 3. Background Shine (bgshine.webp) - Initially hidden ─────
    const bgShineTex = this._getTexture ? this._getTexture('bg_shine') : null;
    if (bgShineTex && bgShineTex !== PIXI.Texture.WHITE) {
      this._bgShineSprite = new PIXI.Sprite(bgShineTex);
      this._bgShineSprite.anchor.set(0.5);
      this._bgShineSprite.scale.set(0.63);
      this._bgShineSprite.x = -25;
      this._bgShineSprite.y = -43;
      this._bgShineSprite.visible = false;
      this._bgShineSprite.alpha = 0;
      this._bgShineSprite.zIndex = 1;
      content.addChild(this._bgShineSprite);
    }

    // ── 3b. Blue Glow Bugs Particle Overlay around Popup ───────────
    this._buildBlueGlowBugs();

    // ── 4. Spine Animation (bonus_game_pop_up) ───────────────────
    const spineData = this._getSpineData ? this._getSpineData('bonus_game_pop_up') : null;
    if (spineData) {
      try {
        this._spine = new Spine(spineData);
        this._spine.scale.set(0.64, 0.72);
        this._spine.x = 0;
        this._spine.y = 30;
        this._spine.zIndex = 5;
        content.addChild(this._spine);
      } catch (err) {
        console.warn('Could not instantiate Spine bonus_game_pop_up:', err);
        this._spine = null;
      }
    }

    // ── 5. Stylized Cursive Texts & Ribbon Overlay ───────────────

    // Title: "Congratulations!"
    const congratsText = new PIXI.Text('Congratulations!', {
      fontFamily: 'Magnolia Script, Magnolia-Script, cursive',
      fontSize: 58,
      fill: 0xFFFFFF,
      fontWeight: 'normal',
      padding: 30,
      dropShadow: true,
      dropShadowColor: 0xFF00AA,
      dropShadowBlur: 12,
      dropShadowDistance: 0,
    });
    congratsText.anchor.set(0.5);
    congratsText.y = -305;
    congratsText.zIndex = 10;
    content.addChild(congratsText);

    // Subtitle: "You have won"
    const wonText = new PIXI.Text('You have won', {
      fontFamily: 'Magnolia Script, Magnolia-Script, cursive',
      fontSize: 46,
      fill: 0xFFFFFF,
      fontWeight: 'normal',
      padding: 30,
      dropShadow: true,
      dropShadowColor: 0xFF00AA,
      dropShadowBlur: 10,
      dropShadowDistance: 0,
    });
    wonText.anchor.set(0.5);
    wonText.y = -238;
    wonText.zIndex = 10;
    content.addChild(wonText);

    // Ribbon Background Image (ribbon.webp) behind Bonus Game Text
    const ribbonTex = this._getTexture ? this._getTexture('ribbon') : null;
    if (ribbonTex && ribbonTex !== PIXI.Texture.WHITE) {
      this._ribbonSprite = new PIXI.Sprite(ribbonTex);
      this._ribbonSprite.anchor.set(0.5);
      this._ribbonSprite.y = 139;
      this._ribbonSprite.scale.set(0.66, 0.50); // Reduced ribbon size to fit proportion
      this._ribbonSprite.zIndex = 15;
      content.addChild(this._ribbonSprite);
    }

    // Banner Text: "Bonus Game" sitting directly on the ribbon
    const bonusGameText = new PIXI.Text('Bonus Game', {
      fontFamily: 'Magnolia Script, Magnolia-Script, cursive',
      fontSize: 64,
      fill: 0xFFEA00,
      fontWeight: 'normal',
      padding: 30,
      dropShadow: true,
      dropShadowColor: 0x220022,
      dropShadowBlur: 6,
      dropShadowDistance: 2,
    });
    bonusGameText.anchor.set(0.5);
    bonusGameText.y = 139;
    bonusGameText.zIndex = 20;
    content.addChild(bonusGameText);

    // Bottom Prompt: "click to continue"
    this._clickPrompt = new PIXI.Text('click to continue', {
      fontFamily: 'Magnolia Script, Magnolia-Script, cursive',
      fontSize: 36,
      fill: 0xFFFFFF,
      fontWeight: 'normal',
      padding: 30,
      dropShadow: true,
      dropShadowColor: 0x00AADD,
      dropShadowBlur: 8,
      dropShadowDistance: 0,
    });
    this._clickPrompt.anchor.set(0.5);
    this._clickPrompt.y = 279;
    this._clickPrompt.zIndex = 25;
    content.addChild(this._clickPrompt);
  }

  _buildBlueGlowBugs() {
    this._blueBugsContainer = new PIXI.Container();
    this._blueBugsContainer.zIndex = 2; // In front of bgshine (zIndex 1), behind Spine animation (zIndex 5)
    this._popupContainer.addChild(this._blueBugsContainer);

    const blueTex = this._getTexture ? this._getTexture('blue_glow_bug') : null;
    this._blueBugs = [];
    const count = 80;

    // Center coordinates adjusted slightly down for balanced coverage
    const cx = -25;
    const cy = 20;
    const rx = 380; // Balanced horizontal width area to cover bgshine.webp
    const ry = 240;

    for (let i = 0; i < count; i++) {
      let bug;
      if (blueTex && blueTex !== PIXI.Texture.WHITE) {
        bug = new PIXI.Sprite(blueTex);
        bug.anchor.set(0.5);
        bug.tint = 0x00E5FF;
      } else {
        bug = new PIXI.Graphics();
        const r = 2.5 + Math.random() * 3.5;
        bug.beginFill(0x00E5FF, 1.0);
        bug.drawCircle(0, 0, r);
        bug.endFill();
      }

      try {
        bug.blendMode = PIXI.BLEND_MODES.ADD;
      } catch (e) {}

      const angle = Math.random() * Math.PI * 2;
      const distRatio = 0.15 + Math.random() * 0.85;
      const startX = cx + Math.cos(angle) * (rx * distRatio);
      const startY = cy + Math.sin(angle) * (ry * distRatio);

      const baseScale = 0.30 + Math.random() * 0.40;
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
        vx: (Math.random() - 0.5) * 0.40,
        vy: (Math.random() - 0.5) * 0.40,
        phase: Math.random() * Math.PI * 2,
        speed: 0.016 + Math.random() * 0.020,
        floatRadiusX: 12 + Math.random() * 16,
        floatRadiusY: 10 + Math.random() * 14,
      });
    }

    this._bugsTickHandler = () => {
      if (!this.visible || !this._blueBugsContainer?.visible || !this._blueBugs) return;
      this._blueBugs.forEach(b => {
        b.phase += b.speed;
        b.baseX += b.vx;
        b.baseY += b.vy;

        b.sprite.x = b.baseX + Math.sin(b.phase) * b.floatRadiusX;
        b.sprite.y = b.baseY + Math.cos(b.phase * 0.8) * b.floatRadiusY;

        const pulse = Math.sin(b.phase * 1.8);
        b.sprite.alpha = 0.70 + 0.30 * pulse;
        const scaleMod = b.baseScale * (1 + 0.18 * pulse);
        b.sprite.scale.set(scaleMod);

        const dist = Math.hypot((b.baseX - cx) / rx, (b.baseY - cy) / ry);
        if (dist > 1.15) {
          const newAngle = Math.random() * Math.PI * 2;
          const newRatio = 0.15 + Math.random() * 0.85;
          b.baseX = cx + Math.cos(newAngle) * (rx * newRatio);
          b.baseY = cy + Math.sin(newAngle) * (ry * newRatio);
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
