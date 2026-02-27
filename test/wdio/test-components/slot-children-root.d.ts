import type { Components, JSX } from "../dist/types/components";

interface SlotChildrenRoot extends Components.SlotChildrenRoot, HTMLElement {}
export const SlotChildrenRoot: {
    prototype: SlotChildrenRoot;
    new (): SlotChildrenRoot;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
