import type { Components, JSX } from "../dist/types/components";

interface PrefixPropRoot extends Components.PrefixPropRoot, HTMLElement {}
export const PrefixPropRoot: {
    prototype: PrefixPropRoot;
    new (): PrefixPropRoot;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
