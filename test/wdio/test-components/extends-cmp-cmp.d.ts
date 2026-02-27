import type { Components, JSX } from "../dist/types/components";

interface ExtendsCmpCmp extends Components.ExtendsCmpCmp, HTMLElement {}
export const ExtendsCmpCmp: {
    prototype: ExtendsCmpCmp;
    new (): ExtendsCmpCmp;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
