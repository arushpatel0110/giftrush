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

      // Hide bgshine sprite initially so it only appears after animation completes
      if (this._bgShineSprite) {
        this._bgShineSprite.visible = false;
        this._bgShineSprite.alpha = 0;
      }

      const showShine = () => {
        if (this._bgShineSprite && this.visible) {
          this._bgShineSprite.visible = true;
          AnimationUtils.fadeTo(this._bgShineSprite, 0.85, 300);
        }
      };

      if (this._spine && this._spine.state) {
        try {
          this._spine.state.clearListeners();
          this._spine.state.setAnimation(0, 'popup-open', false);
          
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
          }, 600);
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
      AnimationUtils.fadeTo(this._bgShineSprite, 0, 200);
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
        this._spine.state.addListener({
          complete: (entry) => {
            if (entry && entry.animation && entry.animation.name === 'popup-close') {
              finish();
            }
          }
        });
        // Fallback timer in case Spine listener misses event
        setTimeout(finish, 700);
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
    backdrop.drawRect(-W, -H, W * 3, H * 3);
    backdrop.endFill();
    backdrop.interactive = true;
    backdrop.buttonMode = true;
    backdrop.cursor = 'pointer';
    backdrop.on('pointerdown', (e) => {
      e.stopPropagation();
      this._handleContinue();
    });
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

    // ── 4. Spine Animation (bonus_game_pop_up) ───────────────────
    const spineData = this._getSpineData ? this._getSpineData('bonus_game_pop_up') : null;
    if (spineData) {
      try {
        this._spine = new Spine(spineData);
        this._spine.scale.set(0.64, 0.72);
        this._spine.x = 0;
        this._spine.y = 30;
        this._spine.zIndex = 2;
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
}
