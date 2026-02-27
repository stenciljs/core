import type { Components, JSX } from "../dist/types/components";

interface PrefixPropNested extends Components.PrefixPropNested, HTMLElement {}
export const PrefixPropNested: {
    prototype: PrefixPropNested;
    new (): PrefixPropNested;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
