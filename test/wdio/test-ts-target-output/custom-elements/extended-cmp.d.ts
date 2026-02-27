import type { Components, JSX } from "../../dist/types/components";

interface ExtendedCmp extends Components.ExtendedCmp, HTMLElement {}
export const ExtendedCmp: {
    prototype: ExtendedCmp;
    new (): ExtendedCmp;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
