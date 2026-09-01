import * as PIXI from 'pixi.js';
import { SymbolConfig, SYMBOL_IDS } from '../config/SymbolConfig.js';

/**
 * MiniPaytableModal – Displays a pink mini paytable popup when a symbol on the reel grid is clicked.
 * Uses minipaytable-bg.png_80_90.png texture.
 */
export class MiniPaytableModal extends PIXI.Container {
  /**
   * @param {object} options
   * @param {Function} options.getUITexture
   * @param {Function} options.getSymbolTexture
   */
  constructor(options = {}) {
    super();

    this._getUITexture = options.getUITexture;
    this._getSymbolTexture = options.getSymbolTexture;
    this._onShow = options.onShow;
    this._onClose = options.onClose;

    this.visible = false;
    this.zIndex = 8000;

    this._buildUI();
  }

  show(symbolId, currentBet = 0.10, reelIndex = 0, rowIndex = 1, targetPos = null) {
    this._updateContent(symbolId, currentBet, reelIndex, targetPos);
    this.visible = true;
    if (this.parent) {
      this.parent.addChild(this);
    }
    this._onShow?.();
  }

  hide() {
    this.visible = false;
    this._onClose?.();
  }

  _buildUI() {
    const STAGE_W = 1280;
    const STAGE_H = 656;

    this.eventMode = 'static';

    // Full screen overlay catch to dismiss on click outside
    const overlay = new PIXI.Graphics();
    overlay.beginFill(0x000000, 0.55);
    overlay.drawRect(-2000, -2000, 6000, 6000);
    overlay.endFill();
    overlay.eventMode = 'static';
    overlay.interactive = true;
    overlay.cursor = 'pointer';
    overlay.on('pointerdown', (e) => {
      e.stopPropagation();
      this.hide();
    });
    this.addChild(overlay);

    // Main Card Container
    this._cardContainer = new PIXI.Container();
    this._cardContainer.eventMode = 'static';
    this._cardContainer.interactive = true;
    this._cardContainer.x = STAGE_W / 2;
    this._cardContainer.y = STAGE_H / 2;
    this._cardContainer.on('pointerdown', (e) => e.stopPropagation());
    this.addChild(this._cardContainer);

    // Pink Background Sprite using minipaytable-bg.png_80_90.png
    // Sized with increased width (430x165)
    const bgTex = this._getUITexture ? this._getUITexture('mini_paytable_bg') : null;
    this._bgSprite = new PIXI.Sprite(bgTex && bgTex !== PIXI.Texture.WHITE ? bgTex : PIXI.Texture.WHITE);
    this._bgSprite.anchor.set(0.5);
    this._bgSprite.width = 430;
    this._bgSprite.height = 165;
    this._cardContainer.addChild(this._bgSprite);

    // Container for dynamic content (text + symbol sprite)
    this._contentGroup = new PIXI.Container();
    this._cardContainer.addChild(this._contentGroup);
  }

  updateLayout(isPortrait = false) {
    this._isPortrait = isPortrait;
  }

  _updateContent(symbolId, bet, reelIndex = 0, targetPos = null) {
    this._contentGroup.removeChildren();

    const config = SymbolConfig[symbolId];
    if (!config) return;

    const symbolTex = this._getSymbolTexture ? this._getSymbolTexture(symbolId) : null;
    const isBonus = symbolId === SYMBOL_IDS.BONUS || config.isBonus;

    // Reel 0 (Left) & Reel 1 (Middle): Symbol on LEFT (-102.5), Text on RIGHT (+40)
    // Reel 2 (Right): Text on LEFT (-40), Symbol on RIGHT (+102.5)
    const isRightReel = reelIndex === 2;
    const offset = 102.5;

    const isPortrait = !!this._isPortrait;
    const minY = isPortrait ? 250 : 120;
    const maxY = isPortrait ? 950 : 510;
    const centerW = isPortrait ? 720 : 1280;
    const centerH = isPortrait ? 1280 : 656;

    // Position the pink card container so the symbol inside aligns directly over the clicked reel symbol
    if (targetPos && typeof targetPos.x === 'number') {
      const cardX = isRightReel ? (targetPos.x - offset) : (targetPos.x + offset);
      const cardY = Math.max(minY, Math.min(maxY, targetPos.y));
      this._cardContainer.x = cardX;
      this._cardContainer.y = cardY;
    } else {
      this._cardContainer.x = centerW / 2;
      this._cardContainer.y = centerH / 2;
    }

    const symX = isRightReel ? offset : -offset;
    const GAP = 18; // Gap in px between symbol edge and text edge

    if (isBonus) {
      // ── BONUS SYMBOL POPUP ──
      if (symbolTex) {
        const bonusSprite = new PIXI.Sprite(symbolTex);
        bonusSprite.anchor.set(0.5);
        bonusSprite.x = symX;
        bonusSprite.y = 0;

        const maxS = 130; // Match reel symbol size exactly
        const scale = Math.min(maxS / bonusSprite.texture.width, maxS / bonusSprite.texture.height);
        bonusSprite.scale.set(scale);
        this._contentGroup.addChild(bonusSprite);
      }

      // "BONUS" Text
      const bonusText = new PIXI.Text('BONUS', {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: 26,
        fontWeight: 'bold',
        fill: '#FFFFFF',
        dropShadow: true,
        dropShadowColor: '#000000',
        dropShadowBlur: 4,
        dropShadowDistance: 2,
      });
      bonusText.anchor.set(0.5);
      bonusText.y = 0;

      if (isRightReel) {
        bonusText.x = (offset - 65 - GAP) - bonusText.width * 0.5;
      } else {
        bonusText.x = (-offset + 65 + GAP) + bonusText.width * 0.5;
      }
      this._contentGroup.addChild(bonusText);
    } else {
      // ── REGULAR SYMBOL POPUP ──
      const winVal = (config.payout3 * bet).toFixed(2);

      // Text Container for "3: " + "{winVal} FUN"
      const textContainer = new PIXI.Container();
      textContainer.y = 0;

      const prefixTxt = new PIXI.Text('3: ', {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: 22,
        fontWeight: 'bold',
        fill: '#E0E0E0',
      });
      prefixTxt.anchor.set(0, 0.5);
      prefixTxt.x = 0;
      prefixTxt.y = 0;
      textContainer.addChild(prefixTxt);

      const valTxt = new PIXI.Text(`${winVal} FUN`, {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: 24,
        fontWeight: 'bold',
        fill: '#FFFFFF',
        dropShadow: true,
        dropShadowColor: '#000000',
        dropShadowBlur: 4,
        dropShadowDistance: 2,
      });
      valTxt.anchor.set(0, 0.5);
      valTxt.x = prefixTxt.width;
      valTxt.y = 0;
      textContainer.addChild(valTxt);

      const totalTextW = prefixTxt.width + valTxt.width;

      if (isRightReel) {
        // Text is to the LEFT of the symbol (symbol is at +offset)
        // Position text right edge at (+offset - 65 - GAP)
        textContainer.x = (offset - 65 - GAP) - totalTextW;
      } else {
        // Text is to the RIGHT of the symbol (symbol is at -offset)
        // Position text left edge at (-offset + 65 + GAP)
        textContainer.x = (-offset + 65 + GAP);
      }

      this._contentGroup.addChild(textContainer);

      // Symbol Sprite
      if (symbolTex) {
        const symSprite = new PIXI.Sprite(symbolTex);
        symSprite.anchor.set(0.5);
        symSprite.x = symX;
        symSprite.y = 0;

        const maxS = 130; // Match reel symbol size exactly
        const scale = Math.min(maxS / symSprite.texture.width, maxS / symSprite.texture.height);
        symSprite.scale.set(scale);
        this._contentGroup.addChild(symSprite);
      }
    }
  }
}
