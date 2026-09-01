import * as PIXI from 'pixi.js';
import { GameConfig } from '../config/GameConfig.js';
import { MathUtils } from '../utils/MathUtils.js';
import { AnimationUtils } from '../utils/AnimationUtils.js';
import { PortraitModalHeader } from './PortraitModalHeader.js';

/**
 * SettingsModal – Replica of official BGaming Gift Rush Settings popup.
 * Features Quick spin, Spacebar to spin, Volume slider, Music toggle, and Sound FX toggle.
 */
export class SettingsModal extends PIXI.Container {
  constructor(options = {}) {
    super();

    this._onClose = options.onClose;
    this._onQuickSpin = options.onQuickSpin;
    this._onSpacebar = options.onSpacebar;
    this._onVolumeChange = options.onVolumeChange;
    this._onMusic = options.onMusic;
    this._onSoundFx = options.onSoundFx;
    this._onShow = options.onShow;
    this._onClose = options.onClose;
    this._onSwitchTab = options.onSwitchTab;
    this._onSoundToggle = options.onSoundToggle;
    this._getUITexture = options.getUITexture || null;

    // State values (defaults)
    this._quickSpinEnabled = options.quickSpin ?? false;
    this._spacebarEnabled = options.spacebar ?? true;
    this._volumeVal = options.volume ?? 1.0; // 0.0 to 1.0
    this._musicEnabled = options.music ?? true;
    this._soundFxEnabled = options.soundFx ?? true;

    this.visible = false;
    this.zIndex = 9999;
    this._buildUI();
  }

  show(initialState = {}) {
    if (initialState.quickSpin !== undefined) this._quickSpinEnabled = initialState.quickSpin;
    if (initialState.spacebar !== undefined) this._spacebarEnabled = initialState.spacebar;
    if (initialState.volume !== undefined) this._volumeVal = initialState.volume;
    if (initialState.music !== undefined) this._musicEnabled = initialState.music;
    if (initialState.soundFx !== undefined) this._soundFxEnabled = initialState.soundFx;

    this._updateAllStates();
    this.visible = true;
    this._onShow?.();
  }

  hide() {
    this.visible = false;
    this._onClose?.();
  }

  updateLayout(isPortrait = false) {
    this._isPortrait = isPortrait;
    this.removeChildren();
    this._buildUI();
  }

  _buildUI() {
    this.removeChildren();

    const isPortrait = !!this._isPortrait;

    // ── 1. Full Screen Backdrop (Hit Area) ───────────
    const backdrop = new PIXI.Graphics();
    if (isPortrait) {
      // Stop at y=1080 so the bottom black strip (BY=1080) remains visible
      backdrop.beginFill(0x202020, 1.0);
      backdrop.drawRect(-500, -500, 1720, 1580); // -500 to 1080 on Y axis
    } else {
      backdrop.beginFill(0x000000, 0.4);
      backdrop.drawRect(-2000, -2000, 6000, 6000);
    }
    backdrop.endFill();
    backdrop.interactive = true;
    backdrop.cursor = 'default';
    backdrop.on('pointerdown', (e) => {
      e.stopPropagation();
      if (!isPortrait) this.hide();
    });
    this.addChild(backdrop);

    if (isPortrait) {
      const topNavHeader = new PortraitModalHeader({
        activeTab: 'settings',
        getUITexture: this._getUITexture,
        onSwitchTab: (tab) => this._onSwitchTab?.(tab),
        onSoundToggle: () => this._onSoundToggle?.(),
        onClose: () => this.hide(),
      });
      topNavHeader.y = 0;
      this.addChild(topNavHeader);

      // Fixed dark header strip below the nav bar (matches other modals)
      const headerG = new PIXI.Graphics();
      headerG.beginFill(0x202020, 1.0);
      headerG.drawRect(0, 70, 720, 60);
      headerG.endFill();
      headerG.interactive = true;
      headerG.on('pointerdown', (e) => e.stopPropagation());
      this.addChild(headerG);

      // Top Grass decoration logo (same as Paytable / Rules / History)
      const topGrassTex = this._getUITexture ? this._getUITexture('top_grass') : null;
      if (topGrassTex && topGrassTex !== PIXI.Texture.WHITE) {
        const grassSprite = new PIXI.Sprite(topGrassTex);
        grassSprite.anchor.set(0.5, 0.5);
        grassSprite.x = 360; // centre of 720px wide canvas
        grassSprite.y = 100;
        grassSprite.scale.set(0.50);
        this.addChild(grassSprite);
      }
    }

    // ── 2. Modal Box Panel ──────────────────────────────────────
    const pw = isPortrait ? 640 : 340;
    const ph = isPortrait ? 600 : 315;
    const W = isPortrait ? 720 : 1280;
    const H = isPortrait ? 1280 : 656;
    const px = (W - pw) / 2;
    const py = isPortrait ? 300 : (H - ph) / 2;

    this._panel = new PIXI.Container();
    this._panel.x = px;
    this._panel.y = py;
    this.addChild(this._panel);

    // Panel Background (Invisible target in portrait, solid box in landscape)
    const pBg = new PIXI.Graphics();
    if (!isPortrait) {
      pBg.beginFill(0x222222, 1.0);
      pBg.lineStyle(1, 0x363636, 1.0);
      pBg.drawRoundedRect(0, 0, pw, ph, 8);
      pBg.endFill();
    } else {
      pBg.beginFill(0x000000, 0.001);
      pBg.drawRect(0, 0, pw, ph);
      pBg.endFill();
    }
    pBg.interactive = true; // prevent clicks passing to backdrop
    pBg.on('pointerdown', (e) => e.stopPropagation());
    this._panel.addChild(pBg);

    // ── 3. Header: "Settings" & Close Button ────────────────────
    const headerTxt = new PIXI.Text('Settings', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: isPortrait ? 28 : 18,
      fontWeight: 'bold',
      fill: 0xFFFFFF,
    });
    headerTxt.anchor.set(0.5, 0);
    headerTxt.x = pw / 2;
    headerTxt.y = isPortrait ? 20 : 16;
    this._panel.addChild(headerTxt);

    if (!isPortrait) {
      const closeBtn = new PIXI.Text('✕', {
        fontFamily: 'Outfit, sans-serif',
        fontSize: 16,
        fill: 0xAAAAAA,
        fontWeight: 'bold',
      });
      closeBtn.anchor.set(0.5);
      closeBtn.x = pw - 22;
      closeBtn.y = 24;
      closeBtn.interactive = true;
      closeBtn.cursor = 'pointer';
      closeBtn.on('pointerdown', (e) => {
        e.stopPropagation();
        this.hide();
      });
      closeBtn.on('pointerover', () => closeBtn.style.fill = 0xFFFFFF);
      closeBtn.on('pointerout', () => closeBtn.style.fill = 0xAAAAAA);
      this._panel.addChild(closeBtn);
    }

    // ── 4. General Settings Section ─────────────────────────────
    const cbX = isPortrait ? 60 : 35;

    // Quick Spin Checkbox
    this._cbQuickSpin = this._createCheckbox('Quick spin', cbX, isPortrait ? 90 : 52, (checked) => {
      this._quickSpinEnabled = checked;
      this._onQuickSpin?.(checked);
    }, isPortrait);
    this._panel.addChild(this._cbQuickSpin.container);

    // Spacebar to Spin Checkbox
    this._cbSpacebar = this._createCheckbox('Spacebar to spin', cbX, isPortrait ? 165 : 86, (checked) => {
      this._spacebarEnabled = checked;
      this._onSpacebar?.(checked);
    }, isPortrait);
    this._panel.addChild(this._cbSpacebar.container);

    // ── 5. Audio Section Header ─────────────────────────────────
    const audioTxt = new PIXI.Text('Audio', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: isPortrait ? 26 : 18,
      fontWeight: 'bold',
      fill: 0xFFFFFF,
    });
    audioTxt.anchor.set(0.5, 0);
    audioTxt.x = pw / 2;
    audioTxt.y = isPortrait ? 250 : 135;
    this._panel.addChild(audioTxt);

    // ── 6. Volume Slider ────────────────────────────────────────
    const volLbl = new PIXI.Text('Volume', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: isPortrait ? 22 : 14,
      fill: 0xCCCCCC,
      fontWeight: '500',
    });
    volLbl.x = cbX;
    volLbl.y = isPortrait ? 310 : 175;
    this._panel.addChild(volLbl);

    // Slider track & thumb
    const trackX = isPortrait ? 200 : 120;
    const trackY = isPortrait ? 318 : 181;
    const trackW = isPortrait ? 370 : 185;
    const trackH = isPortrait ? 14 : 8;

    this._sliderTrackG = new PIXI.Graphics();
    this._panel.addChild(this._sliderTrackG);

    this._sliderThumb = new PIXI.Graphics();
    this._sliderThumb.interactive = true;
    this._sliderThumb.cursor = 'pointer';
    this._panel.addChild(this._sliderThumb);

    // Slider interaction
    let isDraggingSlider = false;

    const updateSlider = (globalPos) => {
      const localP = this._panel.toLocal(globalPos);
      const clampedX = MathUtils.clamp(localP.x, trackX, trackX + trackW);
      this._volumeVal = (clampedX - trackX) / trackW;
      this._renderSlider(trackX, trackY, trackW, trackH);
      this._onVolumeChange?.(this._volumeVal);

      if (this._volumeVal <= 0.01) {
        // Dragged all the way to 0 -> auto uncheck Music & Sound FX
        if (this._cbMusic?.getChecked()) {
          this._cbMusic.setChecked(false);
          this._musicEnabled = false;
          this._onMusic?.(false);
        }
        if (this._cbSoundFx?.getChecked()) {
          this._cbSoundFx.setChecked(false);
          this._soundFxEnabled = false;
          this._onSoundFx?.(false);
        }
      } else if (this._volumeVal > 0.01) {
        // Dragged above 0 -> auto re-check Music & Sound FX if unchecked
        if (this._cbMusic && !this._cbMusic.getChecked()) {
          this._cbMusic.setChecked(true);
          this._musicEnabled = true;
          this._onMusic?.(true);
        }
        if (this._cbSoundFx && !this._cbSoundFx.getChecked()) {
          this._cbSoundFx.setChecked(true);
          this._soundFxEnabled = true;
          this._onSoundFx?.(true);
        }
      }
    };

    this._sliderTrackG.interactive = true;
    this._sliderTrackG.cursor = 'pointer';
    this._sliderTrackG.on('pointerdown', (e) => {
      e.stopPropagation();
      isDraggingSlider = true;
      updateSlider(e.data.global);
    });

    this._sliderThumb.on('pointerdown', (e) => {
      e.stopPropagation();
      isDraggingSlider = true;
    });

    // Listen to global pointer moves on container so holding and dragging works anywhere
    this.interactive = true;
    this.on('globalpointermove', (e) => {
      if (isDraggingSlider) {
        updateSlider(e.data.global);
      }
    });

    const endSliderDrag = () => { isDraggingSlider = false; };
    window.addEventListener('pointerup', endSliderDrag);
    window.addEventListener('pointercancel', endSliderDrag);

    // ── 7. Music & Sound FX Checkboxes ──────────────────────────
    this._cbMusic = this._createCheckbox('Music', cbX, isPortrait ? 390 : 222, (checked) => {
      this._musicEnabled = checked;
      this._onMusic?.(checked);
    }, isPortrait);
    this._panel.addChild(this._cbMusic.container);

    this._cbSoundFx = this._createCheckbox('Sound FX', cbX, isPortrait ? 465 : 258, (checked) => {
      this._soundFxEnabled = checked;
      this._onSoundFx?.(checked);
    }, isPortrait);
    this._panel.addChild(this._cbSoundFx.container);

    this._trackX = trackX;
    this._trackY = trackY;
    this._trackW = trackW;
    this._trackH = trackH;
  }

  _createCheckbox(label, x, y, onChange, isPortrait = false) {
    const container = new PIXI.Container();
    container.x = x;
    container.y = y;

    // Checkbox Box
    const boxSize = isPortrait ? 30 : 18;
    const boxG = new PIXI.Graphics();
    container.addChild(boxG);

    // Checkmark Text
    const checkTxt = new PIXI.Text('✓', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: isPortrait ? 22 : 14,
      fontWeight: 'bold',
      fill: 0xFFFFFF,
    });
    checkTxt.anchor.set(0.5);
    checkTxt.x = boxSize / 2;
    checkTxt.y = boxSize / 2;
    container.addChild(checkTxt);

    // Label Text
    const lblTxt = new PIXI.Text(label, {
      fontFamily: 'Outfit, sans-serif',
      fontSize: isPortrait ? 22 : 14,
      fill: 0xCCCCCC,
      fontWeight: '500',
    });
    lblTxt.x = boxSize + (isPortrait ? 18 : 12);
    lblTxt.y = isPortrait ? 2 : 0;
    container.addChild(lblTxt);

    container.interactive = true;
    container.cursor = 'pointer';

    let isChecked = false;

    const renderState = (checked) => {
      isChecked = checked;
      boxG.clear();
      boxG.beginFill(0x181818);
      boxG.lineStyle(1, 0x444444, 0.9);
      boxG.drawRoundedRect(0, 0, boxSize, boxSize, isPortrait ? 6 : 3);
      boxG.endFill();
      checkTxt.visible = checked;
    };

    container.on('pointerdown', (e) => {
      e.stopPropagation();
      renderState(!isChecked);
      onChange?.(isChecked);
    });

    return { container, setChecked: renderState, getChecked: () => isChecked };
  }

  _renderSlider(x, y, w, h) {
    const isPortrait = !!this._isPortrait;
    const radius = isPortrait ? 16 : 10;
    // Draw track
    this._sliderTrackG.clear();
    // Background track (Unfilled - Right side black)
    this._sliderTrackG.beginFill(0x141414);
    this._sliderTrackG.lineStyle(1, 0x2A2A2A, 0.8);
    this._sliderTrackG.drawRoundedRect(x, y, w, h, isPortrait ? 6 : 4);
    this._sliderTrackG.endFill();

    // Filled track portion (Filled - Left side grey)
    const fillW = w * this._volumeVal;
    if (fillW > 0) {
      this._sliderTrackG.lineStyle(0);
      this._sliderTrackG.beginFill(0x777777);
      this._sliderTrackG.drawRoundedRect(x, y, fillW, h, isPortrait ? 6 : 4);
      this._sliderTrackG.endFill();
    }

    // Draw Thumb handle
    const thumbX = x + fillW;
    const thumbY = y + h / 2;
    this._sliderThumb.clear();
    this._sliderThumb.beginFill(0x888888);
    this._sliderThumb.lineStyle(1, 0xCCCCCC, 0.9);
    this._sliderThumb.drawCircle(thumbX, thumbY, radius);
    this._sliderThumb.endFill();
  }

  _updateAllStates() {
    this._cbQuickSpin.setChecked(this._quickSpinEnabled);
    this._cbSpacebar.setChecked(this._spacebarEnabled);
    this._cbMusic.setChecked(this._musicEnabled);
    this._cbSoundFx.setChecked(this._soundFxEnabled);

    this._renderSlider(this._trackX, this._trackY, this._trackW, this._trackH);
  }
}
