import type { Components, JSX } from "../dist/types/components";

interface ChildTagTransform extends Components.ChildTagTransform, HTMLElement {}
export const ChildTagTransform: {
    prototype: ChildTagTransform;
    new (): ChildTagTransform;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
