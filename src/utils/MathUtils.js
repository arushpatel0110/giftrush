/**
 * MathUtils – Static math helpers used throughout the game.
 */
export class MathUtils {
  /** Random integer in [min, max] (inclusive). */
  static randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /** Random float in [min, max). */
  static randomFloat(min, max) {
    return Math.random() * (max - min) + min;
  }

  /** Clamp value between min and max. */
  static clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  /** Linear interpolation. */
  static lerp(a, b, t) {
    return a + (b - a) * t;
  }

  // ── Easing functions (t in [0,1]) ──────────────────────────

  static easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  static easeInCubic(t) {
    return t * t * t;
  }

  static easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  static easeOutBounce(t) {
    const n1 = 7.5625, d1 = 2.75;
    if (t < 1 / d1)        return n1 * t * t;
    if (t < 2 / d1)        return n1 * (t -= 1.5 / d1) * t + 0.75;
    if (t < 2.5 / d1)      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  }

  static easeOutElastic(t) {
    if (t === 0 || t === 1) return t;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
  }

  // ── Weighted random ────────────────────────────────────────

  /**
   * Pick a random index based on an array of weights.
   * @param {number[]} weights
   * @returns {number} index
   */
  static weightedRandom(weights) {
    const total = weights.reduce((s, w) => s + w, 0);
    let r = Math.random() * total;
    for (let i = 0; i < weights.length; i++) {
      r -= weights[i];
      if (r <= 0) return i;
    }
    return weights.length - 1;
  }

  // ── Formatting ─────────────────────────────────────────────

  /** Format a number as a currency string with 2 decimal places. */
  static formatMoney(amount) {
    return amount.toFixed(2);
  }

  /** Fisher-Yates shuffle (returns a new array). */
  static shuffle(array) {
    const a = [...array];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /** Wrap a value within [0, max). */
  static wrap(value, max) {
    return ((value % max) + max) % max;
  }
}
