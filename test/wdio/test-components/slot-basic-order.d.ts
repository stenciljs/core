import type { Components, JSX } from "../dist/types/components";

interface SlotBasicOrder extends Components.SlotBasicOrder, HTMLElement {}
export const SlotBasicOrder: {
    prototype: SlotBasicOrder;
    new (): SlotBasicOrder;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
