import type { Components, JSX } from "../dist/types/components";

interface SlotDynamicNameChangeShadow extends Components.SlotDynamicNameChangeShadow, HTMLElement {}
export const SlotDynamicNameChangeShadow: {
    prototype: SlotDynamicNameChangeShadow;
    new (): SlotDynamicNameChangeShadow;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
