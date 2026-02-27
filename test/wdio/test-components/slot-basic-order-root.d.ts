import type { Components, JSX } from "../dist/types/components";

interface SlotBasicOrderRoot extends Components.SlotBasicOrderRoot, HTMLElement {}
export const SlotBasicOrderRoot: {
    prototype: SlotBasicOrderRoot;
    new (): SlotBasicOrderRoot;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
