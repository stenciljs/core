import type { Components, JSX } from "../dist/types/components";

interface SlotNestedDynamicChild extends Components.SlotNestedDynamicChild, HTMLElement {}
export const SlotNestedDynamicChild: {
    prototype: SlotNestedDynamicChild;
    new (): SlotNestedDynamicChild;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
