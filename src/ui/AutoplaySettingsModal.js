import * as PIXI from 'pixi.js';
import { GameConfig } from '../config/GameConfig.js';
import { AnimationUtils } from '../utils/AnimationUtils.js';
import { PortraitModalHeader } from './PortraitModalHeader.js';

/**
 * AutoplaySettingsModal – Autospin settings popup matching BGaming Gift Rush style.
 * Supports Basic mode and Advanced mode with smooth upward sliding expansion.
 */
export class AutoplaySettingsModal extends PIXI.Container {
  /**
   * @param {object} options
   *   onStartAutoplay - callback(rounds, settings)
   *   onClose         - callback()
   *   onSwitchTab     - callback(tab)
   *   onSoundToggle   - callback()
   *   getUITexture    - function(key)
   */
  constructor(options = {}) {
    super();
    this._onStartAutoplay = options.onStartAutoplay;
    this._onShow = options.onShow;
    this._onClose = options.onClose;
    this._onSwitchTab = options.onSwitchTab;
    this._onSoundToggle = options.onSoundToggle;
    this._getUITexture = options.getUITexture || null;

    this.visible = false;
    this.zIndex = 9995;

    this._isAdvanced = false;
    this._quickSpinEnabled = true;
    this._isPortrait = false;

    // Advanced settings state (Empty by default matching screenshot 2)
    this._stopOnAnyWin = false;
    this._singleWinExceedsActive = false;
    this._singleWinExceedsVal = '';
    this._balanceIncreaseActive = false;
    this._balanceIncreaseVal = '';
    this._balanceDecreaseActive = false;
    this._balanceDecreaseVal = '';

    this._buildUI();
  }

  show() {
    this._justOpened = true;
    setTimeout(() => { this._justOpened = false; }, 150);

    this.visible = true;
    this.alpha = 1;
    this._onShow?.();
  }

  hide() {
    if (!this.visible) return;
    this.visible = false;
    this._onClose?.();
  }

  toggle() {
    if (this.visible) this.hide();
    else this.show();
  }

  updateLayout(isPortrait = false) {
    this._isPortrait = isPortrait;
    this.removeChildren();
    this._buildUI();
  }

  _buildUI() {
    this.removeChildren();

    const isPortrait = !!this._isPortrait;
    const W = isPortrait ? 720 : GameConfig.WIDTH;
    const H = isPortrait ? 1280 : GameConfig.HEIGHT;

    if (isPortrait) {
      // ── Portrait Full Backdrop & Header ────────────────────────
      const backdrop = new PIXI.Graphics();
      backdrop.beginFill(0x202020, 1.0);
      backdrop.drawRect(-500, -500, W + 1000, 1580);
      backdrop.endFill();
      backdrop.interactive = true;
      backdrop.on('pointerdown', (e) => e.stopPropagation());
      this.addChild(backdrop);

      const topNavHeader = new PortraitModalHeader({
        activeTab: null,
        getUITexture: this._getUITexture,
        onSwitchTab: (tab) => this._onSwitchTab?.(tab),
        onSoundToggle: () => this._onSoundToggle?.(),
        onClose: () => this.hide(),
      });
      topNavHeader.y = 0;
      this.addChild(topNavHeader);

      const headerG = new PIXI.Graphics();
      headerG.beginFill(0x202020, 1.0);
      headerG.drawRect(0, 70, W, 60);
      headerG.endFill();
      headerG.interactive = true;
      headerG.on('pointerdown', (e) => e.stopPropagation());
      this.addChild(headerG);

      const topGrassTex = this._getUITexture ? this._getUITexture('top_grass') : null;
      if (topGrassTex && topGrassTex !== PIXI.Texture.WHITE) {
        const grassSprite = new PIXI.Sprite(topGrassTex);
        grassSprite.anchor.set(0.5, 0.5);
        grassSprite.x = W / 2;
        grassSprite.y = 100;
        grassSprite.scale.set(0.50);
        this.addChild(grassSprite);
      }

      // ── Portrait Title Text: "Autospin settings" ─────────────
      const titleTxt = new PIXI.Text('Autospin settings', {
        fontFamily: 'Outfit, sans-serif',
        fontSize: 28,
        fill: '#FFFFFF',
        fontWeight: 'bold',
      });
      titleTxt.anchor.set(0.5, 0);
      titleTxt.x = W / 2;
      titleTxt.y = 210;
      this.addChild(titleTxt);

      // ── "Stop autospin" Section ────────────────────────────────
      const stopContainer = new PIXI.Container();
      stopContainer.x = 75;
      stopContainer.y = 270;
      this.addChild(stopContainer);

      const stopTitle = new PIXI.Text('Stop autospin', {
        fontFamily: 'Outfit, sans-serif',
        fontSize: 24,
        fontWeight: 'bold',
        fill: '#9ea3a8',
      });
      stopTitle.x = 0;
      stopTitle.y = 0;
      stopContainer.addChild(stopTitle);

      let advY = 40;
      advY = this._addCheckboxRowTo(stopContainer, advY, 'On any win', this._stopOnAnyWin, (val) => {
        this._stopOnAnyWin = val;
      }, true);

      advY = this._addInputRowTo(stopContainer, advY, 'If single win exceeds', this._singleWinExceedsActive, this._singleWinExceedsVal, (active, val) => {
        this._singleWinExceedsActive = active;
        this._singleWinExceedsVal = val;
      }, true);

      advY = this._addInputRowTo(stopContainer, advY, 'If cash balance increases by', this._balanceIncreaseActive, this._balanceIncreaseVal, (active, val) => {
        this._balanceIncreaseActive = active;
        this._balanceIncreaseVal = val;
      }, true);

      advY = this._addInputRowTo(stopContainer, advY, 'If cash balance decreases by', this._balanceDecreaseActive, this._balanceDecreaseVal, (active, val) => {
        this._balanceDecreaseActive = active;
        this._balanceDecreaseVal = val;
      }, true);

      // ── "Enable quick spin" Section ────────────────────────────
      const quickContainer = new PIXI.Container();
      quickContainer.x = 75;
      quickContainer.y = 535;
      this.addChild(quickContainer);

      this._addCheckboxRowTo(quickContainer, 0, 'Enable quick spin', this._quickSpinEnabled, (val) => {
        this._quickSpinEnabled = val;
      }, true);

      // ── "Numbers of rounds" Section ────────────────────────────
      const roundsTitle = new PIXI.Text('Numbers of rounds', {
        fontFamily: 'Outfit, sans-serif',
        fontSize: 24,
        fontWeight: 'bold',
        fill: '#9ea3a8',
      });
      roundsTitle.anchor.set(0.5, 0);
      roundsTitle.x = W / 2;
      roundsTitle.y = 605;
      this.addChild(roundsTitle);

      // Grid of rounds (Row 1: 10, 25, 50, 100 / Row 2: 250, 500, 750, 1000 / Row 3: ∞)
      const row1 = [10, 25, 50, 100];
      const row2 = [250, 500, 750, 1000];

      const tileW = 132;
      const tileH = 60;
      const gapX = 12;
      const gapY = 14;

      const gridW = 4 * tileW + 3 * gapX;
      const startX = (W - gridW) / 2;
      const gridStartY = 650;

      const makeTile = (val, tx, ty, customWidth = tileW) => {
        const btn = new PIXI.Container();
        btn.x = tx;
        btn.y = ty;
        btn.interactive = true;
        btn.cursor = 'pointer';

        const btnBg = new PIXI.Graphics();
        btnBg.beginFill(0x383838, 1.0);
        btnBg.lineStyle(1.5, 0x2A2A2A, 0.8);
        btnBg.drawRoundedRect(0, 0, customWidth, tileH, 8);
        btnBg.endFill();
        btn.addChild(btnBg);

        const txt = new PIXI.Text(`${val}`, {
          fontFamily: 'Outfit, sans-serif',
          fontSize: val === '∞' ? 32 : 22,
          fill: '#DDDDDD',
          fontWeight: '600',
        });
        txt.anchor.set(0.5);
        txt.x = customWidth / 2;
        txt.y = tileH / 2;
        btn.addChild(txt);

        btn.on('pointerover', () => {
          btnBg.clear();
          btnBg.beginFill(0x4A4A4A, 1.0);
          btnBg.drawRoundedRect(0, 0, customWidth, tileH, 8);
          btnBg.endFill();
          txt.style.fill = '#FFFFFF';
        });

        btn.on('pointerout', () => {
          btnBg.clear();
          btnBg.beginFill(0x383838, 1.0);
          btnBg.lineStyle(1.5, 0x2A2A2A, 0.8);
          btnBg.drawRoundedRect(0, 0, customWidth, tileH, 8);
          btnBg.endFill();
          txt.style.fill = '#DDDDDD';
        });

        btn.on('pointerdown', (e) => {
          e.stopPropagation();
          const count = val === '∞' ? 999999 : Number(val);
          this._selectRounds(count);
        });

        this.addChild(btn);
      };

      // Row 1
      row1.forEach((val, idx) => {
        makeTile(val, startX + idx * (tileW + gapX), gridStartY);
      });

      // Row 2
      row2.forEach((val, idx) => {
        makeTile(val, startX + idx * (tileW + gapX), gridStartY + tileH + gapY);
      });

      // Row 3 (centered infinity tile)
      const infinityW = 180;
      const infinityX = (W - infinityW) / 2;
      makeTile('∞', infinityX, gridStartY + 2 * (tileH + gapY), infinityW);

      return;
    }

    // ── Landscape Full Screen Invisible Click-Outside Backdrop ─
    const backdrop = new PIXI.Graphics();
    backdrop.beginFill(0x000000, 0.001);
    backdrop.drawRect(-W, -H, W * 3, H * 3);
    backdrop.endFill();
    backdrop.interactive = true;
    backdrop.cursor = 'default';
    backdrop.on('pointerdown', (e) => {
      e.stopPropagation();
      if (this._justOpened) return;
      this.hide();
    });
    this.addChild(backdrop);

    // ── Landscape Modal Box Panel Setup ───────────────────────
    const panelWidth = 360;
    this._currentHeight = this._isAdvanced ? 434 : 220;
    const panelX = W - panelWidth - 250;
    const panelY = H - 65 - this._currentHeight;

    this._panel = new PIXI.Container();
    this._panel.x = panelX;
    this._panel.y = panelY;
    this.addChild(this._panel);

    // Panel Background Graphic
    this._panelBg = new PIXI.Graphics();
    this._redrawBg(panelWidth, this._currentHeight);
    this._panelBg.interactive = true;
    this._panelBg.on('pointerdown', (e) => e.stopPropagation());
    this._panel.addChild(this._panelBg);

    // ── 3. Header Bar (Autospin settings + Toggle Button) ──────────
    this._headerContainer = new PIXI.Container();
    this._panel.addChild(this._headerContainer);

    const headerTitle = new PIXI.Text('Autospin settings', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: 19,
      fill: 0xFFFFFF,
      fontWeight: 'normal',
    });
    headerTitle.x = 16;
    headerTitle.y = 7;
    this._headerContainer.addChild(headerTitle);

    // Mode Toggle Button ("Advanced ▼" / "Basic ▲")
    const toggleBtn = new PIXI.Container();
    toggleBtn.x = panelWidth - 96;
    toggleBtn.y = 0;
    toggleBtn.interactive = true;
    toggleBtn.buttonMode = true;

    const toggleBg = new PIXI.Graphics();
    toggleBg.beginFill(0x383c40);
    toggleBg.drawRect(0, 0, 96, 30);
    toggleBg.endFill();
    toggleBtn.addChild(toggleBg);

    this._toggleText = new PIXI.Text(this._isAdvanced ? 'Basic ▼' : 'Advanced ▲', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: 12,
      fill: 0xE0E0E0,
      fontWeight: '600',
    });
    this._toggleText.anchor.set(0.5);
    this._toggleText.x = 48;
    this._toggleText.y = 15;
    toggleBtn.addChild(this._toggleText);

    toggleBtn.on('pointerover', () => {
      toggleBg.clear();
      toggleBg.beginFill(0x4a4e54);
      toggleBg.drawRect(0, 0, 96, 30);
      toggleBg.endFill();
    });
    toggleBtn.on('pointerout', () => {
      toggleBg.clear();
      toggleBg.beginFill(0x383c40);
      toggleBg.drawRect(0, 0, 96, 30);
      toggleBg.endFill();
    });
    toggleBtn.on('pointerdown', (e) => {
      e.stopPropagation();
      this._toggleAdvancedMode();
    });

    this._headerContainer.addChild(toggleBtn);

    // ── 4. Advanced Mode Options Section ───────────────────────
    this._advancedSection = new PIXI.Container();
    this._advancedSection.y = 50;
    this._advancedSection.visible = this._isAdvanced;
    this._advancedSection.alpha = this._isAdvanced ? 1 : 0;
    this._panel.addChild(this._advancedSection);

    let advY = 0;
    const stopTitle = new PIXI.Text('Stop autospin', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: 13,
      fill: 0x9ea3a8,
    });
    stopTitle.x = 16;
    stopTitle.y = advY;
    this._advancedSection.addChild(stopTitle);

    advY += 40;
    advY = this._addCheckboxRowTo(this._advancedSection, advY, 'On any win', this._stopOnAnyWin, (val) => {
      this._stopOnAnyWin = val;
    });

    advY = this._addInputRowTo(this._advancedSection, advY, 'If single win exceeds', this._singleWinExceedsActive, this._singleWinExceedsVal, (active, val) => {
      this._singleWinExceedsActive = active;
      this._singleWinExceedsVal = val;
    });

    advY = this._addInputRowTo(this._advancedSection, advY, 'If cash balance increases by', this._balanceIncreaseActive, this._balanceIncreaseVal, (active, val) => {
      this._balanceIncreaseActive = active;
      this._balanceIncreaseVal = val;
    });

    advY = this._addInputRowTo(this._advancedSection, advY, 'If cash balance decreases by', this._balanceDecreaseActive, this._balanceDecreaseVal, (active, val) => {
      this._balanceDecreaseActive = active;
      this._balanceDecreaseVal = val;
    });

    // ── 5. Bottom Section (Quick Spin & Rounds Grid) ────────────
    this._bottomSection = new PIXI.Container();
    this._bottomSection.y = this._currentHeight - 184;
    this._panel.addChild(this._bottomSection);

    let currentY = 14;
    currentY = this._addCheckboxRowTo(this._bottomSection, currentY, 'Enable quick spin', this._quickSpinEnabled, (val) => {
      this._quickSpinEnabled = val;
    });

    currentY += 8;

    const roundsLabel = new PIXI.Text('Numbers of rounds', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: 13,
      fill: 0x9ea3a8,
    });
    roundsLabel.x = 16;
    roundsLabel.y = currentY;
    this._bottomSection.addChild(roundsLabel);

    currentY += 24;

    const roundValues = [
      [10, 25, 50, 100, 250],
      [500, 750, 1000, '∞']
    ];

    const btnWidth = 62;
    const btnHeight = 32;
    const gap = 4;
    const startX = 16;

    roundValues.forEach((row, rowIndex) => {
      const rowStartX = rowIndex === 0 ? 16 : 49;
      row.forEach((val, idx) => {
        const btn = new PIXI.Container();
        btn.x = rowStartX + idx * (btnWidth + gap);
        btn.y = currentY;
        btn.interactive = true;
        btn.buttonMode = true;

        const btnBg = new PIXI.Graphics();
        btnBg.beginFill(0x383c40).lineStyle(1, 0x484c50);
        btnBg.drawRect(0, 0, btnWidth, btnHeight);
        btnBg.endFill();
        btn.addChild(btnBg);

        const txt = new PIXI.Text(`${val}`, {
          fontFamily: 'Outfit, sans-serif',
          fontSize: val === '∞' ? 22 : 13,
          fill: 0xD0D0D0,
          fontWeight: '600',
        });
        txt.anchor.set(0.5);
        txt.x = btnWidth / 2;
        txt.y = btnHeight / 2;
        btn.addChild(txt);

        btn.on('pointerover', () => {
          btnBg.clear();
          btnBg.beginFill(0x4f545a).lineStyle(1, 0x60656c);
          btnBg.drawRect(0, 0, btnWidth, btnHeight);
          btnBg.endFill();
          txt.style.fill = 0xFFFFFF;
        });
        btn.on('pointerout', () => {
          btnBg.clear();
          btnBg.beginFill(0x383c40).lineStyle(1, 0x484c50);
          btnBg.drawRect(0, 0, btnWidth, btnHeight);
          btnBg.endFill();
          txt.style.fill = 0xD0D0D0;
        });
        btn.on('pointerdown', (e) => {
          e.stopPropagation();
          const count = val === '∞' ? 999999 : Number(val);
          this._selectRounds(count);
        });

        this._bottomSection.addChild(btn);
      });
      currentY += btnHeight + gap;
    });
  }

  _redrawBg(width, height) {
    this._panelBg.clear();
    const basicH = 220;
    const extH = Math.max(0, height - basicH);

    if (extH > 0) {
      // 1. Header bar (top 45px) – Same color as bottom popup
      this._panelBg.beginFill(0x1a1c1e);
      this._panelBg.drawRect(0, 0, width, 45);
      this._panelBg.endFill();

      // 2. Middle extended section ("Stop autospin" options) – Darker shade
      this._panelBg.beginFill(0x121315);
      this._panelBg.drawRect(0, 45, width, height - 229);
      this._panelBg.endFill();

      // 3. Bottom section – Same color as bottom popup
      this._panelBg.beginFill(0x1a1c1e);
      this._panelBg.drawRect(0, height - 184, width, 184);
      this._panelBg.endFill();
    } else {
      // Basic mode (entire popup uses bottom color)
      this._panelBg.beginFill(0x1a1c1e);
      this._panelBg.drawRect(0, 0, width, height);
      this._panelBg.endFill();
    }
  }

  _toggleAdvancedMode() {
    if (this._animating) return;
    this._isAdvanced = !this._isAdvanced;
    if (this._toggleText) {
      this._toggleText.text = this._isAdvanced ? 'Basic ▼' : 'Advanced ▲';
    }

    if (this._isPortrait) {
      if (this._advancedSection) {
        this._advancedSection.visible = this._isAdvanced;
        this._advancedSection.alpha = this._isAdvanced ? 1 : 0;
      }
      return;
    }

    const H = GameConfig.HEIGHT;
    const startH = this._currentHeight;
    const targetH = this._isAdvanced ? 434 : 220;
    const duration = 220; // ms
    const startTime = performance.now();
    this._animating = true;

    if (this._isAdvanced) {
      this._advancedSection.visible = true;
    }

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - progress, 3);

      const h = startH + (targetH - startH) * ease;
      this._currentHeight = h;
      this._panel.y = H - 65 - h;
      this._redrawBg(360, h);

      this._bottomSection.y = h - 184;

      if (this._isAdvanced) {
        this._advancedSection.alpha = ease;
      } else {
        this._advancedSection.alpha = 1 - ease;
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this._animating = false;
        if (!this._isAdvanced) {
          this._advancedSection.visible = false;
        }
      }
    };

    requestAnimationFrame(animate);
  }

  _addCheckboxRowTo(parent, y, labelText, initialValue, onChange, isPortrait = false) {
    const row = new PIXI.Container();
    row.x = isPortrait ? 0 : 16;
    row.y = y;
    row.interactive = true;
    row.cursor = 'pointer';

    let checked = initialValue;

    const box = new PIXI.Graphics();
    this._drawCheckbox(box, checked, isPortrait);
    row.addChild(box);

    const boxSize = isPortrait ? 28 : 16;
    const label = new PIXI.Text(labelText, {
      fontFamily: 'Outfit, sans-serif',
      fontSize: isPortrait ? 22 : 13,
      fill: checked ? 0xDDDDDD : 0x888888,
    });
    label.x = boxSize + (isPortrait ? 16 : 10);
    label.y = isPortrait ? 1 : 0;
    row.addChild(label);

    row.on('pointerdown', (e) => {
      e.stopPropagation();
      checked = !checked;
      this._drawCheckbox(box, checked, isPortrait);
      label.style.fill = checked ? 0xDDDDDD : 0x888888;
      onChange(checked);
    });

    parent.addChild(row);
    return y + (isPortrait ? 44 : 26);
  }

  _addInputRowTo(parent, y, labelText, initialActive, initialVal, onChange, isPortrait = false) {
    const row = new PIXI.Container();
    row.x = isPortrait ? 0 : 16;
    row.y = y;

    let active = initialActive;
    let val = initialVal;

    // Checkbox
    const boxContainer = new PIXI.Container();
    boxContainer.interactive = true;
    boxContainer.cursor = 'pointer';

    const box = new PIXI.Graphics();
    this._drawCheckbox(box, active, isPortrait);
    boxContainer.addChild(box);

    const boxSize = isPortrait ? 28 : 16;
    const label = new PIXI.Text(labelText, {
      fontFamily: 'Outfit, sans-serif',
      fontSize: isPortrait ? 20 : 12,
      fill: active ? 0xDDDDDD : 0x777777,
    });
    label.x = boxSize + (isPortrait ? 16 : 10);
    label.y = isPortrait ? 3 : 0;
    boxContainer.addChild(label);

    boxContainer.on('pointerdown', (e) => {
      e.stopPropagation();
      active = !active;
      this._drawCheckbox(box, active, isPortrait);
      label.style.fill = active ? 0xDDDDDD : 0x777777;
      onChange(active, val);
    });

    row.addChild(boxContainer);

    // Dark Numeric Value Box
    const inputW = isPortrait ? 140 : 90;
    const inputH = isPortrait ? 36 : 24;
    const inputX = isPortrait ? 430 : 235;
    const inputY = isPortrait ? -4 : -3;

    const inputBg = new PIXI.Graphics();
    inputBg.beginFill(active ? 0x0f1011 : 0x222426).lineStyle(1, 0x33363a);
    inputBg.drawRoundedRect(inputX, inputY, inputW, inputH, isPortrait ? 6 : 0);
    inputBg.endFill();
    inputBg.interactive = true;
    inputBg.cursor = 'pointer';

    const valTxt = new PIXI.Text(active && val !== '' ? `${val}` : '', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: isPortrait ? 20 : 12,
      fill: active ? 0xFFFFFF : 0x666666,
      fontWeight: '600',
    });
    valTxt.anchor.set(0.5);
    valTxt.x = inputX + inputW / 2;
    valTxt.y = inputY + inputH / 2;

    let isEditing = false;
    let currentStr = active && val !== '' ? `${val}` : '';

    const startEditing = (e) => {
      e.stopPropagation();
      if (this._activeInputCleanup) {
        this._activeInputCleanup();
      }

      isEditing = true;
      currentStr = val !== undefined && val !== null && val !== '' ? `${val}` : '';

      // Draw neutral grey border around input box when editing
      inputBg.clear();
      inputBg.beginFill(0x0f1011).lineStyle(1.5, 0x5a5e64);
      inputBg.drawRoundedRect(inputX, inputY, inputW, inputH, isPortrait ? 6 : 0);
      inputBg.endFill();

      valTxt.text = currentStr + '|';
      valTxt.style.fill = 0xFFFFFF;

      const onKeyDown = (evt) => {
        evt.stopPropagation();
        if (evt.key === 'Backspace') {
          evt.preventDefault();
          currentStr = currentStr.slice(0, -1);
        } else if (evt.key === 'Enter' || evt.key === 'Escape') {
          evt.preventDefault();
          stopEditing();
          return;
        } else if (/^[0-9.]$/.test(evt.key)) {
          evt.preventDefault();
          if (currentStr.length < 7) {
            if (evt.key === '.' && currentStr.includes('.')) return;
            currentStr += evt.key;
          }
        } else {
          return;
        }

        if (currentStr.trim() !== '') {
          const parsed = parseFloat(currentStr);
          if (!isNaN(parsed) && parsed >= 0) {
            val = parsed;
            active = true;
            this._drawCheckbox(box, true, isPortrait);
            label.style.fill = 0xDDDDDD;
          }
        } else {
          val = '';
          active = false;
          this._drawCheckbox(box, false, isPortrait);
          label.style.fill = 0x777777;
        }

        valTxt.text = currentStr + '|';
      };

      const onPointerDownOutside = () => {
        stopEditing();
      };

      const stopEditing = () => {
        if (!isEditing) return;
        isEditing = false;
        window.removeEventListener('keydown', onKeyDown, true);
        window.removeEventListener('pointerdown', onPointerDownOutside, true);
        this._activeInputCleanup = null;

        if (currentStr.trim() !== '') {
          const parsed = parseFloat(currentStr);
          if (!isNaN(parsed) && parsed >= 0) {
            val = parsed;
            active = true;
            this._drawCheckbox(box, true, isPortrait);
            label.style.fill = 0xDDDDDD;
          }
        } else {
          val = '';
          active = false;
          this._drawCheckbox(box, false, isPortrait);
          label.style.fill = 0x777777;
        }

        valTxt.text = active && val !== '' ? `${val}` : '';
        valTxt.style.fill = active ? 0xFFFFFF : 0x666666;

        inputBg.clear();
        inputBg.beginFill(active ? 0x0f1011 : 0x222426).lineStyle(1, 0x33363a);
        inputBg.drawRoundedRect(inputX, inputY, inputW, inputH, isPortrait ? 6 : 0);
        inputBg.endFill();

        onChange(active, val);
      };

      this._activeInputCleanup = stopEditing;

      window.addEventListener('keydown', onKeyDown, true);
      setTimeout(() => {
        window.addEventListener('pointerdown', onPointerDownOutside, true);
      }, 50);
    };

    inputBg.on('pointerdown', startEditing);

    row.addChild(inputBg);
    row.addChild(valTxt);

    parent.addChild(row);
    return y + (isPortrait ? 52 : 30);
  }

  _drawCheckbox(g, checked, isPortrait = false) {
    g.clear();
    const size = isPortrait ? 28 : 16;
    g.beginFill(checked ? 0x4a4e54 : 0x282a2d).lineStyle(isPortrait ? 1.5 : 1, 0x5a5e64);
    g.drawRoundedRect(0, 0, size, size, isPortrait ? 5 : 2);
    g.endFill();

    if (checked) {
      g.lineStyle(isPortrait ? 3 : 2, 0xFFFFFF); // White checkmark arrow
      if (isPortrait) {
        g.moveTo(6, 14);
        g.lineTo(12, 21);
        g.lineTo(22, 7);
      } else {
        g.moveTo(3, 8);
        g.lineTo(7, 12);
        g.lineTo(13, 4);
      }
    }
  }

  _selectRounds(count) {
    this.hide();
    this._onStartAutoplay?.(count, {
      quickSpin: this._quickSpinEnabled,
      stopOnAnyWin: this._stopOnAnyWin,
      singleWinExceeds: this._singleWinExceedsActive ? this._singleWinExceedsVal : null,
      balanceIncrease: this._balanceIncreaseActive ? this._balanceIncreaseVal : null,
      balanceDecrease: this._balanceDecreaseActive ? this._balanceDecreaseVal : null,
    });
  }
}
