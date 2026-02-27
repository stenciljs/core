import type { Components, JSX } from "../dist/types/components";

interface SlotForwardRoot extends Components.SlotForwardRoot, HTMLElement {}
export const SlotForwardRoot: {
    prototype: SlotForwardRoot;
    new (): SlotForwardRoot;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
