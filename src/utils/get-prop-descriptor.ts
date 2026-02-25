/**
 * Walks up a prototype chain to find a property descriptor.
 * @param obj - The object to search on.
 * @param memberName - The name of the member to find.
 * @returns The property descriptor if found, otherwise undefined.
 */
export function getPropertyDescriptor(obj: object, memberName: string): PropertyDescriptor | undefined {
  while (obj) {
    const desc = Object.getOwnPropertyDescriptor(obj, memberName);
    if (desc) return desc;
    obj = Object.getPrototypeOf(obj);
  }
  return undefined;
}
