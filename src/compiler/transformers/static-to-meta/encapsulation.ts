import ts from 'typescript';

import type * as d from '../../../declarations';
import { getStaticValue } from '../transform-utils';

/**
 * Find and return the type of encapsulation that a component has based on the return value of its static getter of the
 * same name.
 *
 * If no encapsulation static getter is found, or if the found encapsulation getter return value is not an accepted
 * value, 'none' is returned.
 *
 * @param staticMembers a collection of static getters to search
 * @returns the encapsulation mode to use for a component
 */
export const parseStaticEncapsulation = (staticMembers: ts.ClassElement[]): d.Encapsulation => {
  let encapsulation: string = getStaticValue(staticMembers, 'encapsulation');

  if (typeof encapsulation === 'string') {
    encapsulation = encapsulation.toLowerCase().trim();
    if (encapsulation === 'shadow' || encapsulation === 'scoped') {
      return encapsulation;
    }
  }

  return 'none';
};

/**
 * Find and return if `delegatesFocus` is enabled for a component based on the return value of its static getter of the
 * same name.
 *
 * @param encapsulation the encapsulation mode to use for a component
 * @param staticMembers a collection of static getters to search
 * @returns when `encapsulation` is 'shadow', return `true` if the static getter returns true. If the static getter
 * returns `false` or does not exist, return `false`. If `encapsulation` is not 'shadow', return `null`, regardless of
 * the static getter's existence/return value.
 */
export const parseStaticShadowDelegatesFocus = (
  encapsulation: string,
  staticMembers: ts.ClassElement[],
): boolean | null => {
  if (encapsulation === 'shadow') {
    const delegatesFocus: boolean = getStaticValue(staticMembers, 'delegatesFocus');
    return !!delegatesFocus;
  }
  return null;
};
