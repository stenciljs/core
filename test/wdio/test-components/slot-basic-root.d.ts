import type { Components, JSX } from "../dist/types/components";

interface SlotBasicRoot extends Components.SlotBasicRoot, HTMLElement {}
export const SlotBasicRoot: {
    prototype: SlotBasicRoot;
    new (): SlotBasicRoot;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
