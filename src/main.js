import { GameEngine } from './engine/GameEngine.js';
import { LoadingScene } from './scenes/LoadingScene.js';
import { StartScene } from './scenes/StartScene.js';
import { GameScene } from './scenes/GameScene.js';
import { AnimationUtils } from './utils/AnimationUtils.js';

/**
 * main.js – Application entry point.
 * Boot sequence:
 *   1. Create GameEngine (PIXI.Application)
 *   2. Mount canvas in #game-container
 *   3. Show LoadingScene while assets generate
 *   4. Show StartScene (startpagelandscape/startpageportrait)
 *   5. Transition to GameScene on "Click to Next" button press
 */
async function boot() {
  const engine = new GameEngine();
  await engine.mount('game-container');

  // ── Loading scene ──────────────────────────────────────────
  const loadingScene = new LoadingScene();
  engine.pushScene(loadingScene);

  // Start asset generation in background
  const assetPromise = engine.assets.generateAll((pct) => {
    loadingScene.setProgress(pct);
  });

  // Timed sequential slot reel locking (G, A, M, I, N, G)
  const slotIds = ['reel-slot-2', 'reel-slot-3', 'reel-slot-4', 'reel-slot-5', 'reel-slot-6', 'reel-slot-7'];
  for (const slotId of slotIds) {
    await AnimationUtils.wait(260);
    const box = document.getElementById(slotId);
    if (box) {
      const spin = box.querySelector('.spin-gif');
      const letter = box.querySelector('.letter-img');
      if (spin) spin.classList.add('hidden-item');
      if (letter) letter.classList.remove('hidden-item');
    }
  }

  // Ensure asset generation finishes completely
  await assetPromise;

  // Hold full "B G A M I N G" logo on screen before transitioning
  await AnimationUtils.wait(500);

  // Hide HTML overlay
  const htmlScreen = document.getElementById('loading-screen');
  if (htmlScreen) {
    htmlScreen.classList.add('hidden');
    setTimeout(() => htmlScreen.remove(), 700);
  }

  // ── Start scene (Intro splash screen) ──────────────────────
  const startScene = new StartScene(engine, () => {
    const gameScene = new GameScene(engine);
    engine.replaceScene(gameScene);
  });
  engine.replaceScene(startScene);
}

boot().catch(err => {
  console.error('Gift Rush boot failed:', err);
  const txt = document.getElementById('loading-text');
  if (txt) txt.textContent = `Error: ${err.message}`;
});
