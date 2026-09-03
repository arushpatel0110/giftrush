import * as PIXI from 'pixi.js';
import { EventEmitter } from '../utils/EventEmitter.js';
import { GameConfig } from '../config/GameConfig.js';

/**
 * StartScene – Intermediate splash screen shown after loading completes.
 * Displays startpagelandscape.webp / startpageportrait.webp
 * with texts rendered using Magnolia Script font matching exact design.
 */
export class StartScene extends EventEmitter {
  /**
   * @param {import('../engine/GameEngine.js').GameEngine} engine
   * @param {Function} onStartGame Callback when player clicks to enter main game
   */
  constructor(engine, onStartGame) {
    super();
    this._engine = engine;
    this._assets = engine.assets;
    this._onStartGame = onStartGame;

    this.container = new PIXI.Container();
    this.container.sortableChildren = true;

    this._bgSprite = new PIXI.Sprite();
    this._bgSprite.zIndex = 0;
    this.container.addChild(this._bgSprite);

    this._contentContainer = new PIXI.Container();
    this._contentContainer.zIndex = 2;
    this.container.addChild(this._contentContainer);
  }

  start() {
    this._buildContent();
    this._updateLayout();

    // Re-trigger layout after custom woff2 font finishes loading in browser
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        if (this._contentContainer && !this._contentContainer.destroyed) {
          this._updateLayout();
        }
      });
    }

    this._onResize = () => this._updateLayout();
    window.addEventListener('resize', this._onResize);
  }

  stop() {
    if (this._onResize) {
      window.removeEventListener('resize', this._onResize);
    }
    if (this._pulseTicker) {
      this._pulseTicker.destroy();
    }
    this.container.destroy({ children: true });
  }

  // ── Private ────────────────────────────────────────────────

  _buildContent() {
    const font = '"Magnolia Script", "Magnolia-Script", "Lobster", cursive, sans-serif';

    // 0. Inner canvas background sprite (startpagelandscape.webp / startpageportrait.webp)
    this._cardBgSprite = new PIXI.Sprite();
    this._cardBgSprite.zIndex = 0;
    this._contentContainer.addChild(this._cardBgSprite);

    // Top-Left Brand Logo ('B' icon)
    const brandTex = this._assets.getUITexture('brand_logo');
    if (brandTex) {
      this._brandLogo = new PIXI.Sprite(brandTex);
      this._brandLogo.anchor.set(0, 0);
      this._brandLogo.x = 24;
      this._brandLogo.y = 24;
      this._brandLogo.scale.set(0.75);
      this._contentContainer.addChild(this._brandLogo);
    }

    // 1. Top Left Text ("Buy Bonus", "Accelerate Your Luck")
    this._buyTitle = new PIXI.Text('Buy Bonus', {
      fontFamily: font,
      fontStyle: 'italic',
      fontWeight: 'bold',
      fontSize: 34,
      fill: '#FFFFFF',
      stroke: '#9E002B',
      strokeThickness: 5,
      dropShadow: true,
      dropShadowColor: '#4A0010',
      dropShadowBlur: 6,
      dropShadowDistance: 2,
      padding: 30,
    });
    this._buyTitle.anchor.set(0.5);
    this._buyTitle.x = 280;
    this._buyTitle.y = 135;
    this._contentContainer.addChild(this._buyTitle);

    this._buySub = new PIXI.Text('Accelerate Your Luck', {
      fontFamily: font,
      fontStyle: 'italic',
      fontWeight: 'bold',
      fontSize: 30,
      fill: '#FFFFFF',
      stroke: '#9E002B',
      strokeThickness: 4,
      dropShadow: true,
      dropShadowColor: '#4A0010',
      dropShadowBlur: 6,
      dropShadowDistance: 2,
      padding: 30,
    });
    this._buySub.anchor.set(0.5);
    this._buySub.x = 280;
    this._buySub.y = 175;
    this._contentContainer.addChild(this._buySub);

    // 2. Pink Badge Texts ("Buy", "Bonus Game") on Left Card
    this._pinkBuyText = new PIXI.Text('Buy', {
      fontFamily: font,
      fontStyle: 'italic',
      fontWeight: '900',
      fontSize: 44,
      fill: ['#FFFFFF', '#FFE600', '#FFCC00'],
      fillGradientLinear: true,
      stroke: '#800028',
      strokeThickness: 5,
      dropShadow: true,
      dropShadowColor: '#400010',
      dropShadowBlur: 6,
      dropShadowDistance: 2,
      padding: 30,
    });
    this._pinkBuyText.anchor.set(0.5);
    this._pinkBuyText.x = 315;
    this._pinkBuyText.y = 290;
    this._contentContainer.addChild(this._pinkBuyText);

    this._pinkBonusGameText = new PIXI.Text('Bonus Game', {
      fontFamily: font,
      fontStyle: 'italic',
      fontWeight: '900',
      fontSize: 38,
      fill: ['#FFFFFF', '#FFE600', '#FFCC00'],
      fillGradientLinear: true,
      stroke: '#800028',
      strokeThickness: 5,
      dropShadow: true,
      dropShadowColor: '#400010',
      dropShadowBlur: 6,
      dropShadowDistance: 2,
      padding: 30,
    });
    this._pinkBonusGameText.anchor.set(0.5);
    this._pinkBonusGameText.x = 315;
    this._pinkBonusGameText.y = 340;
    this._contentContainer.addChild(this._pinkBonusGameText);

    // 3. Green Button Text ("Buy") on Left Card
    this._greenBtnText = new PIXI.Text('Buy', {
      fontFamily: font,
      fontStyle: 'italic',
      fontWeight: 'bold',
      fontSize: 32,
      fill: '#FFFFFF',
      stroke: '#005E23',
      strokeThickness: 4,
      dropShadow: true,
      dropShadowColor: '#003310',
      dropShadowBlur: 4,
      dropShadowDistance: 2,
      padding: 30,
    });
    this._greenBtnText.anchor.set(0.5);
    this._greenBtnText.x = 325;
    this._greenBtnText.y = 390;
    this._contentContainer.addChild(this._greenBtnText);

    // 4. Top Center Subtitle ("Bonus")
    this._bonusMid = new PIXI.Text('Bonus', {
      fontFamily: font,
      fontStyle: 'italic',
      fontWeight: 'bold',
      fontSize: 32,
      fill: '#FFFFFF',
      stroke: '#C83200',
      strokeThickness: 4,
      dropShadow: true,
      dropShadowColor: '#500000',
      dropShadowBlur: 6,
      dropShadowDistance: 2,
      padding: 30,
    });
    this._bonusMid.anchor.set(0.5);
    this._bonusMid.x = 640;
    this._bonusMid.y = 215;
    this._contentContainer.addChild(this._bonusMid);

    // 5. Top Right Text ("Bonus Game", "Multiplies Your Bet")
    this._bonusTitle = new PIXI.Text('Bonus Game', {
      fontFamily: font,
      fontStyle: 'italic',
      fontWeight: 'bold',
      fontSize: 34,
      fill: '#FFFFFF',
      stroke: '#C83200',
      strokeThickness: 5,
      dropShadow: true,
      dropShadowColor: '#500000',
      dropShadowBlur: 6,
      dropShadowDistance: 2,
      padding: 30,
    });
    this._bonusTitle.anchor.set(0.5);
    this._bonusTitle.x = 960;
    this._bonusTitle.y = 135;
    this._contentContainer.addChild(this._bonusTitle);

    this._bonusSub = new PIXI.Text('Multiplies Your Bet', {
      fontFamily: font,
      fontStyle: 'italic',
      fontWeight: 'bold',
      fontSize: 30,
      fill: '#FFFFFF',
      stroke: '#C83200',
      strokeThickness: 4,
      dropShadow: true,
      dropShadowColor: '#500000',
      dropShadowBlur: 6,
      dropShadowDistance: 2,
      padding: 30,
    });
    this._bonusSub.anchor.set(0.5);
    this._bonusSub.x = 960;
    this._bonusSub.y = 175;
    this._contentContainer.addChild(this._bonusSub);

    // 6. Center Elf Subtitle ("Triggers", "The Bonus Game")
    this._trigLine1 = new PIXI.Text('Triggers', {
      fontFamily: font,
      fontStyle: 'italic',
      fontWeight: 'bold',
      fontSize: 28,
      fill: '#FFFFFF',
      stroke: '#B22200',
      strokeThickness: 4,
      dropShadow: true,
      dropShadowColor: '#400000',
      dropShadowBlur: 6,
      dropShadowDistance: 2,
      padding: 30,
    });
    this._trigLine1.anchor.set(0.5);
    this._trigLine1.x = 640;
    this._trigLine1.y = 430;
    this._contentContainer.addChild(this._trigLine1);

    this._trigLine2 = new PIXI.Text('The Bonus Game', {
      fontFamily: font,
      fontStyle: 'italic',
      fontWeight: 'bold',
      fontSize: 28,
      fill: '#FFFFFF',
      stroke: '#B22200',
      strokeThickness: 4,
      dropShadow: true,
      dropShadowColor: '#400000',
      dropShadowBlur: 6,
      dropShadowDistance: 2,
      padding: 30,
    });
    this._trigLine2.anchor.set(0.5);
    this._trigLine2.x = 640;
    this._trigLine2.y = 465;
    this._contentContainer.addChild(this._trigLine2);

    // 7. Right Card Bottom Text ("Choose your prize")
    this._choosePrizeText = new PIXI.Text('Choose your prize', {
      fontFamily: font,
      fontStyle: 'italic',
      fontWeight: 'bold',
      fontSize: 36,
      fill: '#FFFFFF',
      stroke: '#6E1A00',
      strokeThickness: 4,
      dropShadow: true,
      dropShadowColor: '#FF6600',
      dropShadowBlur: 8,
      dropShadowDistance: 0,
      padding: 30,
    });
    this._choosePrizeText.anchor.set(0.5);
    this._choosePrizeText.x = 960;
    this._choosePrizeText.y = 435;
    this._contentContainer.addChild(this._choosePrizeText);

    // 8. Big Golden Multiplier Banner ("Max Bonus Win 599×")
    this._maxWinText = new PIXI.Text('Max Bonus Win 599×', {
      fontFamily: font,
      fontStyle: 'italic',
      fontWeight: '900',
      fontSize: 54,
      fill: ['#FFF8B3', '#FFD700', '#FF9900'],
      fillGradientLinear: true,
      stroke: '#7A1C00',
      strokeThickness: 6,
      dropShadow: true,
      dropShadowColor: '#FF3300',
      dropShadowBlur: 14,
      dropShadowDistance: 0,
      padding: 40,
    });
    this._maxWinText.anchor.set(0.5);
    this._maxWinText.x = 640;
    this._maxWinText.y = 545;
    this._contentContainer.addChild(this._maxWinText);

    // 9. Start Button with "Click To Start"
    this._btnContainer = new PIXI.Container();
    this._btnContainer.x = 640;
    this._btnContainer.y = 635;

    const btnTex = this._assets.getUITexture('click_to_next');
    const sprite = new PIXI.Sprite(btnTex);
    sprite.anchor.set(0.5);
    sprite.interactive = true;
    sprite.cursor = 'pointer';

    this._btnText = new PIXI.Text('Click To Start', {
      fontFamily: font,
      fontStyle: 'italic',
      fontWeight: 'bold',
      fontSize: 30,
      fill: '#FFFFFF',
      stroke: '#9E2A00',
      strokeThickness: 3,
      dropShadow: true,
      dropShadowColor: '#300000',
      dropShadowBlur: 6,
      dropShadowDistance: 2,
      padding: 30,
    });
    this._btnText.anchor.set(0.5);

    const triggerNext = () => {
      if (this._starting) return;
      this._starting = true;
      this._onStartGame?.();
    };

    sprite.on('pointerdown', triggerNext);
    sprite.on('click', triggerNext);
    this._btnText.interactive = true;
    this._btnText.cursor = 'pointer';
    this._btnText.on('pointerdown', triggerNext);
    this._btnText.on('click', triggerNext);

    this._btnContainer.addChild(sprite);
    this._btnContainer.addChild(this._btnText);
    this._contentContainer.addChild(this._btnContainer);

    // Pulse animation for start button
    let time = 0;
    const baseScale = 0.85;
    this._pulseTicker = new PIXI.Ticker();
    this._pulseTicker.add(() => {
      time += 0.05;
      const s = baseScale + Math.sin(time) * 0.03;
      this._btnContainer.scale.set(s);
    });
    this._pulseTicker.start();
  }

  _updateLayout() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const isPortrait = h > w;

    // 1. Full-screen background backdrop image with cover scaling (using start_portrait / start_landscape)
    const bgKey = isPortrait ? 'start_portrait' : 'start_landscape';
    const bgTex = this._assets.getUITexture(bgKey);
    if (bgTex && this._bgSprite) {
      this._bgSprite.texture = bgTex;
      if (bgTex.width > 0 && bgTex.height > 0) {
        const coverScale = Math.max(w / bgTex.width, h / bgTex.height);
        this._bgSprite.width = bgTex.width * coverScale;
        this._bgSprite.height = bgTex.height * coverScale;
        this._bgSprite.x = Math.round((w - this._bgSprite.width) / 2);
        this._bgSprite.y = Math.round((h - this._bgSprite.height) / 2);
      } else {
        this._bgSprite.width = w;
        this._bgSprite.height = h;
        this._bgSprite.x = 0;
        this._bgSprite.y = 0;
      }
    }

    // 2. Set inner card background sprite inside contentContainer canvas (startpageportrait.webp / startpagelandscape.webp)
    const cardKey = isPortrait ? 'start_portrait' : 'start_landscape';
    const cardTex = this._assets.getUITexture(cardKey);
    const baseW = isPortrait ? GameConfig.PORTRAIT_WIDTH : GameConfig.WIDTH;
    const baseH = isPortrait ? GameConfig.PORTRAIT_HEIGHT : GameConfig.HEIGHT;

    if (cardTex && this._cardBgSprite) {
      this._cardBgSprite.texture = cardTex;
      this._cardBgSprite.width = baseW;
      this._cardBgSprite.height = baseH;
      this._cardBgSprite.x = 0;
      this._cardBgSprite.y = 0;
    }

    // 3. Position & scale content container inside viewport
    const scale = Math.min(w / baseW, h / baseH);
    this._contentContainer.scale.set(scale);
    this._contentContainer.x = Math.round((w - baseW * scale) / 2);
    this._contentContainer.y = Math.round((h - baseH * scale) / 2);

    // 3. Position elements for active orientation
    if (isPortrait) {
      // Portrait layout coordinates (720 x 1280 base canvas) aligned to startpageportrait.webp artwork
      if (this._brandLogo) { this._brandLogo.x = 20; this._brandLogo.y = 20; }

      // Top Section: Header above Top Blue Frame (Single line in portrait mode)
      if (this._buyTitle) { this._buyTitle.x = 275; this._buyTitle.y = 145; this._buyTitle.style.fontSize = 24; }
      if (this._buySub) { this._buySub.x = 445; this._buySub.y = 145; this._buySub.style.fontSize = 20; }

      // Inside Top Blue Frame (Pink Card & Green Button)
      if (this._pinkBuyText) { this._pinkBuyText.x = 360; this._pinkBuyText.y = 315; this._pinkBuyText.style.fontSize = 38; }
      if (this._pinkBonusGameText) { this._pinkBonusGameText.x = 360; this._pinkBonusGameText.y = 360; this._pinkBonusGameText.style.fontSize = 32; }
      if (this._greenBtnText) { this._greenBtnText.x = 360; this._greenBtnText.y = 435; this._greenBtnText.style.fontSize = 26; }

      // Middle Section: Elf & Arrows (Hidden in portrait mode)
      if (this._trigLine1) { this._trigLine1.visible = false; }
      if (this._trigLine2) { this._trigLine2.visible = false; }
      if (this._bonusMid) { this._bonusMid.visible = false; }

      // Lower Section: Bonus Game Info above Tap To Start button (Single line in portrait mode)
      if (this._bonusTitle) { this._bonusTitle.x = 275; this._bonusTitle.y = 1140; this._bonusTitle.style.fontSize = 24; }
      if (this._bonusSub) { this._bonusSub.x = 445; this._bonusSub.y = 1140; this._bonusSub.style.fontSize = 20; }

      // Inside Bottom Red Tree Frame
      if (this._choosePrizeText) { this._choosePrizeText.x = 360; this._choosePrizeText.y = 1075; this._choosePrizeText.style.fontSize = 30; }

      // Banner & CTA Button at Bottom (Max Win hidden in portrait mode)
      if (this._maxWinText) { this._maxWinText.visible = false; }
      if (this._btnContainer) { this._btnContainer.x = 360; this._btnContainer.y = 1195; }
      if (this._btnText) { this._btnText.text = 'Tap To Start'; }
    } else {
      // Landscape layout coordinates (1280 x 720 base canvas) aligned to startpagelandscape.webp
      if (this._brandLogo) { this._brandLogo.x = 24; this._brandLogo.y = 24; }
      if (this._buyTitle) { this._buyTitle.x = 360; this._buyTitle.y = 135; this._buyTitle.style.fontSize = 34; }
      if (this._buySub) { this._buySub.x = 360; this._buySub.y = 175; this._buySub.style.fontSize = 30; }
      if (this._pinkBuyText) { this._pinkBuyText.x = 360; this._pinkBuyText.y = 290; this._pinkBuyText.style.fontSize = 44; }
      if (this._pinkBonusGameText) { this._pinkBonusGameText.x = 360; this._pinkBonusGameText.y = 340; this._pinkBonusGameText.style.fontSize = 38; }
      if (this._greenBtnText) { this._greenBtnText.x = 370; this._greenBtnText.y = 390; this._greenBtnText.style.fontSize = 32; }
      if (this._bonusMid) { this._bonusMid.x = 640; this._bonusMid.y = 215; this._bonusMid.style.fontSize = 32; this._bonusMid.visible = true; }
      if (this._bonusTitle) { this._bonusTitle.x = 930; this._bonusTitle.y = 135; this._bonusTitle.style.fontSize = 34; }
      if (this._bonusSub) { this._bonusSub.x = 930; this._bonusSub.y = 175; this._bonusSub.style.fontSize = 30; }
      if (this._trigLine1) { this._trigLine1.x = 640; this._trigLine1.y = 430; this._trigLine1.style.fontSize = 28; this._trigLine1.visible = true; }
      if (this._trigLine2) { this._trigLine2.x = 640; this._trigLine2.y = 465; this._trigLine2.style.fontSize = 28; this._trigLine2.visible = true; }
      if (this._choosePrizeText) { this._choosePrizeText.x = 920; this._choosePrizeText.y = 435; this._choosePrizeText.style.fontSize = 36; }
      if (this._maxWinText) { this._maxWinText.x = 640; this._maxWinText.y = 545; this._maxWinText.style.fontSize = 54; this._maxWinText.visible = true; }
      if (this._btnContainer) { this._btnContainer.x = 640; this._btnContainer.y = 635; }
      if (this._btnText) { this._btnText.text = 'Click To Start'; }
    }
  }
}
