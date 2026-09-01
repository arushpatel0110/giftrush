import * as PIXI from 'pixi.js';
import { Spine } from 'pixi-spine';
import { EventEmitter } from '../utils/EventEmitter.js';
import { GameConfig } from '../config/GameConfig.js';
import { RNGEngine } from '../game/RNGEngine.js';
import { GiftPicker } from './GiftPicker.js';
import { AnimationUtils } from '../utils/AnimationUtils.js';
import { MathUtils } from '../utils/MathUtils.js';

/**
 * BonusGame – Controls the full bonus-pick flow.
 *
 * Flow:
 *   1. Overlay slides in with festive animation
 *   2. Player sees 5 wrapped gifts
 *   3. Player clicks one → multiplier revealed
 *   4. All others flip to show their hidden values
 *   5. Win credited; overlay slides out
 *
 * Events:
 *   'bonusComplete'  (multiplier, winAmount)
 */
export class BonusGame extends EventEmitter {
  /**
   * @param {PIXI.Container} parentStage
   * @param {AudioManager}   audio
   * @param {Function}       getTexture
   */
  constructor(parentStage, audio, getTexture = null, getSpineData = null, getCoinTextures = null) {
    super();
    this._parentStage = parentStage;
    this._audio = audio;
    this._getTexture = getTexture;
    this._getSpineData = getSpineData;
    this._getCoinTextures = getCoinTextures;
    this._rng = new RNGEngine();
    this._active = false;

    this.container = new PIXI.Container();
    this.container.zIndex = 50;
    this.container.alpha = 0;
    this.container.visible = false;
    parentStage.addChild(this.container);
  }

  /**
   * Show the bonus game screen and wait for the player to pick.
   * @param {number} bet  Current bet (multiplier applied to this)
   * @returns {Promise<{multiplier:number, winAmount:number}>}
   */
  async play(bet) {
    if (this._active) return { multiplier: 0, winAmount: 0 };
    this._active = true;

    const multipliers = this._rng.generateGiftMultipliers();

    this._buildUI();
    this.container.visible = true;
    await AnimationUtils.fadeTo(this.container, 1, 400);

    this._audio.playBonus();

    // Show intro text briefly
    await AnimationUtils.wait(600);

    // Player picks a gift
    const chosenIdx = await this._giftPicker.waitForPick();
    const multiplier = multipliers[chosenIdx];

    this._audio.playGiftPick();
    await AnimationUtils.wait(200);

    // Reveal all other gifts
    await this._giftPicker.revealAll(multipliers, chosenIdx);
    await AnimationUtils.wait(1200);

    const winAmount = parseFloat((multiplier * bet).toFixed(2));

    // Play bigwin_intro.ogg sound when showing amount, multiplier, and coin celebration!
    this._audio?.playBigWinIntro();

    // Big win celebration with wins_pop_up Spine animation based on picked gift!
    const chosenGiftNum = this._giftPicker ? this._giftPicker.getGiftNum(chosenIdx) : 1;
    await this._showWinCelebration(multiplier, winAmount, chosenGiftNum);
    await AnimationUtils.wait(500); // Short hold after celebration & coins end

    // Play bigwin_end.ogg sound right before returning back to the main spin page!
    this._audio?.playBigWinEnd();
    await AnimationUtils.wait(1200);

    // Fade out
    await AnimationUtils.fadeTo(this.container, 0, 500);
    this.container.visible = false;
    this._destroyUI();
    this._active = false;

    this.emit('bonusComplete', multiplier, winAmount);
    return { multiplier, winAmount };
  }

  destroy() {
    this._destroyUI();
    this.container.destroy({ children: true });
  }

  // ── Private ────────────────────────────────────────────────

  _buildUI() {
    const isPortrait = window.innerHeight > window.innerWidth;
    const W = isPortrait ? GameConfig.PORTRAIT_WIDTH : GameConfig.WIDTH;
    const H = isPortrait ? GameConfig.PORTRAIT_HEIGHT : GameConfig.HEIGHT;

    // Bonus background (bonusbg.webp)
    const bgTex = this._getTexture ? (this._getTexture('bonus_bg') || this._getTexture('bg_portrait') || this._getTexture('bg_landscape')) : null;
    if (bgTex && bgTex !== PIXI.Texture.WHITE) {
      const bgSprite = new PIXI.Sprite(bgTex);
      bgSprite.anchor.set(0.5);
      bgSprite.x = W / 2;
      bgSprite.y = H / 2;
      bgSprite.width = isPortrait ? W * 1.80 : W * 1.20;
      bgSprite.height = isPortrait ? H * 1.05 : H;
      bgSprite.name = 'bg';
      this.container.addChild(bgSprite);
    }

    // Title: "Choose your prize"
    const title = new PIXI.Text('Choose your prize', {
      fontFamily: 'Magnolia Script, Magnolia-Script, cursive',
      fontSize: 60,
      fill: 0xFFFFFF,
      fontWeight: 'normal',
      padding: 30,
      dropShadow: true,
      dropShadowColor: 0x660000,
      dropShadowBlur: 10,
      dropShadowDistance: 2,
    });
    title.anchor.set(0.5, 0);
    title.x = W / 2;
    title.y = H * 0.03;
    this.container.addChild(title);

    // Raining Glowing White Snow Particles
    this._buildSnowParticles();

    // Gift picker
    this._giftPicker = new GiftPicker(this.container, W, H, 5, this._getTexture, this._getSpineData, this._audio);

    // Win display (hidden initially)
    this._winText = new PIXI.Text('', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: 48,
      fill: 0xFFD700,
      stroke: 0xFF0044,
      strokeThickness: 4,
      fontWeight: '900',
      dropShadow: true,
      dropShadowColor: 0xFFFFFF,
      dropShadowBlur: 20,
      dropShadowDistance: 0,
    });
    this._winText.anchor.set(0.5);
    this._winText.x = W / 2;
    this._winText.y = H * 0.88;
    this._winText.alpha = 0;
    this.container.addChild(this._winText);
  }

  async _showWinCelebration(multiplier, winAmount, giftNum = 1) {
    const isPortrait = window.innerHeight > window.innerWidth;
    const W = isPortrait ? GameConfig.PORTRAIT_WIDTH : GameConfig.WIDTH;
    const H = isPortrait ? GameConfig.PORTRAIT_HEIGHT : GameConfig.HEIGHT;

    const celebrationGroup = new PIXI.Container();
    celebrationGroup.zIndex = 100;
    this.container.addChild(celebrationGroup);

    let spinePromise = Promise.resolve();
    let tickerFn = null;

    // 0. Semi-transparent black background overlay across full screen
    const dimOverlay = new PIXI.Graphics();
    dimOverlay.beginFill(0x000000, 0.75);
    dimOverlay.drawRect(-W, -H, W * 3, H * 3);
    dimOverlay.endFill();
    celebrationGroup.addChild(dimOverlay);

    // 1. Shining background flare (shining.webp) behind Spine animation (wins_pop_up)
    const shineTex = this._getTexture ? (this._getTexture('shining') || this._getTexture('bg_shine') || this._getTexture('bgshine')) : null;
    if (shineTex) {
      const shineSprite = new PIXI.Sprite(shineTex);
      shineSprite.anchor.set(0.5);
      shineSprite.x = W / 2;
      shineSprite.y = isPortrait ? H * 0.50 : H * 0.50;
      shineSprite.scale.set(isPortrait ? 1.35 : 1.25);
      celebrationGroup.addChild(shineSprite);

      // Continuous rotation ticker for shining flare
      tickerFn = () => {
        if (shineSprite && !shineSprite.destroyed) {
          shineSprite.rotation += 0.006;
        }
      };
      PIXI.Ticker.shared.add(tickerFn);
    }

    // 2. Spine wins_pop_up celebration (size: 0.60, position Y: 0.52)
    const winsSpineData = this._getSpineData ? this._getSpineData('wins_pop_up') : null;
    if (winsSpineData) {
      try {
        const spine = new Spine(winsSpineData);
        spine.x = W / 2;
        spine.y = H * 0.52;
        spine.scale.set(0.60);
        spine.name = 'winsSpine';

        const prefix = String(giftNum || 1);

        let targetTier = 1; // Default: show both _0 and _1 for all gift selections
        if (multiplier >= 50) targetTier = 4;      // Big win: plays _0 -> _1 -> _2 -> _3 -> _4
        else if (multiplier >= 25) targetTier = 3; // Large win: plays _0 -> _1 -> _2 -> _3
        else if (multiplier >= 10) targetTier = 2; // Medium win: plays _0 -> _1 -> _2

        // Queue animation sequence: _0 intro, _1 always, and up to targetTier
        spine.state.setAnimation(0, `${prefix}_0`, false);
        for (let i = 1; i <= targetTier; i++) {
          spine.state.addAnimation(0, `${prefix}_${i}`, false, 0);
        }
        celebrationGroup.addChild(spine);

        // Wait until all queued Spine animations in sequence complete
        const completesNeeded = 1 + targetTier;
        spinePromise = new Promise((resolve) => {
          let completes = 0;
          const listener = {
            start: (entry) => {
              const animName = entry && entry.animation ? entry.animation.name : '';
              if (animName.endsWith('_4')) {
                // The 4th animation (_4) asset is drawn slightly low, so shift spine.y UP for _4
                spine.y = H * 0.44;
              } else {
                spine.y = H * 0.52;
              }
            },
            complete: () => {
              completes++;
              if (completes >= completesNeeded) {
                try { spine.state.removeListener(listener); } catch (_) { }
                resolve();
              }
            }
          };
          spine.state.addListener(listener);
          setTimeout(resolve, 2000 + targetTier * 1200); // Dynamic fallback timeout
        });
      } catch (e) {
        console.warn('Could not play wins_pop_up spine:', e);
      }
    }

    // 3. Top Total Win text with fast smooth count-up animation (yellow/gold text with white/cyan glow)
    const topWinText = new PIXI.Text('0.00 FUN', {
      fontFamily: 'Magnolia Script, Magnolia-Script, cursive',
      fontSize: 72,
      fill: ['#FFFFFF', '#FFE600', '#FFB700'],
      fillGradientLinear: true,
      stroke: '#FFFFFF',
      strokeThickness: 3,
      dropShadow: true,
      dropShadowColor: '#00E5FF',
      dropShadowBlur: 18,
      dropShadowDistance: 0,
      padding: 40,
    });
    topWinText.anchor.set(0.5);
    topWinText.x = W / 2;
    topWinText.y = H * 0.16;
    celebrationGroup.addChild(topWinText);

    // Fast, responsive count-up effect (~700ms duration)
    const startCountTime = Date.now();
    const durationMs = 700;
    const countTicker = () => {
      const elapsed = Date.now() - startCountTime;
      const progress = Math.min(1, elapsed / durationMs);
      const easedProgress = 1 - Math.pow(1 - progress, 2); // Smooth ease-out quad
      const currentVal = winAmount * easedProgress;
      if (topWinText && !topWinText.destroyed) {
        topWinText.text = `${currentVal.toFixed(2)} FUN`;
      }
      if (progress >= 1) {
        PIXI.Ticker.shared.remove(countTicker);
      }
    };
    PIXI.Ticker.shared.add(countTicker);

    // 4. Ribbon banner (ribbon.webp)
    const ribbonTex = this._getTexture ? this._getTexture('ribbon') : null;
    if (ribbonTex) {
      const ribbonSprite = new PIXI.Sprite(ribbonTex);
      ribbonSprite.anchor.set(0.5);
      ribbonSprite.x = W / 2;
      ribbonSprite.y = H * 0.65;
      ribbonSprite.width = 760;
      ribbonSprite.height = 110;
      celebrationGroup.addChild(ribbonSprite);
    }

    // 5. Ribbon text: "Total Win" in white cursive/italic font
    const ribbonText = new PIXI.Text('Total Win', {
      fontFamily: 'Magnolia Script, Magnolia-Script, cursive',
      fontSize: 58,
      fill: '#FFFFFF',
      dropShadow: true,
      dropShadowColor: '#E000B0',
      dropShadowBlur: 14,
      dropShadowDistance: 0,
      padding: 40,
    });
    ribbonText.anchor.set(0.5);
    ribbonText.x = W / 2;
    ribbonText.y = H * 0.65;
    celebrationGroup.addChild(ribbonText);

    // 6. Bottom Multiplier text: e.g. "47x bet" (white text with pink stroke & glow)
    const bottomBetText = new PIXI.Text(`${multiplier}x bet`, {
      fontFamily: 'Magnolia Script, Magnolia-Script, cursive',
      fontSize: 54,
      fill: '#FFFFFF',
      stroke: '#D500F9',
      strokeThickness: 4,
      dropShadow: true,
      dropShadowColor: '#FF00A0',
      dropShadowBlur: 16,
      dropShadowDistance: 0,
      padding: 40,
    });
    bottomBetText.anchor.set(0.5);
    bottomBetText.x = W / 2;
    bottomBetText.y = H * 0.79;
    celebrationGroup.addChild(bottomBetText);

    // 2.5 Animated bouncing coins fountain originating from wins_pop_up box
    const coinsContainer = new PIXI.Container();
    celebrationGroup.addChild(coinsContainer);

    const coinTextures = this._getCoinTextures ? this._getCoinTextures() : [];
    let coinSpawnerTicker = null;
    const activeCoins = [];

    if (coinTextures && coinTextures.length > 0) {
      // Play bigwin_coins.ogg sound when coins drop!
      this._audio?.playBigWinCoins();

      // Spawn interval control: spawn 1 coin every N frames (reduced coin quantity)
      let spawnIntervalFrames = 5; // Default: 1 coin every 5 frames (~12 coins/sec)
      if (multiplier >= 50) spawnIntervalFrames = 2;      // Big win: ~30 coins/sec
      else if (multiplier >= 25) spawnIntervalFrames = 3; // Large win: ~20 coins/sec
      else if (multiplier >= 10) spawnIntervalFrames = 4; // Medium win: ~15 coins/sec

      const originX = W / 2;
      const originY = H * 0.50; // Spawns from wins_pop_up gift box center

      let frameCounter = 0;
      let spawningActive = true;
      const spawnStartTime = Date.now();
      const spawnDuration = 1000 + (multiplier >= 50 ? 1000 : multiplier >= 25 ? 600 : 300);

      coinSpawnerTicker = () => {
        const now = Date.now();
        if (now - spawnStartTime > spawnDuration) {
          spawningActive = false;
        }

        frameCounter++;
        if (spawningActive && (frameCounter % spawnIntervalFrames === 0)) {
          const coin = new PIXI.AnimatedSprite(coinTextures);
          coin.animationSpeed = 0.35 + Math.random() * 0.3;
          coin.play();
          coin.anchor.set(0.5);
          coin.x = originX + (Math.random() - 0.5) * 80;
          coin.y = originY + (Math.random() - 0.5) * 30;

          const scale = 0.40 + Math.random() * 0.30;
          coin.scale.set(scale);

          // Erupts upward & outward from wins_pop_up box
          coin.vx = (Math.random() - 0.5) * 10;
          coin.vy = -7 - Math.random() * 8;
          coin.gravity = 0.55 + Math.random() * 0.15;
          coin.rotationSpeed = (Math.random() - 0.5) * 0.14;

          // Ground landing level & bounce tracking
          coin.groundY = H * 0.85 + Math.random() * 40;
          coin.bounces = 0;
          coin.maxBounces = 2 + Math.floor(Math.random() * 2); // 2 or 3 bounces on land
          coin.isSettling = false;
          coin.life = 0;

          coinsContainer.addChild(coin);
          activeCoins.push(coin);
        }

        // Update physics for active coins
        for (let i = activeCoins.length - 1; i >= 0; i--) {
          const coin = activeCoins[i];
          coin.life++;

          coin.x += coin.vx;
          coin.y += coin.vy;
          coin.vy += coin.gravity;
          coin.rotation += coin.rotationSpeed;

          // Bounce logic when coin hits ground land level
          if (coin.y >= coin.groundY && coin.vy > 0) {
            coin.y = coin.groundY;
            coin.bounces++;

            if (coin.bounces < coin.maxBounces && Math.abs(coin.vy) > 2.0) {
              // Bounce upward with dampened energy
              coin.vy = -coin.vy * (0.45 + Math.random() * 0.15);
              coin.vx *= 0.7;
              coin.rotationSpeed *= 0.7;
            } else {
              // Settled on ground: stop bouncing and prepare to fade out
              coin.vy = 0;
              coin.vx *= 0.4;
              coin.gravity = 0;
              coin.isSettling = true;
            }
          }

          // Safety timeout: coins exceeding max lifetime or off-screen start fading out immediately
          if (coin.life > 90 || coin.y > H + 40) {
            coin.isSettling = true;
          }

          // Fade out once settled on land after bouncing
          if (coin.isSettling) {
            coin.alpha -= 0.05;
          }

          if (coin.alpha <= 0 || coin.destroyed) {
            if (!coin.destroyed) coin.destroy();
            activeCoins.splice(i, 1);
          }
        }

        // Clean up ticker when spawning ended and all coins finished bouncing & faded out
        if (!spawningActive && activeCoins.length === 0) {
          if (coinSpawnerTicker) {
            try { PIXI.Ticker.shared.remove(coinSpawnerTicker); } catch (_) { }
            coinSpawnerTicker = null;
          }
        }
      };

      PIXI.Ticker.shared.add(coinSpawnerTicker);
    }

    // Animate group entrance
    celebrationGroup.alpha = 0;
    await AnimationUtils.fadeTo(celebrationGroup, 1, 300);
    await AnimationUtils.bounce(topWinText, 0.15, 400);

    // Wait for the single-run Spine celebration to finish playing
    await spinePromise;

    if (tickerFn) {
      try { PIXI.Ticker.shared.remove(tickerFn); } catch (_) { }
    }
    if (coinSpawnerTicker) {
      try { PIXI.Ticker.shared.remove(coinSpawnerTicker); } catch (_) { }
      coinSpawnerTicker = null;
    }

    // Clean up coins container and remove any remaining coin sprites
    if (coinsContainer && !coinsContainer.destroyed) {
      coinsContainer.destroy({ children: true });
    }
  }

  _buildSnowParticles() {
    this._snowContainer = new PIXI.Container();
    // Place right above background
    this.container.addChildAt(this._snowContainer, 1);

    this._snowflakes = [];
    const snowflakeCount = 50;
    const W = GameConfig.WIDTH;
    const H = GameConfig.HEIGHT;

    for (let i = 0; i < snowflakeCount; i++) {
      const flake = new PIXI.Graphics();
      const radius = 1.8 + Math.random() * 3.2;

      // Pure glowing white snow particle
      flake.beginFill(0xFFFFFF, 0.95);
      flake.drawCircle(0, 0, radius);
      flake.endFill();

      try {
        flake.blendMode = PIXI.BLEND_MODES.ADD; // Radiant snow glow
      } catch (e) { }

      const startX = Math.random() * W;
      const startY = Math.random() * H;

      flake.x = startX;
      flake.y = startY;

      this._snowContainer.addChild(flake);

      this._snowflakes.push({
        sprite: flake,
        x: startX,
        y: startY,
        vx: (Math.random() - 0.5) * 0.4, // Gentle horizontal sway
        vy: 0.6 + Math.random() * 1.3,   // Downward snow falling speed
        radius: radius,
        phase: Math.random() * Math.PI * 2,
        swaySpeed: 0.015 + Math.random() * 0.025,
      });
    }

    this._snowTicker = new PIXI.Ticker();
    this._snowTicker.add(() => {
      if (!this.container.visible) return;
      this._snowflakes.forEach(f => {
        f.phase += f.swaySpeed;
        f.y += f.vy;
        f.x += f.vx + Math.sin(f.phase) * 0.6; // Swaying gentle drift

        f.sprite.x = f.x;
        f.sprite.y = f.y;
        f.sprite.alpha = 0.7 + 0.3 * Math.sin(f.phase);

        // Respawn at top when falling off the bottom
        if (f.y > H + 12) {
          f.y = -12;
          f.x = Math.random() * W;
        }
      });
    });
    this._snowTicker.start();
  }

  _destroyUI() {
    if (this._snowTicker) {
      this._snowTicker.destroy();
      this._snowTicker = null;
    }
    this.container.removeChildren();
    this._giftPicker = null;
    this._winText = null;
  }
}
