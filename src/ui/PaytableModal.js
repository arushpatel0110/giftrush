import * as PIXI from 'pixi.js';
import { MathUtils } from '../utils/MathUtils.js';
import { SymbolConfig, SYMBOL_IDS } from '../config/SymbolConfig.js';
import { PortraitModalHeader } from './PortraitModalHeader.js';

/**
 * PaytableModal – Official BGaming Gift Rush Paytable & Game Rules popup.
 * Replicates exact layout, fonts, colors, preview graphics, and 5 paylines diagrams from the official game.
 */
export class PaytableModal extends PIXI.Container {
  /**
   * @param {object} options
   * @param {Function} options.getUITexture
   * @param {Function} options.getSymbolTexture
   * @param {Function} [options.onClose]
   */
  constructor(options = {}) {
    super();

    this._getUITexture = options.getUITexture;
    this._getSymbolTexture = options.getSymbolTexture;
    this._onShow = options.onShow;
    this._onClose = options.onClose;
    this._onSwitchTab = options.onSwitchTab;
    this._onSoundToggle = options.onSoundToggle;

    this.visible = false;
    this.zIndex = 10000;

    // Scrolling state
    this._scrollY = 0;
    this._maxScrollY = 0;
    this._isDraggingContent = false;
    this._dragStartY = 0;
    this._dragStartScrollY = 0;

    this._isDraggingScrollbar = false;
    this._scrollbarDragStartY = 0;
    this._scrollbarDragStartScrollY = 0;

    this._buildUI();
    this._attachWheelListener();
  }

  show(currentBet = 0.10) {
    this._currentBet = currentBet;
    this.visible = true;
    this._scrollY = 0;
    this._updateScrollPosition();
    this._onShow?.();
  }

  updateBet(bet) {
    if (bet !== undefined && bet > 0) {
      const changed = this._currentBet !== bet;
      this._currentBet = bet;
      if (changed && this.visible) {
        this._rebuildScrollContent();
        this._updateScrollPosition();
      }
    }
  }

  _rebuildScrollContent() {
    if (!this._scrollContainer) return;
    this._scrollContainer.removeChildren();

    const dragHitArea = new PIXI.Graphics();
    dragHitArea.beginFill(0x000000, 0.001);
    dragHitArea.drawRect(0, 0, this._viewportW, 1000);
    dragHitArea.endFill();
    dragHitArea.interactive = true;
    dragHitArea.cursor = 'grab';

    dragHitArea.on('pointerdown', (e) => {
      this._isDraggingContent = true;
      this._dragStartY = e.data.global.y;
      this._dragStartScrollY = this._scrollY;
      dragHitArea.cursor = 'grabbing';
    });

    this._scrollContainer.addChild(dragHitArea);

    this._buildScrollContent(this._viewportW);

    this._maxScrollY = Math.max(0, this._contentHeight - this._viewportH);

    dragHitArea.clear();
    dragHitArea.beginFill(0x000000, 0.001);
    dragHitArea.drawRect(0, 0, this._viewportW, this._contentHeight);
    dragHitArea.endFill();
  }

  hide() {
    this.visible = false;
    this._onClose?.();
  }

  updateLayout(isPortrait = false) {
    this._isPortrait = isPortrait;
    this._scrollY = 0;
    this._buildUI();
  }

  _buildUI() {
    this.removeChildren();

    const isPortrait = !!this._isPortrait;
    const pw = isPortrait ? 720 : 1280;
    const ph = isPortrait ? 1280 : 656;

    this._panel = new PIXI.Container();
    this.addChild(this._panel);

    // Full screen background - BGaming official dark charcoal grey (#202020)
    this._pBg = new PIXI.Graphics();
    this._pBg.beginFill(0x202020, 1.0);
    this._pBg.drawRect(-500, -500, pw + 1000, isPortrait ? 1580 : ph + 1000);
    this._pBg.endFill();
    this._pBg.interactive = true;
    this._pBg.on('pointerdown', (e) => e.stopPropagation());
    this._panel.addChild(this._pBg);

    // ── Viewport & Scroller ──────────────────────────────────
    const headerHeight = isPortrait ? 130 : 90;
    const vpX = isPortrait ? 20 : 40;
    const vpY = headerHeight;
    const vpW = pw - vpX * 2;
    const vpH = isPortrait ? (1080 - headerHeight) : (ph - headerHeight - 6);

    this._viewportX = vpX;
    this._viewportY = vpY;
    this._viewportW = vpW;
    this._viewportH = vpH;

    // Mask for clipping scrollable content
    const mask = new PIXI.Graphics();
    mask.beginFill(0xFFFFFF);
    mask.drawRect(vpX, vpY, vpW, vpH);
    mask.endFill();
    this.addChild(mask);

    // Scroller container holding all content
    this._scrollContainer = new PIXI.Container();
    this._scrollContainer.x = vpX;
    this._scrollContainer.y = vpY;
    this._scrollContainer.mask = mask;
    this._panel.addChild(this._scrollContainer);

    // Build inner scroll content with Paytable symbols grid FIRST
    this._buildScrollContent(vpW);

    // Calculate max scroll Y
    const totalContentH = this._contentHeight;
    this._maxScrollY = Math.max(0, totalContentH - vpH);

    // Touch / Mouse Drag interaction on scroll viewport
    const dragHitArea = new PIXI.Graphics();
    dragHitArea.beginFill(0x000000, 0.001);
    dragHitArea.drawRect(0, 0, vpW, totalContentH);
    dragHitArea.endFill();
    dragHitArea.interactive = true;
    dragHitArea.cursor = 'grab';

    dragHitArea.on('pointerdown', (e) => {
      this._isDraggingContent = true;
      this._dragStartY = e.data.global.y;
      this._dragStartScrollY = this._scrollY;
      dragHitArea.cursor = 'grabbing';
    });

    this.interactive = true;
    this.on('globalpointermove', (e) => {
      if (this._isDraggingContent) {
        const dy = e.data.global.y - this._dragStartY;
        this._scrollY = MathUtils.clamp(this._dragStartScrollY - dy, 0, this._maxScrollY);
        this._updateScrollPosition();
      } else if (this._isDraggingScrollbar) {
        const dy = e.data.global.y - this._scrollbarDragStartY;
        const trackAvailableH = vpH - this._thumbH;
        if (trackAvailableH > 0) {
          const scrollRatio = dy / trackAvailableH;
          this._scrollY = MathUtils.clamp(
            this._scrollbarDragStartScrollY + scrollRatio * this._maxScrollY,
            0,
            this._maxScrollY
          );
          this._updateScrollPosition();
        }
      }
    });

    const endDrag = () => {
      this._isDraggingContent = false;
      this._isDraggingScrollbar = false;
      dragHitArea.cursor = 'grab';
    };

    if (!this._dragListenersAttached) {
      this._dragListenersAttached = true;
      window.addEventListener('pointerup', endDrag);
      window.addEventListener('pointercancel', endDrag);
    }

    this._scrollContainer.addChildAt(dragHitArea, 0);

    // ── Scrollbar Thumb ──
    const sbTrackX = pw - 12;
    const sbTrackY = vpY;
    const sbTrackW = 3.5;
    const sbTrackH = vpH;

    this._scrollThumb = new PIXI.Graphics();
    this._scrollThumb.interactive = true;
    this._scrollThumb.cursor = 'pointer';
    this._panel.addChild(this._scrollThumb);

    this._sbTrackX = sbTrackX;
    this._sbTrackY = sbTrackY;
    this._sbTrackW = sbTrackW;
    this._sbTrackH = sbTrackH;

    this._scrollThumb.on('pointerdown', (e) => {
      e.stopPropagation();
      this._isDraggingScrollbar = true;
      this._scrollbarDragStartY = e.data.global.y;
      this._scrollbarDragStartScrollY = this._scrollY;
    });

    // ── FIXED HEADER ────
    const headerG = new PIXI.Graphics();
    headerG.beginFill(0x202020, 1.0);
    headerG.drawRect(0, isPortrait ? 70 : 0, pw, isPortrait ? 60 : headerHeight);
    headerG.endFill();
    headerG.interactive = true;
    headerG.on('pointerdown', (e) => e.stopPropagation());
    this._panel.addChild(headerG);

    if (isPortrait) {
      // Top Portrait Navigation Header Strip (5 tab icons: settings, sound, paytable, rules, history + close)
      const topNavHeader = new PortraitModalHeader({
        activeTab: 'paytable',
        getUITexture: this._getUITexture,
        onSwitchTab: (tab) => this._onSwitchTab?.(tab),
        onSoundToggle: () => this._onSoundToggle?.(),
        onClose: () => this.hide(),
      });
      topNavHeader.y = 0;
      this._panel.addChild(topNavHeader);
    }

    // Top Grass Decoration logo (topgrass.webp)
    const topGrassTex = this._getUITexture ? this._getUITexture('top_grass') : null;
    if (topGrassTex && topGrassTex !== PIXI.Texture.WHITE) {
      const grassSprite = new PIXI.Sprite(topGrassTex);
      grassSprite.anchor.set(0.5, 0.5);
      grassSprite.x = pw / 2;
      grassSprite.y = isPortrait ? 100 : 45;
      grassSprite.scale.set(isPortrait ? 0.50 : 0.55);
      this._panel.addChild(grassSprite);
    }

    // Header Close Button (✕) for Landscape
    if (!isPortrait) {
      const closeBtn = new PIXI.Text('✕', {
        fontFamily: 'Outfit, sans-serif',
        fontSize: 26,
        fill: 0x888888,
        fontWeight: 'bold',
      });
      closeBtn.anchor.set(0.5);
      closeBtn.x = pw - 35;
      closeBtn.y = 35;
      closeBtn.interactive = true;
      closeBtn.cursor = 'pointer';
      closeBtn.on('pointerdown', (e) => {
        e.stopPropagation();
        this.hide();
      });
      closeBtn.on('pointerover', () => closeBtn.style.fill = 0xFFFFFF);
      closeBtn.on('pointerout', () => closeBtn.style.fill = 0x888888);
      this._panel.addChild(closeBtn);
    }

    this._updateScrollPosition();
  }

  // ── Inner Scrollable Content ──────────────────────────────────
  _buildScrollContent(width) {
    let currY = 30;
    const isPortrait = !!this._isPortrait;
    const wrapW = Math.min(width - 30, 840);

    // Font color tokens matching high fidelity presentation:
    const COLOR_TITLE    = '#CCCCCC'; // Main section headers ("Features", "Lines", etc.)
    const COLOR_SUBTITLE = '#AAAAAA'; // Subheaders ("Bonus symbol", "Bonus Game", "Buy bonus")
    const COLOR_BODY     = '#999999'; // Description paragraph text
    const COLOR_MUTED    = '#888888'; // Line numbers text

    // Helper text creator
    const createText = (str, styleOpts, yPos) => {
      const txt = new PIXI.Text(str, styleOpts);
      txt.anchor.set(0.5, 0);
      txt.x = width / 2;
      txt.y = yPos;
      this._scrollContainer.addChild(txt);
      return txt;
    };

    // Aspect ratio fitting helper to prevent symbol squeezing/distortion
    const fitSprite = (sprite, maxW, maxH) => {
      if (!sprite.texture || !sprite.texture.width) return;
      const scale = Math.min(maxW / sprite.texture.width, maxH / sprite.texture.height);
      sprite.scale.set(scale);
    };

    // ── Top Center: Bonus Symbol (No background box) ────────────
    const bonusSymContainer = new PIXI.Container();
    bonusSymContainer.x = width / 2;
    bonusSymContainer.y = currY + (isPortrait ? 85 : 70);
    this._scrollContainer.addChild(bonusSymContainer);

    // Bonus Symbol Texture (Elf with Bonus Badge)
    const bonusTex = this._getSymbolTexture ? this._getSymbolTexture(SYMBOL_IDS.BONUS) : null;
    if (bonusTex && bonusTex !== PIXI.Texture.WHITE) {
      const bSprite = new PIXI.Sprite(bonusTex);
      bSprite.anchor.set(0.5);
      bSprite.x = 0;
      bSprite.y = 0;
      fitSprite(bSprite, isPortrait ? 220 : 175, isPortrait ? 180 : 145);
      bonusSymContainer.addChild(bSprite);
    } else {
      const bLabel = new PIXI.Text('🎁', { fontSize: isPortrait ? 90 : 75 });
      bLabel.anchor.set(0.5);
      bLabel.x = 0;
      bLabel.y = 0;
      bonusSymContainer.addChild(bLabel);
    }

    // Subtitle text under Bonus symbol: "Bonus"
    const bonusTxt = new PIXI.Text('Bonus', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: isPortrait ? 26 : 20,
      fontWeight: '600',
      fill: COLOR_SUBTITLE,
    });
    bonusTxt.anchor.set(0.5);
    bonusTxt.x = 0;
    bonusTxt.y = isPortrait ? 110 : 92;
    bonusSymContainer.addChild(bonusTxt);

    currY += isPortrait ? 245 : 215;

    // ── 8 Paying Symbols Grid (4 columns in landscape, 2 columns in portrait) ──────
    const curBet = (this._currentBet !== undefined && this._currentBet > 0) ? this._currentBet : 0.10;
    const formatPay = (mult) => `3  -  ${(curBet * mult).toFixed(2)} FUN`;

    const symbolsList = [
      { id: SYMBOL_IDS.SEVEN,       name: 'Seven',        pay: formatPay(SymbolConfig[SYMBOL_IDS.SEVEN]?.payout3 || 60) },
      { id: SYMBOL_IDS.STAR,        name: 'Star',         pay: formatPay(SymbolConfig[SYMBOL_IDS.STAR]?.payout3 || 40)  },
      { id: SYMBOL_IDS.BELL,        name: 'Bell',         pay: formatPay(SymbolConfig[SYMBOL_IDS.BELL]?.payout3 || 8)   },
      { id: SYMBOL_IDS.SANTA_HAT,   name: 'Santa Hat',    pay: formatPay(SymbolConfig[SYMBOL_IDS.SANTA_HAT]?.payout3 || 4) },
      { id: SYMBOL_IDS.CANDY_CANE,  name: 'Candy Cane',   pay: formatPay(SymbolConfig[SYMBOL_IDS.CANDY_CANE]?.payout3 || 4) },
      { id: SYMBOL_IDS.GINGERBREAD,  name: 'Gingerbread',  pay: formatPay(SymbolConfig[SYMBOL_IDS.GINGERBREAD]?.payout3 || 4) },
      { id: SYMBOL_IDS.ORNAMENT,    name: 'Ornament',     pay: formatPay(SymbolConfig[SYMBOL_IDS.ORNAMENT]?.payout3 || 4) },
      { id: SYMBOL_IDS.MITTEN,      name: 'Mitten',       pay: formatPay(SymbolConfig[SYMBOL_IDS.MITTEN]?.payout3 || 5)  },
    ];

    const cols = isPortrait ? 2 : 4;
    const itemW = isPortrait ? 310 : 250;
    const itemH = isPortrait ? 180 : 155;
    const gapX = isPortrait ? 20 : 30;
    const gapY = isPortrait ? 28 : 25;
    const gridStartX = (width - (cols * itemW + (cols - 1) * gapX)) / 2;

    symbolsList.forEach((sym, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);

      const cx = gridStartX + col * (itemW + gapX) + itemW / 2;
      const cy = currY + row * (itemH + gapY);

      const symContainer = new PIXI.Container();
      symContainer.x = cx;
      symContainer.y = cy;
      this._scrollContainer.addChild(symContainer);

      // Symbol Texture directly on dark background
      const sTex = this._getSymbolTexture ? this._getSymbolTexture(sym.id) : null;
      if (sTex && sTex !== PIXI.Texture.WHITE) {
        const sSprite = new PIXI.Sprite(sTex);
        sSprite.anchor.set(0.5);
        sSprite.x = 0;
        sSprite.y = isPortrait ? 52 : 45;
        fitSprite(sSprite, isPortrait ? 165 : 145, isPortrait ? 135 : 120);
        symContainer.addChild(sSprite);
      } else {
        const sLabel = new PIXI.Text(SymbolConfig[sym.id]?.label || '?', { fontSize: isPortrait ? 68 : 58 });
        sLabel.anchor.set(0.5);
        sLabel.x = 0;
        sLabel.y = isPortrait ? 52 : 45;
        symContainer.addChild(sLabel);
      }

      // Payout text directly below symbol
      const payTxt = new PIXI.Text(sym.pay, {
        fontFamily: 'Outfit, sans-serif',
        fontSize: isPortrait ? 23 : 18,
        fontWeight: 'bold',
        fill: '#AAAAAA',
      });
      payTxt.anchor.set(0.5);
      payTxt.x = 0;
      payTxt.y = isPortrait ? 142 : 120;
      symContainer.addChild(payTxt);
    });

    const gridRows = Math.ceil(symbolsList.length / cols);
    currY += gridRows * (itemH + gapY) + (isPortrait ? 55 : 45);

    // ── 2. FEATURES SECTION ─────────────────────────────────────
    createText('Features', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: isPortrait ? 34 : 28,
      fontWeight: 'bold',
      fill: COLOR_TITLE,
    }, currY);
    currY += isPortrait ? 58 : 50;

    createText('Bonus symbol', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: isPortrait ? 26 : 21,
      fontWeight: '600',
      fill: COLOR_SUBTITLE,
    }, currY);
    currY += isPortrait ? 46 : 40;

    // Feature Graphic: Mini Slot Preview with 3 Bonus Symbols landing on reels 1-2-3
    const slotPreview = this._createSlotPreview(width);
    slotPreview.y = currY;
    this._scrollContainer.addChild(slotPreview);
    currY += Math.max(isPortrait ? 240 : 200, Math.ceil(slotPreview.height)) + (isPortrait ? 30 : 25);

    const txt1 = createText('3 Bonus symbols on reels 1-2-3 trigger the Bonus game.', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: isPortrait ? 22 : 17,
      fill: COLOR_BODY,
      align: 'center',
      wordWrap: true,
      wordWrapWidth: wrapW,
      lineHeight: isPortrait ? 32 : 26,
    }, currY);
    currY += txt1.height + (isPortrait ? 40 : 30);

    // ── 3. BONUS GAME SECTION ───────────────────────────────────
    createText('Bonus Game', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: isPortrait ? 26 : 21,
      fontWeight: '600',
      fill: COLOR_SUBTITLE,
    }, currY);
    currY += isPortrait ? 46 : 40;

    // Bonus Game Preview Graphic: Background + Gifts + "Choose your prize" text
    const bonusPreview = this._createBonusPreview(width);
    bonusPreview.y = currY;
    this._scrollContainer.addChild(bonusPreview);
    currY += Math.max(isPortrait ? 240 : 200, Math.ceil(bonusPreview.height)) + (isPortrait ? 30 : 25);

    const txt2 = createText(
      'In the Bonus game a player should choose one of 5 gifts appeared on the screen. ' +
      'A player clicks on any of the gifts and learns the amount of his/her win. ' +
      'The maximum winning amount in the Bonus round is x599 of the bet.',
      {
        fontFamily: 'Outfit, sans-serif',
        fontSize: isPortrait ? 22 : 17,
        fill: COLOR_BODY,
        align: 'center',
        wordWrap: true,
        wordWrapWidth: wrapW,
        lineHeight: isPortrait ? 32 : 26,
      },
      currY
    );
    currY += txt2.height + (isPortrait ? 40 : 30);

    // ── 4. BUY BONUS SECTION ────────────────────────────────────
    createText('Buy bonus', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: isPortrait ? 26 : 21,
      fontWeight: '600',
      fill: COLOR_SUBTITLE,
    }, currY);
    currY += isPortrait ? 46 : 40;

    const txt3 = createText(
      'A player can buy the Bonus game at the price pictured on the button. ' +
      'The next spin after the purchase triggers the Bonus game.',
      {
        fontFamily: 'Outfit, sans-serif',
        fontSize: isPortrait ? 22 : 17,
        fill: COLOR_BODY,
        align: 'center',
        wordWrap: true,
        wordWrapWidth: wrapW,
        lineHeight: isPortrait ? 32 : 26,
      },
      currY
    );
    currY += txt3.height + (isPortrait ? 45 : 30);

    // ── 5. LINES SECTION ────────────────────────────────────────
    createText('Lines', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: isPortrait ? 34 : 28,
      fontWeight: 'bold',
      fill: COLOR_TITLE,
    }, currY);
    currY += isPortrait ? 58 : 50;

    // 5 Mini Payline Grid Diagrams
    const linesDiagrams = this._createLinesDiagrams(width, COLOR_MUTED);
    linesDiagrams.y = currY;
    this._scrollContainer.addChild(linesDiagrams);
    currY += (isPortrait ? 130 : 100) + 70; // 130px diagram height + 70px bottom padding

    this._contentHeight = currY;
  }

  // ── Slot Machine Preview Graphic (Features -> Bonus symbol) ──
  _createSlotPreview(width) {
    const container = new PIXI.Container();
    const isPortrait = !!this._isPortrait;
    const targetW = isPortrait ? 580 : 460;
    const f1Tex = this._getUITexture ? this._getUITexture('feature_1') : null;
    if (f1Tex && f1Tex !== PIXI.Texture.WHITE) {
      const sprite = new PIXI.Sprite(f1Tex);
      sprite.anchor.set(0.5, 0);
      sprite.x = width / 2;
      sprite.y = 0;
      if (sprite.texture && sprite.texture.width) {
        const scale = targetW / sprite.texture.width;
        sprite.scale.set(scale);
      }
      container.addChild(sprite);
      return container;
    }

    const pw = isPortrait ? 580 : 500;
    const ph = isPortrait ? 300 : 270;
    container.x = (width - pw) / 2;

    // Background glow box
    const bgG = new PIXI.Graphics();
    bgG.beginFill(0x282828, 0.95);
    bgG.lineStyle(1.5, 0x3E3E3E, 1);
    bgG.drawRoundedRect(0, 0, pw, ph, 16);
    bgG.endFill();
    container.addChild(bgG);

    // Frame Texture or Decoration around reels
    const frameTex = this._getUITexture ? this._getUITexture('reels_frame') : null;
    if (frameTex && frameTex !== PIXI.Texture.WHITE) {
      const frameSprite = new PIXI.Sprite(frameTex);
      frameSprite.anchor.set(0.5);
      frameSprite.x = pw / 2 + 15;
      frameSprite.y = ph / 2;
      frameSprite.width = isPortrait ? 450 : 390;
      frameSprite.height = isPortrait ? 260 : 230;
      container.addChild(frameSprite);
    }

    // Buy Bonus Button image on Left side of reels preview
    const buyBonusTex = this._getUITexture ? this._getUITexture('buy_bonus') : null;
    if (buyBonusTex && buyBonusTex !== PIXI.Texture.WHITE) {
      const buySprite = new PIXI.Sprite(buyBonusTex);
      buySprite.anchor.set(0.5);
      buySprite.x = isPortrait ? 55 : 48;
      buySprite.y = ph / 2;
      buySprite.width = isPortrait ? 85 : 75;
      buySprite.height = isPortrait ? 125 : 110;
      container.addChild(buySprite);
    }

    // 3x3 Mini Symbol Grid inside reel frame
    const gridCols = 3;
    const gridRows = 3;
    const symSize = isPortrait ? 68 : 58;
    const gap = isPortrait ? 12 : 10;
    const startX = pw / 2 - (gridCols * (symSize + gap) - gap) / 2 + 12;
    const startY = ph / 2 - (gridRows * (symSize + gap) - gap) / 2;

    // Symbol layout representation: Bonus symbol elf in center cell (1, 1)!
    const miniGrid = [
      [SYMBOL_IDS.MITTEN,   SYMBOL_IDS.CANDY_CANE, SYMBOL_IDS.SEVEN],
      [SYMBOL_IDS.ORNAMENT, SYMBOL_IDS.BONUS,      SYMBOL_IDS.STAR],
      [SYMBOL_IDS.GINGERBREAD, SYMBOL_IDS.SANTA_HAT, SYMBOL_IDS.BELL],
    ];

    for (let r = 0; r < gridRows; r++) {
      for (let c = 0; c < gridCols; c++) {
        const id = miniGrid[r][c];
        const cx = startX + c * (symSize + gap) + symSize / 2;
        const cy = startY + r * (symSize + gap) + symSize / 2;

        // Red radial glow behind center Bonus symbol
        if (id === SYMBOL_IDS.BONUS) {
          const glowG = new PIXI.Graphics();
          glowG.beginFill(0xFF0033, 0.4);
          glowG.drawCircle(cx, cy, symSize * 0.7);
          glowG.endFill();
          container.addChild(glowG);
        }

        const sTex = this._getSymbolTexture ? this._getSymbolTexture(id) : null;
        if (sTex && sTex !== PIXI.Texture.WHITE) {
          const sprite = new PIXI.Sprite(sTex);
          sprite.anchor.set(0.5);
          sprite.x = cx;
          sprite.y = cy;
          if (sprite.texture && sprite.texture.width) {
            const scale = Math.min(symSize / sprite.texture.width, symSize / sprite.texture.height);
            sprite.scale.set(scale);
          }
          container.addChild(sprite);
        }
      }
    }

    return container;
  }

  // ── Bonus Game Preview Graphic (Features -> Bonus Game) ─────
  _createBonusPreview(width) {
    const container = new PIXI.Container();
    const isPortrait = !!this._isPortrait;
    const targetW = isPortrait ? 580 : 460;
    const f2Tex = this._getUITexture ? this._getUITexture('feature_2') : null;
    if (f2Tex && f2Tex !== PIXI.Texture.WHITE) {
      const sprite = new PIXI.Sprite(f2Tex);
      sprite.anchor.set(0.5, 0);
      sprite.x = width / 2;
      sprite.y = 0;
      if (sprite.texture && sprite.texture.width) {
        const scale = targetW / sprite.texture.width;
        sprite.scale.set(scale);
      }
      container.addChild(sprite);
      return container;
    }

    const pw = isPortrait ? 580 : 500;
    const ph = isPortrait ? 280 : 250;
    container.x = (width - pw) / 2;

    // Background box
    const bgG = new PIXI.Graphics();
    bgG.beginFill(0x282828, 0.95);
    bgG.lineStyle(1.5, 0x3E3E3E, 1);
    bgG.drawRoundedRect(0, 0, pw, ph, 16);
    bgG.endFill();
    container.addChild(bgG);

    // Bonus tree background
    const bonusBgTex = this._getUITexture ? this._getUITexture('bonus_bg') : null;
    if (bonusBgTex && bonusBgTex !== PIXI.Texture.WHITE) {
      const bgSprite = new PIXI.Sprite(bonusBgTex);
      bgSprite.anchor.set(0.5);
      bgSprite.x = pw / 2;
      bgSprite.y = ph / 2;
      bgSprite.width = pw - 24;
      bgSprite.height = ph - 24;
      container.addChild(bgSprite);
    }

    // Interactive Gift Box Icons on bonus background
    const giftKeys = ['gift1open', 'gift2open', 'gift3open', 'gift4open', 'gift5open'];
    const giftPositions = [
      { x: pw * 0.25, y: ph * 0.35 },
      { x: pw * 0.50, y: ph * 0.30 },
      { x: pw * 0.75, y: ph * 0.35 },
      { x: pw * 0.35, y: ph * 0.65 },
      { x: pw * 0.65, y: ph * 0.65 },
    ];

    giftPositions.forEach((pos, idx) => {
      const tex = this._getUITexture ? this._getUITexture(giftKeys[idx]) : null;
      if (tex && tex !== PIXI.Texture.WHITE) {
        const giftSprite = new PIXI.Sprite(tex);
        giftSprite.anchor.set(0.5);
        giftSprite.x = pos.x;
        giftSprite.y = pos.y;
        giftSprite.width = isPortrait ? 70 : 60;
        giftSprite.height = isPortrait ? 70 : 60;
        container.addChild(giftSprite);
      }
    });

    // "Choose your prize" overlay title
    const chooseText = new PIXI.Text('Choose your prize', {
      fontFamily: '"Magnolia Script", "Outfit", cursive, sans-serif',
      fontSize: isPortrait ? 38 : 32,
      fill: '#FFFFFF',
      fontStyle: 'italic',
      fontWeight: 'bold',
      dropShadow: true,
      dropShadowColor: '#FF0055',
      dropShadowBlur: 10,
      dropShadowDistance: 0,
      stroke: '#330011',
      strokeThickness: 4,
    });
    chooseText.anchor.set(0.5);
    chooseText.x = pw / 2;
    chooseText.y = ph * 0.78;
    container.addChild(chooseText);

    return container;
  }

  // ── 5 Paylines Mini Grid Diagrams ───────────────────────────
  _createLinesDiagrams(width, labelColor) {
    const container = new PIXI.Container();
    const isPortrait = !!this._isPortrait;

    // 5 paylines definition (3x3 grid matrix coordinates [row, col])
    const lines = [
      { name: 'Line 1', coords: [[0, 0], [0, 1], [0, 2]] },
      { name: 'Line 2', coords: [[1, 0], [1, 1], [1, 2]] },
      { name: 'Line 3', coords: [[2, 0], [2, 1], [2, 2]] },
      { name: 'Line 4', coords: [[0, 0], [1, 1], [2, 2]] },
      { name: 'Line 5', coords: [[2, 0], [1, 1], [0, 2]] },
    ];

    const diagW = isPortrait ? 105 : 85;
    const gapX = isPortrait ? 20 : 40;
    const totalW = lines.length * diagW + (lines.length - 1) * gapX;
    const startX = (width - totalW) / 2;

    lines.forEach((line, idx) => {
      const lx = startX + idx * (diagW + gapX);
      const group = new PIXI.Container();
      group.x = lx;
      container.addChild(group);

      // Label text above diagram
      const lbl = new PIXI.Text(line.name, {
        fontFamily: 'Outfit, sans-serif',
        fontSize: isPortrait ? 20 : 16,
        fill: labelColor,
        fontWeight: 'bold',
      });
      lbl.anchor.set(0.5, 0);
      lbl.x = diagW / 2;
      lbl.y = 0;
      group.addChild(lbl);

      // 3x3 Mini Grid diagram
      const cellW = isPortrait ? 28 : 22;
      const cellH = isPortrait ? 20 : 16;
      const cellGap = isPortrait ? 5 : 4;
      const gridY = isPortrait ? 34 : 28;

      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const isActive = line.coords.some(([lr, lc]) => lr === r && lc === c);
          const cx = c * (cellW + cellGap);
          const cy = gridY + r * (cellH + cellGap);
          const cellG = new PIXI.Graphics();
          cellG.beginFill(isActive ? 0xFFCC00 : 0x444444);
          cellG.drawRoundedRect(cx, cy, cellW, cellH, 3);
          cellG.endFill();
          group.addChild(cellG);
        }
      }
    });

    return container;
  }

  // ── Scrolling Helper Methods ─────────────────────────────────
  _attachWheelListener() {
    this._onWheel = (e) => {
      if (!this.visible) return;
      e.preventDefault();
      this._scrollBy(e.deltaY * 0.7);
    };

    window.addEventListener('wheel', this._onWheel, { passive: false });
  }

  _scrollBy(delta) {
    this._scrollY = MathUtils.clamp(this._scrollY + delta, 0, this._maxScrollY);
    this._updateScrollPosition();
  }

  _updateScrollPosition() {
    if (this._scrollContainer) {
      this._scrollContainer.y = (this._viewportY ?? 90) - this._scrollY;
    }

    if (this._scrollThumb && this._sbTrackH) {
      const vpH = this._viewportH;
      const totalH = this._contentHeight || (vpH + 1);

      const thumbH = Math.max(35, Math.min(75, (vpH / totalH) * this._sbTrackH));
      this._thumbH = thumbH;

      const trackAvailableH = this._sbTrackH - thumbH;
      const scrollRatio = this._maxScrollY > 0 ? this._scrollY / this._maxScrollY : 0;
      const thumbY = this._sbTrackY + scrollRatio * trackAvailableH;

      this._scrollThumb.clear();
      this._scrollThumb.beginFill(0x666666, 0.75);
      this._scrollThumb.drawRoundedRect(this._sbTrackX, thumbY, this._sbTrackW, thumbH, 2);
      this._scrollThumb.endFill();
    }
  }
}
