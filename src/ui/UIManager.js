import * as PIXI from 'pixi.js';
import { GameConfig } from '../config/GameConfig.js';
import { SYMBOL_IDS } from '../config/SymbolConfig.js';

import symSeven from '../../assets/symbols/seven.webp';
import symStar from '../../assets/symbols/star.webp';
import symBell from '../../assets/symbols/bell.webp';
import symGlove from '../../assets/symbols/glove.webp';
import symBall from '../../assets/symbols/ball.webp';
import symBread from '../../assets/symbols/bread.webp';
import symCane from '../../assets/symbols/cane.webp';
import symHat from '../../assets/symbols/hat.webp';
import symBonus from '../../assets/symbols/bonus.webp';

const SYMBOL_TEXTURE_MAP = {
  [SYMBOL_IDS.SEVEN]: symSeven,
  [SYMBOL_IDS.STAR]: symStar,
  [SYMBOL_IDS.BELL]: symBell,
  [SYMBOL_IDS.MITTEN]: symGlove,
  [SYMBOL_IDS.ORNAMENT]: symBall,
  [SYMBOL_IDS.GINGERBREAD]: symBread,
  [SYMBOL_IDS.CANDY_CANE]: symCane,
  [SYMBOL_IDS.SANTA_HAT]: symHat,
  [SYMBOL_IDS.BONUS]: symBonus,
  seven: symSeven,
  star: symStar,
  bell: symBell,
  mitten: symGlove,
  glove: symGlove,
  ornament: symBall,
  ball: symBall,
  gingerbread: symBread,
  bread: symBread,
  candy_cane: symCane,
  cane: symCane,
  santa_hat: symHat,
  hat: symHat,
  bonus: symBonus,
};

import { SpinButton } from './SpinButton.js';
import { BetPanel } from './BetPanel.js';
import { BalanceDisplay } from './BalanceDisplay.js';
import { WinDisplay } from './WinDisplay.js';
import { BuyBonusButton } from './BuyBonusButton.js';
import { InfoButton } from './InfoButton.js';
import { SettingsButton } from './SettingsButton.js';
import { MuteButton } from './MuteButton.js';
import { SettingsModal } from './SettingsModal.js';
import { PaytableModal } from './PaytableModal.js';
import { BuyBonusConfirmModal } from './BuyBonusConfirmModal.js';
import { AutoplayPanel } from './AutoplayPanel.js';
import { AutoplaySettingsModal } from './AutoplaySettingsModal.js';
import { BonusIntroModal } from './BonusIntroModal.js';
import { HistoryModal } from './HistoryModal.js';
import { RulesModal } from './RulesModal.js';
import { MiniPaytableModal } from './MiniPaytableModal.js';
import { BetSelectionModal } from './BetSelectionModal.js';

/**
 * UIManager – Orchestrates all slot machine UI overlay components, HUD, and popups.
 */
export class UIManager {
  /**
   * @param {PIXI.Container} stage
   * @param {object}         callbacks
   *   onSpin, onStop, onBetChange, onAutoStart, onAutoStop, onBuyBonus, onTurbo, onMute, onSpacebar, onVolumeChange, onMusic, onSoundFx
   * @param {number}         initialBet
   * @param {number}         initialBalance
   */
  constructor(stage, callbacks, initialBet, initialBalance) {
    this._stage = stage;
    this._callbacks = callbacks;
    this._currentBet = initialBet || 0.10;
    this._lastWinAmount = 0;
    this._isWinActive = false;

    stage.sortableChildren = true;

    // HUD Container for main screen overlay elements (Buy Bonus, 5 lines ribbon, top header) - zIndex 10
    this.hudContainer = new PIXI.Container();
    this.hudContainer.sortableChildren = true;
    this.hudContainer.zIndex = 10;
    stage.addChild(this.hudContainer);

    // Bottom Bar Container for bottom HUD bar ONLY - zIndex 1000 (Above all modals)
    this.bottomBarContainer = new PIXI.Container();
    this.bottomBarContainer.zIndex = 1000;
    stage.addChild(this.bottomBarContainer);

    // Maintain backward-compatible reference
    this.container = this.bottomBarContainer;

    const modalNav = {
      onSwitchTab: (tab) => this.switchModalTab(tab),
      onSoundToggle: () => this.toggleSoundMute(),
    };

    // Modals (zIndex 100-300)
    this._settingsModal = new SettingsModal({
      getUITexture: this._callbacks.getUITexture,
      onQuickSpin: (enabled) => this._callbacks.onTurbo?.(enabled),
      onSpacebar: (enabled) => this._callbacks.onSpacebar?.(enabled),
      onVolumeChange: (val) => this._callbacks.onVolumeChange?.(val),
      onMusic: (enabled) => this._callbacks.onMusic?.(!enabled),
      onSoundFx: (enabled) => this._callbacks.onSoundFx?.(!enabled),
      onShow: () => this.setPaytableActive(true),
      onClose: () => this.setPaytableActive(false),
      onSwitchTab: modalNav.onSwitchTab,
      onSoundToggle: modalNav.onSoundToggle,
    });
    this._settingsModal.zIndex = 300;
    stage.addChild(this._settingsModal);

    this._paytableModal = new PaytableModal({
      getUITexture: this._callbacks.getUITexture,
      getSymbolTexture: this._callbacks.getSymbolTexture,
      onShow: () => this.setPaytableActive(true),
      onClose: () => this.setPaytableActive(false),
      onSwitchTab: modalNav.onSwitchTab,
      onSoundToggle: modalNav.onSoundToggle,
    });
    this._paytableModal.zIndex = 100;
    stage.addChild(this._paytableModal);

    this._historyModal = new HistoryModal({
      getUITexture: this._callbacks.getUITexture,
      onShow: () => this.setPaytableActive(true),
      onClose: () => this.setPaytableActive(false),
      onSwitchTab: modalNav.onSwitchTab,
      onSoundToggle: modalNav.onSoundToggle,
    });
    this._historyModal.zIndex = 100;
    stage.addChild(this._historyModal);

    this._rulesModal = new RulesModal({
      getUITexture: this._callbacks.getUITexture,
      onShow: () => this.setPaytableActive(true),
      onClose: () => this.setPaytableActive(false),
      onSwitchTab: modalNav.onSwitchTab,
      onSoundToggle: modalNav.onSoundToggle,
    });
    this._rulesModal.zIndex = 100;
    stage.addChild(this._rulesModal);

    this._miniPaytableModal = new MiniPaytableModal({
      getUITexture: this._callbacks.getUITexture,
      getSymbolTexture: this._callbacks.getSymbolTexture,
      onShow: () => this.setPaytableActive(true),
      onClose: () => this.setPaytableActive(false),
    });
    this._miniPaytableModal.zIndex = 400;
    stage.addChild(this._miniPaytableModal);

    this._buyBonusConfirmModal = new BuyBonusConfirmModal({
      onConfirm: () => {
        if (this._currentBuyBonusCost !== undefined) {
          this._buyBonusBtn?.setBonusActive(true);
          this._buyBonusBtn?.playGiftAnimation?.();
          this._callbacks.onBuyBonus?.(this._currentBuyBonusCost);
        }
      },
      onCancel: () => { },
      getTexture: this._callbacks.getUITexture,
      getSpineData: this._callbacks.getSpineData,
      onShow: () => { },
      onClose: () => { },
    });
    this._buyBonusConfirmModal.zIndex = 400;
    stage.addChild(this._buyBonusConfirmModal);

    this._autoplaySettingsModal = new AutoplaySettingsModal({
      getUITexture: this._callbacks.getUITexture,
      onStartAutoplay: (rounds, settings) => {
        if (settings?.quickSpin !== undefined) {
          this._callbacks.onTurbo?.(settings.quickSpin);
        }
        this._autoPanel?.startAutoplay(rounds);
        this._callbacks.onAutoStart?.(rounds, settings);
      },
      onShow: () => this.setPaytableActive(true),
      onClose: () => this.setPaytableActive(false),
      onSwitchTab: modalNav.onSwitchTab,
      onSoundToggle: modalNav.onSoundToggle,
    });
    this._autoplaySettingsModal.zIndex = 350;
    stage.addChild(this._autoplaySettingsModal);

    this._betSelectionModal = new BetSelectionModal({
      getUITexture: this._callbacks.getUITexture,
      onBetChange: (bet) => {
        this._currentBet = bet;
        this._betPanel?.setBet(bet);
        this._paytableModal?.updateBet(bet);
        this._callbacks.onBetChange?.(bet);
        this._buyBonusBtn?.updateBet(bet);
      },
      onShow: () => this.setPaytableActive(true),
      onClose: () => this.setPaytableActive(false),
      onSwitchTab: modalNav.onSwitchTab,
      onSoundToggle: modalNav.onSoundToggle,
    });
    this._betSelectionModal.zIndex = 350;
    stage.addChild(this._betSelectionModal);

    this._bonusIntroModal = new BonusIntroModal({
      getSpineData: this._callbacks.getSpineData,
      getTexture: this._callbacks.getUITexture,
    });
    this._bonusIntroModal.zIndex = 500;
    stage.addChild(this._bonusIntroModal);

    this._createMessageToast(stage);

    this._buildHeader();
    this._buildTopPaytableHeader();
    this._buildBuyBonus(initialBet, initialBalance);
    this._buildFiveLinesRibbon();
    this._buildBottomBar(initialBet, initialBalance);
  }

  // ── Public API ─────────────────────────────────────────────
  closeAllModals() {
    this._paytableModal?.hide();
    this._rulesModal?.hide();
    this._historyModal?.hide();
    this._settingsModal?.hide();
    this._buyBonusConfirmModal?.hide();
    this._autoplaySettingsModal?.hide();
    this._miniPaytableModal?.hide();
    this._betSelectionModal?.hide();
  }

  showBetSelection() {
    this.closeAllModals();
    this.setPaytableActive(true);
    this._betSelectionModal?.show(this._currentBet || 0.10);
  }

  switchModalTab(tabName) {
    this.closeAllModals();
    if (tabName === 'settings') {
      this.showSettings();
    } else if (tabName === 'paytable') {
      this.showPaytable();
    } else if (tabName === 'rules') {
      this.showRules();
    } else if (tabName === 'history') {
      this.showHistory();
    }
  }

  toggleSoundMute() {
    this._isMuted = !this._isMuted;
    this._callbacks.onVolumeChange?.(this._isMuted ? 0 : 1);
    this._callbacks.onMusic?.(!this._isMuted);
    this._callbacks.onSoundFx?.(!this._isMuted);
    if (this._muteBtn) {
      this._muteBtn.setMuted?.(this._isMuted);
    }
    return this._isMuted;
  }

  showSettings() {
    this.closeAllModals();
    this.setPaytableActive(true);
    this._settingsModal?.show();
  }

  showMiniPaytable(symbolId, currentBet, reelIndex = 0, rowIndex = 1, targetPos = null) {
    this.closeAllModals();
    this._miniPaytableModal?.show(symbolId, currentBet ?? this._currentBet ?? 0.10, reelIndex, rowIndex, targetPos);
  }

  showPaytable() {
    this.closeAllModals();
    this._paytableModal?.show(this._currentBet || 0.10);
  }
  showRules() {
    this.closeAllModals();
    this._rulesModal?.show();
  }
  showHistory(historyRecords) {
    this.closeAllModals();
    this._historyModal?.show(historyRecords);
  }
  addHistoryRecord(record) {
    this._historyModal?.addRecord(record);
  }
  async showBonusIntro() {
    if (this._bonusIntroModal) {
      await this._bonusIntroModal.show();
    }
  }
  setBonusActive(active) {
    this._buyBonusBtn?.setBonusActive(active);
  }

  setAutoplayActive(active, count = 0) {
    if (active) {
      this._autoPanel?.startAutoplay(count);
    } else {
      this._autoPanel?.stopAutoplay(false);
    }
  }

  decrementAutoplay() {
    this._autoPanel?.decrementSpins();
  }

  setBottomBarVisible(visible) {
    if (this.bottomBarContainer) {
      this.bottomBarContainer.visible = visible;
    }
    if (this.hudContainer) {
      this.hudContainer.visible = visible;
    }
  }

  isAnyModalOpen() {
    return !!(
      this._paytableModal?.visible ||
      this._rulesModal?.visible ||
      this._historyModal?.visible ||
      this._settingsModal?.visible ||
      this._buyBonusConfirmModal?.visible ||
      this._autoplaySettingsModal?.visible ||
      this._miniPaytableModal?.visible ||
      this._betSelectionModal?.visible
    );
  }

  setPaytableActive(active) {
    if (!active && this.isAnyModalOpen()) {
      return;
    }

    if (this._isPortrait) {
      // Track modal open state so the periodic prompt timer won't fire
      this._isModalOpen = active;

      // In portrait: change bottom strip color to grey (0x202020) when a popup is open, or black (0x000000) when closed
      if (this._bottomStripSprite) this._bottomStripSprite.visible = false;
      if (this._bottomStripGraphics) {
        this._bottomStripGraphics.clear();
        this._bottomStripGraphics.beginFill(active ? 0x202020 : 0x000000, 1.0);
        this._bottomStripGraphics.drawRect(-1500, 1080, 4000, 200);
        this._bottomStripGraphics.endFill();
        this._bottomStripGraphics.visible = true;
      }

      // Hide/show the semi-transparent upper strip and HUD text when a popup opens
      if (this._topPaytableHeader) this._topPaytableHeader.visible = !active;
      if (this._upperPortraitStrip) this._upperPortraitStrip.visible = !active;
      if (this._balanceDisplay) this._balanceDisplay.visible = !active;
      if (this._betPanel) {
        if (this._betPanel._lbl) this._betPanel._lbl.visible = !active;
        if (this._betPanel._betText) this._betPanel._betText.visible = !active;
      }
      // Also hide "Hold spin for quick spins" and Total Win when popup is open
      if (this._quickSpinPromptText) this._quickSpinPromptText.visible = !active;
      if (this._totalWinContainer) this._totalWinContainer.visible = !active;
      if (this._linePaysText) this._linePaysText.visible = !active;
      if (this._spinBtn) this._spinBtn.setModalOpenState?.(active);
      return;
    }
    // ── Landscape: unchanged ────────────────────────────────────
    if (active) {
      if (this._bottomStripSprite) this._bottomStripSprite.visible = false;
      if (this._bottomStripGraphics) this._bottomStripGraphics.visible = true;
    } else {
      if (this._bottomStripSprite) this._bottomStripSprite.visible = true;
      if (this._bottomStripGraphics) this._bottomStripGraphics.visible = false;
    }
  }

  setBalance(v) {
    this._balanceDisplay.balance = v;
    if (this._buyBonusBtn) this._buyBonusBtn.updateBalance(v);
  }
  setBet(v) {
    this._currentBet = v;
    this._paytableModal?.updateBet(v);
    this._updateTopPaytableText(v);
  }

  setBottomWinText(text) {
    if (this._bottomStripWinText) {
      this._bottomStripWinText.text = text || '';
    }
  }

  resetWinDisplay() {
    this._isWinActive = false;
    this._currentTotalWinAmount = 0;
    if (this._linePaysText) this._linePaysText.visible = false;
    if (this._totalWinContainer) this._totalWinContainer.visible = false;
    if (this._quickSpinPromptText) this._quickSpinPromptText.visible = false;
  }

  showWinAmount(amount) {
    this._currentTotalWinAmount = amount;
    if (amount > 0) {
      this._isWinActive = true;
      this._lastWinAmount = amount;
      if (this._quickSpinPromptText) this._quickSpinPromptText.visible = false;
      if (this._totalWinLabelText) this._totalWinLabelText.text = 'Total win:';
      if (this._totalWinAmountText) {
        this._totalWinAmountText.text = `${amount.toFixed(2)} FUN`;
      }
      if (this._totalWinContainer) {
        this._totalWinContainer.visible = !this._isModalOpen;
        this._totalWinContainer.x = this._isPortrait ? 360 : 650;
        const BY = this._isPortrait ? 1080 : GameConfig.HEIGHT - 65;
        this._totalWinContainer.y = this._isPortrait ? BY - 90 : BY + 12;
      }
      if (this._linePaysText) this._linePaysText.visible = false;
    } else {
      // Non-winning spin: hide win box & prompt text
      this._isWinActive = false;
      if (this._totalWinContainer) this._totalWinContainer.visible = false;
      if (this._linePaysText) this._linePaysText.visible = false;
      if (this._quickSpinPromptText) this._quickSpinPromptText.visible = false;
    }
  }

  updateWinPresentationDisplay(isAllTogether, paylineId, totalWin = 0) {
    const winAmt = totalWin || this._currentTotalWinAmount || 0;
    if (winAmt <= 0) return;

    this._isWinActive = true;
    if (this._quickSpinPromptText) this._quickSpinPromptText.visible = false;

    if (this._totalWinLabelText) this._totalWinLabelText.text = 'Total win:';
    if (this._totalWinAmountText) {
      this._totalWinAmountText.text = `${winAmt.toFixed(2)} FUN`;
    }
    if (this._isPortrait && this._isModalOpen) {
      if (this._linePaysText) this._linePaysText.visible = false;
      if (this._totalWinContainer) this._totalWinContainer.visible = false;
      return;
    }

    if (this._totalWinContainer) {
      this._totalWinContainer.visible = !this._isModalOpen;
    }

    const BY = this._isPortrait ? 1080 : GameConfig.HEIGHT - 65;

    if (this._isPortrait) {
      if (isAllTogether || !paylineId) {
        if (this._linePaysText) this._linePaysText.visible = false;
        if (this._totalWinContainer) {
          this._totalWinContainer.x = 360;
          this._totalWinContainer.y = BY - 90;
        }
      } else {
        if (this._linePaysText) {
          this._linePaysText.text = `Line ${paylineId} pays`;
          this._linePaysText.anchor.set(0.5, 0.5);
          this._linePaysText.x = 360;
          this._linePaysText.y = BY - 115;
          this._linePaysText.visible = true;
        }
        if (this._totalWinContainer) {
          this._totalWinContainer.x = 360;
          this._totalWinContainer.y = BY - 75;
        }
      }
    } else {
      if (isAllTogether || !paylineId) {
        if (this._linePaysText) this._linePaysText.visible = false;
        if (this._totalWinContainer) {
          this._totalWinContainer.x = 650;
          this._totalWinContainer.y = BY + 12;
        }
      } else {
        if (this._linePaysText) {
          this._linePaysText.text = `Line ${paylineId} pays`;
          this._linePaysText.anchor.set(0, 0.5);
          this._linePaysText.x = 510;
          this._linePaysText.y = BY + 32;
          this._linePaysText.visible = true;
        }
        if (this._totalWinContainer) {
          this._totalWinContainer.x = 730;
          this._totalWinContainer.y = BY + 12;
        }
      }
    }
  }

  async showWin(amount) {
    if (this._winDisplay) await this._winDisplay.showWin(amount);
  }

  resetWin() { if (this._winDisplay) this._winDisplay.reset(); }

  setSpinning(spinning) {
    this._spinBtn.setSpinning(spinning);
    this._betPanel.setEnabled(!spinning);
    this._buyBonusBtn.setEnabled(!spinning);
    if (!this._autoPanel?.isActive) {
      this._autoPanel?.setEnabled(!spinning);
    }
  }

  setHoldSpinActive(active) {
    // Keep prompt text strictly as "Hold spin for quick spins"
  }

  updateBuyBonusCost(bet) {
    this._currentBet = bet;
    this._paytableModal?.updateBet(bet);
    this._buyBonusBtn.updateBet(bet);
    this._updateTopPaytableText(bet);
  }

  _createMessageToast(stage) {
    this._toastContainer = new PIXI.Container();
    this._toastContainer.zIndex = 2000; // Above all UI layers
    this._toastContainer.visible = false;
    this._toastContainer.alpha = 0;
    stage.addChild(this._toastContainer);

    const bg = new PIXI.Graphics();
    bg.name = 'toastBg';
    this._toastContainer.addChild(bg);

    this._msgText = new PIXI.Text('', {
      fontFamily: 'Outfit, Arial, sans-serif',
      fontSize: 24,
      fill: 0xFFFFFF,
      fontWeight: 'bold',
      dropShadow: true,
      dropShadowColor: 0x000000,
      dropShadowBlur: 6,
      dropShadowDistance: 2,
    });
    this._msgText.anchor.set(0.5);
    this._toastContainer.addChild(this._msgText);
  }

  showMessage(text, color = 0xFF4444) {
    if (!this._toastContainer || !this._msgText) return;

    const isPortrait = window.innerHeight > window.innerWidth;
    const W = isPortrait ? GameConfig.PORTRAIT_WIDTH : GameConfig.WIDTH;
    const H = isPortrait ? GameConfig.PORTRAIT_HEIGHT : GameConfig.HEIGHT;

    this._msgText.text = text;
    this._msgText.style.fill = color;

    const textBounds = this._msgText.getLocalBounds();
    const padX = 40;
    const padY = 18;
    const bgWidth = Math.max(340, textBounds.width + padX * 2);
    const bgHeight = textBounds.height + padY * 2;

    const bg = this._toastContainer.getChildByName('toastBg');
    if (bg) {
      bg.clear();
      bg.lineStyle(3, color, 0.9);
      bg.beginFill(0x0F0F1A, 0.94);
      bg.drawRoundedRect(-bgWidth / 2, -bgHeight / 2, bgWidth, bgHeight, 16);
      bg.endFill();
    }

    this._toastContainer.x = W / 2;
    this._toastContainer.y = isPortrait ? H * 0.28 : H * 0.20;

    this._toastContainer.visible = true;
    this._toastContainer.alpha = 1;
    this._toastContainer.scale.set(0.85);

    AnimationUtils.tweenTo(this._toastContainer.scale, 'x', 1.0, 180);
    AnimationUtils.tweenTo(this._toastContainer.scale, 'y', 1.0, 180);

    if (this._msgTimer) clearTimeout(this._msgTimer);
    this._msgTimer = setTimeout(() => {
      AnimationUtils.fadeTo(this._toastContainer, 0, 300).then(() => {
        this._toastContainer.visible = false;
      });
    }, 3000);
  }

  updateLayout(isPortrait = false) {
    this._isPortrait = isPortrait;
    const W = isPortrait ? GameConfig.PORTRAIT_WIDTH : GameConfig.WIDTH;
    const H = isPortrait ? GameConfig.PORTRAIT_HEIGHT : GameConfig.HEIGHT;
    const BH = isPortrait ? 200 : 65;
    const BY = isPortrait ? 1080 : H - BH;

    // Update Modals layout
    this._settingsModal?.updateLayout?.(isPortrait);
    this._paytableModal?.updateLayout?.(isPortrait);
    this._historyModal?.updateLayout?.(isPortrait);
    this._rulesModal?.updateLayout?.(isPortrait);
    this._miniPaytableModal?.updateLayout?.(isPortrait);
    this._buyBonusConfirmModal?.updateLayout?.(isPortrait);
    this._autoplaySettingsModal?.updateLayout?.(isPortrait);
    this._betSelectionModal?.updateLayout?.(isPortrait);
    this._bonusIntroModal?.updateLayout?.(isPortrait);
    this._buyBonusBtn?.updateLayout?.(isPortrait);

    if (isPortrait) {
      // ── Portrait Layout (720 x 1280 canvas) ─────────────────────
      if (this._topPaytableHeader) this._topPaytableHeader.visible = true;
      this._updateTopPaytableText(this._currentBet || 0.10);

      if (this._brandLogo) { this._brandLogo.x = 24; this._brandLogo.y = 24; }
      if (this._muteBtn) { this._muteBtn.x = 590; this._muteBtn.y = 28; }
      if (this._timeText) { this._timeText.x = 660; this._timeText.y = 28; }
      if (this._rBanner) { this._rBanner.x = 712; this._rBanner.y = 50; }
      if (this._buyBonusBtn) { this._buyBonusBtn.x = 210; this._buyBonusBtn.y = 800; }
      if (this._fiveLinesRibbon) { this._fiveLinesRibbon.x = 685; this._fiveLinesRibbon.y = 549; }

      if (this._bottomStripSprite) {
        this._bottomStripSprite.visible = false;
      }
      if (this._bottomStripGraphics) {
        this._bottomStripGraphics.clear();
        this._bottomStripGraphics.beginFill(this._isModalOpen ? 0x202020 : 0x000000, 1.0);
        this._bottomStripGraphics.drawRect(-1500, BY, 4000, BH);
        this._bottomStripGraphics.endFill();
        this._bottomStripGraphics.visible = true;
      }

      // Upper semi-transparent dark strip above bottom control bar (Portrait mode only)
      if (!this._upperPortraitStrip) {
        this._upperPortraitStrip = new PIXI.Graphics();
        this.bottomBarContainer.addChildAt(this._upperPortraitStrip, 0);
      }
      this._upperPortraitStrip.clear();
      this._upperPortraitStrip.beginFill(0x000000, 0.55);
      this._upperPortraitStrip.drawRect(-1500, BY - 145, 4000, 145);
      this._upperPortraitStrip.endFill();
      this._upperPortraitStrip.visible = !this._isModalOpen;

      if (this._totalWinContainer) {
        this._totalWinContainer.x = 360; this._totalWinContainer.y = BY - 90;
        if (this._totalWinLabelText) this._totalWinLabelText.style.fontSize = 18;
        if (this._totalWinAmountText) this._totalWinAmountText.style.fontSize = 28;
        if (this._isModalOpen) this._totalWinContainer.visible = false;
      }
      if (this._balanceDisplay) {
        this._balanceDisplay.x = 60; this._balanceDisplay.y = BY + 100;
        this._balanceDisplay.updateLayout?.(true);
        this._balanceDisplay.visible = !this._isModalOpen;
      }
      if (this._linePaysText) {
        this._linePaysText.style.fontSize = 22;
        this._linePaysText.x = 360; this._linePaysText.y = BY - 60;
        if (this._isModalOpen) this._linePaysText.visible = false;
      }
      if (this._quickSpinPromptText) {
        this._quickSpinPromptText.style.fontSize = 22;
        this._quickSpinPromptText.x = 360; this._quickSpinPromptText.y = BY - 60;
        if (this._isModalOpen) this._quickSpinPromptText.visible = false;
      }

      if (this._settingsBtn) { this._settingsBtn.x = 75; this._settingsBtn.y = BY + 100; this._settingsBtn.updateLayout?.(true); }
      if (this._autoPanel) { this._autoPanel.x = 215; this._autoPanel.y = BY + 100; this._autoPanel.updateLayout?.(true); }
      if (this._spinBtn) { this._spinBtn.x = 360; this._spinBtn.y = BY + 100; this._spinBtn.updateLayout?.(true, this._isModalOpen); }
      if (this._betPanel) {
        this._betPanel.x = 505; this._betPanel.y = BY + 100; this._betPanel.updateLayout?.(true);
        if (this._betPanel._lbl) this._betPanel._lbl.visible = !this._isModalOpen;
        if (this._betPanel._betText) this._betPanel._betText.visible = !this._isModalOpen;
      }
      if (this._infoBtn) { this._infoBtn.x = 645; this._infoBtn.y = BY + 100; this._infoBtn.updateLayout?.(true); }
    } else {
      if (this._upperPortraitStrip) {
        this._upperPortraitStrip.visible = false;
      }
      if (this._topPaytableHeader) this._topPaytableHeader.visible = false;
      // ── Landscape Layout (1280 x 720 canvas) - EXACT LANDSCAPE UNCHANGED ──
      if (this._brandLogo) { this._brandLogo.x = 24; this._brandLogo.y = 24; }
      if (this._muteBtn) { this._muteBtn.x = W - 110; this._muteBtn.y = 24; }
      if (this._timeText) { this._timeText.x = W - 40; this._timeText.y = 24; }
      if (this._rBanner) { this._rBanner.x = W - 6; this._rBanner.y = 45; }
      if (this._buyBonusBtn) { this._buyBonusBtn.x = 105; this._buyBonusBtn.y = 380; }
      if (this._fiveLinesRibbon) { this._fiveLinesRibbon.x = 965; this._fiveLinesRibbon.y = 344; }

      if (this._bottomStripGraphics) {
        this._bottomStripGraphics.clear();
        this._bottomStripGraphics.beginFill(0x1A1A1A, 1.0);
        this._bottomStripGraphics.drawRect(-1500, BY, 4000, BH);
        this._bottomStripGraphics.endFill();
      }
      if (this._bottomStripSprite) {
        this._bottomStripSprite.y = BY;
        this._bottomStripSprite.height = BH;
      }
      if (this._infoBtn) { this._infoBtn.x = 95; this._infoBtn.y = BY + 20; this._infoBtn.updateLayout?.(false); }
      if (this._settingsBtn) { this._settingsBtn.x = 122; this._settingsBtn.y = BY + 20; this._settingsBtn.updateLayout?.(false); }
      if (this._balanceDisplay) { this._balanceDisplay.x = 85; this._balanceDisplay.y = BY + 46; this._balanceDisplay.updateLayout?.(false); }
      if (this._betPanel) { this._betPanel.x = 250; this._betPanel.y = BY + 10; this._betPanel.updateLayout?.(false); }
      if (this._totalWinLabelText) this._totalWinLabelText.style.fontSize = 13;
      if (this._totalWinAmountText) this._totalWinAmountText.style.fontSize = 22;
      if (this._linePaysText) { this._linePaysText.style.fontSize = 16; this._linePaysText.x = 510; this._linePaysText.y = BY + 32; }
      if (this._totalWinContainer) { this._totalWinContainer.x = (this._linePaysText?.visible ? 730 : 650); this._totalWinContainer.y = BY + 12; }
      if (this._autoPanel) { this._autoPanel.x = 1010; this._autoPanel.y = BY + 32; this._autoPanel.updateLayout?.(false); }
      if (this._quickSpinPromptText) { this._quickSpinPromptText.style.fontSize = 13; this._quickSpinPromptText.x = 650; this._quickSpinPromptText.y = BY + 32; }
      if (this._spinBtn) { this._spinBtn.x = 1075; this._spinBtn.y = BY + 32; this._spinBtn.updateLayout?.(false); }
    }
  }

  // ── Private Builder Methods ────────────────────────────────
  _buildHeader() {
    const W = GameConfig.WIDTH;

    // Top-Left Brand Logo ('B' icon / logo) — matches StartScene exact position
    const brandTex = this._callbacks.getUITexture ? this._callbacks.getUITexture('brand_logo') : null;
    if (brandTex && brandTex !== PIXI.Texture.WHITE) {
      this._brandLogo = new PIXI.Sprite(brandTex);
      this._brandLogo.anchor.set(0, 0);
      this._brandLogo.x = 24;
      this._brandLogo.y = 24;
      this._brandLogo.scale.set(0.75);
      this.hudContainer.addChild(this._brandLogo);
    }

    // Top-Right header icons & time
    this._muteBtn = new MuteButton((m) => this._callbacks.onMute?.(m), this._callbacks.getUITexture);
    this._muteBtn.x = W - 110; this._muteBtn.y = 24;
    this.hudContainer.addChild(this._muteBtn);

    const formatTime = () => {
      const now = new Date();
      return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    };

    this._timeText = new PIXI.Text(formatTime(), {
      fontFamily: 'Outfit, sans-serif', fontSize: 12, fill: 0xFFFFFF, fontWeight: '600',
    });
    this._timeText.anchor.set(0.5); this._timeText.x = W - 40; this._timeText.y = 24;
    this.hudContainer.addChild(this._timeText);

    setInterval(() => {
      if (this._timeText && !this._timeText.destroyed) {
        this._timeText.text = formatTime();
      }
    }, 5000);

    // Vertical GIFT RUSH banner on far right edge
    this._rBanner = new PIXI.Text('G I F T  R U S H', {
      fontFamily: 'Outfit, sans-serif', fontSize: 10, fill: 0xFFFFFF, fontWeight: 'bold',
    });
    this._rBanner.rotation = Math.PI / 2;
    this._rBanner.x = W - 6; this._rBanner.y = 45;
    this.hudContainer.addChild(this._rBanner);
  }

  _buildTopPaytableHeader() {
    this._topPaytableHeader = new PIXI.Container();
    this._topPaytableHeader.zIndex = 500;
    this._topPaytableHeader.visible = false;
    this.hudContainer.addChild(this._topPaytableHeader);

    const getSymTex = (id) => {
      const tex = this._callbacks.getSymbolTexture?.(id);
      if (tex && tex !== PIXI.Texture.WHITE && tex !== PIXI.Texture.EMPTY) {
        return tex;
      }
      const fallbackUrl = SYMBOL_TEXTURE_MAP[id];
      if (fallbackUrl) {
        return PIXI.Texture.from(fallbackUrl);
      }
      return PIXI.Texture.WHITE;
    };

    const textStyle = {
      fontFamily: 'Outfit, Arial, sans-serif',
      fontSize: 18,
      fontWeight: 'bold',
      fill: '#FFCC00',
      stroke: '#000000',
      strokeThickness: 3.5,
      dropShadow: true,
      dropShadowColor: '#000000',
      dropShadowBlur: 2,
      dropShadowDistance: 1,
    };

    const createSymbolSprite = (id, maxW, maxH) => {
      const tex = getSymTex(id);
      const sprite = new PIXI.Sprite(tex);
      sprite.anchor.set(0.5);

      const fit = () => {
        const t = sprite.texture;
        if (t && t.width > 0 && t.height > 0) {
          const s = Math.min(maxW / t.width, maxH / t.height);
          sprite.scale.set(s);
        }
      };

      if (sprite.texture && sprite.texture.baseTexture) {
        if (sprite.texture.baseTexture.hasLoaded) {
          fit();
        } else {
          sprite.texture.baseTexture.once('loaded', fit);
          sprite.texture.baseTexture.on('update', fit);
          fit();
        }
      } else {
        fit();
      }

      setTimeout(fit, 100);
      setTimeout(fit, 350);

      return sprite;
    };

    // ── Row 1, Col 1: Seven ──────────────────────────────
    const c1 = new PIXI.Container();
    c1.x = 180; c1.y = 90;
    const s7 = createSymbolSprite(SYMBOL_IDS.SEVEN, 68, 68);
    s7.y = 0;
    c1.addChild(s7);
    this._txtSeven = new PIXI.Text('', textStyle);
    this._txtSeven.anchor.set(0.5);
    this._txtSeven.y = 48;
    c1.addChild(this._txtSeven);
    this._topPaytableHeader.addChild(c1);

    // ── Row 1, Col 2: Bonus Elf ──────────────────────────
    const c2 = new PIXI.Container();
    c2.x = 360; c2.y = 90;
    const sB = createSymbolSprite(SYMBOL_IDS.BONUS, 68, 68);
    sB.y = 0;
    c2.addChild(sB);
    const txtBonus = new PIXI.Text('BONUS', textStyle);
    txtBonus.anchor.set(0.5);
    txtBonus.y = 48;
    c2.addChild(txtBonus);
    this._topPaytableHeader.addChild(c2);

    // ── Row 1, Col 3: Star ───────────────────────────────
    const c3 = new PIXI.Container();
    c3.x = 540; c3.y = 90;
    const sStar = createSymbolSprite(SYMBOL_IDS.STAR, 68, 68);
    sStar.y = 0;
    c3.addChild(sStar);
    this._txtStar = new PIXI.Text('', textStyle);
    this._txtStar.anchor.set(0.5);
    this._txtStar.y = 48;
    c3.addChild(this._txtStar);
    this._topPaytableHeader.addChild(c3);

    // ── Row 2, Col 1: Bell ───────────────────────────────
    const c4 = new PIXI.Container();
    c4.x = 180; c4.y = 195;
    const sBell = createSymbolSprite(SYMBOL_IDS.BELL, 68, 68);
    sBell.y = 0;
    c4.addChild(sBell);
    this._txtBell = new PIXI.Text('', textStyle);
    this._txtBell.anchor.set(0.5);
    this._txtBell.y = 48;
    c4.addChild(this._txtBell);
    this._topPaytableHeader.addChild(c4);

    // ── Row 2, Col 2: 4 Low Symbols Cluster (Gingerbread, Hat, Ornament, Candy Cane) ──
    const c5 = new PIXI.Container();
    c5.x = 360; c5.y = 195;

    const lowCluster = new PIXI.Container();
    lowCluster.y = 0;

    const lowIds = [
      { id: SYMBOL_IDS.GINGERBREAD, dx: -18, dy: -18 },
      { id: SYMBOL_IDS.SANTA_HAT, dx: 18, dy: -18 },
      { id: SYMBOL_IDS.ORNAMENT, dx: -18, dy: 18 },
      { id: SYMBOL_IDS.CANDY_CANE, dx: 18, dy: 18 },
    ];

    lowIds.forEach((item) => {
      const spr = createSymbolSprite(item.id, 35, 35);
      spr.x = item.dx;
      spr.y = item.dy;
      lowCluster.addChild(spr);
    });
    c5.addChild(lowCluster);

    this._txtLowGroup = new PIXI.Text('', textStyle);
    this._txtLowGroup.anchor.set(0.5);
    this._txtLowGroup.y = 48;
    c5.addChild(this._txtLowGroup);
    this._topPaytableHeader.addChild(c5);

    // ── Row 2, Col 3: Mitten / Glove ─────────────────────
    const c6 = new PIXI.Container();
    c6.x = 540; c6.y = 195;
    const sMit = createSymbolSprite(SYMBOL_IDS.MITTEN, 68, 68);
    sMit.y = 0;
    c6.addChild(sMit);
    this._txtMitten = new PIXI.Text('', textStyle);
    this._txtMitten.anchor.set(0.5);
    this._txtMitten.y = 48;
    c6.addChild(this._txtMitten);
    this._topPaytableHeader.addChild(c6);

    this._updateTopPaytableText(this._currentBet || 0.10);
  }

  _updateTopPaytableText(bet = 0.10) {
    if (!this._topPaytableHeader) return;
    const b = bet || 0.10;
    if (this._txtSeven) this._txtSeven.text = `3: ${(b * 60).toFixed(2)} FUN`;
    if (this._txtStar) this._txtStar.text = `3: ${(b * 40).toFixed(2)} FUN`;
    if (this._txtBell) this._txtBell.text = `3: ${(b * 8).toFixed(2)} FUN`;
    if (this._txtLowGroup) this._txtLowGroup.text = `3: ${(b * 4).toFixed(2)} FUN`;
    if (this._txtMitten) this._txtMitten.text = `3: ${(b * 1).toFixed(2)} FUN`;
  }

  _buildBuyBonus(initialBet, initialBalance) {
    // Positioned on the left side of the reel frame
    this._buyBonusBtn = new BuyBonusButton(
      (cost) => {
        this.closeAllModals();
        this._currentBuyBonusCost = cost;
        if (this._buyBonusConfirmModal) {
          this._buyBonusConfirmModal.show(cost);
        }
      },
      initialBet,
      this._callbacks.getUITexture,
      initialBalance,
      this._callbacks.getSpineData
    );
    this._buyBonusBtn.x = 105;
    this._buyBonusBtn.y = 380;
    this.hudContainer.addChild(this._buyBonusBtn);
  }

  _buildFiveLinesRibbon() {
    const font = '"Magnolia Script", "Magnolia-Script", "Lobster", cursive, sans-serif';

    this._fiveLinesRibbon = new PIXI.Text('5\n\nl\ni\nn\ne\ns', {
      fontFamily: font,
      fontSize: 21,
      fill: '#FFFFFF',
      fontStyle: 'italic',
      fontWeight: 'bold',
      align: 'center',
      lineHeight: 22,
      padding: 25,
      dropShadow: true,
      dropShadowColor: '#000000',
      dropShadowBlur: 3,
      dropShadowDistance: 1,
    });
    this._fiveLinesRibbon.rotation = 0;
    this._fiveLinesRibbon.anchor.set(0.5, 0.5);
    this._fiveLinesRibbon.x = 965;
    this._fiveLinesRibbon.y = 344;

    this.hudContainer.addChild(this._fiveLinesRibbon);
  }

  _buildBottomBar(initialBet, initialBalance) {
    const W = GameConfig.WIDTH;
    const H = GameConfig.HEIGHT;
    const BH = 65; // bottom bar height

    this.bottomBarContainer.sortableChildren = true;

    // Solid 0x1A1A1A color strip (shown when Paytable modal is OPEN)
    this._bottomStripGraphics = new PIXI.Graphics();
    this._bottomStripGraphics.beginFill(0x1A1A1A, 1.0);
    this._bottomStripGraphics.drawRect(-1500, H - BH, 4000, BH);
    this._bottomStripGraphics.endFill();
    this._bottomStripGraphics.visible = false;
    this.bottomBarContainer.addChild(this._bottomStripGraphics);

    // Bottom bar background using bottomstrip.webp (shown in normal gameplay)
    const stripTex = this._callbacks.getUITexture ? this._callbacks.getUITexture('bottom_strip') : null;
    if (stripTex && stripTex !== PIXI.Texture.WHITE) {
      this._bottomStripSprite = new PIXI.Sprite(stripTex);
      this._bottomStripSprite.x = -1500;
      this._bottomStripSprite.y = H - BH;
      this._bottomStripSprite.width = 4000;
      this._bottomStripSprite.height = BH;
      this.bottomBarContainer.addChild(this._bottomStripSprite);
    } else {
      const bg = new PIXI.Graphics();
      bg.beginFill(0x5A030A).drawRect(-1500, H - BH, 4000, BH).endFill();
      this.bottomBarContainer.addChild(bg);
    }

    const BY = H - BH;

    // Far Left: Info ℹ, Gear ⚙, Balance
    this._infoBtn = new InfoButton(
      () => {
        this.showPaytable();
        this._callbacks.onInfo?.();
      },
      this._callbacks.getUITexture,
      {
        onRules: () => {
          this.showRules();
          this._callbacks.onRules?.();
        },
        onHistory: () => {
          this.showHistory();
          this._callbacks.onHistory?.();
        },
        onPaytable: () => {
          this.showPaytable();
          this._callbacks.onPaytable?.();
        },
      }
    );
    this._infoBtn.x = 95; this._infoBtn.y = BY + 20;
    this.bottomBarContainer.addChild(this._infoBtn);

    this._settingsBtn = new SettingsButton(
      () => {
        this.closeAllModals();
        this._settingsModal.show();
        this._callbacks.onSettings?.();
      },
      this._callbacks.getUITexture
    );
    this._settingsBtn.x = 122; this._settingsBtn.y = BY + 20;
    this.bottomBarContainer.addChild(this._settingsBtn);

    this._balanceDisplay = new BalanceDisplay();
    this._balanceDisplay.balance = initialBalance;
    this._balanceDisplay.x = 85; this._balanceDisplay.y = BY + 46;
    this.bottomBarContainer.addChild(this._balanceDisplay);

    // Center Left: Bet Panel
    this._betPanel = new BetPanel((bet) => {
      this._currentBet = bet;
      this._paytableModal?.updateBet(bet);
      this._callbacks.onBetChange?.(bet);
      this._buyBonusBtn.updateBet(bet);
    }, this._callbacks.getUITexture, () => {
      this.showBetSelection();
    });
    this._betPanel.x = 250; this._betPanel.y = BY + 10;
    this.bottomBarContainer.addChild(this._betPanel);

    // ── Bottom Bar Win Presentation Area (Matching Reference Image) ──
    this._linePaysText = new PIXI.Text('', {
      fontFamily: 'Outfit, Arial, sans-serif',
      fontSize: 16,
      fill: '#FFFFFF',
      fontWeight: '600',
      dropShadow: true,
      dropShadowColor: '#000000',
      dropShadowBlur: 2,
      dropShadowDistance: 1,
    });
    this._linePaysText.anchor.set(0, 0.5);
    this._linePaysText.x = 510;
    this._linePaysText.y = BY + 32;
    this._linePaysText.visible = false;
    this.bottomBarContainer.addChild(this._linePaysText);

    this._totalWinContainer = new PIXI.Container();
    this._totalWinContainer.x = 650;
    this._totalWinContainer.y = BY + 12;
    this._totalWinContainer.visible = false;

    this._totalWinLabelText = new PIXI.Text('Total win:', {
      fontFamily: 'Outfit, Arial, sans-serif',
      fontSize: 13,
      fill: '#FFFFFF',
      fontWeight: '400',
    });
    this._totalWinLabelText.anchor.set(0.5, 0);
    this._totalWinLabelText.x = 0;
    this._totalWinLabelText.y = 0;
    this._totalWinContainer.addChild(this._totalWinLabelText);

    this._totalWinAmountText = new PIXI.Text('0.00 FUN', {
      fontFamily: 'Outfit, Arial, sans-serif',
      fontSize: 22,
      fill: '#FFFFFF',
      fontWeight: 'bold',
      dropShadow: true,
      dropShadowColor: '#000000',
      dropShadowBlur: 3,
      dropShadowDistance: 1,
    });
    this._totalWinAmountText.anchor.set(0.5, 0);
    this._totalWinAmountText.x = 0;
    this._totalWinAmountText.y = 16;
    this._totalWinContainer.addChild(this._totalWinAmountText);

    this.bottomBarContainer.addChild(this._totalWinContainer);

    // Far Right: Autoplay & Spin Buttons
    this._autoPanel = new AutoplayPanel(
      (count) => this._callbacks.onAutoStart?.(count),
      () => this._callbacks.onAutoStop?.(),
      this._callbacks.getUITexture,
      () => {
        this.closeAllModals();
        this.setPaytableActive(true);
        this._autoplaySettingsModal?.toggle();
      }
    );
    this._autoPanel.x = 1010; this._autoPanel.y = BY + 32;
    this.bottomBarContainer.addChild(this._autoPanel);

    // Simple white prompt text centered on bottom strip ("Hold spin for quick spins")
    this._quickSpinPromptText = new PIXI.Text('Hold spin for quick spins', {
      fontFamily: 'Outfit, Arial, sans-serif',
      fontSize: 13,
      fill: '#FFFFFF',
      fontWeight: '400',
      dropShadow: true,
      dropShadowColor: '#000000',
      dropShadowBlur: 3,
      dropShadowDistance: 1,
    });
    this._quickSpinPromptText.anchor.set(0.5, 0.5);
    this._quickSpinPromptText.x = 650;
    this._quickSpinPromptText.y = BY + 32;
    this._quickSpinPromptText.alpha = 0;
    this._quickSpinPromptText.visible = false;
    this._quickSpinPromptText.zIndex = 500;
    this.bottomBarContainer.addChild(this._quickSpinPromptText);

    // Periodic helper: shows for 3.5s then hides if no win is active
    const triggerPrompt = () => {
      if (this._isWinActive) return;
      if (this._isModalOpen) return;                                         // never show during a popup
      if (this._isPortrait) return;                                          // never show in portrait mode
      if (this._totalWinContainer && this._totalWinContainer.visible) return;
      if (this._linePaysText && this._linePaysText.visible) return;
      if (!this._quickSpinPromptText || this._quickSpinPromptText.destroyed) return;

      this._quickSpinPromptText.visible = true;
      this._quickSpinPromptText.alpha = 1.0;

      setTimeout(() => {
        if (this._quickSpinPromptText && !this._quickSpinPromptText.destroyed) {
          this._quickSpinPromptText.visible = false;
        }
      }, 3500);
    };

    setTimeout(triggerPrompt, 1500);
    setInterval(triggerPrompt, 8000);

    this._spinBtn = new SpinButton(
      () => this._callbacks.onSpin?.(),
      () => this._callbacks.onStop?.(),
      this._callbacks.getUITexture,
      () => this._callbacks.onHoldStart?.(),
      () => this._callbacks.onHoldEnd?.()
    );
    this._spinBtn.x = 1075; this._spinBtn.y = BY + 32;
    this.bottomBarContainer.addChild(this._spinBtn);
  }
}
