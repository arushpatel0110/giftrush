import * as PIXI from 'pixi.js';
import { EventEmitter } from '../utils/EventEmitter.js';
import { GameConfig } from '../config/GameConfig.js';
import { PaylineConfig } from '../config/PaylineConfig.js';
import { AnimationUtils } from '../utils/AnimationUtils.js';

/**
 * PaylineManager – Draws the 5 payline win frames over the reel grid
 * and animates winning cells.
 */
export class PaylineManager extends EventEmitter {
  /**
   * @param {PIXI.Container}  stage       parent container (SlotMachine.container)
   * @param {SlotSymbol[][]}  symbolGrid  [reel][row] → SlotSymbol
   */
  constructor(stage, symbolGrid) {
    super();
    this._stage = stage;
    this._symbolGrid = symbolGrid;  // [reel][row]
    this._S = GameConfig.SYMBOL_SIZE;
    this._G = GameConfig.REEL_GAP;

    // Overlay for payline graphics inside SlotMachine container
    this._overlay = new PIXI.Container();
    this._overlay.zIndex = 100;
    stage.addChild(this._overlay);

    this._activeHighlights = [];
    this._animating = false;
  }

  /**
   * Draw paylines for the given array of win objects.
   * @param {WinEntry[]} wins Array of winning payline objects to draw
   */
  drawPaylines(wins, getUITexture = null, isAllTogetherMode = false, totalWinAmount = 0) {
    this._clearOverlay();

    if (!wins || !wins.length) {
      this.emit('paylineShow', { isAllTogether: false, paylineId: null, amount: 0, winningSymbolIds: [] });
      return;
    }

    // Format data to be displayed on bottom strip & portrait top header
    if (isAllTogetherMode || wins.length > 1) {
      const winningSymbolIds = [...new Set(wins.map(w => w.symbolId))];
      this.emit('paylineShow', { isAllTogether: true, paylineId: null, totalWinAmount, winningSymbolIds });
    } else {
      const win = wins[0];
      const winningSymbolIds = win ? [win.symbolId] : [];
      this.emit('paylineShow', { isAllTogether: false, paylineId: win.paylineId, amount: win.amount, winningSymbolIds });
    }

    const S = this._S;
    const G = this._G;
    const yOff = GameConfig.REEL_Y_OFFSET ?? 0;
    const badgeTex = getUITexture ? getUITexture('win_badge') : null;

    wins.forEach((win) => {
      const g = new PIXI.Graphics();

      // Centres of the 3 winning symbols in this payline (local to SlotMachine container)
      const centres = win.positions.map(([reel, row]) => ({
        x: (GameConfig.getReelX ? GameConfig.getReelX(reel) : reel * (S + G)) + S * 0.5,
        y: yOff + row * S + S * 0.5,
      }));

      const isDiagonal = Math.abs(centres[0].y - centres[2].y) > 10;
      const startX = centres[0].x - S * 0.5 - 12;
      const startY = centres[0].y;
      const endX = centres[2].x + S * 0.5 + 12;
      const endY = centres[2].y;

      // Base colors for neon cyan laser beam matching the image
      const baseColor = 0x00E5FF; // Electric cyan
      const midColor = 0x66F0FF; // Bright cyan-white
      const coreColor = 0xFFFFFF; // Pure white core

      // ── Sample 40 points along the payline path for smooth end-tapering ──
      const steps = 40;
      const pts = [];
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        if (isDiagonal) {
          if (t <= 0.5) {
            const u = t / 0.5;
            const P0 = { x: startX, y: startY };
            const P1 = { x: centres[0].x + S * 0.15, y: startY };
            const P2 = { x: centres[1].x - S * 0.40, y: centres[1].y };
            const P3 = { x: centres[1].x, y: centres[1].y };
            const bx = Math.pow(1 - u, 3) * P0.x + 3 * Math.pow(1 - u, 2) * u * P1.x + 3 * (1 - u) * Math.pow(u, 2) * P2.x + Math.pow(u, 3) * P3.x;
            const by = Math.pow(1 - u, 3) * P0.y + 3 * Math.pow(1 - u, 2) * u * P1.y + 3 * (1 - u) * Math.pow(u, 2) * P2.y + Math.pow(u, 3) * P3.y;
            pts.push({ x: bx, y: by });
          } else {
            const u = (t - 0.5) / 0.5;
            const P0 = { x: centres[1].x, y: centres[1].y };
            const P1 = { x: centres[1].x + S * 0.40, y: centres[1].y };
            const P2 = { x: centres[2].x - S * 0.15, y: endY };
            const P3 = { x: endX, y: endY };
            const bx = Math.pow(1 - u, 3) * P0.x + 3 * Math.pow(1 - u, 2) * u * P1.x + 3 * (1 - u) * Math.pow(u, 2) * P2.x + Math.pow(u, 3) * P3.x;
            const by = Math.pow(1 - u, 3) * P0.y + 3 * Math.pow(1 - u, 2) * u * P1.y + 3 * (1 - u) * Math.pow(u, 2) * P2.y + Math.pow(u, 3) * P3.y;
            pts.push({ x: bx, y: by });
          }
        } else {
          pts.push({
            x: startX + t * (endX - startX),
            y: startY + t * (endY - startY),
          });
        }
      }

      // Helper to draw beam path with two taper modes:
      //  fadeAlpha=false → width tapers at ends (core line)
      //  fadeAlpha=true  → alpha fades at ends, width stays full (glow layers)
      const drawBeamPath = (lineG, fullWidth, color, alpha, fadeAlpha = false) => {
        const fadeRatio = 0.30; // Outer 30% of each end fades

        for (let i = 0; i < steps; i++) {
          const t = (i + 0.5) / steps;
          let factor = 1.0;
          if (t < fadeRatio) {
            factor = 0.15 + 0.85 * (t / fadeRatio);
          } else if (t > 1 - fadeRatio) {
            factor = 0.15 + 0.85 * ((1 - t) / fadeRatio);
          }

          let w, a;
          if (fadeAlpha) {
            // Glow layers: keep width, fade alpha at ends so glow stays visible
            w = fullWidth;
            a = alpha * (0.25 + 0.75 * factor);
          } else {
            // Core lines: taper width at ends
            w = Math.max(1, fullWidth * factor);
            a = alpha;
          }

          lineG.lineStyle({
            width: w,
            color,
            alpha: a,
            cap: PIXI.LINE_CAP.ROUND,
            join: PIXI.LINE_JOIN.ROUND,
          });

          lineG.moveTo(pts[i].x, pts[i].y);
          lineG.lineTo(pts[i + 1].x, pts[i + 1].y);
        }
      };

      // ── Laser Beam Multi-Layer Glow ───────────────────────────────────
      // Glow layers: alpha fades at ends (glow visible throughout)
      drawBeamPath(g, 18, baseColor, 0.10, true);
      drawBeamPath(g, 12, baseColor, 0.20, true);
      drawBeamPath(g,  8, baseColor, 0.50, true);
      drawBeamPath(g,  5, midColor,  0.80, true);

      // Core lines: width tapers at ends (sharp pointed ends)
      drawBeamPath(g,  2.5, coreColor, 1.0, false);
      drawBeamPath(g,  1.5, 0xFFFFFF,  1.0, false);


      const ctr = new PIXI.Container();
      ctr.addChild(g);

      // ── One-by-One Mode: Win Amount Badge on Payline Middle ──
      if (!isAllTogetherMode) {
        const badgeContainer = new PIXI.Container();
        badgeContainer.x = centres[1].x;
        badgeContainer.y = centres[1].y;

        if (badgeTex && badgeTex !== PIXI.Texture.WHITE) {
          const badgeSprite = new PIXI.Sprite(badgeTex);
          badgeSprite.anchor.set(0.5);
          badgeSprite.width = 135;
          badgeSprite.height = 42;
          badgeContainer.addChild(badgeSprite);
        } else {
          const bgG = new PIXI.Graphics();
          bgG.beginFill(0x000000, 0.75);
          bgG.lineStyle(2, 0xFFE500, 0.9);
          bgG.drawRoundedRect(-65, -20, 130, 40, 8);
          bgG.endFill();
          badgeContainer.addChild(bgG);
        }

        const targetAmount = typeof win.amount === 'number' ? win.amount : parseFloat(win.amount || 0);

        const winText = new PIXI.Text(targetAmount.toFixed(2), {
          fontFamily: 'Outfit, Arial, sans-serif',
          fontSize: 24,
          fontWeight: 'bold',
          fontStyle: 'italic',
          fill: '#FFE500',
          stroke: '#000000',
          strokeThickness: 3,
          dropShadow: true,
          dropShadowColor: '#000000',
          dropShadowBlur: 3,
          dropShadowDistance: 1,
        });
        winText.anchor.set(0.5);
        badgeContainer.addChild(winText);
        badgeContainer.scale.set(1.0);

        // Smooth breathing scale pulse effect
        const pulseStartTime = performance.now();
        const pulseSpeed = 0.0065; // Slightly faster frequency (~1.0s cycle)
        const pulseScaleAmp = 0.05; // 5% scale breathing oscillation

        const animateBadgePulse = (now) => {
          if (!badgeContainer || badgeContainer.destroyed || !ctr || ctr.destroyed) return;
          const elapsed = now - pulseStartTime;
          const sinVal = Math.sin(elapsed * pulseSpeed);

          const currentScale = 1.0 + sinVal * pulseScaleAmp;
          badgeContainer.scale.set(currentScale);

          requestAnimationFrame(animateBadgePulse);
        };
        requestAnimationFrame(animateBadgePulse);

        ctr.addChild(badgeContainer);
      }

      // ── Progressive Left-to-Right Draw-in Mask Animation ─────────────
      const minX = Math.min(startX, endX) - 40;
      const maxX = Math.max(startX, endX) + 40;
      const totalSpan = maxX - minX;

      const maskG = new PIXI.Graphics();
      ctr.mask = maskG;
      ctr.addChild(maskG);

      const startTime = performance.now();
      const drawDuration = 300; // ms left-to-right laser draw time

      const animateDraw = (now) => {
        if (!ctr || ctr.destroyed) return;
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / drawDuration);
        const ease = 1 - (1 - progress) * (1 - progress); // Ease out quad

        maskG.clear();
        maskG.beginFill(0xFFFFFF);
        maskG.drawRect(minX, -200, totalSpan * ease, 1000);
        maskG.endFill();

        if (progress < 1) {
          requestAnimationFrame(animateDraw);
        }
      };
      requestAnimationFrame(animateDraw);

      // ── All-Together Mode: Blue Glow Bug particles along payline ──────────
      if (isAllTogetherMode) {
        const bugTex = getUITexture ? getUITexture('blue_glow_bug') : null;
        if (bugTex && bugTex !== PIXI.Texture.WHITE) {
          const PARTICLE_COUNT = 6;
          const BASE_SPEED = 0.0014;

          // Get position + tangent perpendicular at a given progress (0-1)
          const getPathInfo = (progress) => {
            const maxIdx = pts.length - 1;
            const rawIdx = progress * maxIdx;
            const idx = Math.min(Math.floor(rawIdx), maxIdx - 1);
            const f = rawIdx - idx;
            const pos = {
              x: pts[idx].x + f * (pts[idx + 1].x - pts[idx].x),
              y: pts[idx].y + f * (pts[idx + 1].y - pts[idx].y),
            };
            // Tangent direction (forward along path)
            const dx = pts[idx + 1].x - pts[idx].x;
            const dy = pts[idx + 1].y - pts[idx].y;
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            // Perpendicular: rotate tangent 90°
            return { pos, perpX: -dy / len, perpY: dx / len };
          };

          // Cluster all particles close together — start within a 15% window
          const clusterBase = Math.random() * 0.85; // random cluster starting position
          const bugSprites = Array.from({ length: PARTICLE_COUNT }, (_, k) => {
            const spr = new PIXI.Sprite(bugTex);
            spr.anchor.set(0.5);
            spr.scale.set(0.30 + Math.random() * 0.15);
            // Cluster: spread within 0–15% of path, not evenly across full path
            spr._progress = (clusterBase + (k / PARTICLE_COUNT) * 0.15) % 1;
            spr._speed = BASE_SPEED * (0.75 + Math.random() * 0.50);
            // Each particle has a fixed random perpendicular offset (±10px)
            spr._perpOffset = (Math.random() - 0.5) * 20;
            // Slow sine drift phase for gentle weave
            spr._driftPhase = Math.random() * Math.PI * 2;
            spr._driftSpeed = 0.001 + Math.random() * 0.001;
            const { pos, perpX, perpY } = getPathInfo(spr._progress);
            spr.x = pos.x + perpX * spr._perpOffset;
            spr.y = pos.y + perpY * spr._perpOffset;
            ctr.addChild(spr);
            return spr;
          });

          let lastBugTime = null;
          const animateBugs = (now) => {
            if (!ctr || ctr.destroyed) return;
            const dt = lastBugTime !== null ? Math.min(now - lastBugTime, 50) : 16;
            lastBugTime = now;
            let anyActive = false;
            bugSprites.forEach((spr) => {
              if (!spr || spr.destroyed || spr._done) return;
              spr._progress += spr._speed * dt;
              if (spr._progress >= 1) {
                spr._progress = 1;
                spr._done = true;
                spr.visible = false;
                return;
              }
              anyActive = true;
              spr._driftPhase += spr._driftSpeed * dt;
              const dynamicPerp = spr._perpOffset + Math.sin(spr._driftPhase) * 5;
              const { pos, perpX, perpY } = getPathInfo(spr._progress);
              spr.x = pos.x + perpX * dynamicPerp;
              spr.y = pos.y + perpY * dynamicPerp;
              spr.alpha = 1.0;
            });
            if (anyActive) requestAnimationFrame(animateBugs);
          };
          requestAnimationFrame(animateBugs);
        }
      }


      this._overlay.addChild(ctr);
      this._activeHighlights.push(ctr);
    });

    // ── Phase 1: All-Together Mode → Single Big Badge with Count-Up in Middle of Grid ──
    if (isAllTogetherMode) {
      const midX = (GameConfig.getReelX ? GameConfig.getReelX(1) : 1 * (S + G)) + S * 0.5;
      const midY = yOff + 1 * S + S * 0.5;

      const bigBadgeContainer = new PIXI.Container();
      bigBadgeContainer.x = midX;
      bigBadgeContainer.y = midY;
      bigBadgeContainer.zIndex = 100;

      if (badgeTex && badgeTex !== PIXI.Texture.WHITE) {
        const bigSprite = new PIXI.Sprite(badgeTex);
        bigSprite.anchor.set(0.5);
        bigSprite.width = 240;
        bigSprite.height = 76;
        bigBadgeContainer.addChild(bigSprite);
      } else {
        const bgG = new PIXI.Graphics();
        bgG.beginFill(0x000000, 0.85);
        bgG.lineStyle(3, 0xFFE500, 1.0);
        bgG.drawRoundedRect(-120, -38, 240, 76, 14);
        bgG.endFill();
        bigBadgeContainer.addChild(bgG);
      }

      const targetWin = typeof totalWinAmount === 'number' ? totalWinAmount : parseFloat(totalWinAmount || 0);

      const totalText = new PIXI.Text('0.00', {
        fontFamily: 'Outfit, Arial, sans-serif',
        fontSize: 44,
        fontWeight: 'bold',
        fontStyle: 'italic',
        fill: '#FFE500',
        stroke: '#000000',
        strokeThickness: 5,
        dropShadow: true,
        dropShadowColor: '#000000',
        dropShadowBlur: 5,
        dropShadowDistance: 2,
      });
      totalText.anchor.set(0.5);
      bigBadgeContainer.addChild(totalText);

      // Smooth count-up animation (0.00 -> totalWin) over 800ms
      const countUpStartTime = performance.now();
      const countUpDuration = 800; // ms

      const animateCountUp = (now) => {
        if (!bigBadgeContainer || bigBadgeContainer.destroyed) return;
        const elapsed = now - countUpStartTime;
        const progress = Math.min(1, elapsed / countUpDuration);
        const ease = 1 - (1 - progress) * (1 - progress); // Quad ease out
        const currentVal = (ease * targetWin).toFixed(2);
        totalText.text = currentVal;

        if (progress < 1) {
          requestAnimationFrame(animateCountUp);
        } else {
          totalText.text = targetWin.toFixed(2);
        }
      };
      requestAnimationFrame(animateCountUp);

      // Scale pop effect on central total win badge (0.6 -> 1.0)
      bigBadgeContainer.scale.set(0.6);
      const popStartTime = performance.now();
      const popDuration = 250; // ms
      const animatePop = (now) => {
        if (!bigBadgeContainer || bigBadgeContainer.destroyed) return;
        const elapsed = now - popStartTime;
        const progress = Math.min(1, elapsed / popDuration);
        const ease = 1 - (1 - progress) * (1 - progress);
        const scaleVal = 0.6 + 0.4 * ease;
        bigBadgeContainer.scale.set(scaleVal);

        if (progress < 1) {
          requestAnimationFrame(animatePop);
        }
      };
      requestAnimationFrame(animatePop);

      this._overlay.addChild(bigBadgeContainer);
      this._activeHighlights.push(bigBadgeContainer);
    }
  }

  /**
   * Dim non-winning cells and undim active winning cells.
   * @param {Set<string>} activeCellKeys Set of `${reel}_${row}` strings that are active.
   */
  updateCellDimming(activeCellKeys) {
    for (let r = 0; r < GameConfig.REELS; r++) {
      for (let row = 0; row < GameConfig.ROWS; row++) {
        const key = `${r}_${row}`;
        const cell = this._symbolGrid[r]?.[row];
        if (!cell) continue;

        if (activeCellKeys.has(key)) {
          cell.undim();
        } else {
          cell.dimCell();
        }
      }
    }
  }

  /** Clear all highlights immediately and undim all cells. */
  clearAll() {
    this._undimAllCells();
    this._clearOverlay();
    this._animating = false;
  }

  // ── Private ─────────────────────────────────────────────────

  _clearOverlay() {
    this._overlay.removeChildren();
    this._activeHighlights = [];
    for (let r = 0; r < GameConfig.REELS; r++) {
      for (let row = 0; row < GameConfig.ROWS; row++) {
        this._symbolGrid[r]?.[row]?.clearHighlight();
      }
    }
  }

  _undimAllCells() {
    for (let r = 0; r < GameConfig.REELS; r++) {
      for (let row = 0; row < GameConfig.ROWS; row++) {
        this._symbolGrid[r]?.[row]?.undim();
      }
    }
  }
}
