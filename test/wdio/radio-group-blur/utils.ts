export const addEventListener = (el: any, eventName: string, callback: any, opts?: any) => {
  if (typeof (window as any) !== 'undefined') {
    const win = window as any;
    const config = win?.Ionic?.config;
    if (config) {
      const ael = config.get('_ael');
      if (ael) {
        return ael(el, eventName, callback, opts);
      } else if (config._ael) {
        return config._ael(el, eventName, callback, opts);
      }
    }
  }

  return el.addEventListener(eventName, callback, opts);
};

export const removeEventListener = (el: any, eventName: string, callback: any, opts?: any) => {
  if (typeof (window as any) !== 'undefined') {
    const win = window as any;
    const config = win?.Ionic?.config;
    if (config) {
      const rel = config.get('_rel');
      if (rel) {
        return rel(el, eventName, callback, opts);
      } else if (config._rel) {
        return config._rel(el, eventName, callback, opts);
      }
    }
  }

  return el.removeEventListener(eventName, callback, opts);
};

type CompareFn = (currentValue: any, compareValue: any) => boolean;

/**
 * Uses the compareWith param to compare two values to determine if they are equal.
 *
 * @param currentValue The current value of the control.
 * @param compareValue The value to compare against.
 * @param compareWith The function or property name to use to compare values.
 * @returns True if the values are equal, false otherwise.
 */
export const compareOptions = (
  currentValue: any,
  compareValue: any,
  compareWith?: string | CompareFn | null,
): boolean => {
  if (typeof compareWith === 'function') {
    return compareWith(currentValue, compareValue);
  } else if (typeof compareWith === 'string') {
    return currentValue[compareWith] === compareValue[compareWith];
  } else {
    return Array.isArray(compareValue) ? compareValue.includes(currentValue) : currentValue === compareValue;
  }
};

/**
 * Compares a value against the current value(s) to determine if it is selected.
 *
 * @param currentValue The current value of the control.
 * @param compareValue The value to compare against.
 * @param compareWith The function or property name to use to compare values.
 * @returns True if the value is selected, false otherwise.
 */
export const isOptionSelected = (
  currentValue: any[] | any,
  compareValue: any,
  compareWith?: string | CompareFn | null,
) => {
  if (currentValue === undefined) {
    return false;
  }
  if (Array.isArray(currentValue)) {
    return currentValue.some((val) => compareOptions(val, compareValue, compareWith));
  } else {
    return compareOptions(currentValue, compareValue, compareWith);
  }
};
