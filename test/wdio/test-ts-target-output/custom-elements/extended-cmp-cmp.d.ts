import type { Components, JSX } from "../../dist/types/components";

interface ExtendedCmpCmp extends Components.ExtendedCmpCmp, HTMLElement {}
export const ExtendedCmpCmp: {
    prototype: ExtendedCmpCmp;
    new (): ExtendedCmpCmp;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
