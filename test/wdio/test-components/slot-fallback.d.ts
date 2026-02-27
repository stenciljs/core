import type { Components, JSX } from "../dist/types/components";

interface SlotFallback extends Components.SlotFallback, HTMLElement {}
export const SlotFallback: {
    prototype: SlotFallback;
    new (): SlotFallback;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
