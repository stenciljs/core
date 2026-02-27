import type { Components, JSX } from "../dist/types/components";

interface ScopedBasicRoot extends Components.ScopedBasicRoot, HTMLElement {}
export const ScopedBasicRoot: {
    prototype: ScopedBasicRoot;
    new (): ScopedBasicRoot;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
