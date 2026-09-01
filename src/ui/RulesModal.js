import * as PIXI from 'pixi.js';
import { MathUtils } from '../utils/MathUtils.js';
import { PortraitModalHeader } from './PortraitModalHeader.js';

/**
 * RulesModal – Official BGaming Gift Rush Game Rules modal.
 * Replicates exact popup styling, background color, header logo, close button, typography, and sections from official BGaming rules.
 */
export class RulesModal extends PIXI.Container {
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

  show() {
    this._scrollY = 0;
    this._updateScrollPosition();
    this.visible = true;
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

    // Mask for clipping scrollable content
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
        activeTab: 'rules',
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
    let currY = 30;
    const isPortrait = !!this._isPortrait;

    const COLOR_TITLE = '#CCCCCC';
    const COLOR_BODY  = '#999999';

    const addTitle = (str) => {
      const txt = new PIXI.Text(str, {
        fontFamily: 'Outfit, sans-serif',
        fontSize: isPortrait ? 30 : 22,
        fontWeight: 'bold',
        fill: COLOR_TITLE,
      });
      txt.anchor.set(0.5, 0);
      txt.x = width / 2;
      txt.y = currY;
      this._scrollContainer.addChild(txt);
      currY += isPortrait ? 52 : 40;
    };

    const addParagraph = (str, extraWrapWidth = 860) => {
      const actualWrap = Math.min(width - 30, extraWrapWidth);
      const txt = new PIXI.Text(str, {
        fontFamily: 'Outfit, sans-serif',
        fontSize: isPortrait ? 21 : 15.5,
        fill: COLOR_BODY,
        align: 'center',
        wordWrap: true,
        wordWrapWidth: actualWrap,
        lineHeight: isPortrait ? 30 : 24,
      });
      txt.anchor.set(0.5, 0);
      txt.x = width / 2;
      txt.y = currY;
      this._scrollContainer.addChild(txt);
      currY += txt.height + (isPortrait ? 32 : 25);
    };

    const addBullets = (bulletsList) => {
      const bulletW = Math.min(width - 30, 800);
      const container = new PIXI.Container();
      container.x = (width - bulletW) / 2;
      container.y = currY;

      let bY = 0;
      bulletsList.forEach((bStr) => {
        const bTxt = new PIXI.Text(bStr, {
          fontFamily: 'Outfit, sans-serif',
          fontSize: isPortrait ? 21 : 15.5,
          fill: COLOR_BODY,
          align: 'left',
          wordWrap: true,
          wordWrapWidth: bulletW,
          lineHeight: isPortrait ? 30 : 24,
        });
        bTxt.x = 0;
        bTxt.y = bY;
        container.addChild(bTxt);
        bY += bTxt.height + (isPortrait ? 12 : 8);
      });

      this._scrollContainer.addChild(container);
      currY += bY + (isPortrait ? 32 : 25);
    };

    // ── 1. About the game ──
    addTitle('About the game');
    addParagraph(
      'Gift Rush is a traditional 3x3 slot not overwhelmed with anything complicated – just what is needed to take a break from the pile of things to do at the end of the year and relax in expectation of the holiday. ' +
      'Your eyes will be pleased with snowflakes, bells, Christmas tree balls, gingerbreads and other symbols, without which one can hardly imagine the most enchanting holiday of the year. ' +
      'The game has a very rewarding and intriguing Bonus round, where you can win up to x499 of the bet. And it\'s up to you to decide, what gift you will get – you will choose it yourself out of 5 gifts appeared on the screen.'
    );

    // ── 2. How to play ──
    addTitle('How to play');
    addParagraph(
      'The game features win lines. Choose the bet size using the buttons in the Total bet field. Higher bets will increase a total win. The bet value chosen is displayed in the corresponding field. To start the reels spinning, click the Spin button.'
    );

    // ── 3. Autospins ──
    addTitle('Autospins');
    addParagraph(
      'Click the Autospins settings (A) button to choose the number of rounds to auto spin. After the choice is made, a pop-up appears confirming the amount and the number of spins. The amount is equal to the number of spins multiplied by the total bet. To start the Autospins, click the Confirm button. To return to the manual mode, click the Cancel button or click anywhere outside the pop-up.'
    );
    addParagraph('You can adjust the Stop of Autospins:');
    addBullets([
      '•  on any win - autospin will stop after you win',
      '•  if bonus game is won - autospin will stop when a bonus game is triggered',
      '•  if single win exceeds - autospin will stop when a single win is above the written sum in the field',
      '•  if cash balance increases by - autospin will stop when the current balance increases by the sum written in this field',
      '•  if cash balance decreases by - autospin will stop when the current balance decreases by the sum written in this field',
    ]);
    addParagraph(
      'To stop the spins, click the Stop Autospins button. After the Autospins stop, all their adjustments are reset, and the current bet is reset to the default bet.'
    );

    // ── 4. Features ──
    addTitle('Features');
    addParagraph(
      'Bonus symbol: 3 Bonus symbols on reels 1-2-3 trigger the Bonus game.\n\n' +
      'Bonus game: In the Bonus game a player should choose one of 5 gifts appeared on the screen. A player clicks on any of the gifts and learns the amount of his/her win. The maximum winning amount in the Bonus round is x499 of the bet.\n\n' +
      'Buy Bonus: A player can buy the Bonus game at the price pictured on the button. The next spin after the purchase triggers the Bonus game.'
    );

    // ── 5. Spin Results ──
    addTitle('Spin Results');
    addParagraph(
      'If a winning combination is formed along any active payline, it will become animated and the win amount is displayed in the Total Win field.'
    );
    addBullets([
      '•  All symbols pay left to right on consecutive reels of an active payline.',
      '•  Coinciding wins on several active paylines are added.',
      '•  Payouts are made according to the paytable.',
      '•  Payline wins are multiplied by the bet per line value, except for Bonus symbols.',
      '•  Note that only the highest win is paid on each of the active paylines.',
    ]);
    addParagraph(
      'To learn the game payouts, click the Information (i) button and choose the Payments button.'
    );

    // ── 6. Settings ──
    addTitle('Settings');
    addParagraph('The settings button opens a panel with game speed and volume settings.');
    addBullets([
      '•  Quick spin - the speed of spinning reels increases. Depending on license requirements, this feature may not be available.',
      '•  Spacebar to spin (can be used instead of clicking the Spin button)',
    ]);
    addParagraph('Here also are sound effects and background music settings:');
    addBullets([
      '•  Volume adjustment, including its complete turn off',
      '•  Turning the music on/off (using checkmark)',
      '•  Turning the sound effects on/off (using checkmark)',
    ]);

    // ── 7. Return to Player. ──
    addTitle('Return to Player.');
    addParagraph('The overall theoretical Return to Player (RTP) is 96.07%. RTP in the buy bonus feature is 95.98%.');

    // ── 8. RNG ──
    addTitle('RNG');
    addParagraph('The game is based on a certified random number generator. For more information, visit our BGaming site.');

    // ── 9. Additional information ──
    addTitle('Additional information');
    addParagraph(
      'Malfunction voids all plays and pays! All unfinished rounds will be terminated every 24 hours. If the game requires "Collect" - "Collect" will take place and the win from the round will be added to the player balance. If the game requires action from a player, the result is counted assuming that the player has chosen the action with no risk without raising the initial bet. This is the game rule version 1.0, dated August, 2022. Game Version 1.0.0.'
    );

    currY += 40;
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
