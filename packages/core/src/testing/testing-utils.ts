import { InMemoryFileSystem } from "src/compiler/sys/in-memory-fs";
import { afterAll, Mock, vi } from "vitest";

/**
 * Shuffle an array using Fisher-Yates algorithm
 * http://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
 */
export function shuffleArray(array: any[]) {
  let currentIndex = array.length;
  let temporaryValue: any;
  let randomIndex: number;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

/**
 * Utility for silencing `console` functions in tests.
 *
 * When this function is first called it grabs a reference to the `log`,
 * `error`, and `warn` functions on `console` and then returns a per-test setup
 * function which sets up a fresh set of mocks (via `jest.fn()`) and then
 * assigns them to each of these functions. This setup function will return a
 * reference to each of the three mock functions so tests can make assertions
 * about their calls and so on.
 *
 * Because references to the original `.log`, `.error`, and `.warn` functions
 * exist in closure within the function, it can use an `afterAll` call to clean
 * up after itself and ensure that the original implementations are restored
 * after the test suite finishes.
 *
 * An example of using this to silence log statements in a single test could look
 * like this:
 *
 * ```ts
 * describe("my-test-suite", () => {
 *   const { setupConsoleMocks, teardownConsoleMocks } = setupConsoleMocker()
 *
 *   it("should log a message", () => {
 *     const { logMock } = setupConsoleMocks();
 *     myFunctionWhichLogs(foo, bar);
 *     expect(logMock).toBeCalledWith('my log message');
 *     teardownConsoleMocks();
 *   })
 * })
 * ```
 *
 * @returns a per-test mock setup function
 */
export function setupConsoleMocker(): ConsoleMocker {
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;

  /**
   * Function to tear down console mocks where you're done with them! Ideally
   * this would be called right after the assertion you're looking to make in
   * your test.
   */
  function teardownConsoleMocks() {
    console.log = originalLog;
    console.warn = originalWarn;
    console.error = originalError;
  }

  // this is insurance!
  afterAll(() => {
    teardownConsoleMocks();
  });

  function setupConsoleMocks() {
    const logMock = vi.fn();
    const warnMock = vi.fn();
    const errorMock = vi.fn();

    console.log = logMock;
    console.warn = warnMock;
    console.error = errorMock;

    return {
      logMock,
      warnMock,
      errorMock,
    };
  }
  return { setupConsoleMocks, teardownConsoleMocks };
}

interface ConsoleMocker {
  setupConsoleMocks: () => {
    logMock: Mock<typeof console.log>;
    warnMock: Mock<typeof console.warn>;
    errorMock: Mock<typeof console.error>;
  };
  teardownConsoleMocks: () => void;
}

/**
 * the callback that `withSilentWarn` expects to receive. Basically receives a mock
 * as its argument and returns a `Promise`, the value of which is returned by `withSilentWarn`
 * as well.
 */
type SilentWarnFunc<T> = (mock: Mock<typeof console.warn>) => Promise<T>;

/**
 * Wrap a single callback with a silent `console.warn`. The callback passed in
 * receives the mocking function as an argument, so you can easily make assertions
 * that it is called if necessary.
 *
 * @param cb a callback which `withSilentWarn` will call after replacing `console.warn`
 * with a mock.
 * @returns a Promise wrapping the return value of the callback
 */
export async function withSilentWarn<T>(cb: SilentWarnFunc<T>): Promise<T> {
  const realWarn = console.warn;
  const warnMock = vi.fn();
  console.warn = warnMock;
  const retVal = await cb(warnMock);
  console.warn = realWarn;
  return retVal;
}

/**
 * Testing utility to validate the existence of some provided file paths using a specific file system
 *
 * @param fs the file system to use to validate the existence of some files
 * @param filePaths the paths to validate
 * @throws when one or more of the provided file paths cannot be found
 */
export function expectFilesExist(fs: InMemoryFileSystem, filePaths: string[]): void {
  const notFoundFiles: ReadonlyArray<string> = filePaths.filter((filePath: string) => !fs.statSync(filePath).exists);

  if (notFoundFiles.length > 0) {
    throw new Error(
      `The following files were expected, but could not be found:\n${notFoundFiles
        .map((result: string) => '-' + result)
        .join('\n')}`,
    );
  }
}

/**
 * Testing utility to validate the non-existence of some provided file paths using a specific file system
 *
 * @param fs the file system to use to validate the non-existence of some files
 * @param filePaths the paths to validate
 * @throws when one or more of the provided file paths is found
 */
export function expectFilesDoNotExist(fs: InMemoryFileSystem, filePaths: string[]): void {
  const existentFiles: ReadonlyArray<string> = filePaths.filter((filePath: string) => fs.statSync(filePath).exists);

  if (existentFiles.length > 0) {
    throw new Error(
      `The following files were expected to not exist, but do:\n${existentFiles
        .map((result: string) => '-' + result)
        .join('\n')}`,
    );
  }
}