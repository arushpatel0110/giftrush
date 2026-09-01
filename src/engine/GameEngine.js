import * as PIXI from 'pixi.js';
import { EventEmitter } from '../utils/EventEmitter.js';
import { AssetLoader } from './AssetLoader.js';
import { AudioManager } from './AudioManager.js';
import { GameConfig } from '../config/GameConfig.js';

/**
 * GameEngine – Creates and owns the PIXI.Application instance.
 * Provides the renderer, ticker, and shared services (audio, assets).
 * Everything else is a child of this engine.
 */
export class GameEngine extends EventEmitter {
  constructor() {
    super();

    /** @type {PIXI.Application} */
    this.app = new PIXI.Application({
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundAlpha: 0,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      powerPreference: 'high-performance',
    });

    /** @type {AssetLoader} */
    this.assets = new AssetLoader(this.app);

    /** @type {AudioManager} */
    this.audio = new AudioManager();

    this._resizeObserver = null;
    this._sceneStack = [];
  }

  /** Mount the canvas and start the engine. */
  async mount(containerId) {
    const container = document.getElementById(containerId);
    if (!container) throw new Error(`Container #${containerId} not found`);
    container.appendChild(this.app.view);

    this._setupResize(container);

    // Unlock audio on first interaction
    const unlockAudio = () => {
      this.audio.init();
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
    window.addEventListener('pointerdown', unlockAudio);
    window.addEventListener('keydown', unlockAudio);

    // Global button click audio feedback (snd/click.ogg)
    window.addEventListener('pointerdown', () => {
      this.audio.playClick();
    });

    this.emit('mounted');
  }

  /** Push a scene onto the display stack. */
  pushScene(scene) {
    // Pause current top if any
    const prev = this._sceneStack[this._sceneStack.length - 1];
    if (prev) { prev.pause?.(); this.app.stage.removeChild(prev.container); }

    this._sceneStack.push(scene);
    this.app.stage.addChild(scene.container);
    scene.start?.();
  }

  /** Pop the top scene and resume the one below. */
  popScene() {
    const top = this._sceneStack.pop();
    if (!top) return;
    top.stop?.();
    this.app.stage.removeChild(top.container);

    const prev = this._sceneStack[this._sceneStack.length - 1];
    if (prev) { this.app.stage.addChild(prev.container); prev.resume?.(); }
  }

  /** Replace all scenes with a single new scene. */
  replaceScene(scene) {
    while (this._sceneStack.length) {
      const s = this._sceneStack.pop();
      s.stop?.();
      this.app.stage.removeChild(s.container);
    }
    this.pushScene(scene);
  }

  // ── Private ────────────────────────────────────────────────

  _setupResize(container) {
    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.app.renderer.resize(w, h);
      this.app.view.style.width = '100vw';
      this.app.view.style.height = '100vh';
      this.emit('resize', { width: w, height: h });
    };
    resize();
    window.addEventListener('resize', resize);
    this._resizeObserver = resize;
  }

  destroy() {
    if (this._resizeObserver) window.removeEventListener('resize', this._resizeObserver);
    this.assets.destroy();
    this.app.destroy(true, { children: true });
  }
}
