import type { Components, JSX } from "../dist/types/components";

interface SlotArrayTop extends Components.SlotArrayTop, HTMLElement {}
export const SlotArrayTop: {
    prototype: SlotArrayTop;
    new (): SlotArrayTop;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
