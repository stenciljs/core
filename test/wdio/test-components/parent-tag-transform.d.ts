import type { Components, JSX } from "../dist/types/components";

interface ParentTagTransform extends Components.ParentTagTransform, HTMLElement {}
export const ParentTagTransform: {
    prototype: ParentTagTransform;
    new (): ParentTagTransform;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
