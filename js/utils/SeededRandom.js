export class SeededRandom {
  #state;

  constructor(seed) {
    this.restore(seed);
  }

  get state() {
    return this.#state;
  }

  restore(seed) {
    if (!Number.isInteger(seed)) {
      throw new TypeError("seed must be an integer.");
    }

    this.#state = seed >>> 0;
  }

  next() {
    this.#state = (this.#state + 0x6d2b79f5) >>> 0;

    let value = this.#state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);

    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  }

  range(min, max) {
    if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) {
      throw new RangeError("range requires finite values with max above min.");
    }

    return min + this.next() * (max - min);
  }
}
