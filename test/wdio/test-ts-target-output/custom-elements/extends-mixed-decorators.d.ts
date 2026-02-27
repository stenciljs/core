import type { Components, JSX } from "../../dist/types/components";

interface ExtendsMixedDecorators extends Components.ExtendsMixedDecorators, HTMLElement {}
export const ExtendsMixedDecorators: {
    prototype: ExtendsMixedDecorators;
    new (): ExtendsMixedDecorators;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
