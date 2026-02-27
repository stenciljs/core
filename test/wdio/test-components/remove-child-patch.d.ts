import type { Components, JSX } from "../dist/types/components";

interface RemoveChildPatch extends Components.RemoveChildPatch, HTMLElement {}
export const RemoveChildPatch: {
    prototype: RemoveChildPatch;
    new (): RemoveChildPatch;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
