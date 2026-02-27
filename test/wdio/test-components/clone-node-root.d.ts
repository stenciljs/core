import type { Components, JSX } from "../dist/types/components";

interface CloneNodeRoot extends Components.CloneNodeRoot, HTMLElement {}
export const CloneNodeRoot: {
    prototype: CloneNodeRoot;
    new (): CloneNodeRoot;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
