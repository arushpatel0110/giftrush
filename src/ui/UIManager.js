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

    // HUD Container for main screen overlay elements (Buy Bonus, 5 lines ribbon, top header) - zIndex 60 (Above BonusGame at 50, Below all modals at 9990+)
    this.hudContainer = new PIXI.Container();
    this.hudContainer.sortableChildren = true;
    this.hudContainer.zIndex = 60;
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
    this._settingsModal.zIndex = 9999;
    stage.addChild(this._settingsModal);

    this._paytableModal = new PaytableModal({
      getUITexture: this._callbacks.getUITexture,
      getSymbolTexture: this._callbacks.getSymbolTexture,
      onShow: () => this.setPaytableActive(true),
      onClose: () => this.setPaytableActive(false),
      onSwitchTab: modalNav.onSwitchTab,
      onSoundToggle: modalNav.onSoundToggle,
    });
    this._paytableModal.zIndex = 10000;
    stage.addChild(this._paytableModal);

    this._historyModal = new HistoryModal({
      getUITexture: this._callbacks.getUITexture,
      onShow: () => this.setPaytableActive(true),
      onClose: () => this.setPaytableActive(false),
      onSwitchTab: modalNav.onSwitchTab,
      onSoundToggle: modalNav.onSoundToggle,
    });
    this._historyModal.zIndex = 10000;
    stage.addChild(this._historyModal);

    this._rulesModal = new RulesModal({
      getUITexture: this._callbacks.getUITexture,
      onShow: () => this.setPaytableActive(true),
      onClose: () => this.setPaytableActive(false),
      onSwitchTab: modalNav.onSwitchTab,
      onSoundToggle: modalNav.onSoundToggle,
    });
    this._rulesModal.zIndex = 10000;
    stage.addChild(this._rulesModal);

    this._miniPaytableModal = new MiniPaytableModal({
      getUITexture: this._callbacks.getUITexture,
      getSymbolTexture: this._callbacks.getSymbolTexture,
      onShow: () => this.setPaytableActive(true),
      onClose: () => this.setPaytableActive(false),
    });
    this._miniPaytableModal.zIndex = 9995;
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
    this._buyBonusConfirmModal.zIndex = 9990;
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
    this._autoplaySettingsModal.zIndex = 9995;
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
    this._betSelectionModal.zIndex = 9998;
    stage.addChild(this._betSelectionModal);

    this._bonusIntroModal = new BonusIntroModal({
      getSpineData: this._callbacks.getSpineData,
      getTexture: this._callbacks.getUITexture,
    });
    this._bonusIntroModal.zIndex = 9995;
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
      // In landscape, bottomBarContainer has zIndex 10005 which sits above the modal's
      // default 9995. Temporarily raise the modal above it so its black backdrop
      // visually covers the bottom strip — without hiding any elements.
      if (!this._isPortrait) {
        this._bonusIntroModal.zIndex = 10010;
      } else {
        this._bonusIntroModal.zIndex = 9995;
      }

      await this._bonusIntroModal.show();

      // Restore original zIndex after popup is dismissed
      this._bonusIntroModal.zIndex = 9995;
    }
  }
  setBonusActive(active) {
    this._bonusActive = active;
    this._buyBonusBtn?.setBonusActive(active);
    if (this._buyBonusBtn) {
      this._buyBonusBtn.visible = !active;
    }
    if (this._fiveLinesRibbon) {
      this._fiveLinesRibbon.visible = !active;
    }
    if (this._topPaytableHeader) {
      this._topPaytableHeader.visible = !active && this._isPortrait;
    }

    if (this.bottomBarContainer) {
      this.bottomBarContainer.interactiveChildren = !active;
      this.bottomBarContainer.eventMode = active ? 'none' : 'auto';
      this.bottomBarContainer.interactive = !active;
    }
    if (this._spinBtn) {
      this._spinBtn.eventMode = active ? 'none' : 'auto';
      this._spinBtn.interactive = !active;
    }
    if (this._betPanel) {
      this._betPanel.setEnabled(!active);
    }
    if (this._autoPanel) {
      this._autoPanel.setEnabled(!active);
    }
    if (this._settingsBtn) {
      this._settingsBtn.eventMode = active ? 'none' : 'auto';
      this._settingsBtn.interactive = !active;
    }
    if (this._infoBtn) {
      this._infoBtn.eventMode = active ? 'none' : 'auto';
      this._infoBtn.interactive = !active;
    }
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

  setHUDVisible(visible) {
    if (this.hudContainer) {
      this.hudContainer.visible = visible;
    }
    if (this._bonusActive && this._topPaytableHeader) {
      this._topPaytableHeader.visible = false;
    }
  }

  setBottomBarVisible(visible) {
    if (this.bottomBarContainer) {
      if (this._bonusActive && this._isPortrait) {
        this.bottomBarContainer.visible = false;
      } else {
        this.bottomBarContainer.visible = visible;
      }
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

  isFullModalOpen() {
    return !!(
      this._paytableModal?.visible ||
      this._rulesModal?.visible ||
      this._historyModal?.visible ||
      this._buyBonusConfirmModal?.visible
    );
  }

  setPaytableActive(active) {
    if (!active && this.isAnyModalOpen()) {
      return;
    }
    this._isModalOpen = active;

    if (this._isPortrait) {
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
      // Properly gate win container, line pays, and quick spin prompt text visibility
      if (active) {
        if (this._quickSpinPromptText) this._quickSpinPromptText.visible = false;
        if (this._totalWinContainer) this._totalWinContainer.visible = false;
        if (this._linePaysText) this._linePaysText.visible = false;
      } else {
        if (this._isWinActive) {
          const hasLinePays = !!(this._linePaysText && this._linePaysText.text);
          if (this._totalWinContainer) {
            this._totalWinContainer.x = (this._isPortrait && hasLinePays) ? 490 : (this._isPortrait ? 360 : 730);
            this._totalWinContainer.visible = true;
          }
          if (this._linePaysText && this._linePaysText.text) this._linePaysText.visible = true;
          if (this._quickSpinPromptText) this._quickSpinPromptText.visible = false;
        } else {
          if (this._totalWinContainer) this._totalWinContainer.visible = false;
          if (this._linePaysText) this._linePaysText.visible = false;
          if (this._quickSpinPromptText) this._quickSpinPromptText.visible = false;
        }
      }
      if (this._spinBtn) this._spinBtn.setModalOpenState?.(active);
      return;
    }

    // ── Landscape ──────────────────────────────────────────────
    const showGreyStrip = this.isFullModalOpen();

    if (this._bottomStripGraphics) {
      this._bottomStripGraphics.clear();
      this._bottomStripGraphics.beginFill(0x1A1A1A, 1.0);
      this._bottomStripGraphics.drawRect(-1500, 655, 4000, 65);
      this._bottomStripGraphics.endFill();
      this._bottomStripGraphics.visible = showGreyStrip;
    }
    if (this._bottomStripSprite) {
      this._bottomStripSprite.visible = !showGreyStrip;
    }
    if (this._balanceDisplay) {
      this._balanceDisplay.visible = true;
    }
    if (this._betPanel) {
      if (this._betPanel._lbl) this._betPanel._lbl.visible = true;
      if (this._betPanel._betText) this._betPanel._betText.visible = true;
    }
    if (this._spinBtn) this._spinBtn.setModalOpenState?.(active);
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
    this._stopHeaderPulse();
  }

  updateTopHeaderWinHighlights(winningSymbolIds = []) {
    if (!this._topHeaderCategories || !this._isPortrait) return;

    const hasWins = Array.isArray(winningSymbolIds) && winningSymbolIds.length > 0;

    this._topHeaderCategories.forEach((cat) => {
      if (cat.key === 'low') {
        const lowWon = hasWins && cat.ids.some(id => winningSymbolIds.includes(id));
        cat.isWinner = lowWon;

        // Granular check for each of the 4 low-tier symbols
        cat.ids.forEach((id) => {
          const spr = this._lowSymbolSprites?.[id];
          if (!spr) return;
          const isThisLowWon = hasWins && winningSymbolIds.includes(id);
          spr.isWinner = isThisLowWon;

          const base = spr._baseScale ?? spr.scale.x;
          if (!hasWins) {
            spr.alpha = 1.0;
            spr.scale.set(base);
          } else if (isThisLowWon) {
            spr.alpha = 1.0;
          } else {
            spr.alpha = 0.35; // Dim specific low symbol if it didn't win
            spr.scale.set(base);
          }
        });

        // Low group text ("3: X FUN")
        if (this._txtLowGroup) {
          this._txtLowGroup.alpha = (!hasWins || lowWon) ? 1.0 : 0.35;
        }

      } else {
        const isWinner = hasWins && cat.ids.some(id => winningSymbolIds.includes(id));
        cat.isWinner = isWinner;

        if (!hasWins) {
          cat.container.alpha = 1.0;
          cat.container.scale.set(1.0);
        } else if (isWinner) {
          cat.container.alpha = 1.0;
        } else {
          cat.container.alpha = 0.35; // Dim non-winning category
          cat.container.scale.set(1.0);
        }
      }
    });

    if (hasWins) {
      if (!this._headerPulseAnimId) {
        this._startHeaderPulse();
      }
    } else {
      this._stopHeaderPulse();
    }
  }

  _startHeaderPulse() {
    this._stopHeaderPulse();
    const startTime = performance.now();
    const pulseSpeed = 0.0065;
    const pulseScaleAmp = 0.08;

    const animatePulse = (now) => {
      if (!this._topHeaderCategories) return;
      const elapsed = now - startTime;
      const sinVal = Math.sin(elapsed * pulseSpeed);
      const currentScale = 1.0 + sinVal * pulseScaleAmp;

      this._topHeaderCategories.forEach((cat) => {
        if (cat.key === 'low') {
          if (this._txtLowGroup) {
            if (cat.isWinner) {
              this._txtLowGroup.scale.set(currentScale);
            } else {
              this._txtLowGroup.scale.set(1.0);
            }
          }
          cat.ids.forEach((id) => {
            const spr = this._lowSymbolSprites?.[id];
            if (spr) {
              const base = spr._baseScale ?? spr.scale.x;
              if (spr.isWinner) {
                spr.scale.set(base * currentScale);
              } else {
                spr.scale.set(base);
              }
            }
          });
        } else {
          if (cat.isWinner) {
            cat.container.scale.set(currentScale);
          } else {
            cat.container.scale.set(1.0);
          }
        }
      });

      this._headerPulseAnimId = requestAnimationFrame(animatePulse);
    };

    this._headerPulseAnimId = requestAnimationFrame(animatePulse);
  }

  _stopHeaderPulse() {
    if (this._headerPulseAnimId) {
      cancelAnimationFrame(this._headerPulseAnimId);
      this._headerPulseAnimId = null;
    }
    if (this._topHeaderCategories) {
      this._topHeaderCategories.forEach((cat) => {
        cat.isWinner = false;
        cat.container.alpha = 1.0;
        cat.container.scale.set(1.0);
        if (cat.key === 'low') {
          cat.ids.forEach((id) => {
            const spr = this._lowSymbolSprites?.[id];
            if (spr) {
              spr.isWinner = false;
              spr.alpha = 1.0;
              spr.scale.set(spr._baseScale ?? spr.scale.x);
            }
          });
          if (this._txtLowGroup) {
            this._txtLowGroup.alpha = 1.0;
            this._txtLowGroup.scale.set(1.0);
          }
        }
      });
    }
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
      this._stopHeaderPulse();
    }
  }

  updateWinPresentationDisplay(isAllTogether, paylineId, totalWin = 0, winningSymbolIds = []) {
    this.updateTopHeaderWinHighlights(winningSymbolIds);

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
          this._totalWinContainer.y = BY - 88;
        }
      } else {
        if (this._linePaysText) {
          this._linePaysText.text = `Line ${paylineId} pays`;
          this._linePaysText.anchor.set(0.5, 0.5);
          this._linePaysText.style.fontSize = 26;
          this._linePaysText.x = 230;
          this._linePaysText.y = BY - 65;
          this._linePaysText.visible = true;
        }
        if (this._totalWinContainer) {
          this._totalWinContainer.x = 490;
          this._totalWinContainer.y = BY - 88;
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

    this._isModalOpen = this.isAnyModalOpen();

    if (isPortrait) {
      // ── Portrait Layout (720 x 1280 canvas) ─────────────────────
      if (this._topPaytableHeader) this._topPaytableHeader.visible = true;
      this._updateTopPaytableText(this._currentBet || 0.10);

      if (this._brandLogo) { this._brandLogo.x = 24; this._brandLogo.y = 24; }
      if (this._muteBtn) { this._muteBtn.x = 600; this._muteBtn.y = 28; }
      if (this._timeText) { this._timeText.x = 680; this._timeText.y = 28; }
      if (this._rBanner) { this._rBanner.visible = false; }
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
      if (this.bottomBarContainer) this.bottomBarContainer.zIndex = 0;

      if (this._linePaysText) {
        this._linePaysText.style.fontSize = 26;
        this._linePaysText.anchor.set(0.5, 0.5);
        this._linePaysText.x = 230; this._linePaysText.y = BY - 65;
        this._linePaysText.visible = !this._isModalOpen && !!this._isWinActive && !!(this._linePaysText.text && this._linePaysText.text.length > 0);
      }
      if (this._totalWinContainer) {
        const hasLinePays = !!(this._linePaysText && this._linePaysText.visible);
        this._totalWinContainer.x = hasLinePays ? 490 : 360;
        this._totalWinContainer.y = BY - 88;
        if (this._totalWinLabelText) this._totalWinLabelText.style.fontSize = 22;
        if (this._totalWinAmountText) this._totalWinAmountText.style.fontSize = 36;
        this._totalWinContainer.visible = !this._isModalOpen && !!this._isWinActive;
      }
      if (this._balanceDisplay) {
        this._balanceDisplay.x = 60; this._balanceDisplay.y = BY + 100;
        this._balanceDisplay.updateLayout?.(true);
        this._balanceDisplay.visible = !this._isModalOpen;
      }
      if (this._quickSpinPromptText) {
        this._quickSpinPromptText.style.fontSize = 26;
        this._quickSpinPromptText.x = 360; this._quickSpinPromptText.y = BY - 65;
        if (this._isModalOpen || this._isWinActive) {
          this._quickSpinPromptText.visible = false;
        }
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
      if (this._muteBtn) { this._muteBtn.x = W - 115; this._muteBtn.y = 24; }
      if (this._timeText) { this._timeText.x = W - 45; this._timeText.y = 24; }
      if (this._rBanner) { this._rBanner.visible = true; this._rBanner.x = W - 6; this._rBanner.y = 45; }
      if (this._buyBonusBtn) { this._buyBonusBtn.x = 105; this._buyBonusBtn.y = 380; }
      if (this._fiveLinesRibbon) { this._fiveLinesRibbon.x = 1020; this._fiveLinesRibbon.y = 344; }

      const showGreyStrip = this.isFullModalOpen();
      if (this.bottomBarContainer) this.bottomBarContainer.zIndex = 10005;

      if (this._bottomStripGraphics) {
        this._bottomStripGraphics.clear();
        this._bottomStripGraphics.beginFill(0x1A1A1A, 1.0);
        this._bottomStripGraphics.drawRect(-1500, BY, 4000, BH);
        this._bottomStripGraphics.endFill();
        this._bottomStripGraphics.visible = showGreyStrip;
      }
      if (this._bottomStripSprite) {
        this._bottomStripSprite.y = BY;
        this._bottomStripSprite.height = BH;
        this._bottomStripSprite.visible = !showGreyStrip;
      }
      if (this._infoBtn) { this._infoBtn.x = 95; this._infoBtn.y = BY + 20; this._infoBtn.updateLayout?.(false); }
      if (this._settingsBtn) { this._settingsBtn.x = 122; this._settingsBtn.y = BY + 20; this._settingsBtn.updateLayout?.(false); }
      if (this._balanceDisplay) {
        this._balanceDisplay.x = 85; this._balanceDisplay.y = BY + 46;
        this._balanceDisplay.updateLayout?.(false);
        this._balanceDisplay.visible = true;
      }
      if (this._betPanel) {
        this._betPanel.x = 250; this._betPanel.y = BY + 10;
        this._betPanel.updateLayout?.(false);
        if (this._betPanel._lbl) this._betPanel._lbl.visible = true;
        if (this._betPanel._betText) this._betPanel._betText.visible = true;
      }
      if (this._totalWinLabelText) this._totalWinLabelText.style.fontSize = 17;
      if (this._totalWinAmountText) this._totalWinAmountText.style.fontSize = 28;
      if (this._linePaysText) { this._linePaysText.style.fontSize = 20; this._linePaysText.x = 510; this._linePaysText.y = BY + 32; }
      if (this._totalWinContainer) { this._totalWinContainer.x = (this._linePaysText?.visible ? 730 : 650); this._totalWinContainer.y = BY + 12; }
      if (this._autoPanel) { this._autoPanel.x = 1010; this._autoPanel.y = BY + 32; this._autoPanel.updateLayout?.(false); }
      if (this._quickSpinPromptText) { this._quickSpinPromptText.style.fontSize = 20; this._quickSpinPromptText.x = 650; this._quickSpinPromptText.y = BY + 32; }
      if (this._spinBtn) { this._spinBtn.x = 1075; this._spinBtn.y = BY + 32; this._spinBtn.updateLayout?.(false, this._isModalOpen); }
    }

    if (this._bonusActive) {
      if (this.hudContainer) this.hudContainer.visible = true;
      if (this._topPaytableHeader) this._topPaytableHeader.visible = false;
      if (this._buyBonusBtn) this._buyBonusBtn.visible = false;
      if (this._fiveLinesRibbon) this._fiveLinesRibbon.visible = false;
      if (this.bottomBarContainer) {
        this.bottomBarContainer.visible = !isPortrait;
      }
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
      fontFamily: 'Outfit, sans-serif',
      fontSize: 18,
      fill: 0xFFFFFF,
      fontWeight: 'bold',
      dropShadow: true,
      dropShadowColor: 0x000000,
      dropShadowBlur: 2,
      dropShadowDistance: 1,
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
      fontSize: 21,
      fontWeight: 'bold',
      fill: '#FF7A00',
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
          sprite._baseScale = s; // store so pulse code can scale relative to this
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
    const s7 = createSymbolSprite(SYMBOL_IDS.SEVEN, 80, 80);
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
    const sB = createSymbolSprite(SYMBOL_IDS.BONUS, 80, 80);
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
    const sStar = createSymbolSprite(SYMBOL_IDS.STAR, 80, 80);
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
    const sBell = createSymbolSprite(SYMBOL_IDS.BELL, 80, 80);
    sBell.y = 0;
    c4.addChild(sBell);
    this._txtBell = new PIXI.Text('', textStyle);
    this._txtBell.anchor.set(0.5);
    this._txtBell.y = 48;
    c4.addChild(this._txtBell);
    this._topPaytableHeader.addChild(c4);

    // ── Row 2, Col 2: 4 Low Symbols Cluster in 1 Row with slight overlap ──
    const c5 = new PIXI.Container();
    c5.x = 360; c5.y = 195;

    const lowCluster = new PIXI.Container();
    lowCluster.y = -2;
    lowCluster.sortableChildren = true;

    const lowIds = [
      { id: SYMBOL_IDS.CANDY_CANE, dx: -36 },
      { id: SYMBOL_IDS.GINGERBREAD, dx: -12 },
      { id: SYMBOL_IDS.ORNAMENT, dx: 12 },
      { id: SYMBOL_IDS.SANTA_HAT, dx: 36 },
    ];

    this._lowSymbolSprites = {};

    lowIds.forEach((item, index) => {
      const spr = createSymbolSprite(item.id, 48, 48);
      spr.x = item.dx;
      spr.y = 0;
      spr.zIndex = index;
      lowCluster.addChild(spr);
      this._lowSymbolSprites[item.id] = spr;
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
    const sMit = createSymbolSprite(SYMBOL_IDS.MITTEN, 80, 80);
    sMit.y = 0;
    c6.addChild(sMit);
    this._txtMitten = new PIXI.Text('', textStyle);
    this._txtMitten.anchor.set(0.5);
    this._txtMitten.y = 48;
    c6.addChild(this._txtMitten);
    this._topPaytableHeader.addChild(c6);

    // Register top header categories for interactive win pulsing & dimming
    this._topHeaderCategories = [
      { key: 'seven', ids: [SYMBOL_IDS.SEVEN], container: c1 },
      { key: 'bonus', ids: [SYMBOL_IDS.BONUS], container: c2 },
      { key: 'star', ids: [SYMBOL_IDS.STAR], container: c3 },
      { key: 'bell', ids: [SYMBOL_IDS.BELL], container: c4 },
      { key: 'low', ids: [SYMBOL_IDS.CANDY_CANE, SYMBOL_IDS.GINGERBREAD, SYMBOL_IDS.ORNAMENT, SYMBOL_IDS.SANTA_HAT], container: c5 },
      { key: 'mitten', ids: [SYMBOL_IDS.MITTEN], container: c6 },
    ];

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
          // In landscape, bottomBarContainer has zIndex 10005 which sits above the
          // modal's default 9990. Raise it so the black backdrop covers the strip.
          this._buyBonusConfirmModal.zIndex = this._isPortrait ? 9990 : 10010;
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
    this._fiveLinesRibbon.x = 1030;
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
    }, () => {
      this.closeAllModals();
    });
    this._betPanel.x = 250; this._betPanel.y = BY + 10;
    this.bottomBarContainer.addChild(this._betPanel);

    // ── Bottom Bar Win Presentation Area (Matching Reference Image) ──
    this._linePaysText = new PIXI.Text('', {
      fontFamily: '"Roboto Condensed", Arial, sans-serif',
      fontSize: 20,
      fill: '#FFFFFF',
      fontWeight: '200',
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
      fontFamily: '"Roboto Condensed", Arial, sans-serif',
      fontSize: 17,
      fill: '#FFFFFF',
      fontWeight: '200',
    });
    this._totalWinLabelText.anchor.set(0.5, 0);
    this._totalWinLabelText.x = 0;
    this._totalWinLabelText.y = 0;
    this._totalWinContainer.addChild(this._totalWinLabelText);

    this._totalWinAmountText = new PIXI.Text('0.00 FUN', {
      fontFamily: '"Roboto Condensed", Arial, sans-serif',
      fontSize: 28,
      fill: '#FFFFFF',
      fontWeight: '300',
    });
    this._totalWinAmountText.anchor.set(0.5, 0);
    this._totalWinAmountText.x = 0;
    this._totalWinAmountText.y = 18;
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
      fontFamily: '"Roboto Condensed", Arial, sans-serif',
      fontSize: 20,
      fill: '#FFFFFF',
      fontWeight: '280',
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
      () => {
        this.closeAllModals();
        this._callbacks.onSpin?.();
      },
      () => this._callbacks.onStop?.(),
      this._callbacks.getUITexture,
      () => {
        this.closeAllModals();
        this._callbacks.onHoldStart?.();
      },
      () => this._callbacks.onHoldEnd?.()
    );
    this._spinBtn.x = 1075; this._spinBtn.y = BY + 32;
    this.bottomBarContainer.addChild(this._spinBtn);
  }
}
