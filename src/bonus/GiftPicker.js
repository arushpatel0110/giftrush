import * as PIXI from 'pixi.js';
import { Spine } from 'pixi-spine';
import { AnimationUtils } from '../utils/AnimationUtils.js';
import { MathUtils } from '../utils/MathUtils.js';

const GIFT_COLORS = [0xCC0022, 0x00AA44, 0x0044CC, 0xAA6600, 0x880088];
const RIBBON_COLS = [0xFFD700, 0xFFFFFF, 0xFFDD00, 0xFF8800, 0xFFAAAA];
const BOW_EMOJIS = ['🎀', '🎗️', '🪢', '🌟', '✨'];

/**
 * GiftPicker – Renders 5 interactive gift boxes in the bonus screen.
 *
 * The player clicks one; that gift flips open to reveal its multiplier.
 * Then `revealAll()` is called to flip the remaining gifts.
 */
export class GiftPicker {
  /**
   * @param {PIXI.Container} parent
   * @param {number}         width    canvas width
   * @param {number}         height   canvas height
   * @param {number}         count    number of gifts (always 5)
   * @param {Function}       getTexture
   * @param {Function}       getSpineData
   */
  constructor(parent, width, height, count, getTexture = null, getSpineData = null, audio = null) {
    this._parent = parent;
    this._w = width;
    this._h = height;
    this._count = count;
    this._getTexture = getTexture;
    this._getSpineData = getSpineData;
    this._audio = audio;
    this._picked = false;
    this._resolvePickFn = null;

    /** @type {PIXI.Container[]} */
    this._gifts = [];
    this._buildGifts();
  }

  /**
   * Wait until the player clicks a gift.
   * @returns {Promise<number>} chosen gift index
   */
  waitForPick() {
    return new Promise(resolve => {
      this._resolvePickFn = resolve;
    });
  }

  /**
   * Reveal all gift multipliers (called after the pick is made).
   * @param {number[]} multipliers  Array of 5 multiplier values
   * @param {number}   chosenIdx    Which gift the player picked
   */
  async revealAll(multipliers, chosenIdx) {
    // 1. Reveal clicked gift immediately
    this._revealGift(chosenIdx, multipliers[chosenIdx], true);

    // 2. Wait a short delay before revealing remaining unchosen gifts
    await AnimationUtils.wait(250);

    // 3. Reveal remaining gifts sequentially with quick timing
    for (let i = 0; i < this._count; i++) {
      if (i !== chosenIdx) {
        this._audio?.playBoxSecondClick();
        this._revealGift(i, multipliers[i], false);
        await AnimationUtils.wait(80);
      }
    }
  }

  /**
   * Get assigned gift variant number (1..5) for a given gift index.
   * @param {number} index
   * @returns {number}
   */
  getGiftNum(index) {
    const gift = this._gifts[index];
    return gift ? (gift.giftNum || 1) : 1;
  }

  // ── Private ────────────────────────────────────────────────

  _buildGifts() {
    const W = this._w;
    const H = this._h;

    // Start falling leaf rain ONLY during gift drop sequence
    this._startFallingLeafRain();

    const isPortrait = window.innerHeight > window.innerWidth;

    // Independent layout mapping for landscape vs portrait:
    // x, y = Gift position on screen
    // bunchX, bunchY = Bunch position on screen (can be adjusted independently in Portrait mode without moving the gift or affecting Landscape mode)
    const positions = isPortrait ? [
      { x: W * 0.30, y: H * 0.28, bunchKey: 'bunch_5', bunchX: W * 0, bunchY: H * 0.24, bunchScale: 0.70 }, // Pos 0 (Portrait Top-Left)
      { x: W * 0.70, y: H * 0.36, bunchKey: 'bunch_1', bunchX: W * 0.9, bunchY: H * 0.37, bunchScale: 0.70 }, // Pos 1 (Portrait Top-Right)
      { x: W * 0.30, y: H * 0.52, bunchKey: 'bunch_4', bunchX: W * 0.1, bunchY: H * 0.53, bunchScale: 0.70 }, // Pos 2 (Portrait Mid-Left)
      { x: W * 0.70, y: H * 0.64, bunchKey: 'bunch_1', bunchX: W * 0.87, bunchY: H * 0.66, bunchScale: 0.70 }, // Pos 3 (Portrait Mid-Right)
      { x: W * 0.45, y: H * 0.80, bunchKey: 'bunch_3', bunchX: W * 0.67, bunchY: H * 0.8, bunchScale: 0.60 }, // Pos 4 (Portrait Bottom-Center)
    ] : [
      { x: W * 0.20, y: H * 0.30, bunchKey: 'bunch_5', bunchX: W * 0, bunchY: H * 0.21, bunchScale: 0.75 }, // Pos 0 (Landscape Top-Left)
      { x: W * 0.57, y: H * 0.31, bunchKey: 'bunch_1', bunchX: W * 0.77, bunchY: H * 0.32, bunchScale: 0.75 }, // Pos 1 (Landscape Top-Middle)
      { x: W * 0.74, y: H * 0.69, bunchKey: 'bunch_1', bunchX: W * 0.86, bunchY: H * 0.70, bunchScale: 0.75 }, // Pos 2 (Landscape Bottom Right)
      { x: W * 0.39, y: H * 0.63, bunchKey: 'bunch_4', bunchX: W * 0.26, bunchY: H * 0.69, bunchScale: 0.75 }, // Pos 3 (Landscape Bottom Left)
      { x: W * 0.76, y: H * 0.32, bunchKey: 'bunch_3', bunchX: W * 1.0, bunchY: H * 0.23, bunchScale: 0.60 }, // Pos 4 (Landscape Top-Right)
    ];

    // Shuffle gift variant numbers 1..5 for random gift placement on each bonus round
    const giftNumbers = MathUtils.shuffle([1, 2, 3, 4, 5]);

    for (let i = 0; i < this._count; i++) {
      const pos = positions[i] || { x: W * 0.5, y: H * 0.5, bunchKey: `bunch_${i + 1}` };
      const giftNum = giftNumbers[i]; // Random gift variant (1..5) for position i

      // 1. Create gift container at fixed gift coordinates (x, y)
      const gift = this._createGiftContainer(i, giftNum, pos.x, pos.y);
      this._parent.addChild(gift);
      this._gifts.push(gift);

      // 2. Create branch/bunch container at independent bunch coordinates (bunchX, bunchY)
      const bx = pos.bunchX !== undefined ? pos.bunchX : pos.x;
      const by = pos.bunchY !== undefined ? pos.bunchY : pos.y;
      const bScale = pos.bunchScale || 0.75;
      const bunch = this._createBunchContainer(pos.bunchKey, bx, by, bScale);
      this._parent.addChild(bunch);

      // Fall animation: start from top above the screen
      const finalY = pos.y;
      gift.y = -180;
      gift.alpha = 0;

      const delay = i * 140;
      setTimeout(async () => {
        gift.alpha = 1;
        // Fall down type effect with bounce
        await AnimationUtils.tweenTo(gift, 'y', finalY, 450, MathUtils.easeOutBounce);

        // Immediate responsive impact for branch shake and gift drop sound!
        this._audio?.playBoxDrop();
        await AnimationUtils.wait(30);
        this._shakeBunch(bunch);
        AnimationUtils.bounce(gift, 0.15, 300);

        if (i === this._count - 1) {
          setTimeout(() => {
            this._startIdleKnockTimer();
            this._startBlinkShineTimer();
          }, 800);
        }
      }, delay);
    }
  }

  _startIdleKnockTimer() {
    this._stopIdleKnockTimer();

    // Prepare a shuffled queue of gift indices so every gift gets a turn
    this._knockQueue = MathUtils.shuffle([0, 1, 2, 3, 4]);

    const scheduleNextKnock = () => {
      if (this._picked) return;
      const delay = 1800 + Math.random() * 1000; // Smooth 1.8s - 2.8s interval
      this._idleTimer = setTimeout(() => {
        if (this._picked) return;
        this._triggerNextGiftKnock();
        scheduleNextKnock();
      }, delay);
    };

    scheduleNextKnock();
  }

  _stopIdleKnockTimer() {
    if (this._idleTimer) {
      clearTimeout(this._idleTimer);
      this._idleTimer = null;
    }
  }

  _triggerNextGiftKnock() {
    if (this._picked || !this._gifts || this._gifts.length === 0) return;

    // Available unopened gift indices
    const availableIndices = this._gifts
      .map((g, idx) => (g && g.interactive ? idx : -1))
      .filter(idx => idx !== -1);

    if (availableIndices.length === 0) return;

    // Re-shuffle remaining available gifts if queue is empty
    if (!this._knockQueue || this._knockQueue.length === 0) {
      this._knockQueue = MathUtils.shuffle([...availableIndices]);
    }

    // Pop next candidate from queue that is still interactive
    let nextIdx = -1;
    while (this._knockQueue.length > 0) {
      const candidate = this._knockQueue.shift();
      if (availableIndices.includes(candidate)) {
        nextIdx = candidate;
        break;
      }
    }

    if (nextIdx === -1) {
      this._knockQueue = MathUtils.shuffle([...availableIndices]);
      nextIdx = this._knockQueue.shift();
    }

    if (nextIdx !== undefined && nextIdx !== -1 && this._gifts[nextIdx]) {
      this._playKnockEffect(this._gifts[nextIdx]);
    }
  }

  async _playKnockEffect(gift) {
    if (!gift || this._picked) return;

    try {
      // Fun 4-step idle wobble & knocking nudge animation
      await AnimationUtils.tweenTo(gift, 'rotation', -0.15, 75);
      if (this._picked) { gift.rotation = 0; return; }
      await AnimationUtils.tweenTo(gift, 'rotation', 0.15, 75);
      if (this._picked) { gift.rotation = 0; return; }
      await AnimationUtils.tweenTo(gift, 'rotation', -0.10, 65);
      if (this._picked) { gift.rotation = 0; return; }
      await AnimationUtils.tweenTo(gift, 'rotation', 0.10, 65);
      if (this._picked) { gift.rotation = 0; return; }
      await AnimationUtils.tweenTo(gift, 'rotation', 0, 70);
      gift.rotation = 0;
    } catch (e) {
      if (gift) gift.rotation = 0;
    }
  }

  _startFallingLeafRain() {
    this._stopFallingLeafRain();

    this._leafContainer = new PIXI.Container();
    this._parent.addChild(this._leafContainer);

    this._fallingLeaves = [];
    const leafCount = 35; // One-time wave of 35 leaf particles during gift drop
    const W = this._w;
    const H = this._h;
    const leafTex = this._getTexture ? this._getTexture('particle_of_bunch') : null;

    for (let i = 0; i < leafCount; i++) {
      let leaf;
      if (leafTex && leafTex !== PIXI.Texture.WHITE) {
        leaf = new PIXI.Sprite(leafTex);
        leaf.anchor.set(0.5);
        leaf.scale.set(0.60 + Math.random() * 0.45);
      } else {
        leaf = new PIXI.Graphics();
        leaf.beginFill(0x228B22);
        leaf.drawEllipse(0, 0, 8, 16);
        leaf.endFill();
      }

      const startX = Math.random() * W;
      // Stagger starting Y positions above top of screen so they rain down sequentially across the full height
      const startY = -60 - Math.random() * (H * 0.70);

      leaf.x = startX;
      leaf.y = startY;
      leaf.rotation = Math.random() * Math.PI * 2;

      this._leafContainer.addChild(leaf);

      this._fallingLeaves.push({
        sprite: leaf,
        x: startX,
        y: startY,
        vx: (Math.random() - 0.5) * 2.0,
        vy: 12.0 + Math.random() * 8.0, // High-speed dynamic leaf fall
        vr: (Math.random() - 0.5) * 0.20,
        phase: Math.random() * Math.PI * 2,
        swaySpeed: 0.04 + Math.random() * 0.05,
      });
    }

    this._leafActive = true;
    this._leafTicker = new PIXI.Ticker();
    this._leafTicker.add((delta) => {
      let remainingCount = 0;
      this._fallingLeaves.forEach(f => {
        if (!f.sprite || !f.sprite.parent) return;

        f.phase += f.swaySpeed * delta;
        f.y += f.vy * delta;
        f.x += f.vx * delta + Math.sin(f.phase) * 1.5;
        f.sprite.rotation += f.vr * delta;

        f.sprite.x = f.x;
        f.sprite.y = f.y;

        // Keep leaves 100% visible until they pass ALL the way below the bottom of the screen (H + 60)
        if (f.y <= H + 60) {
          remainingCount++;
        } else {
          f.sprite.visible = false;
        }
      });

      // Once all leaves have fallen past the bottom of the screen, clean up
      if (remainingCount === 0) {
        this._stopFallingLeafRain();
      }
    });
    this._leafTicker.start();
  }

  _stopFallingLeafRain() {
    this._leafActive = false;
    if (this._leafTicker) {
      this._leafTicker.destroy();
      this._leafTicker = null;
    }
    if (this._leafContainer) {
      this._leafContainer.destroy({ children: true });
      this._leafContainer = null;
    }
    this._fallingLeaves = [];
  }

  _startBlinkShineTimer() {
    this._stopBlinkShineTimer();

    const scheduleBlink = () => {
      if (this._picked) return;
      const delay = 1400 + Math.random() * 1200; // Sparkling blink interval
      this._blinkTimer = setTimeout(() => {
        if (this._picked) return;
        this._spawnBlinkShine();
        scheduleBlink();
      }, delay);
    };

    scheduleBlink();
  }

  _stopBlinkShineTimer() {
    if (this._blinkTimer) {
      clearTimeout(this._blinkTimer);
      this._blinkTimer = null;
    }
  }

  _spawnBlinkShine() {
    const blinkTex = this._getTexture ? this._getTexture('blink') : null;
    if (!blinkTex || blinkTex === PIXI.Texture.WHITE) return;

    // Choose random gift position
    const randIdx = Math.floor(Math.random() * this._gifts.length);
    const gift = this._gifts[randIdx];
    if (!gift) return;

    const shine = new PIXI.Sprite(blinkTex);
    shine.anchor.set(0.5);
    shine.x = gift.x + (Math.random() - 0.5) * 120;
    shine.y = gift.y + (Math.random() - 0.5) * 110;
    shine.scale.set(0);
    shine.alpha = 0;
    shine.rotation = Math.random() * Math.PI;

    try {
      shine.blendMode = PIXI.BLEND_MODES.ADD; // Sparkling additive shine
    } catch (e) { }

    this._parent.addChild(shine);

    let progress = 0;
    const targetScale = 0.90;
    const ticker = (delta) => {
      progress += delta * 0.018; // Slower, smooth non-instant animation (~1.2 seconds duration)

      if (progress <= 0.35) {
        // Phase 1: Smooth fade in & scale up
        const t = progress / 0.35;
        shine.scale.set(t * targetScale);
        shine.alpha = t;
      } else if (progress <= 0.65) {
        // Phase 2: Hold shining sparkle at full brightness
        shine.scale.set(targetScale + Math.sin(progress * 10) * 0.05);
        shine.alpha = 1.0;
      } else {
        // Phase 3: Smooth fade out
        const t = (progress - 0.65) / 0.35;
        shine.scale.set((1 - t) * targetScale);
        shine.alpha = Math.max(0, 1 - t);
      }
      shine.rotation += 0.02 * delta;

      if (progress >= 1.0) {
        PIXI.Ticker.shared.remove(ticker);
        shine.destroy();
      }
    };

    PIXI.Ticker.shared.add(ticker);
  }

  _createBunchContainer(bunchKey, x, y, scale = 0.75) {
    const ctr = new PIXI.Container();
    ctr.x = x;
    ctr.y = y;
    ctr.name = bunchKey;

    const spineData = this._getSpineData ? this._getSpineData(bunchKey) : null;
    if (spineData) {
      try {
        const spine = new Spine(spineData);
        spine.name = 'bunchSpine';
        spine.scale.set(scale);
        // Do not play animation on creation; wait until gift lands on impact!
        ctr.addChild(spine);
        return ctr;
      } catch (e) {
        console.warn(`Spine creation failed for ${bunchKey}:`, e);
      }
    }

    const bunchTex = this._getTexture ? this._getTexture(bunchKey) : null;
    if (bunchTex && bunchTex !== PIXI.Texture.WHITE) {
      const sp = new PIXI.Sprite(bunchTex);
      sp.anchor.set(0.5, 0.3);
      sp.scale.set(scale);
      ctr.addChild(sp);
    }
    return ctr;
  }

  _shakeBunch(bunch) {
    if (!bunch) return;
    const spine = bunch.getChildByName('bunchSpine');
    if (spine && spine.state) {
      try {
        spine.state.setAnimation(0, 'animation', false);
      } catch (e) { }
    }
  }

  _createGiftContainer(index, giftNum, gx, gy) {
    const ctr = new PIXI.Container();
    ctr.x = gx;
    ctr.y = gy;
    ctr.name = `gift_${index}`;
    ctr.giftNum = giftNum; // Store assigned gift number

    // Get textures: gift1..5 (normal), gift1..5hover (hover), gift1..5open (open)
    const normalTex = this._getTexture ? this._getTexture(`gift${giftNum}`) : null;
    const activeTex = this._getTexture ? this._getTexture(`gift${giftNum}hover`) : null;

    let sprite;
    if (normalTex && normalTex !== PIXI.Texture.WHITE) {
      sprite = new PIXI.Sprite(normalTex);
      sprite.anchor.set(0.5);
      sprite.scale.set(0.48);
    } else {
      const g = new PIXI.Graphics();
      g.beginFill(0xFF0055);
      g.drawRoundedRect(-30, -30, 60, 60, 10);
      g.endFill();
      sprite = g;
    }
    sprite.name = 'giftSprite';
    ctr.addChild(sprite);

    // Multiplier shadow backdrop image (gift-multiplier-shadow.png_80_90.png)
    const shadowTex = this._getTexture ? this._getTexture('gift_multiplier_shadow') : null;
    let shadowSprite;
    if (shadowTex && shadowTex !== PIXI.Texture.WHITE) {
      shadowSprite = new PIXI.Sprite(shadowTex);
      shadowSprite.anchor.set(0.5);
    } else {
      const g = new PIXI.Graphics();
      g.beginFill(0x000000, 0.65);
      g.drawEllipse(0, 0, 50, 30);
      g.endFill();
      shadowSprite = g;
    }
    shadowSprite.name = 'shadowSprite';
    shadowSprite.y = -28; // Moved higher up
    shadowSprite.alpha = 0;
    ctr.addChild(shadowSprite);

    // Multiplier text (hidden until revealed)
    const mulText = new PIXI.Text('', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: 44,
      fill: 0xFFEA00,
      stroke: 0x000000,
      strokeThickness: 4,
      fontWeight: '900',
      dropShadow: true,
      dropShadowColor: 0x000000,
      dropShadowBlur: 5,
    });
    mulText.anchor.set(0.5);
    mulText.y = -28; // Moved higher up
    mulText.alpha = 0;
    mulText.name = 'mulText';
    ctr.addChild(mulText);

    // Interactive
    ctr.interactive = true;
    ctr.buttonMode = true;
    ctr.cursor = 'pointer';

    // Hover state: switch to hover image
    ctr.on('pointerover', () => {
      if (!this._picked) {
        if (sprite && activeTex) sprite.texture = activeTex;
        AnimationUtils.bounce(ctr, 0.08, 200);
      }
    });

    // Leave hover state: switch back to normal image
    ctr.on('pointerout', () => {
      if (!this._picked) {
        if (sprite && normalTex) sprite.texture = normalTex;
      }
    });

    // Click
    ctr.on('pointerdown', () => this._onGiftClick(index));

    return ctr;
  }

  _onGiftClick(index) {
    if (this._picked) return;
    this._picked = true;
    this._audio?.playGiftClick();
    this._stopFallingLeafRain();
    this._stopIdleKnockTimer();
    this._stopBlinkShineTimer();

    // Disable all gifts and reset rotation
    this._gifts.forEach(g => {
      if (g) {
        g.interactive = false;
        g.buttonMode = false;
        g.rotation = 0;
      }
    });

    this._resolvePickFn?.(index);
  }

  _revealGift(index, multiplier, isChosen) {
    const gift = this._gifts[index];
    const sprite = gift.getChildByName('giftSprite');
    const shadowSprite = gift.getChildByName('shadowSprite');
    const mulTxt = gift.getChildByName('mulText');

    if (!gift || !mulTxt) return;

    // Switch directly to open gift texture without any flip/bounce effects
    const giftNum = gift.giftNum || (index + 1);
    const openTex = this._getTexture ? this._getTexture(`gift${giftNum}open`) : null;
    if (sprite && openTex) {
      sprite.texture = openTex;
    }

    // Display shadow sprite behind multiplier text for ALL revealed gifts
    if (shadowSprite) {
      shadowSprite.alpha = isChosen ? 1.0 : 0.85;
      shadowSprite.scale.set(isChosen ? 0.52 : 0.42); // Proportions updated for slightly smaller text
    }

    mulTxt.text = `×${multiplier}`;
    mulTxt.alpha = 1;
    if (isChosen) {
      mulTxt.style.fill = 0xFFEA00; // Pure bright yellow
      mulTxt.style.fontSize = 46;    // Slightly reduced for perfect fit
      mulTxt.style.strokeThickness = 5;
    } else {
      mulTxt.style.fill = 0xFFFFFF; // White fill for other revealed multipliers
      mulTxt.style.fontSize = 36;    // Slightly reduced for other multipliers
      mulTxt.style.strokeThickness = 4;
      mulTxt.alpha = 0.92;
    }
  }
}
