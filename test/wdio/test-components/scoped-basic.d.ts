import type { Components, JSX } from "../dist/types/components";

interface ScopedBasic extends Components.ScopedBasic, HTMLElement {}
export const ScopedBasic: {
    prototype: ScopedBasic;
    new (): ScopedBasic;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
