
import * as PIXI from 'pixi.js';
import { EventEmitter } from '../utils/EventEmitter.js';
import { GameConfig } from '../config/GameConfig.js';
import { SymbolConfig, ALL_SYMBOL_IDS } from '../config/SymbolConfig.js';
import { SlotMachine } from '../game/SlotMachine.js';
import { BonusGame } from '../bonus/BonusGame.js';
import { UIManager } from '../ui/UIManager.js';
import { MathUtils } from '../utils/MathUtils.js';
import { AnimationUtils } from '../utils/AnimationUtils.js';
import { SlotServerAPI } from '../api/SlotServerAPI.js';

/**
 * GameScene – The main game screen.
 * Wires together SlotMachine ↔ UIManager ↔ BonusGame.
 */
export class GameScene extends EventEmitter {
  constructor(engine) {
    super();
    this._engine = engine;
    this._audio = engine.audio;
    this._assets = engine.assets;

    // ── Server API ─────────────────────────────────────────
    this._api = new SlotServerAPI();
    this._sessionId = null;   // set after createSession resolves
    this._serverReady = false;

    this._balance = GameConfig.DEFAULT_BALANCE;
    this._bet = GameConfig.BET_STEPS[GameConfig.DEFAULT_BET_INDEX];
    this._spinning = false;
    this._autoplay = false;
    this._autoLeft = 0;
    this._spacebarEnabled = true;

    this.container = new PIXI.Container();
    this.container.sortableChildren = true;

    this._contentContainer = new PIXI.Container();
    this._contentContainer.zIndex = 2;
    this.container.addChild(this._contentContainer);
  }

  start() {
    this._buildBackground();
    this._buildSlotMachine();
    this._buildUI();
    this._buildBonusGame();
    this._updateLayout();
    // Connect to server (non-blocking – game is still playable if server is down)
    this._initServer();
  }

  async _initServer() {
    try {
      const session = await this._api.createSession(this._balance);
      this._sessionId = session.sessionId;
      this._serverReady = true;
      // Sync balance from server
      this._balance = session.balance;
      this._ui?.setBalance(this._balance);
      console.log(`[Server] ✓ Connected – session ${this._sessionId}`);
    } catch (err) {
      console.warn('[Server] ✗ Could not connect to backend – running in offline mode.', err.message);
      this._serverReady = false;
    }
  }

  stop() {
    if (this._onResize) {
      window.removeEventListener('resize', this._onResize);
    }
    if (this._onKeyDown) {
      window.removeEventListener('keydown', this._onKeyDown);
    }
    this.container.destroy({ children: true });
  }

  // ── Private builders ────────────────────────────────────────

  _buildBackground() {
    // Sprite background layer using loaded WebP textures (landscape vs portrait)
    this._bgSprite = new PIXI.Sprite();
    this._bgSprite.zIndex = 0;
    this.container.addChild(this._bgSprite);

    this._onResize = () => this._updateLayout();
    window.addEventListener('resize', this._onResize);
  }

  _updateLayout() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const isPortrait = h > w;

    // 1. Cover-scale background texture so it fills the screen without stretch/squeeze
    const key = isPortrait ? 'bg_portrait' : 'bg_landscape';
    const tex = this._assets.getUITexture(key);
    if (tex && this._bgSprite) {
      this._bgSprite.texture = tex;
      if (tex.width > 0 && tex.height > 0) {
        const coverScale = Math.max(w / tex.width, h / tex.height);
        this._bgSprite.width = tex.width * coverScale;
        this._bgSprite.height = tex.height * coverScale;
        this._bgSprite.x = Math.round((w - this._bgSprite.width) / 2);
        this._bgSprite.y = Math.round((h - this._bgSprite.height) / 2);
      } else {
        this._bgSprite.width = w;
        this._bgSprite.height = h;
        this._bgSprite.x = 0;
        this._bgSprite.y = 0;
      }
    }

    // 2. Scale & center game content container inside the screen
    const baseW = isPortrait ? GameConfig.PORTRAIT_WIDTH : GameConfig.WIDTH;
    const baseH = isPortrait ? GameConfig.PORTRAIT_HEIGHT : GameConfig.HEIGHT;
    const scale = Math.min(w / baseW, h / baseH);
    this._contentContainer.scale.set(scale);
    this._contentContainer.x = Math.round((w - baseW * scale) / 2);
    this._contentContainer.y = Math.round((h - baseH * scale) / 2);

    const gridX = GameConfig.getGridX(isPortrait);
    const gridY = GameConfig.getGridY(isPortrait);

    if (this._zoomAnimId) {
      cancelAnimationFrame(this._zoomAnimId);
      this._zoomAnimId = null;
    }

    if (this._slotMachine && this._slotMachine.container) {
      this._slotMachine.updateLayout?.(isPortrait);
      const slotScale = isPortrait ? 1.0 : 1.15;
      this._slotMachine.container.scale.set(slotScale);
      const gridW = 515;
      const gridH = 390;
      const gridX = isPortrait ? 95 : Math.round(640 - (gridW / 2) * slotScale);
      const gridY = isPortrait ? 340 : Math.round(330 - (gridH / 2) * slotScale);
      this._slotMachine.container.x = gridX;
      this._slotMachine.container.y = gridY;
    }
    if (this._ui) {
      this._ui.updateLayout(isPortrait);
      if (this._ui.hudContainer) {
        this._ui.hudContainer.scale.set(1.0);
        this._ui.hudContainer.x = 0;
        this._ui.hudContainer.y = 0;
      }
    }
    if (this._bonusGame) {
      this._bonusGame.updateLayout?.(isPortrait);
    }
    this._currentZoomScale = 1.0;
  }

  _drawSideTree(g, x, y, scale) {
    const S = scale;
    g.beginFill(0x8B4513).drawRect(x - 7 * S, y, 14 * S, 28 * S).endFill();
    [[55, 0], [70, -35 * S], [50, -68 * S]].forEach(([w, dy]) => {
      g.beginFill(0x1A5520, 0.7).drawPolygon([
        x, y + dy - w * S * 0.75,
        x - w * S / 2, y + dy,
        x + w * S / 2, y + dy,
      ]).endFill();
    });
  }

  _buildSlotMachine() {
    this._slotMachine = new SlotMachine(
      this._contentContainer,
      (id, blur) => this._assets.getSymbolTexture(id, blur),
      (name) => this._assets.getUITexture(name),
      (name) => this._assets.getSpineData(name)
    );

    this._slotMachine.on('spinStart', () => {
      this._setCameraZoom(1.0, 200);
      this._ui?.setSpinning(true);
      this._ui?.resetWin();
      this._ui?.resetWinDisplay();
    });

    this._slotMachine.on('anticipationStart', () => {
      this._setCameraZoom(1.10, 450);
      this._audio?.playAnticipation();
    });

    this._slotMachine.on('anticipationEnd', () => {
      this._setCameraZoom(1.0, 400);
      this._audio?.stopAnticipation();
    });

    this._slotMachine.on('paylineShow', (data) => {
      if (typeof data === 'object' && data !== null) {
        this._ui?.updateWinPresentationDisplay(data.isAllTogether, data.paylineId, this._lastTotalWin, data.winningSymbolIds);
      } else {
        this._ui?.updateWinPresentationDisplay(false, null, 0, []);
      }
    });

    this._slotMachine.on('reelStopped', (idx, symbols) => {
      const hasBonus = Array.isArray(symbols) && symbols.some(s => s === 8 || SymbolConfig[s]?.isBonus);
      if (hasBonus) {
        this._scatterCount = (this._scatterCount || 0) + 1;
        this._audio?.playScatter(this._scatterCount);
      } else {
        this._audio?.playReelStop();
      }
    });

    this._slotMachine.on('spinComplete', async (result, rawWinData) => {
      const winData = this._slotMachine.evaluateWithBet(result, this._bet);
      this._lastTotalWin = winData.totalWin;
      this._ui?.showWinAmount(winData.totalWin);
      await this._handleSpinComplete(result, winData);
    });

    this._slotMachine.on('bonusTriggered', async (result) => {
      await AnimationUtils.wait(200);
      this._audio?.playWaitingBg();
      await this._ui.showBonusIntro();
      this._audio?.stopWaitingBg();
      this._audio?.playBoxPopClick();
      await this._runBonusGame();
      this._slotMachine?.clearWinOverlays?.();
      this._finishSpin();
    });

    this._slotMachine.on('symbolClick', (symbolId, reelIndex, rowIndex, targetPos) => {
      if (!this._spinning) {
        this._ui?.showMiniPaytable(symbolId, this._bet, reelIndex, rowIndex, targetPos);
      }
    });
  }

  _setCameraZoom(targetScale = 1.0, duration = 400) {
    if (this._zoomAnimId) {
      cancelAnimationFrame(this._zoomAnimId);
      this._zoomAnimId = null;
    }

    const startScale = this._currentZoomScale ?? 1.0;
    const startTime = performance.now();

    const animateZoom = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - progress, 3);
      const curScale = startScale + (targetScale - startScale) * ease;
      this._currentZoomScale = curScale;

      const isPortrait = window.innerHeight > window.innerWidth;
      const slotBaseScale = isPortrait ? 1.0 : 1.15;
      const effectiveScale = curScale * slotBaseScale;
      const gridW = 515;
      const gridH = 390;
      const gridX = isPortrait ? 95 : Math.round(640 - (gridW / 2) * slotBaseScale);
      const gridY = isPortrait ? 340 : Math.round(330 - (gridH / 2) * slotBaseScale);

      // Smoothly zoom slot machine container around center of reel grid
      if (this._slotMachine && this._slotMachine.container) {
        const pivotX = gridX + (gridW / 2) * slotBaseScale;
        const pivotY = gridY + (gridH / 2) * slotBaseScale;
        this._slotMachine.container.scale.set(effectiveScale);
        this._slotMachine.container.x = gridX - (pivotX - gridX) * (curScale - 1);
        this._slotMachine.container.y = gridY - (pivotY - gridY) * (curScale - 1);
      }

      // Smoothly zoom HUD elements (5 lines ribbon, Buy Bonus button) together with slot frame
      if (this._ui && this._ui.hudContainer) {
        const pivotX = gridX + (gridW / 2) * slotBaseScale;
        const pivotY = gridY + (gridH / 2) * slotBaseScale;
        this._ui.hudContainer.scale.set(curScale);
        this._ui.hudContainer.x = -pivotX * (curScale - 1);
        this._ui.hudContainer.y = -pivotY * (curScale - 1);
      }

      // Smoothly scale background sprite to enhance cinematic depth
      if (this._bgSprite && this._bgSprite.texture) {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const tex = this._bgSprite.texture;
        if (tex.width > 0 && tex.height > 0) {
          const coverScale = Math.max(w / tex.width, h / tex.height) * curScale;
          this._bgSprite.width = tex.width * coverScale;
          this._bgSprite.height = tex.height * coverScale;
          this._bgSprite.x = Math.round((w - this._bgSprite.width) / 2);
          this._bgSprite.y = Math.round((h - this._bgSprite.height) / 2);
        }
      }

      if (progress < 1) {
        this._zoomAnimId = requestAnimationFrame(animateZoom);
      } else {
        this._zoomAnimId = null;
      }
    };

    this._zoomAnimId = requestAnimationFrame(animateZoom);
  }

  _buildUI() {
    this._ui = new UIManager(
      this._contentContainer,
      {
        onSpin: () => this._onSpinClick(),
        onStop: () => this._onStopClick(),
        onBetChange: (b) => { this._bet = b; this._ui.updateBuyBonusCost(b); },
        onAutoStart: (n, s) => this._startAutoplay(n, s),
        onAutoStop: () => this._stopAutoplay(),
        onHoldStart: () => this._startHoldSpin(),
        onHoldEnd: () => this._stopHoldSpin(),
        onBuyBonus: (cost) => this._onBuyBonus(cost),
        onTurbo: (v) => { this._userTurboSetting = v; this._slotMachine.turbo = v; },
        onMute: (m) => this._audio.toggleMute(),
        onVolumeChange: (v) => this._audio.setVolume(v),
        onMusic: (m) => this._audio.setMusicMuted(m),
        onSoundFx: (m) => this._audio.setSoundFxMuted(m),
        onSpacebar: (v) => { this._spacebarEnabled = v; },
        getUITexture: (name) => this._assets.getUITexture(name),
        getSymbolTexture: (id) => this._assets.getSymbolTexture(id),
        getSpineData: (name) => this._assets.getSpineData(name),
      },
      this._bet,
      this._balance
    );
    this._ui.setBalance(this._balance);
  }

  _buildBonusGame() {
    this._bonusGame = new BonusGame(
      this._contentContainer,
      this._audio,
      (name) => this._assets.getUITexture(name),
      (name) => this._assets.getSpineData(name),
      () => this._assets.getCoinTextures()
    );
    this._bonusGame.on('bonusComplete', (multiplier, winAmount) => {
      this._applyWin(winAmount);
    });

    // Temporary shortcuts for fast testing:
    //   Enter → opens Bonus Game directly
    //   P     → forces 2 paylines (top & middle rows) win on next spin
    this._onKeyDown = (e) => {
      if (e.code === 'Space' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        // Check if Spacebar to spin setting is turned ON
        if (this._spacebarEnabled) {
          // Do not spin if any modal popups are open (Settings, Paytable, History, Autoplay, etc.)
          if (this._ui && typeof this._ui.isAnyModalOpen === 'function' && this._ui.isAnyModalOpen()) {
            return;
          }
          // Do not spin if bonus game is active
          if (this._bonusGame && this._bonusGame.active) {
            return;
          }
          if (!this._spinning) {
            if (this._balance >= this._bet) {
              this._onSpinClick();
            } else {
              this._ui?.showMessage('Insufficient balance!', 0xFF4444);
            }
          }
        }
      }
      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        this._slotMachine.forceTwoPaylines = true;
        console.log('[TEST] 2 Paylines win armed — auto-spinning now...');
        if (!this._spinning && this._balance >= this._bet) {
          this._onSpinClick();
        }
      }
    };
    window.addEventListener('keydown', this._onKeyDown);
  }

  // ── Spin flow ────────────────────────────────────────────────

  _onSpinClick() {
    if (this._spinning) return;
    if (this._balance < this._bet) {
      this._ui.showMessage('Insufficient balance!', 0xFF4444);
      return;
    }
    this._audio.playSpin();
    // In server mode the server deducts the bet — skip local deduction
    if (!this._serverReady) this._deductBet();
    this._spin();
  }

  _onStopClick() { /* force-stop handled by reel internals */ }

  async _spin(buyBonus = false) {
    this._spinning = true;
    this._scatterCount = 0;

    if (this._serverReady && this._sessionId) {
      // ── SERVER MODE: get result from server, animate it ────
      try {
        let serverResult;
        if (buyBonus) {
          serverResult = await this._api.buyBonus(this._sessionId, this._bet);
        } else {
          serverResult = await this._api.spin(this._sessionId, this._bet);
        }

        // Sync balance from server (authoritative)
        this._balance = serverResult.balance;
        this._ui?.setBalance(this._balance);

        // Drive the reel animation with server-determined grid
        await this._slotMachine.spinWithResult(serverResult.grid, this._bet);

        // Server already evaluated wins — pass them straight to presentation
        const winData = {
          wins:           serverResult.wins,
          totalWin:       serverResult.totalWin,
          bonusTriggered: serverResult.bonusTriggered,
          bonusPositions: serverResult.bonusPositions,
          _serverResult:  serverResult,
        };
        this._lastServerWinData = winData;
        return;
      } catch (err) {
        console.warn('[Server] Spin API error – falling back to local RNG:', err.message);
        // Fall through to local spin below
      }
    }

    // ── OFFLINE MODE: use local RNG (fallback) ─────────────
    await this._slotMachine.spin(buyBonus, this._bet);
  }

  async _handleSpinComplete(result, winData) {
    let shouldStopWin = false;
    let stopReasonWin = '';

    if (winData.totalWin > 0) {
      this._audio.playWin(winData.totalWin);
      await this._ui.showWin(winData.totalWin);
      if (!this._serverReady) {
        this._applyWin(winData.totalWin);
      }

      if (this._autoplay && this._autoSettings) {
        if (this._autoSettings.stopOnAnyWin) {
          shouldStopWin = true;
          stopReasonWin = 'Autospin stopped: Win achieved';
        } else if (this._autoSettings.singleWinExceeds && winData.totalWin >= this._autoSettings.singleWinExceeds) {
          shouldStopWin = true;
          stopReasonWin = `Autospin stopped: Win exceeds ${this._autoSettings.singleWinExceeds}`;
        }
      }
    } else {
      this._audio.playNoWin();
    }

    if (shouldStopWin) {
      this._stopAutoplay();
      this._ui.showMessage(stopReasonWin, 0x00FF88);
      this._spinning = false;
      this._ui.setSpinning(false);
      this._ui.setBonusActive(false);
      return;
    }

    this._finishSpin();
  }

  _finishSpin() {
    this._spinning = false;
    this._ui.setSpinning(false);
    this._ui.setBonusActive(false);

    if (this._pendingHistoryRecord) {
      this._pendingHistoryRecord.balanceAfter = this._balance;
      this._ui.addHistoryRecord(this._pendingHistoryRecord);
      this._pendingHistoryRecord = null;
    }

    if (this._autoplay) {
      if (this._autoSettings) {
        if (this._autoSettings.balanceIncrease && (this._balance - this._initialAutoBalance) >= this._autoSettings.balanceIncrease) {
          this._stopAutoplay();
          this._ui.showMessage(`Autospin stopped: Balance +${this._autoSettings.balanceIncrease}`, 0x00FF88);
          return;
        }
        if (this._autoSettings.balanceDecrease && (this._initialAutoBalance - this._balance) >= this._autoSettings.balanceDecrease) {
          this._stopAutoplay();
          this._ui.showMessage(`Autospin stopped: Balance -${this._autoSettings.balanceDecrease}`, 0xFF8844);
          return;
        }
      }

      if (this._autoLeft > 0) {
        this._autoLeft--;
        this._ui.decrementAutoplay();
        if (this._autoLeft > 0 && this._balance >= this._bet) {
          setTimeout(() => {
            if (this._autoplay) {
              this._onSpinClick();
            }
          }, 600);
        } else {
          this._stopAutoplay();
        }
      } else {
        this._stopAutoplay();
      }
    } else if (this._isHoldSpinning && this._balance >= this._bet) {
      setTimeout(() => {
        if (this._isHoldSpinning) {
          this._onSpinClick();
        }
      }, 50);
    }
  }

  _deductBet() {
    const prevBal = this._balance;
    this._balance = parseFloat((this._balance - this._bet).toFixed(2));
    this._ui.setBalance(this._balance);

    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const dateTimeStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    this._pendingHistoryRecord = {
      dateTimeStr,
      bet: this._bet,
      balanceBefore: prevBal,
      balanceAfter: this._balance,
      win: 0,
      currency: 'FUN',
    };
  }

  _applyWin(amount) {
    this._balance = parseFloat((this._balance + amount).toFixed(2));
    this._ui.setBalance(this._balance);

    if (this._pendingHistoryRecord) {
      this._pendingHistoryRecord.win = parseFloat((this._pendingHistoryRecord.win + amount).toFixed(2));
      this._pendingHistoryRecord.balanceAfter = this._balance;
    }
  }

  async _runBonusGame() {
    this._ui?.setBonusActive(true);
    this._ui?.setHUDVisible(true);
    this._ui?.setBottomBarVisible(true);

    const onCelebration = () => {
      this._ui?.setBottomBarVisible(false);
    };
    this._bonusGame?.once('celebrationStart', onCelebration);

    try {
      const result = await this._bonusGame.play(this._bet);
      return result;
    } finally {
      this._bonusGame?.off('celebrationStart', onCelebration);
      this._ui?.setBonusActive(false);
      this._ui?.setHUDVisible(true);
      this._ui?.setBottomBarVisible(true);
      this._slotMachine?.clearWinOverlays?.();
    }
  }

  async _onBuyBonus(cost) {
    if (this._spinning) return;
    if (this._balance < cost) {
      this._ui.showMessage('Insufficient balance for Buy Bonus!', 0xFF4444);
      return;
    }
    this._audio.playBuyBonus();
    const prevBal = this._balance;
    this._balance = parseFloat((this._balance - cost).toFixed(2));
    this._ui.setBalance(this._balance);

    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const dateTimeStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    this._pendingHistoryRecord = {
      dateTimeStr,
      bet: cost,
      balanceBefore: prevBal,
      balanceAfter: this._balance,
      win: 0,
      currency: 'FUN',
    };

    this._spinning = true;
    this._ui.setSpinning(true);
    await this._slotMachine.spin(true); // force bonus trigger
  }

  _startAutoplay(count, settings = null) {
    if (this._spinning) return;
    this._autoplay = true;
    this._autoLeft = count;
    this._autoSettings = settings;
    this._initialAutoBalance = this._balance;

    if (settings && settings.quickSpin !== undefined) {
      this._prevTurbo = this._slotMachine.turbo;
      this._slotMachine.turbo = settings.quickSpin;
    }

    this._ui.setAutoplayActive(true, count);
    this._onSpinClick();
  }

  _stopAutoplay() {
    this._autoplay = false;
    this._autoLeft = 0;
    if (this._prevTurbo !== undefined) {
      this._slotMachine.turbo = this._prevTurbo;
      this._prevTurbo = undefined;
    }
    this._autoSettings = null;
    this._ui?.setAutoplayActive(false);
  }

  _startHoldSpin() {
    this._isHoldSpinning = true;
    this._prevHoldTurbo = this._slotMachine.turbo;
    this._slotMachine.turbo = true;
    this._ui?.setHoldSpinActive(true);
    if (!this._spinning && this._balance >= this._bet) {
      this._onSpinClick();
    }
  }

  _stopHoldSpin() {
    this._isHoldSpinning = false;
    this._slotMachine.turbo = this._userTurboSetting || false;
    this._ui?.setHoldSpinActive(false);
  }
}
