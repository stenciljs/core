import type { Components, JSX } from "../dist/types/components";

interface SlotFallbackRoot extends Components.SlotFallbackRoot, HTMLElement {}
export const SlotFallbackRoot: {
    prototype: SlotFallbackRoot;
    new (): SlotFallbackRoot;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
