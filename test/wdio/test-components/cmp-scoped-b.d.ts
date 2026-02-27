import type { Components, JSX } from "../dist/types/components";

interface CmpScopedB extends Components.CmpScopedB, HTMLElement {}
export const CmpScopedB: {
    prototype: CmpScopedB;
    new (): CmpScopedB;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
