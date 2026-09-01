/**
 * AudioManager – Procedural sound effects via Web Audio API.
 * No external audio files are needed; all sounds are synthesised.
 */
import bgMusicUrl from '../../snd/bg_music.ogg';
import ambientSfxUrl from '../../snd/ambient_sfx.ogg';
import boxDrop2Url from '../../snd/box_drop2.ogg';
import bigWinIntroUrl from '../../snd/bigwin_intro.ogg';
import bigWinEndUrl from '../../snd/bigwin_end.ogg';
import bigWinCoinsUrl from '../../snd/bigwin_coins.ogg';
import clickUrl from '../../snd/click.ogg';
import spinUrl from '../../snd/spin.ogg';
import waitingBgUrl from '../../snd/waiting_bg.ogg';
import boxPopClickUrl from '../../snd/box_pop_click.ogg';
import boxClickUrl from '../../snd/box_click.ogg';
import boxSecondClickUrl from '../../snd/box_second_click.ogg';
import scatter1Url from '../../snd/scatter1.ogg';
import scatter2Url from '../../snd/scatter2.ogg';
import scatter345Url from '../../snd/scatter3_4_5.ogg';
import reelAnticipationUrl from '../../snd/reel_anticipation1.ogg';
import winHiUrl from '../../snd/win_hi.ogg';

export class AudioManager {
  constructor() {
    this._bgAudio = new Audio(bgMusicUrl);
    this._bgAudio.loop = true;
    this._bgAudio.volume = 0.4;

    this._ambientAudio = new Audio(ambientSfxUrl);
    this._ambientAudio.volume = 0.3;

    this._bigWinIntroAudio = null;
    this._bigWinCoinsAudio = null;
    this._waitingBgAudio = null;
    this._anticipationAudio = null;

    this._muted = false;
    this._musicMuted = false;
    this._soundFxMuted = false;
    this._masterVolume = 1.0;
    this._initialized = false;
    this._ambientTimer = null;
  }

  /** Must be called on first user gesture to unlock Web Audio. */
  init() {
    if (this._initialized) return;
    this._initialized = true;
    this._playBgMusic();
    this._scheduleAmbientSfx();
  }

  _playBgMusic() {
    if (!this._bgAudio) return;
    if (this._muted || this._musicMuted) {
      this._bgAudio.pause();
      return;
    }
    this._bgAudio.play().catch(err => {
      console.warn('Auto-play blocked or audio load error:', err);
    });
  }

  _scheduleAmbientSfx() {
    if (this._ambientTimer) clearTimeout(this._ambientTimer);
    // Play ambient sfx periodically every 12 to 25 seconds
    const delay = 12000 + Math.random() * 13000;
    this._ambientTimer = setTimeout(() => {
      this._playAmbientSfx();
      this._scheduleAmbientSfx();
    }, delay);
  }

  _playAmbientSfx() {
    if (!this._ambientAudio) return;
    if (this._muted || this._soundFxMuted) return;
    try {
      this._ambientAudio.currentTime = 0;
      this._ambientAudio.play().catch(() => {});
    } catch (e) {}
  }

  playBoxDrop() {
    if (this._muted || this._soundFxMuted) return;
    try {
      const snd = new Audio(boxDrop2Url);
      snd.volume = (this._masterVolume || 1.0) * 0.5;
      snd.play().catch(() => {});
    } catch (e) {}
  }

  playBigWinIntro() {
    if (this._muted || this._soundFxMuted) return;
    try {
      this.stopBigWinIntro();
      this._bigWinIntroAudio = new Audio(bigWinIntroUrl);
      this._bigWinIntroAudio.volume = (this._masterVolume || 1.0) * 0.7;
      this._bigWinIntroAudio.play().catch(() => {});
    } catch (e) {}
  }

  stopBigWinIntro() {
    if (this._bigWinIntroAudio) {
      try {
        this._bigWinIntroAudio.pause();
        this._bigWinIntroAudio.currentTime = 0;
      } catch (e) {}
    }
  }

  playBigWinCoins() {
    if (this._muted || this._soundFxMuted) return;
    try {
      this.stopBigWinCoins();
      this._bigWinCoinsAudio = new Audio(bigWinCoinsUrl);
      this._bigWinCoinsAudio.volume = (this._masterVolume || 1.0) * 0.65;
      this._bigWinCoinsAudio.play().catch(() => {});
    } catch (e) {}
  }

  stopBigWinCoins() {
    if (this._bigWinCoinsAudio) {
      try {
        this._bigWinCoinsAudio.pause();
        this._bigWinCoinsAudio.currentTime = 0;
      } catch (e) {}
    }
  }

  playBigWinEnd() {
    if (this._muted || this._soundFxMuted) return;
    try {
      this.stopBigWinIntro();
      this.stopBigWinCoins();
      const snd = new Audio(bigWinEndUrl);
      snd.volume = (this._masterVolume || 1.0) * 0.7;
      snd.play().catch(() => {});
    } catch (e) {}
  }

  playWaitingBg() {
    if (this._muted || this._soundFxMuted) return;
    try {
      this.stopWaitingBg();
      this._waitingBgAudio = new Audio(waitingBgUrl);
      this._waitingBgAudio.loop = true;
      this._waitingBgAudio.volume = (this._masterVolume || 1.0) * 0.6;
      this._waitingBgAudio.play().catch(() => {});
    } catch (e) {}
  }

  stopWaitingBg() {
    if (this._waitingBgAudio) {
      try {
        this._waitingBgAudio.pause();
        this._waitingBgAudio.currentTime = 0;
      } catch (e) {}
    }
  }

  playBoxPopClick() {
    if (this._muted || this._soundFxMuted) return;
    try {
      const snd = new Audio(boxPopClickUrl);
      snd.volume = (this._masterVolume || 1.0) * 0.7;
      snd.play().catch(() => {});
    } catch (e) {}
  }

  playGiftClick() {
    if (this._muted || this._soundFxMuted) return;
    try {
      const snd = new Audio(boxClickUrl);
      snd.volume = (this._masterVolume || 1.0) * 0.7;
      snd.play().catch(() => {});
    } catch (e) {}
  }

  playBoxSecondClick() {
    if (this._muted || this._soundFxMuted) return;
    try {
      const snd = new Audio(boxSecondClickUrl);
      snd.volume = (this._masterVolume || 1.0) * 0.7;
      snd.play().catch(() => {});
    } catch (e) {}
  }

  playScatter(count = 1) {
    if (this._muted || this._soundFxMuted) return;
    try {
      let url = scatter1Url;
      if (count === 2) url = scatter2Url;
      else if (count >= 3) url = scatter345Url;

      const snd = new Audio(url);
      snd.volume = (this._masterVolume || 1.0) * 0.8;
      snd.play().catch(() => {});
    } catch (e) {}
  }

  playAnticipation() {
    if (this._muted || this._soundFxMuted) return;
    try {
      this.stopAnticipation();
      this._anticipationAudio = new Audio(reelAnticipationUrl);
      this._anticipationAudio.loop = true;
      this._anticipationAudio.volume = (this._masterVolume || 1.0) * 0.75;
      this._anticipationAudio.play().catch(() => {});
    } catch (e) {}
  }

  stopAnticipation() {
    if (this._anticipationAudio) {
      try {
        this._anticipationAudio.pause();
        this._anticipationAudio.currentTime = 0;
      } catch (e) {}
    }
  }

  get muted() { return this._muted; }

  toggleMute() {
    this._muted = !this._muted;
    if (this._muted) {
      if (this._bgAudio) this._bgAudio.pause();
      if (this._ambientAudio) this._ambientAudio.pause();
      this.stopWaitingBg();
      this.stopAnticipation();
    } else {
      this._playBgMusic();
    }
    return this._muted;
  }

  setVolume(vol) {
    this._masterVolume = Math.max(0, Math.min(1, vol));
    if (this._bgAudio) {
      this._bgAudio.volume = (this._muted || this._musicMuted) ? 0 : this._masterVolume * 0.4;
    }
    if (this._ambientAudio) {
      this._ambientAudio.volume = (this._muted || this._soundFxMuted) ? 0 : this._masterVolume * 0.3;
    }
  }

  setMusicMuted(muted) {
    this._musicMuted = muted;
    if (muted) {
      if (this._bgAudio) this._bgAudio.pause();
    } else {
      this._playBgMusic();
    }
  }

  setSoundFxMuted(muted) {
    this._soundFxMuted = muted;
    if (muted && this._ambientAudio) {
      this._ambientAudio.pause();
    }
  }

  // ── Public sound triggers (Disabled) ──────────────────────

  playSpin() {}
  playReelStop() {
    if (this._muted || this._soundFxMuted) return;
    try {
      const snd = new Audio(spinUrl);
      snd.volume = (this._masterVolume || 1.0) * 0.6;
      snd.play().catch(() => {});
    } catch (e) {}
  }
  playWin(amount) {
    if (this._muted || this._soundFxMuted) return;
    try {
      const snd = new Audio(winHiUrl);
      snd.volume = (this._masterVolume || 1.0) * 0.75;
      snd.play().catch(() => {});
    } catch (e) {}
  }
  playBonus() {}
  playGiftPick() {}
  playBuyBonus() {}
  playClick() {
    if (this._muted || this._soundFxMuted) return;
    try {
      const snd = new Audio(clickUrl);
      snd.volume = (this._masterVolume || 1.0) * 0.6;
      snd.play().catch(() => {});
    } catch (e) {}
  }
  playNoWin() {}

  // ── Private synthesis helpers ──────────────────────────────

  _ctx_ready() { return false; }

  _noise() {}
  _thump() {}
  _chime() {}
  _smallWin() {}
  _mediumWin() {}
  _bigWin() {}
  _fanfare() {}
  _startMusic() {}
}
