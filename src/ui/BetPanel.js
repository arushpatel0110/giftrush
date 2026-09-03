import * as PIXI from 'pixi.js';
import { GameConfig } from '../config/GameConfig.js';
import { MathUtils } from '../utils/MathUtils.js';
import { AnimationUtils } from '../utils/AnimationUtils.js';

/**
 * BetPanel – Official Gift Rush bet control panel with vertical scrollable bet selection popup menu.
 */
export class BetPanel extends PIXI.Container {
  constructor(onBetChange, getUITexture, onOpenPortraitBetModal, onLandscapeInteract) {
    super();
    this._steps = GameConfig.BET_STEPS;
    this._stepIdx = GameConfig.DEFAULT_BET_INDEX;
    this._onChange = onBetChange;
    this._getUITexture = getUITexture;
    this._onOpenPortraitBetModal = onOpenPortraitBetModal;
    this._onLandscapeInteract = onLandscapeInteract;
    this._isMenuOpen = false;
    this._scrollY = 0;
    this._isDragging = false;

    this._enabled = true;
    this._isPortrait = false;
    this._buildUI();
  }

  get currentBet() { return this._steps[this._stepIdx]; }

  setBet(v) {
    const idx = this._steps.findIndex((step) => Math.abs(step - v) < 0.001);
    if (idx !== -1) {
      this._stepIdx = idx;
      this._updateDisplay();
    }
  }

  setEnabled(enabled) {
    this._enabled = enabled;
    this._clickableArea.interactive = enabled;
    this._btnUp.interactive = enabled;
    this._btnDown.interactive = enabled;
    this.alpha = enabled ? 1 : 0.5;
    if (!enabled) this._closeMenu();
    this._updateBgTexture();
  }

  _buildUI() {
    // ── Asset Background (totalbetbg.webp) ──────────────────────
    const bgTex = this._getUITexture ? this._getUITexture('total_bet_bg') : null;
    if (bgTex && bgTex !== PIXI.Texture.WHITE) {
      this._bgSprite = new PIXI.Sprite(bgTex);
      this._bgSprite.width = 130;
      this._bgSprite.height = 60;
      this._bgSprite.x = -5;
      this._bgSprite.y = -7;
      this.addChild(this._bgSprite);
    }

    // ── Clickable background for bet box ───────────────────────
    this._clickableArea = new PIXI.Graphics();
    this._clickableArea.beginFill(0x000000, 0.001); // invisible touch target
    this._clickableArea.drawRect(0, 0, 150, 48);
    this._clickableArea.endFill();
    this._clickableArea.interactive = true;
    this._clickableArea.cursor = 'pointer';
    this.addChild(this._clickableArea);

    // ── Label: "Total bet" ──────────────────────────────────────
    this._lbl = new PIXI.Text('Total bet', {
      fontFamily: 'sans-serif',
      fontSize: 18,
      fill: 0xCCCCCC,
      fontWeight: '200',
    });
    this._lbl.anchor.set(0.5, 0);
    this._lbl.x = 60;
    this._lbl.y = 2;
    this.addChild(this._lbl);

    // ── Display value: "0.20 FUN" ──────────────────────────────
    this._betText = new PIXI.Text('', {
      fontFamily: 'sans-serif',
      fontSize: 18,
      fill: 0xFFFFFF,
      fontWeight: '200',
    });
    this._betText.anchor.set(0.5, 0);
    this._betText.x = 60;
    this._betText.y = 24;
    this.addChild(this._betText);

    // ── Stacked Arrow Buttons (▲ / ▼) on right ─────────────────
    this._btnUp = this._makeArrowBtn('▲', 130, -6, () => { this._onLandscapeInteract?.(); this._step(1); });
    this._btnDown = this._makeArrowBtn('▼', 130, 24, () => { this._onLandscapeInteract?.(); this._step(-1); });
    this.addChild(this._btnUp, this._btnDown);

    // Toggle menu when clicking on bet label / amount / background
    this._clickableArea.on('pointerdown', (e) => {
      e.stopPropagation();
      if (this._isPortrait) {
        this._onOpenPortraitBetModal?.();
      } else {
        this._onLandscapeInteract?.();
        this._toggleMenu();
      }
    });

    // Build the popup menu
    this._buildPopupMenu();

    this._updateDisplay();

    // ── Font-load guard ─────────────────────────────────────────
    // When the game opens directly in landscape, "Roboto Condensed" may not
    // be loaded yet at construction time. PIXI bakes glyphs at first render,
    // so if the font isn't ready it falls back to the system sans-serif and
    // uses wrong metrics. Once fonts are ready we force a style flush so PIXI
    // re-bakes the text with the correct typeface.
    document.fonts.ready.then(() => {
      if (this._isPortrait) {
        if (this._betText && !this._betText.destroyed) {
          this._betText.style.fontFamily = 'sans-serif';
          this._betText.style.fontFamily = '"Roboto Condensed", sans-serif';
        }
        if (this._lbl && !this._lbl.destroyed) {
          this._lbl.style.fontFamily = 'sans-serif';
          this._lbl.style.fontFamily = '"Roboto Condensed", sans-serif';
        }
      }
    });
  }

  _buildPopupMenu() {
    this._popupMenu = new PIXI.Container();
    this._popupMenu.visible = false;

    const itemH = 24;
    const menuW = 130;
    const numItems = this._steps.length;
    const totalH = numItems * itemH;
    const maxVisibleItems = 15;
    const viewH = Math.min(totalH, maxVisibleItems * itemH);

    this._itemH = itemH;
    this._menuW = menuW;
    this._viewH = viewH;
    this._totalH = totalH;
    this._maxScrollY = Math.max(0, totalH - viewH);

    // Position popup window directly above total bet box
    this._popupMenu.x = -5;
    this._popupMenu.y = -viewH - 7;
    this.addChild(this._popupMenu);

    // Outer Background
    const menuBg = new PIXI.Graphics();
    menuBg.beginFill(0x383838, 0.96);
    menuBg.lineStyle(1, 0x222222, 0.8);
    menuBg.drawRect(0, 0, menuW, viewH);
    menuBg.endFill();
    menuBg.interactive = true;
    menuBg.cursor = 'grab';
    this._popupMenu.addChild(menuBg);

    // Mask for viewport
    const maskG = new PIXI.Graphics();
    maskG.beginFill(0xFFFFFF);
    maskG.drawRect(0, 0, menuW, viewH);
    maskG.endFill();
    this._popupMenu.addChild(maskG);

    // Scroll Content Container
    this._scrollContent = new PIXI.Container();
    this._scrollContent.mask = maskG;
    this._popupMenu.addChild(this._scrollContent);

    // Scrollbar Track & Thumb
    this._scrollbarTrack = new PIXI.Graphics();
    this._popupMenu.addChild(this._scrollbarTrack);

    this._rowContainers = [];

    // Order items from highest at top (300.00) down to lowest at bottom (0.10)
    for (let i = 0; i < numItems; i++) {
      const stepIndex = numItems - 1 - i;
      const val = this._steps[stepIndex];

      const rowContainer = new PIXI.Container();
      rowContainer.y = i * itemH;
      rowContainer.interactive = true;
      rowContainer.cursor = 'pointer';

      // Row background
      const rBg = new PIXI.Graphics();
      rowContainer.addChild(rBg);

      // Bottom separator line
      const sep = new PIXI.Graphics();
      sep.lineStyle(1, 0x2B2B2B, 0.8);
      sep.moveTo(0, itemH);
      sep.lineTo(menuW, itemH);
      rowContainer.addChild(sep);

      // Text label
      const txt = new PIXI.Text(val.toFixed(2), {
        fontFamily: 'Outfit, sans-serif',
        fontSize: 13,
        fontWeight: 'normal',
        fill: 0xFFFFFF,
      });
      txt.anchor.set(0.5);
      txt.x = menuW / 2;
      txt.y = itemH / 2;
      rowContainer.addChild(txt);

      // Click event
      rowContainer.on('pointerdown', (e) => {
        if (this._isDragging) return;
        e.stopPropagation();
        this._selectStep(stepIndex);
        this._closeMenu();
      });

      // Hover events
      rowContainer.on('pointerover', () => {
        if (stepIndex !== this._stepIdx) {
          rBg.clear();
          rBg.beginFill(0x4A4A4A);
          rBg.drawRect(0, 0, menuW, itemH);
          rBg.endFill();
          txt.style.fill = 0xFFFFFF;
        }
      });

      rowContainer.on('pointerout', () => {
        this._renderRowState(stepIndex, i, rBg, txt, itemH, menuW);
      });

      this._scrollContent.addChild(rowContainer);
      this._rowContainers.push({ stepIndex, container: rowContainer, bg: rBg, txt, itemH, menuW, rowIdx: i });
    }

    // Drag scrolling on menu background & content
    let startY = 0;
    let startScroll = 0;

    const onPointerDown = (e) => {
      e.stopPropagation();
      this._isDragging = false;
      startY = e.data.global.y;
      startScroll = this._scrollY;

      const onPointerMove = (me) => {
        const dy = me.data.global.y - startY;
        if (Math.abs(dy) > 4) this._isDragging = true;
        this._setScrollY(startScroll - dy);
      };

      const onPointerUp = () => {
        menuBg.off('pointermove', onPointerMove);
        menuBg.off('pointerup', onPointerUp);
        menuBg.off('pointerupoutside', onPointerUp);
      };

      menuBg.on('pointermove', onPointerMove);
      menuBg.on('pointerup', onPointerUp);
      menuBg.on('pointerupoutside', onPointerUp);
    };

    menuBg.on('pointerdown', onPointerDown);

    // Mouse wheel scrolling
    window.addEventListener('wheel', (e) => {
      if (this._isMenuOpen) {
        this._setScrollY(this._scrollY + (e.deltaY > 0 ? 30 : -30));
      }
    }, { passive: true });

    // Initial scroll position: default to showing 20.00 at top of visible box down to 0.10
    this._setScrollToDefaultView();
  }

  _setScrollToDefaultView() {
    const idx20 = this._steps.indexOf(20.00);
    if (idx20 !== -1) {
      const rowIdx20 = this._steps.length - 1 - idx20;
      this._setScrollY(rowIdx20 * this._itemH);
    } else {
      this._setScrollY(this._maxScrollY);
    }
  }

  _setScrollY(val) {
    this._scrollY = MathUtils.clamp(val, 0, this._maxScrollY);
    this._updateScrollPosition();
  }

  _updateScrollPosition() {
    if (!this._scrollContent) return;
    this._scrollContent.y = -this._scrollY;

    if (this._scrollbarTrack) {
      this._scrollbarTrack.clear();
    }
  }

  _renderRowState(stepIndex, rowIdx, bgGraphics, txtObject, itemH, menuW) {
    const isSelected = (stepIndex === this._stepIdx);
    bgGraphics.clear();
    if (isSelected) {
      bgGraphics.beginFill(0x222222);
      bgGraphics.drawRect(0, 0, menuW, itemH);
      bgGraphics.endFill();
      txtObject.style.fill = 0xFFFFFF;
    } else {
      bgGraphics.beginFill(0x383838);
      bgGraphics.drawRect(0, 0, menuW, itemH);
      bgGraphics.endFill();
      txtObject.style.fill = 0xFFFFFF;
    }
  }

  _updateMenuRows() {
    if (!this._rowContainers) return;
    this._rowContainers.forEach(({ stepIndex, bg, txt, itemH, menuW, rowIdx }) => {
      this._renderRowState(stepIndex, rowIdx, bg, txt, itemH, menuW);
    });
  }

  _toggleMenu() {
    this._isMenuOpen = !this._isMenuOpen;
    this._popupMenu.visible = this._isMenuOpen;
    if (this._isMenuOpen) {
      this._updateMenuRows();
      this._setScrollToDefaultView();
    }
  }

  _closeMenu() {
    this._isMenuOpen = false;
    this._popupMenu.visible = false;
  }

  _selectStep(idx) {
    this._stepIdx = idx;
    this._updateDisplay();
    this._onChange?.(this.currentBet);
  }

  _makeArrowBtn(symbol, x, y, cb) {
    const btn = new PIXI.Container();
    btn.x = x; btn.y = y;

    const bg = new PIXI.Graphics();
    bg.beginFill(0xFFFFFF, 0.3).drawRect(0, 0, 28, 28).endFill();
    bg.tint = 0x000000;

    const txt = new PIXI.Text(symbol, {
      fontFamily: 'Outfit, sans-serif',
      fontSize: 20,
      fill: 0xFFFFFF,
    });
    txt.anchor.set(0.5); txt.x = 14; txt.y = 14;

    btn.addChild(bg, txt);
    btn.interactive = true; btn.cursor = 'pointer';

    btn.on('pointerdown', (e) => {
      e.stopPropagation();
      AnimationUtils.bounce(btn, 0.08, 150);
      cb();
    });
    btn.on('pointerover', () => { bg.tint = 0x555555; });
    btn.on('pointerout', () => { bg.tint = 0x000000; });

    return btn;
  }

  _step(dir) {
    this._stepIdx = MathUtils.clamp(this._stepIdx + dir, 0, this._steps.length - 1);
    this._updateDisplay();
    this._onChange?.(this.currentBet);
  }

  _updateDisplay() {
    const b = this.currentBet;
    const isPortrait = !!this._isPortrait;

    if (this._lbl) {
      this._lbl.style.fontFamily = isPortrait ? '"Roboto Condensed", sans-serif' : 'sans-serif';
      this._lbl.style.fontSize = isPortrait ? 24 : 18;
      this._lbl.style.fontWeight = isPortrait ? '500' : '200';
    }

    if (this._betText) {
      this._betText.style.fontFamily = isPortrait ? '"Roboto Condensed", sans-serif' : 'sans-serif';
      this._betText.style.fontSize = isPortrait ? 28 : 18;
      this._betText.style.fontWeight = isPortrait ? '280' : '200';
      this._betText.text = `${b.toFixed(2)} FUN`;
    }

    if (this._btnDown) this._btnDown.alpha = this._stepIdx === 0 ? 0.3 : 1;
    if (this._btnUp) this._btnUp.alpha = this._stepIdx === this._steps.length - 1 ? 0.3 : 1;
    this._updateMenuRows();
  }

  _updateBgTexture() {
    if (!this._bgSprite || !this._getUITexture) return;
    if (this._isPortrait) {
      const texName = this._enabled ? 'bet_btn_portrait' : 'bet_btn_portrait_disabled';
      const tex = this._getUITexture(texName) || this._getUITexture('bet_btn_portrait');
      if (tex && tex !== PIXI.Texture.WHITE) {
        this._bgSprite.texture = tex;
        this._bgSprite.anchor.set(0.5);
        this._bgSprite.width = 82;
        this._bgSprite.height = 82;
        this._bgSprite.x = 0;
        this._bgSprite.y = 0;
      }
    } else {
      const totalBetBgTex = this._getUITexture('total_bet_bg');
      if (totalBetBgTex && totalBetBgTex !== PIXI.Texture.WHITE) {
        this._bgSprite.texture = totalBetBgTex;
        this._bgSprite.anchor.set(0);
        this._bgSprite.scale.set(1.0);
        this._bgSprite.width = 130;
        this._bgSprite.height = 60;
        this._bgSprite.x = -5;
        this._bgSprite.y = -7;
      }
    }
  }

  updateLayout(isPortrait) {
    this._isPortrait = isPortrait;
    if (isPortrait && this._isMenuOpen) {
      this._closeMenu();
    }
    this._updateBgTexture();

    if (isPortrait) {
      if (this._btnUp) this._btnUp.visible = false;
      if (this._btnDown) this._btnDown.visible = false;
      if (this._lbl) {
        this._lbl.style.fontFamily = '"Roboto Condensed", sans-serif';
        this._lbl.style.fontSize = 24;
        this._lbl.style.fontWeight = '500';
        this._lbl.anchor.set(0, 0);
        this._lbl.x = 60;
        this._lbl.y = -132;
      }
      if (this._betText) {
        this._betText.style.fontFamily = '"Roboto Condensed", sans-serif';
        this._betText.style.fontSize = 28;
        this._betText.style.fontWeight = '280';
        this._betText.anchor.set(0, 0);
        this._betText.x = 60;
        this._betText.y = -105;
      }
      if (this._clickableArea) {
        this._clickableArea.clear();
        this._clickableArea.beginFill(0x000000, 0.001);
        this._clickableArea.drawRect(-45, -45, 90, 90);
        this._clickableArea.endFill();
        this._clickableArea.interactive = this._enabled;
        this._clickableArea.cursor = this._enabled ? 'pointer' : 'default';
      }
    } else {
      if (this._btnUp) this._btnUp.visible = true;
      if (this._btnDown) this._btnDown.visible = true;
      if (this._lbl) {
        this._lbl.style.fontFamily = 'sans-serif';
        this._lbl.style.fontSize = 18;
        this._lbl.style.fontWeight = '200';
        this._lbl.anchor.set(0.5, 0);
        this._lbl.x = 60;
        this._lbl.y = 2;
      }
      if (this._betText) {
        this._betText.style.fontFamily = 'sans-serif';
        this._betText.style.fontSize = 18;
        this._betText.style.fontWeight = '200';
        this._betText.anchor.set(0.5, 0);
        this._betText.x = 60;
        this._betText.y = 24;
      }
      if (this._clickableArea) {
        this._clickableArea.clear();
        this._clickableArea.beginFill(0x000000, 0.001);
        this._clickableArea.drawRect(0, 0, 150, 48);
        this._clickableArea.endFill();
        this._clickableArea.interactive = this._enabled;
        this._clickableArea.cursor = this._enabled ? 'pointer' : 'default';
      }
    }
    this._updateDisplay();
  }
}
