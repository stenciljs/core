import type { Components, JSX } from "../dist/types/components";

interface SlotReplaceWrapper extends Components.SlotReplaceWrapper, HTMLElement {}
export const SlotReplaceWrapper: {
    prototype: SlotReplaceWrapper;
    new (): SlotReplaceWrapper;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
