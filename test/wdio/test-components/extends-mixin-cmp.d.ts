import type { Components, JSX } from "../dist/types/components";

interface ExtendsMixinCmp extends Components.ExtendsMixinCmp, HTMLElement {}
export const ExtendsMixinCmp: {
    prototype: ExtendsMixinCmp;
    new (): ExtendsMixinCmp;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
