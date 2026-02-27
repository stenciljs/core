import type { Components, JSX } from "../dist/types/components";

interface RefAttrOrder extends Components.RefAttrOrder, HTMLElement {}
export const RefAttrOrder: {
    prototype: RefAttrOrder;
    new (): RefAttrOrder;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
