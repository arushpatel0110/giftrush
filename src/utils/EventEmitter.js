/**
 * EventEmitter – Lightweight publish/subscribe bus.
 * Every game module extends or composes this class for
 * decoupled inter-module communication.
 */
export class EventEmitter {
  constructor() {
    /** @type {Map<string, Function[]>} */
    this._events = new Map();
  }

  /**
   * Register a listener for an event.
   * @param {string}   event
   * @param {Function} listener
   * @returns {this}
   */
  on(event, listener) {
    if (!this._events.has(event)) this._events.set(event, []);
    this._events.get(event).push(listener);
    return this;
  }

  /**
   * Register a one-time listener.
   * @param {string}   event
   * @param {Function} listener
   * @returns {this}
   */
  once(event, listener) {
    const wrapper = (...args) => {
      listener(...args);
      this.off(event, wrapper);
    };
    wrapper._original = listener;
    return this.on(event, wrapper);
  }

  /**
   * Remove a listener.
   * @param {string}   event
   * @param {Function} listener
   * @returns {this}
   */
  off(event, listener) {
    if (!this._events.has(event)) return this;
    this._events.set(
      event,
      this._events.get(event).filter(
        l => l !== listener && l._original !== listener
      )
    );
    return this;
  }

  /**
   * Emit an event, calling all registered listeners.
   * @param {string} event
   * @param {...*}   args
   * @returns {boolean} true if any listener was called
   */
  emit(event, ...args) {
    if (!this._events.has(event)) return false;
    this._events.get(event).slice().forEach(l => l(...args));
    return true;
  }

  /**
   * Remove all listeners, optionally for a specific event.
   * @param {string} [event]
   * @returns {this}
   */
  removeAllListeners(event) {
    if (event) this._events.delete(event);
    else this._events.clear();
    return this;
  }
}
