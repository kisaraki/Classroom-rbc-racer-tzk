export class AssertionError extends Error {
  constructor(message) {
    super(message);
    this.name = "AssertionError";
  }
}

function formatValue(value) {
  if (typeof value === "string") {
    return '"' + value + '"';
  }

  return JSON.stringify(value);
}

export function assert(condition, message = "Expected condition to be true.") {
  if (!condition) {
    throw new AssertionError(message);
  }
}

export function assertEqual(actual, expected, message = "") {
  if (!Object.is(actual, expected)) {
    const detail =
      "Expected " + formatValue(expected) + ", received " + formatValue(actual);
    throw new AssertionError(message ? message + " " + detail : detail);
  }
}

export function assertApproximately(
  actual,
  expected,
  tolerance,
  message = ""
) {
  if (
    !Number.isFinite(actual) ||
    Math.abs(actual - expected) > tolerance
  ) {
    const detail =
      "Expected " +
      formatValue(expected) +
      " +/- " +
      formatValue(tolerance) +
      ", received " +
      formatValue(actual);
    throw new AssertionError(message ? message + " " + detail : detail);
  }
}

export function assertDeepEqual(actual, expected, message = "") {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);

  if (actualJson !== expectedJson) {
    const detail =
      "Expected " + expectedJson + ", received " + actualJson;
    throw new AssertionError(message ? message + " " + detail : detail);
  }
}

export function assertThrows(callback, ExpectedError = Error) {
  try {
    callback();
  } catch (error) {
    if (error instanceof ExpectedError) {
      return error;
    }

    throw new AssertionError(
      "Expected " + ExpectedError.name + ", received " + error.constructor.name
    );
  }

  throw new AssertionError("Expected callback to throw " + ExpectedError.name);
}

export class TestHarness {
  #tests = [];

  test(name, callback) {
    this.#tests.push({ name, callback });
  }

  async run() {
    const results = [];

    for (const testCase of this.#tests) {
      const startedAt = performance.now();

      try {
        await testCase.callback();
        results.push({
          name: testCase.name,
          status: "PASS",
          durationMs: performance.now() - startedAt
        });
      } catch (error) {
        results.push({
          name: testCase.name,
          status: "FAIL",
          durationMs: performance.now() - startedAt,
          error
        });
      }
    }

    const passed = results.filter((result) => result.status === "PASS").length;
    const failed = results.length - passed;

    return {
      total: results.length,
      passed,
      failed,
      status: failed === 0 ? "PASS" : "FAIL",
      results
    };
  }
}
