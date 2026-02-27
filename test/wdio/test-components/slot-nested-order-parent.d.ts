import type { Components, JSX } from "../dist/types/components";

interface SlotNestedOrderParent extends Components.SlotNestedOrderParent, HTMLElement {}
export const SlotNestedOrderParent: {
    prototype: SlotNestedOrderParent;
    new (): SlotNestedOrderParent;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
