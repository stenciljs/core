import type { Components, JSX } from "../dist/types/components";

interface PrefixAttrRoot extends Components.PrefixAttrRoot, HTMLElement {}
export const PrefixAttrRoot: {
    prototype: PrefixAttrRoot;
    new (): PrefixAttrRoot;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
