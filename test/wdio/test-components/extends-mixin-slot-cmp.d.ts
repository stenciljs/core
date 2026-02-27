import type { Components, JSX } from "../dist/types/components";

interface ExtendsMixinSlotCmp extends Components.ExtendsMixinSlotCmp, HTMLElement {}
export const ExtendsMixinSlotCmp: {
    prototype: ExtendsMixinSlotCmp;
    new (): ExtendsMixinSlotCmp;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
