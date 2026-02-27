import type { Components, JSX } from "../dist/types/components";

interface SlotNestedDynamicWrapper extends Components.SlotNestedDynamicWrapper, HTMLElement {}
export const SlotNestedDynamicWrapper: {
    prototype: SlotNestedDynamicWrapper;
    new (): SlotNestedDynamicWrapper;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
