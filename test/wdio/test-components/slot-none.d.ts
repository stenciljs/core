import type { Components, JSX } from "../dist/types/components";

interface SlotNone extends Components.SlotNone, HTMLElement {}
export const SlotNone: {
    prototype: SlotNone;
    new (): SlotNone;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
