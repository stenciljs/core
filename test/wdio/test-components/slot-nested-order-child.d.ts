import type { Components, JSX } from "../dist/types/components";

interface SlotNestedOrderChild extends Components.SlotNestedOrderChild, HTMLElement {}
export const SlotNestedOrderChild: {
    prototype: SlotNestedOrderChild;
    new (): SlotNestedOrderChild;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
