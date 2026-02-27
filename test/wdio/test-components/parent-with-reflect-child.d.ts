import type { Components, JSX } from "../dist/types/components";

interface ParentWithReflectChild extends Components.ParentWithReflectChild, HTMLElement {}
export const ParentWithReflectChild: {
    prototype: ParentWithReflectChild;
    new (): ParentWithReflectChild;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
