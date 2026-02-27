import type { Components, JSX } from "../dist/types/components";

interface SlotNestedDefaultOrderParent extends Components.SlotNestedDefaultOrderParent, HTMLElement {}
export const SlotNestedDefaultOrderParent: {
    prototype: SlotNestedDefaultOrderParent;
    new (): SlotNestedDefaultOrderParent;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
