import * as PIXI from 'pixi.js';
import { Spine } from 'pixi-spine';
import { GameConfig } from '../config/GameConfig.js';
import { MathUtils } from '../utils/MathUtils.js';
import { AnimationUtils } from '../utils/AnimationUtils.js';

/**
 * BuyBonusButton – BGaming Gift Rush style Buy Bonus panel.
 * Features:
 *   1. Blue gift box with pink ribbon tied on a green wreath (Spine animated or WebP texture).
 *   2. Glossy orange/gold pill button with "Buy Bonus" cursive label.
 *   3. Purple hanging banner displaying cost and currency ("40.00 FUN").
 */
export class BuyBonusButton extends PIXI.Container {
  /**
   * @param {Function} onBuy        (cost) → void
   * @param {number}   bet          initial bet value
   * @param {Function} getTexture   texture loader callback
   * @param {number}   balance      initial balance value
   * @param {Function} getSpineData spine data loader callback
   */
  constructor(onBuy, bet, getTexture, balance = 0, getSpineData = null) {
    super();
    this._onBuy = onBuy;
    this._bet = bet;
    this._getTexture = getTexture;
    this._getSpineData = getSpineData;
    this._balance = balance;
    this._enabled = true;
    this._affordable = true;
    this._buildUI();
  }

  updateBalance(balance) {
    this._balance = balance;
    this._updateState();
  }

  updateBet(bet) {
    this._bet = bet;
    this._updateCost();
    this._updateState();
  }

  setEnabled(enabled) {
    this._enabled = enabled;
    this._updateState();
  }

  updateLayout(isPortrait = false) {
    this._isPortrait = isPortrait;
    this._updateButtonTexture();
    this._updateBannerLayout();

    const giftY = isPortrait ? -40 : -148;
    const grassY = isPortrait ? 65 : -30;
    const btnX = isPortrait ? 250 : 0;
    const btnY = isPortrait ? 50 : 65;

    if (this._buyBtnSprite) {
      this._buyBtnSprite.x = btnX;
      this._buyBtnSprite.y = btnY;
    }
    if (this._bannerContainer) {
      this._bannerContainer.x = btnX;
      this._bannerContainer.y = isPortrait ? 50 : 51;
    }
    if (this._btnBg) {
      this._btnBg.x = btnX;
      this._btnBg.y = btnY;
    }

    if (this._giftSpine) this._giftSpine.y = giftY;
    if (this._bonusSprite) this._bonusSprite.y = giftY;
    if (this._grassBehindSprite) this._grassBehindSprite.y = grassY;
    if (this._grassSprite) {
      if (isPortrait && this._grassPortraitTex && this._grassPortraitTex !== PIXI.Texture.WHITE) {
        this._grassSprite.texture = this._grassPortraitTex;
        this._grassSprite.scale.set(1.1);
        this._grassSprite.y = 78; // Slight move down in portrait mode only
      } else if (this._grassOfBonusTex && this._grassOfBonusTex !== PIXI.Texture.WHITE) {
        this._grassSprite.texture = this._grassOfBonusTex;
        this._grassSprite.scale.set(0.65);
        this._grassSprite.y = grassY;
      } else {
        this._grassSprite.y = grassY;
      }
    }
    if (this._bugsContainer) this._bugsContainer.y = isPortrait ? 95 : 0;
    if (this._bgPortraitGrassSprite) {
      this._bgPortraitGrassSprite.visible = isPortrait;
      if (isPortrait) {
        this._bgPortraitGrassSprite.x = 125;
        this._bgPortraitGrassSprite.y = 15;
        this._bgPortraitGrassSprite.scale.set(0.70);
      }
    }
  }

  _updateButtonTexture() {
    if (!this._buyBtnSprite) return;

    let targetTex = null;
    if (this._isPortrait) {
      targetTex = this._bonusActive
        ? (this._portraitBuyBonusTex2 || this._buyBonusTex2)
        : (this._portraitBuyBonusTex1 || this._buyBonusTex1);
      this._buyBtnSprite.scale.set(0.62);
    } else {
      targetTex = this._bonusActive ? (this._buyBonusTex2 || this._buyBonusTex1) : (this._buyBonusTex1);
      this._buyBtnSprite.scale.set(0.52);
    }

    if (targetTex && targetTex !== PIXI.Texture.WHITE) {
      this._buyBtnSprite.texture = targetTex;
    }
  }

  _updateBannerLayout() {
    if (!this._bannerContainer) return;

    if (this._isPortrait) {
      this._bannerContainer.y = 50;

      if (this._titleText) {
        this._titleText.text = this._bonusActive ? 'Bonus Active' : 'Buy Bonus';
        this._titleText.style.fill = this._bonusActive ? 0xFFEA00 : 0xFFFFFF;
        this._titleText.style.fontSize = 24;
        this._titleText.anchor.set(1.0, 0.5);
        this._titleText.x = -15;
        this._titleText.y = 0;
      }

      if (this._costVal) {
        this._costVal.anchor.set(0.0, 0.5);
        this._costVal.x = 75;
        this._costVal.y = -12;
        this._costVal.style.fontSize = 22;
      }

      if (this._costUnit) {
        this._costUnit.anchor.set(0.0, 0.5);
        this._costUnit.x = 75;
        this._costUnit.y = 14;
        this._costUnit.style.fontSize = 18;
      }
    } else {
      this._bannerContainer.y = 51;

      if (this._titleText) {
        if (this._bonusActive) {
          this._titleText.text = 'Bonus\nActive';
          this._titleText.style.fill = 0xFFEA00;
          this._titleText.style.fontSize = 22;
          this._titleText.style.lineHeight = 22;
          this._titleText.anchor.set(0.5, 0);
          this._titleText.x = 0;
          this._titleText.y = -52;
        } else {
          this._titleText.text = 'Buy Bonus';
          this._titleText.style.fill = 0xFFFFFF;
          this._titleText.style.fontSize = 25;
          this._titleText.anchor.set(0.5, 0);
          this._titleText.x = 0;
          this._titleText.y = -46;
        }
      }

      if (this._costVal) {
        this._costVal.anchor.set(0.5, 0);
        this._costVal.x = 0;
        this._costVal.y = 22;
        this._costVal.style.fontSize = 18;
      }

      if (this._costUnit) {
        this._costUnit.anchor.set(0.5, 0);
        this._costUnit.x = 0;
        this._costUnit.y = 44;
        this._costUnit.style.fontSize = 18;
      }
    }
  }

  setBonusActive(active) {
    this._bonusActive = active;
    this._updateButtonTexture();
    this._updateBannerLayout();

    if (this._btnText) {
      if (active) {
        this._btnText.text = 'Bonus\nActive';
        this._btnText.style.fill = 0xFFEA00;
      } else {
        this._btnText.text = 'Buy Bonus';
        this._btnText.style.fill = 0xFFFFFF;
      }
    }

    this._updateState();
  }

  /**
   * Plays the gift open-and-close Spine animation (used when user selects YES for buy bonus).
   */
  playGiftAnimation() {
    if (this._giftSpine && this._giftSpine.state) {
      try {
        this._giftSpine.visible = true;
        this._giftSpine.state.clearListeners();
        // Play open2 animation which opens box, beams sparkling lights, and closes back down once
        this._giftSpine.state.setAnimation(0, 'open2', false);
      } catch (err) {
        console.warn('Error playing Spine gift animation:', err);
      }
    } else if (this._bonusSprite) {
      AnimationUtils.bounce(this._bonusSprite, 0.2, 400);
    }
  }

  _updateState() {
    this._affordable = this._balance >= this._cost();
    const canClick = this._enabled && this._affordable;

    this.interactive = canClick;
    this.buttonMode = canClick;

    const greyColor = 0x888888;
    const goldColor = 0xFFEA00;
    const whiteColor = 0xFFFFFF;

    if (this._titleText) {
      if (!canClick && !this._bonusActive) {
        this._titleText.style.fill = greyColor;
      } else {
        this._titleText.style.fill = this._bonusActive ? goldColor : whiteColor;
      }
    }

    if (this._costVal) {
      this._costVal.style.fill = (!canClick && !this._bonusActive) ? greyColor : goldColor;
    }

    if (this._costUnit) {
      this._costUnit.style.fill = (!canClick && !this._bonusActive) ? greyColor : goldColor;
    }

    if (this._btnText) {
      if (!canClick && !this._bonusActive) {
        this._btnText.style.fill = greyColor;
      } else {
        this._btnText.style.fill = this._bonusActive ? goldColor : whiteColor;
      }
    }

    if (this._giftSpine) {
      this._giftSpine.alpha = 1.0;
    }

    if (this._bonusSprite) {
      if (canClick && this._bonusEnableTex) {
        this._bonusSprite.texture = this._bonusEnableTex;
      }
    }
  }

  _cost() { return parseFloat((this._bet * GameConfig.BUY_BONUS_COST_X).toFixed(2)); }

  _buildUI() {
    // ── 0. BG Portrait Grass (bg-portrait-grass.png_80_80.webp) - Rendered behind everything in portrait mode ──
    const bgPortraitGrassTex = this._getTexture ? (this._getTexture('bg_portrait_grass') || this._getTexture('grass_portrait')) : null;
    if (bgPortraitGrassTex && bgPortraitGrassTex !== PIXI.Texture.WHITE) {
      this._bgPortraitGrassSprite = new PIXI.Sprite(bgPortraitGrassTex);
      this._bgPortraitGrassSprite.anchor.set(0.5);
      this._bgPortraitGrassSprite.x = 125;
      this._bgPortraitGrassSprite.y = 15;
      this._bgPortraitGrassSprite.visible = false;
      this.addChild(this._bgPortraitGrassSprite);
    }

    // ── 1. Grass Behind Icon (grassofbonusbehind.webp) ─────────
    const grassBehindTex = this._getTexture ? this._getTexture('grass_of_bonus_behind') : null;
    if (grassBehindTex && grassBehindTex !== PIXI.Texture.WHITE) {
      this._grassBehindSprite = new PIXI.Sprite(grassBehindTex);
      this._grassBehindSprite.anchor.set(0.5);
      this._grassBehindSprite.y = -30;
      this._grassBehindSprite.scale.set(0.65);
      this.addChild(this._grassBehindSprite);
    }

    // ── 2. Spine Animated Gift Box / bonusenable.webp fallback ────
    const giftSpineData = this._getSpineData ? this._getSpineData('gift') : null;
    this._bonusEnableTex = this._getTexture ? this._getTexture('bonus_enable') : null;

    if (giftSpineData) {
      try {
        this._giftSpine = new Spine(giftSpineData);
        this._giftSpine.scale.set(0.60);
        this._giftSpine.state.setAnimation(0, 'close', false);
        this._giftSpine.update(0);

        // Pivot to center of gift box in Spine local coordinates
        const bounds = this._giftSpine.getLocalBounds();
        if (bounds && bounds.width > 0 && isFinite(bounds.x) && isFinite(bounds.width)) {
          this._giftSpine.pivot.set(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
        } else {
          this._giftSpine.pivot.set(-773.71, 70.0);
        }

        this._giftSpine.x = 0;
        this._giftSpine.y = -148;
        this.addChild(this._giftSpine);
      } catch (err) {
        console.warn('Could not create Spine gift instance:', err);
        this._giftSpine = null;
      }
    }

    if (!this._giftSpine) {
      if (this._bonusEnableTex && this._bonusEnableTex !== PIXI.Texture.WHITE) {
        this._bonusSprite = new PIXI.Sprite(this._bonusEnableTex);
        this._bonusSprite.anchor.set(0.5);
        this._bonusSprite.y = -148;
        this._bonusSprite.scale.set(0.80);
        this.addChild(this._bonusSprite);
      } else {
        const giftContainer = new PIXI.Container();
        giftContainer.y = -35;

        const wreath = new PIXI.Graphics();
        wreath.beginFill(0x116622).drawEllipse(0, 20, 52, 14).endFill();
        [-35, -15, 15, 35].forEach(x => {
          wreath.beginFill(0xFF0033).drawCircle(x, 20, 3.5).endFill();
        });
        giftContainer.addChild(wreath);

        const box = new PIXI.Graphics();
        box.beginFill(0x00AADD).lineStyle(2, 0x00E5FF)
          .drawRoundedRect(-32, -22, 64, 44, 8).endFill();
        box.beginFill(0xFF007F).drawRect(-8, -22, 16, 44).endFill();
        box.beginFill(0xFF007F).drawRect(-32, -6, 64, 12).endFill();
        box.beginFill(0x00BFFF).lineStyle(2, 0x80E5FF)
          .drawRoundedRect(-36, -26, 72, 12, 4).endFill();
        box.beginFill(0xFF007F).drawRect(-8, -26, 16, 12).endFill();
        box.beginFill(0xFF007F).drawCircle(-12, -32, 10).endFill();
        box.beginFill(0xFF007F).drawCircle(12, -32, 10).endFill();
        box.beginFill(0xFFD700).drawCircle(0, -32, 5).endFill();
        giftContainer.addChild(box);
        this.addChild(giftContainer);
      }
    }

    // ── 3. Front Grass Overlay (grassofbonus.webp vs grass-portrait.png_80_80.webp) ─────────────
    this._grassOfBonusTex = this._getTexture ? this._getTexture('grass_of_bonus') : null;
    this._grassPortraitTex = this._getTexture ? this._getTexture('grass_portrait') : null;

    const initialGrassTex = this._grassOfBonusTex || this._grassPortraitTex;
    if (initialGrassTex && initialGrassTex !== PIXI.Texture.WHITE) {
      this._grassSprite = new PIXI.Sprite(initialGrassTex);
      this._grassSprite.anchor.set(0.5);
      this._grassSprite.y = -30;
      this._grassSprite.scale.set(0.65);
      this.addChild(this._grassSprite);
    }

    // ── 3. Buy Bonus Button Image (buybonus.png / buybonus2.png vs portraitbuybonus.png / portraitbuybonus2.webp) ──────────────
    this._buyBonusTex1 = this._getTexture ? this._getTexture('buy_bonus') : null;
    this._buyBonusTex2 = this._getTexture ? this._getTexture('buy_bonus_2') : null;
    this._portraitBuyBonusTex1 = this._getTexture ? this._getTexture('portrait_buy_bonus') : null;
    this._portraitBuyBonusTex2 = this._getTexture ? this._getTexture('portrait_buy_bonus_2') : null;

    const initialTex = this._buyBonusTex1 || this._portraitBuyBonusTex1;

    if (initialTex && initialTex !== PIXI.Texture.WHITE) {
      this._buyBtnSprite = new PIXI.Sprite(initialTex);
      this._buyBtnSprite.anchor.set(0.5);
      this._buyBtnSprite.y = 65;
      this._buyBtnSprite.scale.set(0.52);
      this.addChild(this._buyBtnSprite);
      this._updateButtonTexture();
    } else {
      this._btnBg = new PIXI.Graphics();
      this._drawBtnBg(false);
      this.addChild(this._btnBg);

      this._btnText = new PIXI.Text('Buy Bonus', {
        fontFamily: 'Magnolia Script, Magnolia-Script, cursive',
        fontSize: 32,
        fill: 0xFFFFFF,
        fontWeight: 'normal',
        dropShadow: true,
        dropShadowColor: 0x992200,
        dropShadowBlur: 4,
        dropShadowDistance: 2,
      });
      this._btnText.anchor.set(0.5);
      this._btnText.y = 18;
      this.addChild(this._btnText);
    }

    // ── 4. Cost Text & Title Display ──────────────────────────────
    this._bannerContainer = new PIXI.Container();
    this._bannerContainer.y = 51;

    this._titleText = new PIXI.Text('Buy Bonus', {
      fontFamily: 'Magnolia Script, Magnolia-Script, cursive',
      fontSize: 25,
      fill: 0xFFFFFF,
      fontWeight: 'normal',
      align: 'center',
      dropShadow: true,
      dropShadowColor: 0x880000,
      dropShadowBlur: 3,
      dropShadowDistance: 1,
    });
    this._titleText.anchor.set(0.5, 0);
    this._titleText.y = -46;
    this._bannerContainer.addChild(this._titleText);

    this._costVal = new PIXI.Text('', {
      fontFamily: 'Magnolia Script, Magnolia-Script, cursive',
      fontSize: 18,
      fill: 0xFFEA00,
      fontWeight: 'normal',
      dropShadow: true,
      dropShadowColor: 0x000000,
      dropShadowBlur: 3,
      dropShadowDistance: 1,
    });
    this._costVal.anchor.set(0.5, 0);
    this._costVal.y = 22;
    this._bannerContainer.addChild(this._costVal);

    this._costUnit = new PIXI.Text('FUN', {
      fontFamily: 'Magnolia Script, Magnolia-Script, cursive',
      fontSize: 18,
      fill: 0xFFEA00,
      fontWeight: 'normal',
      dropShadow: true,
      dropShadowColor: 0x000000,
      dropShadowBlur: 3,
      dropShadowDistance: 1,
    });
    this._costUnit.anchor.set(0.5, 0);
    this._costUnit.y = 44;
    this._bannerContainer.addChild(this._costUnit);

    this.addChild(this._bannerContainer);

    this._updateCost();
    this._updateBannerLayout();

    // Interaction
    this.interactive = true;
    this.buttonMode = true;
    this.cursor = 'pointer';

    this.on('pointerdown', (e) => {
      e.stopPropagation();
      this._onBuy?.(this._cost());
    });
    this.on('pointerover', () => this._drawBtnBg(true));
    this.on('pointerout', () => this._drawBtnBg(false));

    // ── 5. Lightning Bugs / Fireflies (Top depth floating glowing particles) ──
    this._buildLightningBugs();
  }

  _drawBtnBg(hover) {
    if (!this._btnBg) return; // Only used in fallback (no-texture) mode
    const borderCol = hover ? 0xFFEA00 : 0xFFB000;
    // Orange glossy gradient
    this._btnBg.beginFill(hover ? 0xFF7700 : 0xFF5500)
      .lineStyle(3, borderCol, 1)
      .drawRoundedRect(-85, 0, 170, 52, 26)
      .endFill();

    // Highlight shine on top half of button
    this._btnBg.beginFill(0xFFFFFF, 0.25);
    this._btnBg.drawEllipse(0, 12, 60, 10);
    this._btnBg.endFill();
  }

  _updateCost() {
    this._costVal.text = `${this._cost().toFixed(2)}`;
  }

  _buildLightningBugs() {
    this._bugsContainer = new PIXI.Container();
    this.addChild(this._bugsContainer);

    const blueTex = this._getTexture ? this._getTexture('blue_glow_bug') : null;

    this._bugs = [];
    const bugCount = 20;

    for (let i = 0; i < bugCount; i++) {
      let bug;
      if (blueTex && blueTex !== PIXI.Texture.WHITE) {
        bug = new PIXI.Sprite(blueTex);
        bug.anchor.set(0.5);
        bug.scale.set(0.28 + Math.random() * 0.22);
        bug.tint = 0xFFDD00;
      } else {
        bug = new PIXI.Graphics();
        const r = 2.5 + Math.random() * 2.0;
        bug.beginFill(0xFF9900, 0.35);
        bug.drawCircle(0, 0, r * 2.6);
        bug.endFill();
        bug.beginFill(0xFFEE00, 0.75);
        bug.drawCircle(0, 0, r * 1.4);
        bug.endFill();
        bug.beginFill(0xFFFFFF, 1.0);
        bug.drawCircle(0, 0, r * 0.7);
        bug.endFill();
      }

      try {
        bug.blendMode = PIXI.BLEND_MODES.ADD;
      } catch (e) { }

      const initialX = (Math.random() - 0.5) * 120;
      const initialY = -30 + (Math.random() - 0.5) * 35;

      bug.x = initialX;
      bug.y = initialY;

      this._bugsContainer.addChild(bug);

      this._bugs.push({
        sprite: bug,
        baseX: initialX,
        baseY: initialY,
        phase: Math.random() * Math.PI * 2,
        speed: 0.005 + Math.random() * 0.007,
        radiusX: 8 + Math.random() * 12,
        radiusY: 6 + Math.random() * 9,
      });
    }

    this._bugsTickHandler = (delta) => {
      if (!this._bugs) return;
      const dt = delta || 1;
      this._bugs.forEach(b => {
        b.phase += b.speed * dt;
        b.sprite.x = b.baseX + Math.sin(b.phase) * b.radiusX;
        b.sprite.y = b.baseY + Math.cos(b.phase * 0.7) * b.radiusY;
        b.sprite.alpha = 0.80 + 0.20 * Math.sin(b.phase * 1.2);
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
