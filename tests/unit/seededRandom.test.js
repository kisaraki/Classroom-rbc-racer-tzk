import { GAME_CONFIG } from "../../js/config.js";
import { SeededRandom } from "../../js/utils/SeededRandom.js";
import {
  assert,
  assertDeepEqual,
  assertEqual,
  assertThrows
} from "./TestHarness.js";

function take(random, count) {
  return Array.from({ length: count }, () => random.next());
}

export function registerSeededRandomTests(harness) {
  harness.test("identical seeds produce identical sequences", () => {
    const seed = GAME_CONFIG.levels[1].seed;
    const first = new SeededRandom(seed);
    const second = new SeededRandom(seed);

    assertDeepEqual(take(first, 5), take(second, 5));
  });

  harness.test("restoring a seed reproduces its sequence", () => {
    const seed = GAME_CONFIG.levels[4].seed;
    const random = new SeededRandom(seed);
    const expected = take(random, 4);

    random.restore(seed);
    assertDeepEqual(take(random, 4), expected);
  });

  harness.test("seeded values remain inside the unit interval", () => {
    const random = new SeededRandom(GAME_CONFIG.levels[2].seed);
    take(random, 16).forEach((value) => {
      assert(value >= 0 && value < 1);
    });
  });

  harness.test("SeededRandom validates seeds and ranges", () => {
    assertThrows(() => new SeededRandom(1.5), TypeError);

    const random = new SeededRandom(GAME_CONFIG.levels[3].seed);
    assertThrows(() => random.range(2, 2), RangeError);
    assertEqual(random.state, GAME_CONFIG.levels[3].seed >>> 0);
  });
}
