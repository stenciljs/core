/**
 * A Result wraps up a success state and a failure state, allowing you to
 * return a single type from a function and discriminate between the two
 * possible states in a principled way.
 *
 * Using it could look something like this:
 *
 * ```ts
 * import { result } from '@utils';
 *
 * const mightFail = (input: number): Result<number, string> => {
 *   try {
 *     let value: number = calculateSomethingWithInput(input);
 *     return result.ok(value);
 *   } catch (e) {
 *     return result.err(e.message);
 *   }
 * }
 *
 * const sumResult = mightFail(2);
 *
 * const msg = result.map(sumResult, (sum: number) => `the sum was: ${sum}`);
 * ```
 *
 * A few utility methods are defined in this module, like `map` and `unwrap`,
 * which are (probably obviously) inspired by the correspond methods on
 * `std::result::Result` in Rust.
 */
export type Result<OnSuccess, OnFailure> = Ok<OnSuccess> | Err<OnFailure>;

/**
 * Type for the Ok state of a Result
 */
type Ok<T> = {
  isOk: true;
  isErr: false;
  value: T;
};

/**
 * Type for the Err state of a Result
 */
type Err<T> = {
  isOk: false;
  isErr: true;
  value: T;
};

/**
 * Create an `Ok` given a value. This doesn't do any checking that the value is
 * 'ok-ish' since doing so would make an undue assumption about what is 'ok'.
 * Instead, this trusts the user to determine, at the call site, whether
 * something is `ok()` or `err()`.
 *
 * @param value the value to wrap up in an `Ok`
 * @returns an Ok wrapping the value
 */
export const ok = <T>(value: T): Ok<T> => ({
  isOk: true,
  isErr: false,
  value,
});

/**
 * Create an `Err` given a value.
 *
 * @param value the value to wrap up in an `Err`
 * @returns an Ok wrapping the value
 */
export const err = <T>(value: T): Err<T> => ({
  isOk: false,
  isErr: true,
  value,
});

/**
 * Map across a `Result`.
 *
 * If it's `Ok`, unwraps the value, applies the supplied function, and returns
 * the result, wrapped in `Ok` again. This could involve changing the type of
 * the wrapped value, for instance:
 *
 * ```ts
 * import { result } from "@utils";
 *
 * const myResult: Result<string, string> = result.ok("monads???");
 * const updatedResult = result.map(myResult, wrappedString => (
 *   wrappedString.split("").length
 * ));
 * ```
 *
 * after the `result.map` call the type of `updatedResult` will now be
 * `Result<number, string>`.
 *
 * If it's `Err`, just return the same value.
 *
 * This lets the programmer trigger an action, or transform a value, only if an
 * earlier operation succeeded, short-circuiting instead if an error occurred.
 *
 * @param result a `Result` value which we want to map across
 * @param fn a function for handling the `Ok` case for the `Result`
 * @returns a new `Result`, with the a new wrapped value (if `Ok`) or the
 * same (if `Err)
 */
export function map<T1, T2, E>(result: Result<T1, E>, fn: (t: T1) => Promise<T2>): Promise<Result<T2, E>>;
export function map<T1, T2, E>(result: Result<T1, E>, fn: (t: T1) => T2): Result<T2, E>;
export function map<T1, T2, E>(
  result: Result<T1, E>,
  fn: ((t: T1) => T2) | ((t: T1) => Promise<T2>),
): Promise<Result<T2, E>> | Result<T2, E> {
  if (result.isOk) {
    const val = fn(result.value);
    if (val instanceof Promise) {
      return val.then((newVal) => ok(newVal));
    } else {
      return ok(val);
    }
  }

  if (result.isErr) {
    // unwrapping the error is necessary here for typechecking
    // but you and I both know its type hasn't changed a bit!
    const value = result.value;
    return err(value);
  }

  throw 'should never get here';
}

/**
 * Unwrap a {@link Result}, return the value inside if it is an `Ok` and
 * throw with the wrapped value if it is an `Err`.
 *
 * @throws with the wrapped value if it is an `Err`.
 * @param result a result to peer inside of
 * @returns the wrapped value, if `Ok`
 */
export const unwrap = <T, E>(result: Result<T, E>): T => {
  if (result.isOk) {
    return result.value;
  } else {
    throw result.value;
  }
};

/**
 * Unwrap a {@link Result}, return the value inside if it is an `Err` and
 * throw with the wrapped value if it is an `Ok`.
 *
 * @throws with the wrapped value if it is an `Ok`.
 * @param result a result to peer inside of
 * @returns the wrapped value, if `Err`
 */
export const unwrapErr = <T, E>(result: Result<T, E>): E => {
  if (result.isErr) {
    return result.value;
  } else {
    throw result.value;
  }
};
