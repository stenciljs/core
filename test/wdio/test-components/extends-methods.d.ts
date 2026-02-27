import type { Components, JSX } from "../dist/types/components";

interface ExtendsMethods extends Components.ExtendsMethods, HTMLElement {}
export const ExtendsMethods: {
    prototype: ExtendsMethods;
    new (): ExtendsMethods;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
