import * as PIXI from 'pixi.js';
import { GameConfig } from '../config/GameConfig.js';
import { PortraitModalHeader } from './PortraitModalHeader.js';

/**
 * BetSelectionModal – Mobile portrait bet selection popup matching BGaming Gift Rush style.
 * Displays top navigation bar with topgrass header logo, "Total Bet" title,
 * and a 3-column grid of bet tiles with selected state highlight.
 */
export class BetSelectionModal extends PIXI.Container {
  /**
   * @param {object} options
   *   getUITexture - function(name)
   *   onBetChange  - function(betValue)
   *   onClose      - function()
   *   onSwitchTab  - function(tabKey)
   *   onSoundToggle- function()
   */
  constructor(options = {}) {
    super();

    this._getUITexture = options.getUITexture || null;
    this._onBetChange = options.onBetChange;
    this._onShow = options.onShow;
    this._onClose = options.onClose;
    this._onSwitchTab = options.onSwitchTab;
    this._onSoundToggle = options.onSoundToggle;

    this._steps = GameConfig.BET_STEPS || [0.10, 0.20, 0.30, 0.50, 0.70, 1.00, 1.50, 2.00, 3.00, 4.00, 5.00, 7.00, 10.00, 15.00, 20.00, 30.00, 50.00, 70.00];
    this._currentBet = GameConfig.BET_STEPS[GameConfig.DEFAULT_BET_INDEX] || 0.10;
    this._isPortrait = true;

    this.visible = false;
    this.zIndex = 9998;

    this._buildUI();
  }

  show(currentBet) {
    if (currentBet !== undefined && currentBet > 0) {
      this._currentBet = currentBet;
    }
    this.visible = true;
    this._updateGridTileStates();
    this._onShow?.();
  }

  hide() {
    this.visible = false;
    this._onClose?.();
  }

  updateBet(bet) {
    if (bet !== undefined && bet > 0) {
      this._currentBet = bet;
      this._updateGridTileStates();
    }
  }

  updateLayout(isPortrait = false) {
    this._isPortrait = isPortrait;
    this.removeChildren();
    this._buildUI();
  }

  _buildUI() {
    this.removeChildren();

    const isPortrait = !!this._isPortrait;
    const pw = isPortrait ? 720 : 1280;
    const ph = isPortrait ? 1280 : 656;

    // ── 1. Full Screen Backdrop ──────────────────────────────
    const backdrop = new PIXI.Graphics();
    backdrop.beginFill(0x202020, 1.0);
    backdrop.drawRect(-500, -500, pw + 1000, isPortrait ? 1580 : ph + 1000);
    backdrop.endFill();
    backdrop.interactive = true;
    backdrop.on('pointerdown', (e) => e.stopPropagation());
    this.addChild(backdrop);

    if (!isPortrait) {
      // If triggered in landscape, fall back gracefully with simple close
      const closeArea = new PIXI.Graphics();
      closeArea.beginFill(0x000000, 0.5);
      closeArea.drawRect(-500, -500, pw + 1000, ph + 1000);
      closeArea.endFill();
      closeArea.interactive = true;
      closeArea.on('pointerdown', (e) => {
        e.stopPropagation();
        this.hide();
      });
      this.addChild(closeArea);
    }

    // ── 2. Top Portrait Navigation Header Strip ──────────────
    const topNavHeader = new PortraitModalHeader({
      activeTab: null,
      getUITexture: this._getUITexture,
      onSwitchTab: (tab) => this._onSwitchTab?.(tab),
      onSoundToggle: () => this._onSoundToggle?.(),
      onClose: () => this.hide(),
    });
    topNavHeader.y = 0;
    this.addChild(topNavHeader);

    // Fixed dark header background strip below top nav
    const headerG = new PIXI.Graphics();
    headerG.beginFill(0x202020, 1.0);
    headerG.drawRect(0, 70, pw, 60);
    headerG.endFill();
    headerG.interactive = true;
    headerG.on('pointerdown', (e) => e.stopPropagation());
    this.addChild(headerG);

    // ── 3. Top Grass Decoration Logo (topgrass.webp) ─────────
    const topGrassTex = this._getUITexture ? this._getUITexture('top_grass') : null;
    if (topGrassTex && topGrassTex !== PIXI.Texture.WHITE) {
      const grassSprite = new PIXI.Sprite(topGrassTex);
      grassSprite.anchor.set(0.5, 0.5);
      grassSprite.x = pw / 2;
      grassSprite.y = 100;
      grassSprite.scale.set(0.50);
      this.addChild(grassSprite);
    }

    // ── 4. Title Text: "Total Bet" ───────────────────────────
    const titleTxt = new PIXI.Text('Total Bet', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: 28,
      fill: '#FFFFFF',
      fontWeight: 'bold',
    });
    titleTxt.anchor.set(0.5, 0);
    titleTxt.x = pw / 2;
    titleTxt.y = 210;
    this.addChild(titleTxt);

    // ── 5. Bet Selection Grid (3 Columns) ─────────────────────
    const cols = 3;
    const tileW = 175;
    const tileH = 75;
    const gapX = 16;
    const gapY = 16;

    const totalGridW = cols * tileW + (cols - 1) * gapX;
    const startX = (pw - totalGridW) / 2;
    const startY = 285;

    this._gridTiles = [];

    this._steps.forEach((betVal, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);

      const tx = startX + col * (tileW + gapX);
      const ty = startY + row * (tileH + gapY);

      const tileContainer = new PIXI.Container();
      tileContainer.x = tx;
      tileContainer.y = ty;
      tileContainer.interactive = true;
      tileContainer.cursor = 'pointer';

      // Background Graphic
      const tileBg = new PIXI.Graphics();
      tileContainer.addChild(tileBg);

      // Amount Label
      const txt = new PIXI.Text(betVal.toFixed(2), {
        fontFamily: 'Outfit, sans-serif',
        fontSize: 24,
        fill: '#DDDDDD',
        fontWeight: '600',
      });
      txt.anchor.set(0.5);
      txt.x = tileW / 2;
      txt.y = tileH / 2;
      tileContainer.addChild(txt);

      // Hover interaction
      tileContainer.on('pointerover', () => {
        if (Math.abs(this._currentBet - betVal) > 0.001) {
          tileBg.clear();
          tileBg.beginFill(0x4A4A4A, 1.0);
          tileBg.drawRoundedRect(0, 0, tileW, tileH, 8);
          tileBg.endFill();
          txt.style.fill = '#FFFFFF';
        }
      });

      tileContainer.on('pointerout', () => {
        this._renderTileState(betVal, tileBg, txt, tileW, tileH);
      });

      // Click interaction
      tileContainer.on('pointerdown', (e) => {
        e.stopPropagation();
        this._selectBet(betVal);
      });

      this.addChild(tileContainer);
      this._gridTiles.push({ betVal, bg: tileBg, txt, tileW, tileH });
    });

    this._updateGridTileStates();
  }

  _renderTileState(betVal, bgGraphics, txtObject, tileW, tileH) {
    const isSelected = Math.abs(this._currentBet - betVal) < 0.001;
    bgGraphics.clear();

    if (isSelected) {
      // Selected tile state: Darker highlight background matching screenshot
      bgGraphics.beginFill(0x222222, 1.0);
      bgGraphics.lineStyle(2, 0x777777, 1.0);
      bgGraphics.drawRoundedRect(0, 0, tileW, tileH, 8);
      bgGraphics.endFill();
      txtObject.style.fill = '#FFFFFF';
      txtObject.style.fontWeight = 'bold';
    } else {
      // Normal tile state: Charcoal grey
      bgGraphics.beginFill(0x383838, 1.0);
      bgGraphics.lineStyle(1.5, 0x2A2A2A, 0.8);
      bgGraphics.drawRoundedRect(0, 0, tileW, tileH, 8);
      bgGraphics.endFill();
      txtObject.style.fill = '#DDDDDD';
      txtObject.style.fontWeight = '600';
    }
  }

  _updateGridTileStates() {
    if (!this._gridTiles) return;
    this._gridTiles.forEach(({ betVal, bg, txt, tileW, tileH }) => {
      this._renderTileState(betVal, bg, txt, tileW, tileH);
    });
  }

  _selectBet(betVal) {
    this._currentBet = betVal;
    this._updateGridTileStates();
    this._onBetChange?.(betVal);
    this.hide();
  }
}
