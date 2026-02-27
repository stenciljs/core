import type { Components, JSX } from "../dist/types/components";

interface SlotForwardChildFallback extends Components.SlotForwardChildFallback, HTMLElement {}
export const SlotForwardChildFallback: {
    prototype: SlotForwardChildFallback;
    new (): SlotForwardChildFallback;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
