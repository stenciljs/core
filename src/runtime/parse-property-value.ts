import { BUILD } from '@app-data';
import { deserializeProperty, isComplexType, MEMBER_FLAGS, SERIALIZED_PREFIX } from '@utils';

/**
 * Parse a new property value for a given property type.
 *
 * While the prop value can reasonably be expected to be of `any` type as far as TypeScript's type checker is concerned,
 * it is not safe to assume that the string returned by evaluating `typeof propValue` matches:
 *   1. `any`, the type given to `propValue` in the function signature
 *   2. the type stored from `propType`.
 *
 * This function provides the capability to parse/coerce a property's value to potentially any other JavaScript type.
 *
 * Property values represented in TSX preserve their type information. In the example below, the number 0 is passed to
 * a component. This `propValue` will preserve its type information (`typeof propValue === 'number'`). Note that is
 * based on the type of the value being passed in, not the type declared of the class member decorated with `@Prop`.
 * ```tsx
 * <my-cmp prop-val={0}></my-cmp>
 * ```
 *
 * HTML prop values on the other hand, will always a string
 *
 * @param propValue the new value to coerce to some type
 * @param propType the type of the prop, expressed as a binary number
 * @param isFormAssociated whether the component is form-associated (optional)
 * @returns the parsed/coerced value
 */
export const parsePropertyValue = (propValue: unknown, propType: number, isFormAssociated?: boolean): any => {
  /**
   * Allow hydrate parameters that contain a complex non-serialized values.
   * This is SSR-specific and should only run during hydration.
   */
  if (
    (BUILD.hydrateClientSide || BUILD.hydrateServerSide) &&
    typeof propValue === 'string' &&
    propValue.startsWith(SERIALIZED_PREFIX)
  ) {
    propValue = deserializeProperty(propValue);
    return propValue;
  }

  if (propValue != null && !isComplexType(propValue)) {
    /**
     * ensure this value is of the correct prop type
     */
    if (BUILD.propBoolean && propType & MEMBER_FLAGS.Boolean) {
      /**
       * For form-associated components, according to HTML spec, the presence of any boolean attribute
       * (regardless of its value, even "false") should make the property true.
       * For non-form-associated components, we maintain the legacy behavior where "false" becomes false.
       */
      if (BUILD.formAssociated && isFormAssociated && typeof propValue === 'string') {
        // For form-associated components, any string attribute value (including "false") means true
        return propValue === '' || !!propValue;
      } else {
        // Legacy behavior: string "false" becomes boolean false
        return propValue === 'false' ? false : propValue === '' || !!propValue;
      }
    }

    /**
     * force it to be a number
     */
    if (BUILD.propNumber && propType & MEMBER_FLAGS.Number) {
      return typeof propValue === 'string' ? parseFloat(propValue) : typeof propValue === 'number' ? propValue : NaN;
    }

    /**
     * could have been passed as a number or boolean but we still want it as a string
     */
    if (BUILD.propString && propType & MEMBER_FLAGS.String) {
      return String(propValue);
    }

    return propValue;
  }

  /**
   * not sure exactly what type we want so no need to change to a different type
   */
  return propValue;
};
