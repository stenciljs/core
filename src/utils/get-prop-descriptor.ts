/**
 * Walks up a prototype chain to find a property descriptor.
 * Stops before reaching native DOM prototypes (HTMLElement, etc.) to avoid
 * treating native properties like `hidden` as component-defined getters.
 * @param obj - The object to search on.
 * @param memberName - The name of the member to find.
 * @returns The property descriptor if found, otherwise undefined.
 */
export function getPropertyDescriptor(
  obj: object,
  memberName: string,
  getOnly?: boolean,
): PropertyDescriptor | undefined {
  // Stop before native DOM prototypes to avoid picking up native properties
  const stopAt = typeof HTMLElement !== 'undefined' ? HTMLElement.prototype : null;

  while (obj && obj !== stopAt) {
    const desc = Object.getOwnPropertyDescriptor(obj, memberName);
    if (desc && (!getOnly || desc.get)) return desc;
    obj = Object.getPrototypeOf(obj);
  }
  return undefined;
}
