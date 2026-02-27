import type { Components, JSX } from "../dist/types/components";

interface PrefixAttrNested extends Components.PrefixAttrNested, HTMLElement {}
export const PrefixAttrNested: {
    prototype: PrefixAttrNested;
    new (): PrefixAttrNested;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
