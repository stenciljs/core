import type { Components, JSX } from "../dist/types/components";

interface SlotParentTagChangeRoot extends Components.SlotParentTagChangeRoot, HTMLElement {}
export const SlotParentTagChangeRoot: {
    prototype: SlotParentTagChangeRoot;
    new (): SlotParentTagChangeRoot;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
