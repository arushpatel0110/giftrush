import * as PIXI from 'pixi.js';
import { MathUtils } from '../utils/MathUtils.js';
import { PortraitModalHeader } from './PortraitModalHeader.js';

/**
 * HistoryModal – Displays real-time bet history matching PaytableModal styling.
 * Tracks: Date & Time, Bet, Total Win, Profit/Loss, Balance Before, Balance After, Currency (FUN).
 */
export class HistoryModal extends PIXI.Container {
  /**
   * @param {object} options
   * @param {Function} options.getUITexture
   * @param {Function} [options.onClose]
   */
  constructor(options = {}) {
    super();

    this._getUITexture = options.getUITexture;
    this._onShow = options.onShow;
    this._onClose = options.onClose;
    this._onSwitchTab = options.onSwitchTab;
    this._onSoundToggle = options.onSoundToggle;

    this.visible = false;
    this.zIndex = 10000;

    this._historyData = [];

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

  setHistory(historyRecords) {
    this._historyData = historyRecords || [];
    if (this.visible) {
      this._rebuildScrollContent();
      this._updateScrollPosition();
    }
  }

  addRecord(record) {
    this._historyData.unshift(record);
    if (this.visible) {
      this._rebuildScrollContent();
      this._updateScrollPosition();
    }
  }

  show(data = null) {
    if (data && Array.isArray(data)) {
      this._historyData = data;
    }
    this.visible = true;
    this._scrollY = 0;
    this._rebuildScrollContent();
    this._updateScrollPosition();
    this._onShow?.();
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

  _buildUI() {
    this.removeChildren();

    const isPortrait = !!this._isPortrait;
    const pw = isPortrait ? 720 : 1280;
    const ph = isPortrait ? 1280 : 656;

    this._panel = new PIXI.Container();
    this.addChild(this._panel);

    // Full screen background - Same charcoal dark grey as Paytable (#202020)
    this._pBg = new PIXI.Graphics();
    this._pBg.beginFill(0x202020, 1.0);
    this._pBg.drawRect(-500, -500, pw + 1000, isPortrait ? 1580 : ph + 1000);
    this._pBg.endFill();
    this._pBg.interactive = true;
    this._pBg.on('pointerdown', (e) => e.stopPropagation());
    this._panel.addChild(this._pBg);

    // Viewport dimensions
    const headerHeight = isPortrait ? 130 : 90;
    const vpX = isPortrait ? 20 : 40;
    const vpY = headerHeight;
    const vpW = pw - vpX * 2;
    const vpH = isPortrait ? (1080 - headerHeight) : (ph - headerHeight - 6);

    this._viewportX = vpX;
    this._viewportY = vpY;
    this._viewportW = vpW;
    this._viewportH = vpH;

    // Mask
    const mask = new PIXI.Graphics();
    mask.beginFill(0xFFFFFF);
    mask.drawRect(vpX, vpY, vpW, vpH);
    mask.endFill();
    this.addChild(mask);

    // Scroll Container
    this._scrollContainer = new PIXI.Container();
    this._scrollContainer.x = vpX;
    this._scrollContainer.y = vpY;
    this._scrollContainer.mask = mask;
    this._panel.addChild(this._scrollContainer);

    this._buildScrollContent(vpW);

    const totalContentH = this._contentHeight;
    this._maxScrollY = Math.max(0, totalContentH - vpH);

    // Drag interaction
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

    // FIXED HEADER
    const headerG = new PIXI.Graphics();
    headerG.beginFill(0x202020, 1.0);
    headerG.drawRect(0, isPortrait ? 70 : 0, pw, isPortrait ? 60 : headerHeight);
    headerG.endFill();
    headerG.interactive = true;
    headerG.on('pointerdown', (e) => e.stopPropagation());
    this._panel.addChild(headerG);

    if (isPortrait) {
      const topNavHeader = new PortraitModalHeader({
        activeTab: 'history',
        getUITexture: this._getUITexture,
        onSwitchTab: (tab) => this._onSwitchTab?.(tab),
        onSoundToggle: () => this._onSoundToggle?.(),
        onClose: () => this.hide(),
      });
      topNavHeader.y = 0;
      this._panel.addChild(topNavHeader);
    }

    // Top Grass Decoration logo
    const topGrassTex = this._getUITexture ? this._getUITexture('top_grass') : null;
    if (topGrassTex && topGrassTex !== PIXI.Texture.WHITE) {
      const grassSprite = new PIXI.Sprite(topGrassTex);
      grassSprite.anchor.set(0.5, 0.5);
      grassSprite.x = pw / 2;
      grassSprite.y = isPortrait ? 100 : 45;
      grassSprite.scale.set(isPortrait ? 0.50 : 0.55);
      this._panel.addChild(grassSprite);
    }

    // Close Button (✕) for Landscape
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

  _buildScrollContent(width) {
    let currY = 25;
    const isPortrait = !!this._isPortrait;

    // Header Title
    const titleText = new PIXI.Text('History', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: isPortrait ? 34 : 28,
      fontWeight: 'bold',
      fill: '#CCCCCC',
    });
    titleText.anchor.set(0.5, 0);
    titleText.x = width / 2;
    titleText.y = currY;
    this._scrollContainer.addChild(titleText);

    currY += isPortrait ? 65 : 55;

    if (!this._historyData || this._historyData.length === 0) {
      // Empty state message
      const emptyTxt = new PIXI.Text('No game history recorded yet. Place bets and spin to track your history!', {
        fontFamily: 'Outfit, sans-serif',
        fontSize: isPortrait ? 22 : 17,
        fill: '#777777',
        align: 'center',
        wordWrap: true,
        wordWrapWidth: width - 40,
        lineHeight: isPortrait ? 30 : 24,
      });
      emptyTxt.anchor.set(0.5, 0);
      emptyTxt.x = width / 2;
      emptyTxt.y = currY + 60;
      this._scrollContainer.addChild(emptyTxt);

      currY += 200;
      this._contentHeight = currY;
      return;
    }

    // Table Header Row
    const headerH = isPortrait ? 50 : 42;
    const tableHeaderG = new PIXI.Graphics();
    tableHeaderG.beginFill(0x181818, 0.9);
    tableHeaderG.drawRoundedRect(10, currY, width - 20, headerH, 6);
    tableHeaderG.endFill();
    this._scrollContainer.addChild(tableHeaderG);

    const cols = isPortrait ? [
      { name: 'DATE & TIME', x: 20, align: 'left' },
      { name: 'BET', x: width * 0.44, align: 'right' },
      { name: 'WIN', x: width * 0.70, align: 'right' },
      { name: 'PROFIT', x: width - 20, align: 'right' },
    ] : [
      { name: 'DATE & TIME', x: 40, align: 'left' },
      { name: 'BET', x: 260, align: 'right' },
      { name: 'TOTAL WIN', x: 440, align: 'right' },
      { name: 'PROFIT / LOSS', x: 650, align: 'right' },
      { name: 'BALANCE BEFORE', x: 890, align: 'right' },
      { name: 'BALANCE AFTER', x: 1140, align: 'right' },
    ];

    cols.forEach((c) => {
      const hTxt = new PIXI.Text(c.name, {
        fontFamily: 'Outfit, sans-serif',
        fontSize: isPortrait ? 15 : 13,
        fontWeight: 'bold',
        fill: '#888888',
      });
      if (c.align === 'right') {
        hTxt.anchor.set(1.0, 0.5);
      } else {
        hTxt.anchor.set(0, 0.5);
      }
      hTxt.x = c.x;
      hTxt.y = currY + headerH / 2;
      this._scrollContainer.addChild(hTxt);
    });

    currY += headerH + 10;

    // Render each history record row
    const rowH = isPortrait ? 56 : 46;
    const gapY = isPortrait ? 10 : 8;

    this._historyData.forEach((rec, idx) => {
      const rowY = currY + idx * (rowH + gapY);

      const rowG = new PIXI.Graphics();
      rowG.beginFill(idx % 2 === 0 ? 0x262626 : 0x2A2A2A, 0.95);
      rowG.drawRoundedRect(10, rowY, width - 20, rowH, 6);
      rowG.endFill();
      this._scrollContainer.addChild(rowG);

      const currency = rec.currency || 'FUN';
      const betStr = `${rec.bet.toFixed(2)} ${currency}`;
      const winStr = `${rec.win.toFixed(2)} ${currency}`;

      const profitVal = rec.win - rec.bet;
      const profitStr = profitVal >= 0 ? `+${profitVal.toFixed(2)} ${currency}` : `${profitVal.toFixed(2)} ${currency}`;
      const profitColor = profitVal > 0 ? '#00FF88' : profitVal < 0 ? '#FF5555' : '#888888';

      const beforeStr = `${rec.balanceBefore.toFixed(2)} ${currency}`;
      const afterStr = `${rec.balanceAfter.toFixed(2)} ${currency}`;

      const dateStr = rec.dateTimeStr || rec.dateStr || '2026-08-31 11:00:00';

      const cells = isPortrait ? [
        { text: dateStr, x: 20, align: 'left', fill: '#AAAAAA' },
        { text: betStr, x: width * 0.44, align: 'right', fill: '#CCCCCC' },
        { text: winStr, x: width * 0.70, align: 'right', fill: rec.win > 0 ? '#00FF88' : '#888888' },
        { text: profitStr, x: width - 20, align: 'right', fill: profitColor },
      ] : [
        { text: dateStr, x: 40, align: 'left', fill: '#AAAAAA' },
        { text: betStr, x: 260, align: 'right', fill: '#CCCCCC' },
        { text: winStr, x: 440, align: 'right', fill: rec.win > 0 ? '#00FF88' : '#888888' },
        { text: profitStr, x: 650, align: 'right', fill: profitColor },
        { text: beforeStr, x: 890, align: 'right', fill: '#AAAAAA' },
        { text: afterStr, x: 1140, align: 'right', fill: '#FFFFFF' },
      ];

      cells.forEach((cell) => {
        const cTxt = new PIXI.Text(cell.text, {
          fontFamily: 'Outfit, sans-serif',
          fontSize: isPortrait ? 17 : 14.5,
          fontWeight: '500',
          fill: cell.fill,
        });
        if (cell.align === 'right') {
          cTxt.anchor.set(1.0, 0.5);
        } else {
          cTxt.anchor.set(0, 0.5);
        }
        cTxt.x = cell.x;
        cTxt.y = rowY + rowH / 2;
        this._scrollContainer.addChild(cTxt);
      });
    });

    currY += this._historyData.length * (rowH + gapY) + 40;
    this._contentHeight = currY;
  }

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
