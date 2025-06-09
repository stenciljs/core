export const isDef = (v: any) => v != null && v !== undefined;

/**
 * Convert a string from PascalCase to dash-case
 *
 * @param str the string to convert
 * @returns a converted string
 */
export const toDashCase = (str: string): string =>
  str
    .replace(/([A-Z0-9])/g, (match) => ` ${match[0]}`)
    .trim()
    .split(' ')
    .join('-')
    .toLowerCase();

/**
 * Convert a string from dash-case / kebab-case to PascalCase (or CamelCase,
 * or whatever you call it!)
 *
 * @param str a string to convert
 * @returns a converted string
 */
export const dashToPascalCase = (str: string): string =>
  str
    .toLowerCase()
    .split('-')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join('');

/**
 * Convert a string to 'camelCase'
 *
 * @param str the string to convert
 * @returns the converted string
 */
export const toCamelCase = (str: string) => {
  const pascalCase = dashToPascalCase(str);
  return pascalCase.charAt(0).toLowerCase() + pascalCase.slice(1);
};

/**
 * Capitalize the first letter of a string
 *
 * @param str the string to capitalize
 * @returns a capitalized string
 */
export const toTitleCase = (str: string): string => str.charAt(0).toUpperCase() + str.slice(1);

/**
 * This is just a no-op, don't expect it to do anything.
 */
export const noop = (): any => {
  /* noop*/
};

/**
 * Check whether a value is a 'complex type', defined here as an object or a
 * function.
 *
 * @param o the value to check
 * @returns whether it's a complex type or not
 */
export const isComplexType = (o: unknown): boolean => {
  // https://jsperf.com/typeof-fn-object/5
  o = typeof o;
  return o === 'object' || o === 'function';
};

/**
 * Sort an array without mutating it in-place (as `Array.prototype.sort`
 * unfortunately does)
 *
 * @param array the array you'd like to sort
 * @param prop a function for deriving sortable values (strings or numbers)
 * from array members
 * @returns a new array of all items `x` in `array` ordered by `prop(x)`
 */
export const sortBy = <T>(array: T[], prop: (item: T) => string | number): T[] => {
  return array.slice().sort((a, b) => {
    const nameA = prop(a);
    const nameB = prop(b);
    if (nameA < nameB) return -1;
    if (nameA > nameB) return 1;
    return 0;
  });
};

/**
 * A polyfill of sorts for `Array.prototype.flat` which will return the result
 * of calling that method if present and, if not, return an equivalent based on
 * `Array.prototype.reduce`.
 *
 * @param array the array to flatten (one level)
 * @returns a flattened array
 */
export const flatOne = <T>(array: T[][]): T[] => {
  if (array.flat) {
    return array.flat(1);
  }
  return array.reduce((result, item) => {
    result.push(...item);
    return result;
  }, [] as T[]);
};

/**
 * Deduplicate an array, retaining items at the earliest position in which
 * they appear.
 *
 * So `unique([1,3,2,1,1,4])` would be `[1,3,2,4]`.
 *
 * @param array the array to deduplicate
 * @param predicate an optional function used to generate the key used to
 * determine uniqueness
 * @returns a new, deduplicated array
 */
export const unique = <T, K>(array: T[], predicate: (item: T) => K = (i) => i as any): T[] => {
  const set = new Set();
  return array.filter((item) => {
    const key = predicate(item);
    if (key == null) {
      return true;
    }
    if (set.has(key)) {
      return false;
    }
    set.add(key);
    return true;
  });
};

/**
 * Merge elements of an array into an existing array, using a predicate to
 * determine uniqueness and only adding elements when they are not present in
 * the first array.
 *
 * **Note**: this mutates the target array! This is intentional to avoid
 * unnecessary array allocation, but be sure that it's what you want!
 *
 * @param target the target array, to which new unique items should be added
 * @param newItems a list of new items, some (or all!) of which may be added
 * @param mergeWith a predicate function which reduces the items in `target`
 * and `newItems` to a value which can be equated with `===` for the purposes
 * of determining uniqueness
 */
export function mergeIntoWith<T1, T2>(target: T1[], newItems: T1[], mergeWith: (item: T1) => T2) {
  for (const item of newItems) {
    const maybeItem = target.find((existingItem) => mergeWith(existingItem) === mergeWith(item));
    if (!maybeItem) {
      // this is a new item that isn't present in `target` yet
      target.push(item);
    }
  }
}

/**
 * A utility for building an object from an iterable very similar to
 * `Object.fromEntries`
 *
 * @param entries an iterable object holding entries (key-value tuples) to
 * plop into a new object
 * @returns an object containing those entries
 */
export const fromEntries = <V>(entries: IterableIterator<[string, V]>) => {
  const object: Record<string, V> = {};
  for (const [key, value] of entries) {
    object[key] = value;
  }
  return object;
};

/**
 * Based on a given object, create a new object which has only the specified
 * key-value pairs included in it.
 *
 * @param obj the object from which to take values
 * @param keys a set of keys to take
 * @returns an object mapping `key` to `obj[key]` if `obj[key]` is truthy for
 * every `key` in `keys`
 */
export const pluck = (obj: { [key: string]: any }, keys: string[]) => {
  return keys.reduce(
    (final, key) => {
      if (obj[key]) {
        final[key] = obj[key];
      }
      return final;
    },
    {} as { [key: string]: any },
  );
};

const isDefined = (v: any): v is NonNullable<typeof v> => v !== null && v !== undefined;
export const isBoolean = (v: any): v is boolean => typeof v === 'boolean';
export const isFunction = (v: any): v is Function => typeof v === 'function';
export const isNumber = (v: any): v is number => typeof v === 'number';
export const isObject = (val: Object): val is Object =>
  val != null && typeof val === 'object' && Array.isArray(val) === false;
export const isString = (v: any): v is string => typeof v === 'string';
export const isIterable = <T>(v: any): v is Iterable<T> => isDefined(v) && isFunction(v[Symbol.iterator]);
