import type { Components, JSX } from "../dist/types/components";

interface SlotNestedDynamicParent extends Components.SlotNestedDynamicParent, HTMLElement {}
export const SlotNestedDynamicParent: {
    prototype: SlotNestedDynamicParent;
    new (): SlotNestedDynamicParent;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
