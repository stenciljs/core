import type { Components, JSX } from "../dist/types/components";

interface SlotParentTagChange extends Components.SlotParentTagChange, HTMLElement {}
export const SlotParentTagChange: {
    prototype: SlotParentTagChange;
    new (): SlotParentTagChange;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
