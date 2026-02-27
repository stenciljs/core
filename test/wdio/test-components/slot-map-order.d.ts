import type { Components, JSX } from "../dist/types/components";

interface SlotMapOrder extends Components.SlotMapOrder, HTMLElement {}
export const SlotMapOrder: {
    prototype: SlotMapOrder;
    new (): SlotMapOrder;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
