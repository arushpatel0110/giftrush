/**
 * AnimationUtils – Promise-based animation helpers.
 * Works with requestAnimationFrame; does NOT depend on PIXI.
 */
export class AnimationUtils {
  /** Resolve after `ms` milliseconds. */
  static wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Tween a numeric property on any object.
   * @param {object}   target
   * @param {string}   property
   * @param {number}   endValue
   * @param {number}   duration   ms
   * @param {Function} [easingFn] t→t′
   * @returns {Promise<void>}
   */
  static tweenTo(target, property, endValue, duration, easingFn = t => t) {
    return new Promise(resolve => {
      const startValue = target[property];
      const startTime  = performance.now();

      const tick = (now) => {
        const t      = Math.min((now - startTime) / duration, 1);
        const eased  = easingFn(t);
        target[property] = startValue + (endValue - startValue) * eased;
        if (t < 1) requestAnimationFrame(tick);
        else { target[property] = endValue; resolve(); }
      };
      requestAnimationFrame(tick);
    });
  }

  /**
   * Scale-bounce effect on a PIXI DisplayObject.
   * @param {object} container  – needs .scale.x / .scale.y
   * @param {number} [intensity=0.15]
   * @param {number} [duration=400]  ms
   */
  static bounce(container, intensity = 0.15, duration = 400) {
    if (container._baseScaleX === undefined) {
      container._baseScaleX = container.scale.x;
      container._baseScaleY = container.scale.y;
    }
    const ox = container._baseScaleX;
    const oy = container._baseScaleY;
    const start = performance.now();

    return new Promise(resolve => {
      const tick = (now) => {
        const t = Math.min((now - start) / duration, 1);
        const b = Math.sin(t * Math.PI) * intensity * (1 - t);
        container.scale.set(ox * (1 + b), oy * (1 - b * 0.5));
        if (t < 1) requestAnimationFrame(tick);
        else {
          container.scale.set(ox, oy);
          delete container._baseScaleX;
          delete container._baseScaleY;
          resolve();
        }
      };
      requestAnimationFrame(tick);
    });
  }

  /**
   * Random-offset shake on a PIXI DisplayObject.
   * @param {object} container  – needs .x / .y
   * @param {number} [intensity=6]  px
   * @param {number} [duration=500] ms
   */
  static shake(container, intensity = 6, duration = 500) {
    const ox = container.x;
    const oy = container.y;
    const start = performance.now();

    return new Promise(resolve => {
      const tick = (now) => {
        const t = Math.min((now - start) / duration, 1);
        const f = (1 - t) * intensity;
        container.x = ox + (Math.random() - 0.5) * f * 2;
        container.y = oy + (Math.random() - 0.5) * f * 2;
        if (t < 1) requestAnimationFrame(tick);
        else { container.x = ox; container.y = oy; resolve(); }
      };
      requestAnimationFrame(tick);
    });
  }

  /**
   * Tween an alpha value (fade in / fade out).
   * @param {object} container – needs .alpha
   * @param {number} to
   * @param {number} [duration=300] ms
   */
  static fadeTo(container, to, duration = 300) {
    return AnimationUtils.tweenTo(container, 'alpha', to, duration);
  }

  /**
   * Count a numeric display from `from` to `to`.
   * Calls `onUpdate(currentValue)` each frame.
   * @param {number}   from
   * @param {number}   to
   * @param {number}   duration   ms
   * @param {Function} onUpdate
   */
  static countUp(from, to, duration, onUpdate) {
    const start = performance.now();
    return new Promise(resolve => {
      const tick = (now) => {
        const t = Math.min((now - start) / duration, 1);
        onUpdate(from + (to - from) * t);
        if (t < 1) requestAnimationFrame(tick);
        else { onUpdate(to); resolve(); }
      };
      requestAnimationFrame(tick);
    });
  }
}
