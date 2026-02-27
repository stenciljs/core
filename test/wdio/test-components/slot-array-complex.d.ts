import type { Components, JSX } from "../dist/types/components";

interface SlotArrayComplex extends Components.SlotArrayComplex, HTMLElement {}
export const SlotArrayComplex: {
    prototype: SlotArrayComplex;
    new (): SlotArrayComplex;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
